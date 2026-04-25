/* ════════════════════════════════════════════
   FreelanceHub — Main App JS
════════════════════════════════════════════ */

const API = 'http://localhost:3000/api';

// ── State ────────────────────────────────────
const state = {
  services: [],
  savedIds: new Set(JSON.parse(localStorage.getItem('fh_saved') || '[]')),
  hiredIds: new Set(JSON.parse(localStorage.getItem('fh_hired') || '[]')),
  filters: { search: '', category: 'All', sort: '', minPrice: '', maxPrice: '' },
  currentPage: 'home',
  draggedId: null,
  currentServiceId: null,
};

// ── Helpers ───────────────────────────────────
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

function persistState() {
  localStorage.setItem('fh_saved', JSON.stringify([...state.savedIds]));
  localStorage.setItem('fh_hired', JSON.stringify([...state.hiredIds]));
}

function getCategoryIcon(cat) {
  const map = {
    Design: '🎨', Development: '💻', Writing: '✍️',
    Video: '🎬', Marketing: '📈', Audio: '🎙️'
  };
  return map[cat] || '🛠️';
}

function getThumbClass(cat) {
  const map = {
    design: 'card-thumb-design', development: 'card-thumb-development',
    writing: 'card-thumb-writing', video: 'card-thumb-video',
    marketing: 'card-thumb-marketing', audio: 'card-thumb-audio'
  };
  return map[(cat || '').toLowerCase()] || 'card-thumb-default';
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderStars(rating) {
  const full = Math.floor(rating);
  return '★'.repeat(full) + (rating % 1 >= 0.5 ? '½' : '');
}

// ── Toast ──────────────────────────────────────
function showToast(title, sub = '', type = 'info') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warn: '⚠️' };
  const container = $('#toast-container');
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-text">
      <div class="toast-title">${title}</div>
      ${sub ? `<div class="toast-sub">${sub}</div>` : ''}
    </div>`;
  container.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    el.classList.add('hide');
    setTimeout(() => el.remove(), 400);
  }, 3500);
}

// ── Navigation ─────────────────────────────────
function navigate(page) {
  $$('.page').forEach(p => p.classList.remove('active'));
  $$('.nav-link').forEach(l => l.classList.remove('active'));
  $(`#page-${page}`).classList.add('active');
  $(`.nav-link[data-page="${page}"]`)?.classList.add('active');
  state.currentPage = page;
  window.scrollTo(0, 0);

  if (page === 'dashboard') loadDashboard();
}

$$('.nav-link[data-page]').forEach(l =>
  l.addEventListener('click', () => navigate(l.dataset.page))
);

// ── API calls ──────────────────────────────────
async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
}

// ── Load & Render Services ─────────────────────
async function loadServices() {
  const { search, category, sort, minPrice, maxPrice } = state.filters;
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (category && category !== 'All') params.set('category', category);
  if (sort) params.set('sort', sort);
  if (minPrice) params.set('minPrice', minPrice);
  if (maxPrice) params.set('maxPrice', maxPrice);

  try {
    const data = await apiFetch(`${API}/services?${params}`);
    state.services = data.data;
    return data.data;
  } catch {
    showToast('Failed to load services', 'Check server connection', 'error');
    return [];
  }
}

function buildCard(svc) {
  const saved = state.savedIds.has(svc.id);
  const hired = state.hiredIds.has(svc.id);
  return `
    <div class="service-card" 
         data-id="${svc.id}" 
         draggable="true"
         onclick="openServiceModal(${svc.id})">
      <div class="card-thumb ${getThumbClass(svc.category)}">
        <div class="card-thumb-pattern"></div>
        <span>${getCategoryIcon(svc.category)}</span>
        <span class="card-category-badge">${svc.category}</span>
        <button class="card-save-btn ${saved ? 'saved' : ''}" 
                onclick="event.stopPropagation(); toggleSave(${svc.id})" 
                title="${saved ? 'Remove from saved' : 'Save service'}">
          ${saved ? '♥' : '♡'}
        </button>
      </div>
      <div class="card-body">
        <div class="card-seller">
          <div class="avatar" style="background:${avatarColor(svc.seller)}">${svc.sellerAvatar}</div>
          <span class="seller-name">${svc.seller}</span>
          <span class="seller-level">${svc.sellerLevel}</span>
        </div>
        <h3 class="card-title">${svc.title}</h3>
        <div class="card-rating">
          <span class="stars">${renderStars(svc.rating)}</span>
          <span class="rating-num">${svc.rating.toFixed(1)}</span>
          <span class="review-count">(${svc.reviews.toLocaleString()})</span>
        </div>
        <div class="card-footer">
          <div class="card-price">
            <div class="price-from">Starting at</div>
            <div class="price-amount">$${svc.price}</div>
          </div>
          <button class="btn btn-primary btn-sm" onclick="event.stopPropagation(); confirmHire(${svc.id})">
            ${hired ? '✓ Hired' : 'Hire'}
          </button>
        </div>
      </div>
    </div>`;
}

