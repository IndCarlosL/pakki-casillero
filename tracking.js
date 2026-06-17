// ── Pakki Casillero · Módulo de Rastreo Público ──

const SUPABASE_URL = "https://uuaglghhsxbzhvbjzgky.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1YWdsZ2hoc3hiemh2Ymp6Z2t5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyMDMxOTgsImV4cCI6MjA5Njc3OTE5OH0.WI317E3WbMLHcS8hFDYnIH8TjCjkL09G55lt3Qd7X6k";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Etapas del timeline ──
const STAGES = [
    { key: 'prealert',   icon: '📋', label: 'Prealerta Registrada',      sub: 'Tu compra fue notificada al sistema' },
    { key: 'bodega',     icon: '📦', label: 'Recibido en Bodega Miami',   sub: 'El paquete llegó a nuestras instalaciones' },
    { key: 'transito',   icon: '✈️',  label: 'En Tránsito a Colombia',    sub: 'El envío está en camino' },
    { key: 'aduana',     icon: '🏛️', label: 'En Aduana / DIAN',          sub: 'Proceso de nacionalización' },
    { key: 'listo',      icon: '🏠', label: 'Listo para Entrega',         sub: 'Tu paquete puede ser recogido o está en reparto' },
    { key: 'entregado',  icon: '✅', label: 'Entregado',                  sub: 'Envío completado' }
];

const STATUS_TO_STAGE = {
    'En Bodega Miami':          'bodega',
    'En Tránsito a Colombia':   'transito',
    'Nacionalización':          'aduana',
    'Listo para Entrega':       'listo',
    'Entregado':                'entregado'
};

// ── Navegación de tabs ──
function switchTab(tab) {
    document.querySelectorAll('.track-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.track-panel').forEach(p => {
        p.classList.remove('track-panel-hidden');
        p.style.display = 'none';
    });

    if (tab === 'tracking') {
        document.querySelectorAll('.track-tab')[0].classList.add('active');
        document.getElementById('panel-tracking').style.display = 'block';
    } else {
        document.querySelectorAll('.track-tab')[1].classList.add('active');
        document.getElementById('panel-locker').style.display = 'block';
    }
}

// Init: mostrar panel según parámetro de localStorage o hash
const initTab = localStorage.getItem('track-tab') || (location.hash === '#locker' ? 'locker' : 'tracking');
localStorage.removeItem('track-tab');
document.getElementById('panel-tracking').style.display = initTab === 'locker' ? 'none' : 'block';
document.getElementById('panel-locker').style.display   = initTab === 'locker' ? 'block' : 'none';
if (initTab === 'locker') {
    document.querySelectorAll('.track-tab')[0].classList.remove('active');
    document.querySelectorAll('.track-tab')[1].classList.add('active');
}

