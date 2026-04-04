/**
 * CS SFAXIEN - Admin Dashboard Logic
 * Gestion CRUD des données via localStorage
 */

document.addEventListener('DOMContentLoaded', () => {
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
        });
    });

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('input[type="date"]');
    dateInputs.forEach(input => {
        if (!input.value) input.value = today;
    });

    // ===== FORM HANDLERS =====
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

    // ===== LOAD TABLES =====
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

    // Toggle gallery video fields
    const galleryCatSelect = document.getElementById('galleryCategory');
    if (galleryCatSelect) {
        galleryCatSelect.addEventListener('change', () => {
            const isVideo = galleryCatSelect.value === 'video';
            document.getElementById('galleryVideoFields').style.display = isVideo ? '' : 'none';
        });
    }
});

// ===== MATCH FORM =====
function setupMatchForm() {
    const form = document.getElementById('matchForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const match = {
            id: generateId(),
            homeTeam: document.getElementById('matchHomeTeam').value.trim(),
            awayTeam: document.getElementById('matchAwayTeam').value.trim(),
            homeScore: document.getElementById('matchHomeScore').value,
            awayScore: document.getElementById('matchAwayScore').value,
            date: document.getElementById('matchDate').value,
            competition: document.getElementById('matchCompetition').value.trim(),
            venue: document.getElementById('matchVenue').value.trim(),
            isHome: document.getElementById('matchIsHome').value === 'true'
        };

        const matches = DataManager.getAll('matches');
        matches.push(match);
        DataManager.save('matches', matches);

        form.reset();
        document.getElementById('matchDate').value = new Date().toISOString().split('T')[0];
        refreshMatchesTable();
        showToast('Match enregistré avec succès !');
    });
}

function refreshMatchesTable() {
    const tbody = document.getElementById('matchesTableBody');
    if (!tbody) return;

    const matches = DataManager.getAll('matches');
    matches.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (matches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:30px;">Aucun match enregistré</td></tr>';
        return;
    }

    tbody.innerHTML = matches.map(match => {
        const formattedDate = new Date(match.date).toLocaleDateString('fr-FR');
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${escapeHtml(match.homeTeam)}</td>
                <td><strong>${match.homeScore} - ${match.awayScore}</strong></td>
                <td>${escapeHtml(match.awayTeam)}</td>
                <td>${escapeHtml(match.competition || '-')}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="deleteMatch('${match.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function deleteMatch(id) {
    if (!confirm('Supprimer ce match ?')) return;
    let matches = DataManager.getAll('matches');
    matches = matches.filter(m => m.id !== id);
    DataManager.save('matches', matches);
    refreshMatchesTable();
    showToast('Match supprimé', 'error');
}

// ===== FIXTURE FORM =====
function setupFixtureForm() {
    const form = document.getElementById('fixtureForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const fixture = {
            id: generateId(),
            homeTeam: document.getElementById('fixtureHomeTeam').value.trim(),
            awayTeam: document.getElementById('fixtureAwayTeam').value.trim(),
            date: document.getElementById('fixtureDate').value,
            time: document.getElementById('fixtureTime').value,
            competition: document.getElementById('fixtureCompetition').value.trim(),
            venue: document.getElementById('fixtureVenue').value.trim()
        };

        const fixtures = DataManager.getAll('fixtures');
        fixtures.push(fixture);
        DataManager.save('fixtures', fixtures);

        form.reset();
        document.getElementById('fixtureDate').value = new Date().toISOString().split('T')[0];
        refreshFixturesTable();
        showToast('Match ajouté au calendrier !');
    });
}

function refreshFixturesTable() {
    const tbody = document.getElementById('fixturesTableBody');
    if (!tbody) return;

    const fixtures = DataManager.getAll('fixtures');
    fixtures.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (fixtures.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:30px;">Aucun match programmé</td></tr>';
        return;
    }

    tbody.innerHTML = fixtures.map(fixture => {
        const formattedDate = new Date(fixture.date).toLocaleDateString('fr-FR');
        return `
            <tr>
                <td>${formattedDate}</td>
                <td>${escapeHtml(fixture.time || '-')}</td>
                <td>${escapeHtml(fixture.homeTeam)}</td>
                <td>${escapeHtml(fixture.awayTeam)}</td>
                <td>${escapeHtml(fixture.competition || '-')}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="deleteFixture('${fixture.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function deleteFixture(id) {
    if (!confirm('Supprimer ce match du calendrier ?')) return;
    let fixtures = DataManager.getAll('fixtures');
    fixtures = fixtures.filter(f => f.id !== id);
    DataManager.save('fixtures', fixtures);
    refreshFixturesTable();
    showToast('Match supprimé du calendrier', 'error');
}

// ===== STANDINGS FORM =====
function setupStandingsForm() {
    const form = document.getElementById('standingsForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const team = {
            id: generateId(),
            name: document.getElementById('standingTeamName').value.trim(),
            isOurTeam: document.getElementById('standingIsOurTeam').value === 'true',
            played: parseInt(document.getElementById('standingPlayed').value) || 0,
            won: parseInt(document.getElementById('standingWon').value) || 0,
            drawn: parseInt(document.getElementById('standingDrawn').value) || 0,
            lost: parseInt(document.getElementById('standingLost').value) || 0,
            goalsFor: parseInt(document.getElementById('standingGoalsFor').value) || 0,
            goalsAgainst: parseInt(document.getElementById('standingGoalsAgainst').value) || 0,
            points: parseInt(document.getElementById('standingPoints').value) || 0
        };

        const standings = DataManager.getAll('standings');
        standings.push(team);
        DataManager.save('standings', standings);

        form.reset();
        refreshStandingsTable();
        showToast('Équipe ajoutée au classement !');
    });
}

function refreshStandingsTable() {
    const tbody = document.getElementById('standingsTableBody');
    if (!tbody) return;

    const standings = DataManager.getAll('standings');
    standings.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return (b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst);
    });

    if (standings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#999;padding:30px;">Aucune équipe au classement</td></tr>';
        return;
    }

    tbody.innerHTML = standings.map((team, index) => {
        return `
            <tr class="${team.isOurTeam ? 'our-team-row' : ''}">
                <td><strong>${index + 1}</strong></td>
                <td>${escapeHtml(team.name)} ${team.isOurTeam ? '⭐' : ''}</td>
                <td>${team.played}</td>
                <td>${team.won}</td>
                <td>${team.drawn}</td>
                <td>${team.lost}</td>
                <td>${team.goalsFor}</td>
                <td>${team.goalsAgainst}</td>
                <td><strong>${team.points}</strong></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="deleteStanding('${team.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function deleteStanding(id) {
    if (!confirm('Supprimer cette équipe du classement ?')) return;
    let standings = DataManager.getAll('standings');
    standings = standings.filter(s => s.id !== id);
    DataManager.save('standings', standings);
    refreshStandingsTable();
    showToast('Équipe supprimée du classement', 'error');
}

// ===== PRODUCT FORM =====
function setupProductForm() {
    const form = document.getElementById('productForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const product = {
            id: generateId(),
            name: document.getElementById('productName').value.trim(),
            price: parseFloat(document.getElementById('productPrice').value),
            description: document.getElementById('productDescription').value.trim(),
            image: document.getElementById('productImage').value.trim(),
            badge: document.getElementById('productBadge').value.trim()
        };

        const products = DataManager.getAll('products');
        products.push(product);
        DataManager.save('products', products);

        form.reset();
        refreshProductsTable();
        showToast('Produit ajouté à la boutique !');
    });
}

function refreshProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    if (!tbody) return;

    const products = DataManager.getAll('products');

    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Aucun produit en boutique</td></tr>';
        return;
    }

    tbody.innerHTML = products.map(product => {
        return `
            <tr>
                <td><strong>${escapeHtml(product.name)}</strong></td>
                <td>${escapeHtml((product.description || '').substring(0, 60))}${product.description && product.description.length > 60 ? '...' : ''}</td>
                <td><strong>${parseFloat(product.price).toFixed(2)} TND</strong></td>
                <td>${escapeHtml(product.badge || '-')}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="deleteProduct('${product.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function deleteProduct(id) {
    if (!confirm('Supprimer ce produit ?')) return;
    let products = DataManager.getAll('products');
    products = products.filter(p => p.id !== id);
    DataManager.save('products', products);
    refreshProductsTable();
    showToast('Produit supprimé', 'error');
}

// ===== NEWS FORM =====
function setupNewsForm() {
    const form = document.getElementById('newsForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const article = {
            id: generateId(),
            title: document.getElementById('newsTitle').value.trim(),
            category: document.getElementById('newsCategory').value,
            date: document.getElementById('newsDate').value,
            content: document.getElementById('newsContent').value.trim(),
            image: document.getElementById('newsImage').value.trim()
        };

        const news = DataManager.getAll('news');
        news.push(article);
        DataManager.save('news', news);

        form.reset();
        document.getElementById('newsDate').value = new Date().toISOString().split('T')[0];
        refreshNewsTable();
        showToast('Article publié avec succès !');
    });
}

function refreshNewsTable() {
    const tbody = document.getElementById('newsTableBody');
    if (!tbody) return;

    const news = DataManager.getAll('news');
    news.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (news.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:30px;">Aucun article publié</td></tr>';
        return;
    }

    tbody.innerHTML = news.map(article => {
        const formattedDate = new Date(article.date).toLocaleDateString('fr-FR');
        return `
            <tr>
                <td>${formattedDate}</td>
                <td><strong>${escapeHtml(article.title)}</strong></td>
                <td>${escapeHtml(article.category || '-')}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="deleteNews('${article.id}')" title="Supprimer">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function deleteNews(id) {
    if (!confirm('Supprimer cet article ?')) return;
    let news = DataManager.getAll('news');
    news = news.filter(n => n.id !== id);
    DataManager.save('news', news);
    refreshNewsTable();
    showToast('Article supprimé', 'error');
}

// ===== PLAYERS / EFFECTIF =====
function setupPlayerForm() {
    const form = document.getElementById('playerForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('playerCategory').value;
        const isStaff = category === 'coach' || category === 'staff';

        let entry;
        if (isStaff) {
            entry = {
                id: generateId(),
                category: category,
                name: document.getElementById('playerName').value.trim(),
                role: document.getElementById('staffRole').value.trim(),
                nationality: document.getElementById('playerNationality').value.trim() || '🇹🇳 Tunisie',
                icon: document.getElementById('staffIcon').value.trim() || 'fas fa-clipboard'
            };
        } else {
            entry = {
                id: generateId(),
                category: category,
                name: document.getElementById('playerName').value.trim(),
                number: parseInt(document.getElementById('playerNumber').value) || 0,
                nationality: document.getElementById('playerNationality').value.trim() || '🇹🇳',
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
            if (category === 'goalkeepers') {
                entry.stats.cleanSheets = entry.stats.passes;
                entry.stats.arrets = extra;
                delete entry.stats.passes;
            } else if (category === 'attackers') {
                entry.stats.tirs = extra;
            } else {
                entry.stats.tacles = extra;
            }
        }

        const players = DataManager.getAll('players');
        players.push(entry);
        DataManager.save('players', players);
        form.reset();
        refreshPlayersTable();
        showToast('Joueur/Staff ajouté !');
    });
}

function refreshPlayersTable() {
    const tbody = document.getElementById('playersTableBody');
    if (!tbody) return;

    const players = DataManager.getAll('players');
    const catLabels = { goalkeepers: 'Gardien', defenders: 'Défenseur', midfielders: 'Milieu', attackers: 'Attaquant', coach: 'Entraîneur', staff: 'Staff' };

    if (players.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#999;padding:30px;">Aucun joueur enregistré</td></tr>';
        return;
    }

    tbody.innerHTML = players.map(p => `
        <tr>
            <td>${p.number || '-'}</td>
            <td><strong>${escapeHtml(p.name)}</strong></td>
            <td>${catLabels[p.category] || p.category}</td>
            <td>${escapeHtml(p.nationality || '-')}</td>
            <td>${p.age || '-'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deletePlayer('${p.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deletePlayer(id) {
    if (!confirm('Supprimer ce joueur/staff ?')) return;
    let players = DataManager.getAll('players');
    players = players.filter(p => p.id !== id);
    DataManager.save('players', players);
    refreshPlayersTable();
    showToast('Joueur/Staff supprimé', 'error');
}

// ===== GALLERY =====
function setupGalleryForm() {
    const form = document.getElementById('galleryForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const category = document.getElementById('galleryCategory').value;
        const isVideo = category === 'video';

        const item = {
            id: generateId(),
            title: document.getElementById('galleryTitle').value.trim(),
            desc: document.getElementById('galleryDesc').value.trim(),
            category: category,
            type: isVideo ? 'video' : 'photo',
            layout: document.getElementById('galleryLayout').value,
            date: document.getElementById('galleryDate').value
        };

        if (isVideo) {
            item.duration = document.getElementById('galleryDuration').value.trim();
            item.videoUrl = document.getElementById('galleryVideoUrl').value.trim() || '#';
        }

        const gallery = DataManager.getAll('gallery');
        gallery.push(item);
        DataManager.save('gallery', gallery);
        form.reset();
        document.getElementById('galleryDate').value = new Date().toISOString().split('T')[0];
        refreshGalleryTable();
        showToast('Média ajouté à la galerie !');
    });
}

function refreshGalleryTable() {
    const tbody = document.getElementById('galleryTableBody');
    if (!tbody) return;

    const gallery = DataManager.getAll('gallery');
    gallery.sort((a, b) => new Date(b.date) - new Date(a.date));
    const catLabels = { 'match-photo': 'Match', 'training-photo': 'Entraînement', 'video': 'Vidéo', 'fans': 'Supporters', 'stadium': 'Stade' };

    if (gallery.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Aucun média enregistré</td></tr>';
        return;
    }

    tbody.innerHTML = gallery.map(item => {
        const formattedDate = new Date(item.date).toLocaleDateString('fr-FR');
        return `
            <tr>
                <td>${formattedDate}</td>
                <td><strong>${escapeHtml(item.title)}</strong></td>
                <td>${catLabels[item.category] || item.category}</td>
                <td>${item.type === 'video' ? '🎬 Vidéo' : '📷 Photo'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="deleteGalleryItem('${item.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            </tr>`;
    }).join('');
}

function deleteGalleryItem(id) {
    if (!confirm('Supprimer ce média ?')) return;
    let gallery = DataManager.getAll('gallery');
    gallery = gallery.filter(g => g.id !== id);
    DataManager.save('gallery', gallery);
    refreshGalleryTable();
    showToast('Média supprimé', 'error');
}

// ===== TIMELINE =====
function setupTimelineForm() {
    const form = document.getElementById('timelineForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const item = {
            id: generateId(),
            year: document.getElementById('timelineYear').value.trim(),
            icon: document.getElementById('timelineIcon').value.trim(),
            title: document.getElementById('timelineTitle').value.trim(),
            desc: document.getElementById('timelineDesc').value.trim()
        };

        const timeline = DataManager.getAll('timeline');
        timeline.push(item);
        DataManager.save('timeline', timeline);
        form.reset();
        document.getElementById('timelineIcon').value = 'fa-trophy';
        refreshTimelineTable();
        showToast('Événement ajouté !');
    });
}

