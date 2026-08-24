// Muestra/oculta el campo de texto cuando se selecciona "Otro" en transportadora
function toggleCarrierOther(selectId, inputId) {
    const sel = document.getElementById(selectId);
    const inp = document.getElementById(inputId);
    if (!sel || !inp) return;
    const isOther = sel.value === 'Otro';
    inp.style.display = isOther ? 'block' : 'none';
    inp.required = isOther;
    if (!isOther) inp.value = '';
}

// Devuelve el valor real de transportadora (texto libre si eligió "Otro")
function resolveCarrier(selectId, inputId) {
    const sel = document.getElementById(selectId);
    const inp = document.getElementById(inputId);
    if (sel && sel.value === 'Otro' && inp) {
        const custom = inp.value.trim();
        if (!custom) { inp.setCustomValidity('Ingresa el nombre de la transportadora.'); inp.reportValidity(); return null; }
        inp.setCustomValidity('');
        return custom;
    }
    return sel ? sel.value : '';
}

// Muestra popup informativo al seleccionar tipo de envío en Miami
function showShippingTypeInfo(type) {
    if (!type) return;

    const SHIPPING_INFO = {
        'Persona Natural': {
            title: 'Casillero Persona Natural',
            color: '#6366f1',
            icon: '🏠',
            items: [
                'Máximo <strong>6 artículos de la misma referencia</strong> por envío.',
                'Peso total del paquete <strong>menor a 110 libras (50 kg)</strong>.',
                'Ninguna arista (lado) del paquete puede superar <strong>150 cm</strong>.',
                'El valor total de los artículos <strong>no debe superar los $2,000 USD</strong>.',
            ],
            note: 'Ideal para compras personales y uso doméstico.'
        },
        'Corporativo': {
            title: 'Casillero Corporativo',
            color: '#f97316',
            icon: '🏢',
            items: [
                'Diseñado para <strong>emprendedores y comerciantes</strong>.',
                'Permite <strong>consolidación de mercancía</strong> de múltiples proveedores.',
                '<strong>Sin límite de peso ni dimensiones</strong>.',
                'Tarifa especial: <strong>mínimo 10 libras a $8 USD por libra</strong>.',
                'Sin aplicación de IVA ni arancel adicional.',
            ],
            note: 'Ideal para negocios, reventas y compras al por mayor.'
        }
    };

    const info = SHIPPING_INFO[type];
    if (!info) return;

    const titleEl = document.getElementById('msti-title');
    const bodyEl  = document.getElementById('msti-body');
    if (!titleEl || !bodyEl) return;

    titleEl.innerHTML = `${info.icon} ${info.title}`;

    const itemsHtml = info.items.map(i =>
        `<li style="margin-bottom:0.5rem; line-height:1.5;">${i}</li>`
    ).join('');

    bodyEl.innerHTML = `
        <div style="border-left:4px solid ${info.color}; padding:0.75rem 1rem; background:var(--bg-app); border-radius:0 8px 8px 0; margin-bottom:1rem;">
            <p style="font-size:0.85rem; font-weight:600; color:${info.color}; margin-bottom:0.5rem;">Condiciones del servicio</p>
            <ul style="margin:0; padding-left:1.25rem; font-size:0.85rem; color:var(--text-primary);">
                ${itemsHtml}
            </ul>
        </div>
        <p style="font-size:0.8rem; color:var(--text-muted); text-align:center;">${info.note}</p>
    `;

    // Compatibilidad: funciona tanto para admin (app) como para cliente (clientApp)
    const appObj = typeof app !== 'undefined' ? app : (typeof clientApp !== 'undefined' ? clientApp : null);
    if (appObj) appObj.openModal('modal-shipping-type-info');
}

// Formatea un valor USD a COP usando la TRM configurada
function fmtCOP(usdVal) {
    const trm = (state && state.settings && state.settings.trm) || 4000;
    return `$${Math.round(usdVal * trm).toLocaleString('es-CO')} COP`;
}

// ── EMAILJS: Notificaciones por correo ──────────────────────────────────────
// Crea tu cuenta en https://www.emailjs.com y completa estos tres valores.
// Ver instrucciones en: README del proyecto.
const EMAILJS_SERVICE_ID  = 'TU_SERVICE_ID';   // ej: 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'TU_TEMPLATE_ID';  // ej: 'template_xyz789'
const EMAILJS_PUBLIC_KEY  = 'TU_PUBLIC_KEY';   // ej: 'aBcDeFgHiJkLmNoP'

const FIXED_NOTIFICATION_EMAILS = 'info@yotraigo.com,administrativo@yotraigo.com,gerencia@yotraigo.com';

async function sendStatusNotification(req, newStatus) {
    if (!window.emailjs || EMAILJS_PUBLIC_KEY === 'TU_PUBLIC_KEY') return;

    const clientUser = (state.users || []).find(u => u.lockerCode === req.lockerCode);
    const clientEmail = clientUser ? clientUser.email : '';
    const toEmails = clientEmail
        ? `${clientEmail},${FIXED_NOTIFICATION_EMAILS}`
        : FIXED_NOTIFICATION_EMAILS;

    const statusMessages = {
        'Pendiente':  'Tu solicitud está pendiente de revisión.',
        'En Proceso': 'Tu solicitud está siendo procesada por nuestro equipo.',
        'Completado': 'Tu solicitud ha sido completada exitosamente.',
        'Cancelado':  'Tu solicitud ha sido cancelada. Contáctanos para más información.'
    };

    try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_emails:    toEmails,
            client_name:  req.clientName,
            locker_code:  req.lockerCode,
            product_name: req.productName,
            store:        req.store || '',
            status:       newStatus,
            status_msg:   statusMessages[newStatus] || '',
            date:         new Date().toLocaleDateString('es-CO', { dateStyle: 'long' })
        }, EMAILJS_PUBLIC_KEY);
        console.log('Notificación enviada a:', toEmails);
    } catch (err) {
        console.warn('Error enviando notificación:', err);
    }
}

// CONFIGURACIÓN DE CONEXIÓN CON SUPABASE
// Reemplaza los siguientes valores con la URL y la Clave Anónima de tu proyecto de Supabase.
// Si dejas estos valores por defecto, la aplicación funcionará automáticamente en MODO DE PRUEBA LOCAL (usando LocalStorage).
const SUPABASE_URL = "https://uuaglghhsxbzhvbjzgky.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1YWdsZ2hoc3hiemh2Ymp6Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDMxOTgsImV4cCI6MjA5Njc3OTE5OH0.WI317E3WbMLHcS8hFDYnIH8TjCjkL09G55lt3Qd7X6k";

let useSupabase = false;
let supabaseClient = null;

