// Muestra popup informativo al seleccionar tipo de envío en Miami
function showShippingTypeInfo(type) {
    if (!type) return;
    const SHIPPING_INFO = {
        'Persona Natural': {
            title: '🏠 Casillero Persona Natural',
            color: '#6366f1',
            items: [
                'Máximo <strong>6 artículos de la misma referencia</strong> por envío.',
                'Peso total del paquete <strong>menor a 110 libras (50 kg)</strong>.',
                'Ninguna arista (lado) del paquete puede superar <strong>150 cm</strong>.',
                'El valor total de los artículos <strong>no debe superar los $2,000 USD</strong>.',
            ],
            note: 'Ideal para compras personales y uso doméstico.'
        },
        'Corporativo': {
            title: '🏢 Casillero Corporativo',
            color: '#f97316',
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
    document.getElementById('msti-title').innerHTML = info.title;
    const itemsHtml = info.items.map(i =>
        `<li style="margin-bottom:0.5rem; line-height:1.5;">${i}</li>`
    ).join('');
    document.getElementById('msti-body').innerHTML = `
        <div style="border-left:4px solid ${info.color}; padding:0.75rem 1rem; background:var(--bg-app); border-radius:0 8px 8px 0; margin-bottom:1rem;">
            <p style="font-size:0.85rem; font-weight:600; color:${info.color}; margin-bottom:0.5rem;">Condiciones del servicio</p>
            <ul style="margin:0; padding-left:1.25rem; font-size:0.85rem; color:var(--text-primary);">${itemsHtml}</ul>
        </div>
        <p style="font-size:0.8rem; color:var(--text-muted); text-align:center;">${info.note}</p>
    `;
    clientApp.openModal('modal-shipping-type-info');
}

function fmtCOP(usdVal) {
    const trm = (state && state.settings && state.settings.trm) || 4000;
    return `$${Math.round(usdVal * trm).toLocaleString('es-CO')} COP`;
}

function toggleClientCarrierOther(sel) {
    const inp = document.getElementById('cprealert-carrier-other');
    if (!inp) return;
    const isOther = sel.value === 'Otro';
    inp.style.display = isOther ? 'block' : 'none';
    inp.required = isOther;
    if (!isOther) inp.value = '';
}

// Supabase connection (same credentials as admin panel)
const SUPABASE_URL = "https://uuaglghhsxbzhvbjzgky.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1YWdsZ2hoc3hiemh2Ymp6Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDMxOTgsImV4cCI6MjA5Njc3OTE5OH0.WI317E3WbMLHcS8hFDYnIH8TjCjkL09G55lt3Qd7X6k";

let useSupabase = false;
let supabaseClient = null;

if (typeof supabase !== 'undefined') {
    useSupabase = true;
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
}

// Customer Portal Application logic
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
        vatPercent: 19
    }
};

let loggedUser = null;

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

// Load state from Supabase or localStorage
async function loadGlobalState() {
    if (useSupabase) {
        try {
            const { data: users } = await supabaseClient.from('users').select('*');
            const { data: prealerts } = await supabaseClient.from('prealerts').select('*');
            const { data: packages } = await supabaseClient.from('packages').select('*');
            const { data: settings } = await supabaseClient.from('settings').select('*');

            state.users = users || [];
            state.prealerts = prealerts || [];
            state.packages = packages || [];
            if (settings && settings.length > 0) {
                state.settings = settings.find(s => s.id === 'global') || settings[0];
            }

            // Load purchase requests from Supabase
            const { data: purchaseRequests } = await supabaseClient.from('purchase_requests').select('*');
            state.purchaseRequests = purchaseRequests || [];
            return;
        } catch (err) {
            console.warn('Supabase error, falling back to localStorage:', err.message);
        }
    }

    // localStorage fallback
    const saved = localStorage.getItem('pakki_locker_state');
    if (saved) {
        state = JSON.parse(saved);
        if (!state.purchaseRequests) state.purchaseRequests = [];
    } else {
        state.users = SEED_USERS;
        state.prealerts = SEED_PREALERTS;
        state.packages = SEED_PACKAGES;
        state.purchaseRequests = [];
        saveGlobalState();
    }
}