function refreshTimelineTable() {
    const tbody = document.getElementById('timelineTableBody');
    if (!tbody) return;

    const timeline = DataManager.getAll('timeline');
    timeline.sort((a, b) => parseInt(a.year) - parseInt(b.year));

    if (timeline.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;padding:30px;">Aucun événement</td></tr>';
        return;
    }

    tbody.innerHTML = timeline.map(item => `
        <tr>
            <td><strong>${escapeHtml(item.year)}</strong></td>
            <td>${escapeHtml(item.title)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deleteTimeline('${item.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteTimeline(id) {
    if (!confirm('Supprimer cet événement ?')) return;
    let timeline = DataManager.getAll('timeline');
    timeline = timeline.filter(t => t.id !== id);
    DataManager.save('timeline', timeline);
    refreshTimelineTable();
    showToast('Événement supprimé', 'error');
}

// ===== TROPHIES =====
function setupTrophyForm() {
    const form = document.getElementById('trophyForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const item = {
            id: generateId(),
            name: document.getElementById('trophyName').value.trim(),
            icon: document.getElementById('trophyIcon').value.trim(),
            count: parseInt(document.getElementById('trophyCount').value) || 1,
            years: document.getElementById('trophyYears').value.split(',').map(y => y.trim()).filter(y => y)
        };

        const trophies = DataManager.getAll('trophies');
        trophies.push(item);
        DataManager.save('trophies', trophies);
        form.reset();
        document.getElementById('trophyIcon').value = 'fa-trophy';
        document.getElementById('trophyCount').value = '1';
        refreshTrophiesTable();
        showToast('Trophée ajouté !');
    });
}

function refreshTrophiesTable() {
    const tbody = document.getElementById('trophiesTableBody');
    if (!tbody) return;

    const trophies = DataManager.getAll('trophies');

    if (trophies.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:30px;">Aucun trophée</td></tr>';
        return;
    }

    tbody.innerHTML = trophies.map(t => `
        <tr>
            <td><strong>${escapeHtml(t.name)}</strong></td>
            <td>${t.count}</td>
            <td>${t.years.join(', ')}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deleteTrophy('${t.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteTrophy(id) {
    if (!confirm('Supprimer ce trophée ?')) return;
    let trophies = DataManager.getAll('trophies');
    trophies = trophies.filter(t => t.id !== id);
    DataManager.save('trophies', trophies);
    refreshTrophiesTable();
    showToast('Trophée supprimé', 'error');
}

// ===== LEGENDS =====
function setupLegendForm() {
    const form = document.getElementById('legendForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const item = {
            id: generateId(),
            name: document.getElementById('legendName').value.trim(),
            position: document.getElementById('legendPosition').value.trim(),
            era: document.getElementById('legendEra').value.trim(),
            number: document.getElementById('legendNumber').value.trim(),
            desc: document.getElementById('legendDesc').value.trim(),
            image: document.getElementById('legendImage').value.trim()
        };

        const legends = DataManager.getAll('legends');
        legends.push(item);
        DataManager.save('legends', legends);
        form.reset();
        refreshLegendsTable();
        showToast('Légende ajoutée !');
    });
}

