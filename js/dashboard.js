// ══════════════════════════════════════════════════════════════
// CS SFAXIEN — DASHBOARD & USER AUTH MODULE
// ══════════════════════════════════════════════════════════════

const UserAPI = {
    base: '/api/user',
    getToken() { return localStorage.getItem('cssUserToken'); },
    setToken(t) { localStorage.setItem('cssUserToken', t); },
    clearToken() { localStorage.removeItem('cssUserToken'); localStorage.removeItem('cssUser'); },
    getUser() { try { return JSON.parse(localStorage.getItem('cssUser')); } catch { return null; } },
    setUser(u) { localStorage.setItem('cssUser', JSON.stringify(u)); },

    async request(endpoint, options = {}) {
        const token = this.getToken();
        const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(this.base + endpoint, { ...options, headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur serveur');
        return data;
    },

    async register(data) {
        const res = await this.request('/register', { method: 'POST', body: JSON.stringify(data) });
        this.setToken(res.token);
        this.setUser(res.user);
        return res;
    },

    async login(email, password) {
        const res = await this.request('/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        this.setToken(res.token);
        this.setUser(res.user);
        return res;
    },

    async loginWithGoogle(credential) {
        const res = await this.request('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
        this.setToken(res.token);
        this.setUser(res.user);
        return res;
    },

    async loginWithFacebook(accessToken) {
        const res = await this.request('/auth/facebook', { method: 'POST', body: JSON.stringify({ accessToken }) });
        this.setToken(res.token);
        this.setUser(res.user);
        return res;
    },

    async getProfile() { return this.request('/me'); },
    async updateProfile(data) {
        const res = await this.request('/me', { method: 'PUT', body: JSON.stringify(data) });
        this.setUser(res);
        return res;
    },
    async changePassword(data) { return this.request('/password', { method: 'PUT', body: JSON.stringify(data) }); },
    async getDashboard() { return this.request('/dashboard'); },
    async getOrders() { return this.request('/orders'); },
    async createOrder(data) { return this.request('/orders', { method: 'POST', body: JSON.stringify(data) }); },
    async validatePromo(code, orderTotal) { return this.request('/promo/validate', { method: 'POST', body: JSON.stringify({ code, orderTotal }) }); },

    isLoggedIn() { return !!this.getToken() && !!this.getUser(); },
    logout() { this.clearToken(); window.location.href = 'index.html'; }
};

// ══════════════════════════════════════════════════════════════
// AUTH MODAL (Login / Register) — injected on every page
// ══════════════════════════════════════════════════════════════

function createAuthModal() {
    if (document.getElementById('authModal')) return;

    const modal = document.createElement('div');
    modal.id = 'authModal';
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-overlay" id="authOverlay"></div>
        <div class="auth-modal-box">
            <button class="auth-modal-close" id="authClose"><i class="fas fa-times"></i></button>
            <div class="auth-tabs">
                <button class="auth-tab active" data-auth="login">Connexion</button>
                <button class="auth-tab" data-auth="register">Inscription</button>
            </div>

            <!-- Login Form -->
            <form class="auth-form active" id="loginForm">
                <div class="auth-header">
                    <div class="auth-logo"><i class="fas fa-futbol"></i></div>
                    <h2>Bienvenue</h2>
                    <p>Connectez-vous à votre espace membre</p>
                </div>
                <div class="auth-social-buttons">
                    <button type="button" class="auth-social-btn auth-google-btn" id="googleLoginBtn">
                        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                        Continuer avec Google
                    </button>
                    <button type="button" class="auth-social-btn auth-facebook-btn" id="facebookLoginBtn">
                        <i class="fab fa-facebook" style="font-size:20px;color:#1877F2;"></i>
                        Continuer avec Facebook
                    </button>
                </div>
                <div class="auth-divider"><span>ou par email</span></div>
                <div class="auth-field">
                    <i class="fas fa-envelope"></i>
                    <input type="email" id="loginEmail" placeholder="Email" required autocomplete="email">
                </div>
                <div class="auth-field">
                    <i class="fas fa-lock"></i>
                    <input type="password" id="loginPassword" placeholder="Mot de passe" required autocomplete="current-password">
                </div>
                <div class="auth-error" id="loginError"></div>
                <button type="submit" class="auth-submit"><i class="fas fa-sign-in-alt"></i> Se connecter</button>
                <p class="auth-switch">Pas encore de compte ? <a href="#" data-switch="register">Inscrivez-vous</a></p>
            </form>

            <!-- Register Form -->
            <form class="auth-form" id="registerForm">
                <div class="auth-header">
                    <div class="auth-logo"><i class="fas fa-futbol"></i></div>
                    <h2>Créer un compte</h2>
                    <p>Rejoignez la famille CSS</p>
                </div>
                <div class="auth-social-buttons">
                    <button type="button" class="auth-social-btn auth-google-btn" id="googleRegBtn">
                        <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
                        S'inscrire avec Google
                    </button>
                    <button type="button" class="auth-social-btn auth-facebook-btn" id="facebookRegBtn">
                        <i class="fab fa-facebook" style="font-size:20px;color:#1877F2;"></i>
                        S'inscrire avec Facebook
                    </button>
                </div>
                <div class="auth-divider"><span>ou par email</span></div>
                <div class="auth-row">
                    <div class="auth-field">
                        <i class="fas fa-user"></i>
                        <input type="text" id="regFirstName" placeholder="Prénom" required>
                    </div>
                    <div class="auth-field">
                        <i class="fas fa-user"></i>
                        <input type="text" id="regLastName" placeholder="Nom" required>
                    </div>
                </div>
                <div class="auth-field">
                    <i class="fas fa-envelope"></i>
                    <input type="email" id="regEmail" placeholder="Email" required autocomplete="email">
                </div>
                <div class="auth-field">
                    <i class="fas fa-phone"></i>
                    <input type="tel" id="regPhone" placeholder="Téléphone (optionnel)">
                </div>
                <div class="auth-field">
                    <i class="fas fa-lock"></i>
                    <input type="password" id="regPassword" placeholder="Mot de passe (min 6 car.)" required minlength="6" autocomplete="new-password">
                </div>
                <div class="auth-field">
                    <i class="fas fa-lock"></i>
                    <input type="password" id="regConfirm" placeholder="Confirmer le mot de passe" required minlength="6" autocomplete="new-password">
                </div>
                <div class="auth-error" id="registerError"></div>
                <button type="submit" class="auth-submit"><i class="fas fa-user-plus"></i> S'inscrire</button>
                <p class="auth-switch">Déjà un compte ? <a href="#" data-switch="login">Connectez-vous</a></p>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    // Events
    const overlay = document.getElementById('authOverlay');
    const closeBtn = document.getElementById('authClose');
    const tabs = modal.querySelectorAll('.auth-tab');
    const forms = modal.querySelectorAll('.auth-form');
    const switches = modal.querySelectorAll('a[data-switch]');

    function switchTab(targetTab) {
        tabs.forEach(t => t.classList.toggle('active', t.dataset.auth === targetTab));
        forms.forEach(f => {
            if (targetTab === 'login') f.classList.toggle('active', f.id === 'loginForm');
            else f.classList.toggle('active', f.id === 'registerForm');
        });
    }

    overlay.addEventListener('click', () => closeAuthModal());
    closeBtn.addEventListener('click', () => closeAuthModal());
    tabs.forEach(t => t.addEventListener('click', () => switchTab(t.dataset.auth)));
    switches.forEach(s => s.addEventListener('click', (e) => { e.preventDefault(); switchTab(s.dataset.switch); }));

    // Login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('loginError');
        errEl.textContent = '';
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        try {
            await UserAPI.login(email, password);
            closeAuthModal();
            updateHeaderUserState();
            if (typeof showToast === 'function') showToast('Connexion réussie !', 'success');
            if (document.body.dataset.page === 'dashboard') loadDashboard();
        } catch (err) {
            errEl.textContent = err.message;
        }
    });

    // Register
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const errEl = document.getElementById('registerError');
        errEl.textContent = '';
        const firstName = document.getElementById('regFirstName').value.trim();
        const lastName = document.getElementById('regLastName').value.trim();
        const email = document.getElementById('regEmail').value.trim();
        const phone = document.getElementById('regPhone').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirm = document.getElementById('regConfirm').value;

        if (password !== confirm) { errEl.textContent = 'Les mots de passe ne correspondent pas'; return; }

        try {
            await UserAPI.register({ firstName, lastName, email, phone, password });
            closeAuthModal();
            updateHeaderUserState();
            if (typeof showToast === 'function') showToast('Compte créé avec succès ! Bienvenue 🎉', 'success');
            if (document.body.dataset.page === 'dashboard') loadDashboard();
        } catch (err) {
            errEl.textContent = err.message;
        }
    });

    // ── OAuth: Google Sign-In ──
    function initGoogleButtons() {
        if (typeof google === 'undefined' || !google.accounts || !google.accounts.id) {
            if (window.GOOGLE_CLIENT_ID) setTimeout(initGoogleButtons, 500);
            return;
        }
        google.accounts.id.initialize({
            client_id: window.GOOGLE_CLIENT_ID,
            callback: async (response) => {
                const errEl = document.getElementById('loginError') || document.getElementById('registerError');
                try {
                    const res = await UserAPI.loginWithGoogle(response.credential);
                    closeAuthModal();
                    updateHeaderUserState();
                    const msg = res.isNew ? 'Compte créé avec Google ! Bienvenue 🎉' : 'Connexion Google réussie !';
                    if (typeof showToast === 'function') showToast(msg, 'success');
                    if (document.body.dataset.page === 'dashboard') loadDashboard();
                } catch (err) {
                    if (errEl) errEl.textContent = err.message;
                }
            },
            ux_mode: 'popup'
        });
    }
    initGoogleButtons();

    // Google custom button click → trigger One Tap prompt
    function handleGoogleOAuth() {
        if (typeof google !== 'undefined' && google.accounts && google.accounts.id) {
            google.accounts.id.prompt();
        } else {
            if (typeof showToast === 'function') showToast('Google Sign-In non disponible', 'error');
        }
    }

    document.getElementById('googleLoginBtn').addEventListener('click', handleGoogleOAuth);
    document.getElementById('googleRegBtn').addEventListener('click', handleGoogleOAuth);

    // ── OAuth: Facebook Login (redirect flow) ──
    function handleFacebookOAuth() {
        window.location.href = '/api/user/auth/facebook/redirect';
    }

    document.getElementById('facebookLoginBtn').addEventListener('click', handleFacebookOAuth);
    document.getElementById('facebookRegBtn').addEventListener('click', handleFacebookOAuth);
}