function avatarColor(name) {
  const colors = ['#6c63ff','#e91e8c','#00b8d4','#ff6b6b','#43a047','#fb8c00','#8e24aa'];
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return colors[h % colors.length];
}

async function renderServicesGrid(containerId) {
  const container = $(`#${containerId}`);
  if (!container) return;
  container.innerHTML = '<div class="skeleton" style="height:200px;border-radius:14px;"></div>'.repeat(6);

  const services = await loadServices();
  if (!services.length) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state__icon">🔍</div>
        <div class="empty-state__title">No services found</div>
        <div class="empty-state__sub">Try adjusting your search or filters</div>
      </div>`;
    return;
  }
  container.innerHTML = services.map(buildCard).join('');
  initDragDrop();
  updateResultsMeta(services.length);
}

function updateResultsMeta(count) {
  const el = $('#results-count');
  if (el) el.innerHTML = `Showing <strong>${count}</strong> service${count !== 1 ? 's' : ''}`;
}

// ── Save / Hire ────────────────────────────────
async function toggleSave(id) {
  const isSaved = state.savedIds.has(id);
  try {
    if (isSaved) {
      await apiFetch(`${API}/save/${id}`, { method: 'DELETE' });
      state.savedIds.delete(id);
      showToast('Removed from saved', '', 'info');
    } else {
      const data = await apiFetch(`${API}/save`, {
        method: 'POST',
        body: JSON.stringify({ serviceId: id })
      });
      state.savedIds.add(id);
      showToast('Service saved!', data.message, 'success');
    }
    persistState();
    updateBadges();
    // update button in DOM without full re-render
    $$(`[data-id="${id}"] .card-save-btn`).forEach(btn => {
      btn.textContent = state.savedIds.has(id) ? '♥' : '♡';
      btn.classList.toggle('saved', state.savedIds.has(id));
    });
  } catch (err) {
    showToast('Error', err.message, 'error');
  }
}

function confirmHire(id) {
  const svc = state.services.find(s => s.id === id) || { id, title: 'this service', price: '?' };
  if (state.hiredIds.has(id)) { showToast('Already hired', 'Check your dashboard', 'info'); return; }
  openConfirmModal(svc);
}

async function hireService(id) {
  const svc = state.services.find(s => s.id === id);
  try {
    const data = await apiFetch(`${API}/hire`, {
      method: 'POST',
      body: JSON.stringify({ serviceId: id, message: 'Looking forward to working with you!' })
    });
    state.hiredIds.add(id);
    state.savedIds.delete(id);
    persistState();
    updateBadges();
    closeConfirmModal();
    closeServiceModal();
    showToast('🎉 Service hired!', data.message, 'success');
    $$(`[data-id="${id}"] .btn-primary`).forEach(btn => btn.textContent = '✓ Hired');
  } catch (err) {
    showToast('Error hiring', err.message, 'error');
  }
}

function updateBadges() {
  const savedBadge = $('#saved-badge');
  const hiredBadge = $('#hired-badge');
  const sc = state.savedIds.size;
  const hc = state.hiredIds.size;
  if (savedBadge) { savedBadge.textContent = sc; savedBadge.classList.toggle('visible', sc > 0); }
  if (hiredBadge) { hiredBadge.textContent = hc; hiredBadge.classList.toggle('visible', hc > 0); }
}

// ── Service Modal ──────────────────────────────
async function openServiceModal(id) {
  state.currentServiceId = id;
  const overlay = $('#service-modal-overlay');
  const body = $('#service-modal-body');

  overlay.classList.add('open');
  body.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading...</div>';

  try {
    const data = await apiFetch(`${API}/services/${id}`);
    const svc = data.data;
    const saved = state.savedIds.has(id);
    const hired = state.hiredIds.has(id);

    body.innerHTML = `
      <div class="modal__header">
        <div style="font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;">${svc.category}</div>
        <button class="modal__close" onclick="closeServiceModal()">✕</button>
      </div>
      <div class="modal__body">
        <div class="modal-thumb ${getThumbClass(svc.category)}">
          <div class="card-thumb-pattern"></div>
          <span>${getCategoryIcon(svc.category)}</span>
        </div>
        <h2 class="modal__title">${svc.title}</h2>
        <div class="modal__seller">
          <div class="avatar avatar-lg" style="background:${avatarColor(svc.seller)}">${svc.sellerAvatar}</div>
          <div>
            <div style="font-weight:600;margin-bottom:2px;">${svc.seller}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">${svc.sellerLevel} · ${svc.orders.toLocaleString()} orders</div>
          </div>
          <div style="margin-left:auto;">
            <div class="card-rating">
              <span class="stars">${renderStars(svc.rating)}</span>
              <span class="rating-num" style="font-size:1rem;">${svc.rating.toFixed(1)}</span>
              <span class="review-count">(${svc.reviews.toLocaleString()} reviews)</span>
            </div>
          </div>
        </div>
        <p class="modal__desc">${svc.description}</p>
        <div class="modal__meta">
          <div class="meta-item">
            <div class="meta-item__label">Price</div>
            <div class="meta-item__val" style="color:var(--accent)">$${svc.price}</div>
          </div>
          <div class="meta-item">
            <div class="meta-item__label">Delivery</div>
            <div class="meta-item__val">${svc.deliveryTime}</div>
          </div>
          <div class="meta-item">
            <div class="meta-item__label">Rating</div>
            <div class="meta-item__val" style="color:var(--gold)">${svc.rating.toFixed(1)} ⭐</div>
          </div>
        </div>
        <div class="modal__features">
          <div class="modal__features-title">What's included</div>
          <div class="feature-list">
            ${svc.features.map(f => `<div class="feature-item">${f}</div>`).join('')}
          </div>
        </div>
        <div class="modal__actions">
          <button class="btn btn-primary btn-lg" style="flex:1" onclick="confirmHire(${svc.id})">
            ${hired ? '✓ Already Hired' : '⚡ Hire Now · $' + svc.price}
          </button>
          <button class="btn btn-outline btn-lg" onclick="toggleSave(${svc.id})" id="modal-save-btn">
            ${saved ? '♥ Saved' : '♡ Save'}
          </button>
        </div>
      </div>`;
  } catch (err) {
    body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--danger)">Failed to load service.</div>`;
  }
}

