/**
 * CS SFAXIEN - Admin Dashboard Logic
 * Gestion CRUD via API MongoDB
 */
// API_BASE is already defined in app.js

function getAuthHeaders() {
    const token = localStorage.getItem('cssfaxien_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

async function apiGet(path) {
    const res = await fetch(`${API_BASE}/${path}`);
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
}

async function apiPost(path, data) {
    const res = await fetch(`${API_BASE}/${path}`, { method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data) });
    if (res.status === 401) { showLoginModal(); throw new Error('Non autorisé'); }
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
}

async function apiDelete(path) {
    const res = await fetch(`${API_BASE}/${path}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.status === 401) { showLoginModal(); throw new Error('Non autorisé'); }
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
}

async function apiPut(path, data) {
    const res = await fetch(`${API_BASE}/${path}`, { method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data) });
    if (res.status === 401) { showLoginModal(); throw new Error('Non autorisé'); }
    if (!res.ok) throw new Error('Erreur API');
    return res.json();
}

// ===== FILE UPLOAD HELPER =====
async function uploadFile(fileInput) {
    const file = fileInput.files[0];
    if (!file) return null;
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('cssfaxien_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/upload/single`, { method: 'POST', headers, body: formData });
    if (res.status === 401) { showLoginModal(); throw new Error('Non autorisé'); }
    if (!res.ok) throw new Error('Erreur upload');
    const data = await res.json();
    return data.url;
}

function initUploadZone(fileInputId, previewId, hiddenId, zoneId, videoPreviewId) {
    const fileInput = document.getElementById(fileInputId);
    const zone = document.getElementById(zoneId);
    if (!fileInput || !zone) return;

    // Drag & drop
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
    zone.addEventListener('drop', e => {
        e.preventDefault(); zone.classList.remove('dragover');
        if (e.dataTransfer.files.length) { fileInput.files = e.dataTransfer.files; fileInput.dispatchEvent(new Event('change')); }
    });

    fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (!file) return;
        zone.classList.add('has-file');
        const preview = document.getElementById(previewId);
        const vidPreview = videoPreviewId ? document.getElementById(videoPreviewId) : null;

        if (file.type.startsWith('image/') && preview) {
            const reader = new FileReader();
            reader.onload = e => { preview.src = e.target.result; preview.style.display = 'block'; };
            reader.readAsDataURL(file);
            if (vidPreview) vidPreview.style.display = 'none';
        } else if (file.type.startsWith('video/') && vidPreview) {
            vidPreview.src = URL.createObjectURL(file);
            vidPreview.style.display = 'block';
            if (preview) preview.style.display = 'none';
        }
    });
}

function resetUploadZone(fileInputId, previewId, hiddenId, zoneId, videoPreviewId) {
    const fileInput = document.getElementById(fileInputId);
    const preview = document.getElementById(previewId);
    const hidden = document.getElementById(hiddenId);
    const zone = document.getElementById(zoneId);
    if (fileInput) fileInput.value = '';
    if (preview) { preview.style.display = 'none'; preview.src = ''; }
    if (hidden) hidden.value = '';
    if (zone) zone.classList.remove('has-file');
    if (videoPreviewId) { const vp = document.getElementById(videoPreviewId); if (vp) { vp.style.display = 'none'; vp.src = ''; } }
}

// ===== LOGIN =====
function showLoginModal() {
    let modal = document.getElementById('loginModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'loginModal';
        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:99999;';
        modal.innerHTML = `
            <div style="background:#1a1a1a;padding:40px;border-radius:12px;width:400px;max-width:90vw;">
                <h2 style="color:#fff;margin-bottom:20px;text-align:center;"><i class="fas fa-lock"></i> Connexion Admin</h2>
                <div id="loginError" style="color:#e74c3c;text-align:center;margin-bottom:15px;display:none;"></div>
                <form id="loginForm" onsubmit="return false;" novalidate>
                    <input type="text" id="loginUsername" placeholder="Nom d'utilisateur" autocomplete="username" style="width:100%;padding:12px;margin-bottom:15px;border:1px solid #333;background:#111;color:#fff;border-radius:8px;box-sizing:border-box;">
                    <input type="password" id="loginPassword" placeholder="Mot de passe" autocomplete="current-password" style="width:100%;padding:12px;margin-bottom:20px;border:1px solid #333;background:#111;color:#fff;border-radius:8px;box-sizing:border-box;">
                    <button type="submit" id="loginBtn" style="width:100%;padding:12px;background:#e74c3c;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:16px;font-weight:bold;">Se connecter</button>
                </form>
            </div>`;
        document.body.appendChild(modal);
        document.getElementById('loginForm').addEventListener('submit', (e) => { e.preventDefault(); handleLogin(); });
        document.getElementById('loginBtn').addEventListener('click', handleLogin);
    }
    modal.style.display = 'flex';
}

async function handleLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errorEl = document.getElementById('loginError');
    
    if (!username || !password) {
        errorEl.textContent = 'Veuillez remplir tous les champs';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (!res.ok) {
            errorEl.textContent = data.error || 'Identifiants incorrects';
            errorEl.style.display = 'block';
            return;
        }
        localStorage.setItem('cssfaxien_token', data.token);
        document.getElementById('loginModal').style.display = 'none';
        showToast('Connexion réussie !');
    } catch {
        errorEl.textContent = 'Erreur de connexion au serveur';
        errorEl.style.display = 'block';
    }
}

async function checkAuth() {
    const token = localStorage.getItem('cssfaxien_token');
    if (!token) { showLoginModal(); return; }
    try {
        const res = await fetch(`${API_BASE}/auth/check`, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (!data.authenticated) { localStorage.removeItem('cssfaxien_token'); showLoginModal(); }
    } catch { showLoginModal(); }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    await checkAuth();

    // ===== SIDEBAR NAVIGATION =====
    const navLinks = document.querySelectorAll('.admin-nav-link[data-panel]');
    const panels = document.querySelectorAll('.admin-panel');

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navLinks.forEach(l => l.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            link.classList.add('active');
            const panel = document.getElementById(`panel-${link.dataset.panel}`);
            if (panel) panel.classList.add('active');
            // Load settings when settings panel is opened
            if (link.dataset.panel === 'settings') loadSettings();
        });
    });

    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => { if (!input.value) input.value = today; });

    // Setup all forms
    setupMatchForm();
    setupFixtureForm();
    setupStandingsForm();
    setupProductForm();
    setupNewsForm();
    setupPlayerForm();
    setupGalleryForm();
    setupTimelineForm();
    setupTrophyForm();
    setupLegendForm();
    setupTicketMatchForm();
    setupStadiumZoneForm();
    setupSubPlanForm();
    setupMeetingForm();
    setupLineupForm();
    setupDonorForm();
    setupSocialMemberForm();

    // Load all tables
    refreshMatchesTable();
    refreshFixturesTable();
    refreshStandingsTable();
    refreshProductsTable();
    refreshNewsTable();
    refreshPlayersTable();
    refreshGalleryTable();
    refreshTimelineTable();
    refreshTrophiesTable();
    refreshLegendsTable();
    refreshTicketMatchesTable();
    refreshZonesTable();
    refreshSubPlansTable();
    refreshMeetingsTable();
    refreshLineupPreview();
    refreshDonorsTable();
    refreshSocialMembersTable();
    loadMemberStats();

    // Toggle player/staff fields
    const catSelect = document.getElementById('playerCategory');
    if (catSelect) {
        catSelect.addEventListener('change', () => {
            const isStaff = catSelect.value === 'coach' || catSelect.value === 'staff';
            document.getElementById('playerFieldsRow').style.display = isStaff ? 'none' : '';
            document.getElementById('playerStatsRow').style.display = isStaff ? 'none' : '';
            document.getElementById('staffFieldsRow').style.display = isStaff ? '' : 'none';
        });
    }

    const galleryCatSelect = document.getElementById('galleryCategory');
    if (galleryCatSelect) {
        galleryCatSelect.addEventListener('change', () => {
            const isVideo = galleryCatSelect.value === 'video';
            document.getElementById('galleryVideoFields').style.display = isVideo ? '' : 'none';
            // Update file accept type
            const galleryFile = document.getElementById('galleryFile');
            if (galleryFile) galleryFile.accept = isVideo ? 'video/*' : 'image/*';
        });
    }

    // Init upload zones
    initUploadZone('productImageFile', 'productImagePreview', 'productImage', 'productImageZone');
    initUploadZone('newsImageFile', 'newsImagePreview', 'newsImage', 'newsImageZone');
    initUploadZone('playerImageFile', 'playerImagePreview', 'playerImage', 'playerImageZone');
    initUploadZone('legendImageFile', 'legendImagePreview', 'legendImage', 'legendImageZone');
    initUploadZone('galleryFile', 'galleryFilePreview', 'galleryFileUrl', 'galleryFileZone', 'galleryVideoPreview');
});

// ===== MATCH FORM =====
let allMatchesData = [];
let matchFilterType = 'all';
let matchSearchTerm = '';
let matchViewMode = 'cards';
let matchCurrentPage = 1;
const MATCHES_PER_PAGE = 12;
let matchEvents = [];
let editingMatchId = null;