// ── Rastrear paquete ──
async function searchPackage() {
    const raw = document.getElementById('track-input').value.trim();
    const resultEl = document.getElementById('track-result');
    if (!raw) { resultEl.style.display = 'none'; return; }

    resultEl.style.display = 'block';
    resultEl.innerHTML = '<div class="track-empty"><div class="track-empty-icon">⏳</div>Buscando...</div>';

    // Buscar en packages por tracking (insensible a mayúsculas) o por id
    const query = raw.toUpperCase();
    let pkg = null;
    let fromPrealert = false;

    const { data: pkgRows } = await db.from('packages').select('*');
    if (pkgRows) {
        pkg = pkgRows.find(p =>
            (p.tracking || '').toUpperCase() === query ||
            (p.id || '').toUpperCase() === query
        );
    }

    // Si no hay paquete, buscar en prealerts
    if (!pkg) {
        const { data: preRows } = await db.from('prealerts').select('*');
        if (preRows) {
            const pre = preRows.find(p =>
                (p.tracking || '').toUpperCase() === query ||
                (p.id || '').toUpperCase() === query
            );
            if (pre) {
                pkg = pre;
                fromPrealert = true;
            }
        }
    }

    if (!pkg) {
        resultEl.innerHTML = `
            <div class="track-empty">
                <div class="track-empty-icon">🔍</div>
                <strong>No encontramos este número</strong><br>
                Verifica que el tracking o código sea correcto.<br>
                <span style="font-size:0.75rem;">Si acabas de registrar la prealerta, puede tomar unos minutos.</span>
            </div>`;
        return;
    }

    const currentStageKey = fromPrealert ? 'prealert' : (STATUS_TO_STAGE[pkg.status] || 'bodega');
    const currentIdx = STAGES.findIndex(s => s.key === currentStageKey);

    // Nombre del cliente abreviado
    const userName = await getUserName(pkg.lockerCode);

    resultEl.innerHTML = `
        <div class="result-card">
            <div class="result-card-header">
                <div>
                    <h4>Paquete encontrado</h4>
                    <span style="font-size:0.78rem; color:var(--text-muted);">${fromPrealert ? 'Prealerta registrada' : 'En sistema de bodega'}</span>
                </div>
                <span class="badge ${currentStageKey === 'entregado' ? 'badge-success' : 'badge-primary'}"
                      style="${currentStageKey !== 'entregado' ? 'background:#ede9fe; color:var(--primary); border:1px solid var(--primary);' : ''}">
                    ${pkg.status || 'Prealerta Registrada'}
                </span>
            </div>
            <div class="result-card-body">

                <!-- Timeline -->
                <div class="timeline">
                    ${STAGES.map((stage, i) => {
                        const isDone   = i < currentIdx;
                        const isActive = i === currentIdx;
                        const lineClass = isDone ? 'tl-line done' : 'tl-line';
                        const iconClass = isDone ? 'tl-icon done' : isActive ? 'tl-icon active' : 'tl-icon';
                        const labelClass = isDone ? 'tl-label done' : isActive ? 'tl-label active' : 'tl-label';
                        return `
                            <div class="tl-step">
                                <div class="tl-icon-wrap">
                                    <div class="${iconClass}">${isDone ? '✓' : stage.icon}</div>
                                    <div class="${lineClass}"></div>
                                </div>
                                <div class="tl-content">
                                    <div class="${labelClass}">${stage.label}</div>
                                    ${isActive ? `<div class="tl-sub">${stage.sub}</div>` : ''}
                                </div>
                            </div>`;
                    }).join('')}
                </div>

                <!-- Datos del paquete -->
                <div class="info-grid" style="margin-top:1.25rem; padding-top:1rem; border-top:1px solid var(--border-color);">
                    <div class="info-item">
                        <label>Número de Guía</label>
                        <span style="font-family:monospace; font-size:0.82rem;">${pkg.tracking || '—'}</span>
                    </div>
                    ${pkg.lockerCode ? `<div class="info-item"><label>Casillero</label><span>${pkg.lockerCode}${userName ? ' · ' + userName : ''}</span></div>` : ''}
                    ${pkg.description ? `<div class="info-item"><label>Descripción</label><span>${pkg.description}</span></div>` : ''}
                    ${pkg.carrier ? `<div class="info-item"><label>Transportista EE.UU.</label><span>${pkg.carrier}</span></div>` : ''}
                    ${pkg.dateReceived ? `<div class="info-item"><label>Fecha Recepción Bodega</label><span>${pkg.dateReceived}</span></div>` : ''}
                    ${pkg.weightLbs ? `<div class="info-item"><label>Peso</label><span>${pkg.weightLbs} Lbs</span></div>` : ''}
                    ${pkg.store ? `<div class="info-item"><label>Tienda</label><span>${pkg.store}</span></div>` : ''}
                    ${pkg.deliveryCity ? `<div class="info-item"><label>Ciudad de Entrega</label><span>${pkg.deliveryCity}</span></div>` : ''}
                </div>

            </div>
        </div>`;
}

async function getUserName(lockerCode) {
    if (!lockerCode) return '';
    const { data } = await db.from('users').select('name').eq('lockerCode', lockerCode).single();
    if (!data || !data.name) return '';
    const parts = data.name.trim().split(/\s+/);
    return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0];
}

// ── Recuperar casillero ──
async function searchLocker() {
    const raw = document.getElementById('locker-input').value.trim();
    const resultEl = document.getElementById('locker-result');
    if (!raw) { resultEl.style.display = 'none'; return; }

    resultEl.style.display = 'block';
    resultEl.innerHTML = '<div class="track-empty"><div class="track-empty-icon">⏳</div>Buscando...</div>';

    const { data: rows } = await db.from('users').select('name, lockerCode').eq('doc', raw);

    if (!rows || rows.length === 0) {
        resultEl.innerHTML = `
            <div class="track-empty">
                <div class="track-empty-icon">🔍</div>
                <strong>Documento no encontrado</strong><br>
                Verifica el número o contacta al administrador.
            </div>`;
        return;
    }

    const user = rows[0];
    const parts = (user.name || '').trim().split(/\s+/);
    const shortName = parts.length >= 2 ? `${parts[0]} ${parts[1]}` : parts[0] || '—';
    const initial = shortName.charAt(0).toUpperCase();

    resultEl.innerHTML = `
        <div class="result-card">
            <div class="result-card-header">
                <h4>Casillero encontrado</h4>
                <span class="badge badge-success">Activo</span>
            </div>
            <div class="result-card-body">
                <div class="locker-box">
                    <div class="locker-avatar">${initial}</div>
                    <div class="locker-name">${shortName}</div>
                    <div class="locker-code">${user.lockerCode || '—'}</div>
                    <div class="locker-hint">Este es tu código de casillero. Úsalo para iniciar sesión en el portal.</div>
                    <div style="margin-top:1.25rem; padding:0.75rem 1rem; background:var(--bg-app); border-radius:8px; font-size:0.78rem; color:var(--text-muted); text-align:left;">
                        <strong style="color:var(--text-primary);">Dirección en Miami:</strong><br>
                        ${shortName} / ${user.lockerCode}<br>
                        8400 NW 25th Street, Suite 100 · Doral, FL 33198<br>
                        Tel: +1 (305) 555-0199
                    </div>
                    <a href="client.html" class="btn btn-primary" style="margin-top:1rem; display:inline-block;">Ir a Mi Portal →</a>
                </div>
            </div>
        </div>`;
}
