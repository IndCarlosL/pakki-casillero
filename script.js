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

// Core Application State
let state = {
    users: [],
    prealerts: [],
    packages: [],
    purchaseRequests: [],
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

            state.users = users || [];
            state.prealerts = prealerts || [];
            state.packages = packages || [];
            state.purchaseRequests = purchaseRequests || [];
            
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
        } else {
            state.users = SEED_USERS;
            state.prealerts = SEED_PREALERTS;
            state.packages = SEED_PACKAGES;
            saveStateLocal();
        }
    }
}

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

        // Checkin Package Form
        document.getElementById('form-checkin-package').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCheckinPackage();
        });

        // Search Prealert click in package form
        document.getElementById('btn-search-prealert').addEventListener('click', () => {
            this.handleSearchPrealert();
        });

        // Edit Config Logic Form
        document.getElementById('form-config-logic').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSaveConfig();
        });

        // Live Search Filters
        document.getElementById('search-lockers').addEventListener('input', (e) => {
            this.renderLockersList(e.target.value.trim());
        });

        document.getElementById('search-packages').addEventListener('input', (e) => {
            this.renderPackagesList();
        });

        document.getElementById('filter-packages-status').addEventListener('change', () => {
            this.renderPackagesList();
        });

        document.getElementById('filter-prealert-status').addEventListener('change', () => {
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

        // Search prealert input: enter key triggers search
        document.getElementById('checkin-tracking').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') { e.preventDefault(); this.handleSearchPrealert(); }
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
        
        // 1. Calculate Volumetric Weight: (L x W x H) / 166 (US Standard Air cargo factor)
        const volWeight = (pkg.lengthIn * pkg.widthIn * pkg.heightIn) / 166;
        const volWeightRounded = parseFloat(volWeight.toFixed(2));
        
        // 2. Chargeable Weight is the greater of actual physical weight and volumetric weight
        const chargeableWeight = Math.max(pkg.weightLbs, volWeightRounded);
        
        // 3. Freight Cost = chargeable weight * base shipping rate per lb
        const freightCost = chargeableWeight * s.baseRatePerLb;
        
        // 4. Insurance = Declared Value * Insurance %
        const insuranceCost = pkg.value * (s.insurancePercent / 100);
        
        // 5. Fuel Surcharge = Freight Cost * Fuel Surcharge %
        const fuelSurchargeCost = freightCost * (s.fuelSurchargePercent / 100);
        
        // 6. Taxes: If value exceeds VAT Threshold, apply VAT (19% for DIAN / Colombia)
        const taxCost = pkg.value > s.vatThresholdUsd ? (pkg.value * (s.vatPercent / 100)) : 0;
        
        // 7. Handling Fee
        const handlingFee = s.handlingFee;
        
        // Total Cost
        const grandTotal = freightCost + insuranceCost + fuelSurchargeCost + taxCost + handlingFee;
        
        return {
            volWeight: volWeightRounded,
            chargeableWeight: parseFloat(chargeableWeight.toFixed(2)),
            freight: parseFloat(freightCost.toFixed(2)),
            insurance: parseFloat(insuranceCost.toFixed(2)),
            fuel: parseFloat(fuelSurchargeCost.toFixed(2)),
            tax: parseFloat(taxCost.toFixed(2)),
            handling: parseFloat(handlingFee.toFixed(2)),
            total: parseFloat(grandTotal.toFixed(2))
        };
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
        const prealertSelect = document.getElementById('prealert-locker');
        const checkinSelect = document.getElementById('checkin-locker');
        
        // Keep initial option
        prealertSelect.innerHTML = '<option value="">-- Selecciona un casillero --</option>';
        checkinSelect.innerHTML = '<option value="">-- Selecciona Casillero --</option>';
        
        state.users.forEach(u => {
            const optionText = `${u.lockerCode} - ${u.name} (${u.city})`;
            
            const opt1 = document.createElement('option');
            opt1.value = u.lockerCode;
            opt1.textContent = optionText;
            prealertSelect.appendChild(opt1);
            
            const opt2 = document.createElement('option');
            opt2.value = u.lockerCode;
            opt2.textContent = optionText;
            checkinSelect.appendChild(opt2);
        });
    },

    renderLockersList: function(searchQuery = '') {
        const tbody = document.getElementById('table-lockers-body');
        tbody.innerHTML = '';
        
        const query = searchQuery.toLowerCase();
        const filtered = state.users.filter(u => {
            return u.name.toLowerCase().includes(query) || 
                   u.email.toLowerCase().includes(query) || 
                   u.lockerCode.toLowerCase().includes(query) ||
                   u.doc.toLowerCase().includes(query);
        });
        
        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--text-muted);">No se encontraron casilleros con el criterio de búsqueda.</td></tr>`;
            return;
        }
        
        filtered.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong style="color:var(--primary); font-size:1.05rem;">${u.lockerCode}</strong></td>
                <td><strong>${u.name}</strong></td>
                <td>${u.doc}</td>
                <td>${u.email}</td>
                <td>${u.phone}</td>
                <td>${u.city}</td>
                <td>${u.dateCreated}</td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderPrealertsList: function() {
        const container = document.getElementById('prealerts-list-cards');
        container.innerHTML = '';
        
        const filterVal = document.getElementById('filter-prealert-status').value;
        const filtered = state.prealerts.filter(p => {
            if (filterVal === 'all') return true;
            return p.status === filterVal;
        });
        
        if (filtered.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:2rem; color:var(--text-muted);">No hay prealertas en esta categoría.</p>`;
            return;
        }
        
        // Show as cards on the right side
        filtered.forEach(pre => {
            const user = state.users.find(u => u.lockerCode === pre.lockerCode);
            const userName = user ? user.name : 'Usuario Desconocido';
            const statusBadge = pre.status === 'Pendiente' ? 'badge-warning' : 'badge-success';
            
            const card = document.createElement('div');
            card.className = 'card';
            card.style.padding = '1rem';
            card.style.borderLeft = `4px solid ${pre.status === 'Pendiente' ? 'var(--warning)' : 'var(--success)'}`;
            
            const fileLink = pre.invoiceFileData
                ? `<a href="${pre.invoiceFileData}" target="_blank" style="color:var(--primary); font-weight:600;">📎 ${pre.invoiceFileName || 'Ver soporte'}</a>`
                : '<span style="color:var(--text-muted);">Sin soporte adjunto</span>';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                    <div>
                        <span class="badge ${statusBadge}" style="margin-bottom:0.25rem;">${pre.status}</span>
                        <h4 style="font-size:0.95rem; font-family:var(--font-heading); margin:0;">${pre.tracking}</h4>
                    </div>
                    <strong style="color:var(--primary);">${pre.lockerCode}</strong>
                </div>
                <div style="font-size:0.8rem; color:var(--text-muted);">
                    <p style="margin-bottom:0.25rem;"><strong>Cliente:</strong> ${userName}</p>
                    <p style="margin-bottom:0.25rem;"><strong>Tienda:</strong> ${pre.store || '—'} &nbsp;|&nbsp; <strong>Transporte:</strong> ${pre.carrier}</p>
                    <p style="margin-bottom:0.25rem;"><strong>Producto:</strong> ${pre.description}</p>
                    <p style="margin-bottom:0.25rem;"><strong>Valor:</strong> $${parseFloat(pre.value||0).toFixed(2)} USD &nbsp;|&nbsp; <strong>Peso est.:</strong> ${pre.weightLbs ? pre.weightLbs + ' Lbs' : '—'}</p>
                    <p style="margin-bottom:0.25rem;"><strong>Ciudad entrega:</strong> ${pre.deliveryCity || '—'}</p>
                    <p style="margin-bottom:0.35rem;"><strong>Soporte:</strong> ${fileLink}</p>
                    <p style="font-size:0.75rem; margin-top:0.25rem; text-align:right;">Creado: ${pre.dateCreated}</p>
                </div>
            `;
            container.appendChild(card);
        });
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
                    <button class="btn btn-secondary btn-sm" onclick="app.loadPrealertIntoCheckin('${pre.id}')">
                        ↙ Cargar
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    loadPrealertIntoCheckin: function(preId) {
        const pre = (state.prealerts || []).find(p => p.id === preId);
        if (!pre) return;
        document.getElementById('checkin-tracking').value = pre.tracking;
        document.getElementById('checkin-locker').value = pre.lockerCode;
        const knownCarriers = ['Amazon Log', 'UPS', 'FedEx', 'USPS', 'DHL'];
        const carrierVal = pre.carrier || '';
        if (knownCarriers.includes(carrierVal)) {
            document.getElementById('checkin-carrier').value = carrierVal;
            toggleCarrierOther('checkin-carrier', 'checkin-carrier-other');
        } else {
            document.getElementById('checkin-carrier').value = 'Otro';
            document.getElementById('checkin-carrier-other').style.display = 'block';
            document.getElementById('checkin-carrier-other').required = true;
            document.getElementById('checkin-carrier-other').value = carrierVal;
        }
        document.getElementById('checkin-value').value = pre.value || '';
        document.getElementById('checkin-desc').value = pre.description || '';
        this.showAlert(`Prealerta cargada: <strong>${pre.tracking}</strong>. Completa el peso y dimensiones.`, 'info');
        document.getElementById('checkin-weight').focus();
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
        
        // Auto-generate locker code (PK-XXXX-US)
        let maxSequence = 5015; // seed max
        state.users.forEach(u => {
            const match = u.lockerCode.match(/PK-(\d+)-US/);
            if (match) {
                const seq = parseInt(match[1]);
                if (seq > maxSequence) maxSequence = seq;
            }
        });
        
        const newSequence = maxSequence + 1;
        const lockerCode = `PK-${newSequence}-US`;
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

        if (!lockerCode) {
            this.showAlert('Por favor selecciona un casillero válido.', 'warning');
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
        this.showAlert(`Prealerta para tracking <strong>${tracking}</strong> registrada con éxito.`, 'success');
        document.getElementById('form-register-prealert').reset();
        toggleCarrierOther('prealert-carrier', 'prealert-carrier-other');

        this.renderPrealertsList();
        this.renderMetrics();
    },

    handleSearchPrealert: function() {
        const tracking = document.getElementById('checkin-tracking').value.trim();
        if (!tracking) {
            this.showAlert('Por favor ingresa un número de tracking para buscar.', 'warning');
            return;
        }
        
        const pre = state.prealerts.find(p => p.tracking.toLowerCase() === tracking.toLowerCase());
        if (pre) {
            // Auto fill form
            document.getElementById('checkin-locker').value = pre.lockerCode;
            document.getElementById('checkin-carrier').value = pre.carrier;
            document.getElementById('checkin-value').value = pre.value;
            document.getElementById('checkin-desc').value = pre.description;
            
            this.showAlert(`¡Prealerta encontrada! Datos importados para el casillero <strong>${pre.lockerCode}</strong>.`, 'info');
        } else {
            this.showAlert('No se encontró ninguna prealerta con este número de tracking. Deberás asignar el casillero y declarar los valores de forma manual.', 'warning');
        }
    },

    handleCheckinPackage: async function() {
        const tracking = document.getElementById('checkin-tracking').value.trim();
        const lockerCode = document.getElementById('checkin-locker').value;
        const carrier = resolveCarrier('checkin-carrier', 'checkin-carrier-other');
        if (!carrier) return;
        const weightLbs = parseFloat(document.getElementById('checkin-weight').value);
        const lengthIn = parseInt(document.getElementById('checkin-length').value);
        const widthIn = parseInt(document.getElementById('checkin-width').value);
        const heightIn = parseInt(document.getElementById('checkin-height').value);
        const value = parseFloat(document.getElementById('checkin-value').value);
        const description = document.getElementById('checkin-desc').value.trim();
        
        if (!lockerCode) {
            this.showAlert('Por favor asocia el paquete a un casillero.', 'warning');
            return;
        }

        // Check if package already registered
        const pkgExists = state.packages.some(p => p.tracking.toLowerCase() === tracking.toLowerCase());
        if (pkgExists) {
            this.showAlert('Este paquete ya está registrado en el inventario.', 'danger');
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];
        
        const newPkg = {
            id: `pkg_${Date.now()}`,
            tracking,
            lockerCode,
            carrier,
            weightLbs,
            widthIn,
            heightIn,
            lengthIn,
            value,
            description,
            status: "En Bodega Miami",
            dateReceived: todayStr,
            invoiceStatus: "Pendiente"
        };
        
        if (useSupabase) {
            try {
                // 1. Guardar paquete
                const { error: errPkg } = await supabaseClient.from('packages').insert([newPkg]);
                if (errPkg) throw errPkg;

                // 2. Si hay prealerta, actualizar su estado a 'Recibido'
                const pre = state.prealerts.find(p => p.tracking.toLowerCase() === tracking.toLowerCase());
                if (pre) {
                    const { error: errPre } = await supabaseClient.from('prealerts').update({ status: 'Recibido' }).eq('id', pre.id);
                    if (errPre) throw errPre;
                }
            } catch (err) {
                this.showAlert(`Error al guardar recepción en Supabase: ${err.message}`, 'danger');
                return;
            }
        } else {
            state.packages.push(newPkg);
            const preIndex = state.prealerts.findIndex(p => p.tracking.toLowerCase() === tracking.toLowerCase());
            if (preIndex !== -1) {
                state.prealerts[preIndex].status = "Recibido";
            }
            saveStateLocal();
        }
        
        await loadState();
        this.showAlert(`Paquete con tracking <strong>${tracking}</strong> recibido con éxito en Bodega Miami. Liquidación calculada.`, 'success');
        
        // Clean Form
        document.getElementById('form-checkin-package').reset();
        
        // Re-render
        this.renderAll();
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
            payBtn.textContent = 'Marcar como Pendiente';
            payBtn.className = 'btn btn-secondary';
            payBtn.onclick = () => this.toggleInvoicePayment(pkg.id, 'Pendiente');
        } else {
            payBtn.textContent = 'Marcar como Pagado / Cobrado';
            payBtn.className = 'btn btn-primary';
            payBtn.onclick = () => this.toggleInvoicePayment(pkg.id, 'Pagado');
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
                        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">Fecha: ${pkg.dateReceived}</p>
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
                            <span>Flete Base (${calc.chargeableWeight} Lbs &times; $${s.baseRatePerLb.toFixed(2)} USD):</span>
                            <span>$${calc.freight.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.freight)}</small></span>
                        </div>
                        <div class="invoice-total-row">
                            <span>Cargo de Manejo Bodega:</span>
                            <span>$${calc.handling.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.handling)}</small></span>
                        </div>
                        <div class="invoice-total-row">
                            <span>Seguro Comercial (${s.insurancePercent}% del Valor):</span>
                            <span>$${calc.insurance.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.insurance)}</small></span>
                        </div>
                        <div class="invoice-total-row">
                            <span>Recargo Combustible (${s.fuelSurchargePercent}% del Flete):</span>
                            <span>$${calc.fuel.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.fuel)}</small></span>
                        </div>
                        <div class="invoice-total-row">
                            <span>Impuestos Aduana (IVA ${s.vatPercent}% ${pkg.value > s.vatThresholdUsd ? '> $200 USD' : 'Exento < $200 USD'}):</span>
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

        this.openModal('modal-invoice-detail');
    },

    toggleInvoicePayment: async function(pkgId, newStatus) {
        if (useSupabase) {
            try {
                const { error } = await supabaseClient.from('packages').update({ invoiceStatus: newStatus }).eq('id', pkgId);
                if (error) throw error;
            } catch (err) {
                this.showAlert(`Error al cambiar estado de factura en Supabase: ${err.message}`, 'danger');
                return;
            }
        } else {
            const idx = state.packages.findIndex(p => p.id === pkgId);
            if (idx !== -1) {
                state.packages[idx].invoiceStatus = newStatus;
                saveStateLocal();
            }
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