function setupMatchForm() {
    const form = document.getElementById('matchForm');
    if (!form) return;

    // Live preview listeners
    ['matchHomeTeam','matchAwayTeam','matchHomeScore','matchAwayScore','matchDate','matchTime','matchCompetition','matchVenue','matchStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.addEventListener('input', updateMatchPreview); el.addEventListener('change', updateMatchPreview); }
    });

    // Competition custom toggle
    const compSelect = document.getElementById('matchCompetition');
    const compCustom = document.getElementById('matchCompetitionCustom');
    if (compSelect && compCustom) {
        compSelect.addEventListener('change', () => {
            compCustom.style.display = compSelect.value === 'autre' ? '' : 'none';
            updateMatchPreview();
        });
    }

    // Possession auto-sync
    const possHome = document.getElementById('statPossHome');
    const possAway = document.getElementById('statPossAway');
    if (possHome && possAway) {
        possHome.addEventListener('input', () => {
            const v = parseInt(possHome.value) || 0;
            possAway.value = Math.max(0, 100 - v);
            updatePossessionBar();
        });
        possAway.addEventListener('input', () => {
            const v = parseInt(possAway.value) || 0;
            possHome.value = Math.max(0, 100 - v);
            updatePossessionBar();
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const comp = document.getElementById('matchCompetition');
            const compC = document.getElementById('matchCompetitionCustom');
            const competition = comp.value === 'autre' ? compC.value.trim() : comp.value;

            const matchData = {
                homeTeam: document.getElementById('matchHomeTeam').value.trim(),
                awayTeam: document.getElementById('matchAwayTeam').value.trim(),
                homeScore: document.getElementById('matchHomeScore').value,
                awayScore: document.getElementById('matchAwayScore').value,
                date: document.getElementById('matchDate').value,
                time: document.getElementById('matchTime').value || '14:00',
                competition,
                venue: document.getElementById('matchVenue').value.trim(),
                isHome: document.getElementById('matchIsHome').value === 'true',
                status: document.getElementById('matchStatus').value || 'finished',
                referee: document.getElementById('matchReferee').value.trim(),
                attendance: parseInt(document.getElementById('matchAttendance').value) || 0,
                matchDay: parseInt(document.getElementById('matchDay').value) || 0,
                otherMatches: getOtherMatchesFromForm(),
                events: matchEvents,
                summary: document.getElementById('matchSummary').value.trim(),
                stats: getStatsFromForm()
            };

            if (editingMatchId) {
                await apiPut('matches/' + editingMatchId, matchData);
                showToast('Match mis í  jour !');
            } else {
                await apiPost('matches', matchData);
                showToast('Match enregistré avec succès !');
            }

            // Auto-update standings from this match if finished
            if (matchData.status === 'finished') {
                try {
                    await apiPost('standings/update-from-match', {
                        homeTeam: matchData.homeTeam,
                        awayTeam: matchData.awayTeam
                    });
                } catch(e) { console.warn('Auto-update standings:', e); }

                // Auto-update player stats from match events
                if (matchData.events && matchData.events.length > 0) {
                    try {
                        await apiPost('players/update-from-match', { events: matchData.events });
                    } catch(e) { console.warn('Auto-update player stats:', e); }
                }
            }

            closeMatchEditor();
            refreshMatchesTable();
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

function getStatsFromForm() {
    const g = id => parseInt(document.getElementById(id)?.value) || 0;
    return {
        possession: [g('statPossHome'), g('statPossAway')],
        shots: [g('statShotsHome'), g('statShotsAway')],
        shotsOnTarget: [g('statSoTHome'), g('statSoTAway')],
        corners: [g('statCornersHome'), g('statCornersAway')],
        fouls: [g('statFoulsHome'), g('statFoulsAway')],
        offsides: [g('statOffsidesHome'), g('statOffsidesAway')],
        passes: [g('statPassesHome'), g('statPassesAway')],
        passAccuracy: [g('statPassAccHome'), g('statPassAccAway')],
        saves: [g('statSavesHome'), g('statSavesAway')]
    };
}

// ===== OTHER MATCHES (Journée) =====
function getOtherMatchesFromForm() {
    const list = document.getElementById('otherMatchesList');
    if (!list) return [];
    const rows = list.querySelectorAll('.other-match-row');
    const result = [];
    rows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        const ht = inputs[0]?.value.trim();
        const at = inputs[1]?.value.trim();
        const hs = inputs[2]?.value || '0';
        const as = inputs[3]?.value || '0';
        if (ht && at) result.push({ homeTeam: ht, awayTeam: at, homeScore: hs, awayScore: as });
    });
    return result;
}

function addOtherMatch(ht='', at='', hs='', as='') {
    const list = document.getElementById('otherMatchesList');
    if (!list) return;
    const idx = list.children.length;
    const div = document.createElement('div');
    div.className = 'other-match-row';
    div.style.cssText = 'display:flex;gap:6px;align-items:center;margin-bottom:6px;';
    div.innerHTML = `
        <input type="text" placeholder="Domicile" value="${ht}" style="flex:2;padding:6px 8px;border-radius:6px;border:1px solid #ddd;font-size:0.8rem;">
        <input type="text" placeholder="Extérieur" value="${at}" style="flex:2;padding:6px 8px;border-radius:6px;border:1px solid #ddd;font-size:0.8rem;">
        <input type="number" placeholder="0" value="${hs}" min="0" style="width:45px;padding:6px 4px;border-radius:6px;border:1px solid #ddd;font-size:0.8rem;text-align:center;">
        <span style="font-weight:700;">-</span>
        <input type="number" placeholder="0" value="${as}" min="0" style="width:45px;padding:6px 4px;border-radius:6px;border:1px solid #ddd;font-size:0.8rem;text-align:center;">
        <button type="button" onclick="this.parentElement.remove();" style="background:#e74c3c;color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;"><i class="fas fa-times"></i></button>
    `;
    list.appendChild(div);
}

function loadOtherMatchesToForm(otherMatches) {
    const list = document.getElementById('otherMatchesList');
    if (!list) return;
    list.innerHTML = '';
    if (otherMatches && otherMatches.length) {
        otherMatches.forEach(m => addOtherMatch(m.homeTeam, m.awayTeam, m.homeScore, m.awayScore));
    }
}

function updatePossessionBar() {
    const h = parseInt(document.getElementById('statPossHome')?.value) || 50;
    const a = parseInt(document.getElementById('statPossAway')?.value) || 50;
    const bh = document.getElementById('statBarHome');
    const ba = document.getElementById('statBarAway');
    if (bh) bh.style.width = h + '%';
    if (ba) ba.style.width = a + '%';
}

function openMatchEditor(matchId) {
    editingMatchId = matchId || null;
    matchEvents = [];
    const overlay = document.getElementById('matchEditorOverlay');
    if (!overlay) return;

    // Reset form
    const form = document.getElementById('matchForm');
    if (form) form.reset();
    document.getElementById('matchEditId').value = '';
    document.getElementById('matchHomeScore').value = '0';
    document.getElementById('matchAwayScore').value = '0';
    document.getElementById('matchTime').value = '14:00';
    document.getElementById('matchStatus').value = 'finished';
    document.getElementById('matchIsHome').value = 'true';
    document.getElementById('toggleHome').classList.add('active');
    document.getElementById('toggleAway').classList.remove('active');
    setMatchStatusUI('finished');

    if (matchId) {
        // Load match data for editing
        const match = allMatchesData.find(m => (m.id || m._id) === matchId);
        if (match) {
            document.getElementById('meTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier le match';
            document.getElementById('matchSubmitLabel').textContent = 'Mettre í  jour';
            document.getElementById('matchEditId').value = matchId;
            document.getElementById('matchHomeTeam').value = match.homeTeam || '';
            document.getElementById('matchAwayTeam').value = match.awayTeam || '';
            document.getElementById('matchHomeScore').value = match.homeScore || '0';
            document.getElementById('matchAwayScore').value = match.awayScore || '0';
            document.getElementById('matchDate').value = match.date ? match.date.split('T')[0] : '';
            document.getElementById('matchTime').value = match.time || '14:00';
            document.getElementById('matchVenue').value = match.venue || '';
            document.getElementById('matchReferee').value = match.referee || '';
            document.getElementById('matchAttendance').value = match.attendance || '';
            document.getElementById('matchSummary').value = match.summary || '';
            document.getElementById('matchStatus').value = match.status || 'finished';
            setMatchStatusUI(match.status || 'finished');

            const compSelect = document.getElementById('matchCompetition');
            const opts = Array.from(compSelect.options).map(o => o.value);
            if (opts.includes(match.competition)) {
                compSelect.value = match.competition;
            } else {
                compSelect.value = 'autre';
                document.getElementById('matchCompetitionCustom').value = match.competition || '';
                document.getElementById('matchCompetitionCustom').style.display = '';
            }

            const isHome = match.isHome !== false;
            document.getElementById('matchIsHome').value = isHome ? 'true' : 'false';
            document.getElementById('toggleHome').classList.toggle('active', isHome);
            document.getElementById('toggleAway').classList.toggle('active', !isHome);

            // Load events
            if (match.events && match.events.length > 0) {
                matchEvents = [...match.events];
            }

            // Load stats
            if (match.stats) {
                const s = match.stats;
                const setV = (id, arr, idx) => { const el = document.getElementById(id); if (el && arr && arr[idx] !== undefined) el.value = arr[idx]; };
                setV('statPossHome', s.possession, 0); setV('statPossAway', s.possession, 1);
                setV('statShotsHome', s.shots, 0); setV('statShotsAway', s.shots, 1);
                setV('statSoTHome', s.shotsOnTarget, 0); setV('statSoTAway', s.shotsOnTarget, 1);
                setV('statCornersHome', s.corners, 0); setV('statCornersAway', s.corners, 1);
                setV('statFoulsHome', s.fouls, 0); setV('statFoulsAway', s.fouls, 1);
                setV('statOffsidesHome', s.offsides, 0); setV('statOffsidesAway', s.offsides, 1);
                setV('statPassesHome', s.passes, 0); setV('statPassesAway', s.passes, 1);
                setV('statPassAccHome', s.passAccuracy, 0); setV('statPassAccAway', s.passAccuracy, 1);
                setV('statSavesHome', s.saves, 0); setV('statSavesAway', s.saves, 1);
                updatePossessionBar();
            }

            // Load matchDay + otherMatches
            const mdEl = document.getElementById('matchDay');
            if (mdEl) mdEl.value = match.matchDay || '';
            loadOtherMatchesToForm(match.otherMatches);
        }
    } else {
        document.getElementById('meTitle').innerHTML = '<i class="fas fa-futbol"></i> Nouveau Match';
        document.getElementById('matchSubmitLabel').textContent = 'Enregistrer';
        document.getElementById('matchDate').value = new Date().toISOString().split('T')[0];
        const mdEl = document.getElementById('matchDay');
        if (mdEl) mdEl.value = '';
        loadOtherMatchesToForm([]);
    }

    renderEventsTimeline();
    updateMatchPreview();
    switchMatchTab('basic');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeMatchEditor() {
    const overlay = document.getElementById('matchEditorOverlay');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
    editingMatchId = null;
    matchEvents = [];
}

function switchMatchTab(tab) {
    document.querySelectorAll('.me-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.me-tab-content').forEach(c => c.classList.remove('active'));
    const target = document.getElementById('tab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (target) target.classList.add('active');
}

function setMatchStatus(status) {
    document.getElementById('matchStatus').value = status;
    setMatchStatusUI(status);
    updateMatchPreview();
}

function setMatchStatusUI(status) {
    document.querySelectorAll('.status-btn').forEach(b => b.classList.toggle('active', b.dataset.status === status));
}

function updateMatchPreview() {
    const home = document.getElementById('matchHomeTeam');
    const away = document.getElementById('matchAwayTeam');
    const hs = document.getElementById('matchHomeScore');
    const as = document.getElementById('matchAwayScore');
    const dateEl = document.getElementById('matchDate');
    const timeEl = document.getElementById('matchTime');
    const compSelect = document.getElementById('matchCompetition');
    const compCustom = document.getElementById('matchCompetitionCustom');
    const venueEl = document.getElementById('matchVenue');
    const statusEl = document.getElementById('matchStatus');

    const mpHome = document.getElementById('mpHomeName');
    const mpAway = document.getElementById('mpAwayName');
    if (mpHome) mpHome.textContent = (home && home.value) || 'Domicile';
    if (mpAway) mpAway.textContent = (away && away.value) || 'Extérieur';
    if (document.getElementById('mpHomeScore')) document.getElementById('mpHomeScore').textContent = (hs && hs.value) || '0';
    if (document.getElementById('mpAwayScore')) document.getElementById('mpAwayScore').textContent = (as && as.value) || '0';
    if (document.getElementById('mpDate') && dateEl && dateEl.value) {
        document.getElementById('mpDate').textContent = new Date(dateEl.value).toLocaleDateString('fr-FR', {day:'2-digit',month:'short',year:'numeric'});
    }
    if (document.getElementById('mpTime') && timeEl) {
        document.getElementById('mpTime').textContent = timeEl.value || '';
    }
    if (document.getElementById('mpComp') && compSelect) {
        const comp = compSelect.value === 'autre' ? (compCustom ? compCustom.value : '') : compSelect.value;
        document.getElementById('mpComp').textContent = comp || 'Compétition';
    }
    if (document.getElementById('mpVenue') && venueEl) {
        document.getElementById('mpVenue').innerHTML = '<i class="fas fa-map-marker-alt"></i> ' + (venueEl.value || 'Stade');
    }
    // Status badge
    const statusBadge = document.getElementById('mpStatus');
    if (statusBadge && statusEl) {
        const status = statusEl.value;
        statusBadge.className = 'mep-status' + (status === 'live' ? ' live' : status === 'upcoming' ? ' upcoming' : '');
        statusBadge.textContent = status === 'finished' ? 'Terminé' : status === 'live' ? '● En direct' : 'À venir';
    }
    // Score labels
    const lh = document.getElementById('meLabelHome');
    const la = document.getElementById('meLabelAway');
    if (lh && home) lh.textContent = home.value ? home.value.substring(0, 6).toUpperCase() : 'DOM';
    if (la && away) la.textContent = away.value ? away.value.substring(0, 6).toUpperCase() : 'EXT';
}

function changeScore(inputId, delta) {
    const input = document.getElementById(inputId);
    if (!input) return;
    let val = parseInt(input.value) || 0;
    val = Math.max(0, val + delta);
    input.value = val;
    updateMatchPreview();
}

function setHomeAway(isHome) {
    document.getElementById('matchIsHome').value = isHome ? 'true' : 'false';
    document.getElementById('toggleHome').classList.toggle('active', isHome);
    document.getElementById('toggleAway').classList.toggle('active', !isHome);
}

// ===== MATCH EVENTS =====
function addMatchEvent() {
    const type = document.getElementById('eventType').value;
    const minute = parseInt(document.getElementById('eventMinute').value);
    const player = document.getElementById('eventPlayer').value.trim();
    const assist = document.getElementById('eventAssist').value.trim();
    const team = document.getElementById('eventTeam').value;

    if (!minute || !player) { showToast('Minute et joueur requis', 'error'); return; }

    matchEvents.push({ type, minute, player, assist, team, detail: '' });
    matchEvents.sort((a, b) => a.minute - b.minute);

    document.getElementById('eventMinute').value = '';
    document.getElementById('eventPlayer').value = '';
    document.getElementById('eventAssist').value = '';

    renderEventsTimeline();
}

function removeMatchEvent(idx) {
    matchEvents.splice(idx, 1);
    renderEventsTimeline();
}

function getEventIcon(type) {
    const icons = { goal:'âš½', pen:'ðŸŽ¯', og:'ðŸ”´', yellow:'ðŸŸ¨', red:'ðŸŸ¥', sub:'ðŸ”„', var:'ðŸ“º', miss:'âŒ' };
    return icons[type] || 'âš¡';
}

function getEventLabel(type) {
    const labels = { goal:'But', pen:'Penalty', og:'But CSC', yellow:'Carton Jaune', red:'Carton Rouge', sub:'Remplacement', var:'VAR', miss:'Penalty manqué' };
    return labels[type] || type;
}

function renderEventsTimeline() {
    const el = document.getElementById('eventsTimeline');
    if (!el) return;
    if (matchEvents.length === 0) {
        el.innerHTML = '<div class="events-empty"><i class="fas fa-stream"></i><br>Aucun événement ajouté</div>';
        return;
    }
    el.innerHTML = matchEvents.map((ev, i) => `
        <div class="event-item">
            <div class="event-minute">${ev.minute}'</div>
            <div class="event-icon">${getEventIcon(ev.type)}</div>
            <div class="event-info">
                <div class="event-player">${escapeHtml(ev.player)}</div>
                <div class="event-detail">${getEventLabel(ev.type)}${ev.assist ? ' â€” ' + escapeHtml(ev.assist) : ''}</div>
            </div>
            <span class="event-team-tag ${ev.team}">${ev.team === 'home' ? 'DOM' : 'EXT'}</span>
            <button type="button" class="event-remove" onclick="removeMatchEvent(${i})"><i class="fas fa-times"></i></button>
        </div>
    `).join('');
}

// ===== MATCH LIST =====
function filterMatches(type) {
    matchFilterType = type;
    matchCurrentPage = 1;
    document.querySelectorAll('.match-filter').forEach(b => b.classList.toggle('active', b.dataset.filter === type));
    renderMatchList();
}

function searchMatches(term) {
    matchSearchTerm = term.toLowerCase();
    matchCurrentPage = 1;
    renderMatchList();
}

function setMatchView(view) {
    matchViewMode = view;
    document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
    document.getElementById('matchCardsContainer').style.display = view === 'cards' ? '' : 'none';
    document.getElementById('matchTableContainer').style.display = view === 'table' ? '' : 'none';
    renderMatchList();
}

async function refreshMatchesTable() {
    try {
        allMatchesData = await apiGet('matches');
        allMatchesData.sort((a, b) => new Date(b.date) - new Date(a.date));
        renderMatchList();
        renderMatchStats();
        renderSeasonBar();
        // Subtitle
        const sub = document.getElementById('matchSubtitle');
        if (sub) sub.textContent = allMatchesData.length + ' matchs enregistrés';
    } catch(err) { console.error('refreshMatchesTable:', err); }
}

function getMatchResult(match) {
    const hs = parseInt(match.homeScore) || 0;
    const as = parseInt(match.awayScore) || 0;
    const isHome = match.isHome !== false;
    const ourScore = isHome ? hs : as;
    const theirScore = isHome ? as : hs;
    if (ourScore > theirScore) return 'win';
    if (ourScore < theirScore) return 'loss';
    return 'draw';
}

function getFilteredMatches() {
    let filtered = allMatchesData;
    if (matchFilterType !== 'all') {
        filtered = filtered.filter(m => getMatchResult(m) === matchFilterType);
    }
    if (matchSearchTerm) {
        filtered = filtered.filter(m =>
            (m.homeTeam || '').toLowerCase().includes(matchSearchTerm) ||
            (m.awayTeam || '').toLowerCase().includes(matchSearchTerm) ||
            (m.competition || '').toLowerCase().includes(matchSearchTerm) ||
            (m.venue || '').toLowerCase().includes(matchSearchTerm)
        );
    }
    return filtered;
}

function renderMatchStats() {
    const el = document.getElementById('matchAdminStats');
    if (!el) return;
    const wins = allMatchesData.filter(m => getMatchResult(m) === 'win').length;
    const draws = allMatchesData.filter(m => getMatchResult(m) === 'draw').length;
    const losses = allMatchesData.filter(m => getMatchResult(m) === 'loss').length;
    const total = allMatchesData.length;
    const goalsFor = allMatchesData.reduce((s, m) => s + parseInt(m.isHome !== false ? m.homeScore : m.awayScore) || 0, 0);
    const goalsAgainst = allMatchesData.reduce((s, m) => s + parseInt(m.isHome !== false ? m.awayScore : m.homeScore) || 0, 0);

    el.innerHTML = `
        <div class="match-stat-card total">
            <div class="msi"><i class="fas fa-futbol"></i></div>
            <div class="msv" style="color:#3498db">${total}</div>
            <div class="msl">Total matchs</div>
        </div>
        <div class="match-stat-card win">
            <div class="msi"><i class="fas fa-trophy"></i></div>
            <div class="msv" style="color:#2ecc71">${wins}</div>
            <div class="msl">Victoires</div>
            <div class="msp" style="color:#2ecc71">${total ? Math.round(wins/total*100) : 0}%</div>
        </div>
        <div class="match-stat-card draw">
            <div class="msi"><i class="fas fa-handshake"></i></div>
            <div class="msv" style="color:#f39c12">${draws}</div>
            <div class="msl">Nuls</div>
            <div class="msp" style="color:#f39c12">${total ? Math.round(draws/total*100) : 0}%</div>
        </div>
        <div class="match-stat-card loss">
            <div class="msi"><i class="fas fa-times-circle"></i></div>
            <div class="msv" style="color:#e74c3c">${losses}</div>
            <div class="msl">Défaites</div>
            <div class="msp" style="color:#e74c3c">${total ? Math.round(losses/total*100) : 0}%</div>
        </div>
        <div class="match-stat-card total">
            <div class="msi"><i class="fas fa-chart-line"></i></div>
            <div class="msv" style="color:#9b59b6">${goalsFor} â€” ${goalsAgainst}</div>
            <div class="msl">Buts (P/C)</div>
            <div class="msp" style="color:${goalsFor >= goalsAgainst ? '#2ecc71' : '#e74c3c'}">Diff: ${goalsFor - goalsAgainst >= 0 ? '+' : ''}${goalsFor - goalsAgainst}</div>
        </div>
    `;
}

function renderSeasonBar() {
    const el = document.getElementById('seasonPerfBar');
    if (!el) return;
    const total = allMatchesData.length;
    if (total === 0) { el.style.display = 'none'; return; }
    el.style.display = '';
    const wins = allMatchesData.filter(m => getMatchResult(m) === 'win').length;
    const draws = allMatchesData.filter(m => getMatchResult(m) === 'draw').length;
    const losses = total - wins - draws;
    const wp = (wins / total * 100).toFixed(1);
    const dp = (draws / total * 100).toFixed(1);
    const lp = (losses / total * 100).toFixed(1);

    el.innerHTML = `
        <div class="spb-label">Performance de la saison</div>
        <div class="spb-track">
            <div class="spb-seg win" style="width:${wp}%" title="Victoires ${wp}%"></div>
            <div class="spb-seg draw" style="width:${dp}%" title="Nuls ${dp}%"></div>
            <div class="spb-seg loss" style="width:${lp}%" title="Défaites ${lp}%"></div>
        </div>
        <div class="spb-legend">
            <span><span class="spb-dot" style="background:#2ecc71"></span> Victoires ${wp}%</span>
            <span><span class="spb-dot" style="background:#f39c12"></span> Nuls ${dp}%</span>
            <span><span class="spb-dot" style="background:#e74c3c"></span> Défaites ${lp}%</span>
        </div>
    `;
}

function renderMatchList() {
    if (matchViewMode === 'cards') renderMatchCards();
    else renderMatchesTable();
    renderMatchPagination();
}

function renderMatchCards() {
    const container = document.getElementById('matchCardsContainer');
    if (!container) return;
    const filtered = getFilteredMatches();
    const start = (matchCurrentPage - 1) * MATCHES_PER_PAGE;
    const paged = filtered.slice(start, start + MATCHES_PER_PAGE);

    if (paged.length === 0) {
        container.innerHTML = '<div class="match-empty-state"><i class="fas fa-futbol"></i><p>Aucun match trouvé</p></div>';
        return;
    }

    container.innerHTML = paged.map(match => {
        const result = getMatchResult(match);
        const resultLabel = result === 'win' ? 'Victoire' : result === 'draw' ? 'Nul' : 'Défaite';
        const formattedDate = new Date(match.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
        const mid = match.id || match._id;
        const eventsHtml = (match.events && match.events.length > 0) ?
            `<div class="mc-events-strip">${match.events.slice(0, 5).map(ev => `<span class="mc-event-mini">${getEventIcon(ev.type)} ${ev.minute}' ${escapeHtml(ev.player)}</span>`).join('')}${match.events.length > 5 ? '<span class="mc-event-mini">+' + (match.events.length - 5) + '</span>' : ''}</div>` : '';

        return `<div class="match-card" ondblclick="openMatchEditor('${mid}')">
            <div class="mc-actions">
                <button class="mc-action-btn edit" onclick="event.stopPropagation();openMatchEditor('${mid}')" title="Modifier"><i class="fas fa-edit"></i></button>
                <button class="mc-action-btn delete" onclick="event.stopPropagation();deleteMatch('${mid}')" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div>
            <div class="mc-top">
                <span class="mc-comp">${escapeHtml(match.competition || 'â€”')}</span>
                <span class="mc-date">${formattedDate}</span>
            </div>
            <div class="mc-body">
                <div class="mc-team">
                    <div class="mc-team-badge">${escapeHtml((match.homeTeam || '').substring(0, 3).toUpperCase())}</div>
                    <div class="mc-team-name">${escapeHtml(match.homeTeam)}</div>
                </div>
                <div class="mc-score-center">
                    <span class="mc-score">${match.homeScore}</span>
                    <span class="mc-score-sep">:</span>
                    <span class="mc-score">${match.awayScore}</span>
                </div>
                <div class="mc-team">
                    <div class="mc-team-badge">${escapeHtml((match.awayTeam || '').substring(0, 3).toUpperCase())}</div>
                    <div class="mc-team-name">${escapeHtml(match.awayTeam)}</div>
                </div>
            </div>
            ${eventsHtml}
            <div class="mc-bottom">
                <span class="mc-venue"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(match.venue || 'â€”')}</span>
                <span class="mc-result-tag ${result}">${resultLabel}</span>
            </div>
        </div>`;
    }).join('');
}

function renderMatchesTable() {
    const tbody = document.getElementById('matchesTableBody');
    if (!tbody) return;
    const filtered = getFilteredMatches();
    const start = (matchCurrentPage - 1) * MATCHES_PER_PAGE;
    const paged = filtered.slice(start, start + MATCHES_PER_PAGE);

    if (paged.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#666;padding:40px;">Aucun match trouvé</td></tr>';
        return;
    }

    tbody.innerHTML = paged.map(match => {
        const formattedDate = new Date(match.date).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' });
        const result = getMatchResult(match);
        const resultLabel = result === 'win' ? 'V' : result === 'draw' ? 'N' : 'D';
        const resultIcon = result === 'win' ? 'fa-check-circle' : result === 'draw' ? 'fa-minus-circle' : 'fa-times-circle';
        const mid = match.id || match._id;
        const hasEvents = match.events && match.events.length > 0;
        const hasStats = match.stats && match.stats.possession && match.stats.possession[0];

        return `<tr>
            <td style="white-space:nowrap;font-weight:600;font-size:0.85rem;">${formattedDate}</td>
            <td><span class="result-badge ${result}"><i class="fas ${resultIcon}"></i> ${resultLabel}</span></td>
            <td>
                <div class="match-cell">
                    <span>${escapeHtml(match.homeTeam)}</span>
                    <span class="vs-text">vs</span>
                    <span>${escapeHtml(match.awayTeam)}</span>
                </div>
            </td>
            <td><span class="score-text" style="font-weight:800;">${match.homeScore} - ${match.awayScore}</span></td>
            <td style="font-size:0.85rem;">${escapeHtml(match.competition || 'â€”')}</td>
            <td style="font-size:0.85rem;color:#666;">${escapeHtml(match.venue || 'â€”')}</td>
            <td style="font-size:0.75rem;color:#888;">
                ${hasEvents ? '<i class="fas fa-bolt" title="Événements" style="color:#f39c12;margin-right:4px;"></i>' : ''}
                ${hasStats ? '<i class="fas fa-chart-bar" title="Statistiques" style="color:#3498db;margin-right:4px;"></i>' : ''}
                ${match.summary ? '<i class="fas fa-file-alt" title="Résumé" style="color:#2ecc71;"></i>' : ''}
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon" onclick="openMatchEditor('${mid}')" title="Modifier" style="color:#3498db;"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteMatch('${mid}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>`;
    }).join('');
}

function renderMatchPagination() {
    const el = document.getElementById('matchPagination');
    if (!el) return;
    const filtered = getFilteredMatches();
    const totalPages = Math.ceil(filtered.length / MATCHES_PER_PAGE);
    if (totalPages <= 1) { el.innerHTML = ''; return; }

    let html = '';
    if (matchCurrentPage > 1) html += `<button class="page-btn" onclick="goMatchPage(${matchCurrentPage - 1})"><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - matchCurrentPage) <= 1) {
            html += `<button class="page-btn${i === matchCurrentPage ? ' active' : ''}" onclick="goMatchPage(${i})">${i}</button>`;
        } else if (Math.abs(i - matchCurrentPage) === 2) {
            html += '<span style="color:#666;">...</span>';
        }
    }
    if (matchCurrentPage < totalPages) html += `<button class="page-btn" onclick="goMatchPage(${matchCurrentPage + 1})"><i class="fas fa-chevron-right"></i></button>`;
    el.innerHTML = html;
}

function goMatchPage(page) {
    matchCurrentPage = page;
    renderMatchList();
    document.getElementById('panel-matches')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function deleteMatch(id) {
    if (!confirm('Supprimer ce match ?')) return;
    try { await apiDelete(`matches/${id}`); refreshMatchesTable(); showToast('Match supprimé'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== FIXTURE FORM =====
let allFixturesData = [];
let fixtureFilterType = 'all';

function setupFixtureForm() {
    const form = document.getElementById('fixtureForm');
    if (!form) return;

    // Live preview listeners
    ['fixtureHomeTeam','fixtureAwayTeam','fixtureDate','fixtureTime','fixtureCompetition'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateFixturePreview);
        if (el) el.addEventListener('change', updateFixturePreview);
    });

    // Competition custom toggle
    const compSelect = document.getElementById('fixtureCompetition');
    const compCustom = document.getElementById('fixtureCompetitionCustom');
    if (compSelect && compCustom) {
        compSelect.addEventListener('change', () => {
            compCustom.style.display = compSelect.value === 'autre' ? '' : 'none';
            updateFixturePreview();
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const compSelect = document.getElementById('fixtureCompetition');
            const compCustom = document.getElementById('fixtureCompetitionCustom');
            const competition = compSelect.value === 'autre' ? compCustom.value.trim() : compSelect.value;

            await apiPost('fixtures', {
                homeTeam: document.getElementById('fixtureHomeTeam').value.trim(),
                awayTeam: document.getElementById('fixtureAwayTeam').value.trim(),
                date: document.getElementById('fixtureDate').value,
                time: document.getElementById('fixtureTime').value,
                competition,
                venue: document.getElementById('fixtureVenue').value.trim()
            });
            form.reset();
            document.getElementById('fixtureDate').value = new Date().toISOString().split('T')[0];
            if (compCustom) compCustom.style.display = 'none';
            updateFixturePreview();
            refreshFixturesTable();
            showToast('Match ajouté au calendrier !');
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

function updateFixturePreview() {
    const home = document.getElementById('fixtureHomeTeam');
    const away = document.getElementById('fixtureAwayTeam');
    const dateEl = document.getElementById('fixtureDate');
    const timeEl = document.getElementById('fixtureTime');
    const compSelect = document.getElementById('fixtureCompetition');
    const compCustom = document.getElementById('fixtureCompetitionCustom');

    if (document.getElementById('fpHomeName')) document.getElementById('fpHomeName').textContent = (home && home.value) || 'Domicile';
    if (document.getElementById('fpAwayName')) document.getElementById('fpAwayName').textContent = (away && away.value) || 'Extérieur';
    if (document.getElementById('fpDate') && dateEl && dateEl.value) {
        document.getElementById('fpDate').textContent = new Date(dateEl.value).toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'short' });
    }
    if (document.getElementById('fpTime') && timeEl) {
        document.getElementById('fpTime').textContent = timeEl.value || 'â€”';
    }
    if (document.getElementById('fpComp') && compSelect) {
        const comp = compSelect.value === 'autre' ? (compCustom ? compCustom.value : '') : compSelect.value;
        document.getElementById('fpComp').textContent = comp || 'Match';
    }
}

function filterFixtures(type) {
    fixtureFilterType = type;
    document.querySelectorAll('#panel-fixtures .match-filter').forEach(b => b.classList.toggle('active', b.dataset.filter === type));
    renderFixturesTable();
}

function getFixtureStatus(fixture) {
    const now = new Date();
    const matchDate = new Date(fixture.date);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fDate = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate());
    if (fDate.getTime() === today.getTime()) return 'today';
    if (fDate > today) return 'upcoming';
    return 'past';
}

function getCountdown(fixture) {
    const now = new Date();
    const matchDate = new Date(fixture.date);
    if (fixture.time) {
        const [h, m] = fixture.time.split(':');
        matchDate.setHours(parseInt(h) || 0, parseInt(m) || 0);
    }
    const diff = matchDate - now;
    if (diff <= 0) return null;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `Dans ${days}j ${hours}h`;
    if (hours > 0) return `Dans ${hours}h`;
    return 'Bientôt';
}

async function refreshFixturesTable() {
    try {
        allFixturesData = await apiGet('fixtures');
        allFixturesData.sort((a, b) => new Date(a.date) - new Date(b.date));
        renderFixtureStats();
        renderFixtureNextCards();
        renderFixturesTable();
    } catch(err) { console.error('refreshFixturesTable:', err); }
}

function renderFixtureStats() {
    const el = document.getElementById('fixtureAdminStats');
    if (!el) return;
    const upcoming = allFixturesData.filter(f => getFixtureStatus(f) === 'upcoming' || getFixtureStatus(f) === 'today').length;
    const past = allFixturesData.filter(f => getFixtureStatus(f) === 'past').length;
    const todayCount = allFixturesData.filter(f => getFixtureStatus(f) === 'today').length;
    const nextMatch = allFixturesData.find(f => getFixtureStatus(f) === 'upcoming' || getFixtureStatus(f) === 'today');
    const nextLabel = nextMatch ? getCountdown(nextMatch) || 'Aujourd\'hui' : 'â€”';
    el.innerHTML = `
        <div class="match-stat-card total"><div class="msv">${allFixturesData.length}</div><div class="msl">Total programmés</div></div>
        <div class="match-stat-card win"><div class="msv" style="color:#3498db">${upcoming}</div><div class="msl">À venir</div></div>
        <div class="match-stat-card draw"><div class="msv" style="color:#e74c3c">${todayCount}</div><div class="msl">Aujourd'hui</div></div>
        <div class="match-stat-card loss"><div class="msv" style="color:#95a5a6">${past}</div><div class="msl">Passés</div></div>
    `;
}

function renderFixtureNextCards() {
    const el = document.getElementById('fixturesCardsView');
    if (!el) return;
    const upcoming = allFixturesData.filter(f => getFixtureStatus(f) === 'upcoming' || getFixtureStatus(f) === 'today').slice(0, 3);
    if (!upcoming.length) { el.innerHTML = ''; return; }

    el.innerHTML = '<div class="fixture-next-cards">' + upcoming.map(f => {
        const d = new Date(f.date);
        const day = d.getDate();
        const month = d.toLocaleDateString('fr-FR', { month: 'short' });
        const countdown = getCountdown(f);
        const status = getFixtureStatus(f);
        return `
            <div class="fixture-next-card">
                <div class="fnc-date">
                    <div class="fnc-day">${day}</div>
                    <div class="fnc-month">${month}</div>
                </div>
                <div class="fnc-info">
                    <div class="fnc-teams">${escapeHtml(f.homeTeam)} vs ${escapeHtml(f.awayTeam)}</div>
                    <div class="fnc-meta">
                        <span><i class="fas fa-clock"></i> ${f.time || 'â€”'}</span>
                        <span><i class="fas fa-medal"></i> ${escapeHtml(f.competition || 'â€”')}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(f.venue || 'â€”')}</span>
                    </div>
                    ${countdown ? `<div class="fnc-countdown"><i class="fas fa-hourglass-half"></i> ${countdown}</div>` : `<div class="fnc-countdown" style="color:#e74c3c;"><i class="fas fa-fire"></i> Aujourd'hui !</div>`}
                </div>
            </div>
        `;
    }).join('') + '</div>';
}

function renderFixturesTable() {
    const tbody = document.getElementById('fixturesTableBody');
    if (!tbody) return;

    let filtered = allFixturesData;
    if (fixtureFilterType === 'upcoming') {
        filtered = allFixturesData.filter(f => getFixtureStatus(f) === 'upcoming' || getFixtureStatus(f) === 'today');
    } else if (fixtureFilterType === 'past') {
        filtered = allFixturesData.filter(f => getFixtureStatus(f) === 'past');
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:30px;">Aucun match programmé</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(f => {
        const formattedDate = new Date(f.date).toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'short', year:'numeric' });
        const status = getFixtureStatus(f);
        const statusLabel = status === 'today' ? 'Aujourd\'hui' : status === 'upcoming' ? 'À venir' : 'Passé';
        const statusIcon = status === 'today' ? 'fa-fire' : status === 'upcoming' ? 'fa-clock' : 'fa-check';
        const countdown = getCountdown(f);

        return `<tr>
            <td><span class="fixture-status ${status}"><i class="fas ${statusIcon}"></i> ${statusLabel}</span>${countdown ? `<div style="font-size:0.7rem;color:#e74c3c;margin-top:3px;">${countdown}</div>` : ''}</td>
            <td style="white-space:nowrap;"><div style="font-weight:600;">${formattedDate}</div><div style="font-size:0.85rem;color:#666;">${f.time || 'â€”'}</div></td>
            <td>
                <div class="match-cell">
                    <span style="font-weight:700;">${escapeHtml(f.homeTeam)}</span>
                    <span class="vs-text">vs</span>
                    <span style="font-weight:700;">${escapeHtml(f.awayTeam)}</span>
                </div>
            </td>
            <td style="font-size:0.85rem;">${escapeHtml(f.competition || 'â€”')}</td>
            <td style="font-size:0.85rem;color:#999;">${escapeHtml(f.venue || 'â€”')}</td>
            <td><div class="action-btns"><button class="btn-icon delete" onclick="deleteFixture('${f.id || f._id}')" title="Supprimer"><i class="fas fa-trash"></i></button></div></td>
        </tr>`;
    }).join('');
}

async function deleteFixture(id) {
    if (!confirm('Supprimer ce match du calendrier ?')) return;
    try { await apiDelete(`fixtures/${id}`); refreshFixturesTable(); showToast('Match supprimé du calendrier', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== STANDINGS FUNCTIONS =====
let allStandingsData = [];
let editingStandingId = null;

function setupStandingsForm() {
    // No traditional form setup needed - using modal now
    refreshStandingsTable();
}

function updateStandingPointsPreview() {
    const w = parseInt(document.getElementById('standingWon')?.value) || 0;
    const d = parseInt(document.getElementById('standingDrawn')?.value) || 0;
    const pts = w * 3 + d;
    const el = document.getElementById('standingPtsPreview');
    const calc = document.getElementById('standingPtsCalc');
    if (el) el.textContent = pts;
    if (calc) calc.textContent = `${w}í—3 + ${d}í—1 = ${pts} points`;
}

function openStandingsModal(id) {
    editingStandingId = id || null;
    const overlay = document.getElementById('standingsModalOverlay');
    const title = document.getElementById('standingsModalTitle');

    if (id) {
        // Edit mode
        title.textContent = 'Modifier l\'équipe';
        const team = allStandingsData.find(t => (t.id || t._id) === id);
        if (team) {
            document.getElementById('standingEditId').value = id;
            document.getElementById('standingTeamName').value = team.name;
            document.getElementById('standingIsOurTeam').value = team.isOurTeam ? 'true' : 'false';
            document.getElementById('standingPlayed').value = team.played;
            document.getElementById('standingWon').value = team.won;
            document.getElementById('standingDrawn').value = team.drawn;
            document.getElementById('standingLost').value = team.lost;
            document.getElementById('standingGoalsFor').value = team.goalsFor;
            document.getElementById('standingGoalsAgainst').value = team.goalsAgainst;
        }
    } else {
        // Add mode
        title.textContent = 'Ajouter une équipe';
        document.getElementById('standingEditId').value = '';
        document.getElementById('standingTeamName').value = '';
        document.getElementById('standingIsOurTeam').value = 'false';
        document.getElementById('standingPlayed').value = 0;
        document.getElementById('standingWon').value = 0;
        document.getElementById('standingDrawn').value = 0;
        document.getElementById('standingLost').value = 0;
        document.getElementById('standingGoalsFor').value = 0;
        document.getElementById('standingGoalsAgainst').value = 0;
    }
    updateStandingPointsPreview();
    overlay.classList.add('active');
}

function closeStandingsModal() {
    document.getElementById('standingsModalOverlay').classList.remove('active');
    editingStandingId = null;
}

async function submitStandingsForm() {
    const name = document.getElementById('standingTeamName').value.trim();
    if (!name) { showToast('Nom de l\'équipe requis', 'error'); return; }

    const won = parseInt(document.getElementById('standingWon').value) || 0;
    const drawn = parseInt(document.getElementById('standingDrawn').value) || 0;
    const points = won * 3 + drawn; // Auto-calculate!

    const data = {
        name,
        isOurTeam: document.getElementById('standingIsOurTeam').value === 'true',
        played: parseInt(document.getElementById('standingPlayed').value) || 0,
        won,
        drawn,
        lost: parseInt(document.getElementById('standingLost').value) || 0,
        goalsFor: parseInt(document.getElementById('standingGoalsFor').value) || 0,
        goalsAgainst: parseInt(document.getElementById('standingGoalsAgainst').value) || 0,
        points
    };

    try {
        if (editingStandingId) {
            await apiPut('standings/' + editingStandingId, data);
            showToast('Équipe mise í  jour !');
        } else {
            await apiPost('standings', data);
            showToast('Équipe ajoutée au classement !');
        }
        closeStandingsModal();
        refreshStandingsTable();
    } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

async function recalculateStandings() {
    if (!confirm('Recalculer le classement depuis tous les matchs enregistrés ?\nLes stats des équipes présentes dans les matchs seront mises í  jour automatiquement.')) return;
    try {
        const btn = document.querySelector('.standings-btn.sync');
        if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recalcul...'; btn.disabled = true; }

        const result = await apiPost('standings/recalculate', {});
        showToast(`Classement recalculé ! ${result.teamsUpdated || 0} équipe(s) mises í  jour.`);
        refreshStandingsTable();

        if (btn) { btn.innerHTML = '<i class="fas fa-sync-alt"></i> Recalculer depuis matchs'; btn.disabled = false; }
    } catch(err) {
        showToast('Erreur: ' + err.message, 'error');
        const btn = document.querySelector('.standings-btn.sync');
        if (btn) { btn.innerHTML = '<i class="fas fa-sync-alt"></i> Recalculer depuis matchs'; btn.disabled = false; }
    }
}

function openImportModal() {
    document.getElementById('importModalOverlay').classList.add('active');
    document.getElementById('importResult').style.display = 'none';
    // Restore saved API key if any
    const savedKey = localStorage.getItem('apiFootballKey');
    if (savedKey) document.getElementById('importApiKey').value = savedKey;
}

function closeImportModal() {
    document.getElementById('importModalOverlay').classList.remove('active');
}

async function importStandingsFromAPI() {
    const apiKey = document.getElementById('importApiKey').value.trim();
    if (!apiKey) { showToast('Veuillez entrer votre clé API', 'error'); return; }

    const league = parseInt(document.getElementById('importLeague').value) || 202;
    const season = parseInt(document.getElementById('importSeason').value) || 2025;
    const resultEl = document.getElementById('importResult');
    const btn = document.getElementById('importBtn');

    // Save API key for later
    localStorage.setItem('apiFootballKey', apiKey);

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Importation...';
    btn.disabled = true;
    resultEl.style.display = 'none';

    try {
        const result = await apiPost('standings/import-api', { apiKey, league, season });
        resultEl.className = 'import-result success';
        resultEl.innerHTML = `<i class="fas fa-check-circle"></i> ${result.imported} équipe(s) importées avec succès !`;
        resultEl.style.display = 'block';
        refreshStandingsTable();
    } catch(err) {
        resultEl.className = 'import-result error';
        resultEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${err.message}`;
        resultEl.style.display = 'block';
    }

    btn.innerHTML = '<i class="fas fa-download"></i> Importer maintenant';
    btn.disabled = false;
}

async function refreshStandingsTable() {
    const tbody = document.getElementById('standingsTableBody');
    if (!tbody) return;
    try {
        allStandingsData = await apiGet('standings');
        // Sort: points DESC, then goal diff DESC, then goals for DESC
        allStandingsData.sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points;
            const gdA = a.goalsFor - a.goalsAgainst;
            const gdB = b.goalsFor - b.goalsAgainst;
            if (gdB !== gdA) return gdB - gdA;
            return b.goalsFor - a.goalsFor;
        });

        renderStandingsStats();
        renderStandingsTable();
    } catch(err) { console.error('refreshStandingsTable:', err); }
}

function renderStandingsStats() {
    const grid = document.getElementById('standingsStatsGrid');
    const info = document.getElementById('standingsInfo');
    if (!grid) return;

    const cssTeam = allStandingsData.find(t => t.isOurTeam);
    const cssPos = cssTeam ? allStandingsData.indexOf(cssTeam) + 1 : '-';
    const totalTeams = allStandingsData.length;
    const cssPts = cssTeam ? cssTeam.points : 0;
    const cssGD = cssTeam ? (cssTeam.goalsFor - cssTeam.goalsAgainst) : 0;

    grid.innerHTML = `
        <div class="standings-stat-card teams">
            <div class="ssc-icon"><i class="fas fa-users"></i></div>
            <div class="ssc-value">${totalTeams}</div>
            <div class="ssc-label">Équipes</div>
        </div>
        <div class="standings-stat-card position">
            <div class="ssc-icon"><i class="fas fa-medal"></i></div>
            <div class="ssc-value">${cssPos}${typeof cssPos === 'number' ? 'e' : ''}</div>
            <div class="ssc-label">Position CSS</div>
        </div>
        <div class="standings-stat-card points-card">
            <div class="ssc-icon"><i class="fas fa-star"></i></div>
            <div class="ssc-value">${cssPts}</div>
            <div class="ssc-label">Points CSS</div>
        </div>
        <div class="standings-stat-card gd">
            <div class="ssc-icon"><i class="fas fa-exchange-alt"></i></div>
            <div class="ssc-value">${cssGD > 0 ? '+' : ''}${cssGD}</div>
            <div class="ssc-label">Diff. buts CSS</div>
        </div>
    `;

    if (info) info.textContent = `${totalTeams} équipe(s) • Dernière mise í  jour: ${new Date().toLocaleDateString('fr-FR')}`;
}

function getPositionClass(pos, total) {
    if (pos === 1) return 'champion';
    if (pos <= 3) return 'cl';
    if (pos <= 6) return 'playoff';
    if (pos > total - 3 && total > 6) return 'relegation';
    return 'normal';
}

function renderStandingsTable() {
    const tbody = document.getElementById('standingsTableBody');
    if (!tbody) return;

    if (allStandingsData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;color:#999;padding:40px;"><i class="fas fa-trophy" style="font-size:2rem;opacity:0.2;display:block;margin-bottom:10px"></i>Aucune équipe au classement<br><small style="color:#bbb">Ajoutez des équipes ou importez le classement</small></td></tr>';
        return;
    }

    const total = allStandingsData.length;
    tbody.innerHTML = allStandingsData.map((team, i) => {
        const pos = i + 1;
        const posClass = getPositionClass(pos, total);
        const gd = team.goalsFor - team.goalsAgainst;
        const gdClass = gd > 0 ? 'positive' : gd < 0 ? 'negative' : 'zero';
        const gdStr = gd > 0 ? `+${gd}` : `${gd}`;
        const form = (team.form || []).slice(-5);
        const formDots = form.length > 0
            ? form.map(f => `<div class="form-dot ${f}">${f}</div>`).join('')
            : '<span style="color:#ccc;font-size:0.7rem">â€”</span>';
        const id = team.id || team._id;

        return `<tr class="${team.isOurTeam ? 'our-team' : ''}">
            <td><span class="position-badge ${posClass}">${pos}</span></td>
            <td><div class="team-name-cell">${team.isOurTeam ? '<span class="team-flag">â­</span>' : ''}${escapeHtml(team.name)}</div></td>
            <td>${team.played}</td>
            <td><strong style="color:#27ae60">${team.won}</strong></td>
            <td>${team.drawn}</td>
            <td><strong style="color:#e74c3c">${team.lost}</strong></td>
            <td>${team.goalsFor}</td>
            <td>${team.goalsAgainst}</td>
            <td class="gd-cell ${gdClass}">${gdStr}</td>
            <td><div class="form-dots">${formDots}</div></td>
            <td class="pts-cell">${team.points}</td>
            <td><div class="standings-row-actions">
                <button class="standings-row-btn edit" onclick="openStandingsModal('${id}')" title="Modifier"><i class="fas fa-pen"></i></button>
                <button class="standings-row-btn delete" onclick="deleteStanding('${id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>`;
    }).join('');
}

async function deleteStanding(id) {
    if (!confirm('Supprimer cette équipe du classement ?')) return;
    try { await apiDelete(`standings/${id}`); refreshStandingsTable(); showToast('Équipe supprimée du classement', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== PRODUCT FORM =====
function setupProductForm() {
    const form = document.getElementById('productForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            let image = document.getElementById('productImage').value.trim();
            const fileInput = document.getElementById('productImageFile');
            if (fileInput && fileInput.files[0]) {
                image = await uploadFile(fileInput);
            }
            await apiPost('products', {
                name: document.getElementById('productName').value.trim(),
                price: parseFloat(document.getElementById('productPrice').value),
                description: document.getElementById('productDescription').value.trim(),
                image,
                badge: document.getElementById('productBadge').value.trim()
            });
            form.reset();
            resetUploadZone('productImageFile', 'productImagePreview', 'productImage', 'productImageZone');
            refreshProductsTable();
            showToast('Produit ajouté í  la boutique !');
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

async function refreshProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;
    try {
        const products = await apiGet('products');
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Aucun produit en boutique</td></tr>';
            return;
        }
        tbody.innerHTML = products.map(p => `<tr>
            <td><strong>${escapeHtml(p.name)}</strong></td>
            <td>${escapeHtml((p.description || '').substring(0, 60))}${p.description && p.description.length > 60 ? '...' : ''}</td>
            <td><strong>${parseFloat(p.price).toFixed(2)} TND</strong></td>
            <td>${escapeHtml(p.badge || '-')}</td>
            <td><div class="action-btns"><button class="btn-icon delete" onclick="deleteProduct('${p.id || p._id}')" title="Supprimer"><i class="fas fa-trash"></i></button></div></td>
        </tr>`).join('');
    } catch(err) { console.error('refreshProductsTable:', err); }
}

async function deleteProduct(id) {
    if (!confirm('Supprimer ce produit ?')) return;
    try { await apiDelete(`products/${id}`); refreshProductsTable(); showToast('Produit supprimé', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== NEWS FORM =====
function setupNewsForm() {
    const form = document.getElementById('newsForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            let image = document.getElementById('newsImage').value.trim();
            const fileInput = document.getElementById('newsImageFile');
            if (fileInput && fileInput.files[0]) {
                image = await uploadFile(fileInput);
            }
            await apiPost('news', {
                title: document.getElementById('newsTitle').value.trim(),
                category: document.getElementById('newsCategory').value,
                date: document.getElementById('newsDate').value,
                content: document.getElementById('newsContent').value.trim(),
                image
            });
            form.reset();
            resetUploadZone('newsImageFile', 'newsImagePreview', 'newsImage', 'newsImageZone');
            document.getElementById('newsDate').value = new Date().toISOString().split('T')[0];
            refreshNewsTable();
            showToast('Article publié avec succès !');
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

async function refreshNewsTable() {
    const tbody = document.getElementById('newsTableBody');
    if (!tbody) return;
    try {
        const news = await apiGet('news');
        news.sort((a, b) => new Date(b.date) - new Date(a.date));
        if (news.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:30px;">Aucun article publié</td></tr>';
            return;
        }
        tbody.innerHTML = news.map(a => {
            const formattedDate = new Date(a.date).toLocaleDateString('fr-FR');
            return `<tr>
                <td>${formattedDate}</td>
                <td><strong>${escapeHtml(a.title)}</strong></td>
                <td>${escapeHtml(a.category || '-')}</td>
                <td><div class="action-btns"><button class="btn-icon delete" onclick="deleteNews('${a.id || a._id}')" title="Supprimer"><i class="fas fa-trash"></i></button></div></td>
            </tr>`;
        }).join('');
    } catch(err) { console.error('refreshNewsTable:', err); }
}

async function deleteNews(id) {
    if (!confirm('Supprimer cet article ?')) return;
    try { await apiDelete(`news/${id}`); refreshNewsTable(); showToast('Article supprimé', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== PLAYERS =====
// ===== PLAYER FUNCTIONS =====
let allPlayersData = [];
let playerFilterCat = 'all';

function setupPlayerForm() {
    const form = document.getElementById('playerForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const category = document.getElementById('playerCategory').value;
        const isStaff = category === 'coach' || category === 'staff';
        let entry;
        if (isStaff) {
            entry = {
                category, name: document.getElementById('playerName').value.trim(),
                role: document.getElementById('staffRole').value.trim(),
                nationality: document.getElementById('playerNationality').value.trim() || 'ðŸ‡¹ðŸ‡³ Tunisie',
                icon: document.getElementById('staffIcon').value.trim() || 'fas fa-clipboard'
            };
        } else {
            entry = {
                category, name: document.getElementById('playerName').value.trim(),
                number: parseInt(document.getElementById('playerNumber').value) || 0,
                nationality: document.getElementById('playerNationality').value.trim() || 'ðŸ‡¹ðŸ‡³',
                age: parseInt(document.getElementById('playerAge').value) || 25,
                value: document.getElementById('playerValue').value.trim(),
                image: document.getElementById('playerImage').value.trim(),
                stats: {
                    matchs: parseInt(document.getElementById('playerMatchs').value) || 0,
                    buts: parseInt(document.getElementById('playerButs').value) || 0,
                    passes: parseInt(document.getElementById('playerPasses').value) || 0
                }
            };
            const extra = parseInt(document.getElementById('playerExtra').value) || 0;
            if (category === 'goalkeepers') { entry.stats.cleanSheets = entry.stats.passes; entry.stats.arrets = extra; delete entry.stats.passes; }
            else if (category === 'attackers') { entry.stats.tirs = extra; }
            else { entry.stats.tacles = extra; }
        }
        try {
            const fileInput = document.getElementById('playerImageFile');
            if (fileInput && fileInput.files[0]) {
                entry.image = await uploadFile(fileInput);
            }
            await apiPost('players', entry);
            form.reset();
            resetUploadZone('playerImageFile', 'playerImagePreview', 'playerImage', 'playerImageZone');
            refreshPlayersTable();
            showToast('Joueur/Staff ajouté !');
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

function filterPlayers(cat, btn) {
    playerFilterCat = cat;
    document.querySelectorAll('#panel-players .match-filter').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderPlayersTable();
}

async function refreshPlayersTable() {
    const tbody = document.getElementById('playersTableBody');
    if (!tbody) return;
    try {
        allPlayersData = await apiGet('players');
        renderPlayersTable();
    } catch(err) { console.error('refreshPlayersTable:', err); }
}

function renderPlayersTable() {
    const tbody = document.getElementById('playersTableBody');
    if (!tbody) return;
    const catLabels = { goalkeepers:'Gardien', defenders:'Défenseur', midfielders:'Milieu', attackers:'Attaquant', coach:'Entraîneur', staff:'Staff' };
    const catColors = { goalkeepers:'#f39c12', defenders:'#3498db', midfielders:'#2ecc71', attackers:'#e74c3c', coach:'#9b59b6', staff:'#95a5a6' };

    let filtered = allPlayersData;
    if (playerFilterCat !== 'all') {
        if (playerFilterCat === 'coach') {
            filtered = filtered.filter(p => p.category === 'coach' || p.category === 'staff');
        } else {
            filtered = filtered.filter(p => p.category === playerFilterCat);
        }
    }

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#999;padding:30px;">Aucun joueur enregistré</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(p => {
        const id = p.id || p._id;
        const imgSrc = p.image ? p.image : '';
        const imgTag = imgSrc
            ? `<img src="${escapeHtml(imgSrc)}" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid #e8eaed;">`
            : `<div style="width:36px;height:36px;border-radius:50%;background:#f0f2f5;display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:#ccc;border:2px solid #e8eaed;">ðŸ‘¤</div>`;
        const catColor = catColors[p.category] || '#999';
        const stats = p.stats || {};
        const isStaff = p.category === 'coach' || p.category === 'staff';
        const rating = p.rating || 0;
        const ratingColor = rating >= 7 ? '#27ae60' : rating >= 5 ? '#f39c12' : rating > 0 ? '#e74c3c' : '#ccc';
        const ratingBadge = !isStaff && rating > 0 ? `<span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:0.75rem;font-weight:800;background:${ratingColor}18;color:${ratingColor}">${rating}</span>` : '';
        let statsStr;
        if (isStaff) {
            statsStr = `<span style="color:#9b59b6">${escapeHtml(p.role || '-')}</span>`;
        } else {
            const yc = stats.yellowCards || 0;
            const rc = stats.redCards || 0;
            const cards = (yc > 0 || rc > 0) ? ` Â· <span style="color:#f39c12">${yc}ðŸŸ¨</span><span style="color:#e74c3c">${rc}ðŸŸ¥</span>` : '';
            statsStr = `${stats.matchs||0} MJ Â· <strong style="color:#27ae60">${stats.buts||0} B</strong> Â· ${stats.passes||0} PD${cards}`;
        }
        return `<tr>
            <td>${imgTag}</td>
            <td><strong style="color:${catColor}">${p.number || '-'}</strong></td>
            <td><strong>${escapeHtml(p.name)}</strong> ${ratingBadge} ${p.hasAccount ? '<i class="fas fa-user-check" style="color:#27ae60;font-size:0.65rem;margin-left:4px;" title="Compte portail actif"></i>' : ''}</td>
            <td><span style="padding:3px 10px;border-radius:20px;font-size:0.72rem;font-weight:600;background:${catColor}15;color:${catColor}">${catLabels[p.category] || p.category}</span></td>
            <td>${escapeHtml(p.nationality || '-')}</td>
            <td>${p.age || '-'}</td>
            <td style="font-size:0.8rem;color:#888">${escapeHtml(p.value || '-')}</td>
            <td style="font-size:0.72rem;color:#888">${statsStr}</td>
            <td><div class="action-btns" style="display:flex;gap:4px;">
                <button class="standings-row-btn edit" onclick="openPlayerEditModal('${id}')" title="Modifier"><i class="fas fa-pen"></i></button>
                <button class="standings-row-btn delete" onclick="deletePlayer('${id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div></td>
        </tr>`;
    }).join('');
}

function openPlayerEditModal(id) {
    const player = allPlayersData.find(p => (p.id || p._id) === id);
    if (!player) return;

    document.getElementById('editPlayerId').value = id;
    document.getElementById('editPlayerName').value = player.name || '';
    document.getElementById('editPlayerCategory').value = player.category || 'attackers';
    document.getElementById('editPlayerNumber').value = player.number || '';
    document.getElementById('editPlayerNationality').value = player.nationality || '';
    document.getElementById('editPlayerAge').value = player.age || '';
    document.getElementById('editPlayerValue').value = player.value || '';
    document.getElementById('editPlayerImageUrl').value = player.image || '';

    // Photo
    const photoEl = document.getElementById('editPlayerPhoto');
    photoEl.src = player.image || 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23f0f2f5%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23ccc%22 font-size=%2240%22>ðŸ‘¤</text></svg>';

    // Rating
    const rating = player.rating || 0;
    document.getElementById('editPlayerRating').value = rating;
    document.getElementById('ratingDisplay').textContent = rating;

    // Stats
    const stats = player.stats || {};
    document.getElementById('editPlayerMatchs').value = stats.matchs || 0;
    document.getElementById('editPlayerButs').value = stats.buts || 0;
    document.getElementById('editPlayerPasses').value = stats.passes || 0;
    document.getElementById('editPlayerYellows').value = stats.yellowCards || 0;
    document.getElementById('editPlayerReds').value = stats.redCards || 0;
    document.getElementById('editPlayerExtra').value = stats.tacles || stats.tirs || 0;
    document.getElementById('editPlayerCleanSheets').value = stats.cleanSheets || 0;
    document.getElementById('editPlayerArrets').value = stats.arrets || 0;

    // Show/hide sections based on category
    const isStaff = player.category === 'coach' || player.category === 'staff';
    const isGK = player.category === 'goalkeepers';
    document.getElementById('editPlayerFieldsRow').style.display = isStaff ? 'none' : '';
    document.getElementById('editStatsSection').style.display = isStaff ? 'none' : '';
    document.getElementById('editRatingSection').style.display = isStaff ? 'none' : '';
    document.getElementById('editStaffFieldsRow').style.display = isStaff ? '' : 'none';
    document.getElementById('editGKStatsRow').style.display = isGK ? 'grid' : 'none';

    // Extra stat label based on position
    updateEditExtraLabel(player.category);

    if (isStaff) {
        document.getElementById('editStaffRole').value = player.role || '';
        document.getElementById('editStaffIcon').value = player.icon || 'fas fa-clipboard';
    }

    // Account fields
    const hasAcct = !!player.hasAccount;
    document.getElementById('editPlayerHasAccount').checked = hasAcct;
    document.getElementById('editPlayerEmail').value = player.email || '';
    document.getElementById('editPlayerPassword').value = '';
    document.getElementById('editAccountFields').style.display = hasAcct ? '' : 'none';
    const statusEl = document.getElementById('editAccountStatus');
    if (hasAcct) {
        statusEl.textContent = 'âœ“ Compte actif';
        statusEl.style.background = '#e8f5e9';
        statusEl.style.color = '#27ae60';
    } else {
        statusEl.textContent = 'Pas de compte';
        statusEl.style.background = '#f5f6f8';
        statusEl.style.color = '#999';
    }

    // Toggle fields on category change
    document.getElementById('editPlayerCategory').onchange = function() {
        const s = this.value === 'coach' || this.value === 'staff';
        const g = this.value === 'goalkeepers';
        document.getElementById('editPlayerFieldsRow').style.display = s ? 'none' : '';
        document.getElementById('editStatsSection').style.display = s ? 'none' : '';
        document.getElementById('editRatingSection').style.display = s ? 'none' : '';
        document.getElementById('editStaffFieldsRow').style.display = s ? '' : 'none';
        document.getElementById('editGKStatsRow').style.display = g ? 'grid' : 'none';
        updateEditExtraLabel(this.value);
    };

    document.getElementById('editPlayerImageFile').value = '';
    document.getElementById('playerEditOverlay').classList.add('active');
}

function updateEditExtraLabel(cat) {
    const label = document.getElementById('editExtraStatLabel');
    if (!label) return;
    if (cat === 'goalkeepers') label.textContent = 'Clean Sheets';
    else if (cat === 'attackers') label.textContent = 'Tirs cadrés';
    else label.textContent = 'Tacles';
}

function closePlayerEditModal() {
    document.getElementById('playerEditOverlay').classList.remove('active');
}

function toggleAccountFields(checked) {
    document.getElementById('editAccountFields').style.display = checked ? '' : 'none';
    const statusEl = document.getElementById('editAccountStatus');
    if (checked) {
        statusEl.textContent = 'Compte sera activé';
        statusEl.style.background = '#fff8e1';
        statusEl.style.color = '#f39c12';
    } else {
        statusEl.textContent = 'Pas de compte';
        statusEl.style.background = '#f5f6f8';
        statusEl.style.color = '#999';
    }
}

function previewEditPlayerPhoto(input) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = e => { document.getElementById('editPlayerPhoto').src = e.target.result; };
        reader.readAsDataURL(input.files[0]);
    }
}

async function submitPlayerEdit() {
    const id = document.getElementById('editPlayerId').value;
    if (!id) return;

    const category = document.getElementById('editPlayerCategory').value;
    const isStaff = category === 'coach' || category === 'staff';

    let data;
    if (isStaff) {
        data = {
            category,
            name: document.getElementById('editPlayerName').value.trim(),
            role: document.getElementById('editStaffRole').value.trim(),
            nationality: document.getElementById('editPlayerNationality').value.trim(),
            icon: document.getElementById('editStaffIcon').value.trim() || 'fas fa-clipboard'
        };
    } else {
        const stats = {
            matchs: parseInt(document.getElementById('editPlayerMatchs').value) || 0,
            buts: parseInt(document.getElementById('editPlayerButs').value) || 0,
            passes: parseInt(document.getElementById('editPlayerPasses').value) || 0,
            yellowCards: parseInt(document.getElementById('editPlayerYellows').value) || 0,
            redCards: parseInt(document.getElementById('editPlayerReds').value) || 0
        };

        // Position-specific stats
        const extra = parseInt(document.getElementById('editPlayerExtra').value) || 0;
        if (category === 'goalkeepers') {
            stats.cleanSheets = parseInt(document.getElementById('editPlayerCleanSheets').value) || 0;
            stats.arrets = parseInt(document.getElementById('editPlayerArrets').value) || 0;
        } else if (category === 'attackers') {
            stats.tirs = extra;
        } else {
            stats.tacles = extra;
        }

        data = {
            category,
            name: document.getElementById('editPlayerName').value.trim(),
            number: parseInt(document.getElementById('editPlayerNumber').value) || 0,
            nationality: document.getElementById('editPlayerNationality').value.trim(),
            age: parseInt(document.getElementById('editPlayerAge').value) || 0,
            value: document.getElementById('editPlayerValue').value.trim(),
            rating: parseFloat(document.getElementById('editPlayerRating').value) || 0,
            stats
        };
    }

    try {
        // Upload new photo if selected
        const fileInput = document.getElementById('editPlayerImageFile');
        if (fileInput && fileInput.files[0]) {
            data.image = await uploadFile(fileInput);
        } else {
            data.image = document.getElementById('editPlayerImageUrl').value;
        }

        await apiPut('players/' + id, data);

        // Handle account setup/removal
        const hasAccount = document.getElementById('editPlayerHasAccount').checked;
        const email = document.getElementById('editPlayerEmail').value.trim();
        const password = document.getElementById('editPlayerPassword').value;

        // Find existing player data to check if account state changed
        const existingPlayer = allPlayersData.find(p => (p.id || p._id) === id);
        const hadAccount = existingPlayer && existingPlayer.hasAccount;

        if (hasAccount && email) {
            // Only send if new account or email/password changed
            const accountData = { email, hasAccount: true };
            if (password) accountData.password = password;
            else if (!hadAccount) {
                showToast('Mot de passe requis pour créer un compte', 'error');
                return;
            }
            if (password || !hadAccount || email !== (existingPlayer.email || '')) {
                await fetch('/api/player/setup-account/' + id, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('cssfaxien_token') },
                    body: JSON.stringify(accountData)
                }).then(r => r.json()).then(r => { if (r.error) throw new Error(r.error); });
            }
        } else if (!hasAccount && hadAccount) {
            // Remove account
            await fetch('/api/player/setup-account/' + id, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('cssfaxien_token') },
                body: JSON.stringify({ hasAccount: false })
            }).then(r => r.json()).then(r => { if (r.error) throw new Error(r.error); });
        }

        closePlayerEditModal();
        refreshPlayersTable();
        showToast('Joueur mis í  jour !');
    } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

async function recalcSinglePlayerStats() {
    const id = document.getElementById('editPlayerId').value;
    const playerName = document.getElementById('editPlayerName').value.trim();
    if (!playerName) return;

    try {
        const result = await apiPost('players/update-from-match', {
            events: [{ player: playerName, type: 'goal' }] // trigger name-based recalc
        });
        // Reload player data to get fresh stats
        const updatedPlayer = await apiGet('players/' + id);
        const stats = updatedPlayer.stats || {};
        document.getElementById('editPlayerMatchs').value = stats.matchs || 0;
        document.getElementById('editPlayerButs').value = stats.buts || 0;
        document.getElementById('editPlayerPasses').value = stats.passes || 0;
        document.getElementById('editPlayerYellows').value = stats.yellowCards || 0;
        document.getElementById('editPlayerReds').value = stats.redCards || 0;
        showToast(`Stats recalculées pour ${playerName} !`);
    } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

async function deletePlayer(id) {
    if (!confirm('Supprimer ce joueur/staff ?')) return;
    try { await apiDelete(`players/${id}`); refreshPlayersTable(); showToast('Joueur/Staff supprimé', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

async function recalcAllPlayerStats() {
    if (!confirm('Recalculer les stats de TOUS les joueurs depuis les événements des matchs ?\n(Buts, passes décisives, cartons seront mis í  jour automatiquement)')) return;
    try {
        const btn = document.querySelector('.standings-btn.sync');
        if (btn) { btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Recalcul...'; btn.disabled = true; }
        const result = await apiPost('players/recalculate-stats', {});
        showToast(`Stats recalculées ! ${result.playersUpdated || 0} joueur(s) mis í  jour.`);
        refreshPlayersTable();
        if (btn) { btn.innerHTML = '<i class="fas fa-sync-alt"></i> Recalculer stats depuis matchs'; btn.disabled = false; }
    } catch(err) {
        showToast('Erreur: ' + err.message, 'error');
        const btns = document.querySelectorAll('.standings-btn.sync');
        btns.forEach(b => { b.innerHTML = '<i class="fas fa-sync-alt"></i> Recalculer'; b.disabled = false; });
    }
}

// ===== GALLERY =====
function setupGalleryForm() {
    const form = document.getElementById('galleryForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const category = document.getElementById('galleryCategory').value;
        const isVideo = category === 'video';
        const item = {
            title: document.getElementById('galleryTitle').value.trim(),
            desc: document.getElementById('galleryDesc').value.trim(),
            category, type: isVideo ? 'video' : 'photo',
            layout: document.getElementById('galleryLayout').value,
            date: document.getElementById('galleryDate').value
        };
        try {
            const fileInput = document.getElementById('galleryFile');
            if (fileInput && fileInput.files[0]) {
                const fileUrl = await uploadFile(fileInput);
                if (isVideo) {
                    item.videoUrl = fileUrl;
                    item.duration = document.getElementById('galleryDuration').value.trim();
                } else {
                    item.image = fileUrl;
                }
            } else if (isVideo) {
                item.duration = document.getElementById('galleryDuration').value.trim();
            }
            await apiPost('gallery', item);
            form.reset();
            resetUploadZone('galleryFile', 'galleryFilePreview', 'galleryFileUrl', 'galleryFileZone', 'galleryVideoPreview');
            document.getElementById('galleryDate').value = new Date().toISOString().split('T')[0];
            refreshGalleryTable();
            showToast('Média ajouté í  la galerie !');
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

async function refreshGalleryTable() {
    const tbody = document.getElementById('galleryTableBody');
    if (!tbody) return;
    try {
        const gallery = await apiGet('gallery');
        gallery.sort((a, b) => new Date(b.date) - new Date(a.date));
        const catLabels = { 'match-photo':'Match', 'training-photo':'Entraînement', 'video':'Vidéo', 'fans':'Supporters', 'stadium':'Stade' };
        if (gallery.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Aucun média enregistré</td></tr>';
            return;
        }
        tbody.innerHTML = gallery.map(item => {
            const formattedDate = new Date(item.date).toLocaleDateString('fr-FR');
            const itemJson = encodeURIComponent(JSON.stringify(item));
            return `<tr>
                <td>${formattedDate}</td>
                <td><strong>${escapeHtml(item.title)}</strong></td>
                <td>${catLabels[item.category] || item.category}</td>
                <td>${item.type === 'video' ? '🎬 Vidéo' : 'ðŸ“· Photo'}</td>
                <td><div class="action-btns"><button class="btn-icon" onclick="previewGalleryItem(decodeURIComponent('${itemJson}'))" title="Aperçu utilisateur"><i class="fas fa-eye"></i></button><button class="btn-icon delete" onclick="deleteGalleryItem('${item.id || item._id}')" title="Supprimer"><i class="fas fa-trash"></i></button></div></td>
            </tr>`;
        }).join('');
    } catch(err) { console.error('refreshGalleryTable:', err); }
}

async function deleteGalleryItem(id) {
    if (!confirm('Supprimer ce média ?')) return;
    try { await apiDelete(`gallery/${id}`); refreshGalleryTable(); showToast('Média supprimé', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

function previewGalleryItem(jsonStr) {
    const item = JSON.parse(jsonStr);
    const overlay = document.getElementById('galleryPreviewOverlay');
    const mediaEl = document.getElementById('galleryPreviewMedia');
    const infoEl = document.getElementById('galleryPreviewInfo');
    if (!overlay || !mediaEl || !infoEl) return;

    const catLabels = { 'match-photo':'Photos Matchs', 'training-photo':'Entraînements', 'video':'Vidéos', 'fans':'Supporters', 'stadium':'Stade' };
    const galleryIcons = { 'match-photo':'fas fa-futbol', 'training-photo':'fas fa-running', 'video':'fas fa-play-circle', 'fans':'fas fa-users', 'stadium':'fas fa-building' };
    const iconClass = galleryIcons[item.category] || 'fas fa-image';
    const isVideo = item.type === 'video';
    const dateStr = item.date ? new Date(item.date).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' }) : '';

    // Render media
    if (isVideo && item.videoUrl) {
        mediaEl.innerHTML = `<video src="${escapeHtml(item.videoUrl)}" controls style="width:100%;max-height:60vh;"></video>`;
    } else if (item.image) {
        mediaEl.innerHTML = `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}">`;
    } else {
        mediaEl.innerHTML = `<div class="preview-placeholder"><i class="${iconClass}"></i><span>Aucun aperçu disponible</span></div>`;
    }

    // Render info
    const typeClass = isVideo ? 'video' : 'photo';
    const typeLabel = isVideo ? '<i class="fas fa-play"></i> Vidéo' : '<i class="fas fa-camera"></i> Photo';
    infoEl.innerHTML = `
        <h4>${escapeHtml(item.title)}</h4>
        ${item.desc ? `<p>${escapeHtml(item.desc)}</p>` : ''}
        <div class="gallery-preview-meta">
            <span class="gallery-preview-type ${typeClass}">${typeLabel}</span>
            <span><i class="${iconClass}"></i> ${catLabels[item.category] || item.category}</span>
            ${dateStr ? `<span><i class="far fa-calendar-alt"></i> ${dateStr}</span>` : ''}
            ${item.layout ? `<span><i class="fas fa-th-large"></i> ${item.layout === 'wide' ? 'Large' : item.layout === 'tall' ? 'Haut' : 'Normal'}</span>` : ''}
            ${isVideo && item.duration ? `<span><i class="fas fa-clock"></i> ${escapeHtml(item.duration)}</span>` : ''}
        </div>
    `;

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('active'));
    document.body.style.overflow = 'hidden';
}

function closeGalleryPreview() {
    const overlay = document.getElementById('galleryPreviewOverlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { overlay.style.display = 'none'; }, 300);
}

// Close on overlay click
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'galleryPreviewOverlay') closeGalleryPreview();
});
document.addEventListener('keydown', (e) => {
    const overlay = document.getElementById('galleryPreviewOverlay');
    if (overlay && overlay.classList.contains('active') && e.key === 'Escape') closeGalleryPreview();
});

function previewGalleryForm() {
    const title = document.getElementById('galleryTitle')?.value || '';
    const category = document.getElementById('galleryCategory')?.value || '';
    const desc = document.getElementById('galleryDesc')?.value || '';
    const date = document.getElementById('galleryDate')?.value || '';
    const layout = document.getElementById('galleryLayout')?.value || '';
    const duration = document.getElementById('galleryDuration')?.value || '';
    const fileUrl = document.getElementById('galleryFileUrl')?.value || '';
    const fileInput = document.getElementById('galleryFile');
    const isVideo = fileInput?.files?.[0]?.type?.startsWith('video/') || category === 'video';

    if (!title) { showToast('Veuillez remplir le titre pour visualiser', 'error'); return; }

    // Build a preview from local file or uploaded URL
    const imgPreview = document.getElementById('galleryFilePreview');
    const vidPreview = document.getElementById('galleryVideoPreview');
    let mediaSrc = fileUrl;
    if (!mediaSrc && imgPreview && imgPreview.style.display !== 'none') mediaSrc = imgPreview.src;
    if (!mediaSrc && vidPreview && vidPreview.style.display !== 'none') mediaSrc = vidPreview.src;

    const item = { title, category, desc, date, layout, duration, type: isVideo ? 'video' : 'photo', image: isVideo ? '' : mediaSrc, videoUrl: isVideo ? mediaSrc : '' };
    previewGalleryItem(JSON.stringify(item));
}

// ===== TIMELINE =====
function setupTimelineForm() {
    const form = document.getElementById('timelineForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('timelineEditId').value;
        const data = {
            year: document.getElementById('timelineYear').value.trim(),
            icon: document.getElementById('timelineIcon').value.trim(),
            title: document.getElementById('timelineTitle').value.trim(),
            desc: document.getElementById('timelineDesc').value.trim()
        };
        try {
            if (editId) {
                await apiPut('timeline/' + editId, data);
                showToast('Événement modifié !');
            } else {
                await apiPost('timeline', data);
                showToast('Événement ajouté !');
            }
            cancelTimelineEdit();
            refreshTimelineTable();
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

function editTimeline(id, year, icon, title, desc) {
    document.getElementById('timelineEditId').value = id;
    document.getElementById('timelineYear').value = year;
    document.getElementById('timelineIcon').value = icon || 'fa-trophy';
    document.getElementById('timelineTitle').value = title;
    document.getElementById('timelineDesc').value = desc;
    document.getElementById('timelineFormTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier l\'événement';
    document.getElementById('timelineSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Modifier';
    document.getElementById('timelineCancelBtn').style.display = '';
    document.getElementById('timelineForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelTimelineEdit() {
    document.getElementById('timelineEditId').value = '';
    document.getElementById('timelineForm').reset();
    document.getElementById('timelineIcon').value = 'fa-trophy';
    document.getElementById('timelineFormTitle').innerHTML = '<i class="fas fa-clock"></i> Ajouter un événement í  la chronologie';
    document.getElementById('timelineSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Ajouter';
    document.getElementById('timelineCancelBtn').style.display = 'none';
}

async function refreshTimelineTable() {
    const tbody = document.getElementById('timelineTableBody');
    if (!tbody) return;
    try {
        const timeline = await apiGet('timeline');
        timeline.sort((a, b) => parseInt(a.year) - parseInt(b.year));
        if (timeline.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;padding:30px;">Aucun événement</td></tr>';
            return;
        }
        tbody.innerHTML = timeline.map(item => {
            const id = item.id || item._id;
            return `<tr>
            <td><strong>${escapeHtml(item.year)}</strong></td>
            <td>${escapeHtml(item.title)}</td>
            <td><div class="action-btns"><button class="btn-icon" onclick="editTimeline('${id}','${escapeHtml(item.year)}','${escapeHtml(item.icon || '')}','${escapeHtml(item.title).replace(/'/g,"\\'")}','${escapeHtml(item.desc || '').replace(/'/g,"\\'").replace(/\n/g,'\\n')}')" title="Modifier"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteTimeline('${id}')" title="Supprimer"><i class="fas fa-trash"></i></button></div></td>
        </tr>`;
        }).join('');
    } catch(err) { console.error('refreshTimelineTable:', err); }
}

async function deleteTimeline(id) {
    if (!confirm('Supprimer cet événement ?')) return;
    try { await apiDelete(`timeline/${id}`); refreshTimelineTable(); showToast('Événement supprimé', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== TROPHIES =====
function setupTrophyForm() {
    const form = document.getElementById('trophyForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('trophyEditId').value;
        const data = {
            name: document.getElementById('trophyName').value.trim(),
            icon: document.getElementById('trophyIcon').value.trim(),
            count: parseInt(document.getElementById('trophyCount').value) || 1,
            years: document.getElementById('trophyYears').value.split(',').map(y => y.trim()).filter(y => y)
        };
        try {
            if (editId) {
                await apiPut('trophies/' + editId, data);
                showToast('Trophée modifié !');
            } else {
                await apiPost('trophies', data);
                showToast('Trophée ajouté !');
            }
            cancelTrophyEdit();
            refreshTrophiesTable();
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

function editTrophy(id, name, icon, count, years) {
    document.getElementById('trophyEditId').value = id;
    document.getElementById('trophyName').value = name;
    document.getElementById('trophyIcon').value = icon || 'fa-trophy';
    document.getElementById('trophyCount').value = count;
    document.getElementById('trophyYears').value = years;
    document.getElementById('trophyFormTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier le trophée';
    document.getElementById('trophySubmitBtn').innerHTML = '<i class="fas fa-save"></i> Modifier';
    document.getElementById('trophyCancelBtn').style.display = '';
    document.getElementById('trophyForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelTrophyEdit() {
    document.getElementById('trophyEditId').value = '';
    document.getElementById('trophyForm').reset();
    document.getElementById('trophyIcon').value = 'fa-trophy';
    document.getElementById('trophyCount').value = '1';
    document.getElementById('trophyFormTitle').innerHTML = '<i class="fas fa-trophy"></i> Ajouter un trophée';
    document.getElementById('trophySubmitBtn').innerHTML = '<i class="fas fa-save"></i> Ajouter';
    document.getElementById('trophyCancelBtn').style.display = 'none';
}

async function refreshTrophiesTable() {
    const tbody = document.getElementById('trophiesTableBody');
    if (!tbody) return;
    try {
        const trophies = await apiGet('trophies');
        if (trophies.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:30px;">Aucun trophée</td></tr>';
            return;
        }
        tbody.innerHTML = trophies.map(t => {
            const id = t.id || t._id;
            const yearsStr = t.years.join(', ');
            return `<tr>
            <td><strong>${escapeHtml(t.name)}</strong></td>
            <td>${t.count}</td>
            <td>${yearsStr}</td>
            <td><div class="action-btns"><button class="btn-icon" onclick="editTrophy('${id}','${escapeHtml(t.name).replace(/'/g,"\\'")}','${escapeHtml(t.icon || '')}','${t.count}','${yearsStr.replace(/'/g,"\\'")}')" title="Modifier"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteTrophy('${id}')" title="Supprimer"><i class="fas fa-trash"></i></button></div></td>
        </tr>`;
        }).join('');
    } catch(err) { console.error('refreshTrophiesTable:', err); }
}

async function deleteTrophy(id) {
    if (!confirm('Supprimer ce trophée ?')) return;
    try { await apiDelete(`trophies/${id}`); refreshTrophiesTable(); showToast('Trophée supprimé', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== LEGENDS =====
function setupLegendForm() {
    const form = document.getElementById('legendForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('legendEditId').value;
        try {
            let image = document.getElementById('legendImage').value.trim();
            const fileInput = document.getElementById('legendImageFile');
            if (fileInput && fileInput.files[0]) {
                image = await uploadFile(fileInput);
            }
            const data = {
                name: document.getElementById('legendName').value.trim(),
                position: document.getElementById('legendPosition').value.trim(),
                era: document.getElementById('legendEra').value.trim(),
                number: document.getElementById('legendNumber').value.trim(),
                desc: document.getElementById('legendDesc').value.trim(),
                image
            };
            if (editId) {
                await apiPut('legends/' + editId, data);
                showToast('Légende modifiée !');
            } else {
                await apiPost('legends', data);
                showToast('Légende ajoutée !');
            }
            cancelLegendEdit();
            refreshLegendsTable();
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

async function editLegend(id) {
    try {
        const legend = await apiGet('legends/' + id);
        document.getElementById('legendEditId').value = id;
        document.getElementById('legendName').value = legend.name || '';
        document.getElementById('legendPosition').value = legend.position || '';
        document.getElementById('legendEra').value = legend.era || '';
        document.getElementById('legendNumber').value = legend.number || '';
        document.getElementById('legendDesc').value = legend.desc || '';
        document.getElementById('legendImage').value = legend.image || '';
        const preview = document.getElementById('legendImagePreview');
        if (preview && legend.image) {
            preview.src = legend.image;
            preview.style.display = 'block';
        }
        document.getElementById('legendFormTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier la légende';
        document.getElementById('legendSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Modifier';
        document.getElementById('legendCancelBtn').style.display = '';
        document.getElementById('legendForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

function cancelLegendEdit() {
    document.getElementById('legendEditId').value = '';
    document.getElementById('legendForm').reset();
    resetUploadZone('legendImageFile', 'legendImagePreview', 'legendImage', 'legendImageZone');
    document.getElementById('legendFormTitle').innerHTML = '<i class="fas fa-star"></i> Ajouter une légende';
    document.getElementById('legendSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Ajouter';
    document.getElementById('legendCancelBtn').style.display = 'none';
}

async function refreshLegendsTable() {
    const tbody = document.getElementById('legendsTableBody');
    if (!tbody) return;
    try {
        const legends = await apiGet('legends');
        if (legends.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:30px;">Aucune légende</td></tr>';
            return;
        }
        tbody.innerHTML = legends.map(l => {
            const id = l.id || l._id;
            return `<tr>
            <td><strong>${escapeHtml(l.name)}</strong></td>
            <td>${escapeHtml(l.position)}</td>
            <td>${escapeHtml(l.era)}</td>
            <td><div class="action-btns"><button class="btn-icon" onclick="editLegend('${id}')" title="Modifier"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteLegend('${id}')" title="Supprimer"><i class="fas fa-trash"></i></button></div></td>
        </tr>`;
        }).join('');
    } catch(err) { console.error('refreshLegendsTable:', err); }
}

async function deleteLegend(id) {
    if (!confirm('Supprimer cette légende ?')) return;
    try { await apiDelete(`legends/${id}`); refreshLegendsTable(); showToast('Légende supprimée', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== TICKET MATCHES =====
function setupTicketMatchForm() {
    const form = document.getElementById('ticketMatchForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('ticketMatchEditId').value;
        const data = {
            home: document.getElementById('ticketHome').value.trim(),
            away: document.getElementById('ticketAway').value.trim(),
            date: document.getElementById('ticketDate').value.trim(),
            time: document.getElementById('ticketTime').value.trim(),
            comp: document.getElementById('ticketComp').value.trim(),
            venue: document.getElementById('ticketVenue').value.trim(),
            available: document.getElementById('ticketAvailable').checked
        };
        try {
            if (editId) {
                await apiPut('ticketMatches/' + editId, data);
                showToast('Match modifié !');
            } else {
                await apiPost('ticketMatches', data);
                showToast('Match ajouté í  la billetterie !');
            }
            cancelTicketMatchEdit();
            refreshTicketMatchesTable();
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

async function editTicketMatch(id) {
    try {
        const t = await apiGet('ticketMatches/' + id);
        document.getElementById('ticketMatchEditId').value = id;
        document.getElementById('ticketHome').value = t.home || 'CS Sfaxien';
        document.getElementById('ticketAway').value = t.away || '';
        document.getElementById('ticketDate').value = t.date || '';
        document.getElementById('ticketTime').value = t.time || '';
        document.getElementById('ticketComp').value = t.comp || '';
        document.getElementById('ticketVenue').value = t.venue || 'Stade Taí¯eb Mhiri';
        document.getElementById('ticketAvailable').checked = t.available !== false;
        document.getElementById('ticketMatchFormTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier le match';
        document.getElementById('ticketMatchSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Modifier';
        document.getElementById('ticketMatchCancelBtn').style.display = '';
        document.getElementById('ticketMatchForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

function cancelTicketMatchEdit() {
    document.getElementById('ticketMatchEditId').value = '';
    document.getElementById('ticketMatchForm').reset();
    document.getElementById('ticketHome').value = 'CS Sfaxien';
    document.getElementById('ticketVenue').value = 'Stade Taí¯eb Mhiri';
    document.getElementById('ticketAvailable').checked = true;
    document.getElementById('ticketMatchFormTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un match en vente';
    document.getElementById('ticketMatchSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Ajouter';
    document.getElementById('ticketMatchCancelBtn').style.display = 'none';
}

async function refreshTicketMatchesTable() {
    const tbody = document.getElementById('ticketMatchesTableBody');
    if (!tbody) return;
    try {
        const tickets = await apiGet('ticketMatches');
        if (tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Aucun match en billetterie</td></tr>';
            return;
        }
        tbody.innerHTML = tickets.map(t => {
            const id = t.id || t._id;
            return `<tr>
            <td>${escapeHtml(t.date)}</td>
            <td><strong>${escapeHtml(t.home)} vs ${escapeHtml(t.away)}</strong></td>
            <td>${escapeHtml(t.comp || '-')}</td>
            <td>${t.available ? 'âœ… Oui' : 'âŒ Non'}</td>
            <td><div class="action-btns"><button class="btn-icon" onclick="editTicketMatch('${id}')" title="Modifier"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteTicketMatch('${id}')" title="Supprimer"><i class="fas fa-trash"></i></button></div></td>
        </tr>`;
        }).join('');
    } catch(err) { console.error('refreshTicketMatchesTable:', err); }
}

async function deleteTicketMatch(id) {
    if (!confirm('Supprimer ce match de la billetterie ?')) return;
    try { await apiDelete(`ticketMatches/${id}`); refreshTicketMatchesTable(); showToast('Match supprimé de la billetterie', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== STADIUM ZONES =====
function setupStadiumZoneForm() {
    const form = document.getElementById('stadiumZoneForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('zoneEditId').value;
        const data = {
            name: document.getElementById('zoneName').value.trim(),
            price: parseInt(document.getElementById('zonePrice').value) || 0,
            available: parseInt(document.getElementById('zoneAvailable').value) || 0,
            total: parseInt(document.getElementById('zoneTotal').value) || 0
        };
        try {
            if (editId) {
                await apiPut('stadiumZones/' + editId, data);
                showToast('Zone modifiée !');
            } else {
                await apiPost('stadiumZones', data);
                showToast('Zone ajoutée !');
            }
            cancelZoneEdit();
            refreshZonesTable();
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

async function editZone(id) {
    try {
        const z = await apiGet('stadiumZones/' + id);
        document.getElementById('zoneEditId').value = id;
        document.getElementById('zoneName').value = z.name || '';
        document.getElementById('zonePrice').value = z.price || 0;
        document.getElementById('zoneAvailable').value = z.available || 0;
        document.getElementById('zoneTotal').value = z.total || 0;
        document.getElementById('zoneFormTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier la zone';
        document.getElementById('zoneSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Modifier';
        document.getElementById('zoneCancelBtn').style.display = '';
        document.getElementById('stadiumZoneForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

function cancelZoneEdit() {
    document.getElementById('zoneEditId').value = '';
    document.getElementById('stadiumZoneForm').reset();
    document.getElementById('zoneFormTitle').innerHTML = '<i class="fas fa-map-marked-alt"></i> Gérer les zones du stade';
    document.getElementById('zoneSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Ajouter la zone';
    document.getElementById('zoneCancelBtn').style.display = 'none';
}

async function refreshZonesTable() {
    const tbody = document.getElementById('zonesTableBody');
    if (!tbody) return;
    try {
        const zones = await apiGet('stadiumZones');
        if (zones.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Aucune zone</td></tr>';
            return;
        }
        tbody.innerHTML = zones.map(z => {
            const id = z.id || z._id;
            return `<tr>
            <td><strong>${escapeHtml(z.name)}</strong></td>
            <td>${z.price} TND</td>
            <td>${z.available.toLocaleString()}</td>
            <td>${z.total.toLocaleString()}</td>
            <td><div class="action-btns"><button class="btn-icon" onclick="editZone('${id}')" title="Modifier"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteZone('${id}')" title="Supprimer"><i class="fas fa-trash"></i></button></div></td>
        </tr>`;
        }).join('');
    } catch(err) { console.error('refreshZonesTable:', err); }
}

async function deleteZone(id) {
    if (!confirm('Supprimer cette zone ?')) return;
    try { await apiDelete(`stadiumZones/${id}`); refreshZonesTable(); showToast('Zone supprimée', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== SUBSCRIPTION PLANS =====
function setupSubPlanForm() {
    const form = document.getElementById('subPlanForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('subPlanEditId').value;
        const featuresText = document.getElementById('subPlanFeatures').value.trim();
        const features = featuresText.split('\n').map(line => {
            line = line.trim();
            if (!line) return null;
            const isDisabled = line.startsWith('✗') || line.startsWith('í—') || line.startsWith('x ') || line.startsWith('X ');
            const text = line.replace(/^[âœ“✗í—xX]\s*/, '');
            return { icon: isDisabled ? 'fa-times' : 'fa-check', text };
        }).filter(Boolean);
        try {
            let image = document.getElementById('subPlanImage').value.trim();
            const fileInput = document.getElementById('subPlanImageFile');
            if (fileInput && fileInput.files[0]) {
                image = await uploadFile(fileInput);
            }
            const data = {
                name: document.getElementById('subPlanName').value.trim(),
                price: parseInt(document.getElementById('subPlanPrice').value) || 0,
                period: document.getElementById('subPlanPeriod').value.trim(),
                icon: document.getElementById('subPlanIcon').value.trim(),
                description: document.getElementById('subPlanDesc').value.trim(),
                featured: document.getElementById('subPlanFeatured').checked,
                image,
                features
            };
            if (editId) {
                await apiPut('subPlans/' + editId, data);
                showToast('Plan modifié !');
            } else {
                await apiPost('subPlans', data);
                showToast('Plan d\'abonnement ajouté !');
            }
            cancelSubPlanEdit();
            refreshSubPlansTable();
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

async function editSubPlan(id) {
    try {
        const p = await apiGet('subPlans/' + id);
        document.getElementById('subPlanEditId').value = id;
        document.getElementById('subPlanName').value = p.name || '';
        document.getElementById('subPlanPrice').value = p.price || 0;
        document.getElementById('subPlanPeriod').value = p.period || 'Saison 2025-2026';
        document.getElementById('subPlanIcon').value = p.icon || 'fa-users';
        document.getElementById('subPlanDesc').value = p.description || '';
        document.getElementById('subPlanFeatured').checked = !!p.featured;
        document.getElementById('subPlanImage').value = p.image || '';
        const preview = document.getElementById('subPlanImagePreview');
        if (preview && p.image) {
            preview.src = p.image;
            preview.style.display = 'block';
        }
        // Convert features array back to text
        if (p.features && p.features.length) {
            document.getElementById('subPlanFeatures').value = p.features.map(f => {
                const prefix = f.icon === 'fa-times' ? '✗' : 'âœ“';
                return prefix + ' ' + f.text;
            }).join('\n');
        } else {
            document.getElementById('subPlanFeatures').value = '';
        }
        document.getElementById('subPlanFormTitle').innerHTML = '<i class="fas fa-edit"></i> Modifier le plan d\'abonnement';
        document.getElementById('subPlanSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Modifier';
        document.getElementById('subPlanCancelBtn').style.display = '';
        document.getElementById('subPlanForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

function cancelSubPlanEdit() {
    document.getElementById('subPlanEditId').value = '';
    document.getElementById('subPlanForm').reset();
    document.getElementById('subPlanPeriod').value = 'Saison 2025-2026';
    document.getElementById('subPlanIcon').value = 'fa-users';
    resetUploadZone('subPlanImageFile', 'subPlanImagePreview', 'subPlanImage', 'subPlanImageZone');
    document.getElementById('subPlanFormTitle').innerHTML = '<i class="fas fa-plus-circle"></i> Ajouter un plan d\'abonnement';
    document.getElementById('subPlanSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Ajouter le plan';
    document.getElementById('subPlanCancelBtn').style.display = 'none';
}

async function refreshSubPlansTable() {
    const tbody = document.getElementById('subPlansTableBody');
    if (!tbody) return;
    try {
        const plans = await apiGet('subPlans');
        if (plans.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Aucun plan</td></tr>';
            return;
        }
        tbody.innerHTML = plans.map(p => {
            const id = p.id || p._id;
            return `<tr>
            <td><strong>${escapeHtml(p.name)}</strong></td>
            <td>${p.price} TND</td>
            <td>${escapeHtml(p.period)}</td>
            <td>${p.featured ? 'â­ Oui' : 'Non'}</td>
            <td><div class="action-btns"><button class="btn-icon" onclick="editSubPlan('${id}')" title="Modifier"><i class="fas fa-edit"></i></button><button class="btn-icon delete" onclick="deleteSubPlan('${id}')" title="Supprimer"><i class="fas fa-trash"></i></button></div></td>
        </tr>`;
        }).join('');
    } catch(err) { console.error('refreshSubPlansTable:', err); }
}

async function deleteSubPlan(id) {
    if (!confirm('Supprimer ce plan ?')) return;
    try { await apiDelete(`subPlans/${id}`); refreshSubPlansTable(); showToast('Plan supprimé', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== SOCIAL MEMBERS (Membres Sociaux) =====
let allSocialMembers = [];

function setupSocialMemberForm() {
    const form = document.getElementById('socialMemberForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const editId = document.getElementById('smEditId').value;
        const data = {
            firstName: document.getElementById('smFirstName').value.trim(),
            lastName: document.getElementById('smLastName').value.trim(),
            cin: document.getElementById('smCin').value.trim(),
            email: document.getElementById('smEmail').value.trim(),
            phone: document.getElementById('smPhone').value.trim(),
            birthDate: document.getElementById('smBirthDate').value,
            address: document.getElementById('smAddress').value.trim(),
            plan: document.getElementById('smPlan').value.trim(),
            season: document.getElementById('smSeason').value.trim(),
            paidAmount: parseFloat(document.getElementById('smPaidAmount').value) || 0,
            status: document.getElementById('smStatus').value
        };

        try {
            if (editId) {
                await apiPut(`social-members/${editId}`, data);
                showToast('Membre mis í  jour !');
            } else {
                await apiPost('social-members', data);
                showToast('Membre social ajouté !');
            }
            form.reset();
            document.getElementById('smEditId').value = '';
            document.getElementById('smSeason').value = 'Saison 2025-2026';
            document.getElementById('smSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Ajouter le membre';
            document.getElementById('smCancelEdit').style.display = 'none';
            refreshSocialMembersTable();
            loadMemberStats();
        } catch(err) {
            showToast(err.message || 'Erreur', 'error');
        }
    });

    // CIN live check
    const cinInput = document.getElementById('smCin');
    if (cinInput) {
        let cinTimer;
        cinInput.addEventListener('input', () => {
            clearTimeout(cinTimer);
            const cin = cinInput.value.trim();
            const status = document.getElementById('smCinStatus');
            if (!cin || cin.length < 4) { status.style.display = 'none'; return; }
            cinTimer = setTimeout(async () => {
                try {
                    const res = await apiGet(`social-members/check-cin/${encodeURIComponent(cin)}`);
                    if (res.exists) {
                        const editId = document.getElementById('smEditId').value;
                        status.style.display = 'block';
                        status.style.color = '#ef4444';
                        status.textContent = `âš  CIN déjí  enregistré : ${res.name} (${res.memberNumber}) â€” ${res.status}`;
                    } else {
                        status.style.display = 'block';
                        status.style.color = '#22c55e';
                        status.textContent = 'âœ“ CIN disponible';
                    }
                } catch(e) { status.style.display = 'none'; }
            }, 500);
        });
    }

    // Search + filter
    const searchInput = document.getElementById('memberSearchInput');
    const filterSelect = document.getElementById('memberFilterStatus');
    if (searchInput) searchInput.addEventListener('input', renderMembersTable);
    if (filterSelect) filterSelect.addEventListener('change', renderMembersTable);
}

async function loadMemberStats() {
    const grid = document.getElementById('memberStatsGrid');
    if (!grid) return;
    try {
        const s = await apiGet('social-members/stats');
        grid.innerHTML = `
            <div style="flex:1;min-width:120px;text-align:center;padding:16px;background:rgba(255,255,255,0.04);border-radius:12px;">
                <div style="font-size:2rem;font-weight:800;color:#fff;">${s.total}</div>
                <div style="font-size:0.78rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">Total</div>
            </div>
            <div style="flex:1;min-width:120px;text-align:center;padding:16px;background:rgba(34,197,94,0.08);border-radius:12px;">
                <div style="font-size:2rem;font-weight:800;color:#22c55e;">${s.active}</div>
                <div style="font-size:0.78rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">Actifs</div>
            </div>
            <div style="flex:1;min-width:120px;text-align:center;padding:16px;background:rgba(234,179,8,0.08);border-radius:12px;">
                <div style="font-size:2rem;font-weight:800;color:#eab308;">${s.expired}</div>
                <div style="font-size:0.78rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">Expirés</div>
            </div>
            <div style="flex:1;min-width:120px;text-align:center;padding:16px;background:rgba(239,68,68,0.08);border-radius:12px;">
                <div style="font-size:2rem;font-weight:800;color:#ef4444;">${s.suspended}</div>
                <div style="font-size:0.78rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">Suspendus</div>
            </div>
            <div style="flex:1;min-width:120px;text-align:center;padding:16px;background:rgba(59,130,246,0.08);border-radius:12px;">
                <div style="font-size:2rem;font-weight:800;color:#3b82f6;">${s.revenue} TND</div>
                <div style="font-size:0.78rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:1px;">Revenus</div>
            </div>
        `;
    } catch(e) { console.error('loadMemberStats:', e); }
}

async function refreshSocialMembersTable() {
    try {
        allSocialMembers = await apiGet('social-members');
        renderMembersTable();
    } catch(err) { console.error('refreshSocialMembersTable:', err); }
}

function renderMembersTable() {
    const tbody = document.getElementById('socialMembersTableBody');
    if (!tbody) return;

    const search = (document.getElementById('memberSearchInput')?.value || '').toLowerCase();
    const statusFilter = document.getElementById('memberFilterStatus')?.value || 'all';

    let filtered = allSocialMembers.filter(m => {
        if (statusFilter !== 'all' && m.status !== statusFilter) return false;
        if (search) {
            const text = `${m.firstName} ${m.lastName} ${m.cin} ${m.email} ${m.memberNumber} ${m.plan}`.toLowerCase();
            if (!text.includes(search)) return false;
        }
        return true;
    });

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#999;padding:30px;">Aucun membre trouvé</td></tr>';
        return;
    }

    const statusLabels = { active: '<span style="color:#22c55e;">● Actif</span>', expired: '<span style="color:#eab308;">● Expiré</span>', suspended: '<span style="color:#ef4444;">● Suspendu</span>' };

    tbody.innerHTML = filtered.map(m => `<tr>
        <td><code style="background:rgba(255,255,255,0.06);padding:3px 8px;border-radius:6px;font-size:0.82rem;">${escapeHtml(m.memberNumber || 'â€”')}</code></td>
        <td><strong>${escapeHtml(m.firstName)} ${escapeHtml(m.lastName)}</strong>${m.email ? '<br><small style="color:#999;">' + escapeHtml(m.email) + '</small>' : ''}</td>
        <td style="font-family:monospace;">${escapeHtml(m.cin)}</td>
        <td>${escapeHtml(m.plan || 'â€”')}</td>
        <td>${statusLabels[m.status] || m.status}</td>
        <td>${m.paidAmount || 0} TND</td>
        <td>
            <div class="action-btns">
                <button class="btn-icon edit" onclick="editSocialMember('${m.id || m._id}')" title="Modifier"><i class="fas fa-pen"></i></button>
                <button class="btn-icon delete" onclick="deleteSocialMember('${m.id || m._id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
            </div>
        </td>
    </tr>`).join('');
}

function editSocialMember(id) {
    const m = allSocialMembers.find(x => (x.id || x._id) === id);
    if (!m) return;

    document.getElementById('smEditId').value = id;
    document.getElementById('smFirstName').value = m.firstName || '';
    document.getElementById('smLastName').value = m.lastName || '';
    document.getElementById('smCin').value = m.cin || '';
    document.getElementById('smEmail').value = m.email || '';
    document.getElementById('smPhone').value = m.phone || '';
    document.getElementById('smBirthDate').value = m.birthDate || '';
    document.getElementById('smAddress').value = m.address || '';
    document.getElementById('smPlan').value = m.plan || '';
    document.getElementById('smSeason').value = m.season || 'Saison 2025-2026';
    document.getElementById('smPaidAmount').value = m.paidAmount || 0;
    document.getElementById('smStatus').value = m.status || 'active';

    document.getElementById('smSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Mettre í  jour';
    document.getElementById('smCancelEdit').style.display = '';
    document.getElementById('smCinStatus').style.display = 'none';

    document.getElementById('socialMemberForm').scrollIntoView({ behavior: 'smooth' });
}

function cancelMemberEdit() {
    document.getElementById('socialMemberForm').reset();
    document.getElementById('smEditId').value = '';
    document.getElementById('smSeason').value = 'Saison 2025-2026';
    document.getElementById('smSubmitBtn').innerHTML = '<i class="fas fa-save"></i> Ajouter le membre';
    document.getElementById('smCancelEdit').style.display = 'none';
    document.getElementById('smCinStatus').style.display = 'none';
}

async function deleteSocialMember(id) {
    if (!confirm('Supprimer ce membre ?')) return;
    try {
        await apiDelete(`social-members/${id}`);
        refreshSocialMembersTable();
        loadMemberStats();
        showToast('Membre supprimé', 'error');
    } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== MEETINGS =====
function setupMeetingForm() {
    const form = document.getElementById('meetingForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost('meetings', {
                date: document.getElementById('meetingDate').value.trim(),
                home: document.getElementById('meetingHome').value.trim(),
                away: document.getElementById('meetingAway').value.trim(),
                score: document.getElementById('meetingScore').value.trim(),
                result: document.getElementById('meetingResult').value
            });
            form.reset();
            refreshMeetingsTable();
            showToast('Confrontation ajoutée !');
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

async function refreshMeetingsTable() {
    const tbody = document.getElementById('meetingsTableBody');
    if (!tbody) return;
    try {
        const meetings = await apiGet('meetings');
        const resultLabels = { win:'âœ… Victoire', draw:'ðŸŸ¡ Nul', loss:'âŒ Défaite' };
        if (meetings.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Aucune confrontation</td></tr>';
            return;
        }
        tbody.innerHTML = meetings.map(m => `<tr>
            <td>${escapeHtml(m.date)}</td>
            <td>${escapeHtml(m.home)} vs ${escapeHtml(m.away)}</td>
            <td><strong>${escapeHtml(m.score)}</strong></td>
            <td>${resultLabels[m.result] || m.result}</td>
            <td><div class="action-btns"><button class="btn-icon delete" onclick="deleteMeeting('${m.id || m._id}')" title="Supprimer"><i class="fas fa-trash"></i></button></div></td>
        </tr>`).join('');
    } catch(err) { console.error('refreshMeetingsTable:', err); }
}

async function deleteMeeting(id) {
    if (!confirm('Supprimer cette confrontation ?')) return;
    try { await apiDelete(`meetings/${id}`); refreshMeetingsTable(); showToast('Confrontation supprimée', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== LINEUP =====
function setupLineupForm() {
    const form = document.getElementById('lineupForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        function parseLine(val) {
            return val.split(',').map(p => {
                p = p.trim();
                const parts = p.split(':');
                return { number: parseInt(parts[0]) || 0, name: parts[1] ? parts[1].trim() : p };
            });
        }
        const formation = [
            parseLine(document.getElementById('lineupGK').value),
            parseLine(document.getElementById('lineupDEF').value),
            parseLine(document.getElementById('lineupMID').value),
            parseLine(document.getElementById('lineupATK').value)
        ];
        try {
            await apiPut('lineup', { formation });
            refreshLineupPreview();
            showToast('Composition enregistrée !');
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

async function refreshLineupPreview() {
    const preview = document.getElementById('lineupPreview');
    if (!preview) return;
    try {
        const lineup = await apiGet('lineup');
        if (!lineup || !lineup.length) {
            preview.innerHTML = '<p style="color:#999;text-align:center;">Aucune composition enregistrée</p>';
            return;
        }
        const rowLabels = ['ðŸ§¤ Gardien', 'ðŸ›¡ï¸ Défenseurs', 'ðŸƒ Milieux', 'âš½ Attaquants'];
        preview.innerHTML = lineup.map((row, i) => {
            if (!Array.isArray(row)) return '';
            return `<div style="margin-bottom:10px;"><strong>${rowLabels[i] || ''}</strong>: ${row.map(p => `<span style="background:#f0f0f0;padding:3px 8px;border-radius:4px;margin-right:5px;">${p.number} ${escapeHtml(p.name)}</span>`).join('')}</div>`;
        }).join('');
    } catch(err) { console.error('refreshLineupPreview:', err); }
}

// ===== DONORS =====
function setupDonorForm() {
    const form = document.getElementById('donorForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            await apiPost('donors', {
                name: document.getElementById('donorName').value.trim(),
                amount: document.getElementById('donorAmount').value.trim()
            });
            form.reset();
            refreshDonorsTable();
            showToast('Donateur ajouté !');
        } catch(err) { showToast('Erreur: ' + err.message, 'error'); }
    });
}

async function refreshDonorsTable() {
    const tbody = document.getElementById('donorsTableBody');
    if (!tbody) return;
    try {
        const donors = await apiGet('donors');
        if (donors.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;padding:30px;">Aucun donateur</td></tr>';
            return;
        }
        tbody.innerHTML = donors.map(d => `<tr>
            <td><strong>${escapeHtml(d.name)}</strong></td>
            <td>${escapeHtml(d.amount)}</td>
            <td><div class="action-btns"><button class="btn-icon delete" onclick="deleteDonor('${d.id || d._id}')" title="Supprimer"><i class="fas fa-trash"></i></button></div></td>
        </tr>`).join('');
    } catch(err) { console.error('refreshDonorsTable:', err); }
}

async function deleteDonor(id) {
    if (!confirm('Supprimer ce donateur ?')) return;
    try { await apiDelete(`donors/${id}`); refreshDonorsTable(); showToast('Donateur supprimé', 'error'); }
    catch(err) { showToast('Erreur: ' + err.message, 'error'); }
}

// ===== SEED FROM API =====
async function loadDemoData() {
    if (!confirm('Recharger les données de démonstration depuis le serveur ? Cela supprimera les données actuelles.')) return;
    try {
        const res = await fetch('/api/auth/check', { headers: getAuthHeaders() });
        const data = await res.json();
        if (!data.authenticated) { showLoginModal(); return; }
        showToast('Exécutez "node server/seed.js" sur le serveur pour recharger les données de démo.', 'error');
    } catch { showToast('Erreur de connexion', 'error'); }
}

// ===============================================
// SITE SETTINGS
// ===============================================

function switchSettingsTab(tab) {
    document.querySelectorAll('.settings-tab-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.settings-tab').forEach(el => el.classList.remove('active'));
    const panel = document.getElementById('stab-' + tab);
    if (panel) panel.style.display = 'block';
    const btn = document.querySelector(`.settings-tab[data-stab="${tab}"]`);
    if (btn) btn.classList.add('active');
}

async function loadSettings() {
    try {
        const s = await apiGet('settings');
        // General
        if (s.clubName) document.getElementById('setClubName').value = s.clubName;
        if (s.clubSlogan) document.getElementById('setClubSlogan').value = s.clubSlogan;
        if (s.heroTitle) document.getElementById('setHeroTitle').value = s.heroTitle;
        if (s.heroSubtitle) document.getElementById('setHeroSubtitle').value = s.heroSubtitle;
        if (s.logoUrl) document.getElementById('setLogoPreview').src = s.logoUrl;
        if (s.faviconUrl) document.getElementById('setFaviconPreview').src = s.faviconUrl;
        if (s.announcementBar) document.getElementById('setAnnouncementBar').checked = s.announcementBar;
        if (s.announcementText) document.getElementById('setAnnouncementText').value = s.announcementText;
        // Appearance
        if (s.primaryColor) { document.getElementById('setPrimaryColor').value = s.primaryColor; document.getElementById('setPrimaryColorHex').value = s.primaryColor; }
        if (s.accentColor) { document.getElementById('setAccentColor').value = s.accentColor; document.getElementById('setAccentColorHex').value = s.accentColor; }
        if (s.bgColor) { document.getElementById('setBgColor').value = s.bgColor; document.getElementById('setBgColorHex').value = s.bgColor; }
        if (s.textColor) { document.getElementById('setTextColor').value = s.textColor; document.getElementById('setTextColorHex').value = s.textColor; }
        if (s.headerBg) { document.getElementById('setHeaderBg').value = s.headerBg; document.getElementById('setHeaderBgHex').value = s.headerBg; }
        if (s.fontHeading) document.getElementById('setFontHeading').value = s.fontHeading;
        if (s.fontBody) document.getElementById('setFontBody').value = s.fontBody;
        // Social
        if (s.socialFacebook) document.getElementById('setSocialFacebook').value = s.socialFacebook;
        if (s.socialInstagram) document.getElementById('setSocialInstagram').value = s.socialInstagram;
        if (s.socialTwitter) document.getElementById('setSocialTwitter').value = s.socialTwitter;
        if (s.socialYoutube) document.getElementById('setSocialYoutube').value = s.socialYoutube;
        if (s.socialTiktok) document.getElementById('setSocialTiktok').value = s.socialTiktok;
        // Contact
        if (s.contactEmail) document.getElementById('setContactEmail').value = s.contactEmail;
        if (s.contactPhone) document.getElementById('setContactPhone').value = s.contactPhone;
        if (s.contactAddress) document.getElementById('setContactAddress').value = s.contactAddress;
        if (s.footerText) document.getElementById('setFooterText').value = s.footerText;
        // Advanced
        if (s.maintenanceMode) document.getElementById('setMaintenanceMode').checked = s.maintenanceMode;
        // Update color preview
        updateColorPreview();
    } catch (e) { console.log('Settings not loaded yet', e); }
}

function updateColorPreview() {
    const primary = document.getElementById('setPrimaryColor').value;
    const accent = document.getElementById('setAccentColor').value;
    const bg = document.getElementById('setBgColor').value;
    const text = document.getElementById('setTextColor').value;
    const header = document.getElementById('setHeaderBg').value;
    // Sync hex inputs
    document.getElementById('setPrimaryColorHex').value = primary;
    document.getElementById('setAccentColorHex').value = accent;
    document.getElementById('setBgColorHex').value = bg;
    document.getElementById('setTextColorHex').value = text;
    document.getElementById('setHeaderBgHex').value = header;
    // Update preview box
    const ph = document.getElementById('colorPreviewHeader');
    const pb = document.getElementById('colorPreviewBody');
    const pt = document.getElementById('colorPreviewText');
    const pbtn = document.getElementById('colorPreviewBtn');
    if (ph) ph.style.background = header;
    if (pb) pb.style.background = bg;
    if (pt) pt.style.color = text;
    if (pbtn) pbtn.style.background = accent;
}

// Attach live preview to color inputs
['setPrimaryColor', 'setAccentColor', 'setBgColor', 'setTextColor', 'setHeaderBg'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateColorPreview);
});

async function saveAllSettings() {
    const settings = {
        clubName: document.getElementById('setClubName').value.trim(),
        clubSlogan: document.getElementById('setClubSlogan').value.trim(),
        heroTitle: document.getElementById('setHeroTitle').value.trim(),
        heroSubtitle: document.getElementById('setHeroSubtitle').value.trim(),
        announcementBar: document.getElementById('setAnnouncementBar').checked,
        announcementText: document.getElementById('setAnnouncementText').value.trim(),
        primaryColor: document.getElementById('setPrimaryColor').value,
        accentColor: document.getElementById('setAccentColor').value,
        bgColor: document.getElementById('setBgColor').value,
        textColor: document.getElementById('setTextColor').value,
        headerBg: document.getElementById('setHeaderBg').value,
        fontHeading: document.getElementById('setFontHeading').value,
        fontBody: document.getElementById('setFontBody').value,
        socialFacebook: document.getElementById('setSocialFacebook').value.trim(),
        socialInstagram: document.getElementById('setSocialInstagram').value.trim(),
        socialTwitter: document.getElementById('setSocialTwitter').value.trim(),
        socialYoutube: document.getElementById('setSocialYoutube').value.trim(),
        socialTiktok: document.getElementById('setSocialTiktok').value.trim(),
        contactEmail: document.getElementById('setContactEmail').value.trim(),
        contactPhone: document.getElementById('setContactPhone').value.trim(),
        contactAddress: document.getElementById('setContactAddress').value.trim(),
        footerText: document.getElementById('setFooterText').value.trim(),
        maintenanceMode: document.getElementById('setMaintenanceMode').checked
    };
    try {
        await apiPut('settings', settings);
        document.getElementById('settingsSaveStatus').innerHTML = '<span style="color:#27ae60;"><i class="fas fa-check"></i> Paramètres enregistrés !</span>';
        showToast('Paramètres sauvegardés avec succès !');
        setTimeout(() => { document.getElementById('settingsSaveStatus').innerHTML = ''; }, 3000);
    } catch (e) {
        showToast('Erreur: ' + e.message, 'error');
    }
}

async function uploadSettingsLogo(event) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
        const res = await fetch(`${API_BASE}/settings/upload-logo`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') },
            body: formData
        });
        const data = await res.json();
        if (data.url) {
            document.getElementById('setLogoPreview').src = data.url + '?t=' + Date.now();
            showToast('Logo mis à jour !');
        }
    } catch (e) { showToast('Erreur upload: ' + e.message, 'error'); }
}

async function uploadSettingsFavicon(event) {
    const file = event.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('favicon', file);
    try {
        const res = await fetch(`${API_BASE}/settings/upload-favicon`, {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') },
            body: formData
        });
        const data = await res.json();
        if (data.url) {
            document.getElementById('setFaviconPreview').src = data.url + '?t=' + Date.now();
            showToast('Favicon mis à jour !');
        }
    } catch (e) { showToast('Erreur upload: ' + e.message, 'error'); }
}

function resetColors() {
    const defaults = { setPrimaryColor: '#1a1a1a', setAccentColor: '#000000', setBgColor: '#f5f5f5', setTextColor: '#1a1a1a', setHeaderBg: '#1a1a1a' };
    Object.entries(defaults).forEach(([id, val]) => {
        document.getElementById(id).value = val;
        document.getElementById(id + 'Hex').value = val;
    });
    updateColorPreview();
    showToast('Couleurs réinitialisées');
}

async function changeAdminPassword() {
    const pw = document.getElementById('setNewPassword').value.trim();
    if (!pw || pw.length < 6) { showToast('Le mot de passe doit contenir au moins 6 caractères', 'error'); return; }
    try {
        await apiPut('auth/change-password', { password: pw });
        document.getElementById('setNewPassword').value = '';
        showToast('Mot de passe changé avec succès !');
    } catch (e) { showToast('Erreur: ' + e.message, 'error'); }
}

// ===== TOAST =====
function showToast(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:10px;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = `padding:14px 24px;border-radius:8px;color:#fff;font-size:14px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.3);opacity:0;transform:translateX(40px);transition:all 0.4s ease;background:${type === 'error' ? '#e74c3c' : '#27ae60'};`;
    toast.textContent = message;
    container.appendChild(toast);
    requestAnimationFrame(() => { toast.style.opacity = '1'; toast.style.transform = 'translateX(0)'; });
    setTimeout(() => {
        toast.style.opacity = '0'; toast.style.transform = 'translateX(40px)';
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ===== ESCAPE HTML =====
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== LOGOUT =====
function logout() {
    localStorage.removeItem('cssfaxien_token');
    showLoginModal();
    showToast('Déconnexion réussie');
}

// ===== NOTIFICATIONS =====
let notifData = [];

async function loadNotifCount() {
    try {
        const data = await apiGet('notifications/unread-count');
        const badge = document.getElementById('notifBadge');
        if (badge) {
            if (data.count > 0) {
                badge.textContent = data.count > 99 ? '99+' : data.count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (e) { /* silently fail */ }
}

async function loadNotifications() {
    try {
        notifData = await apiGet('notifications');
        renderNotifications();
        renderNotifDropdown();
        const countEl = document.getElementById('notifCount');
        if (countEl) countEl.textContent = notifData.length;
        loadNotifCount();
    } catch (e) { showToast('Erreur chargement notifications', 'error'); }
}

function renderNotifications() {
    const list = document.getElementById('notifList');
    if (!list) return;

    if (!notifData.length) {
        list.innerHTML = '<p style="color:#666;text-align:center;padding:30px;">Aucune notification</p>';
        return;
    }

    list.innerHTML = notifData.map(n => {
        const icon = n.type === 'ticket' ? 'fa-ticket-alt' : n.type === 'donation' ? 'fa-hand-holding-heart' : n.type === 'subscription' ? 'fa-id-card' : 'fa-shopping-cart';
        const typeLabel = n.type === 'ticket' ? 'Billet' : n.type === 'donation' ? 'Don' : n.type === 'subscription' ? 'Abonnement' : 'Commande';
        const date = new Date(n.createdAt).toLocaleString('fr-FR');
        return `
            <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead('${n.id}')">
                <div class="notif-item-row">
                    <div class="notif-icon ${n.type}"><i class="fas ${icon}"></i></div>
                    <div class="notif-item-content">
                        <div class="notif-item-title">${escapeHtml(n.title)}</div>
                        <div class="notif-item-msg">${escapeHtml(n.message)}</div>
                        <div style="display:flex;gap:10px;align-items:center;margin-top:6px;">
                            <span class="type-badge ${n.type}">${typeLabel}</span>
                            <span style="color:#e74c3c;font-weight:700;font-size:13px;">${n.amount ? n.amount + ' TND' : ''}</span>
                            <span style="color:#666;font-size:11px;">${n.reference || ''}</span>
                        </div>
                        <div class="notif-item-time"><i class="far fa-clock"></i> ${date}</div>
                    </div>
                    <button onclick="event.stopPropagation();deleteNotif('${n.id}')" style="background:none;border:none;color:#666;cursor:pointer;padding:4px;" title="Supprimer">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderNotifDropdown() {
    const body = document.getElementById('notifDropdownBody');
    if (!body) return;

    const recent = notifData.slice(0, 8);
    if (!recent.length) {
        body.innerHTML = '<p style="color:#666;text-align:center;padding:30px;">Aucune notification</p>';
        return;
    }

    body.innerHTML = recent.map(n => {
        const icon = n.type === 'ticket' ? 'fa-ticket-alt' : n.type === 'donation' ? 'fa-hand-holding-heart' : n.type === 'subscription' ? 'fa-id-card' : 'fa-shopping-cart';
        const ago = timeAgo(n.createdAt);
        return `
            <div class="notif-item ${n.read ? '' : 'unread'}" onclick="markNotifRead('${n.id}')">
                <div class="notif-item-row">
                    <div class="notif-icon ${n.type}"><i class="fas ${icon}"></i></div>
                    <div class="notif-item-content">
                        <div class="notif-item-title">${escapeHtml(n.title)}</div>
                        <div class="notif-item-msg">${escapeHtml(n.message)}</div>
                        <div class="notif-item-time">${ago}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'À l\'instant';
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `Il y a ${days}j`;
}

function toggleNotifPanel() {
    const dropdown = document.getElementById('notifDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
        if (dropdown.classList.contains('active')) {
            loadNotifications();
        }
    }
}

// Close dropdown when clicking outside
document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notifDropdown');
    const bell = document.getElementById('notifBell');
    if (dropdown && dropdown.classList.contains('active') && !dropdown.contains(e.target) && !bell.contains(e.target)) {
        dropdown.classList.remove('active');
    }
});

async function markNotifRead(id) {
    try {
        await apiPut('notifications/' + id + '/read', {});
        loadNotifications();
    } catch (e) { /* ignore */ }
}

async function markAllRead() {
    try {
        await apiPut('notifications/read-all', {});
        loadNotifications();
        showToast('Toutes les notifications marquées comme lues');
    } catch (e) { showToast('Erreur', 'error'); }
}

async function markAllReadDropdown() {
    await markAllRead();
}

async function deleteNotif(id) {
    try {
        await apiDelete('notifications/' + id);
        loadNotifications();
    } catch (e) { showToast('Erreur suppression', 'error'); }
}

// ===== MEMBER ACTIVITY =====
let activityData = [];
let activityFilter = 'all';

async function loadActivity() {
    try {
        const [orders, stats] = await Promise.all([
            apiGet('admin/activity'),
            apiGet('admin/activity/stats')
        ]);
        activityData = orders;
        renderActivityStats(stats);
        renderActivityTable();
    } catch (e) { showToast('Erreur chargement activité', 'error'); }
}

function renderActivityStats(stats) {
    const el = document.getElementById('activityStats');
    if (!el) return;
    el.innerHTML = `
        <div class="activity-stat-card">
            <div class="stat-icon revenue"><i class="fas fa-coins"></i></div>
            <div class="stat-value">${stats.totalRevenue || 0} <small style="font-size:14px;">TND</small></div>
            <div class="stat-label">Revenu Total</div>
        </div>
        <div class="activity-stat-card">
            <div class="stat-icon tickets"><i class="fas fa-ticket-alt"></i></div>
            <div class="stat-value">${stats.tickets ? stats.tickets.count : 0}</div>
            <div class="stat-label">Billets vendus (${stats.tickets ? stats.tickets.revenue : 0} TND)</div>
        </div>
        <div class="activity-stat-card">
            <div class="stat-icon donations"><i class="fas fa-hand-holding-heart"></i></div>
            <div class="stat-value">${stats.donations ? stats.donations.count : 0}</div>
            <div class="stat-label">Dons reçus (${stats.donations ? stats.donations.revenue : 0} TND)</div>
        </div>
        <div class="activity-stat-card">
            <div class="stat-icon subs"><i class="fas fa-id-card"></i></div>
            <div class="stat-value">${stats.subscriptions ? stats.subscriptions.count : 0}</div>
            <div class="stat-label">Abonnements (${stats.subscriptions ? stats.subscriptions.revenue : 0} TND)</div>
        </div>
        <div class="activity-stat-card">
            <div class="stat-icon products"><i class="fas fa-shopping-cart"></i></div>
            <div class="stat-value">${stats.products ? stats.products.count : 0}</div>
            <div class="stat-label">Achats boutique (${stats.products ? stats.products.revenue : 0} TND)</div>
        </div>
    `;
}

function renderActivityTable() {
    const tbody = document.getElementById('activityTableBody');
    if (!tbody) return;

    let filtered = activityData;
    if (activityFilter !== 'all') {
        filtered = activityData.filter(o => o.items && o.items.some(i => i.type === activityFilter));
    }

    if (!filtered.length) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#666;padding:30px;">Aucune transaction</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(o => {
        const date = new Date(o.createdAt).toLocaleString('fr-FR');
        const mainItem = o.items && o.items[0] ? o.items[0] : {};
        const type = mainItem.type || 'product';
        const typeLabel = type === 'ticket' ? 'Billet' : type === 'donation' ? 'Don' : type === 'subscription' ? 'Abonnement' : 'Boutique';
        const clientName = o.shipping ? o.shipping.fullName : (o.user ? 'Membre' : 'â€”');
        const details = mainItem.label || 'â€”';
        const statusClass = o.status || 'pending';
        const statusLabel = o.status === 'confirmed' ? 'Confirmé' : o.status === 'shipped' ? 'Expédié' : o.status === 'delivered' ? 'Livré' : o.status === 'cancelled' ? 'Annulé' : 'En attente';

        return `
            <tr>
                <td style="white-space:nowrap;font-size:12px;">${date}</td>
                <td><span class="type-badge ${type}">${typeLabel}</span></td>
                <td>${escapeHtml(clientName)}</td>
                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(details)}">${escapeHtml(details)}</td>
                <td style="font-weight:700;color:#e74c3c;">${o.total || 0} TND</td>
                <td style="font-size:12px;color:#999;">${o.reference || 'â€”'}</td>
                <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            </tr>
        `;
    }).join('');
}

function filterActivity(type) {
    activityFilter = type;
    document.querySelectorAll('.activity-filter').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === type);
    });
    renderActivityTable();
}

// ===== Auto-load notifications on panel switch =====
const origNavClick = document.querySelectorAll('.admin-nav-link');
origNavClick.forEach(btn => {
    btn.addEventListener('click', () => {
        const panel = btn.dataset.panel;
        if (panel === 'notifications') loadNotifications();
        if (panel === 'activity') loadActivity();
        if (panel === 'live') loadLivePanel();
        if (panel === 'push') loadPushPanel();
        if (panel === 'newsletter') loadNewsletterPanel();
    });
});

// ===== Poll notifications every 30s =====
setInterval(loadNotifCount, 30000);

// ===== Initial load =====
setTimeout(loadNotifCount, 1000);

// ===============================================
// LIVE MATCH MANAGEMENT
// ===============================================
let currentLiveId = null;

document.getElementById('liveMatchForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const body = {
            homeTeam: document.getElementById('liveHome').value,
            awayTeam: document.getElementById('liveAway').value,
            competition: document.getElementById('liveComp').value,
            venue: document.getElementById('liveVenue').value,
            date: document.getElementById('liveDate').value,
            time: document.getElementById('liveTime').value
        };
        const data = await apiPost('live', body);
        currentLiveId = data.id || data._id;
        showToast('Match live créé !', 'success');
        loadLivePanel();
    } catch (err) { showToast('Erreur: ' + err.message, 'error'); }
});

async function loadLivePanel() {
    try {
        const all = await apiGet('live-all');
        const active = all.find(m => !['finished'].includes(m.status));
        if (active) {
            currentLiveId = active.id || active._id;
            document.getElementById('liveControlPanel').style.display = 'block';
            document.getElementById('liveMatchInfo').innerHTML = `
                <div style="display:flex;align-items:center;gap:20px;color:#fff;font-size:1.2rem;">
                    <strong>${active.homeTeam}</strong>
                    <span style="font-size:1.8rem;font-weight:900;">${active.homeScore || 0} - ${active.awayScore || 0}</span>
                    <strong>${active.awayTeam}</strong>
                    <span style="background:${active.status === 'not_started' ? '#2c3e50' : '#e74c3c'};padding:4px 12px;border-radius:8px;font-size:0.8rem;">${active.status}</span>
                </div>`;
            document.getElementById('liveCtrlMinute').value = active.minute || 0;
            document.getElementById('liveCtrlHomeScore').value = active.homeScore || 0;
            document.getElementById('liveCtrlAwayScore').value = active.awayScore || 0;
        } else {
            document.getElementById('liveControlPanel').style.display = 'none';
        }
    } catch (err) {}
}

async function liveAction(action) {
    if (!currentLiveId) return showToast('Aucun match live actif', 'error');
    try {
        if (action === 'start') {
            await apiPost(`live/${currentLiveId}/start`, {});
            showToast('Coup d\'envoi ! Push envoyé aux abonnés', 'success');
        } else {
            await apiPut(`live/${currentLiveId}`, { status: action });
            showToast('Statut mis í  jour: ' + action, 'success');
        }
        loadLivePanel();
    } catch (err) { showToast('Erreur', 'error'); }
}

async function updateLiveScore() {
    if (!currentLiveId) return;
    try {
        await apiPut(`live/${currentLiveId}`, {
            minute: parseInt(document.getElementById('liveCtrlMinute').value) || 0,
            homeScore: parseInt(document.getElementById('liveCtrlHomeScore').value) || 0,
            awayScore: parseInt(document.getElementById('liveCtrlAwayScore').value) || 0
        });
        showToast('Score et minute mis í  jour', 'success');
        loadLivePanel();
    } catch (err) { showToast('Erreur', 'error'); }
}

async function addLiveEvent() {
    if (!currentLiveId) return;
    try {
        await apiPost(`live/${currentLiveId}/event`, {
            type: document.getElementById('liveEvType').value,
            player: document.getElementById('liveEvPlayer').value,
            team: document.getElementById('liveEvTeam').value,
            minute: parseInt(document.getElementById('liveEvMinute').value) || 0,
            assist: document.getElementById('liveEvAssist').value
        });
        showToast('Événement ajouté ! Push envoyé pour les buts', 'success');
        document.getElementById('liveEvPlayer').value = '';
        document.getElementById('liveEvAssist').value = '';
        loadLivePanel();
    } catch (err) { showToast('Erreur', 'error'); }
}

async function addLiveComment() {
    if (!currentLiveId) return;
    try {
        await apiPost(`live/${currentLiveId}/comment`, {
            minute: parseInt(document.getElementById('liveCmtMinute').value) || 0,
            type: document.getElementById('liveCmtType').value,
            text: document.getElementById('liveCmtText').value
        });
        showToast('Commentaire ajouté', 'success');
        document.getElementById('liveCmtText').value = '';
    } catch (err) { showToast('Erreur', 'error'); }
}

async function updateLiveStats() {
    if (!currentLiveId) return;
    try {
        await apiPut(`live/${currentLiveId}`, {
            stats: {
                homePossession: parseInt(document.getElementById('liveStatHomePoss').value) || 50,
                awayPossession: parseInt(document.getElementById('liveStatAwayPoss').value) || 50,
                homeShots: parseInt(document.getElementById('liveStatHomeShots').value) || 0,
                awayShots: parseInt(document.getElementById('liveStatAwayShots').value) || 0,
                homeCorners: parseInt(document.getElementById('liveStatHomeCorners').value) || 0,
                awayCorners: parseInt(document.getElementById('liveStatAwayCorners').value) || 0
            }
        });
        showToast('Stats mises í  jour', 'success');
    } catch (err) { showToast('Erreur', 'error'); }
}

// ===============================================
// PUSH NOTIFICATIONS MANAGEMENT
// ===============================================

async function loadPushPanel() {
    try {
        // We don't have a specific count API for push subs, but we can show the form
        document.getElementById('pushSubCount').innerHTML = '<i class="fas fa-users"></i> Les notifications seront envoyées í  tous les abonnés push actifs.';
    } catch(e) {}
}

document.getElementById('pushForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const result = document.getElementById('pushResult');
    try {
        const data = await apiPost('push/send', {
            title: document.getElementById('pushTitle').value,
            body: document.getElementById('pushBody').value,
            category: document.getElementById('pushCategory').value,
            url: document.getElementById('pushUrl').value
        });
        result.innerHTML = `<span style="color:#2ecc71;">âœ“ Envoyé í  ${data.sent} abonné(s). ${data.failed} échec(s).</span>`;
        document.getElementById('pushBody').value = '';
    } catch (err) {
        result.innerHTML = `<span style="color:#e74c3c;">✗ Erreur: ${err.message}</span>`;
    }
});

// ===============================================
// NEWSLETTER MANAGEMENT
// ===============================================

async function loadNewsletterPanel() {
    try {
        const stats = await apiGet('newsletter/stats');
        document.getElementById('nlAdminStats').innerHTML = `
            <div style="background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:12px;padding:20px;text-align:center;flex:1;">
                <div style="font-size:2rem;font-weight:900;color:#e74c3c;">${stats.total || 0}</div>
                <div style="color:rgba(255,255,255,0.6);font-size:0.85rem;">Abonnés actifs</div>
            </div>
            <div style="background:rgba(46,204,113,0.1);border:1px solid rgba(46,204,113,0.3);border-radius:12px;padding:20px;text-align:center;flex:1;">
                <div style="font-size:2rem;font-weight:900;color:#2ecc71;">${stats.thisMonth || 0}</div>
                <div style="color:rgba(255,255,255,0.6);font-size:0.85rem;">Ce mois</div>
            </div>`;

        const subs = await apiGet('newsletter/subscribers');
        const tbody = document.querySelector('#nlSubscribersTable tbody');
        if (tbody) {
            tbody.innerHTML = subs.map(s => `<tr>
                <td>${s.email}</td>
                <td>${s.firstName || 'â€”'}</td>
                <td>${s.subscribedAt ? new Date(s.subscribedAt).toLocaleDateString('fr-FR') : 'â€”'}</td>
                <td>${(s.categories || []).join(', ')}</td>
            </tr>`).join('') || '<tr><td colspan="4">Aucun abonné</td></tr>';
        }
    } catch (err) { console.error('Newsletter load error:', err); }
}

// ===================================================================
// ==================== POSTER DESIGNER ENGINE V2 ====================
// ===== Professional Quality - CSS Digital Media Style ==============
// ===================================================================

let posterCurrentTemplate = 'match-day';
let posterBgImageObj = null;
let posterLineupPhotoObj = null;
let posterPlayerPhotoObj = null;
let posterSavedList = [];
let posterMatchesCache = [];
let posterPlayersCache = [];
let posterStandingsCache = [];

// --- Template switching ---
document.querySelectorAll('.poster-template-card[data-template]').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.poster-template-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        posterCurrentTemplate = card.dataset.template;
        document.querySelectorAll('.poster-ctrl-group').forEach(g => g.style.display = 'none');
        const ctrlId = 'ctrl-' + posterCurrentTemplate;
        const ctrl = document.getElementById(ctrlId);
        if (ctrl) ctrl.style.display = 'block';
        renderPoster();
    });
});

// --- File inputs ---
function setupPosterFileInput(inputId, callback) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.addEventListener('change', function() {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => { callback(img); renderPoster(); };
            img.src = e.target.result;
            const zone = this.closest('.file-upload-zone');
            if (zone) {
                zone.classList.add('has-file');
                const oldPrev = zone.querySelector('.upload-preview');
                if (oldPrev) oldPrev.remove();
                zone.insertAdjacentHTML('beforeend', `<img class="upload-preview" src="${e.target.result}">`);
            }
        };
        reader.readAsDataURL(file);
    });
}
setupPosterFileInput('posterBgImage', (img) => { posterBgImageObj = img; });
setupPosterFileInput('posterLineupPhoto', (img) => { posterLineupPhotoObj = img; });
setupPosterFileInput('posterPlayerPhoto', (img) => { posterPlayerPhotoObj = img; });

// --- Reactive controls ---
['posterCompetition','posterSeason','posterDate','posterTime','posterVenue','posterAwayAbbr',
 'posterHomeScore','posterAwayScore','posterScorers','posterResultForce',
 'posterPlayerTitle','posterPlayerStat1','posterPlayerStat2','posterPlayerRating',
 'posterLineupPlayers','posterLineupSubs',
 'posterSubsText','posterStandingTitle',
 'posterTicketOpponent','posterTicketDate','posterTicketTime','posterTicketVenue',
 'posterTicketGradins','posterTicketChaises1','posterTicketChaises2','posterTicketCentrale',
 'posterCancelReason',
 'posterEventTitle','posterEventSubtitle','posterEventType',
 'posterFormat','posterTheme','posterShowSocials','posterShowWatermark'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.addEventListener('input', () => renderPoster()); el.addEventListener('change', () => renderPoster()); }
});

// --- Load data ---
async function loadPosterData() {
    try {
        posterMatchesCache = await apiGet('matches');
        const fixtureData = await apiGet('fixtures');
        posterMatchesCache = [...posterMatchesCache, ...fixtureData.map(f => ({...f, _isFixture: true}))];
    } catch(e) {}
    try { posterPlayersCache = await apiGet('players'); } catch(e) {}
    try { posterStandingsCache = await apiGet('standings'); } catch(e) {}

    const matchOpts = posterMatchesCache.map((m, i) =>
        `<option value="${i}">${m.homeTeam || '?'} vs ${m.awayTeam || '?'} ${m.date ? '('+m.date+')' : ''}</option>`
    ).join('');
    ['posterMatchSelect','posterScoreMatchSelect','posterLineupMatchSelect','posterSubsMatchSelect','posterCancelledMatchSelect'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) sel.innerHTML = '<option value="">-- Charger un match --</option>' + matchOpts;
    });

    const playerOpts = posterPlayersCache
        .filter(p => !['coach','staff'].includes(p.category))
        .map((p, i) => `<option value="${i}">${p.number ? '#'+p.number+' ' : ''}${p.name}</option>`).join('');
    const playerSel = document.getElementById('posterPlayerSelect');
    if (playerSel) playerSel.innerHTML = '<option value="">-- Choisir un joueur --</option>' + playerOpts;
}

// --- Match select auto-fill ---
['posterMatchSelect','posterScoreMatchSelect','posterLineupMatchSelect','posterSubsMatchSelect','posterCancelledMatchSelect'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', function() {
        const idx = parseInt(this.value); if (isNaN(idx)) return;
        const m = posterMatchesCache[idx]; if (!m) return;
        if (id === 'posterMatchSelect') {
            document.getElementById('posterCompetition').value = m.competition || '';
            document.getElementById('posterDate').value = m.date || '';
            document.getElementById('posterTime').value = m.time || '';
            document.getElementById('posterVenue').value = m.venue || '';
            document.getElementById('posterAwayAbbr').value = m.awayTeam || '';
        } else if (id === 'posterScoreMatchSelect') {
            document.getElementById('posterHomeScore').value = m.homeScore || 0;
            document.getElementById('posterAwayScore').value = m.awayScore || 0;
            const scorers = (m.events || []).filter(e => e.type === 'goal' || e.type === 'pen')
                .map(e => `${e.minute}' ${e.player}`).join('\n');
            document.getElementById('posterScorers').value = scorers;
        } else if (id === 'posterLineupMatchSelect') {
            const lineup = (m.homeLineup || []).map(p => `${p.number || ''} - ${p.name}`).join('\n');
            document.getElementById('posterLineupPlayers').value = lineup;
            const subs = (m.homeSubs || []).map(p => p.name).join(' - ');
            document.getElementById('posterLineupSubs').value = subs;
        } else if (id === 'posterSubsMatchSelect') {
            const subs = (m.events || []).filter(e => e.type === 'sub')
                .map(e => `${e.minute}' ${e.player} â†’ ${e.detail || '?'}`).join('\n');
            document.getElementById('posterSubsText').value = subs;
        }
        renderPoster();
    });
});

document.getElementById('posterPlayerSelect')?.addEventListener('change', function() {
    const idx = parseInt(this.value); if (isNaN(idx)) return;
    const pl = posterPlayersCache.filter(p => !['coach','staff'].includes(p.category))[idx];
    if (pl) document.getElementById('posterPlayerRating').value = pl.rating || '';
    renderPoster();
});

async function loadStandingData() {
    try { posterStandingsCache = await apiGet('standings'); renderPoster(); showToast('Classement chargé !'); }
    catch(e) { showToast('Erreur chargement classement', 'error'); }
}

// ===================================================================
// PROFESSIONAL CANVAS RENDERING ENGINE V2
// ===================================================================

const POSTER_SIZES = {
    square: { w: 1080, h: 1080 },
    story: { w: 1080, h: 1920 },
    landscape: { w: 1200, h: 630 }
};

const POSTER_THEMES = {
    'dark-gold': { bg: '#0a0a0a', bg2: '#141414', text: '#ffffff', accent: '#d4a017', accent2: '#b8860b', sub: '#888888', gradStart: '#000000', gradEnd: '#1a1507' },
    dark: { bg: '#0a0a0a', bg2: '#1a1a1a', text: '#ffffff', accent: '#e74c3c', accent2: '#c0392b', sub: '#888888', gradStart: '#000000', gradEnd: '#1a0505' },
    light: { bg: '#f5f5f5', bg2: '#ffffff', text: '#1a1a1a', accent: '#e74c3c', accent2: '#c0392b', sub: '#666666', gradStart: '#ffffff', gradEnd: '#f0f0f0' },
    red: { bg: '#7b0000', bg2: '#a50000', text: '#ffffff', accent: '#ffcc00', accent2: '#d4a017', sub: '#ffcccc', gradStart: '#4a0000', gradEnd: '#8b0000' },
    classic: { bg: '#111111', bg2: '#222222', text: '#ffffff', accent: '#ffffff', accent2: '#cccccc', sub: '#999999', gradStart: '#000000', gradEnd: '#1a1a1a' }
};

function getTheme() { return POSTER_THEMES[document.getElementById('posterTheme')?.value] || POSTER_THEMES['dark-gold']; }
function getSize() { return POSTER_SIZES[document.getElementById('posterFormat')?.value] || POSTER_SIZES.story; }

// ===== GOLDEN CURVES (signature CSS Digital Media style) =====
function drawGoldenCurves(ctx, W, H, theme, intensity) {
    const gold1 = theme.accent;
    const gold2 = theme.accent2 || '#b8860b';
    ctx.save();
    ctx.globalAlpha = intensity || 0.6;
    ctx.lineWidth = 2.5;

    // Bottom-left flowing curves
    for (let i = 0; i < 5; i++) {
        const grad = ctx.createLinearGradient(0, H, W * 0.6, H * 0.5);
        grad.addColorStop(0, gold1);
        grad.addColorStop(0.5, gold2);
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.globalAlpha = (intensity || 0.6) - i * 0.08;
        ctx.beginPath();
        ctx.moveTo(-50 + i * 30, H + 20);
        ctx.bezierCurveTo(W * 0.1 + i * 15, H * 0.65 - i * 20, W * 0.25 + i * 20, H * 0.55 - i * 15, W * 0.5 + i * 10, H * 0.4 - i * 10);
        ctx.stroke();
    }

    // Top-right flowing curves
    for (let i = 0; i < 4; i++) {
        const grad = ctx.createLinearGradient(W, 0, W * 0.4, H * 0.5);
        grad.addColorStop(0, gold1);
        grad.addColorStop(0.5, gold2);
        grad.addColorStop(1, 'transparent');
        ctx.strokeStyle = grad;
        ctx.globalAlpha = (intensity || 0.5) - i * 0.1;
        ctx.beginPath();
        ctx.moveTo(W + 50 - i * 25, -20);
        ctx.bezierCurveTo(W * 0.85 - i * 15, H * 0.2 + i * 15, W * 0.75 - i * 10, H * 0.35 + i * 10, W * 0.55 - i * 15, H * 0.5 + i * 20);
        ctx.stroke();
    }
    ctx.restore();
}

// ===== DRAW DARK GRADIENT BACKGROUND =====
function drawBg(ctx, W, H, theme) {
    // Main gradient
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.3, 0, W * 0.5, H * 0.5, W);
    grad.addColorStop(0, theme.gradEnd || '#1a1507');
    grad.addColorStop(1, theme.gradStart || '#000000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // BG image with dark overlay
    if (posterBgImageObj) {
        ctx.globalAlpha = 0.35;
        const ratio = Math.max(W / posterBgImageObj.width, H / posterBgImageObj.height);
        const iw = posterBgImageObj.width * ratio, ih = posterBgImageObj.height * ratio;
        ctx.drawImage(posterBgImageObj, (W - iw) / 2, (H - ih) / 2, iw, ih);
        ctx.globalAlpha = 1;
        // Dark overlay from bottom
        const darkOverlay = ctx.createLinearGradient(0, H * 0.3, 0, H);
        darkOverlay.addColorStop(0, 'rgba(0,0,0,0)');
        darkOverlay.addColorStop(1, 'rgba(0,0,0,0.85)');
        ctx.fillStyle = darkOverlay;
        ctx.fillRect(0, 0, W, H);
    }

    // Subtle noise texture
    ctx.save();
    ctx.globalAlpha = 0.015;
    for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#fff' : '#000';
        ctx.fillRect(Math.random() * W, Math.random() * H, 1, 1);
    }
    ctx.restore();
}

// ===== WATERMARK: "/// DIGITAL MEDIA" =====
function drawWatermark(ctx, W, H, theme) {
    if (!document.getElementById('posterShowWatermark')?.checked) return;
    ctx.save();
    ctx.font = '700 16px "Montserrat"';
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = 0.7;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    // Three slashes icon
    const x = 30, y = 30;
    ctx.fillStyle = theme.accent;
    ctx.fillRect(x, y, 3, 22); ctx.fillRect(x + 6, y, 3, 22); ctx.fillRect(x + 12, y, 3, 22);
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = 0.9;
    ctx.font = '800 13px "Montserrat"';
    ctx.fillText('DIGITAL', x + 22, y + 1);
    ctx.font = '400 13px "Montserrat"';
    ctx.fillText('MEDIA', x + 22, y + 16);
    ctx.restore();
}

// ===== SOCIALS: @cssofficiel footer =====
function drawSocials(ctx, W, H, theme) {
    if (!document.getElementById('posterShowSocials')?.checked) return;
    ctx.save();
    const y = H - 30;
    // Social icons bar
    ctx.font = '600 14px "Montserrat"';
    ctx.fillStyle = theme.text;
    ctx.globalAlpha = 0.5;
    ctx.textAlign = 'center';
    ctx.fillText('@  f  a  Â©  CSSOFFICIEL', W / 2, y);
    // Small line above
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(W * 0.3, y - 15, W * 0.4, 0.5);
    ctx.restore();
}

// ===== CSS CLUB LOGO (stylized shield) =====
function drawCSSLogo(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    // Shield shape
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.8, -size * 0.6);
    ctx.lineTo(size * 0.8, size * 0.3);
    ctx.quadraticCurveTo(size * 0.4, size, 0, size * 1.1);
    ctx.quadraticCurveTo(-size * 0.4, size, -size * 0.8, size * 0.3);
    ctx.lineTo(-size * 0.8, -size * 0.6);
    ctx.closePath();
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Black stripes
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(-size * 0.45, -size * 0.5, size * 0.22, size * 1.2);
    ctx.fillRect(-size * 0.05, -size * 0.5, size * 0.22, size * 1.2);
    ctx.fillRect(size * 0.35, -size * 0.5, size * 0.22, size * 1.2);
    // CSS text
    ctx.font = `900 ${size * 0.5}px "Montserrat"`;
    ctx.fillStyle = '#1a1a1a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CSS', 0, -size * 0.15);
    ctx.restore();
}

// ===== OPPONENT PLACEHOLDER LOGO =====
function drawOpponentLogo(ctx, x, y, size, text) {
    ctx.save();
    ctx.translate(x, y);
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.8, -size * 0.6);
    ctx.lineTo(size * 0.8, size * 0.3);
    ctx.quadraticCurveTo(size * 0.4, size, 0, size * 1.1);
    ctx.quadraticCurveTo(-size * 0.4, size, -size * 0.8, size * 0.3);
    ctx.lineTo(-size * 0.8, -size * 0.6);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.font = `900 ${size * 0.6}px "Montserrat"`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text || '?', 0, 0);
    ctx.restore();
}

// ===== COMPETITION HEADER (top bar with competition + season) =====
function drawCompHeader(ctx, W, theme, comp, season) {
    ctx.save();
    // Competition label right side
    ctx.font = '800 18px "Montserrat"';
    ctx.fillStyle = theme.accent;
    ctx.textAlign = 'right';
    ctx.fillText((comp || 'TUNISIAN CUP').toUpperCase(), W - 80, 38);
    ctx.font = '600 14px "Montserrat"';
    ctx.fillStyle = theme.sub;
    ctx.fillText(season || '2025 / 2026', W - 80, 58);
    // CSS logo top-right
    drawCSSLogo(ctx, W - 40, 42, 22);
    ctx.restore();
}

// #################################################################
// ===================== TEMPLATE: NEXT MATCH ======================
// #################################################################
function renderMatchDay(ctx, W, H, theme) {
    const comp = document.getElementById('posterCompetition')?.value || 'TUNISIAN CUP';
    const season = document.getElementById('posterSeason')?.value || '2025 / 2026';
    const date = document.getElementById('posterDate')?.value || 'SATURDAY , 29 MARCH';
    const time = document.getElementById('posterTime')?.value || '02:30 PM';
    const venue = document.getElementById('posterVenue')?.value || 'TAIEB MHIRI STADIUM';
    const awayAbbr = document.getElementById('posterAwayAbbr')?.value || 'ESM';

    drawGoldenCurves(ctx, W, H, theme, 0.5);
    drawWatermark(ctx, W, H, theme);
    drawCompHeader(ctx, W, theme, comp, season);

    // Logos centered
    const logosY = H * 0.32;
    drawCSSLogo(ctx, W * 0.35, logosY, 40);
    drawOpponentLogo(ctx, W * 0.65, logosY, 40, awayAbbr.substring(0, 3));

    // "NEXT MATCH" massive text
    const titleY = H * 0.55;
    ctx.save();
    ctx.font = `900 ${W * 0.14}px "Montserrat"`;
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 10;
    ctx.fillText('NEXT', W / 2, titleY - W * 0.08);
    ctx.fillText('MATCH', W / 2, titleY + W * 0.08);
    ctx.restore();

    // Info bar at bottom
    const barY = H * 0.78;
    ctx.save();
    ctx.font = '600 16px "Montserrat"';
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.8;
    const infoText = `${date}  /  ${time}  /  ${venue}`;
    ctx.fillText(infoText.toUpperCase(), W / 2, barY);
    // Subtle line below info
    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.4;
    ctx.fillRect(W * 0.1, barY + 12, W * 0.8, 1);
    ctx.restore();

    drawSocials(ctx, W, H, theme);
}

// #################################################################
// =================== TEMPLATE: SCORE RESULT ======================
// #################################################################
function renderScoreResult(ctx, W, H, theme) {
    const matchIdx = parseInt(document.getElementById('posterScoreMatchSelect')?.value);
    const match = !isNaN(matchIdx) ? posterMatchesCache[matchIdx] : null;
    const home = match?.homeTeam || 'CS SFAXIEN';
    const away = match?.awayTeam || 'ADVERSAIRE';
    const homeScore = document.getElementById('posterHomeScore')?.value || '0';
    const awayScore = document.getElementById('posterAwayScore')?.value || '0';
    const scorers = document.getElementById('posterScorers')?.value || '';
    const comp = match?.competition || 'LIGUE 1';
    const forceResult = document.getElementById('posterResultForce')?.value;

    drawGoldenCurves(ctx, W, H, theme, 0.4);
    drawWatermark(ctx, W, H, theme);

    // Result header
    const hs = parseInt(homeScore), as = parseInt(awayScore);
    let resultText = 'MATCH NUL', resultColor = '#f39c12';
    if (forceResult === 'win' || (!forceResult && hs > as)) { resultText = 'VICTOIRE !'; resultColor = '#2ecc71'; }
    else if (forceResult === 'loss' || (!forceResult && hs < as)) { resultText = 'DÉFAITE'; resultColor = '#e74c3c'; }
    else if (forceResult === 'draw') { resultText = 'MATCH NUL'; resultColor = '#f39c12'; }

    // Result banner
    ctx.save();
    ctx.font = `900 ${W * 0.065}px "Montserrat"`;
    ctx.fillStyle = resultColor;
    ctx.textAlign = 'center';
    ctx.shadowColor = resultColor;
    ctx.shadowBlur = 30;
    ctx.fillText(resultText, W / 2, H * 0.12);
    ctx.restore();

    ctx.font = '700 16px "Montserrat"';
    ctx.fillStyle = theme.sub;
    ctx.textAlign = 'center';
    ctx.fillText(comp.toUpperCase(), W / 2, H * 0.16);

    // SCORE - massive
    const scoreY = H * 0.35;
    ctx.save();
    ctx.font = `900 ${W * 0.22}px "Montserrat"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.fillStyle = theme.text;
    ctx.fillText(homeScore, W * 0.3, scoreY);
    ctx.fillStyle = theme.sub;
    ctx.font = `900 ${W * 0.1}px "Montserrat"`;
    ctx.fillText('-', W / 2, scoreY);
    ctx.font = `900 ${W * 0.22}px "Montserrat"`;
    ctx.fillStyle = theme.text;
    ctx.fillText(awayScore, W * 0.7, scoreY);
    ctx.restore();

    // Team names
    ctx.font = `800 ${Math.min(W * 0.04, 22)}px "Montserrat"`;
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'center';
    ctx.fillText(home.toUpperCase(), W * 0.3, scoreY + W * 0.14);
    ctx.fillText(away.toUpperCase(), W * 0.7, scoreY + W * 0.14);

    // Logos
    drawCSSLogo(ctx, W * 0.3, scoreY - W * 0.16, 28);
    drawOpponentLogo(ctx, W * 0.7, scoreY - W * 0.16, 28, away.substring(0, 3));

    // Scorers
    if (scorers.trim()) {
        const lines = scorers.trim().split('\n');
        const sY = H * 0.6;
        ctx.font = '800 18px "Montserrat"';
        ctx.fillStyle = theme.accent;
        ctx.textAlign = 'center';
        ctx.fillText('âš½  BUTEURS', W / 2, sY);
        ctx.font = '600 16px "Open Sans"';
        ctx.fillStyle = theme.text;
        lines.forEach((line, i) => {
            ctx.fillText(line.trim(), W / 2, sY + 30 + i * 28);
        });
    }

    drawSocials(ctx, W, H, theme);
}

// #################################################################
// ==================== TEMPLATE: XI STARTING ======================
// #################################################################
function renderLineup(ctx, W, H, theme) {
    const playersText = document.getElementById('posterLineupPlayers')?.value || '';
    const subsText = document.getElementById('posterLineupSubs')?.value || '';
    const matchIdx = parseInt(document.getElementById('posterLineupMatchSelect')?.value);
    const match = !isNaN(matchIdx) ? posterMatchesCache[matchIdx] : null;
    const comp = match?.competition || 'TUNISIAN CUP';
    const season = document.getElementById('posterSeason')?.value || '2025 / 2026';

    drawGoldenCurves(ctx, W, H, theme, 0.45);
    drawWatermark(ctx, W, H, theme);
    drawCompHeader(ctx, W, theme, comp, season);

    // Player photo on right side (if provided)
    if (posterLineupPhotoObj) {
        ctx.save();
        ctx.globalAlpha = 0.85;
        const imgH = H * 0.55;
        const ratio = imgH / posterLineupPhotoObj.height;
        const imgW = posterLineupPhotoObj.width * ratio;
        ctx.drawImage(posterLineupPhotoObj, W - imgW + 50, H * 0.05, imgW, imgH);
        // Gradient overlay on left side of photo
        const photoGrad = ctx.createLinearGradient(W - imgW + 50, 0, W - imgW + 200, 0);
        photoGrad.addColorStop(0, theme.bg);
        photoGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = photoGrad;
        ctx.fillRect(W - imgW + 50, 0, 200, H);
        ctx.restore();
    }

    // "XI" large + "STARTING" text
    const titleY = H * 0.18;
    ctx.save();
    ctx.font = `900 ${W * 0.2}px "Montserrat"`;
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'left';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 20;
    ctx.fillText('XI', W * 0.06, titleY);
    ctx.font = `900 ${W * 0.09}px "Montserrat"`;
    ctx.fillText('STARTING', W * 0.06, titleY + W * 0.08);
    ctx.restore();

    // Logos between XI text
    drawCSSLogo(ctx, W * 0.42, titleY - W * 0.1, 25);
    if (match) drawOpponentLogo(ctx, W * 0.52, titleY - W * 0.1, 25, (match.awayTeam || '?').substring(0, 3));

    // Players list
    const players = playersText.trim().split('\n').filter(l => l.trim());
    const startY = H * 0.35;
    const lineH = Math.min(55, (H * 0.45) / Math.max(players.length, 1));

    players.forEach((line, i) => {
        const y = startY + i * lineH;
        const parts = line.split(/[-â€“]/).map(s => s.trim());
        const num = parts[0] || '';
        const name = parts.slice(1).join('-') || parts[0] || '';

        // Number (bold gold)
        ctx.font = `900 ${lineH * 0.6}px "Montserrat"`;
        ctx.fillStyle = theme.accent;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(num, W * 0.07, y);

        // Name (bold white)
        ctx.font = `800 ${lineH * 0.52}px "Montserrat"`;
        ctx.fillStyle = theme.text;
        ctx.fillText(name.toUpperCase(), W * 0.18, y);
    });
    ctx.textBaseline = 'alphabetic';

    // Subs at bottom (smaller)
    if (subsText.trim()) {
        const subsY = H * 0.85;
        ctx.save();
        // Separator line
        ctx.fillStyle = theme.accent;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(W * 0.06, subsY - 20, W * 0.5, 1);
        ctx.globalAlpha = 0.6;
        ctx.font = '600 13px "Montserrat"';
        ctx.fillStyle = theme.sub;
        ctx.textAlign = 'left';
        const subLines = subsText.trim().split('\n');
        subLines.forEach((line, i) => {
            ctx.fillText(line.trim().toUpperCase(), W * 0.07, subsY + i * 20);
        });
        ctx.restore();
    }

    drawSocials(ctx, W, H, theme);
}

// #################################################################
// ==================== TEMPLATE: SUBS =============================
// #################################################################
function renderSubs(ctx, W, H, theme) {
    drawGoldenCurves(ctx, W, H, theme, 0.7);
    drawWatermark(ctx, W, H, theme);
    const comp = 'TUNISIAN CUP';
    const season = document.getElementById('posterSeason')?.value || '2025 / 2026';
    drawCompHeader(ctx, W, theme, comp, season);

    const matchIdx = parseInt(document.getElementById('posterSubsMatchSelect')?.value);
    const match = !isNaN(matchIdx) ? posterMatchesCache[matchIdx] : null;

    // Logos
    const logosY = H * 0.3;
    drawCSSLogo(ctx, W * 0.4, logosY, 30);
    if (match) drawOpponentLogo(ctx, W * 0.6, logosY, 30, (match.awayTeam || '?').substring(0, 3));

    // Massive "SUBS" golden text
    ctx.save();
    const subsY = H * 0.48;
    ctx.font = `900 ${W * 0.22}px "Montserrat"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Gold gradient text
    const goldGrad = ctx.createLinearGradient(W * 0.2, subsY - 80, W * 0.8, subsY + 80);
    goldGrad.addColorStop(0, '#d4a017');
    goldGrad.addColorStop(0.3, '#f5d77a');
    goldGrad.addColorStop(0.5, '#d4a017');
    goldGrad.addColorStop(0.7, '#f5d77a');
    goldGrad.addColorStop(1, '#b8860b');
    ctx.fillStyle = goldGrad;
    ctx.shadowColor = 'rgba(212,160,23,0.3)';
    ctx.shadowBlur = 40;
    ctx.fillText('SUBS', W / 2, subsY);
    ctx.restore();

    // Change details
    const subsText = document.getElementById('posterSubsText')?.value || '';
    if (subsText.trim()) {
        const lines = subsText.trim().split('\n');
        const startY = H * 0.65;
        const lineH = Math.min(40, (H * 0.25) / Math.max(lines.length, 1));
        lines.forEach((line, i) => {
            ctx.font = '700 18px "Montserrat"';
            ctx.fillStyle = theme.text;
            ctx.textAlign = 'center';
            ctx.fillText(line.trim(), W / 2, startY + i * lineH);
        });
    }

    drawSocials(ctx, W, H, theme);
}

// #################################################################
// ================ TEMPLATE: PLAYER HIGHLIGHT =====================
// #################################################################
function renderPlayerHighlight(ctx, W, H, theme) {
    const idx = parseInt(document.getElementById('posterPlayerSelect')?.value);
    const players = posterPlayersCache.filter(p => !['coach','staff'].includes(p.category));
    const pl = !isNaN(idx) ? players[idx] : null;
    const title = document.getElementById('posterPlayerTitle')?.value || 'MAN OF THE MATCH';
    const stat1 = document.getElementById('posterPlayerStat1')?.value || '';
    const stat2 = document.getElementById('posterPlayerStat2')?.value || '';
    const rating = document.getElementById('posterPlayerRating')?.value || '';

    drawGoldenCurves(ctx, W, H, theme, 0.5);
    drawWatermark(ctx, W, H, theme);

    // Player photo (big, centered)
    if (posterPlayerPhotoObj) {
        ctx.save();
        const imgH = H * 0.5;
        const ratio = imgH / posterPlayerPhotoObj.height;
        const imgW = posterPlayerPhotoObj.width * ratio;
        ctx.drawImage(posterPlayerPhotoObj, (W - imgW) / 2, H * 0.08, imgW, imgH);
        // Gradient overlay bottom
        const fadeGrad = ctx.createLinearGradient(0, H * 0.35, 0, H * 0.58);
        fadeGrad.addColorStop(0, 'transparent');
        fadeGrad.addColorStop(1, theme.bg);
        ctx.fillStyle = fadeGrad;
        ctx.fillRect(0, H * 0.35, W, H * 0.25);
        ctx.restore();
    }

    // Title
    const titleY = H * 0.58;
    ctx.save();
    ctx.font = `900 ${W * 0.065}px "Montserrat"`;
    const goldGrad = ctx.createLinearGradient(W * 0.2, titleY, W * 0.8, titleY);
    goldGrad.addColorStop(0, theme.accent);
    goldGrad.addColorStop(0.5, '#f5d77a');
    goldGrad.addColorStop(1, theme.accent);
    ctx.fillStyle = goldGrad;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 15;
    ctx.fillText(title.toUpperCase(), W / 2, titleY);
    ctx.restore();

    // Player name
    const nameY = titleY + W * 0.1;
    ctx.font = `900 ${W * 0.08}px "Montserrat"`;
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'center';
    ctx.fillText((pl?.name || 'JOUEUR').toUpperCase(), W / 2, nameY);

    if (pl?.number) {
        ctx.font = `700 ${W * 0.04}px "Montserrat"`;
        ctx.fillStyle = theme.accent;
        ctx.fillText('#' + pl.number, W / 2, nameY + W * 0.06);
    }

    // Rating badge
    if (rating) {
        const rY = nameY + W * 0.12;
        ctx.save();
        ctx.beginPath();
        ctx.arc(W / 2, rY, W * 0.06, 0, Math.PI * 2);
        ctx.fillStyle = theme.accent;
        ctx.shadowColor = theme.accent;
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.font = `900 ${W * 0.05}px "Montserrat"`;
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(rating, W / 2, rY);
        ctx.restore();
        ctx.textBaseline = 'alphabetic';
    }

    // Stats
    const statsY = H * 0.85;
    ctx.font = '700 20px "Montserrat"';
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'center';
    if (stat1) ctx.fillText(stat1.toUpperCase(), W / 2, statsY);
    if (stat2) ctx.fillText(stat2.toUpperCase(), W / 2, statsY + 30);

    drawSocials(ctx, W, H, theme);
}

// #################################################################
// =================== TEMPLATE: BILLETTERIE =======================
// #################################################################
function renderBilletterie(ctx, W, H, theme) {
    drawWatermark(ctx, W, H, theme);

    const opponent = document.getElementById('posterTicketOpponent')?.value || 'ESM';
    const date = document.getElementById('posterTicketDate')?.value || 'DIMANCHE 29 MARS 2026';
    const time = document.getElementById('posterTicketTime')?.value || '14H30';
    const venue = document.getElementById('posterTicketVenue')?.value || 'Stade Taieb Mhiri';
    const gradins = document.getElementById('posterTicketGradins')?.value || '10';
    const chaises1 = document.getElementById('posterTicketChaises1')?.value || '20';
    const chaises2 = document.getElementById('posterTicketChaises2')?.value || '20';
    const centrale = document.getElementById('posterTicketCentrale')?.value || '30';

    drawCSSLogo(ctx, W - 50, 50, 30);

    // "BILLETTERIE" massive text
    ctx.save();
    ctx.font = `900 ${W * 0.12}px "Montserrat"`;
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 20;
    ctx.fillText('BILLETTERIE', W / 2, H * 0.72);
    ctx.restore();

    // Ticket cards
    const ticketColors = ['#e74c3c', '#9b59b6', '#27ae60', '#3498db'];
    const ticketLabels = ['GRADINS', 'CHAISES 1', 'CHAISES 2', 'CENTRALE'];
    const ticketPrices = [gradins, chaises1, chaises2, centrale];
    const ticketWidth = W * 0.18;
    const ticketHeight = H * 0.35;
    const startX = W * 0.12;

    ticketLabels.forEach((label, i) => {
        const tx = startX + i * (ticketWidth + 12);
        const ty = H * 0.18;
        ctx.save();
        ctx.translate(tx + ticketWidth / 2, ty + ticketHeight / 2);
        ctx.rotate((-8 + i * 4) * Math.PI / 180);
        const tGrad = ctx.createLinearGradient(-ticketWidth/2, -ticketHeight/2, ticketWidth/2, ticketHeight/2);
        tGrad.addColorStop(0, ticketColors[i]);
        tGrad.addColorStop(1, ticketColors[i] + '99');
        ctx.fillStyle = tGrad;
        ctx.beginPath();
        ctx.roundRect(-ticketWidth / 2, -ticketHeight / 2, ticketWidth, ticketHeight, 10);
        ctx.fill();
        ctx.rotate(-Math.PI / 2);
        ctx.font = '900 14px "Montserrat"';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(label, 0, -10);
        ctx.font = '600 11px "Montserrat"';
        ctx.fillText(`CSS vs ${opponent}`, 0, 10);
        ctx.font = '900 22px "Montserrat"';
        ctx.fillText(ticketPrices[i], 0, ticketHeight * 0.25);
        ctx.restore();
    });

    // Bottom price legend
    const bottomY = H * 0.82;
    ctx.font = '700 16px "Montserrat"';
    ctx.textAlign = 'center';
    ticketLabels.forEach((label, i) => {
        const lx = W * 0.15 + i * (W * 0.2);
        ctx.fillStyle = theme.text;
        ctx.fillText(label, lx, bottomY);
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(lx - 25, bottomY + 8, 50, 22, 5);
        ctx.fillStyle = ticketColors[i];
        ctx.fill();
        ctx.font = '800 12px "Montserrat"';
        ctx.fillStyle = '#fff';
        ctx.fillText(ticketPrices[i] + ' DT', lx, bottomY + 23);
        ctx.restore();
    });

    drawSocials(ctx, W, H, theme);
}

// #################################################################
// =================== TEMPLATE: MATCH CANCELLED ===================
// #################################################################
function renderCancelled(ctx, W, H, theme) {
    drawGoldenCurves(ctx, W, H, theme, 0.3);
    drawWatermark(ctx, W, H, theme);

    const matchIdx = parseInt(document.getElementById('posterCancelledMatchSelect')?.value);
    const match = !isNaN(matchIdx) ? posterMatchesCache[matchIdx] : null;
    const reason = document.getElementById('posterCancelReason')?.value || '';
    const home = match?.homeTeam || 'CS SFAXIEN';
    const away = match?.awayTeam || 'ADVERSAIRE';
    const date = match?.date || '';
    const time = match?.time || '';
    const venue = match?.venue || '';

    const logosY = H * 0.18;
    drawCSSLogo(ctx, W * 0.38, logosY, 30);
    drawOpponentLogo(ctx, W * 0.62, logosY, 30, away.substring(0, 3));

    const titleY = H * 0.4;
    ctx.save();
    ctx.font = `900 ${W * 0.12}px "Montserrat"`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(231,76,60,0.6)';
    ctx.shadowBlur = 40;
    ctx.fillText('MATCH', W / 2, titleY - W * 0.07);
    ctx.fillStyle = '#e74c3c';
    ctx.fillText('CANCELLED', W / 2, titleY + W * 0.07);
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(W * 0.1, titleY);
    ctx.lineTo(W * 0.9, titleY);
    ctx.stroke();
    ctx.restore();

    const infoY = H * 0.6;
    ctx.font = '600 18px "Montserrat"';
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'center';
    if (date || time) ctx.fillText(`${date}  /  ${time}`.toUpperCase(), W / 2, infoY);
    if (venue) ctx.fillText(venue.toUpperCase(), W / 2, infoY + 30);
    if (reason) {
        ctx.font = '600 16px "Open Sans"';
        ctx.fillStyle = theme.sub;
        ctx.fillText(reason, W / 2, infoY + 65);
    }

    // Fire effect
    ctx.save();
    for (let i = 0; i < 80; i++) {
        const fx = Math.random() * W;
        const fy = H * 0.75 + Math.random() * H * 0.2;
        const fSize = 5 + Math.random() * 15;
        const fireGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, fSize);
        fireGrad.addColorStop(0, 'rgba(231,76,60,0.3)');
        fireGrad.addColorStop(0.5, 'rgba(241,196,15,0.15)');
        fireGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = fireGrad;
        ctx.fillRect(fx - fSize, fy - fSize, fSize * 2, fSize * 2);
    }
    ctx.restore();

    drawSocials(ctx, W, H, theme);
}

// #################################################################
// ==================== TEMPLATE: STANDING =========================
// #################################################################
function renderStanding(ctx, W, H, theme) {
    const title = document.getElementById('posterStandingTitle')?.value || 'CLASSEMENT LIGUE 1';

    drawGoldenCurves(ctx, W, H, theme, 0.3);
    drawWatermark(ctx, W, H, theme);

    ctx.save();
    ctx.font = `900 ${W * 0.06}px "Montserrat"`;
    const goldGrad = ctx.createLinearGradient(W * 0.2, 60, W * 0.8, 60);
    goldGrad.addColorStop(0, theme.accent);
    goldGrad.addColorStop(0.5, '#f5d77a');
    goldGrad.addColorStop(1, theme.accent);
    ctx.fillStyle = goldGrad;
    ctx.textAlign = 'center';
    ctx.fillText(title.toUpperCase(), W / 2, 75);
    ctx.restore();

    drawCSSLogo(ctx, W - 50, 55, 25);

    const standings = [...posterStandingsCache].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });

    const startY = 120;
    const maxRows = Math.min(standings.length, H > W ? 16 : 10);
    const lineH = Math.min(50, (H - startY - 80) / Math.max(maxRows, 1));

    ctx.font = '700 13px "Montserrat"';
    ctx.fillStyle = theme.accent;
    ctx.textAlign = 'left';
    ctx.fillText('#', W * 0.05, startY);
    ctx.fillText('ÉQUIPE', W * 0.1, startY);
    ctx.textAlign = 'center';
    ctx.fillText('J', W * 0.55, startY);
    ctx.fillText('V', W * 0.62, startY);
    ctx.fillText('N', W * 0.69, startY);
    ctx.fillText('D', W * 0.76, startY);
    ctx.fillText('DB', W * 0.83, startY);
    ctx.fillText('PTS', W * 0.93, startY);

    ctx.fillStyle = theme.accent;
    ctx.globalAlpha = 0.3;
    ctx.fillRect(W * 0.04, startY + 10, W * 0.92, 1);
    ctx.globalAlpha = 1;

    standings.slice(0, maxRows).forEach((team, i) => {
        const y = startY + 30 + i * lineH;
        const isCSS = (team.team || '').toLowerCase().includes('sfaxien') || (team.team || '').toLowerCase().includes('css');

        if (isCSS) {
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(W * 0.03, y - lineH * 0.4, W * 0.94, lineH - 4, 8);
            ctx.fillStyle = theme.accent;
            ctx.globalAlpha = 0.12;
            ctx.fill();
            ctx.strokeStyle = theme.accent;
            ctx.globalAlpha = 0.4;
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.restore();
        }

        ctx.font = `800 ${lineH * 0.36}px "Montserrat"`;
        ctx.fillStyle = isCSS ? theme.accent : theme.text;
        ctx.textAlign = 'left';
        ctx.fillText(String(i + 1), W * 0.05, y);

        ctx.font = `${isCSS ? '800' : '600'} ${lineH * 0.33}px "Montserrat"`;
        const teamName = (team.team || '').length > 20 ? (team.team || '').substring(0, 20) + '…' : (team.team || '');
        ctx.fillText(teamName, W * 0.1, y);

        ctx.font = `600 ${lineH * 0.3}px "Open Sans"`;
        ctx.fillStyle = isCSS ? theme.accent : theme.sub;
        ctx.textAlign = 'center';
        const played = (team.won || 0) + (team.drawn || 0) + (team.lost || 0);
        ctx.fillText(String(played), W * 0.55, y);
        ctx.fillText(String(team.won || 0), W * 0.62, y);
        ctx.fillText(String(team.drawn || 0), W * 0.69, y);
        ctx.fillText(String(team.lost || 0), W * 0.76, y);
        const gd = (team.goalsFor || 0) - (team.goalsAgainst || 0);
        ctx.fillText((gd >= 0 ? '+' : '') + gd, W * 0.83, y);

        ctx.font = `900 ${lineH * 0.38}px "Montserrat"`;
        ctx.fillStyle = isCSS ? theme.accent : theme.text;
        ctx.fillText(String(team.points || 0), W * 0.93, y);
    });

    drawSocials(ctx, W, H, theme);
}

// #################################################################
// ==================== TEMPLATE: EVENT ============================
// #################################################################
function renderEvent(ctx, W, H, theme) {
    drawWatermark(ctx, W, H, theme);

    const title = document.getElementById('posterEventTitle')?.value || 'عيد مبارك';
    const subtitle = document.getElementById('posterEventSubtitle')?.value || 'كل عام وأنتم بألف خير';
    const eventType = document.getElementById('posterEventType')?.value || 'eid';

    if (!posterBgImageObj) {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.6);
        skyGrad.addColorStop(0, '#87CEEB');
        skyGrad.addColorStop(0.5, '#E0C68F');
        skyGrad.addColorStop(1, theme.bg);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H);
    }

    drawCSSLogo(ctx, W - 50, 45, 28);
    drawGoldenCurves(ctx, W, H, {...theme, accent: '#d4a017', accent2: '#b8860b'}, 0.3);

    ctx.save();
    ctx.font = `900 ${W * 0.15}px "Open Sans"`;
    const goldGrad = ctx.createLinearGradient(W * 0.2, H * 0.3, W * 0.8, H * 0.5);
    goldGrad.addColorStop(0, '#d4a017');
    goldGrad.addColorStop(0.3, '#f5d77a');
    goldGrad.addColorStop(0.5, '#d4a017');
    goldGrad.addColorStop(0.7, '#f5d77a');
    goldGrad.addColorStop(1, '#b8860b');
    ctx.fillStyle = goldGrad;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 15;
    ctx.fillText(title, W / 2, H * 0.4);
    ctx.restore();

    ctx.save();
    ctx.font = `700 ${W * 0.055}px "Open Sans"`;
    ctx.fillStyle = theme.text;
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.fillText(subtitle, W / 2, H * 0.55);
    ctx.restore();

    if (eventType === 'eid' || eventType === 'ramadan') {
        ctx.save();
        ctx.beginPath();
        ctx.arc(W * 0.8, H * 0.15, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#f5d77a';
        ctx.shadowColor = '#f5d77a';
        ctx.shadowBlur = 20;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(W * 0.82, H * 0.14, 25, 0, Math.PI * 2);
        ctx.fillStyle = theme.bg;
        ctx.fill();
        ctx.font = '24px serif';
        ctx.fillStyle = '#f5d77a';
        ctx.fillText('★', W * 0.85, H * 0.17);
        ctx.restore();
    }

    drawSocials(ctx, W, H, theme);
}

// ===================================================================
// MAIN RENDER
// ===================================================================
function renderPoster() {
    const canvas = document.getElementById('posterCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const size = getSize();
    const theme = getTheme();

    canvas.width = size.w;
    canvas.height = size.h;

    drawBg(ctx, size.w, size.h, theme);

    switch (posterCurrentTemplate) {
        case 'match-day': renderMatchDay(ctx, size.w, size.h, theme); break;
        case 'score-result': renderScoreResult(ctx, size.w, size.h, theme); break;
        case 'lineup': renderLineup(ctx, size.w, size.h, theme); break;
        case 'subs': renderSubs(ctx, size.w, size.h, theme); break;
        case 'player-highlight': renderPlayerHighlight(ctx, size.w, size.h, theme); break;
        case 'billetterie': renderBilletterie(ctx, size.w, size.h, theme); break;
        case 'cancelled': renderCancelled(ctx, size.w, size.h, theme); break;
        case 'standing': renderStanding(ctx, size.w, size.h, theme); break;
        case 'event': renderEvent(ctx, size.w, size.h, theme); break;
    }

    try {
        const dataUrl = canvas.toDataURL('image/png', 0.4);
        const existing = posterSavedList.find(p => p.template === posterCurrentTemplate);
        if (existing) { existing.data = dataUrl; existing.time = new Date(); }
        else { posterSavedList.unshift({ template: posterCurrentTemplate, data: dataUrl, time: new Date() }); }
        if (posterSavedList.length > 12) posterSavedList.pop();
        refreshPosterSavedGrid();
    } catch(e) {}
}

function refreshPosterSavedGrid() {
    const grid = document.getElementById('posterSavedGrid');
    if (!grid) return;
    if (!posterSavedList.length) {
        grid.innerHTML = '<p style="color:#aaa;text-align:center;padding:20px;">Aucune affiche générée pour le moment.</p>';
        return;
    }
    let clearBtn = '<div style="text-align:right;margin-bottom:10px;grid-column:1/-1;"><button onclick="clearAllPosters()" style="font-size:0.75rem;padding:4px 12px;background:#e74c3c;color:#fff;border:none;border-radius:6px;cursor:pointer;"><i class="fas fa-trash"></i> Tout supprimer</button></div>';
    grid.innerHTML = clearBtn + posterSavedList.map((p, i) => `
        <div class="poster-saved-item">
            <img src="${p.data}" alt="Poster ${i + 1}">
            <div class="psi-actions">
                <button onclick="downloadSavedPoster(${i},'png')"><i class="fas fa-download"></i> PNG</button>
                <button onclick="deleteSavedPoster(${i})"><i class="fas fa-trash"></i></button>
            </div>
        </div>
    `).join('');
}

function clearAllPosters() {
    posterSavedList = [];
    refreshPosterSavedGrid();
}

function downloadPoster(format) {
    const canvas = document.getElementById('posterCanvas');
    if (!canvas) return;
    const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'jpg' ? 'jpg' : 'png';
    const link = document.createElement('a');
    link.download = `CSS_Affiche_${posterCurrentTemplate}_${Date.now()}.${ext}`;
    link.href = canvas.toDataURL(mime, 0.95);
    link.click();
}

function downloadSavedPoster(idx) {
    const item = posterSavedList[idx];
    if (!item) return;
    const link = document.createElement('a');
    link.download = `CSS_Affiche_${item.template}_${Date.now()}.png`;
    link.href = item.data;
    link.click();
}

function deleteSavedPoster(idx) {
    posterSavedList.splice(idx, 1);
    refreshPosterSavedGrid();
}

// Init poster section
const posterNavBtn = document.querySelector('[data-panel="posters"]');
if (posterNavBtn) {
    let posterInited = false;
    posterNavBtn.addEventListener('click', async () => {
        if (!posterInited) {
            posterInited = true;
            await loadPosterData();
            renderPoster();
            checkAiConfig();
            toggleAiKeySection();
        }
    });
}

// ===================================================================
// ====================== AI POSTER GENERATION =======================
// ===================================================================

const AI_PROMPT_TEMPLATES = {

'match-day': (data) => `Professional sports match day poster for a football/soccer game. 
Dark dramatic background with golden flowing curves and luxury aesthetic. 
Team: CS Sfaxien (CSS) - black and white striped jersey, playing against ${data.opponent || 'opponent team'}.
Text: "NEXT MATCH" in huge bold white typography.
Competition: ${data.competition || 'Tunisian Cup'} ${data.season || '2025/2026'}.
Date: ${data.date || 'Saturday'}, Time: ${data.time || '14:00'}, Venue: ${data.venue || 'Taieb Mhiri Stadium'}.
Two team badges/shields facing each other. 
Style: Professional sports media design, dark premium look with gold accents, flowing golden light streaks, 
cinematic lighting. Brand watermark "/// DIGITAL MEDIA" small in corner. Social handle @CSSOFFICIEL at bottom.
High quality, sharp typography, magazine/social media quality for Instagram and Facebook.`,

'score-result': (data) => `Professional sports score result poster. Dark dramatic background.
CS Sfaxien (CSS) ${data.homeScore || '2'} - ${data.awayScore || '0'} ${data.opponent || 'opponent'}.
${parseInt(data.homeScore||0) > parseInt(data.awayScore||0) ? 'VICTORY celebration mood, green accent for win' : parseInt(data.homeScore||0) < parseInt(data.awayScore||0) ? 'Defeat mood, red somber tone' : 'Draw result, neutral golden tone'}.
Large bold score numbers in center. Team badges on each side.
Scorers: ${data.scorers || ''}.
Style: Dark luxury sports media poster with golden flowing curves, professional typography, 
dramatic lighting. "/// DIGITAL MEDIA" watermark. @CSSOFFICIEL. HD quality for social media.`,

'lineup': (data) => `Professional football starting XI lineup poster.
Dark background with golden luxury aesthetic curves.
Title: "XI STARTING" in massive bold white/gold typography.
Team: CS Sfaxien (CSS) with black and white striped badge.
Competition: ${data.competition || 'Tunisian Cup'} ${data.season || '2025/2026'}.
Player list with numbers in gold and names in bold white:
${data.players || '30 DAHMEN, 4 HABCHIYA, 21 BACCAR, 15 MUNDEKO, 24 MATHLOUTHI (C), 13 DERBELI, 25 SAKOUHI, 33 TRABELSI, 12 MUTYABA, 18 OGBOLE, 9 BEN ALI'}.
Include a dynamic player photo cutout on the right side.
Substitutes listed smaller at bottom.
Style: Premium dark sports media design, golden accents, luxury feel. "/// DIGITAL MEDIA" watermark. @CSSOFFICIEL.`,

'subs': (data) => `Professional football substitution announcement poster.
Very dark/black background with dramatic flowing golden curves and streaks of light.
Title: "SUBS" in massive 3D golden metallic typography with texture, gold gradient.
Two team badges above: CS Sfaxien vs opponent.
Competition header: ${data.competition || 'Tunisian Cup'} ${data.season || '2025/2026'}.
Substitution details: ${data.subsText || 'Player changes'}.
Style: Ultra premium dark luxury design with golden metallic text effect, flowing gold curves, 
cinematic lighting, sports media quality. "/// DIGITAL MEDIA" watermark. @CSSOFFICIEL at bottom.`,

'player-highlight': (data) => `Professional sports "Man of the Match" poster.
Player: ${data.playerName || 'Star Player'} #${data.playerNumber || ''} of CS Sfaxien.
Title: "${data.title || 'MAN OF THE MATCH'}" in gold gradient typography.
Stats: ${data.stat1 || '2 Goals'}, ${data.stat2 || '1 Assist'}. Rating: ${data.rating || '8.5'}/10.
Player photo cutout centered with dramatic lighting and smoke/fire effects.
Dark premium background with golden curves. Team badge visible.
Style: Cinematic sports poster, dark luxury with gold accents, dramatic player showcase,
professional media quality. "/// DIGITAL MEDIA" watermark. @CSSOFFICIEL.`,

'billetterie': (data) => `Professional football ticket sales poster ("BILLETTERIE").
"BILLETTERIE" in massive bold white typography at bottom.
Four colorful ticket cards fanned out: Red (Gradins ${data.gradins || '10'} DT), Purple (Chaises 1 ${data.chaises1 || '20'} DT), Green (Chaises 2 ${data.chaises2 || '20'} DT), Blue (Centrale ${data.centrale || '30'} DT).
Match: CSS vs ${data.opponent || 'ESM'}, ${data.date || 'Dimanche 29 Mars'}, ${data.time || '14H30'}.
Stadium background photo with dark overlay. CS Sfaxien badge top-right.
Price legend at bottom showing each zone and price.
Style: Professional sports media design, dark with colorful ticket accents, stadium atmosphere.
"/// DIGITAL MEDIA" watermark. @CSSOFFICIEL.`,

'cancelled': (data) => `Professional "Match Cancelled" sports announcement poster.
"MATCH CANCELLED" in huge bold typography, "MATCH" in white, "CANCELLED" in dramatic red.
Two team badges: CS Sfaxien vs ${data.opponent || 'opponent'}.
Match details: ${data.date || 'Sunday 29 March'} / ${data.time || '02:30 PM'} / ${data.venue || 'Taieb Mhiri Stadium'}.
Action photo of players in background with dark overlay and fire/smoke effects at bottom.
Dramatic mood with red accents. ${data.reason ? 'Reason: ' + data.reason : ''}.
Style: Dark dramatic sports media poster with red cancel accent, fire effects, 
cinematic atmosphere. "/// DIGITAL MEDIA" watermark. @CSSOFFICIEL.`,

'standing': (data) => `Professional football league standings/classification poster.
"${data.title || 'CLASSEMENT LIGUE 1'}" in gold gradient typography at top.
Clean dark table showing team rankings with columns: Position, Team, Played, Won, Drawn, Lost, GD, Points.
CS Sfaxien row highlighted with golden accent.
CS Sfaxien badge/shield visible.
Dark luxury background with subtle golden curves.
Style: Premium dark sports infographic, clean typography, gold accents on dark background,
professional media quality. "/// DIGITAL MEDIA" watermark. @CSSOFFICIEL.`,

'event': (data) => `Professional sports club greeting card poster for ${data.eventType === 'eid' ? 'Eid Mubarak (عيد مبارك)' : data.eventType === 'ramadan' ? 'Ramadan Kareem' : data.eventType === 'anniv' ? 'Club Anniversary' : 'special event'}.
Title: "${data.title || 'عيد مبارك'}" in large golden calligraphy/ornamental typography.
Subtitle: "${data.subtitle || 'كل عام وأنتم بألف خير'}".
Background: Beautiful ${data.eventType === 'eid' || data.eventType === 'ramadan' ? 'Islamic architecture, mosque, medina of Sfax city' : 'celebratory'} photography with warm golden light.
CS Sfaxien badge/logo top-right. ${data.eventType === 'eid' || data.eventType === 'ramadan' ? 'Crescent moon and star decoration.' : ''}
Style: Elegant warm premium design, golden ornamental accents, cultural beauty,
professional quality. "/// DIGITAL MEDIA" watermark. @CSSOFFICIEL.`
};

function generateAiPrompt() {
    const template = posterCurrentTemplate;
    const data = collectPosterData();
    const promptFn = AI_PROMPT_TEMPLATES[template];
    if (promptFn) {
        document.getElementById('aiPromptOverride').value = promptFn(data);
    }
}

function collectPosterData() {
    const matchIdx = parseInt(document.getElementById('posterMatchSelect')?.value);
    const match = !isNaN(matchIdx) ? posterMatchesCache[matchIdx] : null;
    const scoreMatchIdx = parseInt(document.getElementById('posterScoreMatchSelect')?.value);
    const scoreMatch = !isNaN(scoreMatchIdx) ? posterMatchesCache[scoreMatchIdx] : null;
    const playerIdx = parseInt(document.getElementById('posterPlayerSelect')?.value);
    const players = posterPlayersCache.filter(p => !['coach','staff'].includes(p.category));
    const player = !isNaN(playerIdx) ? players[playerIdx] : null;

    return {
        competition: document.getElementById('posterCompetition')?.value || '',
        season: document.getElementById('posterSeason')?.value || '2025/2026',
        date: document.getElementById('posterDate')?.value || '',
        time: document.getElementById('posterTime')?.value || '',
        venue: document.getElementById('posterVenue')?.value || '',
        opponent: document.getElementById('posterAwayAbbr')?.value || match?.awayTeam || scoreMatch?.awayTeam || '',
        homeScore: document.getElementById('posterHomeScore')?.value || '0',
        awayScore: document.getElementById('posterAwayScore')?.value || '0',
        scorers: document.getElementById('posterScorers')?.value || '',
        players: document.getElementById('posterLineupPlayers')?.value || '',
        subsText: document.getElementById('posterSubsText')?.value || '',
        playerName: player?.name || '',
        playerNumber: player?.number || '',
        title: document.getElementById('posterPlayerTitle')?.value || document.getElementById('posterStandingTitle')?.value || document.getElementById('posterEventTitle')?.value || '',
        stat1: document.getElementById('posterPlayerStat1')?.value || '',
        stat2: document.getElementById('posterPlayerStat2')?.value || '',
        rating: document.getElementById('posterPlayerRating')?.value || '',
        gradins: document.getElementById('posterTicketGradins')?.value || '10',
        chaises1: document.getElementById('posterTicketChaises1')?.value || '20',
        chaises2: document.getElementById('posterTicketChaises2')?.value || '20',
        centrale: document.getElementById('posterTicketCentrale')?.value || '30',
        reason: document.getElementById('posterCancelReason')?.value || '',
        eventType: document.getElementById('posterEventType')?.value || 'eid',
        subtitle: document.getElementById('posterEventSubtitle')?.value || ''
    };
}

function toggleAiKeySection() {
    const provider = document.getElementById('aiProvider').value;
    const keySection = document.getElementById('aiKeySection');
    const styleGroup = document.getElementById('aiStyle')?.closest('.form-group');
    const linkEl = keySection?.querySelector('a');
    
    if (provider === 'together') {
        if (linkEl) { linkEl.href = 'https://api.together.xyz/settings/api-keys'; linkEl.textContent = '(Obtenir une clé Together.ai - Gratuit)'; }
        if (styleGroup) styleGroup.style.display = 'none';
    } else if (provider === 'openai') {
        if (linkEl) { linkEl.href = 'https://platform.openai.com/api-keys'; linkEl.textContent = '(Obtenir une clé OpenAI)'; }
        if (styleGroup) styleGroup.style.display = 'block';
    } else {
        if (linkEl) { linkEl.href = '#'; linkEl.textContent = ''; }
        if (styleGroup) styleGroup.style.display = 'block';
    }
}

async function saveAiKey() {
    const provider = document.getElementById('aiProvider').value;
    const apiKey = document.getElementById('aiApiKey').value.trim();
    if (!apiKey) { showToast('Entrez une clé API', 'error'); return; }
    try {
        await apiPost('ai-config', { provider, apiKey });
        document.getElementById('aiKeyStatus').innerHTML = '<span style="color:#27ae60;">✓ Clé ' + provider + ' configurée</span>';
        document.getElementById('aiApiKey').value = '';
        showToast('Clé API sauvegardée !');
    } catch(e) {
        showToast('Erreur: ' + e.message, 'error');
    }
}

async function checkAiConfig() {
    try {
        const config = await apiGet('ai-config');
        const status = document.getElementById('aiKeyStatus');
        if (status) {
            const parts = [];
            if (config.openai) parts.push('<span style="color:#27ae60;">✓ OpenAI</span>');
            if (config.stability) parts.push('<span style="color:#27ae60;">✓ Stability</span>');
            if (config.together) parts.push('<span style="color:#27ae60;">✓ Together</span>');
            if (parts.length) status.innerHTML = parts.join(' &nbsp;|&nbsp; ');
            else status.innerHTML = '<span style="color:#e74c3c;">⚠ Aucune clé configurée</span>';
        }
    } catch(e) {}
}

async function generateAiPoster() {
    // Auto-generate prompt if empty
    let prompt = document.getElementById('aiPromptOverride').value.trim();
    if (!prompt) {
        generateAiPrompt();
        prompt = document.getElementById('aiPromptOverride').value.trim();
    }
    if (!prompt) { showToast('Prompt vide', 'error'); return; }

    const provider = document.getElementById('aiProvider').value;
    const format = document.getElementById('posterFormat').value;
    const style = document.getElementById('aiStyle')?.value || 'vivid';
    const btn = document.getElementById('btnAiGenerate');
    const status = document.getElementById('aiGenerateStatus');
    const aiImageWrap = document.getElementById('aiImageWrap');
    const aiEmptyState = document.getElementById('aiEmptyState');

    // Show loading
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Génération en cours...';
    status.style.display = 'block';

    try {
        const res = await fetch(`${API_BASE}/ai-poster`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ prompt, provider, size: format, style })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur de génération');

        let imgSrc;
        if (data.imageUrl) {
            imgSrc = data.imageUrl;
        } else if (data.imageBase64) {
            imgSrc = 'data:image/png;base64,' + data.imageBase64;
        }

        if (imgSrc) {
            const img = document.getElementById('aiGeneratedImage');
            const aiPreviewWrap = document.getElementById('aiPreviewWrap');
            
            // Show the AI preview section
            if (aiPreviewWrap) aiPreviewWrap.style.display = 'block';
            
            // For Pollinations, image generates on-the-fly - wait for actual load
            img.style.display = 'none';
            aiImageWrap.style.display = 'flex';
            aiImageWrap.innerHTML = '<div style="padding:60px;text-align:center;width:100%;"><i class="fas fa-spinner fa-spin" style="font-size:3rem;color:#8e44ad;"></i><p style="margin-top:15px;color:#888;font-size:0.9rem;">Génération de l\'image en cours...<br><small>Cela peut prendre 10-30 secondes</small></p></div>';
            if (aiEmptyState) aiEmptyState.style.display = 'none';

            // Create a new image to preload
            const preloader = new Image();
            preloader.crossOrigin = 'anonymous';
            preloader.onload = function() {
                aiImageWrap.innerHTML = '';
                img.crossOrigin = 'anonymous';
                img.src = imgSrc;
                img.style.display = 'block';
                img.style.maxWidth = '100%';
                img.style.borderRadius = '4px';
                img.style.boxShadow = '0 5px 30px rgba(0,0,0,0.5)';
                aiImageWrap.appendChild(img);
                showToast('Affiche IA générée avec succès !');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-robot"></i> Générer avec l\'IA';
                status.style.display = 'none';
            };
            preloader.onerror = function() {
                aiImageWrap.innerHTML = '<div style="padding:40px;text-align:center;color:#e74c3c;"><i class="fas fa-exclamation-triangle" style="font-size:2rem;"></i><p style="margin-top:10px;">Erreur de chargement de l\'image.<br>Réessayez.</p></div>';
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-robot"></i> Générer avec l\'IA';
                status.style.display = 'none';
            };
            preloader.src = imgSrc;

            // Add to saved posters
            posterSavedList.unshift({
                template: posterCurrentTemplate + '-ai',
                data: imgSrc,
                time: new Date(),
                isAi: true
            });
            if (posterSavedList.length > 12) posterSavedList.pop();
            refreshPosterSavedGrid();

            if (data.revisedPrompt) {
                console.log('DALL-E revised prompt:', data.revisedPrompt);
            }
            return; // Don't go to finally yet, onload/onerror will handle button reset
        }
    } catch(err) {
        showToast('Erreur IA: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-robot"></i> Générer avec l\'IA';
        status.style.display = 'none';
    }
}

function downloadAiPoster() {
    const img = document.getElementById('aiGeneratedImage');
    if (!img || !img.src) return;
    
    // Try canvas approach for cross-origin images
    try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = `CSS_AI_Poster_${posterCurrentTemplate}_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch(e) {
        // Fallback: open in new tab
        window.open(img.src, '_blank');
    }
}

// Auto-generate prompt when template changes
const origTemplateClick = document.querySelectorAll('.poster-template-card[data-template]');
origTemplateClick.forEach(card => {
    card.addEventListener('click', () => {
        setTimeout(generateAiPrompt, 100);
    });
});

// =========================================================
// ===== API FOOTBALL: Real Data Integration =====
// =========================================================

// Load saved config when panel opens
document.querySelector('.admin-nav-link[data-panel="football-api"]')?.addEventListener('click', loadFootballApiConfig);

async function loadFootballApiConfig() {
    try {
        const config = await apiGet('football-api/config');
        if (config.apiKey) document.getElementById('fbApiKey').value = config.apiKey;
        if (config.teamId) document.getElementById('fbTeamId').value = config.teamId;
        if (config.leagueId) document.getElementById('fbLeagueId').value = config.leagueId;
        if (config.teamName) document.getElementById('fbTeamName').value = config.teamName;
    } catch(e) { /* first time, no config yet */ }
}

async function saveFootballApiConfig() {
    const apiKey = document.getElementById('fbApiKey').value.trim();
    const teamId = document.getElementById('fbTeamId').value;
    const leagueId = document.getElementById('fbLeagueId').value;
    const teamName = document.getElementById('fbTeamName').value.trim();
    const statusEl = document.getElementById('fbConfigStatus');

    if (!apiKey || apiKey.length < 10) {
        showToast('Veuillez entrer une clé API valide', 'error');
        return;
    }

    statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sauvegarde...';
    try {
        await apiPut('football-api/config', { apiKey, teamId: parseInt(teamId), leagueId: parseInt(leagueId), teamName });
        statusEl.innerHTML = '<span style="color:#27ae60;"><i class="fas fa-check"></i> Configuré !</span>';
        showToast('Configuration API Football sauvegardée !');
    } catch(e) {
        statusEl.innerHTML = '<span style="color:#e74c3c;"><i class="fas fa-times"></i> Erreur</span>';
        showToast(e.message, 'error');
    }
}

async function checkFootballApiStatus() {
    const quotaEl = document.getElementById('fbApiQuota');
    quotaEl.style.display = 'block';
    quotaEl.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:#aaa;"></i> Vérification...';

    try {
        const status = await apiGet('football-api/status');
        const pct = Math.round((status.requestsUsed / status.requestsLimit) * 100);
        const color = pct > 80 ? '#e74c3c' : pct > 50 ? '#f39c12' : '#27ae60';
        quotaEl.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span style="color:#fff;font-weight:bold;"><i class="fas fa-signal"></i> Plan: ${status.plan}</span>
                <span style="color:${status.active ? '#27ae60' : '#e74c3c'};">${status.active ? '● Actif' : '● Inactif'}</span>
            </div>
            <div style="background:#222;border-radius:8px;height:20px;overflow:hidden;margin-bottom:5px;">
                <div style="width:${pct}%;height:100%;background:${color};border-radius:8px;transition:width 0.5s;"></div>
            </div>
            <div style="display:flex;justify-content:space-between;color:#aaa;font-size:12px;">
                <span>${status.requestsUsed} / ${status.requestsLimit} requêtes utilisées</span>
                <span>${status.remaining} restantes</span>
            </div>`;
    } catch(e) {
        quotaEl.innerHTML = `<span style="color:#e74c3c;"><i class="fas fa-exclamation-triangle"></i> ${e.message}</span>`;
    }
}

function showSyncResult(message, isError) {
    const el = document.getElementById('fbSyncResult');
    el.style.display = 'block';
    el.style.background = isError ? '#1a0505' : '#051a05';
    el.style.border = `1px solid ${isError ? '#e74c3c' : '#27ae60'}`;
    el.innerHTML = `<span style="color:${isError ? '#e74c3c' : '#27ae60'};"><i class="fas fa-${isError ? 'exclamation-triangle' : 'check-circle'}"></i> ${message}</span>`;
    setTimeout(() => { el.style.display = 'none'; }, 8000);
}

function setSyncBtnLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
        btn.dataset.origHtml = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Synchronisation...';
        btn.disabled = true;
    } else {
        btn.innerHTML = btn.dataset.origHtml || btn.innerHTML;
        btn.disabled = false;
    }
}

async function syncAll() {
    setSyncBtnLoading('btnSyncAll', true);
    try {
        const result = await apiPost('football-api/sync-all', {});
        showSyncResult(
            `Sync complet ! ${result.standings} équipes classement, ${result.matches} nouveaux matchs, ` +
            `${result.matchesUpdated} mis à jour, ${result.fixtures} nouveaux matchs au calendrier`
        );
        showToast('Synchronisation complète réussie !');
    } catch(e) {
        showSyncResult(e.message, true);
    }
    setSyncBtnLoading('btnSyncAll', false);
}

async function syncStandings() {
    setSyncBtnLoading('btnSyncStandings', true);
    try {
        const result = await apiPost('football-api/sync-standings', {});
        showSyncResult(`${result.imported} équipes importées dans le classement`);
        showToast('Classement synchronisé !');
    } catch(e) {
        showSyncResult(e.message, true);
    }
    setSyncBtnLoading('btnSyncStandings', false);
}

async function syncMatches() {
    setSyncBtnLoading('btnSyncMatches', true);
    try {
        const result = await apiPost('football-api/sync-matches', { last: 15 });
        showSyncResult(`${result.imported} nouveaux matchs importés, ${result.updated} mis à jour`);
        showToast('Matchs synchronisés !');
    } catch(e) {
        showSyncResult(e.message, true);
    }
    setSyncBtnLoading('btnSyncMatches', false);
}

async function syncFixtures() {
    setSyncBtnLoading('btnSyncFixtures', true);
    try {
        const result = await apiPost('football-api/sync-fixtures', { next: 10 });
        showSyncResult(`${result.imported} nouveaux matchs ajoutés au calendrier`);
        showToast('Calendrier synchronisé !');
    } catch(e) {
        showSyncResult(e.message, true);
    }
    setSyncBtnLoading('btnSyncFixtures', false);
}

async function previewStandings() {
    const area = document.getElementById('fbPreviewArea');
    area.innerHTML = '<p style="color:#aaa;text-align:center;"><i class="fas fa-spinner fa-spin"></i> Chargement classement...</p>';
    try {
        const standings = await apiGet('football-api/standings');
        if (!standings.length) { area.innerHTML = '<p style="color:#e74c3c;">Aucun classement trouvé</p>'; return; }
        let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="color:#aaa;border-bottom:1px solid #333;">
                <th style="padding:8px;text-align:left;">#</th>
                <th style="padding:8px;text-align:left;">Équipe</th>
                <th style="padding:8px;text-align:center;">MJ</th>
                <th style="padding:8px;text-align:center;">V</th>
                <th style="padding:8px;text-align:center;">N</th>
                <th style="padding:8px;text-align:center;">D</th>
                <th style="padding:8px;text-align:center;">BP</th>
                <th style="padding:8px;text-align:center;">BC</th>
                <th style="padding:8px;text-align:center;">Pts</th>
                <th style="padding:8px;text-align:center;">Forme</th>
            </tr></thead><tbody>`;
        standings.forEach((t, i) => {
            const rowStyle = t.isOurTeam ? 'background:#1a0a0a;font-weight:bold;' : '';
            const formBadges = (t.form || []).map(f => {
                const c = f === 'W' ? '#27ae60' : f === 'D' ? '#f39c12' : '#e74c3c';
                return `<span style="display:inline-block;width:18px;height:18px;line-height:18px;text-align:center;border-radius:3px;background:${c};color:#fff;font-size:10px;margin:0 1px;">${f}</span>`;
            }).join('');
            html += `<tr style="border-bottom:1px solid #222;${rowStyle}">
                <td style="padding:8px;color:#fff;">${i + 1}</td>
                <td style="padding:8px;color:#fff;">${t.isOurTeam ? '⭐ ' : ''}${t.name}</td>
                <td style="padding:8px;text-align:center;color:#aaa;">${t.played}</td>
                <td style="padding:8px;text-align:center;color:#27ae60;">${t.won}</td>
                <td style="padding:8px;text-align:center;color:#f39c12;">${t.drawn}</td>
                <td style="padding:8px;text-align:center;color:#e74c3c;">${t.lost}</td>
                <td style="padding:8px;text-align:center;color:#aaa;">${t.goalsFor}</td>
                <td style="padding:8px;text-align:center;color:#aaa;">${t.goalsAgainst}</td>
                <td style="padding:8px;text-align:center;color:#fff;font-weight:bold;">${t.points}</td>
                <td style="padding:8px;text-align:center;">${formBadges}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        area.innerHTML = html;
    } catch(e) {
        area.innerHTML = `<p style="color:#e74c3c;"><i class="fas fa-exclamation-triangle"></i> ${e.message}</p>`;
    }
}

async function previewFixtures() {
    const area = document.getElementById('fbPreviewArea');
    area.innerHTML = '<p style="color:#aaa;text-align:center;"><i class="fas fa-spinner fa-spin"></i> Chargement matchs...</p>';
    try {
        const fixtures = await apiGet('football-api/team-fixtures?last=10&next=10');
        if (!fixtures.length) { area.innerHTML = '<p style="color:#e74c3c;">Aucun match trouvé</p>'; return; }

        // Sort by date
        fixtures.sort((a, b) => new Date(b.date) - new Date(a.date));

        let html = '<div style="display:grid;gap:10px;">';
        fixtures.forEach(f => {
            const statusColor = f.status === 'finished' ? '#27ae60' : f.status === 'live' ? '#e74c3c' : '#f39c12';
            const statusText = f.status === 'finished' ? 'Terminé' : f.status === 'live' ? 'EN DIRECT' : 'À venir';
            const scoreDisplay = f.status === 'finished' ? `<span style="font-size:18px;font-weight:bold;color:#fff;">${f.homeScore} - ${f.awayScore}</span>` :
                                 f.status === 'live' ? `<span style="font-size:18px;font-weight:bold;color:#e74c3c;">${f.homeScore ?? 0} - ${f.awayScore ?? 0}</span>` :
                                 `<span style="color:#aaa;">${f.time || 'TBD'}</span>`;
            const isCSS = f.isHome || /sfax/i.test(f.homeTeam) || /sfax/i.test(f.awayTeam);

            html += `<div style="background:${isCSS ? '#1a0a0a' : '#0a0a0a'};padding:12px 15px;border-radius:8px;border:1px solid #222;display:flex;align-items:center;justify-content:space-between;">
                <div style="flex:1;text-align:right;color:#fff;font-size:14px;">${f.homeTeam}</div>
                <div style="flex:0 0 120px;text-align:center;">
                    ${scoreDisplay}
                    <div style="font-size:10px;color:${statusColor};margin-top:2px;">${statusText}</div>
                </div>
                <div style="flex:1;text-align:left;color:#fff;font-size:14px;">${f.awayTeam}</div>
                <div style="flex:0 0 100px;text-align:right;color:#666;font-size:11px;">
                    ${f.date}<br>${f.competition}
                </div>
            </div>`;
        });
        html += '</div>';
        area.innerHTML = html;
    } catch(e) {
        area.innerHTML = `<p style="color:#e74c3c;"><i class="fas fa-exclamation-triangle"></i> ${e.message}</p>`;
    }
}

async function previewTopScorers() {
    const area = document.getElementById('fbPreviewArea');
    area.innerHTML = '<p style="color:#aaa;text-align:center;"><i class="fas fa-spinner fa-spin"></i> Chargement buteurs...</p>';
    try {
        const scorers = await apiGet('football-api/top-scorers');
        if (!scorers.length) { area.innerHTML = '<p style="color:#e74c3c;">Aucun buteur trouvé</p>'; return; }

        let html = `<table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead><tr style="color:#aaa;border-bottom:1px solid #333;">
                <th style="padding:8px;text-align:left;">#</th>
                <th style="padding:8px;text-align:left;">Joueur</th>
                <th style="padding:8px;text-align:left;">Équipe</th>
                <th style="padding:8px;text-align:center;">Matchs</th>
                <th style="padding:8px;text-align:center;">Buts</th>
                <th style="padding:8px;text-align:center;">Passes D.</th>
                <th style="padding:8px;text-align:center;">Note</th>
            </tr></thead><tbody>`;
        scorers.forEach((s, i) => {
            const isCSS = /sfax/i.test(s.team);
            html += `<tr style="border-bottom:1px solid #222;${isCSS ? 'background:#1a0a0a;font-weight:bold;' : ''}">
                <td style="padding:8px;color:#fff;">${i + 1}</td>
                <td style="padding:8px;color:#fff;">
                    ${s.photo ? `<img src="${s.photo}" style="width:24px;height:24px;border-radius:50%;vertical-align:middle;margin-right:6px;">` : ''}
                    ${s.name}
                </td>
                <td style="padding:8px;color:#aaa;">${s.team}</td>
                <td style="padding:8px;text-align:center;color:#aaa;">${s.matches}</td>
                <td style="padding:8px;text-align:center;color:#27ae60;font-weight:bold;">${s.goals}</td>
                <td style="padding:8px;text-align:center;color:#3498db;">${s.assists || 0}</td>
                <td style="padding:8px;text-align:center;color:#f39c12;">${s.rating ? s.rating.toFixed(1) : '-'}</td>
            </tr>`;
        });
        html += '</tbody></table>';
        area.innerHTML = html;
    } catch(e) {
        area.innerHTML = `<p style="color:#e74c3c;"><i class="fas fa-exclamation-triangle"></i> ${e.message}</p>`;
    }
}