function refreshLegendsTable() {
    const tbody = document.getElementById('legendsTableBody');
    if (!tbody) return;

    const legends = DataManager.getAll('legends');

    if (legends.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;padding:30px;">Aucune légende</td></tr>';
        return;
    }

    tbody.innerHTML = legends.map(l => `
        <tr>
            <td><strong>${escapeHtml(l.name)}</strong></td>
            <td>${escapeHtml(l.position)}</td>
            <td>${escapeHtml(l.era)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deleteLegend('${l.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteLegend(id) {
    if (!confirm('Supprimer cette légende ?')) return;
    let legends = DataManager.getAll('legends');
    legends = legends.filter(l => l.id !== id);
    DataManager.save('legends', legends);
    refreshLegendsTable();
    showToast('Légende supprimée', 'error');
}

// ===== TICKET MATCHES =====
function setupTicketMatchForm() {
    const form = document.getElementById('ticketMatchForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const item = {
            id: generateId(),
            home: document.getElementById('ticketHome').value.trim(),
            away: document.getElementById('ticketAway').value.trim(),
            date: document.getElementById('ticketDate').value.trim(),
            time: document.getElementById('ticketTime').value.trim(),
            comp: document.getElementById('ticketComp').value.trim(),
            venue: document.getElementById('ticketVenue').value.trim(),
            available: document.getElementById('ticketAvailable').checked
        };

        const tickets = DataManager.getAll('ticketMatches');
        tickets.push(item);
        DataManager.save('ticketMatches', tickets);
        form.reset();
        document.getElementById('ticketHome').value = 'CS Sfaxien';
        document.getElementById('ticketVenue').value = 'Stade Taïeb Mhiri';
        document.getElementById('ticketAvailable').checked = true;
        refreshTicketMatchesTable();
        showToast('Match ajouté à la billetterie !');
    });
}

function refreshTicketMatchesTable() {
    const tbody = document.getElementById('ticketMatchesTableBody');
    if (!tbody) return;

    const tickets = DataManager.getAll('ticketMatches');

    if (tickets.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Aucun match en billetterie</td></tr>';
        return;
    }

    tbody.innerHTML = tickets.map(t => `
        <tr>
            <td>${escapeHtml(t.date)}</td>
            <td><strong>${escapeHtml(t.home)} vs ${escapeHtml(t.away)}</strong></td>
            <td>${escapeHtml(t.comp || '-')}</td>
            <td>${t.available ? '✅ Oui' : '❌ Non'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deleteTicketMatch('${t.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteTicketMatch(id) {
    if (!confirm('Supprimer ce match de la billetterie ?')) return;
    let tickets = DataManager.getAll('ticketMatches');
    tickets = tickets.filter(t => t.id !== id);
    DataManager.save('ticketMatches', tickets);
    refreshTicketMatchesTable();
    showToast('Match supprimé de la billetterie', 'error');
}

// ===== STADIUM ZONES =====
function setupStadiumZoneForm() {
    const form = document.getElementById('stadiumZoneForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const item = {
            id: generateId(),
            name: document.getElementById('zoneName').value.trim(),
            price: parseInt(document.getElementById('zonePrice').value) || 0,
            available: parseInt(document.getElementById('zoneAvailable').value) || 0,
            total: parseInt(document.getElementById('zoneTotal').value) || 0
        };

        const zones = DataManager.getAll('stadiumZones');
        zones.push(item);
        DataManager.save('stadiumZones', zones);
        form.reset();
        refreshZonesTable();
        showToast('Zone ajoutée !');
    });
}

function refreshZonesTable() {
    const tbody = document.getElementById('zonesTableBody');
    if (!tbody) return;

    const zones = DataManager.getAll('stadiumZones');

    if (zones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Aucune zone</td></tr>';
        return;
    }

    tbody.innerHTML = zones.map(z => `
        <tr>
            <td><strong>${escapeHtml(z.name)}</strong></td>
            <td>${z.price} TND</td>
            <td>${z.available.toLocaleString()}</td>
            <td>${z.total.toLocaleString()}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deleteZone('${z.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteZone(id) {
    if (!confirm('Supprimer cette zone ?')) return;
    let zones = DataManager.getAll('stadiumZones');
    zones = zones.filter(z => z.id !== id);
    DataManager.save('stadiumZones', zones);
    refreshZonesTable();
    showToast('Zone supprimée', 'error');
}

// ===== SUBSCRIPTION PLANS =====
function setupSubPlanForm() {
    const form = document.getElementById('subPlanForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const featuresText = document.getElementById('subPlanFeatures').value.trim();
        const features = featuresText.split('\n').map(line => {
            line = line.trim();
            if (!line) return null;
            const isDisabled = line.startsWith('✗') || line.startsWith('×') || line.startsWith('x ') || line.startsWith('X ');
            const text = line.replace(/^[✓✗×xX]\s*/, '');
            return { icon: isDisabled ? 'fa-times' : 'fa-check', text: text };
        }).filter(Boolean);

        const item = {
            id: generateId(),
            name: document.getElementById('subPlanName').value.trim(),
            price: parseInt(document.getElementById('subPlanPrice').value) || 0,
            period: document.getElementById('subPlanPeriod').value.trim(),
            icon: document.getElementById('subPlanIcon').value.trim(),
            description: document.getElementById('subPlanDesc').value.trim(),
            featured: document.getElementById('subPlanFeatured').checked,
            features: features
        };

        const plans = DataManager.getAll('subPlans');
        plans.push(item);
        DataManager.save('subPlans', plans);
        form.reset();
        document.getElementById('subPlanPeriod').value = 'Saison 2025-2026';
        document.getElementById('subPlanIcon').value = 'fa-users';
        refreshSubPlansTable();
        showToast('Plan d\'abonnement ajouté !');
    });
}

function refreshSubPlansTable() {
    const tbody = document.getElementById('subPlansTableBody');
    if (!tbody) return;

    const plans = DataManager.getAll('subPlans');

    if (plans.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Aucun plan</td></tr>';
        return;
    }

    tbody.innerHTML = plans.map(p => `
        <tr>
            <td><strong>${escapeHtml(p.name)}</strong></td>
            <td>${p.price} TND</td>
            <td>${escapeHtml(p.period)}</td>
            <td>${p.featured ? '⭐ Oui' : 'Non'}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deleteSubPlan('${p.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteSubPlan(id) {
    if (!confirm('Supprimer ce plan ?')) return;
    let plans = DataManager.getAll('subPlans');
    plans = plans.filter(p => p.id !== id);
    DataManager.save('subPlans', plans);
    refreshSubPlansTable();
    showToast('Plan supprimé', 'error');
}

// ===== MEETINGS (Match Info - Confrontations) =====
function setupMeetingForm() {
    const form = document.getElementById('meetingForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const item = {
            id: generateId(),
            date: document.getElementById('meetingDate').value.trim(),
            home: document.getElementById('meetingHome').value.trim(),
            away: document.getElementById('meetingAway').value.trim(),
            score: document.getElementById('meetingScore').value.trim(),
            result: document.getElementById('meetingResult').value
        };

        const meetings = DataManager.getAll('meetings');
        meetings.push(item);
        DataManager.save('meetings', meetings);
        form.reset();
        refreshMeetingsTable();
        showToast('Confrontation ajoutée !');
    });
}

function refreshMeetingsTable() {
    const tbody = document.getElementById('meetingsTableBody');
    if (!tbody) return;

    const meetings = DataManager.getAll('meetings');
    const resultLabels = { win: '✅ Victoire', draw: '🟡 Nul', loss: '❌ Défaite' };

    if (meetings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999;padding:30px;">Aucune confrontation</td></tr>';
        return;
    }

    tbody.innerHTML = meetings.map(m => `
        <tr>
            <td>${escapeHtml(m.date)}</td>
            <td>${escapeHtml(m.home)} vs ${escapeHtml(m.away)}</td>
            <td><strong>${escapeHtml(m.score)}</strong></td>
            <td>${resultLabels[m.result] || m.result}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deleteMeeting('${m.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteMeeting(id) {
    if (!confirm('Supprimer cette confrontation ?')) return;
    let meetings = DataManager.getAll('meetings');
    meetings = meetings.filter(m => m.id !== id);
    DataManager.save('meetings', meetings);
    refreshMeetingsTable();
    showToast('Confrontation supprimée', 'error');
}

// ===== LINEUP =====
function setupLineupForm() {
    const form = document.getElementById('lineupForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        function parseLine(val) {
            return val.split(',').map(p => {
                p = p.trim();
                const parts = p.split(':');
                return { number: parseInt(parts[0]) || 0, name: parts[1] ? parts[1].trim() : p };
            });
        }

        const lineup = [
            parseLine(document.getElementById('lineupGK').value),
            parseLine(document.getElementById('lineupDEF').value),
            parseLine(document.getElementById('lineupMID').value),
            parseLine(document.getElementById('lineupATK').value)
        ];

        DataManager.save('lineup', lineup);
        refreshLineupPreview();
        showToast('Composition enregistrée !');
    });
}

function refreshLineupPreview() {
    const preview = document.getElementById('lineupPreview');
    if (!preview) return;

    const lineup = DataManager.getAll('lineup');
    if (!lineup.length) {
        preview.innerHTML = '<p style="color:#999;text-align:center;">Aucune composition enregistrée</p>';
        return;
    }

    const rowLabels = ['🧤 Gardien', '🛡️ Défenseurs', '🏃 Milieux', '⚽ Attaquants'];
    preview.innerHTML = lineup.map((row, i) => {
        if (!Array.isArray(row)) return '';
        return `<div style="margin-bottom:10px;"><strong>${rowLabels[i] || ''}</strong>: ${row.map(p => `<span style="background:#f0f0f0;padding:3px 8px;border-radius:4px;margin-right:5px;">${p.number} ${escapeHtml(p.name)}</span>`).join('')}</div>`;
    }).join('');
}

// ===== DONORS =====
function setupDonorForm() {
    const form = document.getElementById('donorForm');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const item = {
            id: generateId(),
            name: document.getElementById('donorName').value.trim(),
            amount: document.getElementById('donorAmount').value.trim()
        };

        const donors = DataManager.getAll('donors');
        donors.push(item);
        DataManager.save('donors', donors);
        form.reset();
        refreshDonorsTable();
        showToast('Donateur ajouté !');
    });
}

function refreshDonorsTable() {
    const tbody = document.getElementById('donorsTableBody');
    if (!tbody) return;

    const donors = DataManager.getAll('donors');

    if (donors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:#999;padding:30px;">Aucun donateur</td></tr>';
        return;
    }

    tbody.innerHTML = donors.map(d => `
        <tr>
            <td><strong>${escapeHtml(d.name)}</strong></td>
            <td>${escapeHtml(d.amount)}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deleteDonor('${d.id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function deleteDonor(id) {
    if (!confirm('Supprimer ce donateur ?')) return;
    let donors = DataManager.getAll('donors');
    donors = donors.filter(d => d.id !== id);
    DataManager.save('donors', donors);
    refreshDonorsTable();
    showToast('Donateur supprimé', 'error');
}

// ===== DEMO DATA =====
function loadDemoData() {
    if (!confirm('Charger les données de démonstration ? Cela remplacera les données existantes.')) return;

    // Demo Matches
    const matches = [
        { id: generateId(), homeTeam: 'CS Sfaxien', awayTeam: 'Espérance de Tunis', homeScore: '2', awayScore: '1', date: '2026-02-28', competition: 'Ligue 1 Tunisienne', venue: 'Stade Taïeb Mhiri', isHome: true },
        { id: generateId(), homeTeam: 'Étoile du Sahel', awayTeam: 'CS Sfaxien', homeScore: '1', awayScore: '1', date: '2026-02-21', competition: 'Ligue 1 Tunisienne', venue: 'Stade Olympique de Sousse', isHome: false },
        { id: generateId(), homeTeam: 'CS Sfaxien', awayTeam: 'Club Africain', homeScore: '3', awayScore: '0', date: '2026-02-14', competition: 'Coupe de Tunisie', venue: 'Stade Taïeb Mhiri', isHome: true },
        { id: generateId(), homeTeam: 'US Monastir', awayTeam: 'CS Sfaxien', homeScore: '0', awayScore: '2', date: '2026-02-07', competition: 'Ligue 1 Tunisienne', venue: 'Stade Mustapha Ben Jannet', isHome: false },
        { id: generateId(), homeTeam: 'CS Sfaxien', awayTeam: 'AS Soliman', homeScore: '4', awayScore: '1', date: '2026-01-31', competition: 'Ligue 1 Tunisienne', venue: 'Stade Taïeb Mhiri', isHome: true },
    ];

    // Demo Fixtures
    const fixtures = [
        { id: generateId(), homeTeam: 'CS Sfaxien', awayTeam: 'CA Bizertin', date: '2026-03-14', time: '16:00', competition: 'Ligue 1 Tunisienne', venue: 'Stade Taïeb Mhiri' },
        { id: generateId(), homeTeam: 'Stade Tunisien', awayTeam: 'CS Sfaxien', date: '2026-03-21', time: '14:30', competition: 'Ligue 1 Tunisienne', venue: 'Stade Zouiten' },
        { id: generateId(), homeTeam: 'CS Sfaxien', awayTeam: 'ES Tunis', date: '2026-03-28', time: '16:00', competition: 'Ligue 1 Tunisienne', venue: 'Stade Taïeb Mhiri' },
        { id: generateId(), homeTeam: 'CS Sfaxien', awayTeam: 'Al Ahly SC', date: '2026-04-10', time: '20:00', competition: 'Ligue des Champions CAF', venue: 'Stade Taïeb Mhiri' },
    ];

    // Demo Standings
    const standings = [
        { id: generateId(), name: 'CS Sfaxien', isOurTeam: true, played: 22, won: 14, drawn: 5, lost: 3, goalsFor: 38, goalsAgainst: 12, points: 47 },
        { id: generateId(), name: 'Espérance de Tunis', isOurTeam: false, played: 22, won: 13, drawn: 6, lost: 3, goalsFor: 40, goalsAgainst: 16, points: 45 },
        { id: generateId(), name: 'Étoile du Sahel', isOurTeam: false, played: 22, won: 12, drawn: 5, lost: 5, goalsFor: 32, goalsAgainst: 20, points: 41 },
        { id: generateId(), name: 'Club Africain', isOurTeam: false, played: 22, won: 11, drawn: 6, lost: 5, goalsFor: 30, goalsAgainst: 22, points: 39 },
        { id: generateId(), name: 'US Monastir', isOurTeam: false, played: 22, won: 10, drawn: 7, lost: 5, goalsFor: 28, goalsAgainst: 19, points: 37 },
        { id: generateId(), name: 'CA Bizertin', isOurTeam: false, played: 22, won: 9, drawn: 8, lost: 5, goalsFor: 24, goalsAgainst: 18, points: 35 },
        { id: generateId(), name: 'Stade Tunisien', isOurTeam: false, played: 22, won: 8, drawn: 6, lost: 8, goalsFor: 22, goalsAgainst: 24, points: 30 },
        { id: generateId(), name: 'AS Soliman', isOurTeam: false, played: 22, won: 7, drawn: 5, lost: 10, goalsFor: 20, goalsAgainst: 28, points: 26 },
        { id: generateId(), name: 'US Ben Guerdane', isOurTeam: false, played: 22, won: 5, drawn: 7, lost: 10, goalsFor: 16, goalsAgainst: 30, points: 22 },
        { id: generateId(), name: 'AS Gabès', isOurTeam: false, played: 22, won: 3, drawn: 4, lost: 15, goalsFor: 12, goalsAgainst: 38, points: 13 },
    ];

    // Demo Products
    const products = [
        { id: generateId(), name: 'Maillot Domicile CSS 2025/26', price: 89.00, description: 'Le maillot officiel noir et blanc du CS Sfaxien. Tissu technique respirant aux couleurs historiques du club.', image: '', badge: 'Nouveau' },
        { id: generateId(), name: 'Maillot Extérieur CSS 2025/26', price: 89.00, description: 'Le maillot extérieur blanc du CS Sfaxien. Design élégant et moderne.', image: '', badge: 'Nouveau' },
        { id: generateId(), name: 'Écharpe CS Sfaxien', price: 25.00, description: 'Écharpe tissée noir et blanc. Indispensable pour supporter le CSS dans les tribunes du Taïeb Mhiri.', image: '', badge: '' },
        { id: generateId(), name: 'Casquette Logo CSS', price: 30.00, description: 'Casquette brodée avec le logo officiel du Club Sportif Sfaxien.', image: '', badge: 'Promo' },
        { id: generateId(), name: 'Survêtement Entraînement CSS', price: 120.00, description: 'Survêtement complet noir utilisé par les joueurs du CSS à l\'entraînement.', image: '', badge: '' },
        { id: generateId(), name: 'Ballon CS Sfaxien', price: 45.00, description: 'Ballon officiel taille 5 aux couleurs noir et blanc du club.', image: '', badge: '-15%' },
    ];

    // Demo News
    const news = [
        { id: generateId(), title: 'Victoire 3-0 contre le Club Africain en Coupe !', category: 'Match', date: '2026-02-14', content: 'Le CS Sfaxien a livré une prestation exceptionnelle ce samedi avec une victoire 3-0 face au Club Africain en Coupe de Tunisie au Stade Taïeb Mhiri. Les buts ont été inscrits par Sassi (22\'), Khenissi (55\') et Ben Amor (81\').\n\nLe coach se dit très satisfait : "Les joueurs ont montré un visage conquérant dès les premières minutes. Le public sfaxien a joué son rôle de 12ème homme."\n\nProchain rendez-vous le 14 mars face au CA Bizertin en championnat.', image: '' },
        { id: generateId(), title: 'Mercato : Arrivée de l\'attaquant Mohamed Amine Ben Hmida', category: 'Transfert', date: '2026-02-10', content: 'Le Club Sportif Sfaxien est heureux d\'annoncer la signature de Mohamed Amine Ben Hmida, attaquant polyvalent de 25 ans.\n\nBen Hmida apportera sa vitesse et son efficacité devant le but à notre ligne d\'attaque. Il a signé un contrat de 3 ans avec le club.\n\n"Je suis très fier de porter le maillot noir et blanc du CSS. C\'est un honneur de jouer pour ce grand club et devant les supporters sfaxiens", a déclaré le joueur.', image: '' },
        { id: generateId(), title: 'Journée portes ouvertes au Stade Taïeb Mhiri', category: 'Événement', date: '2026-02-05', content: 'Le CS Sfaxien organise une journée portes ouvertes le samedi 20 mars au Stade Taïeb Mhiri !\n\nAu programme :\n- 10h00 : Visite des installations\n- 11h00 : Entraînement ouvert au public\n- 12h30 : Repas avec les joueurs\n- 14h00 : Séance de dédicaces\n- 15h00 : Mini-tournoi pour les jeunes\n\nEntrée gratuite pour tous. Venez nombreux supporter le CSS !', image: '' },
        { id: generateId(), title: 'Le CSS lance sa nouvelle boutique en ligne', category: 'Communiqué', date: '2026-01-28', content: 'Le Club Sportif Sfaxien est fier d\'annoncer le lancement de sa boutique en ligne officielle !\n\nRetrouvez tous les produits dérivés du club : maillots noir et blanc, écharpes, casquettes, ballons et bien plus encore.\n\nPour fêter ce lancement, profitez de -15% sur votre première commande avec le code CSS2026.\n\nLivraison gratuite en Tunisie pour toute commande supérieure à 100 DT.', image: '' },
    ];

    DataManager.save('matches', matches);
    DataManager.save('fixtures', fixtures);
    DataManager.save('standings', standings);
    DataManager.save('products', products);
    DataManager.save('news', news);

    // Demo Players (Effectif)
    const players = [
        { id: generateId(), category:'coach', name:'Mohamed Kouki', role:'Entraîneur Principal', nationality:'🇹🇳 Tunisie', icon:'fas fa-chalkboard-teacher' },
        { id: generateId(), category:'staff', name:'Staff Technique CSS', role:'Entraîneur Adjoint', nationality:'🇹🇳 Tunisie', icon:'fas fa-clipboard' },
        { id: generateId(), category:'staff', name:'Staff Gardiens CSS', role:'Entraîneur des Gardiens', nationality:'🇹🇳 Tunisie', icon:'fas fa-hands' },
        { id: generateId(), category:'staff', name:'Préparateur CSS', role:'Préparateur Physique', nationality:'🇹🇳 Tunisie', icon:'fas fa-dumbbell' },
        { id: generateId(), category:'goalkeepers', name:'Mohamed Hedi Gaaloul', number:1, nationality:'🇹🇳', age:28, value:'800K €', image:'', stats:{ matchs:18, buts:0, cleanSheets:9, arrets:52 }},
        { id: generateId(), category:'goalkeepers', name:'Aymen Dahmen', number:30, nationality:'🇹🇳', age:27, value:'1.5M €', image:'', stats:{ matchs:4, buts:0, cleanSheets:2, arrets:15 }},
        { id: generateId(), category:'defenders', name:'Ali Maâloul', number:10, nationality:'🇹🇳', age:35, value:'1.0M €', image:'', stats:{ matchs:21, buts:2, passes:6, tacles:38 }},
        { id: generateId(), category:'defenders', name:'Abdessalem Akid', number:5, nationality:'🇹🇳', age:29, value:'700K €', image:'', stats:{ matchs:20, buts:0, passes:1, tacles:58 }},
        { id: generateId(), category:'defenders', name:'Kévin Mondeko', number:15, nationality:'🇨🇩', age:28, value:'800K €', image:'', stats:{ matchs:19, buts:1, passes:2, tacles:52 }},
        { id: generateId(), category:'defenders', name:'Hichem Baccar', number:21, nationality:'🇹🇳', age:28, value:'1.2M €', image:'', stats:{ matchs:22, buts:7, passes:3, tacles:42 }},
        { id: generateId(), category:'defenders', name:'Hamza Mathlouthi', number:24, nationality:'🇹🇳', age:30, value:'800K €', image:'', stats:{ matchs:20, buts:1, passes:2, tacles:55 }},
        { id: generateId(), category:'midfielders', name:'Ammar Taifour', number:6, nationality:'🇸🇩', age:27, value:'600K €', image:'', stats:{ matchs:18, buts:2, passes:5, tacles:38 }},
        { id: generateId(), category:'midfielders', name:'Travis Mutyaba', number:12, nationality:'🇺🇬', age:22, value:'700K €', image:'', stats:{ matchs:15, buts:3, passes:4, tacles:20 }},
        { id: generateId(), category:'midfielders', name:'Bouara Diarra', number:27, nationality:'🇲🇱', age:26, value:'650K €', image:'', stats:{ matchs:17, buts:2, passes:6, tacles:35 }},
        { id: generateId(), category:'attackers', name:'Willy Onana', number:7, nationality:'🇨🇲', age:27, value:'800K €', image:'', stats:{ matchs:19, buts:4, passes:5, tirs:42 }},
        { id: generateId(), category:'attackers', name:'Omar Ben Ali', number:9, nationality:'🇹🇳', age:26, value:'1.5M €', image:'', stats:{ matchs:22, buts:8, passes:3, tirs:55 }},
        { id: generateId(), category:'attackers', name:'Iyed Belwafi', number:11, nationality:'🇹🇳', age:27, value:'1.0M €', image:'', stats:{ matchs:20, buts:6, passes:4, tirs:38 }},
    ];
    DataManager.save('players', players);

    // Demo Gallery
    const gallery = [
        { id: generateId(), title:'CSS 4-0 CA Bizertin : Démonstration', desc:'Les joueurs célèbrent la victoire écrasante 4-0', category:'match-photo', type:'photo', layout:'wide', date:'2025-12-14' },
        { id: generateId(), title:'Omar Ben Ali : Doublé face au CAB', desc:'Omar Ben Ali célèbre son doublé', category:'match-photo', type:'photo', layout:'', date:'2025-12-14' },
        { id: generateId(), title:'Entrée des joueurs', desc:'L\'entrée sur le terrain sous les fumigènes noir et blanc', category:'match-photo', type:'photo', layout:'wide', date:'2026-02-28' },
        { id: generateId(), title:'Gaaloul — Arrêt décisif', desc:'Mohamed Hedi Gaaloul réalise un arrêt réflexe', category:'match-photo', type:'photo', layout:'', date:'2026-02-22' },
        { id: generateId(), title:'Séance tactique au tableau', desc:'Le coach Mohamed Kouki explique le plan de jeu', category:'training-photo', type:'photo', layout:'wide', date:'2026-02-25' },
        { id: generateId(), title:'Exercice de passes', desc:'Travis Mutyaba et Bouara Diarra travaillent la circulation', category:'training-photo', type:'photo', layout:'', date:'2026-02-20' },
        { id: generateId(), title:'Résumé CSS 4-0 CA Bizertin', desc:'Tous les buts et temps forts', category:'video', type:'video', layout:'wide', date:'2025-12-14', duration:'8:22', videoUrl:'#' },
        { id: generateId(), title:'Conférence de presse — Coach Kouki', desc:'Mohamed Kouki s\'exprime après la 6ème victoire', category:'video', type:'video', layout:'', date:'2026-02-28', duration:'12:30', videoUrl:'#' },
        { id: generateId(), title:'Supporters Sfaxiens', desc:'Les ultras noir et blanc au grand complet', category:'fans', type:'photo', layout:'tall', date:'2026-02-28' },
        { id: generateId(), title:'Stade Taïeb Mhiri — Vue aérienne', desc:'Vue panoramique du stade mythique de Sfax', category:'stadium', type:'photo', layout:'wide', date:'2026-01-15' },
    ];
    DataManager.save('gallery', gallery);

    // Demo Timeline
    const timeline = [
        { id: generateId(), year:'1928', icon:'fa-flag', title:'Fondation du Club', desc:'Le Club Sportif Sfaxien est fondé le 28 mai 1928 à Sfax.' },
        { id: generateId(), year:'1969', icon:'fa-trophy', title:'Premier Titre de Champion', desc:'Le CSS remporte son premier titre de champion de Tunisie.' },
        { id: generateId(), year:'1998', icon:'fa-medal', title:'Coupe de la CAF', desc:'Victoire historique en Coupe de la CAF, premier titre continental.' },
        { id: generateId(), year:'2007', icon:'fa-star', title:'Triplé Historique', desc:'Championnat, Coupe de Tunisie et Coupe de la Confédération CAF.' },
        { id: generateId(), year:'2013', icon:'fa-futbol', title:'3ème Confédération CAF', desc:'Le CSS remporte sa 3ème Coupe de la Confédération CAF.' },
        { id: generateId(), year:'2022', icon:'fa-shield-halved', title:'8ème Titre de Champion', desc:'Le CSS remporte son 8ème titre de champion de Tunisie.' },
    ];
    DataManager.save('timeline', timeline);

    // Demo Trophies
    const trophies = [
        { id: generateId(), name:'Championnat de Tunisie', icon:'fa-trophy', count:8, years:['1969','1971','1981','1995','2000','2007','2013','2022'] },
        { id: generateId(), name:'Coupe de Tunisie', icon:'fa-medal', count:7, years:['1963','1966','1983','1999','2007','2009','2023'] },
        { id: generateId(), name:'Coupe de la Confédération CAF', icon:'fa-globe', count:3, years:['2007','2008','2013'] },
        { id: generateId(), name:'Coupe de la CAF', icon:'fa-earth-africa', count:1, years:['1998'] },
        { id: generateId(), name:'Coupe Arabe des Clubs', icon:'fa-shield-halved', count:2, years:['2004','2015'] },
        { id: generateId(), name:'Supercoupe de Tunisie', icon:'fa-star', count:3, years:['2000','2007','2022'] },
    ];
    DataManager.save('trophies', trophies);

    // Demo Legends
    const legends = [
        { id: generateId(), name:'Abdelmajid Chetali', position:'Entraîneur', era:'1970s-80s', number:'', desc:'Entraîneur légendaire qui a façonné l\'identité du CSS.', image:'' },
        { id: generateId(), name:'Raouf Ben Aziza', position:'Milieu', era:'1990s-2000s', number:'10', desc:'Le maestro du milieu de terrain sfaxien.', image:'' },
        { id: generateId(), name:'Karim Haggui', position:'Défenseur', era:'2000s', number:'4', desc:'Défenseur central d\'exception, brillant au CSS puis en Europe.', image:'' },
        { id: generateId(), name:'Anis Boussaïdi', position:'Attaquant', era:'2000s-2010s', number:'9', desc:'Buteur prolifique et icône offensive du CSS.', image:'' },
        { id: generateId(), name:'Fakhreddine Ben Youssef', position:'Attaquant', era:'2010s-2020s', number:'11', desc:'Attaquant international, participant à la Coupe du Monde 2018.', image:'' },
    ];
    DataManager.save('legends', legends);

    // Demo Ticket Matches
    const ticketMatches = [
        { id: generateId(), home:'CS Sfaxien', away:'JS Kairouan', date:'14 Mars 2026', time:'16:00', comp:'Ligue 1 — J24', venue:'Stade Taïeb Mhiri', available:true },
        { id: generateId(), home:'CS Sfaxien', away:'Étoile du Sahel', date:'5 Avril 2026', time:'16:00', comp:'Ligue 1 — J26', venue:'Stade Taïeb Mhiri', available:true },
        { id: generateId(), home:'CS Sfaxien', away:'Olympique Béja', date:'19 Avril 2026', time:'16:00', comp:'Ligue 1 — J28', venue:'Stade Taïeb Mhiri', available:true },
        { id: generateId(), home:'CS Sfaxien', away:'Stade Tunisien', date:'3 Mai 2026', time:'16:00', comp:'Ligue 1 — J30', venue:'Stade Taïeb Mhiri', available:true },
    ];
    DataManager.save('ticketMatches', ticketMatches);

    // Demo Stadium Zones
    const stadiumZones = [
        { id: generateId(), name:'Tribune Nord', price:15, available:5200, total:7000 },
        { id: generateId(), name:'Tribune Sud', price:15, available:4800, total:7000 },
        { id: generateId(), name:'Tribune Ouest', price:25, available:2600, total:5000 },
        { id: generateId(), name:'Tribune Est (VIP)', price:50, available:1200, total:3000 },
    ];
    DataManager.save('stadiumZones', stadiumZones);

    // Demo Subscription Plans
    const subPlans = [
        { id: generateId(), name:'Gradin', price:120, period:'Saison 2025-2026', icon:'fa-users', description:'Tribune populaire — Ambiance garantie', featured:false, features:[{icon:'fa-check',text:'Tribune Nord ou Sud — Place libre'},{icon:'fa-check',text:'15 matchs de championnat'},{icon:'fa-check',text:'Carte de membre digitale'},{icon:'fa-check',text:'-5% à la boutique officielle'},{icon:'fa-times',text:'Matchs de coupe non inclus'},{icon:'fa-times',text:'Kit de bienvenue'}]},
        { id: generateId(), name:'Chaise', price:250, period:'Saison 2025-2026', icon:'fa-chair', description:'Place assise numérotée — Confort assuré', featured:false, features:[{icon:'fa-check',text:'Tribune Ouest — Siège numéroté'},{icon:'fa-check',text:'Tous les matchs à domicile'},{icon:'fa-check',text:'Carte de membre physique'},{icon:'fa-check',text:'-10% à la boutique officielle'},{icon:'fa-check',text:'Accès matchs de coupe'},{icon:'fa-times',text:'Kit de bienvenue'}]},
        { id: generateId(), name:'Centrale', price:450, period:'Saison 2025-2026', icon:'fa-star', description:'Tribune centrale — Vue optimale', featured:true, features:[{icon:'fa-check',text:'Tribune Centrale — Meilleure vue'},{icon:'fa-check',text:'Tous les matchs (dom. + coupe)'},{icon:'fa-check',text:'Carte Premium personnalisée'},{icon:'fa-check',text:'-15% à la boutique officielle'},{icon:'fa-check',text:'Kit de bienvenue (écharpe)'},{icon:'fa-check',text:'Accès prioritaire au stade'}]},
        { id: generateId(), name:'Loge', price:800, period:'Saison 2025-2026', icon:'fa-gem', description:'Loge privée — Expérience exclusive', featured:false, features:[{icon:'fa-check',text:'Loge VIP privée — Service premium'},{icon:'fa-check',text:'Tous les matchs + événements'},{icon:'fa-check',text:'Carte VIP Gold personnalisée'},{icon:'fa-check',text:'-20% à la boutique officielle'},{icon:'fa-check',text:'Kit complet (maillot + écharpe)'},{icon:'fa-check',text:'Parking réservé + Salon VIP + Buffet'}]},
    ];
    DataManager.save('subPlans', subPlans);

    // Demo Meetings
    const meetings = [
        { id: generateId(), date:'01/03/2026', home:'CSS', away:'EST', score:'1 - 2', result:'loss' },
        { id: generateId(), date:'15/02/2026', home:'ESS', away:'CSS', score:'0 - 1', result:'win' },
        { id: generateId(), date:'08/02/2026', home:'USBG', away:'CSS', score:'0 - 1', result:'win' },
        { id: generateId(), date:'01/02/2026', home:'CSS', away:'JSO', score:'2 - 0', result:'win' },
        { id: generateId(), date:'25/01/2026', home:'CSS', away:'ESM', score:'2 - 0', result:'win' },
    ];
    DataManager.save('meetings', meetings);

    // Demo Lineup
    const lineup = [
        [{ number:1, name:'Gaaloul' }],
        [{ number:10, name:'Maâloul' }, { number:5, name:'Akid' }, { number:15, name:'Mondeko' }, { number:24, name:'Mathlouthi' }],
        [{ number:6, name:'Taifour' }, { number:27, name:'Diarra' }, { number:12, name:'Mutyaba' }],
        [{ number:7, name:'Onana' }, { number:9, name:'O. Ben Ali' }, { number:11, name:'Belwafi' }]
    ];
    DataManager.save('lineup', lineup);

    // Demo Donors
    const donors = [
        { id: generateId(), name:'Mohamed Trabelsi', amount:'500 TND' },
        { id: generateId(), name:'Ahmed Ben Salem', amount:'250 TND' },
        { id: generateId(), name:'Fatma Karray', amount:'100 TND' },
        { id: generateId(), name:'Donateur Anonyme', amount:'1,000 TND' },
        { id: generateId(), name:'Nabil Chaari', amount:'200 TND' },
        { id: generateId(), name:'Sami Gargouri', amount:'150 TND' },
    ];
    DataManager.save('donors', donors);

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

    showToast('Données de démonstration chargées avec succès !');
}

// ===== CLEAR ALL DATA =====
function clearAllData() {
    if (!confirm('⚠️ Êtes-vous sûr de vouloir effacer TOUTES les données ? Cette action est irréversible.')) return;

    const keys = ['matches','fixtures','standings','products','news','players','gallery','timeline','trophies','legends','ticketMatches','stadiumZones','subPlans','meetings','lineup','donors'];
    keys.forEach(k => DataManager.save(k, []));

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

    showToast('Toutes les données ont été effacées', 'error');
}

// ===== EXPORT / IMPORT =====
function exportData() {
    const allKeys = ['matches','fixtures','standings','products','news','players','gallery','timeline','trophies','legends','ticketMatches','stadiumZones','subPlans','meetings','lineup','donors'];
    const data = { exportDate: new Date().toISOString() };
    allKeys.forEach(k => data[k] = DataManager.getAll(k));

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cssfaxien_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    showToast('Données exportées avec succès !');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            const allKeys = ['matches','fixtures','standings','products','news','players','gallery','timeline','trophies','legends','ticketMatches','stadiumZones','subPlans','meetings','lineup','donors'];
            allKeys.forEach(k => { if (data[k]) DataManager.save(k, data[k]); });

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

            showToast('Données importées avec succès !');
        } catch (err) {
            showToast('Erreur : fichier JSON invalide', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}