// Validar si el usuario ya configuró sus credenciales de Supabase
if (SUPABASE_URL !== "PON_AQUI_TU_SUPABASE_URL" && SUPABASE_KEY !== "PON_AQUI_TU_SUPABASE_ANON_KEY" && typeof supabase !== 'undefined') {
    useSupabase = true;
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Datos por defecto para modo local (sin Supabase)
const DEFAULT_USER_TYPES = [
    { id: 'cliente',       label: 'Cliente',           description: 'Cliente regular del servicio de casillero', active: true },
    { id: 'emprendedor',   label: 'Emprendedor',        description: 'Plan para emprendedores con tarifas preferenciales', active: true },
    { id: 'aliado',        label: 'Aliado Comercial',   description: 'Aliado o revendedor del servicio', active: true },
    { id: 'administrador', label: 'Administrador',      description: 'Acceso total al panel de administración', active: true }
];
const DEFAULT_TARIFFS = [
    { id: 'tf_c1', user_type_id: 'cliente',       concept: 'Precio por libra',  value: 4.50,  unit: 'USD/lb', description: 'Tarifa estándar' },
    { id: 'tf_c2', user_type_id: 'cliente',       concept: 'Mínimo de libras',  value: 1.0,   unit: 'lbs',   description: 'Peso mínimo cobrable' },
    { id: 'tf_c3', user_type_id: 'cliente',       concept: 'Seguro',            value: 2.0,   unit: '%',     description: 'Sobre valor declarado' },
    { id: 'tf_c4', user_type_id: 'cliente',       concept: 'Costo de manejo',   value: 3.00,  unit: 'USD',   description: 'Cargo fijo por gestión' },
    { id: 'tf_e1', user_type_id: 'emprendedor',   concept: 'Precio por libra',  value: 3.80,  unit: 'USD/lb', description: 'Tarifa preferencial' },
    { id: 'tf_e2', user_type_id: 'emprendedor',   concept: 'Mínimo de libras',  value: 10.0,  unit: 'lbs',   description: 'Peso mínimo cobrable' },
    { id: 'tf_e3', user_type_id: 'emprendedor',   concept: 'Seguro',            value: 1.5,   unit: '%',     description: 'Sobre valor declarado' },
    { id: 'tf_e4', user_type_id: 'emprendedor',   concept: 'Costo de manejo',   value: 0.00,  unit: 'USD',   description: 'Sin cargo de manejo' },
    { id: 'tf_a1', user_type_id: 'aliado',        concept: 'Precio por libra',  value: 3.50,  unit: 'USD/lb', description: 'Tarifa especial aliado' },
    { id: 'tf_a2', user_type_id: 'aliado',        concept: 'Mínimo de libras',  value: 10.0,  unit: 'lbs',   description: 'Peso mínimo cobrable' },
    { id: 'tf_a3', user_type_id: 'aliado',        concept: 'Seguro',            value: 1.0,   unit: '%',     description: 'Sobre valor declarado' },
    { id: 'tf_a4', user_type_id: 'aliado',        concept: 'Costo de manejo',   value: 0.00,  unit: 'USD',   description: 'Sin cargo de manejo' }
];

// Core Application State
let state = {
    users: [],
    prealerts: [],
    packages: [],
    purchaseRequests: [],
    userTypes: [],
    tariffs: [],
    settings: {
        baseRatePerLb: 4.50,
        handlingFee: 3.00,
        insurancePercent: 2.0,
        fuelSurchargePercent: 5.0,
        vatThresholdUsd: 200,
        vatPercent: 19,
        trm: 4000,
        cotizFletePrimeraLb: 5,
        cotizFleteAdicionalLb: 3.50,
        cotizIvaPercent: 19,
        cotizArancelPercent: 10,
        cotizSeguroPercent: 2,
        cotizDomicilioUsd: 4,
        cotizServicioCompraPercent: 5,
        cotizCorpLbUsd: 8,
        cotizCorpMinLbs: 10
    }
};

// Seed Data for initial load
const SEED_USERS = [
    { id: "usr_1", name: "Carlos Mario Restrepo", email: "carlos.restrepo@gmail.com", phone: "+57 312 456 7890", doc: "1017283948", city: "Medellín", address: "Calle 10 # 43C - 12 Apto 402", lockerCode: "PK-5012-US", dateCreated: "2026-05-15" },
    { id: "usr_2", name: "Diana Carolina Gómez", email: "diana.gomez@hotmail.com", phone: "+57 320 987 6543", doc: "52839405", city: "Bogotá", address: "Carrera 15 # 85 - 20 Torres del Parque", lockerCode: "PK-5013-US", dateCreated: "2026-05-18" },
    { id: "usr_3", name: "Andrés Felipe Novoa", email: "andres.novoa@yahoo.com", phone: "+57 315 222 3344", doc: "1032485930", city: "Cali", address: "Avenida 6 Norte # 23 - 45", lockerCode: "PK-5014-US", dateCreated: "2026-05-20" },
    { id: "usr_4", name: "María Camila Velez", email: "camila.velez@outlook.com", phone: "+57 310 555 4433", doc: "1040392817", city: "Barranquilla", address: "Calle 79 # 51B - 88", lockerCode: "PK-5015-US", dateCreated: "2026-05-22" }
];

const SEED_PREALERTS = [
    { id: "pre_1", lockerCode: "PK-5012-US", tracking: "1Z999AA10123049581", carrier: "UPS", value: 120.00, description: "Zapatos Nike Air Max", invoiceName: "factura_nike_120.pdf", status: "Recibido", dateCreated: "2026-05-25" },
    { id: "pre_2", lockerCode: "PK-5013-US", tracking: "USPS94001112023948590", carrier: "USPS", value: 45.50, description: "Libro De Cocina Francesa y Taza", invoiceName: "amazon_receipt.pdf", status: "Pendiente", dateCreated: "2026-06-01" },
    { id: "pre_3", lockerCode: "PK-5012-US", tracking: "TBA882940294029", carrier: "Amazon Log", value: 249.99, description: "Auriculares Inalámbricos Sony WH1000XM4", invoiceName: "amazon_wh.pdf", status: "Recibido", dateCreated: "2026-06-02" },
    { id: "pre_4", lockerCode: "PK-5015-US", tracking: "774920492049", carrier: "FedEx", value: 89.90, description: "Vestido de baño y Ropa de Playa", invoiceName: "shein_invoice.pdf", status: "Pendiente", dateCreated: "2026-06-08" }
];

const SEED_PACKAGES = [
    {
        id: "pkg_1",
        tracking: "1Z999AA10123049581",
        lockerCode: "PK-5012-US",
        carrier: "UPS",
        weightLbs: 3.5,
        widthIn: 12,
        heightIn: 8,
        lengthIn: 10,
        value: 120.00,
        description: "Zapatos Nike Air Max",
        status: "Listo para Entrega",
        dateReceived: "2026-05-28",
        invoiceStatus: "Pendiente"
    },
    {
        id: "pkg_2",
        tracking: "TBA882940294029",
        lockerCode: "PK-5012-US",
        carrier: "Amazon Log",
        weightLbs: 1.2,
        widthIn: 9,
        heightIn: 3,
        lengthIn: 9,
        value: 249.99,
        description: "Auriculares Inalámbricos Sony WH1000XM4",
        status: "En Bodega Miami",
        dateReceived: "2026-06-05",
        invoiceStatus: "Pendiente"
    },
    {
        id: "pkg_3",
        tracking: "1Z555EE80234509123",
        lockerCode: "PK-5014-US",
        carrier: "UPS",
        weightLbs: 12.0,
        widthIn: 16,
        heightIn: 16,
        lengthIn: 16,
        value: 180.00,
        description: "Monitor Portátil de 15 pulgadas y Cables (Sin Prealerta)",
        status: "En Tránsito a Colombia",
        dateReceived: "2026-06-03",
        invoiceStatus: "Pagado"
    }
];

// Helper: Save State (Soporte local)
function saveStateLocal() {
    localStorage.setItem('pakki_locker_state', JSON.stringify(state));
}

// Helper: Load State (Soporte local y remoto)
async function loadState() {
    if (useSupabase) {
        try {
            // 1. Obtener usuarios
            const { data: users, error: errUsers } = await supabaseClient.from('users').select('*');
            if (errUsers) throw errUsers;

            // 2. Obtener prealertas
            const { data: prealerts, error: errPrealerts } = await supabaseClient.from('prealerts').select('*');
            if (errPrealerts) throw errPrealerts;

            // 3. Obtener paquetes
            const { data: packages, error: errPackages } = await supabaseClient.from('packages').select('*');
            if (errPackages) throw errPackages;

            // 4. Obtener configuraciones de lógica
            const { data: settings, error: errSettings } = await supabaseClient.from('settings').select('*');
            if (errSettings) throw errSettings;

            // 5. Obtener solicitudes de compra
            const { data: purchaseRequests } = await supabaseClient.from('purchase_requests').select('*');

            // 6. Obtener tipos de usuario y tarifas
            const { data: userTypes } = await supabaseClient.from('user_types').select('*').order('label');
            const { data: tariffs }   = await supabaseClient.from('tariffs').select('*');

            state.users = users || [];
            state.prealerts = prealerts || [];
            state.packages = packages || [];
            state.purchaseRequests = purchaseRequests || [];
            state.userTypes = userTypes && userTypes.length ? userTypes : DEFAULT_USER_TYPES;
            state.tariffs   = tariffs   || [];
            
            if (settings && settings.length > 0) {
                state.settings = settings.find(s => s.id === 'global') || settings[0];
            }

            // Sembrar datos de ejemplo en Supabase si está totalmente vacía
            if (state.users.length === 0) {
                console.log("Sembrando datos iniciales en Supabase...");
                await supabaseClient.from('users').insert(SEED_USERS);
                await supabaseClient.from('prealerts').insert(SEED_PREALERTS);
                await supabaseClient.from('packages').insert(SEED_PACKAGES);
                
                // Recargar
                const { data: rUsers } = await supabaseClient.from('users').select('*');
                const { data: rPre } = await supabaseClient.from('prealerts').select('*');
                const { data: rPkg } = await supabaseClient.from('packages').select('*');
                state.users = rUsers || [];
                state.prealerts = rPre || [];
                state.packages = rPkg || [];
            }
        } catch (error) {
            console.error("Error cargando datos desde Supabase:", error.message);
            // Fallback a local si hay un error de conexión
            useSupabase = false;
            await loadState();
        }
    } else {
        // Carga de base de datos LocalStorage
        const saved = localStorage.getItem('pakki_locker_state');
        if (saved) {
            state = JSON.parse(saved);
            if (!state.purchaseRequests) state.purchaseRequests = [];
            if (!state.userTypes || !state.userTypes.length) state.userTypes = DEFAULT_USER_TYPES;
            if (!state.tariffs) state.tariffs = DEFAULT_TARIFFS;
        } else {
            state.users = SEED_USERS;
            state.prealerts = SEED_PREALERTS;
            state.packages = SEED_PACKAGES;
            state.userTypes = DEFAULT_USER_TYPES;
            state.tariffs = DEFAULT_TARIFFS;
            saveStateLocal();
        }
    }
}

// Estado de ordenamiento y paginación de la tabla de casilleros
let lockersSort       = { col: 'name', dir: 'asc' };
let lockersPagination = { page: 1, perPage: 10 };

// Estado de ordenamiento y paginación de la tabla de prealertas
let prealartsSort       = { col: 'dateCreated', dir: 'desc' };
let prealertsPagination = { page: 1, perPage: 10 };

// Core Controller Object
const app = {
    init: async function() {
        await loadState();
        this.setupNavigation();
        this.setupEventListeners();
        this.renderAll();
        
        // Show banner about Supabase status
        this.renderSupabaseStatusBanner();

        // Show current date formatted
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('current-date').textContent = new Date().toLocaleDateString('es-ES', options);

        // Load official TRM
        loadTRM('trm-display');
    },

    renderSupabaseStatusBanner: function() {
        const container = document.getElementById('alerts-container');
        const banner = document.createElement('div');
        banner.className = 'alert';
        if (useSupabase) {
            banner.className += ' alert-success';
            banner.innerHTML = `<strong>Nube Conectada:</strong> Sistema sincronizado con la base de datos de Supabase en tiempo real.`;
        } else {
            banner.className += ' alert-info';
            banner.innerHTML = `<strong>Modo de Prueba Local:</strong> Los datos se guardan en el navegador. Configura las variables <code>SUPABASE_URL</code> y <code>SUPABASE_KEY</code> en la primera línea de <code>script.js</code> para conectar tu base de datos de Supabase.`;
        }
        container.insertBefore(banner, container.firstChild);
    },

    // Navigation Tabs logic
    setupNavigation: function() {
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const tabId = item.getAttribute('data-tab');
                this.switchTab(tabId);
            });
        });
    },

    switchTab: async function(tabId) {
        // Toggle Sidebar active status
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        const activeMenuItem = document.querySelector(`.menu-item[data-tab="${tabId}"]`);
        if (activeMenuItem) activeMenuItem.classList.add('active');

        // Toggle Tab Panel
        document.querySelectorAll('.tab-content').forEach(panel => panel.classList.remove('active'));
        const targetPanel = document.getElementById(tabId);
        if (targetPanel) {
            targetPanel.classList.add('active');
            
            // Custom titles and description based on tab
            const headerTitle = document.getElementById('page-title');
            const headerSub = document.getElementById('page-subtitle');
            
            if (tabId === 'tab-dashboard') {
                headerTitle.textContent = "Resumen del Sistema";
                headerSub.textContent = "Panel de operaciones y métricas generales del casillero.";
            } else if (tabId === 'tab-usuarios') {
                headerTitle.textContent = "Registrar Clientes";
                headerSub.textContent = "Agrega nuevos clientes y crea sus casilleros virtuales en segundos.";
            } else if (tabId === 'tab-casillero-list') {
                headerTitle.textContent = "Listado de Casilleros";
                headerSub.textContent = "Visualiza y administra todos los casilleros asignados.";
            } else if (tabId === 'tab-prealertas') {
                headerTitle.textContent = "Gestión de Prealertas";
                headerSub.textContent = "Prealertas cargadas por los usuarios para avisar la llegada de compras.";
            } else if (tabId === 'tab-bodega') {
                headerTitle.textContent = "Bodega de Miami (Recepción)";
                headerSub.textContent = "Check-in de paquetes recibidos, peso, medidas e historial de estado.";
                this.renderPendingPrealertsList();
            } else if (tabId === 'tab-prefacturacion') {
                headerTitle.textContent = "Prefacturación y Lógica";
                headerSub.textContent = "Liquidaciones automáticas de fletes e impuestos e ingresos de caja.";
            } else if (tabId === 'tab-purchase-requests') {
                headerTitle.textContent = "Compramos por Ti";
                headerSub.textContent = "Solicitudes de compra enviadas por los clientes desde el portal.";
            } else if (tabId === 'tab-cotizador') {
                headerTitle.textContent = "Cotizador de Envíos";
                headerSub.textContent = "Genera cotizaciones estimadas de costos de importación por casillero.";
            } else if (tabId === 'tab-tipos-usuario') {
                headerTitle.textContent = "Tipos de Usuario";
                headerSub.textContent = "Administra los tipos de cuenta disponibles y sus características.";
            } else if (tabId === 'tab-tarifas') {
                headerTitle.textContent = "Tarifas por Tipo de Usuario";
                headerSub.textContent = "Configura las tarifas aplicadas a cada tipo de cliente. Los cambios aplican en futuros cálculos.";
            }

            // Re-sync and Re-render specifically selected tab tables to ensure current calculations
            await loadState();
            this.renderAll();
        }
    },

    // Event Listeners for Forms and interactions
    setupEventListeners: function() {
        // Register User Form
        document.getElementById('form-register-user').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegisterUser();
        });

        // Register Prealert Form
        document.getElementById('form-register-prealert').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegisterPrealert();
        });

        // (check-in now handled via modal — form-checkin-modal uses onsubmit inline)

        // Edit Config Logic Form
        document.getElementById('form-config-logic').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaveConfig();
        });

        // Live Search Filters
        document.getElementById('search-lockers').addEventListener('input', (e) => {
            lockersPagination.page = 1;
            this.renderLockersList(e.target.value.trim());
        });

        document.getElementById('search-packages').addEventListener('input', (e) => {
            this.renderPackagesList();
        });

        document.getElementById('filter-packages-status').addEventListener('change', () => {
            this.renderPackagesList();
        });

        document.getElementById('filter-prealert-status').addEventListener('change', () => {
            prealertsPagination.page = 1;
            this.renderPrealertsList();
        });

        document.getElementById('search-prealerts').addEventListener('input', () => {
            prealertsPagination.page = 1;
            this.renderPrealertsList();
        });

        // Status update modal submit
        document.getElementById('form-update-status').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleUpdateStatusSubmit();
        });

        // Cotizador config form
        document.getElementById('form-cotizador-config').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaveCotizadorConfig();
        });

        // Filter purchase requests by status
        document.getElementById('filter-pr-status').addEventListener('change', () => {
            this.renderPurchaseRequestsList();
        });

        // Tipos de usuario form
        document.getElementById('form-user-type').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaveUserType();
        });

        // Tarifas form
        document.getElementById('form-tariff').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaveTariff();
        });
    },

    // Show dynamic notification alerts
    showAlert: function(message, type = 'success') {
        const container = document.getElementById('alerts-container');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>${message}</span>
            <button style="margin-left: auto; background:none; border:none; cursor:pointer; font-weight:bold; color:inherit;" onclick="this.parentElement.remove()">&times;</button>
        `;
        container.appendChild(alert);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.5s ease';
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    },

    // BUSINESS LOGIC: Calculate Invoicing details for a package
    calculatePackageInvoicing: function(pkg) {
        const s = state.settings;

        const volWeight = parseFloat(((pkg.lengthIn * pkg.widthIn * pkg.heightIn) / 166).toFixed(2));
        const chargeableWeight = parseFloat(Math.max(pkg.weightLbs, volWeight).toFixed(2));

        // Base auto-calculations
        const freightCalc   = chargeableWeight * s.baseRatePerLb;
        const insuranceCalc = pkg.value * (s.insurancePercent / 100);
        const fuelCalc      = freightCalc * (s.fuelSurchargePercent / 100);
        const taxCalc       = pkg.value > s.vatThresholdUsd ? (pkg.value * (s.vatPercent / 100)) : 0;
        const handlingCalc  = s.handlingFee;

        // Use override if explicitly saved on the package, otherwise use auto-calc
        const freight  = pkg.freightOverride  != null ? pkg.freightOverride  : parseFloat(freightCalc.toFixed(2));
        const insurance= pkg.insuranceOverride!= null ? pkg.insuranceOverride: parseFloat(insuranceCalc.toFixed(2));
        const fuel     = pkg.fuelOverride     != null ? pkg.fuelOverride     : parseFloat(fuelCalc.toFixed(2));
        const tax      = pkg.taxOverride      != null ? pkg.taxOverride      : parseFloat(taxCalc.toFixed(2));
        const handling = pkg.handlingOverride != null ? pkg.handlingOverride : parseFloat(handlingCalc.toFixed(2));

        const grandTotal = freight + insurance + fuel + tax + handling;

        return {
            volWeight, chargeableWeight,
            freight:   parseFloat(freight.toFixed(2)),
            insurance: parseFloat(insurance.toFixed(2)),
            fuel:      parseFloat(fuel.toFixed(2)),
            tax:       parseFloat(tax.toFixed(2)),
            handling:  parseFloat(handling.toFixed(2)),
            total:     parseFloat(grandTotal.toFixed(2)),
            // expose auto-calcs so the UI can show "calculated" placeholders
            freightCalc:   parseFloat(freightCalc.toFixed(2)),
            insuranceCalc: parseFloat(insuranceCalc.toFixed(2)),
            fuelCalc:      parseFloat(fuelCalc.toFixed(2)),
            taxCalc:       parseFloat(taxCalc.toFixed(2)),
            handlingCalc:  parseFloat(handlingCalc.toFixed(2))
        };
    },

    // ─── TIPOS DE USUARIO ────────────────────────────────────────────────────
    renderUserTypeSelect: function() {
        const sel = document.getElementById('user-type');
        if (!sel) return;
        const current = sel.value;
        sel.innerHTML = '';
        const types = state.userTypes.length ? state.userTypes : DEFAULT_USER_TYPES;
        types.filter(t => t.active !== false).forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.label;
            if (t.id === current || (!current && t.id === 'cliente')) opt.selected = true;
            sel.appendChild(opt);
        });
    },

    renderUserTypesList: function() {
        const tbody = document.getElementById('table-user-types-body');
        if (!tbody) return;
        tbody.innerHTML = '';
        const types = state.userTypes.length ? state.userTypes : DEFAULT_USER_TYPES;
        if (!types.length) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No hay tipos configurados.</td></tr>`;
            return;
        }
        types.forEach(t => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><code style="background:var(--bg-app); padding:2px 8px; border-radius:4px; font-size:0.85rem;">${t.id}</code></td>
                <td><strong>${t.label}</strong></td>
                <td style="color:var(--text-muted); font-size:0.85rem;">${t.description || '—'}</td>
                <td><span class="badge ${t.active !== false ? 'badge-success' : 'badge-secondary'}">${t.active !== false ? 'Sí' : 'No'}</span></td>
                <td style="white-space:nowrap;">
                    <button class="btn btn-secondary btn-sm" onclick="app.editUserType('${t.id}')">Editar</button>
                    <button class="btn btn-sm" style="background:#fee2e2; color:#991b1b; margin-left:4px;" onclick="app.deleteUserType('${t.id}')">Eliminar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    handleSaveUserType: async function() {
        const editId = document.getElementById('ut-edit-id').value.trim();
        const id = document.getElementById('ut-id').value.trim().toLowerCase().replace(/\s+/g, '-');
        const label = document.getElementById('ut-label').value.trim();
        const description = document.getElementById('ut-desc').value.trim();
        if (!id || !label) return;
        const record = { id, label, description, active: true };
        if (useSupabase) {
            try {
                if (editId) {
                    const { error } = await supabaseClient.from('user_types').update({ label, description }).eq('id', editId);
                    if (error) throw error;
                } else {
                    const { error } = await supabaseClient.from('user_types').insert([record]);
                    if (error) throw error;
                }
            } catch (err) { this.showAlert(`Error: ${err.message}`, 'danger'); return; }
        } else {
            if (editId) {
                const idx = state.userTypes.findIndex(t => t.id === editId);
                if (idx >= 0) state.userTypes[idx] = { ...state.userTypes[idx], label, description };
            } else {
                if (state.userTypes.find(t => t.id === id)) { this.showAlert('Ya existe un tipo con ese ID.', 'warning'); return; }
                state.userTypes.push(record);
            }
            saveStateLocal();
        }
        await loadState();
        this.renderUserTypesList();
        this.renderUserTypeSelect();
        this.renderTariffTypeFilterSelect();
        this.resetUserTypeForm();
        this.showAlert(`Tipo "${label}" guardado exitosamente.`, 'success');
    },

    editUserType: function(id) {
        const t = (state.userTypes.length ? state.userTypes : DEFAULT_USER_TYPES).find(t => t.id === id);
        if (!t) return;
        document.getElementById('ut-edit-id').value = t.id;
        document.getElementById('ut-id').value = t.id;
        document.getElementById('ut-id').disabled = true;
        document.getElementById('ut-label').value = t.label;
        document.getElementById('ut-desc').value = t.description || '';
        document.getElementById('btn-ut-submit').textContent = 'Actualizar Tipo';
        document.getElementById('tab-tipos-usuario').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    resetUserTypeForm: function() {
        document.getElementById('form-user-type').reset();
        document.getElementById('ut-edit-id').value = '';
        document.getElementById('ut-id').disabled = false;
        document.getElementById('btn-ut-submit').textContent = 'Guardar Tipo';
    },

    deleteUserType: async function(id) {
        if (!confirm(`¿Eliminar el tipo "${id}"? Se eliminarán también sus tarifas asociadas.`)) return;
        if (useSupabase) {
            const { error } = await supabaseClient.from('user_types').delete().eq('id', id);
            if (error) { this.showAlert(`Error: ${error.message}`, 'danger'); return; }
        } else {
            state.userTypes = state.userTypes.filter(t => t.id !== id);
            state.tariffs   = state.tariffs.filter(t => t.user_type_id !== id);
            saveStateLocal();
        }
        await loadState();
        this.renderUserTypesList();
        this.renderUserTypeSelect();
        this.renderTariffTypeFilterSelect();
        this.showAlert('Tipo de usuario eliminado.', 'success');
    },

    // ─── TARIFAS ─────────────────────────────────────────────────────────────
    renderTariffTypeFilterSelect: function() {
        const sel = document.getElementById('tariff-type-filter');
        if (!sel) return;
        const current = sel.value;
        sel.innerHTML = '<option value="">-- Selecciona tipo --</option>';
        const types = state.userTypes.length ? state.userTypes : DEFAULT_USER_TYPES;
        types.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.id;
            opt.textContent = t.label;
            if (t.id === current) opt.selected = true;
            sel.appendChild(opt);
        });
    },

    renderTariffsList: function() {
        const container = document.getElementById('tariffs-list-container');
        if (!container) return;
        const typeId = document.getElementById('tariff-type-filter').value;
        if (!typeId) {
            container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:2rem;">Selecciona un tipo de usuario para ver sus tarifas.</p>`;
            return;
        }
        const tariffs = state.tariffs.filter(t => t.user_type_id === typeId);
        const typeName = (state.userTypes.find(t => t.id === typeId) || {}).label || typeId;
        if (!tariffs.length) {
            container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:2rem;">No hay tarifas para <strong>${typeName}</strong>. Usa el formulario para agregar la primera.</p>`;
            return;
        }
        container.innerHTML = `
            <div style="margin-bottom:0.75rem; font-size:0.85rem; color:var(--text-muted);">
                Tarifas para: <strong style="color:var(--primary);">${typeName}</strong>
            </div>
            <div class="table-container">
                <table>
                    <thead><tr><th>Concepto</th><th style="text-align:right;">Valor</th><th>Unidad</th><th>Descripción</th><th>Acciones</th></tr></thead>
                    <tbody>
                        ${tariffs.map(t => `
                            <tr>
                                <td><strong>${t.concept}</strong></td>
                                <td style="text-align:right; font-weight:600; color:var(--primary);">${parseFloat(t.value).toLocaleString('es-CO', {minimumFractionDigits: 2, maximumFractionDigits: 4})}</td>
                                <td><code style="background:var(--bg-app); padding:2px 6px; border-radius:4px; font-size:0.8rem;">${t.unit || '—'}</code></td>
                                <td style="color:var(--text-muted); font-size:0.85rem;">${t.description || '—'}</td>
                                <td style="white-space:nowrap;">
                                    <button class="btn btn-secondary btn-sm" onclick="app.editTariff('${t.id}')">Editar</button>
                                    <button class="btn btn-sm" style="background:#fee2e2; color:#991b1b; margin-left:4px;" onclick="app.deleteTariff('${t.id}')">Eliminar</button>
                                </td>
                            </tr>`).join('')}
                    </tbody>
                </table>
            </div>`;
    },

    handleSaveTariff: async function() {
        const editId    = document.getElementById('tf-edit-id').value.trim();
        const userTypeId= document.getElementById('tariff-type-filter').value;
        const concept   = document.getElementById('tf-concept').value.trim();
        const value     = parseFloat(document.getElementById('tf-value').value);
        const unit      = document.getElementById('tf-unit').value.trim();
        const description = document.getElementById('tf-desc').value.trim();
        if (!userTypeId) { this.showAlert('Selecciona un tipo de usuario primero.', 'warning'); return; }
        if (!concept || isNaN(value)) { this.showAlert('Completa el concepto y el valor.', 'warning'); return; }
        if (useSupabase) {
            try {
                if (editId) {
                    const { error } = await supabaseClient.from('tariffs').update({ concept, value, unit, description }).eq('id', editId);
                    if (error) throw error;
                } else {
                    const { error } = await supabaseClient.from('tariffs').insert([{ user_type_id: userTypeId, concept, value, unit, description }]);
                    if (error) throw error;
                }
            } catch (err) { this.showAlert(`Error: ${err.message}`, 'danger'); return; }
        } else {
            if (editId) {
                const idx = state.tariffs.findIndex(t => t.id === editId);
                if (idx >= 0) state.tariffs[idx] = { ...state.tariffs[idx], concept, value, unit, description };
            } else {
                state.tariffs.push({ id: `tf_${Date.now()}`, user_type_id: userTypeId, concept, value, unit, description });
            }
            saveStateLocal();
        }
        await loadState();
        this.renderTariffsList();
        this.resetTariffForm();
        this.showAlert(`Tarifa "${concept}" guardada.`, 'success');
    },

    editTariff: function(id) {
        const t = state.tariffs.find(t => t.id === id);
        if (!t) return;
        document.getElementById('tf-edit-id').value    = t.id;
        document.getElementById('tariff-type-filter').value = t.user_type_id;
        document.getElementById('tf-concept').value   = t.concept;
        document.getElementById('tf-value').value     = t.value;
        document.getElementById('tf-unit').value      = t.unit || '';
        document.getElementById('tf-desc').value      = t.description || '';
        document.getElementById('btn-tf-submit').textContent = 'Actualizar Tarifa';
        this.renderTariffsList();
    },

    resetTariffForm: function() {
        document.getElementById('form-tariff').reset();
        document.getElementById('tf-edit-id').value = '';
        document.getElementById('btn-tf-submit').textContent = 'Guardar Tarifa';
    },

    deleteTariff: async function(id) {
        if (!confirm('¿Eliminar esta tarifa?')) return;
        if (useSupabase) {
            const { error } = await supabaseClient.from('tariffs').delete().eq('id', id);
            if (error) { this.showAlert(`Error: ${error.message}`, 'danger'); return; }
        } else {
            state.tariffs = state.tariffs.filter(t => t.id !== id);
            saveStateLocal();
        }
        await loadState();
        this.renderTariffsList();
        this.showAlert('Tarifa eliminada.', 'success');
    },

    // RENDER FUNCTIONS
    renderAll: function() {
        this.renderMetrics();
        this.renderDashboardRecent();
        this.renderUserDropdowns();
        this.renderLockersList();
        this.renderPrealertsList();
        this.renderPackagesList();
        this.renderPendingPrealertsList();
        this.renderBillingList();
        this.renderConfigInputs();
        this.renderCotizadorConfig();
        this.renderPurchaseRequestsList();
        this.renderUserTypeSelect();
        this.renderTariffTypeFilterSelect();
    },

    renderMetrics: function() {
        // Active lockers count
        document.getElementById('metric-lockers').textContent = state.users.length;
        
        // Pending prealerts count
        const pendingPrealerts = state.prealerts.filter(p => p.status === 'Pendiente').length;
        document.getElementById('metric-prealerts').textContent = pendingPrealerts;
        
        // Packages in warehouse count
        const whPackages = state.packages.filter(p => p.status === 'En Bodega Miami').length;
        document.getElementById('metric-packages').textContent = whPackages;
        
        // Monthly Revenue Calculation (sum of paid invoices + projected pending)
        let totalRevenue = 0;
        state.packages.forEach(pkg => {
            const pricing = this.calculatePackageInvoicing(pkg);
            totalRevenue += pricing.total;
        });
        
        const revenueUsd = totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const trm = state.settings.trm || 4000;
        const revenueCop = Math.round(totalRevenue * trm).toLocaleString('es-CO');
        document.getElementById('metric-revenue').innerHTML = `$${revenueUsd} USD<br><small style="font-size:0.7em; opacity:0.75; font-weight:500;">≈ $${revenueCop} COP</small>`;
    },

    openRevenueChart: function() {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth(); // 0-indexed
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const monthName = now.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

        // Build per-day buckets
        const countByDay = Array(daysInMonth).fill(0);
        const revenueByDay = Array(daysInMonth).fill(0);

        state.packages.forEach(pkg => {
            const d = new Date(pkg.dateReceived + 'T00:00:00');
            if (d.getFullYear() === year && d.getMonth() === month) {
                const dayIdx = d.getDate() - 1;
                countByDay[dayIdx]++;
                revenueByDay[dayIdx] += this.calculatePackageInvoicing(pkg).total;
            }
        });

        const totalPkgs = countByDay.reduce((a, b) => a + b, 0);
        const totalRev = revenueByDay.reduce((a, b) => a + b, 0);
        const peakDay = countByDay.indexOf(Math.max(...countByDay)) + 1;
        const labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);

        document.getElementById('revenue-chart-title').textContent = `Ingresos de ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`;
        document.getElementById('chart-stat-pkgs').textContent = totalPkgs;
        document.getElementById('chart-stat-revenue').textContent = `$${totalRev.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
        document.getElementById('chart-stat-peak').textContent = totalPkgs > 0 ? `Día ${peakDay}` : '—';

        this.openModal('modal-revenue-chart');

        // Destroy previous chart instance if exists
        if (this._revenueChart) { this._revenueChart.destroy(); this._revenueChart = null; }

        const ctx = document.getElementById('revenue-chart-canvas').getContext('2d');
        this._revenueChart = new Chart(ctx, {
            data: {
                labels,
                datasets: [
                    {
                        type: 'bar',
                        label: 'Paquetes recibidos',
                        data: countByDay,
                        backgroundColor: 'rgba(99,102,241,0.75)',
                        borderRadius: 4,
                        yAxisID: 'yCount',
                        order: 2
                    },
                    {
                        type: 'line',
                        label: 'Valor facturado (USD)',
                        data: revenueByDay,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16,185,129,0.1)',
                        borderWidth: 2.5,
                        pointRadius: 4,
                        pointBackgroundColor: '#10b981',
                        fill: true,
                        tension: 0.35,
                        yAxisID: 'yRevenue',
                        order: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: ctx => ctx.dataset.label.includes('USD')
                                ? ` $${ctx.raw.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD`
                                : ` ${ctx.raw} paquete${ctx.raw !== 1 ? 's' : ''}`
                        }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 11 } } },
                    yCount: {
                        type: 'linear',
                        position: 'left',
                        title: { display: true, text: 'Paquetes', font: { size: 11 } },
                        ticks: { stepSize: 1, precision: 0 },
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    yRevenue: {
                        type: 'linear',
                        position: 'right',
                        title: { display: true, text: 'USD', font: { size: 11 } },
                        ticks: { callback: v => `$${v}` },
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    },

    renderDashboardRecent: function() {
        const tbody = document.getElementById('dashboard-recent-packages');
        tbody.innerHTML = '';
        
        // Get last 5 received packages sorted by most recent
        const sortedPackages = [...state.packages].reverse().slice(0, 5);
        
        if (sortedPackages.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No hay paquetes registrados en bodega.</td></tr>`;
            return;
        }
        
        sortedPackages.forEach(pkg => {
            let badgeClass = 'badge-neutral';
            if (pkg.status === 'En Bodega Miami') badgeClass = 'badge-warning';
            if (pkg.status === 'En Tránsito a Colombia') badgeClass = 'badge-info';
            if (pkg.status === 'Listo para Entrega') badgeClass = 'badge-success';
            if (pkg.status === 'Entregado') badgeClass = 'badge-success';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pkg.dateReceived}</td>
                <td><strong style="color:var(--primary);">${pkg.lockerCode}</strong></td>
                <td>${pkg.tracking}</td>
                <td>${pkg.weightLbs} lbs</td>
                <td><span class="badge ${badgeClass}">${pkg.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderUserDropdowns: function() {
        this.initLockerAutocomplete();
    },

    initLockerAutocomplete: function() {
        const searchInput = document.getElementById('prealert-locker-search');
        const hiddenInput = document.getElementById('prealert-locker');
        const dropdown    = document.getElementById('prealert-locker-dropdown');
        const clearBtn    = document.getElementById('prealert-locker-clear');
        if (!searchInput) return;

        const markSelected = (selected) => {
            if (selected) {
                searchInput.style.borderColor = 'var(--success)';
                if (clearBtn) clearBtn.style.display = 'block';
            } else {
                searchInput.style.borderColor = '';
                if (clearBtn) clearBtn.style.display = 'none';
            }
        };

        const showResults = (query) => {
            dropdown.innerHTML = '';
            const q = query.toLowerCase().trim();
            if (!q) { dropdown.style.display = 'none'; return; }

            const results = state.users.filter(u =>
                (u.active !== false) && (
                    (u.name       || '').toLowerCase().includes(q) ||
                    (u.doc        || '').toLowerCase().includes(q) ||
                    (u.lockerCode || '').toLowerCase().includes(q) ||
                    (u.email      || '').toLowerCase().includes(q)
                )
            ).slice(0, 10);

            if (!results.length) {
                dropdown.innerHTML = `<div style="padding:0.7rem 1rem; color:var(--text-muted); font-size:0.85rem;">Sin resultados para "<strong>${query}</strong>"</div>`;
                dropdown.style.display = 'block';
                return;
            }

            const highlight = (text, q) => {
                if (!text) return '—';
                const idx = text.toLowerCase().indexOf(q);
                if (idx === -1) return text;
                return text.slice(0, idx) + `<mark style="background:#fef08a; border-radius:2px; padding:0 1px;">${text.slice(idx, idx + q.length)}</mark>` + text.slice(idx + q.length);
            };

            results.forEach(u => {
                const item = document.createElement('div');
                item.style.cssText = 'padding:0.6rem 1rem; cursor:pointer; border-bottom:1px solid var(--border-color); transition:background 0.1s;';
                item.innerHTML = `
                    <div style="display:flex; align-items:center; gap:0.6rem;">
                        <span style="font-weight:700; color:var(--primary); font-size:0.88rem; white-space:nowrap;">${highlight(u.lockerCode, q)}</span>
                        <span style="font-size:0.88rem; color:var(--text-main); font-weight:600;">${highlight(u.name, q)}</span>
                    </div>
                    <div style="font-size:0.78rem; color:var(--text-muted); margin-top:2px;">
                        ${u.doc ? 'Doc: ' + highlight(u.doc, q) + ' &nbsp;·&nbsp; ' : ''}${u.city || ''}
                    </div>`;
                item.addEventListener('mouseover', () => item.style.background = '#f1f5f9');
                item.addEventListener('mouseout',  () => item.style.background = '');
                item.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    searchInput.value = `${u.lockerCode} — ${u.name}`;
                    hiddenInput.value = u.lockerCode;
                    dropdown.style.display = 'none';
                    markSelected(true);
                });
                dropdown.appendChild(item);
            });

            const lastItem = dropdown.lastElementChild;
            if (lastItem) lastItem.style.borderBottom = 'none';
            dropdown.style.display = 'block';
        };

        // Evitar listeners duplicados al reinicializar
        if (searchInput._autocompleteReady) return;
        searchInput._autocompleteReady = true;

        searchInput.addEventListener('input', (e) => {
            hiddenInput.value = '';
            markSelected(false);
            showResults(e.target.value);
        });

        searchInput.addEventListener('focus', () => {
            if (searchInput.value && !hiddenInput.value) showResults(searchInput.value);
        });

        searchInput.addEventListener('blur', () => {
            setTimeout(() => { dropdown.style.display = 'none'; }, 180);
        });
    },

    clearLockerSearch: function() {
        const s = document.getElementById('prealert-locker-search');
        const h = document.getElementById('prealert-locker');
        const d = document.getElementById('prealert-locker-dropdown');
        const c = document.getElementById('prealert-locker-clear');
        if (s) { s.value = ''; s.style.borderColor = ''; s.focus(); }
        if (h) h.value = '';
        if (d) d.style.display = 'none';
        if (c) c.style.display = 'none';
    },

    renderLockersList: function(searchQuery = '') {
        const tbody = document.getElementById('table-lockers-body');
        tbody.innerHTML = '';

        // Reset checkboxes y bulk bar
        const selectAllChk = document.getElementById('chk-select-all-lockers');
        if (selectAllChk) { selectAllChk.checked = false; selectAllChk.indeterminate = false; }
        const bulkBar = document.getElementById('lockers-bulk-bar');
        if (bulkBar) bulkBar.style.display = 'none';

        // 1. Filtrar
        const query = (searchQuery || '').toLowerCase();
        let filtered = state.users.filter(u =>
            (u.name       || '').toLowerCase().includes(query) ||
            (u.email      || '').toLowerCase().includes(query) ||
            (u.lockerCode || '').toLowerCase().includes(query) ||
            (u.doc        || '').toLowerCase().includes(query)
        );

        // 2. Ordenar
        const col = lockersSort.col;
        const dir = lockersSort.dir === 'asc' ? 1 : -1;
        filtered.sort((a, b) => {
            const va = (a[col] || '').toString().toLowerCase();
            const vb = (b[col] || '').toString().toLowerCase();
            return va < vb ? -dir : va > vb ? dir : 0;
        });

        // 3. Actualizar indicadores de orden en cabeceras
        document.querySelectorAll('#table-lockers-head th[data-sort-col]').forEach(th => {
            const icon = th.querySelector('.sort-icon');
            if (!icon) return;
            if (th.dataset.sortCol === col) {
                icon.textContent = lockersSort.dir === 'asc' ? ' ↑' : ' ↓';
                icon.style.color = 'var(--primary)';
            } else {
                icon.textContent = ' ↕';
                icon.style.color = 'var(--text-muted)';
            }
        });

        const total = filtered.length;
        const paginationEl = document.getElementById('lockers-pagination');

        if (total === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:2rem; color:var(--text-muted);">No se encontraron casilleros con el criterio de búsqueda.</td></tr>`;
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }

        // 4. Paginar
        const perPage = lockersPagination.perPage;
        const totalPages = Math.ceil(total / perPage);
        if (lockersPagination.page > totalPages) lockersPagination.page = totalPages;
        if (lockersPagination.page < 1) lockersPagination.page = 1;
        const start = (lockersPagination.page - 1) * perPage;
        const pageData = filtered.slice(start, start + perPage);

        // 5. Renderizar filas de la página actual
        const types = state.userTypes.length ? state.userTypes : DEFAULT_USER_TYPES;
        const typeColors = { cliente: '#6366f1', emprendedor: '#f97316', aliado: '#10b981', administrador: '#ef4444' };

        pageData.forEach(u => {
            const currentType = u.userType || 'cliente';
            const typeColor = typeColors[currentType] || '#64748b';
            const isInactive = u.active === false;
            const tr = document.createElement('tr');
            if (isInactive) tr.style.cssText = 'opacity:0.45; background:#f8fafc;';
            tr.innerHTML = `
                <td style="text-align:center;">
                    <input type="checkbox" class="locker-chk" data-user-id="${u.id}"
                           onchange="app.updateLockersSelection()"
                           style="width:16px; height:16px; accent-color:var(--primary); cursor:pointer;">
                </td>
                <td>
                    <button onclick="app.openLockerModal('${u.id}')"
                            style="background:none; border:none; padding:0; cursor:pointer; color:var(--primary); font-weight:700; font-size:1.05rem; text-decoration:underline dotted; text-underline-offset:3px;"
                            title="Editar casillero">${u.lockerCode}</button>
                </td>
                <td><strong>${u.name}</strong></td>
                <td class="col-hide-500">${u.doc || '—'}</td>
                <td class="col-hide-700">${u.email}</td>
                <td class="col-hide-900">${u.phone || '—'}</td>
                <td class="col-hide-700">${u.city || '—'}</td>
                <td>
                    <select data-user-id="${u.id}" onchange="app.changeLockerType('${u.id}', this.value)"
                            style="font-size:0.82rem; padding:3px 8px; border-radius:20px; border:1.5px solid ${typeColor}; background:${typeColor}22; color:${typeColor}; font-weight:600; cursor:pointer; outline:none; appearance:auto;">
                        ${types.map(t => `<option value="${t.id}" ${t.id === currentType ? 'selected' : ''}>${t.label}</option>`).join('')}
                    </select>
                </td>
                <td class="col-hide-900">${u.dateCreated || '—'}</td>
            `;
            tbody.appendChild(tr);
        });

        // 6. Renderizar paginador
        this.renderLockersPagination(total, totalPages, start, perPage);
    },

    sortLockers: function(th) {
        const col = th.dataset.sortCol;
        if (lockersSort.col === col) {
            lockersSort.dir = lockersSort.dir === 'asc' ? 'desc' : 'asc';
        } else {
            lockersSort.col = col;
            lockersSort.dir = 'asc';
        }
        lockersPagination.page = 1;
        this.renderLockersList(document.getElementById('search-lockers').value.trim());
    },

    setLockersPerPage: function(n) {
        lockersPagination.perPage = n;
        lockersPagination.page = 1;
        this.renderLockersList(document.getElementById('search-lockers').value.trim());
    },

    goToLockersPage: function(page) {
        const perPage = lockersPagination.perPage;
        const total = state.users.length;
        const totalPages = Math.ceil(total / perPage);
        if (page < 1 || page > totalPages) return;
        lockersPagination.page = page;
        this.renderLockersList(document.getElementById('search-lockers').value.trim());
        document.getElementById('tab-casillero-list').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    renderLockersPagination: function(total, totalPages, start, perPage) {
        const container = document.getElementById('lockers-pagination');
        if (!container) return;
        if (totalPages <= 1) { container.innerHTML = `<span style="font-size:0.82rem; color:var(--text-muted);">${total} casillero${total !== 1 ? 's' : ''} en total</span>`; return; }

        const page = lockersPagination.page;
        const end  = Math.min(start + perPage, total);

        // Botones de páginas con elipsis
        let btns = '';
        for (let i = 1; i <= totalPages; i++) {
            const show = i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1);
            const isEllipsisBefore = i === page - 2 && page - 2 > 1;
            const isEllipsisAfter  = i === page + 2 && page + 2 < totalPages;
            if (isEllipsisBefore || isEllipsisAfter) { btns += `<span style="color:var(--text-muted); padding:0 2px; font-size:0.85rem;">…</span>`; continue; }
            if (!show) continue;
            const active = i === page;
            btns += `<button onclick="app.goToLockersPage(${i})"
                style="min-width:30px; padding:4px 8px; border-radius:6px;
                       border:1px solid ${active ? 'var(--primary)' : 'var(--border-color)'};
                       background:${active ? 'var(--primary)' : 'white'};
                       color:${active ? 'white' : 'var(--text-main)'};
                       font-size:0.82rem; font-weight:${active ? '700' : '500'};
                       cursor:${active ? 'default' : 'pointer'};">${i}</button>`;
        }

        const btnStyle = (disabled) => `padding:4px 10px; border-radius:6px; border:1px solid var(--border-color); background:white; font-size:0.82rem; cursor:${disabled ? 'default' : 'pointer'}; opacity:${disabled ? '0.35' : '1'};`;

        container.innerHTML = `
            <span style="font-size:0.82rem; color:var(--text-muted);">
                Mostrando <strong>${start + 1}–${end}</strong> de <strong>${total}</strong> casilleros
            </span>
            <div style="display:flex; align-items:center; gap:0.35rem; flex-wrap:wrap;">
                <button onclick="app.goToLockersPage(1)" ${page<=1?'disabled':''} style="${btnStyle(page<=1)}" title="Primera">«</button>
                <button onclick="app.goToLockersPage(${page-1})" ${page<=1?'disabled':''} style="${btnStyle(page<=1)}" title="Anterior">‹</button>
                ${btns}
                <button onclick="app.goToLockersPage(${page+1})" ${page>=totalPages?'disabled':''} style="${btnStyle(page>=totalPages)}" title="Siguiente">›</button>
                <button onclick="app.goToLockersPage(${totalPages})" ${page>=totalPages?'disabled':''} style="${btnStyle(page>=totalPages)}" title="Última">»</button>
            </div>`;
    },

    updateLockersSelection: function() {
        const checked = document.querySelectorAll('.locker-chk:checked');
        const all     = document.querySelectorAll('.locker-chk');
        const bar     = document.getElementById('lockers-bulk-bar');
        const countEl = document.getElementById('lockers-selected-count');
        const selectAllChk = document.getElementById('chk-select-all-lockers');
        const n = checked.length;

        bar.style.display = n > 0 ? 'flex' : 'none';
        if (countEl) countEl.textContent = `${n} casillero${n !== 1 ? 's' : ''} seleccionado${n !== 1 ? 's' : ''}`;
        if (selectAllChk) {
            selectAllChk.checked = n === all.length && n > 0;
            selectAllChk.indeterminate = n > 0 && n < all.length;
        }

        // Populate bulk type select if empty
        const bulkSel = document.getElementById('bulk-type-select');
        if (bulkSel && bulkSel.options.length <= 1) {
            const types = state.userTypes.length ? state.userTypes : DEFAULT_USER_TYPES;
            types.forEach(t => {
                const opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = t.label;
                bulkSel.appendChild(opt);
            });
        }
    },

    selectAllLockers: function(checked) {
        document.querySelectorAll('.locker-chk').forEach(c => c.checked = checked);
        this.updateLockersSelection();
    },

    clearLockersSelection: function() {
        document.querySelectorAll('.locker-chk').forEach(c => c.checked = false);
        const selectAllChk = document.getElementById('chk-select-all-lockers');
        if (selectAllChk) { selectAllChk.checked = false; selectAllChk.indeterminate = false; }
        document.getElementById('lockers-bulk-bar').style.display = 'none';
    },

    changeLockerType: async function(userId, newType) {
        if (!newType) return;
        if (useSupabase) {
            const { error } = await supabaseClient.from('users').update({ userType: newType }).eq('id', userId);
            if (error) { this.showAlert(`Error al actualizar: ${error.message}`, 'danger'); return; }
        } else {
            const u = state.users.find(u => u.id === userId);
            if (u) u.userType = newType;
            saveStateLocal();
        }
        // Update in local state without full reload
        const u = state.users.find(u => u.id === userId);
        if (u) u.userType = newType;
        // Re-color the select that just changed
        const sel = document.querySelector(`select[data-user-id="${userId}"]`);
        const typeColors = { cliente: '#6366f1', emprendedor: '#f97316', aliado: '#10b981', administrador: '#ef4444' };
        const c = typeColors[newType] || '#64748b';
        if (sel) { sel.style.borderColor = c; sel.style.background = c + '22'; sel.style.color = c; }
        this.showAlert('Tipo de usuario actualizado.', 'success');
    },

    applyBulkLockerType: async function() {
        const selected = [...document.querySelectorAll('.locker-chk:checked')].map(c => c.dataset.userId);
        const newType  = document.getElementById('bulk-type-select').value;
        if (!selected.length) { this.showAlert('Selecciona al menos un casillero.', 'warning'); return; }
        if (!newType) { this.showAlert('Selecciona un tipo de usuario para aplicar.', 'warning'); return; }
        const typeName = ((state.userTypes.length ? state.userTypes : DEFAULT_USER_TYPES).find(t => t.id === newType) || {}).label || newType;
        if (!confirm(`¿Asignar el tipo "${typeName}" a ${selected.length} casillero(s)?`)) return;
        if (useSupabase) {
            const { error } = await supabaseClient.from('users').update({ userType: newType }).in('id', selected);
            if (error) { this.showAlert(`Error: ${error.message}`, 'danger'); return; }
        } else {
            selected.forEach(id => { const u = state.users.find(u => u.id === id); if (u) u.userType = newType; });
            saveStateLocal();
        }
        await loadState();
        this.renderLockersList(document.getElementById('search-lockers').value.trim());
        this.showAlert(`Tipo "${typeName}" asignado a ${selected.length} casillero(s) exitosamente.`, 'success');
    },

    // ── Modal Editar / Inactivar Casillero ─────────────────────────────
    openLockerModal: function(userId) {
        const u = state.users.find(u => u.id === userId);
        if (!u) return;

        document.getElementById('edit-locker-id').value = u.id;
        document.getElementById('edit-locker-code-label').textContent = u.lockerCode || '—';
        document.getElementById('edit-locker-date-label').textContent = u.dateCreated || '—';
        document.getElementById('edit-locker-name').value    = u.name    || '';
        document.getElementById('edit-locker-doc').value     = u.doc     || '';
        document.getElementById('edit-locker-email').value   = u.email   || '';
        document.getElementById('edit-locker-phone').value   = u.phone   || '';
        document.getElementById('edit-locker-city').value    = u.city    || '';
        document.getElementById('edit-locker-address').value = u.address || '';

        // Tipo de usuario
        const types = state.userTypes.length ? state.userTypes : DEFAULT_USER_TYPES;
        const typeSelect = document.getElementById('edit-locker-type');
        typeSelect.innerHTML = types.map(t =>
            `<option value="${t.id}" ${t.id === (u.userType || 'cliente') ? 'selected' : ''}>${t.label}</option>`
        ).join('');

        // Estado activo / inactivo
        const isActive = u.active !== false;
        const statusLabel = document.getElementById('edit-locker-status-label');
        statusLabel.innerHTML = isActive
            ? `<span style="background:#dcfce7; color:#16a34a; border-radius:20px; padding:2px 10px; font-size:0.78rem; font-weight:600;">Activo</span>`
            : `<span style="background:#fee2e2; color:#dc2626; border-radius:20px; padding:2px 10px; font-size:0.78rem; font-weight:600;">Inactivo</span>`;

        const btnToggle = document.getElementById('btn-inactivate-locker');
        if (isActive) {
            btnToggle.textContent = 'Inactivar casillero';
            btnToggle.style.background = '#fef2f2';
            btnToggle.style.color = '#dc2626';
            btnToggle.style.borderColor = '#fca5a5';
        } else {
            btnToggle.textContent = 'Reactivar casillero';
            btnToggle.style.background = '#f0fdf4';
            btnToggle.style.color = '#16a34a';
            btnToggle.style.borderColor = '#86efac';
        }

        // Limpiar mensaje
        const msg = document.getElementById('edit-locker-msg');
        msg.style.display = 'none';

        document.getElementById('modal-edit-locker').classList.add('active');
    },

    handleSaveLockerEdit: async function() {
        const userId  = document.getElementById('edit-locker-id').value;
        const name    = document.getElementById('edit-locker-name').value.trim();
        const email   = document.getElementById('edit-locker-email').value.trim();
        const doc     = document.getElementById('edit-locker-doc').value.trim();
        const phone   = document.getElementById('edit-locker-phone').value.trim();
        const city    = document.getElementById('edit-locker-city').value.trim();
        const address = document.getElementById('edit-locker-address').value.trim();
        const userType = document.getElementById('edit-locker-type').value;

        const showMsg = (text, type) => {
            const el = document.getElementById('edit-locker-msg');
            el.textContent = text;
            el.style.display = 'block';
            el.style.background = type === 'success' ? '#dcfce7' : '#fee2e2';
            el.style.color = type === 'success' ? '#16a34a' : '#dc2626';
        };

        if (!name || !email) { showMsg('Nombre y correo son obligatorios.', 'error'); return; }

        const updates = { name, email, doc, phone, city, address, userType };

        if (useSupabase) {
            const { error } = await supabaseClient.from('users').update(updates).eq('id', userId);
            if (error) { showMsg(`Error al guardar: ${error.message}`, 'error'); return; }
        } else {
            const u = state.users.find(u => u.id === userId);
            if (u) Object.assign(u, updates);
            saveStateLocal();
        }

        const u = state.users.find(u => u.id === userId);
        if (u) Object.assign(u, updates);

        this.closeModal('modal-edit-locker');
        this.renderLockersList(document.getElementById('search-lockers').value.trim());
        this.showAlert('Datos del casillero actualizados correctamente.', 'success');
    },

    handleToggleLockerActive: async function() {
        const userId = document.getElementById('edit-locker-id').value;
        const u = state.users.find(u => u.id === userId);
        if (!u) return;

        const isActive = u.active !== false;
        const newActive = !isActive;
        const accion = newActive ? 'reactivar' : 'inactivar';
        if (!confirm(`¿Deseas ${accion} el casillero ${u.lockerCode}?`)) return;

        if (useSupabase) {
            const { error } = await supabaseClient.from('users').update({ active: newActive }).eq('id', userId);
            if (error) { this.showAlert(`Error: ${error.message}`, 'danger'); return; }
        } else {
            u.active = newActive;
            saveStateLocal();
        }

        u.active = newActive;
        this.closeModal('modal-edit-locker');
        this.renderLockersList(document.getElementById('search-lockers').value.trim());
        this.showAlert(`Casillero ${u.lockerCode} ${newActive ? 'reactivado' : 'inactivado'} correctamente.`, newActive ? 'success' : 'warning');
    },

    renderPrealertsList: function() {
        const tbody = document.getElementById('table-prealerts-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        // 1. Filtrar por estado y búsqueda de texto
        const filterVal = (document.getElementById('filter-prealert-status') || {}).value || 'all';
        const searchQ   = ((document.getElementById('search-prealerts') || {}).value || '').toLowerCase().trim();

        let filtered = state.prealerts.map(p => {
            const user = state.users.find(u => u.lockerCode === p.lockerCode);
            return { ...p, userName: user ? user.name : '' };
        }).filter(p => {
            const matchStatus = filterVal === 'all' || p.status === filterVal;
            const matchSearch = !searchQ ||
                (p.lockerCode  || '').toLowerCase().includes(searchQ) ||
                (p.tracking    || '').toLowerCase().includes(searchQ) ||
                (p.userName    || '').toLowerCase().includes(searchQ) ||
                (p.store       || '').toLowerCase().includes(searchQ);
            return matchStatus && matchSearch;
        });

        // 2. Ordenar
        const col = prealartsSort.col;
        const dir = prealartsSort.dir === 'asc' ? 1 : -1;
        filtered.sort((a, b) => {
            const va = (a[col] != null ? String(a[col]) : '').toLowerCase();
            const vb = (b[col] != null ? String(b[col]) : '').toLowerCase();
            return va < vb ? -dir : va > vb ? dir : 0;
        });

        // 3. Actualizar íconos de orden
        document.querySelectorAll('#table-prealerts-head th[data-sort-col]').forEach(th => {
            const icon = th.querySelector('.sort-icon');
            if (!icon) return;
            if (th.dataset.sortCol === col) {
                icon.textContent = prealartsSort.dir === 'asc' ? ' ↑' : ' ↓';
                icon.style.color = 'var(--primary)';
            } else {
                icon.textContent = ' ↕';
                icon.style.color = 'var(--text-muted)';
            }
        });

        const total = filtered.length;
        const paginationEl = document.getElementById('prealerts-pagination');

        if (total === 0) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; padding:2rem; color:var(--text-muted);">No hay prealertas en esta categoría.</td></tr>`;
            if (paginationEl) paginationEl.innerHTML = '';
            return;
        }

        // 4. Paginar
        const perPage = prealertsPagination.perPage;
        const totalPages = Math.ceil(total / perPage);
        if (prealertsPagination.page > totalPages) prealertsPagination.page = totalPages;
        if (prealertsPagination.page < 1) prealertsPagination.page = 1;
        const start = (prealertsPagination.page - 1) * perPage;
        const pageData = filtered.slice(start, start + perPage);

        // 5. Renderizar filas
        pageData.forEach(pre => {
            const statusBadge = pre.status === 'Pendiente' ? 'badge-warning' : 'badge-success';
            const fileLink = pre.invoiceFileData
                ? `<a href="${pre.invoiceFileData}" target="_blank" style="color:var(--primary); font-weight:600; white-space:nowrap;">📎 Ver</a>`
                : `<span style="color:var(--text-muted); font-size:0.78rem;">—</span>`;
            const shippingColor = pre.shippingType === 'Corporativo' ? 'var(--secondary)' : 'var(--primary)';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="white-space:nowrap; color:var(--text-muted); font-size:0.8rem;">${pre.dateCreated || '—'}</td>
                <td><strong style="color:var(--primary);">${pre.lockerCode}</strong></td>
                <td style="font-weight:600;">${pre.userName || '—'}</td>
                <td style="font-family:monospace; font-size:0.82rem;">${pre.tracking}</td>
                <td class="col-hide-700">${pre.store || '—'}</td>
                <td class="col-hide-900">${pre.carrier || '—'}</td>
                <td class="col-hide-700" style="white-space:nowrap;">$${parseFloat(pre.value||0).toFixed(2)}</td>
                <td class="col-hide-900">${pre.deliveryCity || '—'}</td>
                <td class="col-hide-900" style="color:${shippingColor}; font-weight:600; font-size:0.82rem;">${pre.shippingType || '—'}</td>
                <td><span class="badge ${statusBadge}" style="white-space:nowrap;">${pre.status}</span></td>
                <td class="col-hide-900">${fileLink}</td>
            `;
            tbody.appendChild(tr);
        });

        // 6. Paginador
        this.renderPrealertsPagination(total, totalPages, start, perPage);
    },

    sortPrealerts: function(th) {
        const col = th.dataset.sortCol;
        if (prealartsSort.col === col) {
            prealartsSort.dir = prealartsSort.dir === 'asc' ? 'desc' : 'asc';
        } else {
            prealartsSort.col = col;
            prealartsSort.dir = 'asc';
        }
        prealertsPagination.page = 1;
        this.renderPrealertsList();
    },

    setPrealartsPerPage: function(n) {
        prealertsPagination.perPage = n;
        prealertsPagination.page = 1;
        this.renderPrealertsList();
    },

    goToPrealartsPage: function(page) {
        const total = state.prealerts.length;
        const totalPages = Math.ceil(total / prealertsPagination.perPage) || 1;
        if (page < 1 || page > totalPages) return;
        prealertsPagination.page = page;
        this.renderPrealertsList();
        document.getElementById('tab-prealertas').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    renderPrealertsPagination: function(total, totalPages, start, perPage) {
        const container = document.getElementById('prealerts-pagination');
        if (!container) return;
        if (totalPages <= 1) {
            container.innerHTML = `<span style="font-size:0.82rem; color:var(--text-muted);">${total} prealerta${total !== 1 ? 's' : ''} en total</span>`;
            return;
        }
        const page = prealertsPagination.page;
        const end  = Math.min(start + perPage, total);
        let btns = '';
        for (let i = 1; i <= totalPages; i++) {
            const show = i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1);
            if (i === page - 2 && page - 2 > 1) { btns += `<span style="color:var(--text-muted);padding:0 2px;font-size:0.85rem;">…</span>`; continue; }
            if (i === page + 2 && page + 2 < totalPages) { btns += `<span style="color:var(--text-muted);padding:0 2px;font-size:0.85rem;">…</span>`; continue; }
            if (!show) continue;
            const active = i === page;
            btns += `<button onclick="app.goToPrealartsPage(${i})" style="min-width:30px;padding:4px 8px;border-radius:6px;border:1px solid ${active?'var(--primary)':'var(--border-color)'};background:${active?'var(--primary)':'white'};color:${active?'white':'var(--text-main)'};font-size:0.82rem;font-weight:${active?700:500};cursor:${active?'default':'pointer'};">${i}</button>`;
        }
        const bs = (d) => `padding:4px 10px;border-radius:6px;border:1px solid var(--border-color);background:white;font-size:0.82rem;cursor:${d?'default':'pointer'};opacity:${d?'0.35':'1'};`;
        container.innerHTML = `
            <span style="font-size:0.82rem;color:var(--text-muted);">Mostrando <strong>${start+1}–${end}</strong> de <strong>${total}</strong></span>
            <div style="display:flex;align-items:center;gap:0.35rem;flex-wrap:wrap;">
                <button onclick="app.goToPrealartsPage(1)" ${page<=1?'disabled':''} style="${bs(page<=1)}" title="Primera">«</button>
                <button onclick="app.goToPrealartsPage(${page-1})" ${page<=1?'disabled':''} style="${bs(page<=1)}" title="Anterior">‹</button>
                ${btns}
                <button onclick="app.goToPrealartsPage(${page+1})" ${page>=totalPages?'disabled':''} style="${bs(page>=totalPages)}" title="Siguiente">›</button>
                <button onclick="app.goToPrealartsPage(${totalPages})" ${page>=totalPages?'disabled':''} style="${bs(page>=totalPages)}" title="Última">»</button>
            </div>`;
    },

    openNewPrealertModal: function() {
        document.getElementById('form-register-prealert').reset();
        this.clearLockerSearch();
        toggleCarrierOther('prealert-carrier', 'prealert-carrier-other');
        const msg = document.getElementById('new-prealert-msg');
        if (msg) msg.style.display = 'none';
        this.initLockerAutocomplete();
        document.getElementById('modal-new-prealert').classList.add('active');
    },

    closeNewPrealertModal: function() {
        document.getElementById('modal-new-prealert').classList.remove('active');
    },

    renderPackagesList: function() {
        const tbody = document.getElementById('table-packages-body');
        tbody.innerHTML = '';

        const searchVal = document.getElementById('search-packages').value.trim().toLowerCase();
        const statusVal = document.getElementById('filter-packages-status').value;

        const filtered = state.packages.filter(pkg => {
            const matchesSearch = pkg.tracking.toLowerCase().includes(searchVal) ||
                                  pkg.lockerCode.toLowerCase().includes(searchVal) ||
                                  pkg.description.toLowerCase().includes(searchVal);
            const matchesStatus = statusVal === 'all' || pkg.status === statusVal;
            return matchesSearch && matchesStatus;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; color:var(--text-muted);">No se encontraron paquetes registrados.</td></tr>`;
            this.updateBulkBar();
            return;
        }

        filtered.forEach(pkg => {
            const calc = this.calculatePackageInvoicing(pkg);

            let badgeClass = 'badge-neutral';
            if (pkg.status === 'En Bodega Miami') badgeClass = 'badge-warning';
            if (pkg.status === 'En Tránsito a Colombia') badgeClass = 'badge-info';
            if (pkg.status === 'Nacionalización') badgeClass = 'badge-danger';
            if (pkg.status === 'Listo para Entrega') badgeClass = 'badge-success';
            if (pkg.status === 'Entregado') badgeClass = 'badge-success';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="text-align:center;">
                    <input type="checkbox" class="pkg-checkbox" data-id="${pkg.id}" style="cursor:pointer;" onchange="app.updateBulkBar()">
                </td>
                <td>${pkg.dateReceived}</td>
                <td><strong style="color:var(--primary);">${pkg.lockerCode}</strong></td>
                <td>
                    <span style="font-weight:600; font-size:0.85rem;">${pkg.tracking}</span><br>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${pkg.carrier}</span>
                </td>
                <td>${pkg.weightLbs} lbs</td>
                <td>${pkg.lengthIn}x${pkg.widthIn}x${pkg.heightIn}</td>
                <td>${calc.volWeight} lbs</td>
                <td><strong style="color:var(--secondary);">${calc.chargeableWeight} lbs</strong></td>
                <td>$${pkg.value.toFixed(2)}<br><small style="color:var(--text-muted); font-size:0.78rem;">${fmtCOP(pkg.value)}</small></td>
                <td><span class="badge ${badgeClass}">${pkg.status}</span></td>
                <td>
                    <div style="display:flex; gap:0.25rem;">
                        <button class="btn btn-secondary btn-sm" onclick="app.openChangeStatusModal('${pkg.id}')" title="Cambiar Estado">⚙️</button>
                        <button class="btn btn-primary btn-sm" onclick="app.viewInvoiceDetail('${pkg.id}')" title="Ver Prefactura">💵</button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });

        // Wire up select-all checkbox
        const selectAll = document.getElementById('select-all-packages');
        if (selectAll) {
            selectAll.checked = false;
            selectAll.onchange = () => {
                document.querySelectorAll('.pkg-checkbox').forEach(cb => cb.checked = selectAll.checked);
                this.updateBulkBar();
            };
        }
        this.updateBulkBar();
    },

    updateBulkBar: function() {
        const checked = document.querySelectorAll('.pkg-checkbox:checked');
        const bar = document.getElementById('bulk-action-bar');
        const countEl = document.getElementById('bulk-selected-count');
        if (!bar) return;
        if (checked.length > 0) {
            bar.style.display = 'flex';
            countEl.textContent = `${checked.length} paquete${checked.length > 1 ? 's' : ''} seleccionado${checked.length > 1 ? 's' : ''}`;
        } else {
            bar.style.display = 'none';
            document.getElementById('bulk-status-select').value = '';
        }
    },

    clearBulkSelection: function() {
        document.querySelectorAll('.pkg-checkbox').forEach(cb => cb.checked = false);
        const selectAll = document.getElementById('select-all-packages');
        if (selectAll) selectAll.checked = false;
        this.updateBulkBar();
    },

    handleBulkStatusChange: async function() {
        const newStatus = document.getElementById('bulk-status-select').value;
        if (!newStatus) {
            this.showAlert('Selecciona un estado antes de aplicar.', 'warning');
            return;
        }
        const checked = document.querySelectorAll('.pkg-checkbox:checked');
        if (checked.length === 0) return;

        const ids = Array.from(checked).map(cb => cb.dataset.id);

        if (useSupabase) {
            for (const id of ids) {
                await supabaseClient.from('packages').update({ status: newStatus }).eq('id', id);
            }
            await loadState();
        } else {
            ids.forEach(id => {
                const pkg = state.packages.find(p => p.id === id);
                if (pkg) pkg.status = newStatus;
            });
            saveStateLocal();
        }

        this.showAlert(`Estado actualizado a <strong>${newStatus}</strong> en ${ids.length} paquete${ids.length > 1 ? 's' : ''}.`, 'success');
        this.clearBulkSelection();
        this.renderPackagesList();
        this.renderMetrics();
    },

    renderPendingPrealertsList: function() {
        const tbody = document.getElementById('table-pending-prealerts-body');
        const countEl = document.getElementById('pending-prealerts-count');
        if (!tbody) return;

        const pending = (state.prealerts || []).filter(p => p.status === 'Pendiente');

        countEl.textContent = `${pending.length} pendiente${pending.length !== 1 ? 's' : ''}`;

        if (pending.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--text-muted); padding:1rem;">No hay prealertas pendientes de recepción.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        pending.forEach(pre => {
            const user = (state.users || []).find(u => u.lockerCode === pre.lockerCode);
            const clientName = user ? user.name : '—';
            const fileLink = pre.invoiceFileData
                ? `<a href="${pre.invoiceFileData}" target="_blank" title="${pre.invoiceFileName || 'Ver soporte'}" style="color:var(--primary);">📎 Ver</a>`
                : '—';
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="color:var(--primary);">${pre.lockerCode}</strong></td>
                <td style="font-size:0.85rem;">${clientName}</td>
                <td style="font-family:monospace; font-size:0.8rem;">${pre.tracking}</td>
                <td style="font-size:0.85rem;">${pre.store || '—'}</td>
                <td>${pre.carrier || '—'}</td>
                <td style="font-size:0.85rem;">${pre.description}</td>
                <td>$${parseFloat(pre.value || 0).toFixed(2)}</td>
                <td style="font-size:0.85rem;">${pre.deliveryCity || '—'}</td>
                <td>${fileLink}</td>
                <td>
                    <button class="btn btn-primary btn-sm" onclick="app.loadPrealertIntoCheckin('${pre.id}')">
                        ✏️ Confirmar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    loadPrealertIntoCheckin: function(preId) {
        const pre = (state.prealerts || []).find(p => p.id === preId);
        if (!pre) return;

        const user = (state.users || []).find(u => u.lockerCode === pre.lockerCode);

        // Fill identification banner
        document.getElementById('mci-prealert-id').value = pre.id;
        document.getElementById('mci-locker-display').textContent = pre.lockerCode;
        document.getElementById('mci-client-display').textContent = user ? user.name : '—';

        // Fill prealert fields
        document.getElementById('mci-tracking').value = pre.tracking || '';
        document.getElementById('mci-store').value = pre.store || '';
        document.getElementById('mci-value').value = pre.value || '';
        document.getElementById('mci-desc').value = pre.description || '';
        document.getElementById('mci-city').value = pre.deliveryCity || '';

        // Carrier
        const knownCarriers = ['Amazon Log', 'UPS', 'FedEx', 'USPS', 'DHL'];
        const carrierVal = pre.carrier || '';
        const mciCarrier = document.getElementById('mci-carrier');
        const mciCarrierOther = document.getElementById('mci-carrier-other');
        if (knownCarriers.includes(carrierVal)) {
            mciCarrier.value = carrierVal;
            mciCarrierOther.style.display = 'none';
            mciCarrierOther.required = false;
            mciCarrierOther.value = '';
        } else if (carrierVal) {
            mciCarrier.value = 'Otro';
            mciCarrierOther.style.display = 'block';
            mciCarrierOther.required = true;
            mciCarrierOther.value = carrierVal;
        } else {
            mciCarrier.value = '';
            mciCarrierOther.style.display = 'none';
            mciCarrierOther.required = false;
        }

        // Existing file
        const fileCurrentDiv = document.getElementById('mci-file-current');
        if (pre.invoiceFileData) {
            fileCurrentDiv.innerHTML = `<a href="${pre.invoiceFileData}" target="_blank" style="color:var(--primary); font-weight:600;">📎 ${pre.invoiceFileName || 'Ver soporte actual'}</a>`;
        } else {
            fileCurrentDiv.textContent = 'Sin soporte adjunto';
        }
        document.getElementById('mci-file').value = '';

        // Clear physical measurements
        ['mci-weight', 'mci-length', 'mci-width', 'mci-height'].forEach(id => {
            document.getElementById(id).value = '';
        });

        this.openModal('modal-checkin-confirm');
        setTimeout(() => document.getElementById('mci-weight').focus(), 200);
    },

    handleCheckinConfirm: async function() {
        const preId = document.getElementById('mci-prealert-id').value;
        const pre = (state.prealerts || []).find(p => p.id === preId);
        if (!pre) { this.showAlert('No se encontró la prealerta. Recarga la página.', 'danger'); return; }

        const tracking = document.getElementById('mci-tracking').value.trim();
        const store = document.getElementById('mci-store').value.trim();
        const carrier = resolveCarrier('mci-carrier', 'mci-carrier-other');
        if (!carrier) return;
        const value = parseFloat(document.getElementById('mci-value').value);
        const description = document.getElementById('mci-desc').value.trim();
        const deliveryCity = document.getElementById('mci-city').value;
        const weightLbs = parseFloat(document.getElementById('mci-weight').value);
        const lengthIn = parseInt(document.getElementById('mci-length').value);
        const widthIn = parseInt(document.getElementById('mci-width').value);
        const heightIn = parseInt(document.getElementById('mci-height').value);

        // Handle optional new file upload
        let invoiceFileName = pre.invoiceFileName || '';
        let invoiceFileData = pre.invoiceFileData || '';
        const fileInput = document.getElementById('mci-file');
        if (fileInput && fileInput.files[0]) {
            const file = fileInput.files[0];
            if (file.size > 3 * 1024 * 1024) {
                this.showAlert('El archivo supera el límite de 3 MB.', 'warning');
                return;
            }
            invoiceFileName = file.name;
            invoiceFileData = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }

        // Check duplicate package
        const pkgExists = state.packages.some(p => p.tracking.toLowerCase() === tracking.toLowerCase());
        if (pkgExists) {
            this.showAlert('Este tracking ya está registrado como paquete en bodega.', 'danger');
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        const newPkg = {
            id: `pkg_${Date.now()}`,
            tracking,
            lockerCode: pre.lockerCode,
            carrier,
            weightLbs,
            widthIn,
            heightIn,
            lengthIn,
            value,
            description,
            status: 'En Bodega Miami',
            dateReceived: todayStr,
            invoiceStatus: 'Pendiente'
        };

        const updatedPre = { store, carrier, value, description, deliveryCity, invoiceFileName, invoiceFileData };

        if (useSupabase) {
            try {
                const { error: errPkg } = await supabaseClient.from('packages').insert([newPkg]);
                if (errPkg) throw errPkg;
                await supabaseClient.from('prealerts').update({ status: 'Recibido', ...updatedPre }).eq('id', preId);
            } catch (err) {
                this.showAlert(`Error al registrar en Supabase: ${err.message}`, 'danger');
                return;
            }
        } else {
            state.packages.push(newPkg);
            const idx = state.prealerts.findIndex(p => p.id === preId);
            if (idx !== -1) Object.assign(state.prealerts[idx], { status: 'Recibido', ...updatedPre });
            saveStateLocal();
        }

        await loadState();
        this.closeModal('modal-checkin-confirm');
        this.showAlert(`Paquete <strong>${tracking}</strong> registrado en Bodega Miami. Liquidación calculada.`, 'success');
        this.renderAll();
    },

    renderBillingList: function() {
        const tbody = document.getElementById('table-billing-body');
        tbody.innerHTML = '';
        
        if (state.packages.length === 0) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">No hay guías facturables aún.</td></tr>`;
            return;
        }
        
        state.packages.forEach(pkg => {
            const calc = this.calculatePackageInvoicing(pkg);
            const paidBadge = pkg.invoiceStatus === 'Pagado' ? 'badge-success' : 'badge-warning';
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="color:var(--primary);">${pkg.lockerCode}</strong></td>
                <td style="font-size:0.8rem; font-family:monospace;">${pkg.tracking}</td>
                <td>$${calc.freight.toFixed(2)}</td>
                <td>$${calc.insurance.toFixed(2)}</td>
                <td>$${calc.tax.toFixed(2)}</td>
                <td>$${(calc.handling + calc.fuel).toFixed(2)}</td>
                <td><strong style="color:var(--secondary); font-size:1rem;">$${calc.total.toFixed(2)} USD</strong><br><small style="color:var(--text-muted); font-size:0.78rem;">${fmtCOP(calc.total)}</small></td>
                <td><span class="badge ${paidBadge}">${pkg.invoiceStatus || 'Pendiente'}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="app.viewInvoiceDetail('${pkg.id}')">Ver Detalle</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderConfigInputs: function() {
        const s = state.settings;
        document.getElementById('cfg-base-rate').value = s.baseRatePerLb;
        document.getElementById('cfg-handling').value = s.handlingFee;
        document.getElementById('cfg-insurance').value = s.insurancePercent;
        document.getElementById('cfg-fuel').value = s.fuelSurchargePercent;
        document.getElementById('cfg-vat-threshold').value = s.vatThresholdUsd;
        document.getElementById('cfg-vat-rate').value = s.vatPercent;
        document.getElementById('cfg-trm').value = s.trm || 4000;
    },

    // EVENT HANDLERS
    handleRegisterUser: async function() {
        const name = document.getElementById('user-fullname').value.trim();
        const email = document.getElementById('user-email').value.trim();
        const phone = document.getElementById('user-phone').value.trim();
        const doc = document.getElementById('user-doc').value.trim();
        const city = document.getElementById('user-city').value.trim();
        const address = document.getElementById('user-address').value.trim();
        const userType = document.getElementById('user-type').value || 'cliente';
        
        // Auto-generate locker code: buscar el mayor número PAKKIXXXXX e incrementar
        let maxSequence = 50191; // seed basado en el último código importado
        state.users.forEach(u => {
            const match = (u.lockerCode || '').match(/PAKKI(\d+)/i);
            if (match) {
                const seq = parseInt(match[1]);
                if (seq > maxSequence) maxSequence = seq;
            }
        });
        const lockerCode = `PAKKI${maxSequence + 1}`;
        const todayStr = new Date().toISOString().split('T')[0];
        
        const newUser = {
            id: `usr_${Date.now()}`,
            name,
            email,
            phone,
            doc,
            city,
            address,
            lockerCode,
            userType,
            dateCreated: todayStr
        };
        
        if (useSupabase) {
            try {
                const { error } = await supabaseClient.from('users').insert([newUser]);
                if (error) throw error;
            } catch (err) {
                this.showAlert(`Error al guardar en Supabase: ${err.message}`, 'danger');
                return;
            }
        } else {
            state.users.push(newUser);
            saveStateLocal();
        }
        
        await loadState();
        this.showAlert(`Cliente registrado con éxito. Casillero asignado: <strong>${lockerCode}</strong>`, 'success');
        document.getElementById('form-register-user').reset();
        
        // Redirect to active list to see it
        this.switchTab('tab-casillero-list');
    },

    handleRegisterPrealert: async function() {
        const lockerCode = document.getElementById('prealert-locker').value;
        const tracking = document.getElementById('prealert-tracking').value.trim();
        const store = document.getElementById('prealert-store').value.trim();
        const carrier = resolveCarrier('prealert-carrier', 'prealert-carrier-other');
        if (!carrier) return;
        const value = parseFloat(document.getElementById('prealert-value').value);
        const weightLbs = parseFloat(document.getElementById('prealert-weight').value) || null;
        const description = document.getElementById('prealert-desc').value.trim();
        const deliveryCity = document.getElementById('prealert-city').value;
        const shippingType = document.getElementById('prealert-shipping-type').value;

        if (!lockerCode) {
            this.showAlert('Debes seleccionar un casillero de la lista de sugerencias — escribe y haz clic en un resultado.', 'warning');
            document.getElementById('prealert-locker-search').focus();
            return;
        }

        // Handle file upload (convert to base64)
        let invoiceFileName = '';
        let invoiceFileData = '';
        const fileInput = document.getElementById('prealert-file');
        if (fileInput && fileInput.files[0]) {
            const file = fileInput.files[0];
            if (file.size > 3 * 1024 * 1024) {
                this.showAlert('El archivo supera el límite de 3 MB. Elige un archivo más pequeño.', 'warning');
                return;
            }
            invoiceFileName = file.name;
            invoiceFileData = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }

        const todayStr = new Date().toISOString().split('T')[0];

        const exists = state.prealerts.some(p => p.tracking.toLowerCase() === tracking.toLowerCase());
        if (exists) {
            this.showAlert('Ya existe una prealerta registrada con este número de tracking.', 'danger');
            return;
        }

        const newPre = {
            id: `pre_${Date.now()}`,
            lockerCode,
            tracking,
            store,
            carrier,
            value,
            weightLbs,
            description,
            deliveryCity,
            shippingType,
            invoiceFileName,
            invoiceFileData,
            status: "Pendiente",
            dateCreated: todayStr
        };

        if (useSupabase) {
            try {
                const { error } = await supabaseClient.from('prealerts').insert([newPre]);
                if (error) throw error;
            } catch (err) {
                this.showAlert(`Error al guardar prealerta en la nube: ${err.message}`, 'danger');
                return;
            }
        } else {
            state.prealerts.push(newPre);
            saveStateLocal();
        }

        await loadState();
        this.closeNewPrealertModal();
        this.renderPrealertsList();
        this.renderMetrics();
        this.showAlert(`Prealerta para tracking <strong>${tracking}</strong> registrada con éxito.`, 'success');
    },

    handleSaveConfig: async function() {
        const baseRate = parseFloat(document.getElementById('cfg-base-rate').value);
        const handling = parseFloat(document.getElementById('cfg-handling').value);
        const insurance = parseFloat(document.getElementById('cfg-insurance').value);
        const fuel = parseFloat(document.getElementById('cfg-fuel').value);
        const vatThreshold = parseFloat(document.getElementById('cfg-vat-threshold').value);
        const vatRate = parseFloat(document.getElementById('cfg-vat-rate').value);
        const trm = parseFloat(document.getElementById('cfg-trm').value) || 4000;

        const newSettings = {
            id: 'global',
            baseRatePerLb: baseRate,
            handlingFee: handling,
            insurancePercent: insurance,
            fuelSurchargePercent: fuel,
            vatThresholdUsd: vatThreshold,
            vatPercent: vatRate,
            trm: trm
        };
        
        if (useSupabase) {
            try {
                const { error } = await supabaseClient.from('settings').upsert([newSettings]);
                if (error) throw error;
            } catch (err) {
                this.showAlert(`Error al guardar configuración en la nube: ${err.message}`, 'danger');
                return;
            }
        } else {
            state.settings = newSettings;
            saveStateLocal();
        }
        
        await loadState();
        this.showAlert('Configuración de lógica y tarifas actualizada. Liquidaciones recalculadas.', 'success');
        this.renderAll();
    },

    // Modal Control Functions
    openModal: function(modalId) {
        document.getElementById(modalId).classList.add('active');
    },

    closeModal: function(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    // Change package status
    openChangeStatusModal: function(pkgId) {
        const pkg = state.packages.find(p => p.id === pkgId);
        if (!pkg) return;
        
        document.getElementById('status-package-id').value = pkg.id;
        document.getElementById('status-package-tracking').textContent = pkg.tracking;
        document.getElementById('new-package-status').value = pkg.status;
        
        this.openModal('modal-change-status');
    },

    handleUpdateStatusSubmit: async function() {
        const pkgId = document.getElementById('status-package-id').value;
        const newStatus = document.getElementById('new-package-status').value;
        
        if (useSupabase) {
            try {
                const { error } = await supabaseClient.from('packages').update({ status: newStatus }).eq('id', pkgId);
                if (error) throw error;
            } catch (err) {
                this.showAlert(`Error al actualizar estado en Supabase: ${err.message}`, 'danger');
                return;
            }
        } else {
            const idx = state.packages.findIndex(p => p.id === pkgId);
            if (idx !== -1) {
                state.packages[idx].status = newStatus;
                saveStateLocal();
            }
        }
        
        await loadState();
        this.showAlert('Estado del paquete actualizado.', 'success');
        this.closeModal('modal-change-status');
        this.renderAll();
    },

    // Detailed Invoice calculation and presentation
    viewInvoiceDetail: function(pkgId) {
        const pkg = state.packages.find(p => p.id === pkgId);
        if (!pkg) return;
        
        const user = state.users.find(u => u.lockerCode === pkg.lockerCode);
        const calc = this.calculatePackageInvoicing(pkg);
        const s = state.settings;
        
        const body = document.getElementById('modal-invoice-body');
        
        // Set dynamic action for the "Mark as Paid" button in modal footer
        const payBtn = document.getElementById('btn-mark-paid');
        if (pkg.invoiceStatus === 'Pagado') {
            payBtn.textContent = 'Revertir a Pendiente';
            payBtn.className = 'btn btn-secondary';
            payBtn.onclick = () => this.toggleInvoicePayment(pkg.id, 'Pendiente', null, null);
        } else {
            payBtn.textContent = 'Marcar como Pagado / Cobrado';
            payBtn.className = 'btn btn-primary';
            payBtn.onclick = () => this.openPaymentModal(pkg.id);
        }
        
        body.innerHTML = `
            <div class="invoice-detail">
                <div class="invoice-header">
                    <div class="invoice-header-left">
                        <h4>PAKKI LIQUIDACIÓN</h4>
                        <p style="font-size:0.75rem; color:var(--text-muted);">Ref: INV-${pkg.id.split('_')[1]}</p>
                    </div>
                    <div class="invoice-header-right">
                        <span class="badge ${pkg.invoiceStatus === 'Pagado' ? 'badge-success' : 'badge-warning'}">${pkg.invoiceStatus || 'Pendiente'}</span>
                        ${pkg.invoiceStatus === 'Pagado' && pkg.paymentProofFileData
                            ? `<p style="margin-top:0.35rem;"><a href="${pkg.paymentProofFileData}" target="_blank" style="font-size:0.75rem; color:var(--success); font-weight:600;">📎 Ver soporte de pago</a></p>`
                            : `<p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">Fecha: ${pkg.dateReceived}</p>`}
                    </div>
                </div>
                
                <div>
                    <h5 class="invoice-section-title">Información del Cliente</h5>
                    <div class="invoice-grid">
                        <div class="invoice-grid-item"><span>Nombre:</span> ${user ? user.name : 'N/A'}</div>
                        <div class="invoice-grid-item"><span>Casillero:</span> <strong style="color:var(--primary);">${pkg.lockerCode}</strong></div>
                        <div class="invoice-grid-item"><span>Documento:</span> ${user ? user.doc : 'N/A'}</div>
                        <div class="invoice-grid-item"><span>Ciudad Destino:</span> ${user ? user.city : 'N/A'}</div>
                        <div class="invoice-grid-item" style="grid-column: 1 / -1;"><span>Dirección:</span> ${user ? user.address : 'N/A'}</div>
                    </div>
                </div>

                <div>
                    <h5 class="invoice-section-title">Detalle de la Mercancía</h5>
                    <div class="invoice-grid">
                        <div class="invoice-grid-item"><span>Tracking:</span> ${pkg.tracking}</div>
                        <div class="invoice-grid-item"><span>Transportadora:</span> ${pkg.carrier}</div>
                        <div class="invoice-grid-item"><span>Descripción:</span> ${pkg.description}</div>
                        <div class="invoice-grid-item"><span>Valor Declarado:</span> $${pkg.value.toFixed(2)} USD <small style="color:var(--text-muted);">(${fmtCOP(pkg.value)})</small></div>
                    </div>
                </div>

                <div>
                    <h5 class="invoice-section-title">Cálculo de Pesos</h5>
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th>Peso Físico (A)</th>
                                <th>Dimensiones (L x A x H)</th>
                                <th>Peso Volumétrico (B) *</th>
                                <th>Peso Liquidable (Max)</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${pkg.weightLbs} Lbs</td>
                                <td>${pkg.lengthIn}" x ${pkg.widthIn}" x ${pkg.heightIn}"</td>
                                <td>${calc.volWeight} Lbs</td>
                                <td><strong style="color:var(--secondary);">${calc.chargeableWeight} Lbs</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    <p style="font-size:0.7rem; color:var(--text-muted); margin-top:0.5rem;">* Fórmula Volumétrica: (Largo x Ancho x Alto) / 166. Factor internacional IATA de carga aérea.</p>
                </div>

                <div>
                    <h5 class="invoice-section-title">Cálculos Logísticos</h5>
                    <div class="invoice-total-section">
                        <div class="invoice-total-row">
                            <span>Flete Base (${calc.chargeableWeight} Lbs &times; $${s.baseRatePerLb.toFixed(2)} USD)${pkg.freightOverride != null ? ' <span title="Valor ajustado manualmente" style="color:var(--warning); font-size:0.75em;">✏️</span>' : ''}:</span>
                            <span>$${calc.freight.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.freight)}</small></span>
                        </div>
                        <div class="invoice-total-row">
                            <span>Cargo de Manejo Bodega${pkg.handlingOverride != null ? ' <span title="Valor ajustado manualmente" style="color:var(--warning); font-size:0.75em;">✏️</span>' : ''}:</span>
                            <span>$${calc.handling.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.handling)}</small></span>
                        </div>
                        <div class="invoice-total-row">
                            <span>Seguro Comercial (${s.insurancePercent}% del Valor)${pkg.insuranceOverride != null ? ' <span title="Valor ajustado manualmente" style="color:var(--warning); font-size:0.75em;">✏️</span>' : ''}:</span>
                            <span>$${calc.insurance.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.insurance)}</small></span>
                        </div>
                        <div class="invoice-total-row">
                            <span>Recargo Combustible (${s.fuelSurchargePercent}% del Flete)${pkg.fuelOverride != null ? ' <span title="Valor ajustado manualmente" style="color:var(--warning); font-size:0.75em;">✏️</span>' : ''}:</span>
                            <span>$${calc.fuel.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.fuel)}</small></span>
                        </div>
                        <div class="invoice-total-row">
                            <span>Impuestos Aduana (IVA ${s.vatPercent}% ${pkg.value > s.vatThresholdUsd ? '> $200 USD' : 'Exento < $200 USD'})${pkg.taxOverride != null ? ' <span title="Valor ajustado manualmente" style="color:var(--warning); font-size:0.75em;">✏️</span>' : ''}:</span>
                            <span>$${calc.tax.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.tax)}</small></span>
                        </div>
                        <div class="invoice-total-row grand-total">
                            <span>TOTAL A LIQUIDAR:</span>
                            <span>$${calc.total.toFixed(2)} USD<br><span style="font-size:0.88em;">${fmtCOP(calc.total)}</span></span>
                        </div>
                    </div>
                    <p style="font-size:0.7rem; color:var(--text-muted); margin-top:0.75rem;">TRM aplicada: $${(s.trm||4000).toLocaleString('es-CO')} COP/USD</p>
                </div>
            </div>
        `;

        this._currentInvoicePkgId = pkgId;
        this.openModal('modal-invoice-detail');
    },

    // Guarda el pkgId activo para que "Editar Datos" sepa qué paquete modificar
    _currentInvoicePkgId: null,

    openEditPackage: function() {
        const pkgId = this._currentInvoicePkgId;
        const pkg = pkgId ? state.packages.find(p => p.id === pkgId) : null;
        if (!pkg) { this.showAlert('No se pudo identificar el paquete.', 'danger'); return; }

        // Identificación
        document.getElementById('edit-pkg-id').value = pkg.id;
        document.getElementById('edit-pkg-locker').textContent = pkg.lockerCode;
        document.getElementById('edit-pkg-date').textContent = pkg.dateReceived || '—';

        // Campos editables
        document.getElementById('edit-pkg-tracking').value = pkg.tracking || '';
        document.getElementById('edit-pkg-value').value = pkg.value || '';
        document.getElementById('edit-pkg-desc').value = pkg.description || '';
        document.getElementById('edit-pkg-weight').value = pkg.weightLbs || '';
        document.getElementById('edit-pkg-length').value = pkg.lengthIn || '';
        document.getElementById('edit-pkg-width').value = pkg.widthIn || '';
        document.getElementById('edit-pkg-height').value = pkg.heightIn || '';
        document.getElementById('edit-pkg-status').value = pkg.status || 'En Bodega Miami';

        // Cargos logísticos: mostrar override si existe, si no dejar vacío (placeholder = Auto)
        const calc = this.calculatePackageInvoicing(pkg);
        document.getElementById('edit-pkg-freight').value   = pkg.freightOverride   != null ? pkg.freightOverride   : '';
        document.getElementById('edit-pkg-handling').value  = pkg.handlingOverride  != null ? pkg.handlingOverride  : '';
        document.getElementById('edit-pkg-insurance').value = pkg.insuranceOverride != null ? pkg.insuranceOverride : '';
        document.getElementById('edit-pkg-fuel').value      = pkg.fuelOverride      != null ? pkg.fuelOverride      : '';
        document.getElementById('edit-pkg-tax').value       = pkg.taxOverride       != null ? pkg.taxOverride       : '';
        // Update placeholders with the current auto-calculated values
        document.getElementById('edit-pkg-freight').placeholder   = `Auto (${calc.freightCalc})`;
        document.getElementById('edit-pkg-handling').placeholder  = `Auto (${calc.handlingCalc})`;
        document.getElementById('edit-pkg-insurance').placeholder = `Auto (${calc.insuranceCalc})`;
        document.getElementById('edit-pkg-fuel').placeholder      = `Auto (${calc.fuelCalc})`;
        document.getElementById('edit-pkg-tax').placeholder       = `Auto (${calc.taxCalc})`;

        // Transportadora
        const knownCarriers = ['Amazon Log', 'UPS', 'FedEx', 'USPS', 'DHL'];
        const sel = document.getElementById('edit-pkg-carrier');
        const selOther = document.getElementById('edit-pkg-carrier-other');
        const carrierVal = pkg.carrier || '';
        if (knownCarriers.includes(carrierVal)) {
            sel.value = carrierVal;
            selOther.style.display = 'none';
            selOther.required = false;
            selOther.value = '';
        } else if (carrierVal) {
            sel.value = 'Otro';
            selOther.style.display = 'block';
            selOther.required = true;
            selOther.value = carrierVal;
        } else {
            sel.value = '';
            selOther.style.display = 'none';
            selOther.required = false;
        }

        this.openModal('modal-edit-package');
    },

    _editPkgMsg: function(text, type) {
        const el = document.getElementById('edit-pkg-msg');
        if (!el) return;
        el.style.display = 'block';
        el.style.background = type === 'error' ? '#fee2e2' : type === 'warn' ? '#fef9c3' : '#dcfce7';
        el.style.color     = type === 'error' ? '#991b1b' : type === 'warn' ? '#854d0e' : '#166534';
        el.style.border    = `1px solid ${type === 'error' ? '#fca5a5' : type === 'warn' ? '#fde047' : '#86efac'}`;
        el.innerHTML = text;
    },

    handleSavePackageEdit: async function() {
        const msgEl = document.getElementById('edit-pkg-msg');
        if (msgEl) msgEl.style.display = 'none';

        const pkgId = document.getElementById('edit-pkg-id').value;
        const carrier = resolveCarrier('edit-pkg-carrier', 'edit-pkg-carrier-other');
        if (!carrier) { this._editPkgMsg('Selecciona la transportadora.', 'error'); return; }

        // Helper: parse override — empty string means "restore auto-calc" (null)
        const parseOverride = id => {
            const v = document.getElementById(id).value;
            return v === '' ? null : parseFloat(v);
        };

        // Core fields (columns that always exist in the table)
        const coreUpdates = {
            tracking:    document.getElementById('edit-pkg-tracking').value.trim(),
            carrier,
            value:       parseFloat(document.getElementById('edit-pkg-value').value),
            description: document.getElementById('edit-pkg-desc').value.trim(),
            weightLbs:   parseFloat(document.getElementById('edit-pkg-weight').value),
            lengthIn:    parseInt(document.getElementById('edit-pkg-length').value),
            widthIn:     parseInt(document.getElementById('edit-pkg-width').value),
            heightIn:    parseInt(document.getElementById('edit-pkg-height').value),
            status:      document.getElementById('edit-pkg-status').value
        };

        // Override fields (require ALTER TABLE — columns added separately)
        const overrideUpdates = {
            freightOverride:   parseOverride('edit-pkg-freight'),
            handlingOverride:  parseOverride('edit-pkg-handling'),
            insuranceOverride: parseOverride('edit-pkg-insurance'),
            fuelOverride:      parseOverride('edit-pkg-fuel'),
            taxOverride:       parseOverride('edit-pkg-tax')
        };

        // Feedback inmediato en el botón
        const saveBtn = document.querySelector('#form-edit-package button[type="submit"]');
        const origText = saveBtn ? saveBtn.textContent : '';
        if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = 'Guardando…'; }

        if (useSupabase) {
            // Step 1: campos base (siempre existen en la tabla)
            const { error: e1 } = await supabaseClient.from('packages').update(coreUpdates).eq('id', pkgId);
            if (e1) {
                console.error('Supabase error (core):', e1);
                this._editPkgMsg(`Error al guardar: ${e1.message || e1.details || JSON.stringify(e1)}`, 'error');
                if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = origText; }
                return;
            }

            // Step 2: columnas nuevas — falla silencioso si no se ha corrido el ALTER TABLE
            const { error: e2 } = await supabaseClient.from('packages').update(overrideUpdates).eq('id', pkgId);
            if (e2) console.warn('Override columns not yet in table:', e2.message);
        }

        // Refrescar solo este paquete desde Supabase para que los cálculos usen datos reales
        const idx = state.packages.findIndex(p => p.id === pkgId);
        if (useSupabase) {
            const { data: fresh } = await supabaseClient.from('packages').select('*').eq('id', pkgId).single();
            if (fresh && idx !== -1) {
                // Merge: aplicar también overrides en memoria si las columnas aún no existen en Supabase
                state.packages[idx] = Object.assign({}, fresh, {
                    freightOverride:   overrideUpdates.freightOverride,
                    handlingOverride:  overrideUpdates.handlingOverride,
                    insuranceOverride: overrideUpdates.insuranceOverride,
                    fuelOverride:      overrideUpdates.fuelOverride,
                    taxOverride:       overrideUpdates.taxOverride
                });
            }
        } else {
            if (idx !== -1) Object.assign(state.packages[idx], coreUpdates, overrideUpdates);
            saveStateLocal();
        }

        if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = origText; }
        this.closeModal('modal-edit-package');
        this.showAlert('✔ Datos del paquete actualizados correctamente.', 'success');
        this.viewInvoiceDetail(pkgId);
        this.renderAll();
    },

    openPaymentModal: function(pkgId) {
        document.getElementById('payment-pkg-id').value = pkgId;
        document.getElementById('payment-proof-file').value = '';
        this.openModal('modal-payment-proof');
    },

    handleConfirmPayment: async function() {
        const pkgId = document.getElementById('payment-pkg-id').value;
        const fileInput = document.getElementById('payment-proof-file');

        let paymentProofFileName = '';
        let paymentProofFileData = '';

        if (fileInput && fileInput.files[0]) {
            const file = fileInput.files[0];
            if (file.size > 3 * 1024 * 1024) {
                this.showAlert('El archivo supera el límite de 3 MB.', 'warning');
                return;
            }
            paymentProofFileName = file.name;
            paymentProofFileData = await new Promise(resolve => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
        }

        this.closeModal('modal-payment-proof');
        await this.toggleInvoicePayment(pkgId, 'Pagado', paymentProofFileName, paymentProofFileData);
    },

    toggleInvoicePayment: async function(pkgId, newStatus, paymentProofFileName, paymentProofFileData) {
        if (useSupabase) {
            // Step 1: update invoiceStatus (column always exists)
            const { error: e1 } = await supabaseClient.from('packages').update({ invoiceStatus: newStatus }).eq('id', pkgId);
            if (e1) {
                console.error('Supabase error (invoiceStatus):', e1);
                this.showAlert(`Error al cambiar estado de pago: ${e1.message || JSON.stringify(e1)}`, 'danger');
                return;
            }

            // Step 2: save proof columns (require ALTER TABLE)
            const proofData = newStatus === 'Pagado'
                ? { paymentProofFileName: paymentProofFileName || '', paymentProofFileData: paymentProofFileData || '' }
                : { paymentProofFileName: '', paymentProofFileData: '' };

            const { error: e2 } = await supabaseClient.from('packages').update(proofData).eq('id', pkgId);
            if (e2) {
                console.warn('Supabase error (proof columns):', e2);
                // Estado ya guardado; solo avisa sobre las columnas
                this.showAlert(
                    `Pago marcado como <strong>${newStatus}</strong>, pero el soporte de pago requiere ejecutar el ALTER TABLE en Supabase.<br>
                     <small style="font-family:monospace;">${e2.message || JSON.stringify(e2)}</small>`,
                    'warning'
                );
                await loadState();
                this.closeModal('modal-invoice-detail');
                this.renderAll();
                return;
            }
        } else {
            const proofData = newStatus === 'Pagado'
                ? { paymentProofFileName: paymentProofFileName || '', paymentProofFileData: paymentProofFileData || '' }
                : { paymentProofFileName: '', paymentProofFileData: '' };
            const idx = state.packages.findIndex(p => p.id === pkgId);
            if (idx !== -1) Object.assign(state.packages[idx], { invoiceStatus: newStatus }, proofData);
            saveStateLocal();
        }

        await loadState();
        this.showAlert(`Estado de pago cambiado a: <strong>${newStatus}</strong>`, 'success');
        this.closeModal('modal-invoice-detail');
        this.renderAll();
    },

    printInvoice: function() {
        window.print();
    },

    // COMPRAMOS POR TI (admin)
    renderPurchaseRequestsList: function() {
        const tbody = document.getElementById('table-pr-body');
        if (!tbody) return;

        const filterVal = document.getElementById('filter-pr-status').value;
        const requests = (state.purchaseRequests || []).filter(r => filterVal === 'all' || r.status === filterVal);

        if (requests.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align:center; color:var(--text-muted);">No hay solicitudes registradas${filterVal !== 'all' ? ' con este estado' : ''}.</td></tr>`;
            return;
        }

        tbody.innerHTML = '';
        [...requests].reverse().forEach(req => {
            const statusColors = {
                'Pendiente': 'badge-warning',
                'En Proceso': 'badge-info',
                'Completado': 'badge-success',
                'Cancelado': 'badge-danger'
            };
            const badgeClass = statusColors[req.status] || 'badge-neutral';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${req.dateCreated}</td>
                <td><strong style="color:var(--primary);">${req.lockerCode}</strong></td>
                <td>${req.clientName}</td>
                <td style="max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${req.productName}">${req.productName}</td>
                <td>${req.store}</td>
                <td style="text-align:center;">${req.quantity}</td>
                <td>${req.estimatedWeightLbs} Lbs</td>
                <td style="text-align:center;">${req.insure ? '<span class="badge badge-success">Sí</span>' : '<span class="badge badge-neutral">No</span>'}</td>
                <td>${req.deliveryCity}</td>
                <td><span class="badge ${badgeClass}">${req.status}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="app.viewPRDetail('${req.id}')">Ver</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    viewPRDetail: function(prId) {
        const req = (state.purchaseRequests || []).find(r => r.id === prId);
        if (!req) return;

        document.getElementById('pr-modal-id').value = req.id;
        document.getElementById('pr-new-status').value = req.status;

        const statusColors = {
            'Pendiente': 'badge-warning',
            'En Proceso': 'badge-info',
            'Completado': 'badge-success',
            'Cancelado': 'badge-danger'
        };

        document.getElementById('modal-pr-body').innerHTML = `
            <div class="invoice-detail">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:1rem; padding-bottom:0.75rem; border-bottom:1px solid var(--border-color);">
                    <div>
                        <h4 style="font-family:var(--font-heading); font-size:1.1rem; margin-bottom:0.25rem;">${req.productName}</h4>
                        <span class="badge ${statusColors[req.status] || 'badge-neutral'}">${req.status}</span>
                    </div>
                    <div style="text-align:right; font-size:0.8rem; color:var(--text-muted);">
                        <p>${req.dateCreated}</p>
                        <strong style="color:var(--primary);">${req.lockerCode}</strong>
                    </div>
                </div>

                <div class="invoice-grid" style="margin-bottom:1rem;">
                    <div class="invoice-grid-item"><span>Cliente:</span> ${req.clientName}</div>
                    <div class="invoice-grid-item"><span>Ciudad entrega:</span> ${req.deliveryCity}</div>
                    <div class="invoice-grid-item"><span>Tienda:</span> ${req.store}</div>
                    <div class="invoice-grid-item"><span>Cantidad:</span> ${req.quantity}</div>
                    <div class="invoice-grid-item"><span>Peso estimado:</span> ${req.estimatedWeightLbs} Lbs</div>
                    <div class="invoice-grid-item"><span>Seguro:</span> ${req.insure ? '<strong style="color:var(--success);">Sí (5 USD / $100 USD)</strong>' : 'No'}</div>
                </div>

                <div style="margin-bottom:1rem;">
                    <p style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.4rem;">Características</p>
                    <p style="font-size:0.9rem;">${req.characteristics}</p>
                </div>

                <div>
                    <p style="font-size:0.8rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; margin-bottom:0.4rem;">URL del Producto</p>
                    <a href="${req.url}" target="_blank" rel="noopener" style="color:var(--primary); font-size:0.85rem; word-break:break-all;">${req.url} ↗</a>
                </div>
            </div>
        `;

        this.openModal('modal-pr-detail');
    },

    handleUpdatePRStatus: async function() {
        const prId = document.getElementById('pr-modal-id').value;
        const newStatus = document.getElementById('pr-new-status').value;

        const idx = (state.purchaseRequests || []).findIndex(r => r.id === prId);
        if (idx === -1) return;

        const req = state.purchaseRequests[idx];
        state.purchaseRequests[idx].status = newStatus;

        if (useSupabase) {
            await supabaseClient.from('purchase_requests').update({ status: newStatus }).eq('id', prId);
        } else {
            saveStateLocal();
        }

        await sendStatusNotification(req, newStatus);

        this.showAlert(`Estado actualizado a <strong>${newStatus}</strong>. Notificación enviada.`, 'success');
        this.closeModal('modal-pr-detail');
        this.renderPurchaseRequestsList();
    },

    // COTIZADOR
    renderCotizadorConfig: function() {
        const s = state.settings;
        document.getElementById('cot-trm').value = s.trm || 4000;
        document.getElementById('cot-flete-primera-lb').value = s.cotizFletePrimeraLb || 5;
        document.getElementById('cot-flete-adicional-lb').value = s.cotizFleteAdicionalLb || 3.50;
        document.getElementById('cot-iva-pct').value = s.cotizIvaPercent !== undefined ? s.cotizIvaPercent : 19;
        document.getElementById('cot-arancel-pct').value = s.cotizArancelPercent !== undefined ? s.cotizArancelPercent : 10;
        document.getElementById('cot-seguro-pct').value = s.cotizSeguroPercent || 2;
        document.getElementById('cot-domicilio-usd').value = s.cotizDomicilioUsd || 4;
        document.getElementById('cot-servicio-pct').value = s.cotizServicioCompraPercent || 5;
        document.getElementById('cot-corp-lb-usd').value = s.cotizCorpLbUsd || 8;
        document.getElementById('cot-corp-min-lbs').value = s.cotizCorpMinLbs || 10;
    },

    handleSaveCotizadorConfig: async function() {
        const updates = {
            trm: parseFloat(document.getElementById('cot-trm').value),
            cotizFletePrimeraLb: parseFloat(document.getElementById('cot-flete-primera-lb').value),
            cotizFleteAdicionalLb: parseFloat(document.getElementById('cot-flete-adicional-lb').value),
            cotizIvaPercent: parseFloat(document.getElementById('cot-iva-pct').value),
            cotizArancelPercent: parseFloat(document.getElementById('cot-arancel-pct').value),
            cotizSeguroPercent: parseFloat(document.getElementById('cot-seguro-pct').value),
            cotizDomicilioUsd: parseFloat(document.getElementById('cot-domicilio-usd').value),
            cotizServicioCompraPercent: parseFloat(document.getElementById('cot-servicio-pct').value),
            cotizCorpLbUsd: parseFloat(document.getElementById('cot-corp-lb-usd').value),
            cotizCorpMinLbs: parseInt(document.getElementById('cot-corp-min-lbs').value),
        };

        state.settings = { ...state.settings, ...updates };

        if (useSupabase) {
            try {
                const { error } = await supabaseClient.from('settings').upsert([{ id: 'global', ...state.settings }]);
                if (error) throw error;
            } catch (err) {
                this.showAlert(`Error al guardar tarifas en Supabase: ${err.message}`, 'danger');
                return;
            }
        } else {
            saveStateLocal();
        }

        this.showAlert('Tarifas del cotizador actualizadas correctamente.', 'success');
    },

    _cotizMode: 'natural',

    setCotizMode: function(mode) {
        this._cotizMode = mode;
        const isNatural = mode === 'natural';
        document.getElementById('btn-mode-natural').style.background = isNatural ? 'var(--primary)' : 'var(--bg-secondary)';
        document.getElementById('btn-mode-natural').style.color = isNatural ? '#fff' : 'var(--text-muted)';
        document.getElementById('btn-mode-corp').style.background = !isNatural ? 'var(--secondary)' : 'var(--bg-secondary)';
        document.getElementById('btn-mode-corp').style.color = !isNatural ? '#fff' : 'var(--text-muted)';

        const s = state.settings;
        const infoEl = document.getElementById('cot-mode-info');
        if (isNatural) {
            infoEl.style.background = '#eff6ff'; infoEl.style.color = '#1e40af'; infoEl.style.borderColor = '#bfdbfe';
            infoEl.innerHTML = `<strong>Persona Natural:</strong> 1ª libra $${(s.cotizFletePrimeraLb||5).toFixed(2)} USD + adicionales $${(s.cotizFleteAdicionalLb||3.50).toFixed(2)} USD. Si el valor declarado supera los <strong>$200 USD</strong> se aplican automáticamente IVA ${s.cotizIvaPercent||19}% + Arancel ${s.cotizArancelPercent||10}%.`;
        } else {
            infoEl.style.background = '#f0fdf4'; infoEl.style.color = '#166534'; infoEl.style.borderColor = '#bbf7d0';
            infoEl.innerHTML = `<strong>Corporativo:</strong> Mínimo ${s.cotizCorpMinLbs||10} libras facturables a $${(s.cotizCorpLbUsd||8).toFixed(2)} USD por libra. <strong>Sin IVA ni Arancel</strong>.`;
        }
        document.getElementById('cot-results-card').style.display = 'none';
    },

    _buildCotizData: function() {
        const valorUsd = parseFloat(document.getElementById('cot-valor').value) || 0;
        const pesoLbs = parseFloat(document.getElementById('cot-peso').value) || 0;
        const otrosCargos = parseFloat(document.getElementById('cot-otros-cargos').value) || 0;
        const incluyeSeguro = document.getElementById('cot-chk-seguro').checked;
        const incluyeDomicilio = document.getElementById('cot-chk-domicilio').checked;
        const incluyeServicio = document.getElementById('cot-chk-servicio').checked;
        const s = state.settings;
        const trm = s.trm || 4000;
        const seguroPercent = s.cotizSeguroPercent || 2;
        const domicilioUsd = s.cotizDomicilioUsd || 4;
        const servicioPercent = s.cotizServicioCompraPercent || 5;

        let flete, fleteLabel, iva = 0, arancel = 0, modoTexto;

        if (this._cotizMode === 'corporativo') {
            const lbUsd = s.cotizCorpLbUsd || 8;
            const minLbs = s.cotizCorpMinLbs || 10;
            const pesoFacturable = Math.max(Math.ceil(pesoLbs), minLbs);
            flete = pesoFacturable * lbUsd;
            const minNota = pesoLbs < minLbs ? ` &mdash; mínimo ${minLbs} Lbs aplicado` : (pesoFacturable !== pesoLbs ? ` &mdash; redondeado de ${pesoLbs} Lbs` : '');
            fleteLabel = `Flete Corporativo (${pesoFacturable} Lbs &times; $${lbUsd.toFixed(2)}${minNota})`;
            modoTexto = 'Corporativo';
        } else {
            const fletePrimera = s.cotizFletePrimeraLb || 5;
            const fleteAdicional = s.cotizFleteAdicionalLb || 3.50;
            const ivaPercent = s.cotizIvaPercent !== undefined ? s.cotizIvaPercent : 19;
            const arancelPercent = s.cotizArancelPercent !== undefined ? s.cotizArancelPercent : 10;
            const pesoFacturable = pesoLbs > 0 ? Math.ceil(pesoLbs) : 0;
            flete = pesoFacturable <= 0 ? 0 : pesoFacturable <= 1 ? fletePrimera : fletePrimera + (pesoFacturable - 1) * fleteAdicional;
            const redNota = pesoFacturable !== pesoLbs ? ` &mdash; redondeado de ${pesoLbs} Lbs` : '';
            fleteLabel = pesoFacturable <= 1
                ? `Flete (${pesoFacturable} Lb &mdash; 1ª libra${redNota})`
                : `Flete (1&ordf; Lb $${fletePrimera.toFixed(2)} + ${pesoFacturable-1} Lbs &times; $${fleteAdicional.toFixed(2)}${redNota})`;
            const aplicaImpuestos = valorUsd > 200;
            iva = aplicaImpuestos ? valorUsd * (ivaPercent / 100) : 0;
            arancel = aplicaImpuestos ? valorUsd * (arancelPercent / 100) : 0;
            modoTexto = `Persona Natural${!aplicaImpuestos ? ' (valor ≤ $200 USD — sin impuestos)' : ` (valor > $200 USD — IVA ${ivaPercent}% + Arancel ${arancelPercent}%)` }`;
        }

        const seguro = incluyeSeguro ? valorUsd * (seguroPercent / 100) : 0;
        const domicilio = incluyeDomicilio ? domicilioUsd : 0;
        const servicio = incluyeServicio ? valorUsd * (servicioPercent / 100) : 0;
        const totalUsd = flete + iva + arancel + seguro + domicilio + servicio + otrosCargos;

        return { valorUsd, pesoLbs, otrosCargos, trm, flete, fleteLabel, iva, arancel, seguro, seguroPercent, domicilio, domicilioUsd, servicio, servicioPercent, totalUsd, modoTexto, incluyeSeguro, incluyeDomicilio, incluyeServicio };
    },

    calcularCotizacion: function() {
        const valorUsd = parseFloat(document.getElementById('cot-valor').value) || 0;
        const pesoLbs = parseFloat(document.getElementById('cot-peso').value) || 0;
        if (valorUsd <= 0 && pesoLbs <= 0) {
            this.showAlert('Ingresa al menos el valor declarado o el peso para calcular.', 'warning');
            return;
        }

        const d = this._buildCotizData();
        const trm = d.trm;
        const fmtUsd = (v) => `$${v.toFixed(2)} USD`;
        const fmtCop = (v) => `$${Math.round(v * trm).toLocaleString('es-CO')} COP`;

        const filas = [
            { label: d.fleteLabel, usd: d.flete, mostrar: true },
            { label: `IVA (${state.settings.cotizIvaPercent||19}% del valor declarado)`, usd: d.iva, mostrar: d.iva > 0 },
            { label: `Arancel (${state.settings.cotizArancelPercent||10}% del valor declarado)`, usd: d.arancel, mostrar: d.arancel > 0 },
            { label: `Seguro (${d.seguroPercent}% del valor declarado)`, usd: d.seguro, mostrar: d.incluyeSeguro },
            { label: `Servicio de Compra (${d.servicioPercent}%)`, usd: d.servicio, mostrar: d.incluyeServicio },
            { label: `Domicilio (cargo fijo $${d.domicilioUsd.toFixed(2)} USD)`, usd: d.domicilio, mostrar: d.incluyeDomicilio },
            { label: 'Otros Cargos', usd: d.otrosCargos, mostrar: d.otrosCargos > 0 },
        ];

        let html = `
            <div style="font-size:0.78rem; margin-bottom:0.75rem; padding:0.4rem 0.5rem; background:var(--bg-app); border-radius:6px; color:var(--text-muted);">
                Modalidad: <strong style="color:var(--text-primary);">${d.modoTexto}</strong>
            </div>
            <div class="invoice-total-section">
                <div class="cot-total-row header">
                    <span>Concepto</span><span>USD</span>
                    <span>COP &nbsp;(TRM: ${trm.toLocaleString('es-CO')})</span>
                </div>`;

        filas.filter(f => f.mostrar).forEach(f => {
            html += `<div class="cot-total-row"><span>${f.label}</span><span>${fmtUsd(f.usd)}</span><span>${fmtCop(f.usd)}</span></div>`;
        });

        html += `
                <div class="cot-total-row grand-total">
                    <span>TOTAL ESTIMADO</span>
                    <span>$${d.totalUsd.toFixed(2)} USD</span>
                    <span>$${Math.round(d.totalUsd * trm).toLocaleString('es-CO')} COP</span>
                </div>
            </div>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:1rem; padding:0 0.5rem;">
                * Estimado basado en valor declarado de <strong>$${d.valorUsd.toFixed(2)} USD</strong> y peso de <strong>${d.pesoLbs} Lbs</strong>. Los valores finales pueden variar.
            </p>`;

        document.getElementById('cot-breakdown-content').innerHTML = html;
        document.getElementById('cot-fecha-resultado').textContent = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        document.getElementById('cot-results-card').style.display = 'block';
        document.getElementById('cot-results-card').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    },

    limpiarCotizacion: function() {
        document.getElementById('cot-valor').value = '';
        document.getElementById('cot-peso').value = '';
        document.getElementById('cot-otros-cargos').value = '0';
        ['cot-chk-seguro', 'cot-chk-domicilio', 'cot-chk-servicio'].forEach(id => {
            document.getElementById(id).checked = false;
        });
        document.getElementById('cot-results-card').style.display = 'none';
        document.getElementById('cot-breakdown-content').innerHTML = '';
        this.setCotizMode('natural');
    },

    imprimirCotizacion: function() {
        const d = this._buildCotizData();
        const fmt = (v) => v.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const trm = d.trm;

        const filas = [
            { label: d.fleteLabel.replace(/&mdash;/g, '—').replace(/&ordf;/g, 'ª').replace(/&times;/g, '×'), usd: d.flete, mostrar: true },
            { label: `IVA (${state.settings.cotizIvaPercent||19}% del valor declarado)`, usd: d.iva, mostrar: d.iva > 0 },
            { label: `Arancel (${state.settings.cotizArancelPercent||10}% del valor declarado)`, usd: d.arancel, mostrar: d.arancel > 0 },
            { label: `Seguro (${d.seguroPercent}% del valor declarado)`, usd: d.seguro, mostrar: d.incluyeSeguro },
            { label: `Servicio de Compra (${d.servicioPercent}%)`, usd: d.servicio, mostrar: d.incluyeServicio },
            { label: `Domicilio (cargo fijo)`, usd: d.domicilio, mostrar: d.incluyeDomicilio },
            { label: 'Otros Cargos', usd: d.otrosCargos, mostrar: d.otrosCargos > 0 },
        ].filter(f => f.mostrar);

        const filasHtml = filas.map(f => `
            <tr><td>${f.label}</td><td>$${f.usd.toFixed(2)}</td><td>$${fmt(Math.round(f.usd * trm))}</td></tr>
        `).join('');

        const fecha = new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const modoTexto = d.modoTexto.replace(/[≤>]/g, m => m === '≤' ? '≤' : '>');

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Cotización Pakki Casillero</title>
<style>
    body { font-family: Arial, sans-serif; padding: 40px; color: #0f172a; font-size: 14px; max-width: 700px; margin: 0 auto; }
    h1 { color: #f97316; font-size: 22px; margin: 0 0 4px 0; }
    .subtitle { color: #64748b; font-size: 12px; margin: 0 0 24px 0; }
    .info-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 24px; }
    .info-box p { margin: 4px 0; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
    thead tr { background: #0f172a; color: white; }
    th { padding: 10px 12px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
    td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .total td { background: #fff7ed; font-weight: 700; font-size: 15px; color: #f97316; border-top: 2px solid #f97316; border-bottom: none; }
    td:not(:first-child), th:not(:first-child) { text-align: right; }
    .footer { margin-top: 24px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 12px; line-height: 1.6; }
</style>
</head>
<body>
    <h1>Pakki Internacional — Cotización de Envío</h1>
    <p class="subtitle">Generada: ${fecha}</p>
    <div class="info-box">
        <p><strong>Modalidad:</strong> ${modoTexto}</p>
        <p><strong>Valor declarado:</strong> $${d.valorUsd.toFixed(2)} USD</p>
        <p><strong>Peso:</strong> ${d.pesoLbs} Libras</p>
        <p><strong>TRM aplicada:</strong> $${fmt(trm)} COP/USD</p>
    </div>
    <table>
        <thead>
            <tr><th>Concepto</th><th>USD</th><th>COP</th></tr>
        </thead>
        <tbody>
            ${filasHtml}
            <tr class="total">
                <td>TOTAL ESTIMADO</td>
                <td>$${d.totalUsd.toFixed(2)} USD</td>
                <td>$${fmt(Math.round(d.totalUsd * trm))} COP</td>
            </tr>
        </tbody>
    </table>
    <div class="footer">
        * Esta cotización es un estimado. Los valores finales pueden variar según el peso real y normativa aduanera vigente.<br>
        Pakki Internacional — administrativo@yotraigo.com
    </div>
</body>
</html>`;

        const ventana = window.open('', '_blank', 'width=800,height=600');
        ventana.document.write(html);
        ventana.document.close();
        ventana.focus();
        setTimeout(() => ventana.print(), 500);
    }
};

// Start application
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Populate data-label for icon tooltips (sidebar icon-only mode on small phones)
document.querySelectorAll('.menu-item a').forEach(link => {
    const span = link.querySelector('span');
    if (span) link.setAttribute('data-label', span.textContent.trim());
});

async function loadTRM(spanId) {
    const el = document.getElementById(spanId);
    if (!el) return;
    try {
        const res = await fetch(
            'https://www.datos.gov.co/resource/32sa-8pi3.json?$limit=1&$order=vigenciadesde+DESC',
            { headers: { 'Accept': 'application/json' } }
        );
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data && data.length > 0 && data[0].valor) {
            const trm = parseFloat(data[0].valor);
            const trmServicio = trm + 300;
            el.textContent = 'USD $' + trmServicio.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        } else {
            el.textContent = 'TRM no disponible';
        }
    } catch (e) {
        el.textContent = 'TRM no disponible';
    }
}