function closeServiceModal() {
  $('#service-modal-overlay').classList.remove('open');
}

$('#service-modal-overlay').addEventListener('click', e => {
  if (e.target === $('#service-modal-overlay')) closeServiceModal();
});

// ── Confirm Modal ──────────────────────────────
function openConfirmModal(svc) {
  const overlay = $('#confirm-modal-overlay');
  const body = $('#confirm-modal-body');
  body.innerHTML = `
    <div class="confirm-icon">${getCategoryIcon(svc.category)}</div>
    <div class="confirm-title">Confirm Hire</div>
    <p class="confirm-sub">You're about to hire <strong>${svc.title}</strong> from <strong>${svc.seller || 'this seller'}</strong> for <strong style="color:var(--accent)">$${svc.price}</strong>. This action will be recorded in your dashboard.</p>
    <div class="confirm-actions">
      <button class="btn btn-primary btn-full btn-lg" onclick="hireService(${svc.id})">✓ Confirm Hire</button>
      <button class="btn btn-outline btn-full" onclick="closeConfirmModal()">Cancel</button>
    </div>`;
  overlay.classList.add('open');
}

function closeConfirmModal() {
  $('#confirm-modal-overlay').classList.remove('open');
}

$('#confirm-modal-overlay').addEventListener('click', e => {
  if (e.target === $('#confirm-modal-overlay')) closeConfirmModal();
});

// ── Drag & Drop ────────────────────────────────
function initDragDrop() {
  $$('.service-card[draggable]').forEach(card => {
    card.addEventListener('dragstart', e => {
      state.draggedId = parseInt(card.dataset.id);
      card.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      // Show drop zones
      $$('.drop-zone').forEach(z => z.classList.add('active'));
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      state.draggedId = null;
      $$('.drop-zone').forEach(z => { z.classList.remove('active'); z.classList.remove('drag-over'); });
    });
  });

  $$('.drop-zone').forEach(zone => {
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', async e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const action = zone.dataset.action;
      if (!state.draggedId) return;
      if (action === 'save') await toggleSave(state.draggedId);
      if (action === 'hire') confirmHire(state.draggedId);
    });
  });
}