function openAuthModal(tab = 'login') {
    createAuthModal();
    const modal = document.getElementById('authModal');
    modal.classList.add('active');
    const tabs = modal.querySelectorAll('.auth-tab');
    const forms = modal.querySelectorAll('.auth-form');
    tabs.forEach(t => t.classList.toggle('active', t.dataset.auth === tab));
    forms.forEach(f => {
        if (tab === 'login') f.classList.toggle('active', f.id === 'loginForm');
        else f.classList.toggle('active', f.id === 'registerForm');
    });
}

function closeAuthModal() {
    const modal = document.getElementById('authModal');
    if (modal) modal.classList.remove('active');
}

// ══════════════════════════════════════════════════════════════
// HEADER USER BUTTON STATE
// ══════════════════════════════════════════════════════════════

function updateHeaderUserState() {
    const btn = document.getElementById('userAccountBtn');
    const nameEl = document.getElementById('userBtnName');
    if (!btn) return;

    // Remove old listener to avoid stacking
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    if (UserAPI.isLoggedIn()) {
        const user = UserAPI.getUser();
        newBtn.href = 'dashboard.html';
        newBtn.classList.add('logged-in');
        newBtn.innerHTML = `<i class="fas fa-user-circle"></i><span class="user-btn-name">${escapeHtmlSafe(user.firstName || 'Mon Espace')}</span>`;
    } else {
        newBtn.href = '#';
        newBtn.classList.remove('logged-in');
        newBtn.innerHTML = `<i class="fas fa-user-circle"></i><span class="user-btn-name">Connexion</span>`;
        newBtn.addEventListener('click', (e) => {
            if (!UserAPI.isLoggedIn()) {
                e.preventDefault();
                openAuthModal('login');
            }
        });
    }
}