// Save state back to localStorage
function saveGlobalState() {
    localStorage.setItem('pakki_locker_state', JSON.stringify(state));
}

const clientApp = {
    init: async function() {
        await loadGlobalState();
        this.setupAuth();
        this.setupNavigation();
        this.setupEventListeners();

        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('client-current-date').textContent = new Date().toLocaleDateString('es-ES', options);
    },

    setupAuth: function() {
        const session = sessionStorage.getItem('pakki_logged_user');
        if (session) {
            loggedUser = JSON.parse(session);
            // Verify user still exists in database
            const userExists = state.users.find(u => u.lockerCode === loggedUser.lockerCode);
            if (userExists) {
                loggedUser = userExists; // use updated db info
                this.showDashboard();
            } else {
                this.logout();
            }
        } else {
            this.showLogin();
        }
    },

    showLogin: function() {
        document.getElementById('login-section').style.display = 'flex';
        document.getElementById('app-section').style.display = 'none';
        document.body.className = 'login-body';
    },

    showDashboard: function() {
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('app-section').style.display = 'grid';
        document.body.className = ''; // Reset body class to avoid dark theme of login
        
        // Populate profile info
        document.getElementById('client-name').textContent = loggedUser.name;
        document.getElementById('client-locker-display').textContent = loggedUser.lockerCode;
        
        // Set initials for avatar
        const initials = loggedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        document.getElementById('client-avatar').textContent = initials;

        this.renderAll();
    },

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
        document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
        const activeMenuItem = document.querySelector(`.menu-item[data-tab="${tabId}"]`);
        if (activeMenuItem) activeMenuItem.classList.add('active');

        document.querySelectorAll('.tab-content').forEach(panel => panel.classList.remove('active'));
        const targetPanel = document.getElementById(tabId);
        if (targetPanel) {
            targetPanel.classList.add('active');

            const headerTitle = document.getElementById('client-page-title');
            const headerSub = document.getElementById('client-page-subtitle');

            if (tabId === 'tab-client-dashboard') {
                headerTitle.textContent = "Mi Casillero";
                headerSub.textContent = "Monitorea tus entregas y prealerta tus compras desde el exterior.";
            } else if (tabId === 'tab-client-prealerts') {
                headerTitle.textContent = "Crear Prealerta";
                headerSub.textContent = "Notifica la llegada de compras pendientes a la bodega en Miami.";
            } else if (tabId === 'tab-client-packages') {
                headerTitle.textContent = "Mis Paquetes";
                headerSub.textContent = "Rastrea la ubicación y estado de transporte de tus paquetes en tiempo real.";
            } else if (tabId === 'tab-client-billing') {
                headerTitle.textContent = "Mis Liquidaciones / Cobros";
                headerSub.textContent = "Facturación detallada y montos pendientes de pago.";
            } else if (tabId === 'tab-client-buyforme') {
                headerTitle.textContent = "Compramos por Ti";
                headerSub.textContent = "Solicita la compra de productos en tiendas de EE.UU. y te los enviamos a Colombia.";
                this.prefillBuyForMeForm();
            }

            await loadGlobalState();
            this.renderAll();
        }
    },

    setupEventListeners: function() {
        // Login form submit
        document.getElementById('form-login-client').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout button
        document.getElementById('btn-logout').addEventListener('click', () => {
            this.logout();
        });

        // Prealert Form Submit
        document.getElementById('form-client-prealert').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegisterPrealert();
        });

        // Buy For Me form submit
        document.getElementById('form-buyforme').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegisterPurchaseRequest();
        });
    },

    showAlert: function(message, type = 'success') {
        const container = document.getElementById('client-alerts-container');
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.innerHTML = `
            <span>${message}</span>
            <button style="margin-left: auto; background:none; border:none; cursor:pointer; font-weight:bold; color:inherit;" onclick="this.parentElement.remove()">&times;</button>
        `;
        container.appendChild(alert);
        
        setTimeout(() => {
            alert.style.opacity = '0';
            alert.style.transition = 'opacity 0.5s ease';
            setTimeout(() => alert.remove(), 500);
        }, 5000);
    },

    handleLogin: function() {
        const lockerInput = document.getElementById('login-locker').value.trim().toUpperCase();
        const docInput = document.getElementById('login-doc').value.trim();
        
        loadGlobalState();
        
        const user = state.users.find(u => u.lockerCode.toUpperCase() === lockerInput && u.doc === docInput);
        if (user) {
            loggedUser = user;
            sessionStorage.setItem('pakki_logged_user', JSON.stringify(user));
            document.getElementById('login-error').style.display = 'none';
            this.showDashboard();
            this.showAlert(`¡Bienvenido de nuevo, <strong>${user.name}</strong>!`, 'success');
        } else {
            document.getElementById('login-error').style.display = 'block';
        }
    },

    logout: function() {
        sessionStorage.removeItem('pakki_logged_user');
        loggedUser = null;
        this.showLogin();
    },

    // Invoicing calculations
    calculatePackageInvoicing: function(pkg) {
        const s = state.settings;
        const volWeight = (pkg.lengthIn * pkg.widthIn * pkg.heightIn) / 166;
        const volWeightRounded = parseFloat(volWeight.toFixed(2));
        
        const chargeableWeight = Math.max(pkg.weightLbs, volWeightRounded);
        const freightCost = chargeableWeight * s.baseRatePerLb;
        const insuranceCost = pkg.value * (s.insurancePercent / 100);
        const fuelSurchargeCost = freightCost * (s.fuelSurchargePercent / 100);
        const taxCost = pkg.value > s.vatThresholdUsd ? (pkg.value * (s.vatPercent / 100)) : 0;
        const handlingFee = s.handlingFee;
        
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

    // RENDER LOGIC
    renderAll: function() {
        if (!loggedUser) return;
        this.renderDashboard();
        this.renderPrealerts();
        this.renderPackages();
        this.renderBilling();
        this.renderMyPurchaseRequests();
    },

    renderDashboard: function() {
        // Welcome bar info
        document.getElementById('welcome-message').textContent = `¡Hola, ${loggedUser.name}!`;
        document.getElementById('welcome-locker').textContent = loggedUser.lockerCode;
        document.getElementById('welcome-city').textContent = loggedUser.city;

        // Custom Address display — primer nombre + primer apellido + código casillero
        const nameParts = (loggedUser.name || '').trim().split(/\s+/);
        const shortName = nameParts.length >= 2
            ? `${nameParts[0]} ${nameParts[1]}`
            : nameParts[0] || '';
        const addressBlock = document.getElementById('client-miami-address-block');
        addressBlock.innerHTML = `
<strong>${shortName} ${loggedUser.lockerCode}</strong>
8400 NW 25th Street, Suite 100
Doral, FL 33198
Tel: +1 (305) 555-0199
        `;

        // Metrics calculations
        const myPackages = state.packages.filter(p => p.lockerCode === loggedUser.lockerCode);
        document.getElementById('cmetric-total-packages').textContent = myPackages.length;

        const inMiami = myPackages.filter(p => p.status === 'En Bodega Miami').length;
        document.getElementById('cmetric-warehouse-packages').textContent = inMiami;

        // Sum of unpaid invoices
        let unpaidTotal = 0;
        myPackages.forEach(p => {
            if (p.invoiceStatus !== 'Pagado') {
                const pricing = this.calculatePackageInvoicing(p);
                unpaidTotal += pricing.total;
            }
        });
        const trm = state.settings.trm || 4000;
        document.getElementById('cmetric-billing-due').innerHTML = `$${unpaidTotal.toFixed(2)} USD<br><small style="font-size:0.7em; opacity:0.8; font-weight:500;">≈ $${Math.round(unpaidTotal * trm).toLocaleString('es-CO')} COP</small>`;

        // Dashboard short list of packages
        const tbody = document.getElementById('table-client-recent-packages');
        tbody.innerHTML = '';
        
        const recent = [...myPackages].reverse().slice(0, 4);
        if (recent.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No tienes paquetes registrados.</td></tr>`;
            return;
        }

        recent.forEach(pkg => {
            const pricing = this.calculatePackageInvoicing(pkg);
            let badgeClass = 'badge-neutral';
            if (pkg.status === 'En Bodega Miami') badgeClass = 'badge-warning';
            if (pkg.status === 'En Tránsito a Colombia') badgeClass = 'badge-info';
            if (pkg.status === 'Listo para Entrega') badgeClass = 'badge-success';
            if (pkg.status === 'Entregado') badgeClass = 'badge-success';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${pkg.dateReceived}</td>
                <td style="font-family:monospace; font-size:0.8rem;">${pkg.tracking}</td>
                <td>${pkg.description}</td>
                <td>${pricing.chargeableWeight} lbs</td>
                <td><span class="badge ${badgeClass}">${pkg.status}</span></td>
            `;
            tbody.appendChild(tr);
        });
    },

    renderPrealerts: function() {
        const container = document.getElementById('client-prealerts-list');
        container.innerHTML = '';

        const myPrealerts = state.prealerts.filter(p => p.lockerCode === loggedUser.lockerCode);
        
        if (myPrealerts.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:2rem; color:var(--text-muted);">No has registrado ninguna prealerta.</p>`;
            return;
        }

        [...myPrealerts].reverse().forEach(pre => {
            const statusBadge = pre.status === 'Pendiente' ? 'badge-warning' : 'badge-success';
            const card = document.createElement('div');
            card.className = 'card';
            card.style.padding = '1rem';
            card.style.borderLeft = `4px solid ${pre.status === 'Pendiente' ? 'var(--warning)' : 'var(--success)'}`;
            
            const fileLink = pre.invoiceFileData
                ? `<a href="${pre.invoiceFileData}" target="_blank" style="color:var(--primary); font-weight:600;">📎 ${pre.invoiceFileName || 'Ver soporte'}</a>`
                : '<span style="color:var(--text-muted);">Sin soporte</span>';

            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
                    <span class="badge ${statusBadge}">${pre.status}</span>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${pre.dateCreated}</span>
                </div>
                <h4 style="font-size:0.9rem; font-family:var(--font-heading); margin-bottom:0.4rem;">Tracking: ${pre.tracking}</h4>
                <div style="font-size:0.8rem; color:var(--text-muted); display:flex; flex-direction:column; gap:0.2rem;">
                    <p><strong>Tienda:</strong> ${pre.store || '—'} &nbsp;|&nbsp; <strong>Transporte:</strong> ${pre.carrier}</p>
                    <p><strong>Producto:</strong> ${pre.description}</p>
                    <p><strong>Valor declarado:</strong> $${parseFloat(pre.value||0).toFixed(2)} USD &nbsp;|&nbsp; <strong>Peso est.:</strong> ${pre.weightLbs ? pre.weightLbs + ' Lbs' : '—'}</p>
                    <p><strong>Ciudad entrega:</strong> ${pre.deliveryCity || '—'} &nbsp;|&nbsp; <strong>Tipo envío:</strong> ${pre.shippingType ? `<span style="color:${pre.shippingType==='Corporativo'?'var(--secondary)':'var(--primary)'}; font-weight:600;">${pre.shippingType}</span>` : '—'}</p>
                    <p><strong>Soporte:</strong> ${fileLink}</p>
                </div>
            `;
            container.appendChild(card);
        });
    },

    handleRegisterPrealert: async function() {
        const tracking = document.getElementById('cprealert-tracking').value.trim();
        const store = document.getElementById('cprealert-store').value.trim();
        const carrierSel = document.getElementById('cprealert-carrier');
        const carrierOther = document.getElementById('cprealert-carrier-other');
        const carrier = carrierSel.value === 'Otro'
            ? (carrierOther.value.trim() || (() => { carrierOther.setCustomValidity('Ingresa el nombre de la transportadora.'); carrierOther.reportValidity(); return null; })())
            : carrierSel.value;
        if (!carrier) return;
        const value = parseFloat(document.getElementById('cprealert-value').value);
        const weightLbs = parseFloat(document.getElementById('cprealert-weight').value) || null;
        const description = document.getElementById('cprealert-desc').value.trim();
        const deliveryCity = document.getElementById('cprealert-city').value;
        const shippingType = document.getElementById('cprealert-shipping-type').value;

        // Handle file upload (convert to base64)
        let invoiceFileName = '';
        let invoiceFileData = '';
        const fileInput = document.getElementById('cprealert-file');
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

        // Reload from Supabase before checking duplicates
        await loadGlobalState();

        const exists = state.prealerts.some(p => p.tracking.toLowerCase() === tracking.toLowerCase());
        if (exists) {
            this.showAlert('Ya registraste una prealerta con este número de tracking.', 'danger');
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];

        const newPre = {
            id: `pre_${Date.now()}`,
            lockerCode: loggedUser.lockerCode,
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
            const { error } = await supabaseClient.from('prealerts').insert([newPre]);
            if (error) {
                this.showAlert(`Error al guardar la prealerta: ${error.message}`, 'danger');
                return;
            }
            await loadGlobalState();
        } else {
            state.prealerts.push(newPre);
            saveGlobalState();
        }

        this.showAlert(`Prealerta para tracking <strong>${tracking}</strong> creada con éxito.`, 'success');
        document.getElementById('form-client-prealert').reset();
        toggleClientCarrierOther(carrierSel);

        this.renderPrealerts();
        this.renderDashboard();
    },

    renderPackages: function() {
        const container = document.getElementById('client-packages-detailed-list');
        container.innerHTML = '';

        const myPackages = state.packages.filter(p => p.lockerCode === loggedUser.lockerCode);

        if (myPackages.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:2rem; color:var(--text-muted);">No tienes paquetes registrados en bodega o tránsito.</p>`;
            return;
        }

        [...myPackages].reverse().forEach(pkg => {
            const pricing = this.calculatePackageInvoicing(pkg);
            
            // Build the tracking timeline state indexes
            let stepIndex = 0; // default bodega miami
            if (pkg.status === 'En Bodega Miami') stepIndex = 0;
            else if (pkg.status === 'En Tránsito a Colombia') stepIndex = 1;
            else if (pkg.status === 'Nacionalización') stepIndex = 2;
            else if (pkg.status === 'Listo para Entrega') stepIndex = 3;
            else if (pkg.status === 'Entregado') stepIndex = 4;

            const isStepClass = (idx) => {
                if (idx < stepIndex) return 'completed';
                if (idx === stepIndex) return (pkg.status === 'Entregado') ? 'completed' : 'active';
                return '';
            };

            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem; margin-bottom:1rem;">
                    <div>
                        <h3 style="font-size:1.05rem; font-family:var(--font-heading); color:var(--primary); margin-bottom:0.25rem;">Tracking: ${pkg.tracking}</h3>
                        <p style="font-size:0.85rem; font-weight:600;">${pkg.description}</p>
                    </div>
                    <div style="text-align:right;">
                        <span class="badge ${pkg.status === 'Entregado' ? 'badge-success' : 'badge-warning'}">${pkg.status}</span>
                        <p style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">Recibido: ${pkg.dateReceived}</p>
                    </div>
                </div>
                
                <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:1rem; font-size:0.85rem; margin-bottom:1.5rem;">
                    <div><span>Transportadora:</span> <strong>${pkg.carrier}</strong></div>
                    <div><span>Peso Físico:</span> <strong>${pkg.weightLbs} Lbs</strong></div>
                    <div><span>Peso Volumétrico:</span> <strong>${pricing.volWeight} Lbs</strong></div>
                    <div><span>Peso a Facturar:</span> <strong style="color:var(--secondary);">${pricing.chargeableWeight} Lbs</strong></div>
                </div>

                <!-- Horizontal Timeline -->
                <div class="timeline-container">
                    <div class="timeline">
                        <div class="timeline-step ${isStepClass(0)}">
                            <div class="step-node">1</div>
                            <div class="step-label">Bodega Miami</div>
                        </div>
                        <div class="timeline-step ${isStepClass(1)}">
                            <div class="step-node">2</div>
                            <div class="step-label">En Tránsito</div>
                        </div>
                        <div class="timeline-step ${isStepClass(2)}">
                            <div class="step-node">3</div>
                            <div class="step-label">Aduana</div>
                        </div>
                        <div class="timeline-step ${isStepClass(3)}">
                            <div class="step-node">4</div>
                            <div class="step-label">Listo Entrega</div>
                        </div>
                        <div class="timeline-step ${isStepClass(4)}">
                            <div class="step-node">5</div>
                            <div class="step-label">Entregado</div>
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    },

    renderBilling: function() {
        const tbody = document.getElementById('table-client-billing-body');
        tbody.innerHTML = '';

        const myPackages = state.packages.filter(p => p.lockerCode === loggedUser.lockerCode);

        if (myPackages.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; color:var(--text-muted);">No tienes facturas generadas.</td></tr>`;
            return;
        }

        myPackages.forEach(pkg => {
            const pricing = this.calculatePackageInvoicing(pkg);
            const statusBadge = pkg.invoiceStatus === 'Pagado' ? 'badge-success' : 'badge-warning';

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>INV-${pkg.id.split('_')[1]}</strong></td>
                <td>${pkg.dateReceived}</td>
                <td>
                    <span style="font-size:0.8rem; font-family:monospace; font-weight:600;">${pkg.tracking}</span><br>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${pkg.description}</span>
                </td>
                <td>${pricing.chargeableWeight} Lbs</td>
                <td>$${pkg.value.toFixed(2)}<br><small style="color:var(--text-muted); font-size:0.78rem;">${fmtCOP(pkg.value)}</small></td>
                <td>$${pricing.freight.toFixed(2)}</td>
                <td>$${(pricing.tax + pricing.insurance).toFixed(2)}</td>
                <td><strong style="color:var(--secondary); font-size:0.95rem;">$${pricing.total.toFixed(2)} USD</strong><br><small style="color:var(--text-muted); font-size:0.78rem;">${fmtCOP(pricing.total)}</small></td>
                <td><span class="badge ${statusBadge}">${pkg.invoiceStatus || 'Pendiente'}</span></td>
                <td>
                    <button class="btn btn-secondary btn-sm" onclick="clientApp.viewInvoiceDetail('${pkg.id}')">Ver Prefactura</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    },

    viewInvoiceDetail: function(pkgId) {
        const pkg = state.packages.find(p => p.id === pkgId);
        if (!pkg) return;

        const calc = this.calculatePackageInvoicing(pkg);
        const s = state.settings;
        
        const body = document.getElementById('modal-client-invoice-body');
        
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
                    <h5 class="invoice-section-title">Datos de Entrega</h5>
                    <div class="invoice-grid">
                        <div class="invoice-grid-item"><span>Destinatario:</span> ${loggedUser.name}</div>
                        <div class="invoice-grid-item"><span>Casillero:</span> <strong style="color:var(--primary);">${pkg.lockerCode}</strong></div>
                        <div class="invoice-grid-item"><span>Ciudad:</span> ${loggedUser.city}</div>
                        <div class="invoice-grid-item" style="grid-column: 1 / -1;"><span>Dirección:</span> ${loggedUser.address}</div>
                    </div>
                </div>

                <div>
                    <h5 class="invoice-section-title">Detalle de Mercancía</h5>
                    <div class="invoice-grid">
                        <div class="invoice-grid-item"><span>Tracking:</span> ${pkg.tracking}</div>
                        <div class="invoice-grid-item"><span>Descripción:</span> ${pkg.description}</div>
                        <div class="invoice-grid-item"><span>Valor Declarado:</span> $${pkg.value.toFixed(2)} USD <small style="color:var(--text-muted);">(${fmtCOP(pkg.value)})</small></div>
                    </div>
                </div>

                <div>
                    <h5 class="invoice-section-title">Desglose de Pesos</h5>
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th>Peso Físico</th>
                                <th>Dimensiones</th>
                                <th>Peso Volumétrico *</th>
                                <th>Peso Liquidable</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>${pkg.weightLbs} Lbs</td>
                                <td>${pkg.lengthIn}"x${pkg.widthIn}"x${pkg.heightIn}"</td>
                                <td>${calc.volWeight} Lbs</td>
                                <td><strong style="color:var(--secondary);">${calc.chargeableWeight} Lbs</strong></td>
                            </tr>
                        </tbody>
                    </table>
                    <p style="font-size:0.65rem; color:var(--text-muted); margin-top:0.25rem;">* Fórmula Volumétrica: (Largo x Ancho x Alto) / 166.</p>
                </div>

                <div>
                    <h5 class="invoice-section-title">Detalle del Cobro</h5>
                    <div class="invoice-total-section">
                        <div class="invoice-total-row">
                            <span>Flete Base (${calc.chargeableWeight} Lbs &times; $${s.baseRatePerLb.toFixed(2)} USD):</span>
                            <span>$${calc.freight.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.freight)}</small></span>
                        </div>
                        <div class="invoice-total-row">
                            <span>Manejo Bodega:</span>
                            <span>$${calc.handling.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.handling)}</small></span>
                        </div>
                        <div class="invoice-total-row">
                            <span>Seguro Comercial (${s.insurancePercent}%):</span>
                            <span>$${calc.insurance.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.insurance)}</small></span>
                        </div>
                        <div class="invoice-total-row">
                            <span>Recargo Combustible (${s.fuelSurchargePercent}%):</span>
                            <span>$${calc.fuel.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.fuel)}</small></span>
                        </div>
                        <div class="invoice-total-row">
                            <span>IVA Aduana (${s.vatPercent}% ${pkg.value > s.vatThresholdUsd ? '> $200' : 'Exento'}):</span>
                            <span>$${calc.tax.toFixed(2)} <small style="display:block; color:var(--text-muted); font-size:0.82em;">${fmtCOP(calc.tax)}</small></span>
                        </div>
                        <div class="invoice-total-row grand-total">
                            <span>TOTAL NETO A PAGAR:</span>
                            <span>$${calc.total.toFixed(2)} USD<br><span style="font-size:0.88em;">${fmtCOP(calc.total)}</span></span>
                        </div>
                    </div>
                    <p style="font-size:0.7rem; color:var(--text-muted); margin-top:0.75rem;">TRM aplicada: $${(s.trm||4000).toLocaleString('es-CO')} COP/USD</p>
                </div>
            </div>
        `;
        
        this.openModal('modal-client-invoice-detail');
    },

    openModal: function(modalId) {
        document.getElementById(modalId).classList.add('active');
    },

    closeModal: function(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    printInvoice: function() {
        window.print();
    },

    prefillBuyForMeForm: function() {
        if (!loggedUser) return;
        const buyerField = document.getElementById('bfm-buyer');
        const cityField = document.getElementById('bfm-city');
        if (buyerField && !buyerField.value) buyerField.value = loggedUser.name;
        if (cityField && !cityField.value) cityField.value = loggedUser.city;
    },

    handleRegisterPurchaseRequest: async function() {
        const url = document.getElementById('bfm-url').value.trim();
        const productName = document.getElementById('bfm-name').value.trim();
        const characteristics = document.getElementById('bfm-chars').value.trim();
        const quantity = parseInt(document.getElementById('bfm-qty').value);
        const store = document.getElementById('bfm-store').value.trim();
        const estimatedWeightLbs = parseFloat(document.getElementById('bfm-weight').value);
        const buyerName = document.getElementById('bfm-buyer').value.trim();
        const deliveryCity = document.getElementById('bfm-city').value.trim();
        const insure = document.getElementById('bfm-insure').checked;

        const todayStr = new Date().toISOString().split('T')[0];

        const newRequest = {
            id: `pr_${Date.now()}`,
            lockerCode: loggedUser.lockerCode,
            clientName: loggedUser.name,
            dateCreated: todayStr,
            status: 'Pendiente',
            url,
            productName,
            characteristics,
            quantity,
            store,
            estimatedWeightLbs,
            buyerName,
            deliveryCity,
            insure
        };

        if (useSupabase) {
            const { error } = await supabaseClient.from('purchase_requests').insert([newRequest]);
            if (error) {
                this.showAlert(`Error al enviar solicitud: ${error.message}`, 'danger');
                return;
            }
            // Reload from Supabase to sync
            const { data: prs } = await supabaseClient.from('purchase_requests').select('*');
            state.purchaseRequests = prs || [];
        } else {
            state.purchaseRequests.push(newRequest);
            saveGlobalState();
        }

        this.showAlert(`Solicitud para <strong>${productName}</strong> enviada con éxito. El equipo Pakki la procesará pronto.`, 'success');
        document.getElementById('form-buyforme').reset();
        this.prefillBuyForMeForm();
        this.renderMyPurchaseRequests();
    },

    renderMyPurchaseRequests: function() {
        if (!loggedUser) return;
        const container = document.getElementById('client-buyforme-list');
        if (!container) return;

        const myRequests = (state.purchaseRequests || []).filter(r => r.lockerCode === loggedUser.lockerCode);

        if (myRequests.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:2rem; color:var(--text-muted);">No tienes solicitudes de compra activas.</p>`;
            return;
        }

        container.innerHTML = '';
        [...myRequests].reverse().forEach(req => {
            const statusColors = {
                'Pendiente': { badge: 'badge-warning', border: 'var(--warning)' },
                'En Proceso': { badge: 'badge-info', border: 'var(--info)' },
                'Completado': { badge: 'badge-success', border: 'var(--success)' },
                'Cancelado': { badge: 'badge-danger', border: 'var(--danger)' }
            };
            const sc = statusColors[req.status] || statusColors['Pendiente'];

            const card = document.createElement('div');
            card.className = 'card';
            card.style.cssText = `padding: 1rem; border-left: 4px solid ${sc.border};`;
            card.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem;">
                    <div>
                        <span class="badge ${sc.badge}" style="margin-bottom:0.25rem;">${req.status}</span>
                        <h4 style="font-size:0.95rem; font-family:var(--font-heading); margin:0;">${req.productName}</h4>
                    </div>
                    <span style="font-size:0.75rem; color:var(--text-muted);">${req.dateCreated}</span>
                </div>
                <div style="font-size:0.8rem; color:var(--text-muted); display:flex; flex-direction:column; gap:0.2rem;">
                    <p><strong>Tienda:</strong> ${req.store} &nbsp;|&nbsp; <strong>Cantidad:</strong> ${req.quantity} &nbsp;|&nbsp; <strong>Peso est.:</strong> ${req.estimatedWeightLbs} Lbs</p>
                    <p><strong>Características:</strong> ${req.characteristics}</p>
                    <p><strong>Seguro:</strong> ${req.insure ? 'Sí' : 'No'} &nbsp;|&nbsp; <strong>Ciudad entrega:</strong> ${req.deliveryCity}</p>
                    <a href="${req.url}" target="_blank" rel="noopener" style="color:var(--primary); font-size:0.78rem; word-break:break-all;">Ver producto ↗</a>
                </div>
            `;
            container.appendChild(card);
        });
    }
};

// Start customer portal
document.addEventListener('DOMContentLoaded', () => {
    clientApp.init();
});