// ── Filters ────────────────────────────────────
function initServicesPage() {
  const searchInput = $('#services-search');
  const categorySelect = $('#filter-category');
  const sortSelect = $('#filter-sort');

  let debounceTimer;
  searchInput?.addEventListener('input', e => {
    state.filters.search = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => renderServicesGrid('services-list'), 400);
  });

  categorySelect?.addEventListener('change', e => {
    state.filters.category = e.target.value;
    renderServicesGrid('services-list');
  });

  sortSelect?.addEventListener('change', e => {
    state.filters.sort = e.target.value;
    renderServicesGrid('services-list');
  });
}

// ── Dashboard ──────────────────────────────────
async function loadDashboard() {
  try {
    const [savedData, hiredData] = await Promise.all([
      apiFetch(`${API}/saved`),
      apiFetch(`${API}/hired`)
    ]);

    // Sync local state with server
    state.savedIds = new Set(savedData.data.map(s => s.id));
    state.hiredIds = new Set(hiredData.data.map(s => s.id));
    persistState();
    updateBadges();

    const total = savedData.count + hiredData.count;
    const totalSpend = hiredData.data.reduce((a, s) => a + s.price, 0);

    $('#dash-stat-saved').textContent = savedData.count;
    $('#dash-stat-hired').textContent = hiredData.count;
    $('#dash-stat-total').textContent = total;
    $('#dash-stat-spend').textContent = '$' + totalSpend.toLocaleString();

    renderSavedList(savedData.data);
    renderHiredList(hiredData.data);
  } catch (err) {
    showToast('Failed to load dashboard', err.message, 'error');
  }
}

function renderSavedList(items) {
  const el = $('#saved-list');
  if (!items.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">♡</div>
        <div class="empty-state__title">No saved services yet</div>
        <div class="empty-state__sub">Browse services and click the heart to save them</div>
      </div>`;
    return;
  }
  el.innerHTML = items.map(svc => `
    <div class="order-card">
      <div class="order-icon">${getCategoryIcon(svc.category)}</div>
      <div class="order-info">
        <div class="order-title">${svc.title}</div>
        <div class="order-meta">By ${svc.seller} · Saved ${formatDate(svc.savedAt)}</div>
      </div>
      <div class="order-right">
        <div class="order-price">$${svc.price}</div>
        <span class="status-badge status-saved">Saved</span>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="confirmHire(${svc.id})">Hire</button>
        <button class="btn btn-ghost btn-sm" onclick="toggleSave(${svc.id}).then(loadDashboard)">Remove</button>
      </div>
    </div>`).join('');
}

function renderHiredList(items) {
  const el = $('#hired-list');
  if (!items.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🚀</div>
        <div class="empty-state__title">No hired services yet</div>
        <div class="empty-state__sub">Find a service and hit Hire to get started</div>
      </div>`;
    return;
  }
  el.innerHTML = items.map(svc => `
    <div class="order-card">
      <div class="order-icon">${getCategoryIcon(svc.category)}</div>
      <div class="order-info">
        <div class="order-title">${svc.title}</div>
        <div class="order-meta">By ${svc.seller} · Order ${svc.orderId} · Hired ${formatDate(svc.hiredAt)}</div>
      </div>
      <div class="order-right">
        <div class="order-price">$${svc.price}</div>
        <span class="status-badge status-progress">${svc.status}</span>
      </div>
    </div>`).join('');
}

// Dashboard tabs
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    $$('.tab-content').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    $(`#tab-${btn.dataset.tab}`).classList.add('active');
  });
});

// ── Home Page Search ───────────────────────────
$('#hero-search-btn')?.addEventListener('click', () => {
  const val = $('#hero-search-input')?.value;
  if (val) {
    state.filters.search = val;
    const inp = $('#services-search');
    if (inp) inp.value = val;
  }
  navigate('services');
  renderServicesGrid('services-list');
});

$('#hero-search-input')?.addEventListener('keydown', e => {
  if (e.key === 'Enter') $('#hero-search-btn')?.click();
});

// Category pills on home
$$('.cat-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    $$('.cat-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
    state.filters.category = pill.dataset.cat || 'All';
    navigate('services');
    renderServicesGrid('services-list');
    const sel = $('#filter-category');
    if (sel) sel.value = state.filters.category;
  });
});

// View all services button
$('#view-all-btn')?.addEventListener('click', () => navigate('services'));

// ── Init ───────────────────────────────────────
async function init() {
  updateBadges();
  // Load featured services on home
  await renderServicesGrid('home-services-grid');
  // Init services page filters
  initServicesPage();
  // Load services page list (lazy)
  renderServicesGrid('services-list');
}

document.addEventListener('DOMContentLoaded', init);

// Close modals with Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeServiceModal();
    closeConfirmModal();
  }
});