function escapeHtmlSafe(t) {
    if (!t) return '';
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD PAGE LOGIC
// ══════════════════════════════════════════════════════════════

async function loadDashboard() {
    if (!UserAPI.isLoggedIn()) {
        openAuthModal('login');
        return;
    }

    try {
        const data = await UserAPI.getDashboard();
        renderDashboard(data);
    } catch (err) {
        console.error('Dashboard load error:', err);
        if (err.message.includes('expirée') || err.message.includes('invalide')) {
            UserAPI.clearToken();
            openAuthModal('login');
        }
    }
}

function renderDashboard(data) {
    const { user, stats, recentOrders, membership, socialMember } = data;

    // Welcome
    const nameEl = document.getElementById('dashUserName');
    if (nameEl) nameEl.textContent = `Bienvenue, ${user.firstName} !`;

    const emailEl = document.getElementById('dashEmail');
    if (emailEl) emailEl.textContent = user.email;

    const avatarEl = document.getElementById('dashAvatar');
    if (avatarEl) {
        const initials = (user.firstName[0] || '') + (user.lastName[0] || '');
        avatarEl.innerHTML = `<span>${initials.toUpperCase()}</span>`;
    }

    // Membership badge
    const memberEl = document.getElementById('dashMembership');
    if (memberEl) {
        const tierLabels = { standard: 'Standard', silver: 'Silver', gold: 'Gold', platinum: 'Platinum' };
        const tierIcons = { standard: 'fa-user', silver: 'fa-medal', gold: 'fa-trophy', platinum: 'fa-gem' };
        memberEl.innerHTML = `<i class="fas ${tierIcons[membership] || 'fa-user'}"></i> <span>${tierLabels[membership] || 'Standard'}</span>`;
        memberEl.className = `dash-membership tier-${membership}`;
    }

    // Social Member Card
    const smCard = document.getElementById('dashSocialMemberCard');
    if (smCard) {
        if (socialMember) {
            smCard.style.display = '';
            const statusLabels = { active: '✓ Actif', expired: '⚠ Expiré', suspended: '✗ Suspendu' };
            const statusColors = { active: '#22c55e', expired: '#eab308', suspended: '#ef4444' };
            document.getElementById('smCardName').textContent = `${socialMember.firstName} ${socialMember.lastName}`;
            document.getElementById('smCardNumber').textContent = socialMember.memberNumber;
            document.getElementById('smCardPlan').textContent = socialMember.plan || '—';
            document.getElementById('smCardSeason').textContent = socialMember.season || '—';
            const statusEl = document.getElementById('smCardStatus');
            statusEl.textContent = statusLabels[socialMember.status] || socialMember.status;
            statusEl.style.color = statusColors[socialMember.status] || '#fff';
        } else {
            smCard.style.display = 'none';
        }
    }

    // Points
    const pointsEl = document.getElementById('dashPoints');
    if (pointsEl) animateCounter(pointsEl, user.loyaltyPoints || 0);

    // Stats
    animateCounter(document.getElementById('statOrders'), stats.totalOrders);
    animateCounter(document.getElementById('statTickets'), stats.totalTickets);
    animateCounter(document.getElementById('statDonations'), stats.totalDonations);
    animateCounter(document.getElementById('statSpent'), stats.totalSpent);

    // Orders list
    renderOrders(recentOrders);

    // Profile form prefill
    if (document.getElementById('profFirstName')) document.getElementById('profFirstName').value = user.firstName || '';
    if (document.getElementById('profLastName')) document.getElementById('profLastName').value = user.lastName || '';
    if (document.getElementById('profPhone')) document.getElementById('profPhone').value = user.phone || '';
    if (document.getElementById('profAddress')) document.getElementById('profAddress').value = user.address || '';
    if (document.getElementById('profCity')) document.getElementById('profCity').value = user.city || '';

    // Membership progress
    renderMembershipProgress(stats.totalSpent, membership);

    // Highlight current tier
    document.querySelectorAll('.tier-item').forEach(t => {
        t.classList.toggle('current', t.dataset.tier === membership);
    });
}

function renderOrders(orders) {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    if (!orders || !orders.length) {
        container.innerHTML = '<div class="dash-empty"><i class="fas fa-receipt"></i><p>Aucune commande pour le moment. Rendez-vous dans "Actions Rapides" pour votre premier achat !</p></div>';
        return;
    }

    const typeIcons = { ticket: 'fa-ticket-alt', product: 'fa-shirt', subscription: 'fa-id-card', donation: 'fa-hand-holding-heart' };
    const statusLabels = { pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée', delivered: 'Livrée', cancelled: 'Annulée' };
    const statusColors = { pending: '#f59e0b', confirmed: '#10b981', shipped: '#3b82f6', delivered: '#059669', cancelled: '#ef4444' };

    container.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        return `
            <div class="dash-order-card">
                <div class="order-header">
                    <div class="order-ref"><i class="fas fa-hashtag"></i> ${escapeHtmlSafe(order.reference)}</div>
                    <div class="order-date"><i class="far fa-calendar-alt"></i> ${date}</div>
                    <div class="order-status" style="--status-color:${statusColors[order.status] || '#888'}">${statusLabels[order.status] || order.status}</div>
                </div>
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <i class="fas ${typeIcons[item.type] || 'fa-box'}"></i>
                            <div class="order-item-info">
                                <strong>${escapeHtmlSafe(item.label)}</strong>
                                ${item.details ? `<small>${escapeHtmlSafe(item.details)}</small>` : ''}
                            </div>
                            <span class="order-item-qty">x${item.quantity}</span>
                            <span class="order-item-price">${item.unitPrice * item.quantity} TND</span>
                        </div>
                    `).join('')}
                </div>
                <div class="order-footer">
                    ${order.discount > 0 ? `<span class="order-discount"><i class="fas fa-tag"></i> -${order.discount} TND ${order.promoCode ? `(${escapeHtmlSafe(order.promoCode)})` : ''}</span>` : ''}
                    <span class="order-total"><strong>Total : ${order.total} TND</strong></span>
                </div>
            </div>
        `;
    }).join('');
}

function renderMembershipProgress(totalSpent, currentTier) {
    const fill = document.getElementById('membershipBarFill');
    const next = document.getElementById('membershipNext');
    if (!fill || !next) return;

    const tiers = [
        { name: 'standard', min: 0 },
        { name: 'silver', min: 400 },
        { name: 'gold', min: 1000 },
        { name: 'platinum', min: 2000 }
    ];

    const currentIdx = tiers.findIndex(t => t.name === currentTier);
    if (currentIdx >= tiers.length - 1) {
        fill.style.width = '100%';
        next.textContent = 'Vous êtes au niveau maximum ! 🎉';
    } else {
        const current = tiers[currentIdx];
        const nextTier = tiers[currentIdx + 1];
        const progress = Math.min(100, ((totalSpent - current.min) / (nextTier.min - current.min)) * 100);
        fill.style.width = progress + '%';
        const remaining = nextTier.min - totalSpent;
        next.textContent = `Encore ${remaining} TND pour atteindre ${nextTier.name.charAt(0).toUpperCase() + nextTier.name.slice(1)}`;
    }
}

function animateCounter(el, target) {
    if (!el) return;
    let current = 0;
    const step = Math.max(1, Math.ceil(target / 40));
    const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current.toLocaleString('fr-FR');
    }, 30);
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD TABS
// ══════════════════════════════════════════════════════════════

function initDashTabs() {
    const tabs = document.querySelectorAll('.dash-tab');
    const contents = {
        'orders': document.getElementById('tabOrders'),
        'quick-actions': document.getElementById('tabQuickActions'),
        'profile': document.getElementById('tabProfile')
    };

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            Object.values(contents).forEach(c => { if (c) c.classList.remove('active'); });
            const target = contents[tab.dataset.tab];
            if (target) target.classList.add('active');
        });
    });
}

// ══════════════════════════════════════════════════════════════
// QUICK ACTIONS — TICKET PURCHASE
// ══════════════════════════════════════════════════════════════

let ticketPromoDiscount = null;
let prodPromoDiscount = null;
let subPromoDiscount = null;

async function initQuickTicket() {
    const matchSelect = document.getElementById('quickTicketMatch');
    const zoneSelect = document.getElementById('quickTicketZone');
    if (!matchSelect || !zoneSelect) return;

    // Load ticket matches
    try {
        const res = await fetch('/api/ticketMatches');
        const matches = await res.json();
        matches.filter(m => m.available).forEach(m => {
            const opt = document.createElement('option');
            opt.value = m.id || m._id;
            opt.textContent = `${m.home} vs ${m.away} — ${m.date}`;
            opt.dataset.comp = m.comp;
            matchSelect.appendChild(opt);
        });
    } catch(e) { console.error(e); }

    // Load zones
    try {
        const res = await fetch('/api/stadiumZones');
        const zones = await res.json();
        zones.forEach(z => {
            const opt = document.createElement('option');
            opt.value = z.id || z._id;
            opt.textContent = `${z.name} — ${z.price} TND`;
            opt.dataset.price = z.price;
            zoneSelect.appendChild(opt);
        });
    } catch(e) { console.error(e); }

    let qty = 1;
    const qtyEl = document.getElementById('qtTicketQty');
    const totalEl = document.getElementById('quickTicketTotal');
    const discountInfo = document.getElementById('ticketDiscountInfo');

    function updateTicketTotal() {
        const zoneOpt = zoneSelect.selectedOptions[0];
        const price = zoneOpt ? parseFloat(zoneOpt.dataset.price || 0) : 0;
        let subtotal = price * qty;
        let discount = 0;
        if (ticketPromoDiscount) {
            if (ticketPromoDiscount.type === 'percent') discount = Math.round(subtotal * ticketPromoDiscount.discount / 100);
            else discount = Math.min(ticketPromoDiscount.discount, subtotal);
        }
        const total = Math.max(0, subtotal - discount);
        totalEl.textContent = total + ' TND';
        if (discount > 0) discountInfo.textContent = `(-${discount} TND remise)`;
        else discountInfo.textContent = '';
    }

    document.getElementById('qtTicketMinus').addEventListener('click', () => { if (qty > 1) { qty--; qtyEl.textContent = qty; updateTicketTotal(); } });
    document.getElementById('qtTicketPlus').addEventListener('click', () => { if (qty < 10) { qty++; qtyEl.textContent = qty; updateTicketTotal(); } });
    zoneSelect.addEventListener('change', updateTicketTotal);
    matchSelect.addEventListener('change', updateTicketTotal);

    // Promo
    document.getElementById('ticketApplyPromo').addEventListener('click', async () => {
        const code = document.getElementById('ticketPromoCode').value.trim();
        if (!code) return;
        try {
            const zoneOpt = zoneSelect.selectedOptions[0];
            const price = zoneOpt ? parseFloat(zoneOpt.dataset.price || 0) : 0;
            const result = await UserAPI.validatePromo(code, price * qty);
            ticketPromoDiscount = result;
            updateTicketTotal();
            showToast(`Code promo "${result.code}" appliqué !`, 'success');
        } catch (err) {
            ticketPromoDiscount = null;
            updateTicketTotal();
            showToast(err.message, 'error');
        }
    });

    // Buy
    document.getElementById('quickTicketBuy').addEventListener('click', async () => {
        if (!UserAPI.isLoggedIn()) { openAuthModal(); return; }
        const matchOpt = matchSelect.selectedOptions[0];
        const zoneOpt = zoneSelect.selectedOptions[0];
        if (!matchOpt || !matchOpt.value || !zoneOpt || !zoneOpt.value) {
            showToast('Sélectionnez un match et une zone', 'error');
            return;
        }

        const price = parseFloat(zoneOpt.dataset.price || 0);
        try {
            const result = await UserAPI.createOrder({
                items: [{
                    type: 'ticket',
                    label: matchOpt.textContent,
                    details: zoneOpt.textContent,
                    quantity: qty,
                    unitPrice: price
                }],
                promoCode: document.getElementById('ticketPromoCode').value.trim(),
                paymentMethod: 'card'
            });
            showToast(`Billet acheté ! Réf: ${result.order.reference} (+${result.pointsEarned} pts)`, 'success');
            ticketPromoDiscount = null;
            document.getElementById('ticketPromoCode').value = '';
            loadDashboard();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ══════════════════════════════════════════════════════════════
// QUICK ACTIONS — PRODUCT PURCHASE
// ══════════════════════════════════════════════════════════════

async function initQuickStore() {
    const prodSelect = document.getElementById('quickProduct');
    if (!prodSelect) return;

    try {
        const res = await fetch('/api/products');
        const products = await res.json();
        products.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id || p._id;
            opt.textContent = `${p.name} — ${p.price} TND`;
            opt.dataset.price = p.price;
            opt.dataset.image = p.image || '';
            prodSelect.appendChild(opt);
        });
    } catch(e) { console.error(e); }

    let qty = 1;
    const qtyEl = document.getElementById('qtProdQty');
    const totalEl = document.getElementById('quickProdTotal');
    const discountInfo = document.getElementById('prodDiscountInfo');

    function updateProdTotal() {
        const prodOpt = prodSelect.selectedOptions[0];
        const price = prodOpt ? parseFloat(prodOpt.dataset.price || 0) : 0;
        let subtotal = price * qty;
        let discount = 0;
        if (prodPromoDiscount) {
            if (prodPromoDiscount.type === 'percent') discount = Math.round(subtotal * prodPromoDiscount.discount / 100);
            else discount = Math.min(prodPromoDiscount.discount, subtotal);
        }
        const total = Math.max(0, subtotal - discount);
        totalEl.textContent = total + ' TND';
        if (discount > 0) discountInfo.textContent = `(-${discount} TND remise)`;
        else discountInfo.textContent = '';
    }

    document.getElementById('qtProdMinus').addEventListener('click', () => { if (qty > 1) { qty--; qtyEl.textContent = qty; updateProdTotal(); } });
    document.getElementById('qtProdPlus').addEventListener('click', () => { if (qty < 10) { qty++; qtyEl.textContent = qty; updateProdTotal(); } });
    prodSelect.addEventListener('change', updateProdTotal);

    document.getElementById('prodApplyPromo').addEventListener('click', async () => {
        const code = document.getElementById('prodPromoCode').value.trim();
        if (!code) return;
        try {
            const prodOpt = prodSelect.selectedOptions[0];
            const price = prodOpt ? parseFloat(prodOpt.dataset.price || 0) : 0;
            const result = await UserAPI.validatePromo(code, price * qty);
            prodPromoDiscount = result;
            updateProdTotal();
            showToast(`Code promo "${result.code}" appliqué !`, 'success');
        } catch (err) {
            prodPromoDiscount = null;
            updateProdTotal();
            showToast(err.message, 'error');
        }
    });

    document.getElementById('quickProdBuy').addEventListener('click', async () => {
        if (!UserAPI.isLoggedIn()) { openAuthModal(); return; }
        const prodOpt = prodSelect.selectedOptions[0];
        if (!prodOpt || !prodOpt.value) { showToast('Sélectionnez un produit', 'error'); return; }
        const price = parseFloat(prodOpt.dataset.price || 0);
        try {
            const result = await UserAPI.createOrder({
                items: [{
                    type: 'product',
                    label: prodOpt.textContent.split(' — ')[0],
                    quantity: qty,
                    unitPrice: price,
                    image: prodOpt.dataset.image || ''
                }],
                promoCode: document.getElementById('prodPromoCode').value.trim(),
                paymentMethod: 'card'
            });
            showToast(`Commande passée ! Réf: ${result.order.reference} (+${result.pointsEarned} pts)`, 'success');
            prodPromoDiscount = null;
            document.getElementById('prodPromoCode').value = '';
            loadDashboard();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ══════════════════════════════════════════════════════════════
// QUICK ACTIONS — SUBSCRIPTION
// ══════════════════════════════════════════════════════════════

async function initQuickSub() {
    const subSelect = document.getElementById('quickSubPlan');
    if (!subSelect) return;

    try {
        const res = await fetch('/api/subPlans');
        const plans = await res.json();
        plans.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.id || p._id;
            opt.textContent = `${p.name} — ${p.price} TND / ${p.period}`;
            opt.dataset.price = p.price;
            subSelect.appendChild(opt);
        });
    } catch(e) { console.error(e); }

    const totalEl = document.getElementById('quickSubTotal');
    const discountInfo = document.getElementById('subDiscountInfo');

    function updateSubTotal() {
        const opt = subSelect.selectedOptions[0];
        const price = opt ? parseFloat(opt.dataset.price || 0) : 0;
        let discount = 0;
        if (subPromoDiscount) {
            if (subPromoDiscount.type === 'percent') discount = Math.round(price * subPromoDiscount.discount / 100);
            else discount = Math.min(subPromoDiscount.discount, price);
        }
        const total = Math.max(0, price - discount);
        totalEl.textContent = total + ' TND';
        if (discount > 0) discountInfo.textContent = `(-${discount} TND remise)`;
        else discountInfo.textContent = '';
    }

    subSelect.addEventListener('change', updateSubTotal);

    document.getElementById('subApplyPromo').addEventListener('click', async () => {
        const code = document.getElementById('subPromoCode').value.trim();
        if (!code) return;
        try {
            const opt = subSelect.selectedOptions[0];
            const price = opt ? parseFloat(opt.dataset.price || 0) : 0;
            const result = await UserAPI.validatePromo(code, price);
            subPromoDiscount = result;
            updateSubTotal();
            showToast(`Code promo "${result.code}" appliqué !`, 'success');
        } catch (err) {
            subPromoDiscount = null;
            updateSubTotal();
            showToast(err.message, 'error');
        }
    });

    document.getElementById('quickSubBuy').addEventListener('click', async () => {
        if (!UserAPI.isLoggedIn()) { openAuthModal(); return; }
        const opt = subSelect.selectedOptions[0];
        if (!opt || !opt.value) { showToast('Sélectionnez un plan', 'error'); return; }
        const price = parseFloat(opt.dataset.price || 0);
        try {
            const result = await UserAPI.createOrder({
                items: [{
                    type: 'subscription',
                    label: opt.textContent.split(' — ')[0],
                    details: opt.textContent,
                    quantity: 1,
                    unitPrice: price
                }],
                promoCode: document.getElementById('subPromoCode').value.trim(),
                paymentMethod: 'card'
            });
            showToast(`Abonnement souscrit ! Réf: ${result.order.reference} (+${result.pointsEarned} pts)`, 'success');
            subPromoDiscount = null;
            document.getElementById('subPromoCode').value = '';
            loadDashboard();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ══════════════════════════════════════════════════════════════
// QUICK ACTIONS — DONATION
// ══════════════════════════════════════════════════════════════

function initQuickDonation() {
    const amountInput = document.getElementById('donAmount');
    const presets = document.querySelectorAll('.don-preset');
    if (!amountInput) return;

    presets.forEach(btn => {
        btn.addEventListener('click', () => {
            presets.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            amountInput.value = btn.dataset.amount;
        });
    });

    document.getElementById('quickDonBtn').addEventListener('click', async () => {
        if (!UserAPI.isLoggedIn()) { openAuthModal(); return; }
        const amount = parseFloat(amountInput.value);
        if (!amount || amount < 1) { showToast('Montant invalide', 'error'); return; }

        const message = document.getElementById('donMessage').value.trim();
        try {
            const result = await UserAPI.createOrder({
                items: [{
                    type: 'donation',
                    label: 'Don pour le CS Sfaxien',
                    details: message || 'Don anonyme',
                    quantity: 1,
                    unitPrice: amount
                }],
                paymentMethod: 'transfer'
            });
            showToast(`Merci pour votre don de ${amount} TND ! Réf: ${result.order.reference}`, 'success');
            amountInput.value = '';
            document.getElementById('donMessage').value = '';
            presets.forEach(b => b.classList.remove('active'));
            loadDashboard();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

// ══════════════════════════════════════════════════════════════
// PROFILE FORMS
// ══════════════════════════════════════════════════════════════

function initProfileForms() {
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                await UserAPI.updateProfile({
                    firstName: document.getElementById('profFirstName').value.trim(),
                    lastName: document.getElementById('profLastName').value.trim(),
                    phone: document.getElementById('profPhone').value.trim(),
                    address: document.getElementById('profAddress').value.trim(),
                    city: document.getElementById('profCity').value.trim()
                });
                showToast('Profil mis à jour !', 'success');
                updateHeaderUserState();
                loadDashboard();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPwd = document.getElementById('profNewPwd').value;
            const confirm = document.getElementById('profConfirmPwd').value;
            if (newPwd !== confirm) { showToast('Les mots de passe ne correspondent pas', 'error'); return; }
            try {
                await UserAPI.changePassword({
                    currentPassword: document.getElementById('profCurrentPwd').value,
                    newPassword: newPwd
                });
                showToast('Mot de passe modifié !', 'success');
                passwordForm.reset();
            } catch (err) {
                showToast(err.message, 'error');
            }
        });
    }

    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => UserAPI.logout());
    }
}

// ══════════════════════════════════════════════════════════════
// INITIALIZATION
// ══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
    // Handle Facebook OAuth redirect callback
    const urlParams = new URLSearchParams(window.location.search);
    const fbToken = urlParams.get('fb_token');
    const fbNew = urlParams.get('fb_new');
    const fbError = urlParams.get('fb_error');

    if (fbToken) {
        // Store token and fetch user profile
        UserAPI.setToken(fbToken);
        window.history.replaceState({}, '', window.location.pathname);
        UserAPI.getProfile().then(user => {
            UserAPI.setUser(user);
            updateHeaderUserState();
            const msg = fbNew === '1' ? 'Compte créé avec Facebook ! Bienvenue 🎉' : 'Connexion Facebook réussie !';
            if (typeof showToast === 'function') showToast(msg, 'success');
            if (document.body.dataset.page === 'dashboard') loadDashboard();
        }).catch(() => {
            UserAPI.clearToken();
            if (typeof showToast === 'function') showToast('Erreur de connexion Facebook', 'error');
        });
    } else if (fbError) {
        window.history.replaceState({}, '', window.location.pathname);
        setTimeout(() => { if (typeof showToast === 'function') showToast('Connexion Facebook annulée', 'error'); }, 500);
    }

    // Always update header user state and create auth modal
    updateHeaderUserState();

    // Only run dashboard-specific code on dashboard page
    if (document.body.dataset.page === 'dashboard') {
        initDashTabs();
        initQuickTicket();
        initQuickStore();
        initQuickSub();
        initQuickDonation();
        initProfileForms();
        loadDashboard();
    }
});
