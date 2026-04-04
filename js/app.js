/**
 * CS SFAXIEN — Ultra Advanced Animation Engine
 * Custom cursor, magnetic elements, advanced particle system,
 * split-text, 3D tilt, spring physics, glitch effects
 */

// ======================================================================
// DATA MANAGER — MongoDB API Backend
// ======================================================================
const API_BASE = '/api';
const _cache = {};

const DataManager = {
    // Synchronous read from cache (populated by preloadAll)
    getAll(key) {
        return _cache[key] || [];
    },
    // Save to API + update cache
    async saveToAPI(key, item) {
        const token = localStorage.getItem('cssfaxien_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/${key}`, { method: 'POST', headers, body: JSON.stringify(item) });
        if (!res.ok) throw new Error('Erreur API');
        const saved = await res.json();
        if (!_cache[key]) _cache[key] = [];
        _cache[key].push(saved);
        return saved;
    },
    async deleteFromAPI(key, id) {
        const token = localStorage.getItem('cssfaxien_token');
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/${key}/${id}`, { method: 'DELETE', headers });
        if (!res.ok) throw new Error('Erreur API');
        if (_cache[key]) _cache[key] = _cache[key].filter(item => item.id !== id && item._id !== id);
    },
    async updateAPI(key, id, data) {
        const token = localStorage.getItem('cssfaxien_token');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE}/${key}/${id}`, { method: 'PUT', headers, body: JSON.stringify(data) });
        if (!res.ok) throw new Error('Erreur API');
        const updated = await res.json();
        if (_cache[key]) {
            const idx = _cache[key].findIndex(item => item.id === id || item._id === id);
            if (idx !== -1) _cache[key][idx] = updated;
        }
        return updated;
    },
    // Legacy save — kept for compatibility but does nothing now
    save(key, data) { _cache[key] = data; },
    hasData() {
        return Object.keys(_cache).some(k => Array.isArray(_cache[k]) && _cache[k].length > 0);
    }
};

// Preload all data from API into cache
async function preloadAllData() {
    const keys = ['matches','fixtures','standings','products','news','players','gallery','timeline','trophies','legends','ticketMatches','stadiumZones','subPlans','meetings','donors','lineup','sportSections'];
    const results = await Promise.all(keys.map(k => fetch(`${API_BASE}/${k}`).then(r => r.json()).catch(() => [])));
    keys.forEach((k, i) => { _cache[k] = results[i]; });
}

function generateId() { return Date.now().toString(36) + Math.random().toString(36).substr(2); }

// ======================================================================
// DEMO DATA AUTO-LOAD (Legacy — data now in MongoDB)
// ======================================================================
const DEMO_DATA_VERSION = 4;
function initDemoData() {
    // Data is now loaded from MongoDB via preloadAllData()
    // This function is kept for compatibility but does nothing
    return;

    // REAL match results — 2025-26 Ligue Professionnelle 1 (source: Wikipedia, updated 1 Mar 2026)
    DataManager.save('matches', [
        { id: generateId(), homeTeam:'CS Sfaxien', awayTeam:'AS Gabès', homeScore:'1', awayScore:'0', date:'2026-02-28', competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri', isHome:true },
        { id: generateId(), homeTeam:'CS Sfaxien', awayTeam:'AS Marsa', homeScore:'2', awayScore:'0', date:'2026-02-22', competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri', isHome:true },
        { id: generateId(), homeTeam:'Étoile du Sahel', awayTeam:'CS Sfaxien', homeScore:'0', awayScore:'1', date:'2026-02-15', competition:'Ligue 1 Professionnelle', venue:'Stade Olympique de Sousse', isHome:false },
        { id: generateId(), homeTeam:'US Ben Guerdane', awayTeam:'CS Sfaxien', homeScore:'0', awayScore:'1', date:'2026-02-08', competition:'Ligue 1 Professionnelle', venue:'Stade 7 Mars', isHome:false },
        { id: generateId(), homeTeam:'CS Sfaxien', awayTeam:'JS El Omrane', homeScore:'2', awayScore:'0', date:'2026-02-01', competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri', isHome:true },
        { id: generateId(), homeTeam:'CS Sfaxien', awayTeam:'ES Métlaoui', homeScore:'2', awayScore:'0', date:'2026-01-25', competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri', isHome:true },
        { id: generateId(), homeTeam:'JS El Omrane', awayTeam:'CS Sfaxien', homeScore:'1', awayScore:'0', date:'2026-01-18', competition:'Ligue 1 Professionnelle', venue:'Stade Chedly Zouiten', isHome:false },
        { id: generateId(), homeTeam:'Olympique Béja', awayTeam:'CS Sfaxien', homeScore:'0', awayScore:'1', date:'2026-01-11', competition:'Ligue 1 Professionnelle', venue:'Stade Boujemaa Kmiti', isHome:false },
    ]);

    // REAL upcoming fixtures — remaining 8 matches of the season
    DataManager.save('fixtures', [
        { id: generateId(), homeTeam:'US Monastir', awayTeam:'CS Sfaxien', date:'2026-03-07', time:'14:00', competition:'Ligue 1 Professionnelle', venue:'Stade Mustapha Ben Jannet' },
        { id: generateId(), homeTeam:'CS Sfaxien', awayTeam:'JS Kairouan', date:'2026-03-14', time:'16:00', competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri' },
        { id: generateId(), homeTeam:'AS Marsa', awayTeam:'CS Sfaxien', date:'2026-03-22', time:'15:00', competition:'Ligue 1 Professionnelle', venue:'Stade Abdelaziz Chtioui' },
        { id: generateId(), homeTeam:'CS Sfaxien', awayTeam:'Étoile du Sahel', date:'2026-04-05', time:'16:00', competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri' },
        { id: generateId(), homeTeam:'Espérance de Tunis', awayTeam:'CS Sfaxien', date:'2026-04-12', time:'20:00', competition:'Ligue 1 Professionnelle', venue:'Stade Hammadi Agrebi' },
        { id: generateId(), homeTeam:'CS Sfaxien', awayTeam:'Olympique Béja', date:'2026-04-19', time:'16:00', competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri' },
        { id: generateId(), homeTeam:'AS Soliman', awayTeam:'CS Sfaxien', date:'2026-04-26', time:'15:00', competition:'Ligue 1 Professionnelle', venue:'Stade Municipal de Soliman' },
        { id: generateId(), homeTeam:'CS Sfaxien', awayTeam:'Stade Tunisien', date:'2026-05-03', time:'16:00', competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri' },
    ]);

    // REAL 2025-26 Ligue 1 standings (all 16 teams, updated 1 Mar 2026 — 22 matches played)
    DataManager.save('standings', [
        { id: generateId(), name:'Espérance de Tunis', isOurTeam:false, played:22, won:15, drawn:5, lost:2, goalsFor:39, goalsAgainst:7, points:50 },
        { id: generateId(), name:'Club Africain', isOurTeam:false, played:22, won:14, drawn:6, lost:2, goalsFor:33, goalsAgainst:8, points:48 },
        { id: generateId(), name:'Stade Tunisien', isOurTeam:false, played:22, won:12, drawn:8, lost:2, goalsFor:27, goalsAgainst:7, points:44 },
        { id: generateId(), name:'CS Sfaxien', isOurTeam:true, played:22, won:12, drawn:6, lost:4, goalsFor:29, goalsAgainst:11, points:42 },
        { id: generateId(), name:'US Monastir', isOurTeam:false, played:22, won:9, drawn:10, lost:3, goalsFor:23, goalsAgainst:13, points:37 },
        { id: generateId(), name:'Étoile du Sahel', isOurTeam:false, played:22, won:9, drawn:6, lost:7, goalsFor:22, goalsAgainst:18, points:33 },
        { id: generateId(), name:'JS El Omrane', isOurTeam:false, played:22, won:8, drawn:4, lost:10, goalsFor:17, goalsAgainst:25, points:28 },
        { id: generateId(), name:'ES Zarzis', isOurTeam:false, played:22, won:7, drawn:6, lost:9, goalsFor:20, goalsAgainst:23, points:27 },
        { id: generateId(), name:'ES Métlaoui', isOurTeam:false, played:22, won:6, drawn:9, lost:7, goalsFor:14, goalsAgainst:23, points:27 },
        { id: generateId(), name:'AS Marsa', isOurTeam:false, played:22, won:8, drawn:1, lost:13, goalsFor:20, goalsAgainst:24, points:25 },
        { id: generateId(), name:'CA Bizertin', isOurTeam:false, played:22, won:6, drawn:7, lost:9, goalsFor:12, goalsAgainst:20, points:25 },
        { id: generateId(), name:'US Ben Guerdane', isOurTeam:false, played:22, won:5, drawn:9, lost:8, goalsFor:14, goalsAgainst:19, points:24 },
        { id: generateId(), name:'JS Kairouan', isOurTeam:false, played:22, won:6, drawn:3, lost:13, goalsFor:15, goalsAgainst:33, points:21 },
        { id: generateId(), name:'Olympique Béja', isOurTeam:false, played:22, won:5, drawn:3, lost:14, goalsFor:11, goalsAgainst:34, points:18 },
        { id: generateId(), name:'AS Gabès', isOurTeam:false, played:22, won:3, drawn:8, lost:11, goalsFor:10, goalsAgainst:25, points:17 },
        { id: generateId(), name:'AS Soliman', isOurTeam:false, played:22, won:2, drawn:7, lost:13, goalsFor:9, goalsAgainst:25, points:13 },
    ]);

    DataManager.save('products', [
        { id: generateId(), name:'Maillot Domicile CSS 2025/26', price:89, description:'Le maillot officiel noir et blanc du CS Sfaxien. Tissu Adidas Aeroready respirant.', image:'', badge:'Nouveau' },
        { id: generateId(), name:'Maillot Extérieur CSS 2025/26', price:89, description:'Maillot extérieur tout blanc avec détails noirs. Design élégant et moderne.', image:'', badge:'Nouveau' },
        { id: generateId(), name:'Maillot Third CSS 2025/26', price:85, description:'Le troisième maillot rouge et noir. Édition spéciale matchs continentaux.', image:'', badge:'Exclusif' },
        { id: generateId(), name:'Écharpe CS Sfaxien', price:25, description:'Écharpe tissée noir et blanc. Indispensable au Taïeb Mhiri.', image:'', badge:'' },
        { id: generateId(), name:'Casquette Logo CSS', price:30, description:'Casquette brodée avec le logo officiel du Club Sportif Sfaxien.', image:'', badge:'Promo' },
        { id: generateId(), name:'Survêtement CSS', price:120, description:"Survêtement complet noir utilisé par les joueurs à l'entraînement.", image:'', badge:'' },
        { id: generateId(), name:'Ballon CS Sfaxien', price:45, description:'Ballon officiel taille 5 aux couleurs noir et blanc du club.', image:'', badge:'-15%' },
        { id: generateId(), name:'Veste Coupe-vent CSS', price:95, description:'Veste imperméable avec le logo CSS brodé.', image:'', badge:'' },
    ]);

    DataManager.save('news', [
        { id: generateId(), title:'CSS 1-0 AS Gabès : 6ème victoire consécutive !', category:'Match', date:'2026-02-28', content:"Le CS Sfaxien continue sur sa lancée avec une victoire 1-0 face à l'AS Gabès au Stade Taïeb Mhiri.\n\nOmar Ben Ali a inscrit le seul but de la rencontre, portant son total à 8 buts cette saison, se hissant au 2ème rang des meilleurs buteurs de la Ligue 1.\n\nAvec cette 6ème victoire consécutive, le CSS conforte sa 4ème place au classement avec 42 points.", image:'' },
        { id: generateId(), title:'ESS 0-1 CSS : Victoire au derby à Sousse !', category:'Match', date:'2026-02-15', content:"Le CS Sfaxien s'est imposé 1-0 face à l'Étoile du Sahel au Stade Olympique de Sousse dans un derby du Sahel très disputé.\n\nIyed Belwafi a inscrit le but de la victoire à la 63ème minute sur une passe décisive d'Ali Maâloul.\n\nUne victoire précieuse à l'extérieur pour les Noir et Blanc sous la direction de Mohamed Kouki.", image:'' },
        { id: generateId(), title:'CSS 2-0 JS El Omrane : La série continue', category:'Match', date:'2026-02-01', content:"Le Club Sportif Sfaxien a dominé JS El Omrane 2-0 au Taïeb Mhiri.\n\nButs de Hichem Baccar (34') et Omar Ben Ali (71'). Baccar est le 5ème meilleur buteur de la Ligue 1 avec 7 réalisations.\n\nLe coach Mohamed Kouki s'est dit satisfait : \"L'équipe montre une grande solidité collective.\"", image:'' },
        { id: generateId(), title:'Omar Ben Ali : 2ème meilleur buteur de la Ligue 1 !', category:'Actualité', date:'2026-02-25', content:"L'attaquant sfaxien Omar Ben Ali est le 2ème meilleur buteur de la Ligue 1 Professionnelle avec 8 buts, derrière Firas Chaouat du Club Africain (13 buts).\n\nAvec Hichem Baccar (7 buts) et Iyed Belwafi (6 buts), le CSS possède 3 joueurs dans le top 10 des meilleurs buteurs du championnat.\n\nUne force offensive remarquable pour cette saison.", image:'' },
        { id: generateId(), title:'CSS 4ème avec 42 points : Objectif podium !', category:'Actualité', date:'2026-03-01', content:"Après 22 journées, le CS Sfaxien occupe la 4ème place avec 42 points (12V, 6N, 4D), à 8 points du leader Espérance de Tunis.\n\nAvec la plus longue série de victoires du championnat (6 matchs), les Noir et Blanc visent le podium en fin de saison.\n\n8 matchs restants dont un déplacement crucial à l'Espérance le 12 avril.", image:'' },
        { id: generateId(), title:'Ali Maâloul capitaine exemplaire', category:'Actualité', date:'2026-02-20', content:"Le capitaine Ali Maâloul (n°10) continue de porter le brassard avec excellence cette saison.\n\nLeader défensif incontesté, le latéral gauche international tunisien enchaîne les performances de haut niveau.\n\n\"Porter le maillot noir et blanc est un honneur quotidien\", a déclaré Maâloul après la victoire contre l'ESS.", image:'' },
        { id: generateId(), title:'Mohamed Kouki : la tactique gagnante', category:'Entraînement', date:'2026-02-12', content:"L'entraîneur Mohamed Kouki a mis en place un système tactique qui porte ses fruits cette saison.\n\nTravail sur les transitions rapides et la solidité défensive. Le CSS n'a encaissé que 11 buts en 22 matchs, la 4ème meilleure défense du championnat.\n\nAvec des renforts comme Travis Mutyaba (UGA), Bouara Diarra (MLI) et Willy Onana (CMR), l'effectif est solide.", image:'' },
        { id: generateId(), title:'Aymen Dahmen de retour en forme', category:'Entraînement', date:'2026-02-08', content:"Le gardien international tunisien Aymen Dahmen a repris la compétition après une période sur le banc.\n\nAvec Mohamed Hedi Gaaloul en premier choix, la concurrence au poste de gardien est saine et pousse chaque joueur à donner le meilleur.\n\n\"La compétition interne renforce l'équipe\", a souligné le coach Kouki.", image:'' },
        { id: generateId(), title:'Prochain match : US Monastir vs CSS le 7 mars', category:'Actualité', date:'2026-03-01', content:"Le CS Sfaxien se déplacera au Stade Mustapha Ben Jannet pour affronter l'US Monastir (5ème, 37 pts) le 7 mars à 14h00.\n\nMatch important face à un adversaire direct pour le top 4.\n\nSuivi de 7 autres matchs dont CSS vs Étoile du Sahel (5 avr.) et Espérance de Tunis vs CSS (12 avr.).", image:'' },
        { id: generateId(), title:'CSS 4-0 CA Bizertin : Démonstration de force', category:'Match', date:'2025-12-14', content:"Le CS Sfaxien a signé sa plus large victoire de la saison en atomisant le CA Bizertin 4-0 au Stade Taïeb Mhiri.\n\nOmar Ben Ali auteur d'un doublé, accompagné de buts de Baccar et Belwafi.\n\nUne démonstration de la puissance offensive sfaxienne devant un public en feu.", image:'' },
        { id: generateId(), title:'Journée portes ouvertes au Taïeb Mhiri', category:'Communiqué', date:'2026-02-05', content:"Le CS Sfaxien organise une journée portes ouvertes au Stade Taïeb Mhiri !\n\n- 10h00 : Visite des installations\n- 11h00 : Entraînement ouvert\n- 14h00 : Séance de dédicaces avec les joueurs\n- 15h00 : Mini-tournoi pour les jeunes\n\nEntrée gratuite ! Capacité d'accueil : 22 000 places.", image:'' },
        { id: generateId(), title:'Nouvelle boutique en ligne officielle du CSS', category:'Communiqué', date:'2026-01-28', content:"Le Club Sportif Sfaxien, sous la présidence de Mehdi Frikha, lance sa boutique en ligne officielle !\n\nMaillots, écharpes, casquettes et bien plus encore.\n\nCode promo : CSS2026 pour -15% sur la première commande.\n\nLivraison gratuite en Tunisie dès 100 DT.", image:'' },
        { id: generateId(), title:'Saison centenaire : 100ème édition de la Ligue 1', category:'Communiqué', date:'2025-08-09', content:"La saison 2025-26 marque la 100ème édition de la Ligue 1 Tunisienne !\n\n16 équipes s'affrontent dont le CS Sfaxien, fondé en 1928 et 8 fois champion de Tunisie.\n\nLe club évolue au Stade Taïeb Mhiri (22 000 places) à Sfax, sous la direction de l'entraîneur Mohamed Kouki et du président Mehdi Frikha.", image:'' },
    ]);

    // Players (Effectif)
    DataManager.save('players', [
        { id: generateId(), category:'coach', name:'Mohamed Kouki', role:'Entraîneur Principal', nationality:'🇹🇳 Tunisie', icon:'fas fa-chalkboard-teacher' },
        { id: generateId(), category:'staff', name:'Staff Technique CSS', role:'Entraîneur Adjoint', nationality:'🇹🇳 Tunisie', icon:'fas fa-clipboard' },
        { id: generateId(), category:'staff', name:'Staff Gardiens CSS', role:'Entraîneur des Gardiens', nationality:'🇹🇳 Tunisie', icon:'fas fa-hands' },
        { id: generateId(), category:'staff', name:'Préparateur CSS', role:'Préparateur Physique', nationality:'🇹🇳 Tunisie', icon:'fas fa-dumbbell' },
        { id: generateId(), category:'staff', name:'Médecin CSS', role:'Médecin du Club', nationality:'🇹🇳 Tunisie', icon:'fas fa-stethoscope' },
        { id: generateId(), category:'staff', name:'Analyste CSS', role:'Analyste Vidéo', nationality:'🇹🇳 Tunisie', icon:'fas fa-video' },
        { id: generateId(), category:'goalkeepers', name:'Mohamed Hedi Gaaloul', number:1, nationality:'🇹🇳', age:28, value:'800K €', image:'https://ui-avatars.com/api/?name=MG&background=000&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:18, buts:0, cleanSheets:9, arrets:52 }},
        { id: generateId(), category:'goalkeepers', name:'Araysi', number:16, nationality:'🇹🇳', age:25, value:'300K €', image:'https://ui-avatars.com/api/?name=AR&background=111&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:2, buts:0, cleanSheets:1, arrets:8 }},
        { id: generateId(), category:'goalkeepers', name:'Aymen Dahmen', number:30, nationality:'🇹🇳', age:27, value:'1.5M €', image:'https://ui-avatars.com/api/?name=AD&background=222&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:4, buts:0, cleanSheets:2, arrets:15 }},
        { id: generateId(), category:'goalkeepers', name:'Mohamed Ali Jamiaa', number:31, nationality:'🇹🇳', age:22, value:'150K €', image:'https://ui-avatars.com/api/?name=MJ&background=333&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:0, buts:0, cleanSheets:0, arrets:0 }},
        { id: generateId(), category:'defenders', name:'Mohamed Ali Ben Ali', number:3, nationality:'🇹🇳', age:27, value:'600K €', image:'https://ui-avatars.com/api/?name=MB&background=000&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:18, buts:1, passes:2, tacles:45 }},
        { id: generateId(), category:'defenders', name:'Abdessalem Akid', number:5, nationality:'🇹🇳', age:29, value:'700K €', image:'https://ui-avatars.com/api/?name=AA&background=111&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:20, buts:0, passes:1, tacles:58 }},
        { id: generateId(), category:'defenders', name:'Ali Maâloul', number:10, nationality:'🇹🇳', age:35, value:'1.0M €', image:'https://ui-avatars.com/api/?name=AM&background=000&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:21, buts:2, passes:6, tacles:38 }},
        { id: generateId(), category:'defenders', name:'Rayane Derbali', number:13, nationality:'🇹🇳', age:24, value:'500K €', image:'https://ui-avatars.com/api/?name=RD&background=222&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:15, buts:0, passes:3, tacles:35 }},
        { id: generateId(), category:'defenders', name:'Kévin Mondeko', number:15, nationality:'🇨🇩', age:28, value:'800K €', image:'https://ui-avatars.com/api/?name=KM&background=111&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:19, buts:1, passes:2, tacles:52 }},
        { id: generateId(), category:'defenders', name:'Mohamed S. Mhadhebi', number:17, nationality:'🇹🇳', age:26, value:'400K €', image:'https://ui-avatars.com/api/?name=MM&background=222&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:14, buts:0, passes:1, tacles:30 }},
        { id: generateId(), category:'defenders', name:'Hichem Baccar', number:21, nationality:'🇹🇳', age:28, value:'1.2M €', image:'https://ui-avatars.com/api/?name=HB&background=000&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:22, buts:7, passes:3, tacles:42 }},
        { id: generateId(), category:'defenders', name:'Hamza Mathlouthi', number:24, nationality:'🇹🇳', age:30, value:'800K €', image:'https://ui-avatars.com/api/?name=HM&background=111&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:20, buts:1, passes:2, tacles:55 }},
        { id: generateId(), category:'defenders', name:'Firas Sekkouhi', number:25, nationality:'🇹🇳', age:23, value:'350K €', image:'https://ui-avatars.com/api/?name=FS&background=222&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:10, buts:0, passes:1, tacles:22 }},
        { id: generateId(), category:'defenders', name:'Chaouki Ben Khader', number:26, nationality:'🇹🇳', age:25, value:'300K €', image:'https://ui-avatars.com/api/?name=CB&background=000&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:8, buts:0, passes:0, tacles:18 }},
        { id: generateId(), category:'defenders', name:'Froukh', number:37, nationality:'🇹🇳', age:21, value:'150K €', image:'https://ui-avatars.com/api/?name=FR&background=111&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:3, buts:0, passes:0, tacles:6 }},
        { id: generateId(), category:'midfielders', name:'Youssef Habchia', number:4, nationality:'🇹🇳', age:26, value:'500K €', image:'https://ui-avatars.com/api/?name=YH&background=000&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:16, buts:1, passes:4, tacles:32 }},
        { id: generateId(), category:'midfielders', name:'Ammar Taifour', number:6, nationality:'🇸🇩', age:27, value:'600K €', image:'https://ui-avatars.com/api/?name=AT&background=111&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:18, buts:2, passes:5, tacles:38 }},
        { id: generateId(), category:'midfielders', name:'Travis Mutyaba', number:12, nationality:'🇺🇬', age:22, value:'700K €', image:'https://ui-avatars.com/api/?name=TM&background=222&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:15, buts:3, passes:4, tacles:20 }},
        { id: generateId(), category:'midfielders', name:'Nour Karoui', number:19, nationality:'🇹🇳', age:24, value:'400K €', image:'https://ui-avatars.com/api/?name=NK&background=000&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:12, buts:1, passes:3, tacles:18 }},
        { id: generateId(), category:'midfielders', name:'Thameur Abidi', number:20, nationality:'🇹🇳', age:23, value:'300K €', image:'https://ui-avatars.com/api/?name=TA&background=111&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:10, buts:0, passes:2, tacles:15 }},
        { id: generateId(), category:'midfielders', name:'Mohamed Absi', number:22, nationality:'🇹🇳', age:25, value:'450K €', image:'https://ui-avatars.com/api/?name=MA&background=222&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:14, buts:1, passes:3, tacles:25 }},
        { id: generateId(), category:'midfielders', name:'Mohamed Aidi', number:23, nationality:'🇹🇳', age:24, value:'300K €', image:'https://ui-avatars.com/api/?name=MI&background=000&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:8, buts:0, passes:1, tacles:12 }},
        { id: generateId(), category:'midfielders', name:'Bouara Diarra', number:27, nationality:'🇲🇱', age:26, value:'650K €', image:'https://ui-avatars.com/api/?name=BD&background=111&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:17, buts:2, passes:6, tacles:35 }},
        { id: generateId(), category:'midfielders', name:'Rayen Chaâban', number:28, nationality:'🇹🇳', age:22, value:'200K €', image:'https://ui-avatars.com/api/?name=RC&background=222&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:6, buts:0, passes:1, tacles:10 }},
        { id: generateId(), category:'midfielders', name:'Hassamadou Ouédraogo', number:32, nationality:'🇧🇫', age:25, value:'500K €', image:'https://ui-avatars.com/api/?name=HO&background=000&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:13, buts:1, passes:3, tacles:22 }},
        { id: generateId(), category:'midfielders', name:'Mohamed Trabelsi', number:33, nationality:'🇹🇳', age:23, value:'250K €', image:'https://ui-avatars.com/api/?name=MT&background=111&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:9, buts:0, passes:2, tacles:14 }},
        { id: generateId(), category:'attackers', name:'Willy Onana', number:7, nationality:'🇨🇲', age:27, value:'800K €', image:'https://ui-avatars.com/api/?name=WO&background=000&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:19, buts:4, passes:5, tirs:42 }},
        { id: generateId(), category:'attackers', name:'Omar Ben Ali', number:9, nationality:'🇹🇳', age:26, value:'1.5M €', image:'https://ui-avatars.com/api/?name=OB&background=111&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:22, buts:8, passes:3, tirs:55 }},
        { id: generateId(), category:'attackers', name:'Iyed Belwafi', number:11, nationality:'🇹🇳', age:27, value:'1.0M €', image:'https://ui-avatars.com/api/?name=IB&background=222&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:20, buts:6, passes:4, tirs:38 }},
        { id: generateId(), category:'attackers', name:'Jouini', number:14, nationality:'🇹🇳', age:28, value:'600K €', image:'https://ui-avatars.com/api/?name=JO&background=000&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:15, buts:3, passes:2, tirs:28 }},
        { id: generateId(), category:'attackers', name:'Emmanuel A. Ogbole', number:18, nationality:'🇳🇬', age:25, value:'500K €', image:'https://ui-avatars.com/api/?name=EO&background=111&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:12, buts:2, passes:1, tirs:22 }},
        { id: generateId(), category:'attackers', name:'Youssef Becha', number:39, nationality:'🇹🇳', age:21, value:'200K €', image:'https://ui-avatars.com/api/?name=YB&background=222&color=fff&size=300&font-size=0.4&bold=true', stats:{ matchs:5, buts:1, passes:0, tirs:10 }},
    ]);

    // Gallery
    DataManager.save('gallery', [
        { id: generateId(), title:'CSS 4-0 CA Bizertin : Démonstration', desc:'Les joueurs célèbrent la victoire écrasante 4-0 au Stade Taïeb Mhiri', category:'match-photo', type:'photo', layout:'wide', date:'2025-12-14' },
        { id: generateId(), title:'Omar Ben Ali : Doublé face au CAB', desc:'Omar Ben Ali, 2ème meilleur buteur de la L1 avec 8 buts, célèbre son doublé', category:'match-photo', type:'photo', layout:'', date:'2025-12-14' },
        { id: generateId(), title:'Duel aérien face à l\'ESS', desc:'Kévin Mondeko remporte un duel aérien au derby du Sahel à Sousse', category:'match-photo', type:'photo', layout:'', date:'2026-02-15' },
        { id: generateId(), title:'Entrée des joueurs', desc:'L\'entrée sur le terrain sous les fumigènes noir et blanc au Taïeb Mhiri', category:'match-photo', type:'photo', layout:'wide', date:'2026-02-28' },
        { id: generateId(), title:'Passe décisive de Maâloul', desc:'Ali Maâloul, capitaine et n°10, délivre une passe décisive', category:'match-photo', type:'photo', layout:'', date:'2026-02-15' },
        { id: generateId(), title:'Célébration collective', desc:'L\'équipe fête la 6ème victoire consécutive en championnat', category:'match-photo', type:'photo', layout:'tall', date:'2026-02-28' },
        { id: generateId(), title:'Gaaloul — Arrêt décisif', desc:'Mohamed Hedi Gaaloul réalise un arrêt réflexe en première mi-temps', category:'match-photo', type:'photo', layout:'', date:'2026-02-22' },
        { id: generateId(), title:'Belwafi frappe au but', desc:'Iyed Belwafi déclenche une frappe en pleine surface (6 buts cette saison)', category:'match-photo', type:'photo', layout:'', date:'2026-02-15' },
        { id: generateId(), title:'Séance tactique au tableau', desc:'Le coach Mohamed Kouki explique le plan de jeu sur le tableau tactique', category:'training-photo', type:'photo', layout:'wide', date:'2026-02-25' },
        { id: generateId(), title:'Exercice de passes', desc:'Travis Mutyaba et Bouara Diarra travaillent la circulation de balle', category:'training-photo', type:'photo', layout:'', date:'2026-02-20' },
        { id: generateId(), title:'Préparation physique', desc:'Séance de musculation et endurance au centre sportif de Sfax', category:'training-photo', type:'photo', layout:'', date:'2026-02-22' },
        { id: generateId(), title:'Entraînement des gardiens', desc:'Gaaloul et Aymen Dahmen à l\'entraînement spécifique', category:'training-photo', type:'photo', layout:'', date:'2026-02-18' },
        { id: generateId(), title:'Jeu de position', desc:'Exercice de conservation et pressing collectif', category:'training-photo', type:'photo', layout:'tall', date:'2026-02-24' },
        { id: generateId(), title:'Échauffement d\'avant-match', desc:'Les joueurs s\'échauffent avant le coup d\'envoi au Taïeb Mhiri', category:'training-photo', type:'photo', layout:'', date:'2026-02-28' },
        { id: generateId(), title:'Stage à Hammamet', desc:'L\'équipe lors du stage de préparation hivernal', category:'training-photo', type:'photo', layout:'wide', date:'2026-01-20' },
        { id: generateId(), title:'Résumé CSS 4-0 CA Bizertin', desc:'Tous les buts et les temps forts de la victoire 4-0', category:'video', type:'video', layout:'wide', date:'2025-12-14', duration:'8:22', videoUrl:'#' },
        { id: generateId(), title:'Résumé ESS 0-1 CSS', desc:'La victoire au derby du Sahel à Sousse — But de Belwafi', category:'video', type:'video', layout:'', date:'2026-02-15', duration:'6:45', videoUrl:'#' },
        { id: generateId(), title:'Conférence de presse — Coach Kouki', desc:'Mohamed Kouki s\'exprime après la 6ème victoire consécutive', category:'video', type:'video', layout:'', date:'2026-02-28', duration:'12:30', videoUrl:'#' },
        { id: generateId(), title:'Coulisses du vestiaire', desc:'Accès exclusif au vestiaire après la victoire contre l\'AS Gabès', category:'video', type:'video', layout:'', date:'2026-02-28', duration:'5:15', videoUrl:'#' },
        { id: generateId(), title:'Entraînement — Préparation tactique', desc:'La séance tactique complète avant le derby du Sahel', category:'video', type:'video', layout:'wide', date:'2026-02-13', duration:'15:40', videoUrl:'#' },
        { id: generateId(), title:'Interview Omar Ben Ali', desc:'"Objectif podium" — Le meilleur buteur du CSS se confie', category:'video', type:'video', layout:'', date:'2026-03-01', duration:'9:55', videoUrl:'#' },
        { id: generateId(), title:'Top 5 buts du mois de février', desc:'Les 5 plus beaux buts du CSS en février 2026', category:'video', type:'video', layout:'', date:'2026-03-02', duration:'4:10', videoUrl:'#' },
        { id: generateId(), title:'Ambiance au Taïeb Mhiri', desc:'L\'atmosphère électrique lors du match au sommet', category:'video', type:'video', layout:'', date:'2026-02-28', duration:'3:30', videoUrl:'#' },
        { id: generateId(), title:'Supporters Sfaxiens', desc:'Les ultras noir et blanc au grand complet', category:'fans', type:'photo', layout:'tall', date:'2026-02-28' },
        { id: generateId(), title:'Tifo géant tribune Nord', desc:'Tifo spectaculaire déployé en tribune nord couvrant tout le virage', category:'fans', type:'photo', layout:'wide', date:'2026-02-14' },
        { id: generateId(), title:'Craquage de fumigènes', desc:'Fumigènes noir et blanc en virage sud au derby', category:'fans', type:'photo', layout:'', date:'2026-02-28' },
        { id: generateId(), title:'Cortège des supporters', desc:'Le cortège des fans avant le match au centre-ville de Sfax', category:'fans', type:'photo', layout:'', date:'2026-02-14' },
        { id: generateId(), title:'Stade Taïeb Mhiri — Vue aérienne', desc:'Vue panoramique du stade mythique de Sfax', category:'stadium', type:'photo', layout:'wide', date:'2026-01-15' },
        { id: generateId(), title:'Pelouse impeccable', desc:'La pelouse en préparation avant le grand derby', category:'stadium', type:'photo', layout:'', date:'2026-02-27' },
        { id: generateId(), title:'Stade illuminé', desc:'Le Taïeb Mhiri illuminé lors du match de nuit en CAF', category:'stadium', type:'photo', layout:'', date:'2026-03-01' },
        { id: generateId(), title:'Travaux de rénovation', desc:'Les nouveaux sièges installés dans la tribune principale', category:'stadium', type:'photo', layout:'', date:'2026-02-10' },
    ]);

    // Timeline
    DataManager.save('timeline', [
        { id: generateId(), year:'1928', icon:'fa-flag', title:'Fondation du Club', desc:'Le Club Sportif Sfaxien est fondé le 28 mai 1928 à Sfax, devenant l\'un des clubs les plus emblématiques du football tunisien et africain.' },
        { id: generateId(), year:'1969', icon:'fa-trophy', title:'Premier Titre de Champion', desc:'Le CSS remporte son premier titre de champion de Tunisie, marquant le début d\'une ère de domination dans le football national.' },
        { id: generateId(), year:'1998', icon:'fa-medal', title:'Coupe de la CAF', desc:'Victoire historique en Coupe de la CAF, le premier titre continental du club, ouvrant la porte aux succès africains.' },
        { id: generateId(), year:'2007', icon:'fa-star', title:'Triplé Historique', desc:'Le CSS réalise un triplé exceptionnel : Championnat, Coupe de Tunisie et Coupe de la Confédération CAF. Début d\'une série de 3 titres continentaux (2007, 2008, 2013).' },
        { id: generateId(), year:'2013', icon:'fa-futbol', title:'3ème Confédération CAF', desc:'Le CSS remporte sa 3ème Coupe de la Confédération CAF, consolidant son statut de club le plus titré dans cette compétition.' },
        { id: generateId(), year:'2014', icon:'fa-earth-africa', title:'Ligue des Champions CAF — Finale', desc:'Le CSS atteint la finale de la Ligue des Champions africaine, confirmant son statut parmi l\'élite du football continental.' },
        { id: generateId(), year:'2022', icon:'fa-shield-halved', title:'8ème Titre de Champion', desc:'Le CSS remporte son 8ème titre de champion de Tunisie, confirmant sa constance au plus haut niveau du football national.' },
        { id: generateId(), year:'2025', icon:'fa-fire', title:'Saison Centenaire', desc:'La saison 2025-26 marque la 100ème édition de la Ligue 1 Tunisienne. Sous la direction de Mohamed Kouki et la présidence de Mehdi Frikha, le CSS vise le podium.' },
    ]);

    // Trophies
    DataManager.save('trophies', [
        { id: generateId(), name:'Championnat de Tunisie', icon:'fa-trophy', count:8, years:['1969','1971','1981','1995','2000','2007','2013','2022'] },
        { id: generateId(), name:'Coupe de Tunisie', icon:'fa-medal', count:7, years:['1963','1966','1983','1999','2007','2009','2023'] },
        { id: generateId(), name:'Coupe de la Confédération CAF', icon:'fa-globe', count:3, years:['2007','2008','2013'] },
        { id: generateId(), name:'Coupe de la CAF', icon:'fa-earth-africa', count:1, years:['1998'] },
        { id: generateId(), name:'Coupe Arabe des Clubs', icon:'fa-shield-halved', count:2, years:['2004','2015'] },
        { id: generateId(), name:'Supercoupe de Tunisie', icon:'fa-star', count:3, years:['2000','2007','2022'] },
    ]);

    // Legends
    DataManager.save('legends', [
        { id: generateId(), name:'Abdelmajid Chetali', position:'Entraîneur', era:'1970s-80s', number:'', desc:'Entraîneur légendaire qui a façonné l\'identité du CSS. Il a conduit le club à ses premiers grands succès.', image:'https://ui-avatars.com/api/?name=A+Chetali&size=400&background=000&color=fff&bold=true', stats:{ années:'15+', titres:5, matchs:'500+' }},
        { id: generateId(), name:'Raouf Ben Aziza', position:'Milieu', era:'1990s-2000s', number:'10', desc:'Le maestro du milieu de terrain sfaxien. Technicien hors pair.', image:'https://ui-avatars.com/api/?name=R+Ben+Aziza&size=400&background=1a1a1a&color=fff&bold=true', stats:{ matchs:350, buts:67, passes:120 }},
        { id: generateId(), name:'Karim Haggui', position:'Défenseur', era:'2000s', number:'4', desc:'Défenseur central d\'exception, brillant au CSS puis en Europe.', image:'https://ui-avatars.com/api/?name=K+Haggui&size=400&background=333&color=fff&bold=true', stats:{ matchs:180, buts:15, sélections:50 }},
        { id: generateId(), name:'Anis Boussaïdi', position:'Attaquant', era:'2000s-2010s', number:'9', desc:'Buteur prolifique et icône offensive du CSS.', image:'https://ui-avatars.com/api/?name=A+Boussaidi&size=400&background=111&color=fff&bold=true', stats:{ matchs:220, buts:95, titres:6 }},
        { id: generateId(), name:'Mohamed Ali Mahjoubi', position:'Milieu', era:'2010s', number:'8', desc:'Milieu de terrain dynamique, capitaine charismatique du CSS.', image:'https://ui-avatars.com/api/?name=MA+Mahjoubi&size=400&background=222&color=fff&bold=true', stats:{ matchs:280, buts:42, passes:85 }},
        { id: generateId(), name:'Fakhreddine Ben Youssef', position:'Attaquant', era:'2010s-2020s', number:'11', desc:'Attaquant international tunisien, participant à la Coupe du Monde 2018.', image:'https://ui-avatars.com/api/?name=F+Ben+Youssef&size=400&background=0a0a0a&color=fff&bold=true', stats:{ matchs:150, buts:55, sélections:40 }},
    ]);

    // Ticket Matches
    DataManager.save('ticketMatches', [
        { id: generateId(), home:'CS Sfaxien', away:'JS Kairouan', date:'14 Mars 2026', time:'16:00', comp:'Ligue 1 — J24', venue:'Stade Taïeb Mhiri', available:true },
        { id: generateId(), home:'CS Sfaxien', away:'Étoile du Sahel', date:'5 Avril 2026', time:'16:00', comp:'Ligue 1 — J26', venue:'Stade Taïeb Mhiri', available:true },
        { id: generateId(), home:'CS Sfaxien', away:'Olympique Béja', date:'19 Avril 2026', time:'16:00', comp:'Ligue 1 — J28', venue:'Stade Taïeb Mhiri', available:true },
        { id: generateId(), home:'CS Sfaxien', away:'Stade Tunisien', date:'3 Mai 2026', time:'16:00', comp:'Ligue 1 — J30', venue:'Stade Taïeb Mhiri', available:true },
        { id: generateId(), home:'CS Sfaxien', away:'AS Soliman', date:'17 Mai 2026', time:'16:00', comp:'Coupe de Tunisie', venue:'Stade Taïeb Mhiri', available:false },
        { id: generateId(), home:'CS Sfaxien', away:'Club Africain', date:'31 Mai 2026', time:'16:00', comp:'Coupe de Tunisie', venue:'Stade Taïeb Mhiri', available:false },
    ]);

    // Stadium Zones
    DataManager.save('stadiumZones', [
        { id: generateId(), name:'Tribune Nord', price:15, available:5200, total:7000 },
        { id: generateId(), name:'Tribune Sud', price:15, available:4800, total:7000 },
        { id: generateId(), name:'Tribune Ouest', price:25, available:2600, total:5000 },
        { id: generateId(), name:'Tribune Est (VIP)', price:50, available:1200, total:3000 },
    ]);

    // Subscription Plans
    DataManager.save('subPlans', [
        { id: generateId(), name:'Gradin', price:120, period:'Saison 2025-2026', icon:'fa-users', description:'Tribune populaire — Ambiance garantie', featured:false, features:[{icon:'fa-check',text:'Tribune Nord ou Sud — Place libre'},{icon:'fa-check',text:'15 matchs de championnat'},{icon:'fa-check',text:'Carte de membre digitale'},{icon:'fa-check',text:'-5% à la boutique officielle'},{icon:'fa-times',text:'Matchs de coupe non inclus'},{icon:'fa-times',text:'Kit de bienvenue'}]},
        { id: generateId(), name:'Chaise', price:250, period:'Saison 2025-2026', icon:'fa-chair', description:'Place assise numérotée — Confort assuré', featured:false, features:[{icon:'fa-check',text:'Tribune Ouest — Siège numéroté'},{icon:'fa-check',text:'Tous les matchs à domicile'},{icon:'fa-check',text:'Carte de membre physique'},{icon:'fa-check',text:'-10% à la boutique officielle'},{icon:'fa-check',text:'Accès matchs de coupe'},{icon:'fa-times',text:'Kit de bienvenue'}]},
        { id: generateId(), name:'Centrale', price:450, period:'Saison 2025-2026', icon:'fa-star', description:'Tribune centrale — Vue optimale', featured:true, features:[{icon:'fa-check',text:'Tribune Centrale — Meilleure vue'},{icon:'fa-check',text:'Tous les matchs (dom. + coupe)'},{icon:'fa-check',text:'Carte Premium personnalisée'},{icon:'fa-check',text:'-15% à la boutique officielle'},{icon:'fa-check',text:'Kit de bienvenue (écharpe)'},{icon:'fa-check',text:'Accès prioritaire au stade'}]},
        { id: generateId(), name:'Loge', price:800, period:'Saison 2025-2026', icon:'fa-gem', description:'Loge privée — Expérience exclusive', featured:false, features:[{icon:'fa-check',text:'Loge VIP privée — Service premium'},{icon:'fa-check',text:'Tous les matchs + événements'},{icon:'fa-check',text:'Carte VIP Gold personnalisée'},{icon:'fa-check',text:'-20% à la boutique officielle'},{icon:'fa-check',text:'Kit complet (maillot + écharpe)'},{icon:'fa-check',text:'Parking réservé + Salon VIP + Buffet'}]},
    ]);

    // Meetings (Match Info)
    DataManager.save('meetings', [
        { id: generateId(), date:'01/03/2026', home:'CSS', away:'EST', score:'1 - 2', result:'loss' },
        { id: generateId(), date:'15/02/2026', home:'ESS', away:'CSS', score:'0 - 1', result:'win' },
        { id: generateId(), date:'08/02/2026', home:'USBG', away:'CSS', score:'0 - 1', result:'win' },
        { id: generateId(), date:'01/02/2026', home:'CSS', away:'JSO', score:'2 - 0', result:'win' },
        { id: generateId(), date:'25/01/2026', home:'CSS', away:'ESM', score:'2 - 0', result:'win' },
    ]);

    // Lineup
    DataManager.save('lineup', [
        [{ number:1, name:'Gaaloul' }],
        [{ number:10, name:'Maâloul' }, { number:5, name:'Akid' }, { number:15, name:'Mondeko' }, { number:24, name:'Mathlouthi' }],
        [{ number:6, name:'Taifour' }, { number:27, name:'Diarra' }, { number:12, name:'Mutyaba' }],
        [{ number:7, name:'Onana' }, { number:9, name:'O. Ben Ali' }, { number:11, name:'Belwafi' }]
    ]);

    // Donors
    DataManager.save('donors', [
        { id: generateId(), name:'Mohamed Trabelsi', amount:'500 TND' },
        { id: generateId(), name:'Ahmed Ben Salem', amount:'250 TND' },
        { id: generateId(), name:'Fatma Karray', amount:'100 TND' },
        { id: generateId(), name:'Donateur Anonyme', amount:'1,000 TND' },
        { id: generateId(), name:'Nabil Chaari', amount:'200 TND' },
        { id: generateId(), name:'Sami Gargouri', amount:'150 TND' },
        { id: generateId(), name:'Donateur Anonyme', amount:'50 TND' },
        { id: generateId(), name:'Riadh Mahfoudh', amount:'300 TND' },
        { id: generateId(), name:'Anis Hammami', amount:'100 TND' },
        { id: generateId(), name:'Khaled Bouzid', amount:'75 TND' },
        { id: generateId(), name:'Youssef Chaibi', amount:'500 TND' },
        { id: generateId(), name:'Donateur Anonyme', amount:'200 TND' },
    ]);
}

// ======================================================================
// CUSTOM CURSOR SYSTEM
// ======================================================================
class CustomCursor {
    constructor() {
        this.dot = document.getElementById('cursorDot');
        this.ring = document.getElementById('cursorRing');
        if (!this.dot || !this.ring) return;

        this.pos = { x: 0, y: 0 };
        this.dotPos = { x: 0, y: 0 };
        this.ringPos = { x: 0, y: 0 };
        this.visible = false;

        document.addEventListener('mousemove', e => {
            this.pos.x = e.clientX;
            this.pos.y = e.clientY;
            if (!this.visible) {
                this.visible = true;
                this.dotPos = { ...this.pos };
                this.ringPos = { ...this.pos };
                this.dot.style.opacity = '1';
                this.ring.style.opacity = '1';
            }
        });

        // Hover states
        document.addEventListener('mouseover', e => {
            const t = e.target.closest('a, button, .magnetic, input, select, textarea');
            if (t) {
                if (t.matches('input, textarea')) {
                    document.body.classList.add('cursor-text');
                    document.body.classList.remove('cursor-hover');
                } else {
                    document.body.classList.add('cursor-hover');
                    document.body.classList.remove('cursor-text');
                }
            }
        });

        document.addEventListener('mouseout', e => {
            const t = e.target.closest('a, button, .magnetic, input, select, textarea');
            if (t) {
                document.body.classList.remove('cursor-hover', 'cursor-text');
            }
        });

        this.render();
    }

    render() {
        // Dot follows immediately with slight lerp
        this.dotPos.x += (this.pos.x - this.dotPos.x) * 0.85;
        this.dotPos.y += (this.pos.y - this.dotPos.y) * 0.85;

        // Ring follows with spring-like delay
        this.ringPos.x += (this.pos.x - this.ringPos.x) * 0.15;
        this.ringPos.y += (this.pos.y - this.ringPos.y) * 0.15;

        if (this.dot) this.dot.style.transform = `translate(${this.dotPos.x - 4}px, ${this.dotPos.y - 4}px)`;
        if (this.ring) this.ring.style.transform = `translate(${this.ringPos.x - 20}px, ${this.ringPos.y - 20}px)`;

        requestAnimationFrame(() => this.render());
    }
}

// ======================================================================
// MAGNETIC ELEMENTS
// ======================================================================
class MagneticElements {
    constructor() {
        this.items = document.querySelectorAll('.magnetic');
        this.items.forEach(el => {
            const strength = parseInt(el.dataset.strength) || 20;
            el.addEventListener('mousemove', e => {
                const rect = el.getBoundingClientRect();
                const cx = rect.left + rect.width / 2;
                const cy = rect.top + rect.height / 2;
                const dx = (e.clientX - cx) / rect.width * strength;
                const dy = (e.clientY - cy) / rect.height * strength;
                el.style.transform = `translate(${dx}px, ${dy}px)`;
            });
            el.addEventListener('mouseleave', () => {
                el.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
                el.style.transform = 'translate(0, 0)';
                setTimeout(() => el.style.transition = '', 600);
            });
        });
    }
}

// ======================================================================
// ADVANCED PARTICLE SYSTEM - Constellation with mouse interaction
// ======================================================================
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.mouse = { x: -1000, y: -1000, radius: 180 };
        this.frame = 0;

        this.resize();
        this.createParticles();
        this.animate();

        window.addEventListener('resize', () => this.resize());
        
        const parent = this.canvas.parentElement;
        parent.addEventListener('mousemove', e => {
            const r = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - r.left;
            this.mouse.y = e.clientY - r.top;
        });
        parent.addEventListener('mouseleave', () => {
            this.mouse.x = -1000;
            this.mouse.y = -1000;
        });
    }

    resize() {
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.offsetWidth;
        this.canvas.height = parent.offsetHeight;
        this.createParticles();
    }

    createParticles() {
        this.particles = [];
        const area = this.canvas.width * this.canvas.height;
        const count = Math.min(120, Math.floor(area / 8000));
        
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                baseX: 0, baseY: 0,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                radius: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.6 + 0.1,
                pulseSpeed: Math.random() * 0.02 + 0.005,
                pulsePhase: Math.random() * Math.PI * 2,
            });
        }
    }

    animate() {
        this.frame++;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((p, i) => {
            // Pulsing radius
            const pulseRadius = p.radius + Math.sin(this.frame * p.pulseSpeed + p.pulsePhase) * 0.8;

            // Mouse repulsion/attraction
            const dx = p.x - this.mouse.x;
            const dy = p.y - this.mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < this.mouse.radius) {
                const force = (this.mouse.radius - dist) / this.mouse.radius;
                const angle = Math.atan2(dy, dx);
                // Push particles away but gently attract distant ones
                p.vx += Math.cos(angle) * force * 0.08;
                p.vy += Math.sin(angle) * force * 0.08;
            }

            // Movement
            p.x += p.vx;
            p.y += p.vy;

            // Friction
            p.vx *= 0.985;
            p.vy *= 0.985;

            // Soft boundary (bounce with energy loss)
            if (p.x < 0 || p.x > this.canvas.width) { p.vx *= -0.8; p.x = Math.max(0, Math.min(this.canvas.width, p.x)); }
            if (p.y < 0 || p.y > this.canvas.height) { p.vy *= -0.8; p.y = Math.max(0, Math.min(this.canvas.height, p.y)); }

            // Jitter (slight random movement)
            p.vx += (Math.random() - 0.5) * 0.015;
            p.vy += (Math.random() - 0.5) * 0.015;

            // Draw particle with glow
            const grad = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, pulseRadius * 3);
            grad.addColorStop(0, `rgba(100,100,100,${p.opacity * 0.3})`);
            grad.addColorStop(0.3, `rgba(255,255,255,${p.opacity * 0.5})`);
            grad.addColorStop(1, 'transparent');

            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, pulseRadius * 3, 0, Math.PI * 2);
            this.ctx.fillStyle = grad;
            this.ctx.fill();

            // Core white dot
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, pulseRadius * 0.6, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
            this.ctx.fill();

            // Connections
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const cdx = p.x - p2.x;
                const cdy = p.y - p2.y;
                const cdist = Math.sqrt(cdx * cdx + cdy * cdy);

                if (cdist < 130) {
                    const alpha = (1 - cdist / 130) * 0.15;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                    this.ctx.lineWidth = 0.6;
                    this.ctx.stroke();
                }
            }

            // Mouse connection lines (brighter)
            if (dist < this.mouse.radius && dist > 30) {
                const mAlpha = (1 - dist / this.mouse.radius) * 0.3;
                this.ctx.beginPath();
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(this.mouse.x, this.mouse.y);
                this.ctx.strokeStyle = `rgba(120, 120, 120, ${mAlpha})`;
                this.ctx.lineWidth = 0.4;
                this.ctx.stroke();
            }
        });

        requestAnimationFrame(() => this.animate());
    }
}

// ======================================================================
// SPLIT TEXT INTO LETTERS
// ======================================================================
function splitTextIntoLetters(element) {
    const text = element.textContent;
    element.innerHTML = '';
    text.split('').forEach((char, i) => {
        const span = document.createElement('span');
        span.className = char === ' ' ? 'letter space' : 'letter';
        span.textContent = char === ' ' ? '\u00A0' : char;
        span.style.animationDelay = `${i * 0.05}s`;
        element.appendChild(span);
    });
    return element.querySelectorAll('.letter');
}

// Split section titles into words > chars
function splitSectionTitles() {
    document.querySelectorAll('.section-title.split-text').forEach(title => {
        const text = title.textContent.trim();
        title.innerHTML = '';
        text.split(' ').forEach((word, wi) => {
            const wordSpan = document.createElement('span');
            wordSpan.className = 'word';
            word.split('').forEach((char, ci) => {
                const charSpan = document.createElement('span');
                charSpan.className = 'char';
                charSpan.textContent = char;
                charSpan.style.transitionDelay = `${(wi * 5 + ci) * 0.03}s`;
                wordSpan.appendChild(charSpan);
            });
            title.appendChild(wordSpan);
            // Space between words
            if (wi < text.split(' ').length - 1) {
                title.appendChild(document.createTextNode(' '));
            }
        });
    });
}

// ======================================================================
// 3D TILT EFFECT (Advanced)
// ======================================================================
class Tilt3D {
    constructor(selector, options = {}) {
        this.maxRotation = options.maxRotation || 8;
        this.perspective = options.perspective || 1000;
        this.glare = options.glare !== false;
        
        document.querySelectorAll(selector).forEach(el => this.attach(el));
    }

    attach(el) {
        if (this.glare) {
            const glare = document.createElement('div');
            glare.style.cssText = `
                position:absolute; inset:0; pointer-events:none; border-radius:inherit;
                background:linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
                opacity:0; transition:opacity 0.3s ease; z-index:10;
            `;
            glare.className = 'tilt-glare';
            el.style.position = 'relative';
            el.appendChild(glare);
        }

        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width;
            const y = (e.clientY - rect.top) / rect.height;
            const rotX = (0.5 - y) * this.maxRotation;
            const rotY = (x - 0.5) * this.maxRotation;

            el.style.transform = `perspective(${this.perspective}px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(10px)`;
            el.style.transition = 'transform 0.1s ease-out';

            const glareEl = el.querySelector('.tilt-glare');
            if (glareEl) {
                glareEl.style.opacity = '1';
                glareEl.style.background = `radial-gradient(circle at ${x * 100}% ${y * 100}%, rgba(255,255,255,0.15), transparent 60%)`;
            }
        });

        el.addEventListener('mouseleave', () => {
            el.style.transform = `perspective(${this.perspective}px) rotateX(0) rotateY(0) translateZ(0)`;
            el.style.transition = 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
            const glareEl = el.querySelector('.tilt-glare');
            if (glareEl) glareEl.style.opacity = '0';
        });
    }
}

// ======================================================================
// SPRING PHYSICS SCROLL REVEAL
// ======================================================================
class ScrollRevealEngine {
    constructor() {
        this.items = [];
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = parseInt(el.dataset.revealDelay) || 0;
                    setTimeout(() => {
                        el.classList.add('revealed');
                    }, delay);
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    }

    observe(selector) {
        document.querySelectorAll(selector).forEach(el => this.observer.observe(el));
    }

    // Stagger children reveal
    staggerChildren(containerSelector, childSelector, delayBetween = 100) {
        const containers = document.querySelectorAll(containerSelector);
        containers.forEach(container => {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const children = entry.target.querySelectorAll(childSelector);
                        children.forEach((child, i) => {
                            child.style.transitionDelay = `${i * delayBetween}ms`;
                            setTimeout(() => child.classList.add('revealed'), i * delayBetween);
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.08 });
            observer.observe(container);
        });
    }
}

// ======================================================================
// LOADING SCREEN WITH PROGRESS
// ======================================================================
class LoadingScreen {
    constructor() {
        this.screen = document.getElementById('loadingScreen');
        this.bar = document.getElementById('loaderBar');
        this.percent = document.getElementById('loaderPercent');
        this.progress = 0;
        this.target = 100;
        this.startTime = Date.now();
    }

    start() {
        if (!this.screen) return Promise.resolve();

        return new Promise(resolve => {
            const interval = setInterval(() => {
                const elapsed = Date.now() - this.startTime;
                // Simulate loading: fast start, slow middle, fast end
                if (elapsed < 500) {
                    this.progress += 3;
                } else if (elapsed < 1200) {
                    this.progress += 1.5;
                } else {
                    this.progress += 5;
                }
                this.progress = Math.min(this.progress, 100);

                if (this.bar) this.bar.style.width = this.progress + '%';
                if (this.percent) this.percent.textContent = Math.round(this.progress) + '%';

                if (this.progress >= 100) {
                    clearInterval(interval);
                    setTimeout(() => {
                        this.screen.classList.add('exit');
                        setTimeout(() => {
                            this.screen.remove();
                            resolve();
                        }, 1200);
                    }, 300);
                }
            }, 30);
        });
    }
}

// ======================================================================
// TEXT SCRAMBLE EFFECT
// ======================================================================
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        this.frame = 0;
        this.queue = [];
        this.resolve = null;
    }

    setText(newText) {
        const oldText = this.el.textContent;
        const length = Math.max(oldText.length, newText.length);
        
        return new Promise(resolve => {
            this.resolve = resolve;
            this.queue = [];
            
            for (let i = 0; i < length; i++) {
                const from = oldText[i] || '';
                const to = newText[i] || '';
                const start = Math.floor(Math.random() * 20);
                const end = start + Math.floor(Math.random() * 20);
                this.queue.push({ from, to, start, end });
            }    
            
            cancelAnimationFrame(this.frameRequest);
            this.frame = 0;
            this.update();
        });
    }

    update() {
        let output = '';
        let complete = 0;
        
        for (let i = 0; i < this.queue.length; i++) {
            let { from, to, start, end, char } = this.queue[i];
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.chars[Math.floor(Math.random() * this.chars.length)];
                    this.queue[i].char = char;
                }
                output += `<span style="color:#555;opacity:0.7">${char}</span>`;
            } else {
                output += from;
            }
        }
        
        this.el.innerHTML = output;
        
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(() => this.update());
            this.frame++;
        }
    }
}

// ======================================================================
// SMOOTH COUNTER WITH SPRING EASING
// ======================================================================
function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.dataset.target = target;
    const duration = 2500;
    const start = performance.now();
    
    function springEase(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 ? 0 : t === 1 ? 1 :
            Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
    
    function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = springEase(progress);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(update);
    }
    
    requestAnimationFrame(update);
}

// ======================================================================
// BANNER FLOATING PARTICLES
// ======================================================================
function createBannerParticles() {
    const container = document.getElementById('bannerParticles');
    if (!container) return;
    for (let i = 0; i < 20; i++) {
        const p = document.createElement('div');
        const size = Math.random() * 4 + 1;
        p.style.cssText = `
            position:absolute;
            width:${size}px; height:${size}px;
            background:rgba(255,255,255,${Math.random() * 0.3 + 0.05});
            border-radius:50%;
            left:${Math.random() * 100}%;
            top:${Math.random() * 100}%;
            animation: bannerParticleFloat ${Math.random() * 5 + 5}s ease-in-out infinite;
            animation-delay: ${Math.random() * -5}s;
        `;
        container.appendChild(p);
    }

    // Add the keyframes dynamically
    if (!document.getElementById('bannerParticleStyle')) {
        const style = document.createElement('style');
        style.id = 'bannerParticleStyle';
        style.textContent = `
            @keyframes bannerParticleFloat {
                0%, 100% { transform: translate(0, 0); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                50% { transform: translate(${Math.random() > 0.5 ? '' : '-'}${Math.random() * 40 + 10}px, ${Math.random() > 0.5 ? '' : '-'}${Math.random() * 20 + 5}px); }
            }
        `;
        document.head.appendChild(style);
    }
}

// ======================================================================
// PARALLAX + HEADER SCROLL
// ======================================================================
function initScrollEffects() {
    const header = document.getElementById('mainHeader');
    const hero = document.querySelector('.hero');
    const heroContent = hero ? hero.querySelector('.hero-content') : null;
    const scrollIndicator = document.getElementById('scrollIndicator');

    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;

        // Header scroll state
        if (header) header.classList.toggle('scrolled', scrollY > 80);

        // Hero parallax + fade (only on home page)
        if (heroContent && scrollY < window.innerHeight) {
            const progress = scrollY / window.innerHeight;
            heroContent.style.transform = `translateY(${scrollY * 0.4}px) scale(${1 - progress * 0.1})`;
            heroContent.style.opacity = 1 - progress * 1.5;
        }

        // Scroll indicator fade
        if (scrollIndicator) {
            scrollIndicator.style.opacity = Math.max(0, 0.6 - scrollY / 200);
        }
    }, { passive: true });

    // Sub-pages: header starts scrolled since there's no full hero
    if (!hero && header) {
        header.classList.add('scrolled');
    }
}

// ======================================================================
// NAV INDICATOR
// ======================================================================
function updateNavIndicator() {
    const indicator = document.getElementById('navIndicator');
    const activeLink = document.querySelector('.nav-link.active');
    if (!indicator || !activeLink || window.innerWidth <= 768) return;

    const nav = document.getElementById('mainNav');
    const navRect = nav.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    
    indicator.style.left = (linkRect.left - navRect.left) + 'px';
    indicator.style.width = linkRect.width + 'px';
}

// Active nav on scroll (multi-page aware)
function initNavScroll() {
    // On multi-page site, the active class is set in HTML per page.
    // Only do scroll-based detection on index.html (single-page home)
    const page = document.body.dataset.page;

    if (page === 'accueil') {
        // Home page: no scroll-based nav switching needed (only hero + quick links)
    }

    // Initial indicator position
    setTimeout(updateNavIndicator, 100);
    window.addEventListener('resize', updateNavIndicator);
}

// ======================================================================
// HERO ANIMATION SEQUENCE
// ======================================================================
async function animateHero() {
    const badge = document.getElementById('heroBadge');
    const title = document.getElementById('heroTitle');
    const subtitle = document.getElementById('heroSubtitle');
    const stats = document.getElementById('heroStats');
    const heroBtn = document.querySelector('.hero-btn');
    const lines = document.querySelectorAll('.subtitle-line');

    // 1. Badge drops in
    await delay(200);
    if (badge) badge.classList.add('animate');

    // 2. Title letters cascade
    await delay(400);
    if (title) {
        const letters = splitTextIntoLetters(title);
        letters.forEach((letter, i) => {
            setTimeout(() => letter.classList.add('animate'), i * 60);
        });
    }

    // 3. Subtitle reveal
    await delay(600);
    if (subtitle) subtitle.classList.add('animate');
    lines.forEach(l => l.classList.add('animate'));

    // 4. Stats
    await delay(400);
    if (stats) stats.classList.add('animate');

    // 5. Button
    await delay(300);
    if (heroBtn) heroBtn.classList.add('animate');

    // 6. Counters
    await delay(500);
    updateHeroStats();
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ======================================================================
// SECTION RENDERERS
// ======================================================================
function escapeHtml(t) {
    if (!t) return '';
    const d = document.createElement('div');
    d.textContent = t;
    return d.innerHTML;
}

let currentMatchView = 'css';
let currentMatchDay = 0;

function setMatchView(view) {
    currentMatchView = view;
    document.getElementById('viewCSS')?.classList.toggle('active', view === 'css');
    document.getElementById('viewAll')?.classList.toggle('active', view === 'journee');
    const selector = document.getElementById('matchDaySelector');
    if (selector) selector.style.display = view === 'journee' ? 'flex' : 'none';

    if (view === 'journee') {
        const matches = DataManager.getAll('matches');
        const days = [...new Set(matches.filter(m => m.matchDay > 0).map(m => m.matchDay))].sort((a, b) => b - a);
        if (days.length && !currentMatchDay) currentMatchDay = days[0];
        renderMatchDay();
    } else {
        loadMatches();
    }
}

function navigateMatchDay(dir) {
    const matches = DataManager.getAll('matches');
    const days = [...new Set(matches.filter(m => m.matchDay > 0).map(m => m.matchDay))].sort((a, b) => a - b);
    if (!days.length) return;
    const idx = days.indexOf(currentMatchDay);
    const newIdx = idx + dir;
    if (newIdx >= 0 && newIdx < days.length) {
        currentMatchDay = days[newIdx];
        renderMatchDay();
    }
}

function renderMatchDay() {
    const grid = document.getElementById('matchesGrid');
    if (!grid) return;
    const label = document.getElementById('mdCurrent');
    if (label) label.textContent = `Journée ${currentMatchDay}`;

    const matches = DataManager.getAll('matches');
    const dayMatch = matches.find(m => m.matchDay === currentMatchDay);

    if (!dayMatch) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-futbol"></i><p>Aucun résultat pour cette journée.</p></div>';
        return;
    }

    const date = new Date(dayMatch.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const comp = dayMatch.competition || 'Ligue 1 Professionnelle';

    // Build list: CSS match + other matches
    let allGames = [];

    // CS Sfaxien main match
    const hs = parseInt(dayMatch.homeScore), as = parseInt(dayMatch.awayScore);
    allGames.push({
        homeTeam: dayMatch.homeTeam, awayTeam: dayMatch.awayTeam,
        homeScore: hs, awayScore: as, isCSSMatch: true,
        mid: dayMatch._id || dayMatch.id
    });

    // Other matches
    if (dayMatch.otherMatches && dayMatch.otherMatches.length) {
        dayMatch.otherMatches.forEach(om => {
            allGames.push({
                homeTeam: om.homeTeam, awayTeam: om.awayTeam,
                homeScore: parseInt(om.homeScore), awayScore: parseInt(om.awayScore),
                isCSSMatch: false
            });
        });
    }

    let html = `
    <div class="matchday-header">
        <div class="matchday-badge"><i class="fas fa-trophy"></i> ${escapeHtml(comp)}</div>
        <h3 class="matchday-title">Journée ${currentMatchDay}</h3>
        <span class="matchday-date"><i class="far fa-calendar"></i> ${date}</span>
    </div>
    <div class="matchday-results">`;

    allGames.forEach(g => {
        const isCSS = g.homeTeam.includes('Sfaxien') || g.awayTeam.includes('Sfaxien');
        const cssClass = isCSS ? 'matchday-row-css' : '';
        const clickAttr = g.isCSSMatch ? `onclick="openMatchDetail('${g.mid}')" style="cursor:pointer;"` : '';
        html += `
        <div class="matchday-row ${cssClass}" ${clickAttr}>
            <span class="mdr-team mdr-home ${isCSS && g.homeTeam.includes('Sfaxien') ? 'mdr-our' : ''}">${escapeHtml(g.homeTeam)}</span>
            <span class="mdr-score">${g.homeScore} - ${g.awayScore}</span>
            <span class="mdr-team mdr-away ${isCSS && g.awayTeam.includes('Sfaxien') ? 'mdr-our' : ''}">${escapeHtml(g.awayTeam)}</span>
        </div>`;
    });

    html += `</div>`;

    // Nav button states
    const days = [...new Set(matches.filter(m => m.matchDay > 0).map(m => m.matchDay))].sort((a, b) => a - b);
    const idx = days.indexOf(currentMatchDay);
    const prevBtn = document.getElementById('mdPrev');
    const nextBtn = document.getElementById('mdNext');
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx >= days.length - 1;

    grid.innerHTML = html;
}

function loadMatches() {
    const matches = DataManager.getAll('matches');
    const grid = document.getElementById('matchesGrid');
    if (!grid) return;

    if (!matches.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-futbol"></i><p>Aucun résultat de match.</p></div>';
        return;
    }

    matches.sort((a, b) => new Date(b.date) - new Date(a.date));

    grid.innerHTML = matches.map(m => {
        const hs = parseInt(m.homeScore), as = parseInt(m.awayScore);
        let rc = 'result-draw', rt = 'NUL';
        if (m.isHome) {
            if (hs > as) { rc = 'result-win'; rt = 'VICTOIRE'; }
            else if (hs < as) { rc = 'result-loss'; rt = 'DÉFAITE'; }
        } else {
            if (as > hs) { rc = 'result-win'; rt = 'VICTOIRE'; }
            else if (as < hs) { rc = 'result-loss'; rt = 'DÉFAITE'; }
        }
        const date = new Date(m.date).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
        const mid = m._id || m.id;

        return `<div class="match-card" onclick="openMatchDetail('${mid}')" style="cursor:pointer">
            <div class="match-card-header">
                <span class="competition">${escapeHtml(m.competition || 'Match')}${m.isCup ? ' <i class="fas fa-trophy" style="color:gold;font-size:0.7rem"></i>' : ''}</span>
                <span>${date}</span>
            </div>
            <div class="match-card-body">
                <div class="match-teams">
                    <span class="match-team ${m.isHome ? 'our-team' : ''}">${escapeHtml(m.homeTeam)}</span>
                    <span class="match-score">${hs} - ${as}</span>
                    <span class="match-team ${!m.isHome ? 'our-team' : ''}">${escapeHtml(m.awayTeam)}</span>
                </div>
                <span class="match-result ${rc}">${rt}</span>
                ${m.venue ? `<div class="match-venue"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(m.venue)}</div>` : ''}
            </div>
            <div class="match-card-cta"><i class="fas fa-chevron-right"></i> Détails du match</div>
        </div>`;
    }).join('');
}

/* ================================================================
   MATCH DETAIL — FlashScore Style Panel
   ================================================================ */
function openMatchDetail(matchId) {
    const matches = DataManager.getAll('matches');
    const m = matches.find(x => (x._id || x.id) === matchId);
    if (!m) return;

    const overlay = document.getElementById('matchDetailOverlay');
    const panel = document.getElementById('matchDetailPanel');
    if (!overlay || !panel) return;

    const hs = parseInt(m.homeScore), as = parseInt(m.awayScore);
    let rc = 'result-draw';
    if (m.isHome) { if (hs > as) rc = 'result-win'; else if (hs < as) rc = 'result-loss'; }
    else { if (as > hs) rc = 'result-win'; else if (as < hs) rc = 'result-loss'; }

    const date = new Date(m.date).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' });

    // Build tabs
    let tabs = ['resume', 'compo', 'stats', 'classement'];
    let tabLabels = { resume:'Résumé', compo:'Composition', stats:'Statistiques', classement:'Classement' };
    if (m.isCup && m.cupBracket && m.cupBracket.length) { tabs.push('tableau'); tabLabels.tableau = 'Tableau'; }
    tabs.push('actu'); tabLabels.actu = 'Actualité';
    const tabIcons = { resume:'fa-file-alt', compo:'fa-users', stats:'fa-chart-bar', classement:'fa-list-ol', tableau:'fa-sitemap', actu:'fa-newspaper' };

    const tabsHtml = tabs.map((t, i) => `<button class="md-tab${i === 0 ? ' active' : ''}" data-tab="${t}" onclick="switchMatchTab('${t}')"><i class="fas ${tabIcons[t]}"></i> ${tabLabels[t]}</button>`).join('');

    // Header
    let html = `
    <div class="md-header ${rc}">
        <div class="md-comp"><i class="fas fa-trophy"></i> ${escapeHtml(m.competition || 'Match')}</div>
        <div class="md-score-row">
            <div class="md-team-col">
                <div class="md-team-logo"><span>${escapeHtml(m.homeTeam.substring(0, 3).toUpperCase())}</span></div>
                <div class="md-team-name ${m.isHome ? 'md-our' : ''}">${escapeHtml(m.homeTeam)}</div>
            </div>
            <div class="md-score-col">
                <div class="md-big-score">${hs} - ${as}</div>
                <div class="md-status">Terminé</div>
            </div>
            <div class="md-team-col">
                <div class="md-team-logo"><span>${escapeHtml(m.awayTeam.substring(0, 3).toUpperCase())}</span></div>
                <div class="md-team-name ${!m.isHome ? 'md-our' : ''}">${escapeHtml(m.awayTeam)}</div>
            </div>
        </div>
        <div class="md-meta">
            <span><i class="far fa-calendar"></i> ${date}</span>
            ${m.time ? `<span><i class="far fa-clock"></i> ${escapeHtml(m.time)}</span>` : ''}
            ${m.venue ? `<span><i class="fas fa-map-marker-alt"></i> ${escapeHtml(m.venue)}</span>` : ''}
            ${m.referee ? `<span><i class="fas fa-flag"></i> ${escapeHtml(m.referee)}</span>` : ''}
            ${m.attendance ? `<span><i class="fas fa-users"></i> ${m.attendance.toLocaleString('fr-FR')} spectateurs</span>` : ''}
        </div>
    </div>
    <div class="md-tabs">${tabsHtml}</div>
    <div class="md-body">`;

    // TAB: Résumé
    html += `<div class="md-tab-content active" id="mdTab-resume">`;
    if (m.summary) html += `<div class="md-summary"><p>${escapeHtml(m.summary)}</p></div>`;
    if (m.events && m.events.length) {
        html += `<div class="md-events"><h4><i class="fas fa-list"></i> Événements du match</h4>`;
        m.events.sort((a, b) => a.minute - b.minute);
        html += m.events.map(e => {
            const icons = { goal:'⚽', yellow:'🟨', red:'🟥', sub:'🔄', pen:'⚽', og:'⚽', var:'📺', miss:'❌' };
            const icon = icons[e.type] || '⚽';
            const isHome = e.team === 'home';
            const detail = e.detail ? ` <small>(${escapeHtml(e.detail)})</small>` : '';
            const assist = e.assist ? ` <span class="md-assist"><i class="fas fa-shoe-prints"></i> ${escapeHtml(e.assist)}</span>` : '';
            return `<div class="md-event ${isHome ? 'md-event-home' : 'md-event-away'}">
                <div class="md-event-min">${e.minute}'</div>
                <div class="md-event-icon">${icon}</div>
                <div class="md-event-info">
                    <span class="md-event-player">${escapeHtml(e.player)}</span>${assist}${detail}
                </div>
            </div>`;
        }).join('');
        html += `</div>`;
    }
    html += `</div>`;

    // TAB: Composition
    html += `<div class="md-tab-content" id="mdTab-compo">`;
    if (m.homeLineup && m.homeLineup.length) {
        const renderLineup = (lineup, subs, coach, formation, teamName) => {
            let h = `<div class="md-lineup-block">`;
            h += `<div class="md-lineup-header"><strong>${escapeHtml(teamName)}</strong>${formation ? ` <span class="md-formation">${escapeHtml(formation)}</span>` : ''}${coach ? ` <span class="md-coach"><i class="fas fa-user-tie"></i> ${escapeHtml(coach)}</span>` : ''}</div>`;
            h += `<div class="md-lineup-grid">`;
            h += lineup.map(p => {
                const ratingClass = p.rating >= 8 ? 'md-rating-top' : p.rating >= 7 ? 'md-rating-good' : p.rating >= 6 ? 'md-rating-avg' : 'md-rating-low';
                return `<div class="md-player">
                    <span class="md-player-num">${p.number || ''}</span>
                    <span class="md-player-name">${escapeHtml(p.name)}${p.isCaptain ? ' <i class="fas fa-copyright" title="Capitaine" style="color:gold;font-size:0.65rem"></i>' : ''}</span>
                    <span class="md-player-pos">${escapeHtml(p.position || '')}</span>
                    ${p.rating ? `<span class="md-player-rating ${ratingClass}">${p.rating.toFixed(1)}</span>` : ''}
                </div>`;
            }).join('');
            h += `</div>`;
            if (subs && subs.length) {
                h += `<div class="md-subs-title"><i class="fas fa-exchange-alt"></i> Remplaçants</div>`;
                h += `<div class="md-lineup-grid md-subs-grid">`;
                h += subs.map(p => `<div class="md-player md-sub-player"><span class="md-player-num">${p.number || ''}</span><span class="md-player-name">${escapeHtml(p.name)}</span>${p.rating ? `<span class="md-player-rating">${p.rating.toFixed(1)}</span>` : ''}</div>`).join('');
                h += `</div>`;
            }
            h += `</div>`;
            return h;
        };
        html += `<div class="md-compo-grid">`;
        html += renderLineup(m.homeLineup, m.homeSubs, m.homeCoach, m.homeFormation, m.homeTeam);
        html += renderLineup(m.awayLineup, m.awaySubs, m.awayCoach, m.awayFormation, m.awayTeam);
        html += `</div>`;
    } else {
        html += `<div class="md-empty"><i class="fas fa-users"></i><p>Composition non disponible</p></div>`;
    }
    html += `</div>`;

    // TAB: Stats
    html += `<div class="md-tab-content" id="mdTab-stats">`;
    if (m.stats) {
        const s = m.stats;
        const statLabels = {
            possession:'Possession (%)', shots:'Tirs', shotsOnTarget:'Tirs cadrés', corners:'Corners',
            fouls:'Fautes', offsides:'Hors-jeux', yellowCards:'Cartons jaunes', redCards:'Cartons rouges',
            passes:'Passes', passAccuracy:'Précision passes (%)', saves:'Arrêts'
        };
        html += `<div class="md-stats-list">`;
        for (const [key, label] of Object.entries(statLabels)) {
            if (s[key] && s[key].length === 2) {
                const hv = s[key][0], av = s[key][1];
                const total = hv + av || 1;
                const hp = Math.round((hv / total) * 100);
                html += `<div class="md-stat-row">
                    <span class="md-stat-val md-stat-home">${hv}</span>
                    <div class="md-stat-center">
                        <div class="md-stat-label">${label}</div>
                        <div class="md-stat-bar">
                            <div class="md-stat-bar-home" style="width:${hp}%"></div>
                            <div class="md-stat-bar-away" style="width:${100 - hp}%"></div>
                        </div>
                    </div>
                    <span class="md-stat-val md-stat-away">${av}</span>
                </div>`;
            }
        }
        html += `</div>`;
    } else {
        html += `<div class="md-empty"><i class="fas fa-chart-bar"></i><p>Statistiques non disponibles</p></div>`;
    }
    html += `</div>`;

    // TAB: Classement
    html += `<div class="md-tab-content" id="mdTab-classement">`;
    const standings = DataManager.getAll('standings');
    if (standings && standings.length) {
        const sorted = [...standings].sort((a, b) => a.rank - b.rank);
        html += `<div class="md-standings"><table class="md-standings-table">
            <thead><tr><th>#</th><th>Équipe</th><th>Pts</th><th>J</th><th>V</th><th>N</th><th>D</th><th>+/-</th></tr></thead><tbody>`;
        html += sorted.map(t => {
            const isCSS = t.isOurTeam;
            const isHome = t.name === m.homeTeam;
            const isAway = t.name === m.awayTeam;
            let rowClass = isCSS ? 'md-row-css' : '';
            if (isHome || isAway) rowClass += ' md-row-match';
            return `<tr class="${rowClass}">
                <td>${t.rank}</td><td>${escapeHtml(t.name)}${isCSS ? ' ⭐' : ''}${isHome ? ' 🏠' : ''}${isAway ? ' ✈️' : ''}</td>
                <td><strong>${t.points}</strong></td><td>${t.played}</td><td>${t.won}</td><td>${t.drawn}</td><td>${t.lost}</td><td>${t.gf - t.ga}</td>
            </tr>`;
        }).join('');
        html += `</tbody></table></div>`;
    } else {
        html += `<div class="md-empty"><i class="fas fa-list-ol"></i><p>Classement non disponible</p></div>`;
    }
    html += `</div>`;

    // TAB: Tableau (Cup only)
    if (m.isCup && m.cupBracket && m.cupBracket.length) {
        html += `<div class="md-tab-content" id="mdTab-tableau">`;
        html += `<div class="md-bracket"><h4><i class="fas fa-trophy" style="color:gold"></i> Parcours en Coupe</h4>`;
        html += m.cupBracket.map(r => {
            const played = r.played;
            return `<div class="md-bracket-round ${played ? 'md-bracket-played' : 'md-bracket-upcoming'}">
                <div class="md-bracket-label">${escapeHtml(r.round)}</div>
                <div class="md-bracket-match">
                    <span class="md-bracket-team ${r.homeTeam.includes('Sfaxien') ? 'md-our' : ''}">${escapeHtml(r.homeTeam || 'À déterminer')}</span>
                    ${played ? `<span class="md-bracket-score">${escapeHtml(r.homeScore)} - ${escapeHtml(r.awayScore)}</span>` : '<span class="md-bracket-score">vs</span>'}
                    <span class="md-bracket-team ${r.awayTeam.includes('Sfaxien') ? 'md-our' : ''}">${escapeHtml(r.awayTeam || 'À déterminer')}</span>
                </div>
            </div>`;
        }).join('');
        html += `</div></div>`;
    }

    // TAB: Actualité
    html += `<div class="md-tab-content" id="mdTab-actu">`;
    const allNews = DataManager.getAll('news') || [];
    const matchTeams = [m.homeTeam, m.awayTeam].map(t => t.toLowerCase());
    const relatedNews = allNews.filter(n => {
        const txt = (n.title + ' ' + (n.content || '')).toLowerCase();
        return matchTeams.some(t => txt.includes(t.split(' ').pop())) || txt.includes('match') || txt.includes('résultat');
    }).slice(0, 5);
    if (relatedNews.length) {
        html += `<div class="md-news-list">`;
        html += relatedNews.map(n => {
            const nDate = new Date(n.date).toLocaleDateString('fr-FR', { day:'numeric', month:'long' });
            return `<div class="md-news-item"><div class="md-news-date">${nDate}</div><div class="md-news-title">${escapeHtml(n.title)}</div></div>`;
        }).join('');
        html += `</div>`;
    } else {
        html += `<div class="md-empty"><i class="fas fa-newspaper"></i><p>Aucune actualité liée à ce match</p></div>`;
    }
    html += `</div>`;

    html += `</div>`; // close md-body

    document.getElementById('matchDetailContent').innerHTML = html;
    panel.classList.add('open');
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeMatchDetail() {
    document.getElementById('matchDetailPanel').classList.remove('open');
    document.getElementById('matchDetailOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function switchMatchTab(tab) {
    document.querySelectorAll('#matchDetailPanel .md-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('#matchDetailPanel .md-tab-content').forEach(c => c.classList.toggle('active', c.id === 'mdTab-' + tab));
}

function loadFixtures() {
    const fixtures = DataManager.getAll('fixtures');
    const list = document.getElementById('fixturesList');
    if (!list) return;

    const now = new Date();
    const future = fixtures.filter(f => new Date(f.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!future.length) {
        list.innerHTML = '<div class="empty-state"><i class="fas fa-calendar"></i><p>Aucun match programmé.</p></div>';
        return;
    }

    const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
    list.innerHTML = future.map(f => {
        const d = new Date(f.date);
        return `<div class="fixture-card">
            <div class="fixture-date">
                <span class="fixture-day">${d.getDate()}</span>
                <span class="fixture-month">${months[d.getMonth()]}</span>
            </div>
            <div class="fixture-details">
                <div class="fixture-teams">${escapeHtml(f.homeTeam)} <span class="vs">VS</span> ${escapeHtml(f.awayTeam)}</div>
                <div class="fixture-competition">${escapeHtml(f.competition || '')}</div>
            </div>
            <div class="fixture-time"><i class="far fa-clock"></i> ${escapeHtml(f.time || 'TBD')}</div>
        </div>`;
    }).join('');
}

function loadStandings() {
    const standings = DataManager.getAll('standings');
    const tbody = document.getElementById('standingsBody');
    if (!tbody) return;

    if (!standings.length) {
        tbody.innerHTML = '<tr><td colspan="11" class="empty-table">Aucun classement.</td></tr>';
        return;
    }

    standings.sort((a, b) => b.points !== a.points ? b.points - a.points : ((b.goalsFor - b.goalsAgainst) - (a.goalsFor - a.goalsAgainst)));

    // Populate CSS highlight card
    const cssTeam = standings.find(t => t.isOurTeam);
    if (cssTeam) {
        const cssIdx = standings.indexOf(cssTeam);
        const cssRank = document.getElementById('cssRank');
        const cssStats = document.getElementById('cssHighlightStats');
        const cssForm = document.getElementById('cssHighlightForm');
        if (cssRank) cssRank.innerHTML = `${cssIdx + 1}<span class="cls-rank-suffix">${cssIdx === 0 ? 'er' : 'e'}</span>`;
        if (cssStats) {
            const diff = (cssTeam.goalsFor || 0) - (cssTeam.goalsAgainst || 0);
            cssStats.innerHTML = `
                <div class="cls-stat"><span class="cls-stat-val">${cssTeam.points || 0}</span><span class="cls-stat-lbl">Points</span></div>
                <div class="cls-stat"><span class="cls-stat-val">${cssTeam.played || 0}</span><span class="cls-stat-lbl">Matchs</span></div>
                <div class="cls-stat"><span class="cls-stat-val">${cssTeam.won || 0}</span><span class="cls-stat-lbl">Victoires</span></div>
                <div class="cls-stat"><span class="cls-stat-val">${cssTeam.drawn || 0}</span><span class="cls-stat-lbl">Nuls</span></div>
                <div class="cls-stat"><span class="cls-stat-val">${cssTeam.lost || 0}</span><span class="cls-stat-lbl">Défaites</span></div>
                <div class="cls-stat"><span class="cls-stat-val">${diff > 0 ? '+' : ''}${diff}</span><span class="cls-stat-lbl">Diff. buts</span></div>
            `;
        }
        if (cssForm && cssTeam.form && cssTeam.form.length) {
            cssForm.innerHTML = `<span class="cls-form-label">Forme :</span>` + cssTeam.form.map(f => {
                const cls = f === 'W' ? 'win' : f === 'D' ? 'draw' : 'loss';
                const lbl = f === 'W' ? 'V' : f === 'D' ? 'N' : 'D';
                return `<span class="cls-form-badge cls-form-${cls}">${lbl}</span>`;
            }).join('');
        }
    }

    // Render table rows with zone colors
    tbody.innerHTML = standings.map((t, i) => {
        const diff = (t.goalsFor || 0) - (t.goalsAgainst || 0);
        const pos = i + 1;
        let zoneClass = '';
        if (pos <= 2) zoneClass = 'cls-row-champions';
        else if (pos === 3) zoneClass = 'cls-row-confed';
        else if (pos >= 15) zoneClass = 'cls-row-relegation';

        const formHtml = (t.form && t.form.length) ? t.form.map(f => {
            const cls = f === 'W' ? 'win' : f === 'D' ? 'draw' : 'loss';
            const lbl = f === 'W' ? 'V' : f === 'D' ? 'N' : 'D';
            return `<span class="cls-form-dot cls-form-${cls}">${lbl}</span>`;
        }).join('') : '—';

        return `<tr class="${t.isOurTeam ? 'our-team-row' : ''} ${zoneClass}">
            <td class="position-col"><span class="cls-pos-num">${pos}</span></td>
            <td class="cls-team-cell">
                <span class="cls-team-name">${escapeHtml(t.name)}</span>
                ${t.isOurTeam ? '<i class="fas fa-star cls-star"></i>' : ''}
            </td>
            <td>${t.played||0}</td><td class="cls-win-col">${t.won||0}</td><td>${t.drawn||0}</td><td class="cls-loss-col">${t.lost||0}</td>
            <td>${t.goalsFor||0}</td><td>${t.goalsAgainst||0}</td>
            <td class="cls-diff-col ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}">${diff > 0 ? '+' : ''}${diff}</td>
            <td class="cls-form-cell">${formHtml}</td>
            <td class="points-col">${t.points||0}</td>
        </tr>`;
    }).join('');
}

/* ================================================================
   BOUTIQUE — Full Shopping Cart System
   ================================================================ */
let shopCart = JSON.parse(localStorage.getItem('cssCart') || '[]');
let shopPromo = { code: '', discount: 0, type: '' };
const SHIPPING_COST = 7;
let currentShopFilter = 'all';

function saveCart() {
    localStorage.setItem('cssCart', JSON.stringify(shopCart));
    updateCartBadge();
}

function updateCartBadge() {
    const count = shopCart.reduce((s, i) => s + i.qty, 0);
    const badge = document.getElementById('cartFabCount');
    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
}

function loadStore(filterCategory) {
    const products = DataManager.getAll('products');
    const grid = document.getElementById('storeGrid');
    if (!grid) return;

    if (filterCategory !== undefined) currentShopFilter = filterCategory;

    if (!products.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-store"></i><p>Boutique en préparation.</p></div>';
        return;
    }

    const filtered = currentShopFilter === 'all' ? products : products.filter(p => p.category === currentShopFilter);

    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-store"></i><p>Aucun produit dans cette catégorie.</p></div>';
        return;
    }

    grid.innerHTML = filtered.map(p => {
        const img = p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">` : '<i class="fas fa-tshirt"></i>';
        const hasSizes = p.sizes && p.sizes.length > 0;
        const catIcons = { maillots: 'fa-tshirt', vetements: 'fa-vest', equipements: 'fa-futbol', accessoires: 'fa-hat-cowboy' };
        const catIcon = catIcons[p.category] || 'fa-store';
        return `<div class="product-card revealed" data-category="${escapeHtml(p.category || '')}">
            <div class="product-image">
                ${img}
                ${p.badge ? `<span class="product-badge">${escapeHtml(p.badge)}</span>` : ''}
                ${p.customizable ? '<span class="product-custom-tag"><i class="fas fa-paint-brush"></i> Personnalisable</span>' : ''}
            </div>
            <div class="product-info">
                <span class="product-cat"><i class="fas ${catIcon}"></i> ${escapeHtml((p.category || '').charAt(0).toUpperCase() + (p.category || '').slice(1))}</span>
                <h3 class="product-name">${escapeHtml(p.name)}</h3>
                <p class="product-desc">${escapeHtml(p.description || '')}</p>
                <div class="product-footer">
                    <span class="product-price">${parseFloat(p.price).toFixed(0)} <span class="currency">DT</span></span>
                    ${hasSizes || p.customizable
                        ? `<button class="btn btn-primary btn-sm" onclick="openProductModal('${p._id || p.id}')"><i class="fas fa-eye"></i> Détails</button>`
                        : `<button class="btn btn-primary btn-sm" onclick="quickAddToCart('${p._id || p.id}')"><i class="fas fa-cart-plus"></i> Ajouter</button>`
                    }
                </div>
            </div>
        </div>`;
    }).join('');

    // Bind filter buttons
    document.querySelectorAll('.boutique-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.boutique-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadStore(btn.dataset.cat);
        });
    });
    updateCartBadge();
}

function quickAddToCart(productId) {
    const products = DataManager.getAll('products');
    const p = products.find(x => (x._id || x.id) === productId);
    if (!p) return;
    const existing = shopCart.find(c => c.productId === productId && !c.size && !c.customization);
    if (existing) { existing.qty++; } else {
        shopCart.push({ productId, name: p.name, price: p.price, image: p.image || '', qty: 1, size: '', customization: null });
    }
    saveCart();
    showToast(`${p.name} ajouté au panier !`, 'success');
}

/* ---------- Product Detail Modal ---------- */
function openProductModal(productId) {
    const products = DataManager.getAll('products');
    const p = products.find(x => (x._id || x.id) === productId);
    if (!p) return;

    const img = p.image ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}">` : '<div class="pm-img-placeholder"><i class="fas fa-tshirt"></i></div>';
    const hasSizes = p.sizes && p.sizes.length > 0;
    const customPrice = p.customPrice || 20;

    let html = `
    <div class="pm-grid">
        <div class="pm-image">${img}</div>
        <div class="pm-details">
            <h2 class="pm-title">${escapeHtml(p.name)}</h2>
            ${p.badge ? `<span class="product-badge" style="position:static;display:inline-block;margin-bottom:12px;">${escapeHtml(p.badge)}</span>` : ''}
            <p class="pm-desc">${escapeHtml(p.description || '')}</p>
            <div class="pm-price-row">
                <span class="pm-price">${parseFloat(p.price).toFixed(0)} DT</span>
                ${p.customizable ? `<span class="pm-custom-note">+${customPrice} DT pour personnalisation</span>` : ''}
            </div>
            ${hasSizes ? `
            <div class="pm-field">
                <label>Taille</label>
                <div class="pm-sizes" id="pmSizes">
                    ${p.sizes.map(s => `<button class="pm-size-btn" data-size="${escapeHtml(s)}" onclick="selectSize(this)">${escapeHtml(s)}</button>`).join('')}
                </div>
            </div>` : ''}
            ${p.customizable ? `
            <div class="pm-custom-section">
                <label class="pm-custom-toggle">
                    <input type="checkbox" id="pmCustomToggle" onchange="toggleCustomFields()">
                    <span><i class="fas fa-paint-brush"></i> Personnaliser ce maillot</span>
                </label>
                <div class="pm-custom-fields" id="pmCustomFields" style="display:none;">
                    <div class="pm-field">
                        <label>Nom au dos</label>
                        <input type="text" id="pmCustomName" maxlength="20" placeholder="Ex: KHENISSI">
                    </div>
                    <div class="pm-field">
                        <label>Numéro</label>
                        <input type="number" id="pmCustomNumber" min="1" max="99" placeholder="Ex: 9">
                    </div>
                    <label class="pm-custom-toggle pm-no-sponsor">
                        <input type="checkbox" id="pmNoSponsor">
                        <span><i class="fas fa-ban"></i> Sans sponsor (maillot vierge)</span>
                    </label>
                </div>
            </div>` : ''}
            <div class="pm-qty-row">
                <label>Quantité</label>
                <div class="pm-qty-ctrl">
                    <button onclick="pmQty(-1)">−</button>
                    <span id="pmQtyVal">1</span>
                    <button onclick="pmQty(1)">+</button>
                </div>
            </div>
            <button class="btn btn-primary btn-block pm-add-btn" onclick="addFromModal('${p._id || p.id}')">
                <i class="fas fa-cart-plus"></i> Ajouter au panier
            </button>
        </div>
    </div>`;

    document.getElementById('productModalContent').innerHTML = html;
    document.getElementById('productModal').classList.add('open');
    document.getElementById('productModalOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('open');
    document.getElementById('productModalOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function selectSize(btn) {
    btn.parentElement.querySelectorAll('.pm-size-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
}

function toggleCustomFields() {
    const on = document.getElementById('pmCustomToggle').checked;
    document.getElementById('pmCustomFields').style.display = on ? 'block' : 'none';
}

let pmQtyValue = 1;
function pmQty(d) {
    pmQtyValue = Math.max(1, Math.min(10, pmQtyValue + d));
    const el = document.getElementById('pmQtyVal');
    if (el) el.textContent = pmQtyValue;
}

function addFromModal(productId) {
    const products = DataManager.getAll('products');
    const p = products.find(x => (x._id || x.id) === productId);
    if (!p) return;

    const hasSizes = p.sizes && p.sizes.length > 0;
    let size = '';
    if (hasSizes) {
        const sel = document.querySelector('.pm-size-btn.selected');
        if (!sel) { showToast('Veuillez choisir une taille', 'error'); return; }
        size = sel.dataset.size;
    }

    let customization = null;
    let extraPrice = 0;
    const customToggle = document.getElementById('pmCustomToggle');
    if (customToggle && customToggle.checked) {
        const cName = (document.getElementById('pmCustomName').value || '').trim();
        const cNum = (document.getElementById('pmCustomNumber').value || '').trim();
        const noSponsor = document.getElementById('pmNoSponsor').checked;
        if (!cName && !cNum && !noSponsor) { showToast('Veuillez remplir au moins un champ de personnalisation', 'error'); return; }
        customization = { playerName: cName, playerNumber: cNum, noSponsor };
        extraPrice = p.customPrice || 20;
    }

    const qty = pmQtyValue;
    pmQtyValue = 1;
    const unitPrice = p.price + extraPrice;

    // Check if same item already in cart (same product, same size, same customization)
    const customKey = customization ? JSON.stringify(customization) : '';
    const existing = shopCart.find(c => c.productId === productId && c.size === size && JSON.stringify(c.customization || '') === (customKey || ''));
    if (existing) { existing.qty += qty; } else {
        shopCart.push({ productId, name: p.name, price: unitPrice, image: p.image || '', qty, size, customization });
    }

    saveCart();
    closeProductModal();
    showToast(`${p.name} ajouté au panier !`, 'success');
}

/* ---------- Cart Drawer ---------- */
function openCartDrawer() {
    renderCartDrawer();
    document.getElementById('cartDrawer').classList.add('open');
    document.getElementById('cartOverlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCartDrawer() {
    document.getElementById('cartDrawer').classList.remove('open');
    document.getElementById('cartOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function renderCartDrawer() {
    const body = document.getElementById('cartDrawerBody');
    const footer = document.getElementById('cartDrawerFooter');

    if (!shopCart.length) {
        body.innerHTML = '<div class="cart-empty"><i class="fas fa-shopping-bag"></i><p>Votre panier est vide</p></div>';
        footer.style.display = 'none';
        return;
    }

    body.innerHTML = shopCart.map((item, i) => {
        const img = item.image ? `<img src="${escapeHtml(item.image)}" alt="">` : '<i class="fas fa-box"></i>';
        let details = '';
        if (item.size) details += `<span class="ci-tag">Taille: ${escapeHtml(item.size)}</span>`;
        if (item.customization) {
            if (item.customization.playerName) details += `<span class="ci-tag"><i class="fas fa-user"></i> ${escapeHtml(item.customization.playerName)}</span>`;
            if (item.customization.playerNumber) details += `<span class="ci-tag">#${escapeHtml(item.customization.playerNumber)}</span>`;
            if (item.customization.noSponsor) details += `<span class="ci-tag"><i class="fas fa-ban"></i> Sans sponsor</span>`;
        }
        return `<div class="cart-item">
            <div class="ci-img">${img}</div>
            <div class="ci-info">
                <div class="ci-name">${escapeHtml(item.name)}</div>
                ${details ? `<div class="ci-tags">${details}</div>` : ''}
                <div class="ci-bottom">
                    <div class="ci-qty-ctrl">
                        <button onclick="cartItemQty(${i},-1)">−</button>
                        <span>${item.qty}</span>
                        <button onclick="cartItemQty(${i},1)">+</button>
                    </div>
                    <span class="ci-price">${(item.price * item.qty).toFixed(0)} DT</span>
                </div>
            </div>
            <button class="ci-remove" onclick="removeCartItem(${i})" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
        </div>`;
    }).join('');

    footer.style.display = 'block';
    recalcCartTotals();
}

function cartItemQty(index, delta) {
    shopCart[index].qty = Math.max(1, Math.min(10, shopCart[index].qty + delta));
    saveCart(); renderCartDrawer();
}

function removeCartItem(index) {
    shopCart.splice(index, 1);
    saveCart(); renderCartDrawer();
}

function recalcCartTotals() {
    const subtotal = shopCart.reduce((s, i) => s + i.price * i.qty, 0);
    let discount = 0;
    if (shopPromo.code) {
        discount = shopPromo.type === 'percent' ? Math.round(subtotal * shopPromo.discount / 100) : shopPromo.discount;
    }
    const total = subtotal - discount + SHIPPING_COST;
    document.getElementById('cartSubtotal').textContent = subtotal.toFixed(0) + ' DT';
    document.getElementById('cartShipping').textContent = SHIPPING_COST + ' DT';
    document.getElementById('cartTotal').textContent = total.toFixed(0) + ' DT';
    const discLine = document.getElementById('cartDiscountLine');
    if (discount > 0) {
        discLine.style.display = 'flex';
        document.getElementById('cartDiscount').textContent = '-' + discount.toFixed(0) + ' DT';
    } else { discLine.style.display = 'none'; }
}

async function applyCartPromo() {
    const input = document.getElementById('cartPromoInput');
    const code = (input.value || '').trim().toUpperCase();
    if (!code) { showToast('Entrez un code promo', 'error'); return; }
    try {
        const token = localStorage.getItem('cssUserToken');
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = 'Bearer ' + token;
        const res = await fetch('/api/user/validate-promo', { method: 'POST', headers, body: JSON.stringify({ code }) });
        const data = await res.json();
        if (data.valid) {
            shopPromo = { code, discount: data.discount, type: data.type };
            showToast(`Code ${code} appliqué : -${data.discount}${data.type === 'percent' ? '%' : ' DT'}`, 'success');
            recalcCartTotals();
        } else { showToast(data.message || 'Code invalide', 'error'); shopPromo = { code: '', discount: 0, type: '' }; }
    } catch { showToast('Erreur de vérification', 'error'); }
}

/* ---------- Checkout Modal ---------- */
function openCheckoutModal() {
    const token = localStorage.getItem('cssUserToken');
    if (!token) {
        showToast('Veuillez vous connecter pour commander', 'error');
        closeCartDrawer();
        if (typeof openAuthModal === 'function') openAuthModal();
        return;
    }
    if (!shopCart.length) { showToast('Votre panier est vide', 'error'); return; }

    const subtotal = shopCart.reduce((s, i) => s + i.price * i.qty, 0);
    let discount = 0;
    if (shopPromo.code) {
        discount = shopPromo.type === 'percent' ? Math.round(subtotal * shopPromo.discount / 100) : shopPromo.discount;
    }
    const total = subtotal - discount + SHIPPING_COST;

    const itemsHtml = shopCart.map(item => {
        let det = [];
        if (item.size) det.push('Taille ' + item.size);
        if (item.customization?.playerName) det.push(item.customization.playerName);
        if (item.customization?.playerNumber) det.push('#' + item.customization.playerNumber);
        if (item.customization?.noSponsor) det.push('Sans sponsor');
        return `<div class="co-item"><span>${escapeHtml(item.name)} x${item.qty}</span><span>${det.length ? `<small>(${det.join(', ')})</small> ` : ''}${(item.price * item.qty).toFixed(0)} DT</span></div>`;
    }).join('');

    const html = `
    <div class="checkout-steps">
        <div class="co-step active" data-step="1"><span>1</span> Livraison</div>
        <div class="co-step" data-step="2"><span>2</span> Paiement</div>
        <div class="co-step" data-step="3"><span>3</span> Confirmation</div>
    </div>

    <!-- Step 1: Shipping -->
    <div class="co-panel" id="coStep1">
        <h3><i class="fas fa-truck"></i> Adresse de livraison</h3>
        <div class="co-form">
            <div class="co-field"><label>Nom complet</label><input type="text" id="coShipName" placeholder="Ex: Mohamed Ben Ali" required></div>
            <div class="co-field"><label>Adresse</label><input type="text" id="coShipAddr" placeholder="Ex: 12 Rue de la République" required></div>
            <div class="co-row">
                <div class="co-field"><label>Ville</label><input type="text" id="coShipCity" placeholder="Ex: Sfax" required></div>
                <div class="co-field"><label>Code postal</label><input type="text" id="coShipZip" placeholder="3000" maxlength="5" required></div>
            </div>
            <div class="co-field"><label>Téléphone</label><input type="tel" id="coShipPhone" placeholder="+216 XX XXX XXX" required></div>
        </div>
        <button class="btn btn-primary btn-block" onclick="checkoutStep(2)"><i class="fas fa-arrow-right"></i> Continuer vers le paiement</button>
    </div>

    <!-- Step 2: Payment -->
    <div class="co-panel" id="coStep2" style="display:none;">
        <h3><i class="fas fa-credit-card"></i> Paiement</h3>
        <div class="co-order-summary">
            <h4>Récapitulatif</h4>
            ${itemsHtml}
            <div class="co-item co-subtotal"><span>Sous-total</span><span>${subtotal.toFixed(0)} DT</span></div>
            ${discount > 0 ? `<div class="co-item co-disc"><span>Remise (${escapeHtml(shopPromo.code)})</span><span>-${discount.toFixed(0)} DT</span></div>` : ''}
            <div class="co-item"><span>Livraison</span><span>${SHIPPING_COST} DT</span></div>
            <div class="co-item co-total"><span>Total à payer</span><span>${total.toFixed(0)} DT</span></div>
        </div>
        <div style="margin-top:20px;text-align:center;">
            <p style="color:#aaa;margin-bottom:15px;font-size:0.9em;"><i class="fas fa-shield-alt" style="color:#4CAF50;"></i> Paiement sécurisé via Flouci</p>
            <button class="btn btn-primary btn-block" onclick="submitFlouciPayment('boutique')" style="background:linear-gradient(135deg,#D4A843,#c4963a);font-size:1.1em;padding:15px;">
                <i class="fas fa-lock"></i> Payer ${total.toFixed(0)} DT avec Flouci
            </button>
            <div id="flouciPaymentStatus" style="margin-top:12px;color:#aaa;display:none;"><i class="fas fa-spinner fa-spin"></i> Redirection vers Flouci...</div>
        </div>
        <button class="btn btn-ghost btn-block" onclick="checkoutStep(1)"><i class="fas fa-arrow-left"></i> Retour</button>
    </div>

    <!-- Step 3: Confirmation -->
    <div class="co-panel" id="coStep3" style="display:none;">
        <div class="co-success" id="coSuccess"></div>
    </div>`;

    document.getElementById('checkoutContent').innerHTML = html;
    document.getElementById('checkoutModal').classList.add('open');
    document.getElementById('checkoutOverlay').classList.add('open');
    closeCartDrawer();
}

function closeCheckoutModal() {
    document.getElementById('checkoutModal').classList.remove('open');
    document.getElementById('checkoutOverlay').classList.remove('open');
    document.body.style.overflow = '';
}

function checkoutStep(step) {
    if (step === 2) {
        const name = document.getElementById('coShipName').value.trim();
        const addr = document.getElementById('coShipAddr').value.trim();
        const city = document.getElementById('coShipCity').value.trim();
        const phone = document.getElementById('coShipPhone').value.trim();
        if (!name || !addr || !city || !phone) { showToast('Veuillez remplir tous les champs de livraison', 'error'); return; }
    }
    document.querySelectorAll('.co-panel').forEach(p => p.style.display = 'none');
    document.getElementById('coStep' + step).style.display = 'block';
    document.querySelectorAll('.co-step').forEach(s => {
        s.classList.toggle('active', parseInt(s.dataset.step) <= step);
    });
}

function formatCardNum(el) {
    let v = el.value.replace(/\D/g, '').substring(0, 16);
    el.value = v.replace(/(.{4})/g, '$1 ').trim();
}
function formatCardExp(el) {
    let v = el.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 3) v = v.substring(0, 2) + '/' + v.substring(2);
    el.value = v;
}

async function submitFlouciPayment(type, extraData) {
    const statusEl = document.getElementById('flouciPaymentStatus');
    if (statusEl) { statusEl.style.display = 'block'; statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Préparation du paiement...'; }

    let payload = { type };

    if (type === 'boutique') {
        const token = localStorage.getItem('cssUserToken');
        if (!token) { showToast('Session expirée, reconnectez-vous', 'error'); return; }

        payload.items = shopCart.map(item => ({
            type: 'product', productId: item.productId, label: item.name,
            details: [item.size ? 'Taille ' + item.size : '', item.customization?.playerName || '', item.customization?.playerNumber ? '#' + item.customization.playerNumber : '', item.customization?.noSponsor ? 'Sans sponsor' : ''].filter(Boolean).join(' | '),
            quantity: item.qty, unitPrice: item.price, image: item.image, size: item.size || '', customization: item.customization || {}
        }));
        payload.shipping = {
            fullName: document.getElementById('coShipName').value.trim(),
            address: document.getElementById('coShipAddr').value.trim(),
            city: document.getElementById('coShipCity').value.trim(),
            zip: document.getElementById('coShipZip').value.trim(),
            phone: document.getElementById('coShipPhone').value.trim()
        };
        payload.promoCode = shopPromo.code || '';
    } else if (extraData) {
        Object.assign(payload, extraData);
    }

    try {
        const res = await fetch(API_BASE + '/payment/initiate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();

        if (data.success && data.paymentUrl) {
            if (type === 'boutique') { shopCart = []; shopPromo = { code: '', discount: 0, type: '' }; saveCart(); }
            if (statusEl) statusEl.innerHTML = '<i class="fas fa-external-link-alt"></i> Redirection vers Flouci...';
            window.location.href = data.paymentUrl;
        } else {
            showToast(data.error || 'Erreur lors du paiement', 'error');
            if (statusEl) statusEl.style.display = 'none';
        }
    } catch(e) {
        showToast('Erreur réseau', 'error');
        if (statusEl) statusEl.style.display = 'none';
    }
}

let currentNewsFilter = 'all';

function loadNews(filterCategory) {
    const news = DataManager.getAll('news');
    const grid = document.getElementById('newsGrid');
    if (!grid) return;

    if (filterCategory !== undefined) currentNewsFilter = filterCategory;

    if (!news.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-newspaper"></i><p>Aucune nouvelle.</p></div>';
        return;
    }

    news.sort((a, b) => new Date(b.date) - new Date(a.date));

    const filtered = currentNewsFilter === 'all' ? news : news.filter(a => a.category === currentNewsFilter);

    if (!filtered.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-newspaper"></i><p>Aucune nouvelle dans cette catégorie.</p></div>';
        return;
    }

    grid.innerHTML = filtered.map((a, i) => {
        const date = new Date(a.date).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
        const img = a.image ? `<img src="${escapeHtml(a.image)}" alt="${escapeHtml(a.title)}">` : '<i class="fas fa-newspaper"></i>';
        const excerpt = a.content ? a.content.substring(0, 140) + '...' : '';
        const catIcon = getNewsCategoryIcon(a.category);

        return `<div class="news-card revealed filter-show" data-category="${escapeHtml(a.category || 'Actualité')}" style="animation-delay:${i * 0.08}s">
            <div class="news-image">
                ${img}
                <span class="news-category"><i class="${catIcon}"></i> ${escapeHtml(a.category || 'Actualité')}</span>
            </div>
            <div class="news-content">
                <div class="news-date"><i class="far fa-calendar-alt"></i> ${date}</div>
                <h3 class="news-title">${escapeHtml(a.title)}</h3>
                <p class="news-excerpt">${escapeHtml(excerpt)}</p>
                <a href="#" class="news-read-more" onclick="showFullNews('${a.id}');return false;">
                    Lire la suite <i class="fas fa-arrow-right"></i>
                </a>
            </div>
        </div>`;
    }).join('');
}

function getNewsCategoryIcon(cat) {
    const icons = {
        'Match': 'fas fa-futbol',
        'Transfert': 'fas fa-exchange-alt',
        'Entraînement': 'fas fa-running',
        'Actualité': 'fas fa-star',
        'Communiqué': 'fas fa-bullhorn',
    };
    return icons[cat] || 'fas fa-newspaper';
}

function initNewsFilters() {
    const filtersContainer = document.getElementById('newsFilters');
    if (!filtersContainer) return;

    const news = DataManager.getAll('news');
    const counts = { all: news.length };
    news.forEach(n => {
        const cat = n.category || 'Actualité';
        counts[cat] = (counts[cat] || 0) + 1;
    });

    // Add count badges to filter buttons
    filtersContainer.querySelectorAll('.news-filter').forEach(btn => {
        const filter = btn.dataset.filter;
        const count = counts[filter] || 0;
        if (filter !== 'all' && count === 0) {
            btn.style.display = 'none';
            return;
        }
        const badge = document.createElement('span');
        badge.className = 'news-count-badge';
        badge.textContent = filter === 'all' ? counts.all : count;
        btn.appendChild(badge);
    });

    filtersContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.news-filter');
        if (!btn) return;

        filtersContainer.querySelectorAll('.news-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.dataset.filter;
        loadNews(filter);
    });
}

// ======================================================================
// NEWS MODAL
// ======================================================================
function showFullNews(newsId) {
    const news = DataManager.getAll('news');
    const article = news.find(n => n.id === newsId);
    if (!article) return;

    const date = new Date(article.date).toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });

    const modal = document.createElement('div');
    modal.className = 'news-modal';
    modal.style.cssText = `
        position:fixed; inset:0; background:rgba(0,0,0,0); z-index:99999;
        display:flex; align-items:center; justify-content:center; padding:20px;
        transition:background 0.5s ease; backdrop-filter:blur(0);
    `;
    modal.innerHTML = `
        <div class="news-modal-content" style="
            background:white; border-radius:20px; max-width:700px; width:100%;
            max-height:90vh; overflow-y:auto; padding:45px; position:relative;
            transform:translateY(50px) scale(0.9) rotateX(15deg); opacity:0;
            transition:all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
            box-shadow:0 40px 80px rgba(0,0,0,0.3);
        ">
            <button onclick="closeNewsModal(this)" style="
                position:absolute; top:18px; right:22px; background:none; border:none;
                font-size:1.6rem; cursor:auto; color:#bbb; width:40px; height:40px;
                border-radius:50%; display:flex; align-items:center; justify-content:center;
                transition:all 0.3s ease;
            " onmouseover="this.style.background='#f0f0f0';this.style.color='#333';this.style.transform='rotate(90deg)'"
               onmouseout="this.style.background='';this.style.color='#bbb';this.style.transform=''">&times;</button>
            <span style="display:inline-block;background:linear-gradient(135deg,#000,#333);color:white;padding:5px 16px;border-radius:25px;font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin-bottom:18px;font-family:'Montserrat',sans-serif;">
                ${escapeHtml(article.category || 'Actualité')}
            </span>
            <h2 style="font-family:'Montserrat',sans-serif;font-size:1.5rem;font-weight:800;margin-bottom:10px;color:var(--primary-dark);line-height:1.3;">
                ${escapeHtml(article.title)}
            </h2>
            <p style="color:var(--text-light);font-size:0.82rem;margin-bottom:25px;font-family:'Space Grotesk',sans-serif;">
                <i class="far fa-calendar-alt"></i> ${date}
            </p>
            <div style="line-height:1.9;color:var(--text);white-space:pre-wrap;font-size:0.95rem;">${escapeHtml(article.content)}</div>
        </div>`;
    
    modal.addEventListener('click', e => {
        if (e.target === modal) closeNewsModal(modal.querySelector('button'));
    });

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
        modal.style.background = 'rgba(0,0,0,0.7)';
        modal.style.backdropFilter = 'blur(10px)';
        const content = modal.querySelector('.news-modal-content');
        content.style.transform = 'translateY(0) scale(1) rotateX(0)';
        content.style.opacity = '1';
    });
}

function closeNewsModal(btn) {
    const modal = btn.closest('.news-modal');
    modal.style.background = 'rgba(0,0,0,0)';
    modal.style.backdropFilter = 'blur(0)';
    const content = modal.querySelector('.news-modal-content');
    content.style.transform = 'translateY(50px) scale(0.9) rotateX(15deg)';
    content.style.opacity = '0';
    document.body.style.overflow = '';
    setTimeout(() => modal.remove(), 700);
}

// ======================================================================
// HERO STATS
// ======================================================================
function updateHeroStats() {
    const matches = DataManager.getAll('matches');
    let w = 0, d = 0, l = 0;
    matches.forEach(m => {
        const hs = parseInt(m.homeScore), as = parseInt(m.awayScore);
        if (m.isHome) {
            if (hs > as) w++; else if (hs < as) l++; else d++;
        } else {
            if (as > hs) w++; else if (as < hs) l++; else d++;
        }
    });
    // Set values directly for instant display
    const wEl = document.getElementById('heroWins');
    const dEl = document.getElementById('heroDraws');
    const lEl = document.getElementById('heroLosses');
    if (wEl) { wEl.textContent = w; wEl.dataset.target = w; }
    if (dEl) { dEl.textContent = d; dEl.dataset.target = d; }
    if (lEl) { lEl.textContent = l; lEl.dataset.target = l; }
}

// ======================================================================
// NEXT MATCH BANNER
// ======================================================================
function updateNextMatch() {
    const fixtures = DataManager.getAll('fixtures');
    const info = document.getElementById('nextMatchInfo');
    if (!info) return;

    const now = new Date();
    const future = fixtures.filter(f => new Date(f.date) >= now).sort((a, b) => new Date(a.date) - new Date(b.date));

    if (!future.length) {
        info.innerHTML = '<span class="next-match-detail">Aucun match prévu prochainement</span>';
        return;
    }

    const next = future[0];
    const date = new Date(next.date).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });

    info.innerHTML = `
        <span class="next-match-detail">${escapeHtml(next.homeTeam)}</span>
        <span class="next-match-vs">⚡ VS ⚡</span>
        <span class="next-match-detail">${escapeHtml(next.awayTeam)}</span>
        <span class="next-match-date"><i class="far fa-calendar"></i> ${date} à ${escapeHtml(next.time || 'TBD')}</span>
    `;
}

// ======================================================================
// TOAST
// ======================================================================
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 50);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 600);
    }, 3000);
}

// ======================================================================
// GALLERY DATA & RENDERING
// ======================================================================
function getGalleryData() {
    return DataManager.getAll('gallery');
}

const galleryIcons = {
    'match-photo': 'fas fa-futbol',
    'training-photo': 'fas fa-running',
    'video': 'fas fa-play-circle',
    'fans': 'fas fa-users',
    'stadium': 'fas fa-building',
};

let currentGalleryFilter = 'all';
let lightboxIndex = 0;
let filteredGallery = [];

function updateGalleryStats() {
    const galleryData = getGalleryData();
    const photos = galleryData.filter(g => g.type === 'photo').length;
    const videos = galleryData.filter(g => g.type === 'video').length;
    const matchMedia = galleryData.filter(g => g.category === 'match-photo' || (g.category === 'video' && g.title.toLowerCase().includes('résumé'))).length;
    const trainingMedia = galleryData.filter(g => g.category === 'training-photo' || (g.category === 'video' && g.title.toLowerCase().includes('entraînement'))).length;

    const update = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };
    update('photoCount', photos);
    update('videoCount', videos);
    update('matchMediaCount', matchMedia);
    update('trainingMediaCount', trainingMedia);
}

function loadGallery(filter = 'all') {
    const grid = document.getElementById('galleryGrid');
    if (!grid) return;

    const galleryData = getGalleryData();
    currentGalleryFilter = filter;
    filteredGallery = filter === 'all' ? [...galleryData] : galleryData.filter(g => g.category === filter);

    // Sort by date (newest first)
    filteredGallery.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (!filteredGallery.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-images"></i><p>Aucun média dans cette catégorie.</p></div>';
        return;
    }

    grid.innerHTML = filteredGallery.map((item, i) => {
        const layoutClass = item.layout === 'wide' ? ' gallery-wide' : item.layout === 'tall' ? ' gallery-tall' : '';
        const iconClass = galleryIcons[item.category] || 'fas fa-image';
        const isVideo = item.type === 'video';
        const videoClass = isVideo ? ' gallery-video' : '';

        const typeTag = isVideo 
            ? `<span class="gallery-type-badge gallery-type-video"><i class="fas fa-play"></i> Vidéo</span>`
            : `<span class="gallery-type-badge gallery-type-photo"><i class="fas fa-camera"></i> Photo</span>`;

        const durationTag = isVideo && item.duration 
            ? `<span class="gallery-duration"><i class="fas fa-clock"></i> ${item.duration}</span>` 
            : '';

        const dateStr = new Date(item.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

        return `<div class="gallery-item${layoutClass}${videoClass}" data-index="${i}" onclick="openLightbox(${i})" style="transition-delay:${i * 60}ms">
            <div class="gallery-item-inner">
                ${item.image ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">` : `<i class="${iconClass}"></i>`}
                ${isVideo && item.videoUrl ? `<video src="${escapeHtml(item.videoUrl)}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;" muted></video>` : ''}
                ${isVideo ? '<div class="gallery-play-btn"><i class="fas fa-play"></i></div>' : ''}
            </div>
            ${typeTag}
            ${durationTag}
            <div class="gallery-overlay">
                <div class="gallery-zoom"><i class="${isVideo ? 'fas fa-play' : 'fas fa-expand'}"></i></div>
                <h4>${escapeHtml(item.title)}</h4>
                <p>${escapeHtml(item.desc)}</p>
                <span class="gallery-date"><i class="far fa-calendar-alt"></i> ${dateStr}</span>
            </div>
        </div>`;
    }).join('');

    updateGalleryStats();

    // Trigger reveal after render
    setTimeout(() => {
        grid.querySelectorAll('.gallery-item').forEach((item, i) => {
            setTimeout(() => item.classList.add('revealed'), i * 80);
        });
    }, 50);
}

function initGalleryFilters() {
    const filters = document.querySelectorAll('.gallery-filter');
    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            filters.forEach(f => f.classList.remove('active'));
            btn.classList.add('active');
            loadGallery(btn.dataset.filter);
        });
    });
}

// ======================================================================
// LIGHTBOX
// ======================================================================
function openLightbox(index) {
    lightboxIndex = index;
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    updateLightboxContent();
    lightbox.style.display = 'flex';
    requestAnimationFrame(() => {
        lightbox.classList.add('active');
    });
    document.body.style.overflow = 'hidden';
}

function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    setTimeout(() => { lightbox.style.display = 'none'; }, 500);
}

function updateLightboxContent() {
    const item = filteredGallery[lightboxIndex];
    if (!item) return;

    const titleEl = document.getElementById('lightboxTitle');
    const descEl = document.getElementById('lightboxDesc');
    const counterEl = document.getElementById('lightboxCounter');
    const mediaEl = document.getElementById('lightboxMedia');
    const typeEl = document.getElementById('lightboxType');

    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = item.desc;
    if (counterEl) counterEl.textContent = `${lightboxIndex + 1} / ${filteredGallery.length}`;
    
    if (typeEl) {
        const isVid = item.type === 'video';
        typeEl.className = 'lightbox-type ' + (isVid ? 'lightbox-type-video' : 'lightbox-type-photo');
        typeEl.innerHTML = isVid 
            ? '<i class="fas fa-play-circle"></i> Vidéo' + (item.duration ? ' · ' + item.duration : '')
            : '<i class="fas fa-camera"></i> Photo';
    }

    if (mediaEl) {
        const iconClass = galleryIcons[item.category] || 'fas fa-image';
        if (item.type === 'video' && item.videoUrl) {
            mediaEl.innerHTML = `<video src="${escapeHtml(item.videoUrl)}" controls style="width:100%;max-height:80vh;border-radius:12px;"></video>`;
        } else if (item.type === 'video') {
            mediaEl.innerHTML = `
                <div class="lightbox-video-placeholder">
                    <div class="lightbox-video-icon"><i class="fas fa-play"></i></div>
                    <div class="lightbox-video-info">
                        <span class="lightbox-video-duration"><i class="fas fa-clock"></i> ${item.duration || ''}</span>
                        <span class="lightbox-video-label">Cliquez pour regarder</span>
                    </div>
                    <i class="${iconClass} lightbox-video-bg-icon"></i>
                </div>`;
        } else if (item.image) {
            mediaEl.innerHTML = `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" style="width:100%;max-height:80vh;object-fit:contain;border-radius:12px;">`;
        } else {
            mediaEl.innerHTML = `<div class="lightbox-icon" id="lightboxIcon"><i class="${iconClass}"></i></div>`;
        }
    }
}

function lightboxPrev() {
    lightboxIndex = (lightboxIndex - 1 + filteredGallery.length) % filteredGallery.length;
    updateLightboxContent();
}

function lightboxNext() {
    lightboxIndex = (lightboxIndex + 1) % filteredGallery.length;
    updateLightboxContent();
}

function initLightbox() {
    const close = document.getElementById('lightboxClose');
    const prev = document.getElementById('lightboxPrev');
    const next = document.getElementById('lightboxNext');
    const lightbox = document.getElementById('lightbox');

    if (close) close.addEventListener('click', closeLightbox);
    if (prev) prev.addEventListener('click', lightboxPrev);
    if (next) next.addEventListener('click', lightboxNext);
    if (lightbox) lightbox.addEventListener('click', e => {
        if (e.target === lightbox) closeLightbox();
    });

    // Keyboard nav
    document.addEventListener('keydown', e => {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') lightboxPrev();
        if (e.key === 'ArrowRight') lightboxNext();
    });
}

// ======================================================================
// EFFECTIF / SQUAD DATA & RENDERING
// ======================================================================
function getSquadData() {
    const players = DataManager.getAll('players');
    const coach = players.find(p => p.category === 'coach');
    return {
        coach: coach || { name: '', role: '', nationality: '', icon: 'fas fa-chalkboard-teacher' },
        staff: players.filter(p => p.category === 'staff'),
        goalkeepers: players.filter(p => p.category === 'goalkeepers'),
        defenders: players.filter(p => p.category === 'defenders'),
        midfielders: players.filter(p => p.category === 'midfielders'),
        attackers: players.filter(p => p.category === 'attackers'),
    };
}

function getStatLabels(positionLabel) {
    if (positionLabel === 'Gardien') {
        return [
            { key: 'matchs', label: 'Matchs', icon: 'fas fa-gamepad' },
            { key: 'cleanSheets', label: 'Clean Sheets', icon: 'fas fa-shield-alt' },
            { key: 'arrets', label: 'Arrêts', icon: 'fas fa-hand-paper' },
            { key: 'buts', label: 'Buts', icon: 'fas fa-futbol' }
        ];
    }
    if (positionLabel === 'Défenseur') {
        return [
            { key: 'matchs', label: 'Matchs', icon: 'fas fa-gamepad' },
            { key: 'buts', label: 'Buts', icon: 'fas fa-futbol' },
            { key: 'passes', label: 'Passes D.', icon: 'fas fa-hands-helping' },
            { key: 'tacles', label: 'Tacles', icon: 'fas fa-shoe-prints' }
        ];
    }
    if (positionLabel === 'Attaquant') {
        return [
            { key: 'matchs', label: 'Matchs', icon: 'fas fa-gamepad' },
            { key: 'buts', label: 'Buts', icon: 'fas fa-futbol' },
            { key: 'passes', label: 'Passes D.', icon: 'fas fa-hands-helping' },
            { key: 'tirs', label: 'Tirs', icon: 'fas fa-crosshairs' }
        ];
    }
    // Milieu
    return [
        { key: 'matchs', label: 'Matchs', icon: 'fas fa-gamepad' },
        { key: 'buts', label: 'Buts', icon: 'fas fa-futbol' },
        { key: 'passes', label: 'Passes D.', icon: 'fas fa-hands-helping' },
        { key: 'tacles', label: 'Tacles', icon: 'fas fa-shoe-prints' }
    ];
}

function renderPlayerCard(player, positionLabel) {
    const statLabels = getStatLabels(positionLabel);
    const statsHtml = statLabels.map(s => {
        const val = player.stats ? (player.stats[s.key] || 0) : 0;
        return `<div class="player-stat">
            <div class="player-stat-value">${val}</div>
            <div class="player-stat-label"><i class="${s.icon}"></i> ${s.label}</div>
        </div>`;
    }).join('');

    const imgSrc = player.image || '';
    const safeName = escapeHtml(player.name);
    const safeNat = escapeHtml(player.nationality);
    const safePos = escapeHtml(positionLabel);
    const photoContent = imgSrc 
        ? `<img src="${escapeHtml(imgSrc)}" alt="${safeName}" class="player-avatar-img" loading="lazy">`
        : '<i class="fas fa-user"></i>';

    return `
        <div class="player-card">
            <div class="player-photo">
                <span class="player-number-bg">${player.number}</span>
                <span class="player-number-badge">${player.number}</span>
                ${photoContent}
                <span class="player-flag">${safeNat}</span>
            </div>
            <div class="player-info">
                <div class="player-name">${safeName}</div>
                <div class="player-position"><i class="fas fa-tshirt"></i> ${safePos}</div>
                <div class="player-meta">
                    <span class="player-age"><i class="fas fa-birthday-cake"></i> ${player.age} ans</span>
                    <span class="player-value"><i class="fas fa-tag"></i> ${player.value || 'N/A'}</span>
                </div>
                <div class="player-stats-grid">
                    ${statsHtml}
                </div>
            </div>
        </div>
    `;
}

function renderStaffCard(staff, isCoach = false) {
    const photoContent = staff.image
        ? `<img src="${escapeHtml(staff.image)}" alt="${escapeHtml(staff.name)}" class="staff-avatar-img" loading="lazy">`
        : `<i class="${staff.icon}"></i>`;
    return `
        <div class="staff-card${isCoach ? ' coach-card' : ''}">
            <div class="staff-avatar">${photoContent}</div>
            <div class="staff-details">
                <div class="staff-name">${escapeHtml(staff.name)}</div>
                <div class="staff-role">${escapeHtml(staff.role)}</div>
                <div class="staff-nationality">${escapeHtml(staff.nationality)}</div>
            </div>
        </div>
    `;
}

function loadSquad() {
    const gkGrid = document.getElementById('goalkeepersGrid');
    const defGrid = document.getElementById('defendersGrid');
    const midGrid = document.getElementById('midfieldersGrid');
    const atkGrid = document.getElementById('attackersGrid');
    const coachGrid = document.getElementById('coachGrid');
    const staffGrid = document.getElementById('staffGrid');

    const squadData = getSquadData();
    if (coachGrid) coachGrid.innerHTML = renderStaffCard(squadData.coach, true);
    if (gkGrid) gkGrid.innerHTML = squadData.goalkeepers.map(p => renderPlayerCard(p, 'Gardien')).join('');
    if (defGrid) defGrid.innerHTML = squadData.defenders.map(p => renderPlayerCard(p, 'Défenseur')).join('');
    if (midGrid) midGrid.innerHTML = squadData.midfielders.map(p => renderPlayerCard(p, 'Milieu')).join('');
    if (atkGrid) atkGrid.innerHTML = squadData.attackers.map(p => renderPlayerCard(p, 'Attaquant')).join('');
    if (staffGrid) staffGrid.innerHTML = squadData.staff.map(s => renderStaffCard(s)).join('');
}

function switchEffectifTab(tab) {
    document.querySelectorAll('.effectif-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.effectif-panel').forEach(p => p.classList.remove('active'));
    const activeBtn = document.querySelector(`.effectif-tab[data-tab="${tab}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    const panel = tab === 'players' ? document.getElementById('panelPlayers') : document.getElementById('panelStaff');
    if (panel) {
        panel.classList.add('active');
        panel.querySelectorAll('.squad-position-group, .squad-staff-section').forEach(el => el.classList.add('revealed'));
        panel.querySelectorAll('.player-card, .staff-card').forEach(el => el.classList.add('revealed'));
    }
}

// ======================================================================
// HISTORY DATA & RENDERING
// ======================================================================

// History data loaded from localStorage via DataManager

function renderTimeline() {
    const container = document.getElementById('historyTimeline');
    if (!container) return;

    const historyTimeline = DataManager.getAll('timeline');
    container.innerHTML = historyTimeline.map((item, i) => `
        <div class="timeline-item" style="transition-delay: ${i * 0.1}s">
            <div class="timeline-dot"></div>
            <div class="timeline-content">
                <div class="timeline-year"><i class="fas ${item.icon}"></i> ${item.year}</div>
                <div class="timeline-title">${item.title}</div>
                <div class="timeline-desc">${item.desc}</div>
            </div>
        </div>
    `).join('');
}

function renderTrophies() {
    const grid = document.getElementById('trophiesGrid');
    const totalEl = document.getElementById('trophyTotalCount');
    if (!grid) return;

    const trophiesData = DataManager.getAll('trophies');
    const total = trophiesData.reduce((sum, t) => sum + t.count, 0);
    if (totalEl) totalEl.textContent = total;

    grid.innerHTML = trophiesData.map((trophy, i) => `
        <div class="trophy-card" style="transition-delay: ${i * 0.12}s">
            <div class="trophy-icon"><i class="fas ${trophy.icon}"></i></div>
            <div class="trophy-name">${trophy.name}</div>
            <div class="trophy-count">${trophy.count}</div>
            <div class="trophy-count-label">${trophy.count > 1 ? 'Titres' : 'Titre'}</div>
            <div class="trophy-years">
                ${trophy.years.map(y => `<span class="trophy-year-tag">${y}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

function renderLegends() {
    const grid = document.getElementById('legendsGrid');
    if (!grid) return;

    const legendsData = DataManager.getAll('legends');
    grid.innerHTML = legendsData.map((legend, i) => `
        <div class="legend-card" style="transition-delay: ${i * 0.12}s">
            <div class="legend-photo">
                ${legend.number ? `<span class="legend-number">${legend.number}</span>` : ''}
                <span class="legend-era-badge">${escapeHtml(legend.era)}</span>
                <img src="${escapeHtml(legend.image)}" alt="${escapeHtml(legend.name)}" loading="lazy">
            </div>
            <div class="legend-info">
                <div class="legend-name">${escapeHtml(legend.name)}</div>
                <div class="legend-position"><i class="fas fa-shirt"></i> ${escapeHtml(legend.position)}</div>
                <div class="legend-desc">${escapeHtml(legend.desc)}</div>
                <div class="legend-stats">
                    ${Object.entries(legend.stats).map(([key, val]) => `
                        <div class="legend-stat">
                            <span class="legend-stat-val">${val}</span>
                            <span class="legend-stat-lbl">${key}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}

function loadHistory() {
    renderTimeline();
    renderTrophies();
    renderLegends();
}

// ======================================================================
// TICKETING DATA & RENDERING
// ======================================================================

function getTicketMatchesData() { return DataManager.getAll('ticketMatches'); }
function getStadiumZonesData() { return DataManager.getAll('stadiumZones'); }
function getZonePrices() {
    const zones = getStadiumZonesData();
    const prices = {};
    zones.forEach(z => {
        const key = z.name.toLowerCase().replace(/tribune\s*/i,'').replace(/\s*\(.*\)/,'').trim();
        prices[key] = z.price;
    });
    return prices;
}

function loadTickets() {
    const grid = document.getElementById('ticketMatchesGrid');
    if (!grid) return;

    const ticketMatchesData = getTicketMatchesData();
    grid.innerHTML = ticketMatchesData.map(m => `
        <div class="ticket-match-card" data-reveal="up">
            <div class="tmc-header">
                <span class="tmc-comp">${m.comp}</span>
                <span class="tmc-date"><i class="far fa-calendar-alt"></i> ${m.date}</span>
            </div>
            <div class="tmc-body">
                <div class="tmc-team">
                    <div class="tmc-team-icon"><i class="fas fa-futbol"></i></div>
                    <div class="tmc-team-name">${m.home}</div>
                </div>
                <div class="tmc-vs">${m.time}</div>
                <div class="tmc-team">
                    <div class="tmc-team-icon"><i class="fas fa-shield-halved"></i></div>
                    <div class="tmc-team-name">${m.away}</div>
                </div>
            </div>
            <div class="tmc-footer">
                <span class="tmc-venue"><i class="fas fa-map-marker-alt"></i> ${m.venue}</span>
                ${m.available 
                    ? `<button class="tmc-buy-btn" onclick="openTicketModal('${m.id}')"><i class="fas fa-ticket-alt"></i> Acheter</button>`
                    : `<span class="tmc-buy-btn" style="opacity:0.5;cursor:default;">Bientôt</span>`}
            </div>
        </div>
    `).join('');

    // Stadium zones
    const zonesGrid = document.getElementById('stadiumZonesGrid');
    if (zonesGrid) {
        const stadiumZonesData = getStadiumZonesData();
        zonesGrid.innerHTML = stadiumZonesData.map(z => `
            <div class="zone-card" data-reveal="up">
                <div class="zone-name">${z.name}</div>
                <div class="zone-price">${z.price} <small>TND</small></div>
                <div class="zone-avail"><span class="zone-avail-dot"></span> ${z.available.toLocaleString()} places</div>
            </div>
        `).join('');
    }
}

function openTicketModal(matchId) {
    const modal = document.getElementById('ticketModal');
    const info = document.getElementById('ticketMatchInfo');
    if (!modal) return;

    const match = getTicketMatchesData().find(m => m.id === matchId);
    if (!match) return;

    info.innerHTML = `<i class="fas fa-futbol"></i> <div><strong>${match.home} vs ${match.away}</strong><br>${match.date} — ${match.time}</div>`;
    modal.dataset.matchId = matchId;
    modal.classList.add('active');
}

function initTicketModal() {
    const modal = document.getElementById('ticketModal');
    if (!modal) return;

    const overlay = document.getElementById('ticketModalOverlay');
    const closeBtn = document.getElementById('ticketModalClose');
    const form = document.getElementById('ticketForm');
    const zoneSelect = document.getElementById('ticketZone');
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyPlus = document.getElementById('qtyPlus');
    const qtyVal = document.getElementById('qtyValue');
    const totalEl = document.getElementById('ticketTotal');

    let qty = 1;

    function updateTotal() {
        const zone = zoneSelect ? zoneSelect.value : '';
        const price = getZonePrices()[zone] || 15;
        if (totalEl) totalEl.textContent = (price * qty) + ' TND';
    }

    if (overlay) overlay.addEventListener('click', () => modal.classList.remove('active'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    if (qtyMinus) qtyMinus.addEventListener('click', () => {
        if (qty > 1) { qty--; qtyVal.textContent = qty; updateTotal(); }
    });
    if (qtyPlus) qtyPlus.addEventListener('click', () => {
        if (qty < 10) { qty++; qtyVal.textContent = qty; updateTotal(); }
    });
    if (zoneSelect) zoneSelect.addEventListener('change', updateTotal);

    if (form) form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const matchId = modal.dataset.matchId;
        const match = getTicketMatchesData().find(m => m.id == matchId);
        const zone = zoneSelect.value;
        const price = getZonePrices()[zone] || 15;
        const zoneName = zoneSelect.options[zoneSelect.selectedIndex].text;

        // Flouci payment flow
        submitFlouciPayment('ticket', {
            matchLabel: match ? match.home + ' vs ' + match.away : '—',
            matchDate: match ? match.date : '',
            zone: zoneName,
            quantity: qty,
            unitPrice: price,
            buyerName: document.getElementById('ticketName') ? document.getElementById('ticketName').value : '—',
            buyerEmail: document.getElementById('ticketEmail') ? document.getElementById('ticketEmail').value : '',
            buyerPhone: document.getElementById('ticketPhone') ? document.getElementById('ticketPhone').value : '',
            buyerAddress: document.getElementById('ticketAddress') ? document.getElementById('ticketAddress').value : ''
        });
        form.reset();
        qty = 1;
        if (qtyVal) qtyVal.textContent = '1';
        updateTotal();
    });
}

// ======================================================================
// SUBSCRIPTION DATA & RENDERING
// ======================================================================

function getSubPlansData() { return DataManager.getAll('subPlans'); }

function loadSubscriptions() {
    const grid = document.getElementById('subPlansGrid');
    if (!grid) return;

    const subPlansData = getSubPlansData();
    grid.innerHTML = subPlansData.map((plan, i) => `
        <div class="sub-plan-card ${plan.featured ? 'plan-featured' : ''}" data-reveal="up" style="transition-delay: ${i * 0.1}s">
            ${plan.featured ? '<div class="sub-plan-featured-tag">Populaire</div>' : ''}
            ${plan.image ? `<div class="sub-plan-img"><img src="${plan.image}" alt="${plan.name}"></div>` : ''}
            <div class="sub-plan-header">
                <div class="sub-plan-icon"><i class="fas ${plan.icon}"></i></div>
                <div class="sub-plan-name">${plan.name}</div>
                <div class="sub-plan-desc">${plan.description}</div>
                <div class="sub-plan-price">${plan.price} <small>TND</small></div>
                <div class="sub-plan-period">${plan.period}</div>
            </div>
            <div class="sub-plan-body">
                <ul class="sub-plan-features">
                    ${plan.features.map(f => `
                        <li class="${f.icon === 'fa-times' ? 'feature-disabled' : ''}">
                            <i class="fas ${f.icon}"></i> ${f.text}
                        </li>
                    `).join('')}
                </ul>
                <button class="sub-plan-cta" onclick="openSubModal('${plan.name}', ${plan.price})">
                    <i class="fas fa-id-card"></i> S'abonner
                </button>
            </div>
        </div>
    `).join('');
}

function openSubModal(planName, planPrice) {
    const modal = document.getElementById('subModal');
    const summary = document.getElementById('subPlanSummary');
    const totalEl = document.getElementById('subTotal');
    if (!modal) return;

    summary.innerHTML = `<i class="fas fa-star"></i> <div><strong>Formule ${planName}</strong><br>Saison 2025-2026</div>`;
    if (totalEl) totalEl.textContent = planPrice + ' TND';
    modal.dataset.plan = planName;
    modal.dataset.price = planPrice;
    modal.classList.add('active');
}

function initSubModal() {
    const modal = document.getElementById('subModal');
    if (!modal) return;

    const overlay = document.getElementById('subModalOverlay');
    const closeBtn = document.getElementById('subModalClose');
    const form = document.getElementById('subForm');

    if (overlay) overlay.addEventListener('click', () => modal.classList.remove('active'));
    if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('active'));

    if (form) form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const planName = modal.dataset.plan;
        const planPrice = modal.dataset.price;
        const cin = document.getElementById('subCin') ? document.getElementById('subCin').value.trim() : '';

        // Validate CIN required
        if (!cin) {
            showToast('Le numéro CIN est obligatoire', 'error');
            return;
        }

        // Check CIN uniqueness before payment
        try {
            const checkRes = await fetch(API_BASE + '/social-members/check-cin/' + encodeURIComponent(cin));
            const checkData = await checkRes.json();
            if (checkData.exists && checkData.status === 'active') {
                showToast(`Ce CIN est déjà enregistré comme membre actif (${checkData.memberNumber})`, 'error');
                return;
            }
        } catch(e) { /* continue anyway */ }

        // Flouci payment flow
        submitFlouciPayment('subscription', {
            planName,
            planPrice: parseFloat(planPrice),
            fullName: document.getElementById('subName').value,
            cin,
            email: document.getElementById('subEmail') ? document.getElementById('subEmail').value : '',
            phone: document.getElementById('subPhone') ? document.getElementById('subPhone').value : '',
            address: document.getElementById('subAddress') ? document.getElementById('subAddress').value : '',
            birthDate: document.getElementById('subBirthDate') ? document.getElementById('subBirthDate').value : ''
        });
        form.reset();
    });
}

// ======================================================================
// DONATION DATA & RENDERING
// ======================================================================

function getDonorsWallData() { return DataManager.getAll('donors'); }

function loadDonation() {
    // Donors wall
    const wall = document.getElementById('donWallGrid');
    if (wall) {
        const donorsWallData = getDonorsWallData();
        wall.innerHTML = donorsWallData.map(d => {
            const initials = d.name === 'Donateur Anonyme' ? '?' : d.name.split(' ').map(w => w[0]).join('');
            return `
                <div class="don-wall-card" data-reveal="up">
                    <div class="don-wall-avatar">${initials}</div>
                    <div class="don-wall-info">
                        <div class="don-wall-name">${d.name}</div>
                        <div class="don-wall-amount">${d.amount}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Progress bar animation
    const fill = document.getElementById('donProgressFill');
    if (fill) {
        setTimeout(() => { fill.style.width = '64.7%'; }, 500);
    }

    // Donation form interactivity
    initDonForm();
}

function initDonForm() {
    const presets = document.querySelectorAll('.don-preset');
    const customInput = document.getElementById('donCustomAmount');
    const summaryAmount = document.getElementById('donSummaryAmount');
    const summaryType = document.getElementById('donSummaryType');
    const typeButtons = document.querySelectorAll('.don-type-btn');
    const form = document.getElementById('donForm');

    let selectedAmount = 50;
    let donType = 'unique';

    presets.forEach(btn => {
        btn.addEventListener('click', () => {
            presets.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedAmount = parseInt(btn.dataset.amount);
            if (customInput) customInput.value = '';
            if (summaryAmount) summaryAmount.textContent = selectedAmount + ' TND';
        });
    });

    if (customInput) {
        customInput.addEventListener('input', () => {
            if (customInput.value) {
                presets.forEach(b => b.classList.remove('active'));
                selectedAmount = parseInt(customInput.value) || 0;
                if (summaryAmount) summaryAmount.textContent = selectedAmount + ' TND';
            }
        });
    }

    typeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            typeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            donType = btn.dataset.type;
            if (summaryType) summaryType.textContent = donType === 'unique' ? 'Don unique' : 'Don mensuel';
        });
    });

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const isAnon = document.getElementById('donAnonymous');
            const nameInput = document.getElementById('donName');

            // Flouci payment flow
            submitFlouciPayment('donation', {
                donorName: nameInput ? nameInput.value : '',
                donorEmail: document.getElementById('donEmail') ? document.getElementById('donEmail').value : '',
                donorPhone: document.getElementById('donPhone') ? document.getElementById('donPhone').value : '',
                donorAddress: document.getElementById('donAddress') ? document.getElementById('donAddress').value : '',
                amount: selectedAmount,
                donType,
                anonymous: isAnon ? isAnon.checked : false,
                message: document.getElementById('donMessage') ? document.getElementById('donMessage').value : ''
            });
            form.reset();
            presets.forEach(b => b.classList.remove('active'));
            presets[2].classList.add('active');
            selectedAmount = 50;
            if (summaryAmount) summaryAmount.textContent = '50 TND';
        });
    }
}

// ======================================================================
// MATCH INFO DATA & RENDERING
// ======================================================================

function getLastMeetingsData() { return DataManager.getAll('meetings'); }
function getLineupData() { return DataManager.getAll('lineup'); }

// ======================================================================
// SPORT SECTIONS — Sections sportives du CSS
// ======================================================================

function loadSportSections() {
    const grid = document.getElementById('sportSectionsGrid');
    if (!grid) return;

    const sections = DataManager.getAll('sportSections');
    if (!sections.length) {
        grid.innerHTML = '<div class="empty-state"><i class="fas fa-trophy"></i><p>Aucune section sportive disponible.</p></div>';
        return;
    }

    grid.innerHTML = sections.map((s, i) => {
        const achievementsHtml = (s.achievements || []).map(a => `
            <div class="ss-achievement">
                <i class="fas fa-trophy"></i>
                <div>
                    <strong>${escapeHtml(a.title)}</strong>
                    ${a.year ? `<span>${escapeHtml(a.year)}</span>` : ''}
                </div>
            </div>
        `).join('');

        const statsObj = s.stats || {};
        const statsEntries = statsObj instanceof Map ? Array.from(statsObj.entries()) : Object.entries(statsObj);
        const statsHtml = statsEntries.map(([k, v]) => `
            <div class="ss-stat">
                <span class="ss-stat-val">${escapeHtml(String(v))}</span>
                <span class="ss-stat-label">${escapeHtml(k)}</span>
            </div>
        `).join('');

        const imgContent = s.image
            ? `<img src="${escapeHtml(s.image)}" alt="${escapeHtml(s.name)}" loading="lazy">`
            : `<div class="ss-img-placeholder"><i class="fas ${s.icon || 'fa-trophy'}"></i></div>`;

        return `
        <div class="sport-section-card" data-reveal="up" style="transition-delay:${i * 120}ms; --section-color:${s.color || '#1a1a1a'}">
            <div class="ss-image">${imgContent}</div>
            <div class="ss-body">
                <div class="ss-header">
                    <div class="ss-icon"><i class="fas ${s.icon || 'fa-trophy'}"></i></div>
                    <div>
                        <h3 class="ss-name">${escapeHtml(s.name)}</h3>
                        <span class="ss-founded"><i class="fas fa-calendar-alt"></i> Fondée en ${escapeHtml(s.founded || '—')}</span>
                    </div>
                </div>
                <p class="ss-description">${escapeHtml(s.description)}</p>
                <div class="ss-meta">
                    ${s.coach ? `<div class="ss-meta-item"><i class="fas fa-chalkboard-teacher"></i> <strong>Entraîneur :</strong> ${escapeHtml(s.coach)}</div>` : ''}
                    ${s.venue ? `<div class="ss-meta-item"><i class="fas fa-map-marker-alt"></i> <strong>Salle :</strong> ${escapeHtml(s.venue)}</div>` : ''}
                </div>
                <div class="ss-stats-grid">${statsHtml}</div>
                <div class="ss-achievements">
                    <h4><i class="fas fa-medal"></i> Palmarès</h4>
                    ${achievementsHtml}
                </div>
            </div>
        </div>`;
    }).join('');
}

function loadMatchInfo() {
    // Last meetings
    const meetingsGrid = document.getElementById('miMeetingsGrid');
    if (meetingsGrid) {
        const lastMeetingsData = getLastMeetingsData();
        meetingsGrid.innerHTML = lastMeetingsData.map(m => `
            <div class="mi-meeting-row">
                <span class="mi-meeting-date">${m.date}</span>
                <span class="mi-meeting-teams">${m.home} vs ${m.away}</span>
                <span class="mi-meeting-score ${m.result}">${m.score}</span>
            </div>
        `).join('');
    }

    // Lineup
    const lineupGrid = document.getElementById('miLineupGrid');
    if (lineupGrid) {
        const lineupData = getLineupData();
        lineupGrid.innerHTML = lineupData.map(row => `
            <div class="mi-lineup-row">
                ${row.map(p => `
                    <div class="mi-lineup-player">
                        <div class="mi-player-circle">${p.number}</div>
                        <div class="mi-player-name">${p.name}</div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    // Countdown
    initMatchCountdown();

    // Remind button
    const remindBtn = document.getElementById('miRemindBtn');
    if (remindBtn) {
        remindBtn.addEventListener('click', () => {
            remindBtn.innerHTML = '<i class="fas fa-check"></i> Rappel Activé';
            remindBtn.style.background = 'var(--primary-dark)';
            remindBtn.style.color = 'white';
            remindBtn.disabled = true;
        });
    }
}

function initMatchCountdown() {
    const daysEl = document.getElementById('miDays');
    const hoursEl = document.getElementById('miHours');
    const minEl = document.getElementById('miMinutes');
    const secEl = document.getElementById('miSeconds');
    if (!daysEl) return;

    // Target: next match date (March 15, 2026 16:00 Tunisia time)
    const target = new Date('2026-03-15T16:00:00').getTime();

    function update() {
        const now = Date.now();
        const diff = Math.max(0, target - now);
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        daysEl.textContent = String(d).padStart(2, '0');
        hoursEl.textContent = String(h).padStart(2, '0');
        minEl.textContent = String(m).padStart(2, '0');
        secEl.textContent = String(s).padStart(2, '0');
    }

    update();
    setInterval(update, 1000);
}

// ======================================================================
// MAIN INITIALIZATION
// ======================================================================
// Force-reveal all hidden elements (safety fallback)
function forceRevealAll() {
    document.querySelectorAll('.section-header, .match-card, .fixture-card, .product-card, .news-card, .news-filters, .gallery-item, .player-card, .staff-card, .squad-position-group, .squad-staff-section, .quick-link-card, .footer-col, .timeline-item, .trophy-card, .legend-card, .ticket-match-card, .zone-card, .sub-benefit-card, .sub-plan-card, .don-stat-card, .don-usage-card, .don-wall-card, .mi-info-card, .mi-meeting-row, .home-fixture-card, .home-news-card, .home-player-card, .home-gallery-item, .home-store-card, .trophy-bar-item, .home-section-cta, .sport-section-card, [data-reveal]').forEach(el => {
        el.classList.add('revealed');
    });
    document.querySelectorAll('#standingsTable tbody tr').forEach(tr => tr.classList.add('revealed'));
    // Hero elements
    const badge = document.getElementById('heroBadge');
    const title = document.getElementById('heroTitle');
    const subtitle = document.getElementById('heroSubtitle');
    const stats = document.getElementById('heroStats');
    const heroBtn = document.querySelector('.hero-btn');
    [badge, subtitle, stats, heroBtn].forEach(el => { if (el) el.classList.add('animate'); });
    document.querySelectorAll('.subtitle-line').forEach(l => l.classList.add('animate'));
    if (title) {
        title.style.opacity = '1';
        title.querySelectorAll('.letter').forEach(l => l.classList.add('animate'));
    }
}

// ======================================================================
// HOMEPAGE RICH SECTIONS
// ======================================================================

function loadHomeFixtures() {
    const grid = document.getElementById('homeFixturesGrid');
    if (!grid) return;

    const fixtures = DataManager.getAll('fixtures');
    const upcoming = fixtures
        .filter(f => new Date(f.date) >= new Date())
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 3);

    if (!upcoming.length) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-light);grid-column:1/-1;">Aucun match à venir pour le moment.</p>';
        return;
    }

    grid.innerHTML = upcoming.map((f, i) => {
        const d = new Date(f.date);
        const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        return `
        <div class="home-fixture-card" data-reveal="up" data-fixture-date="${f.date}T${f.time || '16:00'}" style="transition-delay:${i * 100}ms">
            <span class="hf-comp">${f.competition}</span>
            <div class="hf-teams">
                <span class="hf-team">${f.homeTeam}</span>
                <span class="hf-vs">VS</span>
                <span class="hf-team">${f.awayTeam}</span>
            </div>
            <div class="hf-meta">
                <span><i class="far fa-calendar-alt"></i> ${dateStr}</span>
                <span><i class="far fa-clock"></i> ${f.time || '16:00'}</span>
                <span><i class="fas fa-map-marker-alt"></i> ${f.venue}</span>
            </div>
            <div class="hf-countdown" data-countdown="${f.date}T${f.time || '16:00'}">
                <div class="hf-count-box"><span class="hf-count-num hf-days">--</span><span class="hf-count-label">Jours</span></div>
                <div class="hf-count-box"><span class="hf-count-num hf-hours">--</span><span class="hf-count-label">Heures</span></div>
                <div class="hf-count-box"><span class="hf-count-num hf-mins">--</span><span class="hf-count-label">Min</span></div>
                <div class="hf-count-box"><span class="hf-count-num hf-secs">--</span><span class="hf-count-label">Sec</span></div>
            </div>
        </div>`;
    }).join('');

    // Start countdowns
    function updateCountdowns() {
        document.querySelectorAll('.hf-countdown').forEach(el => {
            const target = new Date(el.dataset.countdown).getTime();
            const now = Date.now();
            const diff = target - now;
            if (diff <= 0) {
                el.innerHTML = '<span style="font-weight:700;color:var(--accent);">EN COURS</span>';
                return;
            }
            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const mins = Math.floor((diff % 3600000) / 60000);
            const secs = Math.floor((diff % 60000) / 1000);
            el.querySelector('.hf-days').textContent = String(days).padStart(2, '0');
            el.querySelector('.hf-hours').textContent = String(hours).padStart(2, '0');
            el.querySelector('.hf-mins').textContent = String(mins).padStart(2, '0');
            el.querySelector('.hf-secs').textContent = String(secs).padStart(2, '0');
        });
    }
    updateCountdowns();
    setInterval(updateCountdowns, 1000);
}

function loadHomeNews() {
    const grid = document.getElementById('homeNewsGrid');
    if (!grid) return;

    const news = DataManager.getAll('news');
    const latest = [...news].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4);

    if (!latest.length) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-light);grid-column:1/-1;">Aucune actualité disponible.</p>';
        return;
    }

    const catIcons = { 'Match': 'fas fa-futbol', 'Transfert': 'fas fa-exchange-alt', 'Entraînement': 'fas fa-running', 'Actualité': 'fas fa-star', 'Communiqué': 'fas fa-bullhorn' };

    grid.innerHTML = latest.map((n, i) => {
        const d = new Date(n.date);
        const dateStr = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        const icon = catIcons[n.category] || 'fas fa-newspaper';
        const imgContent = n.image
            ? `<img src="${escapeHtml(n.image)}" alt="${escapeHtml(n.title)}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">`
            : `<i class="${icon}"></i>`;
        return `
        <a href="nouvelles.html" class="home-news-card" data-reveal="up" style="transition-delay:${i * 100}ms">
            <div class="hn-image">
                ${imgContent}
                <span class="hn-category">${escapeHtml(n.category)}</span>
            </div>
            <div class="hn-body">
                <span class="hn-date"><i class="far fa-calendar-alt"></i> ${dateStr}</span>
                <h3 class="hn-title">${escapeHtml(n.title)}</h3>
                <span class="hn-arrow">Lire la suite <i class="fas fa-arrow-right"></i></span>
            </div>
        </a>`;
    }).join('');
}

function loadHomePlayers() {
    const grid = document.getElementById('homePlayersGrid');
    if (!grid) return;

    // Pick 3 star players: best attacker, best midfielder, best defender
    const sd = getSquadData();
    const stars = [
        { ...(sd.attackers.find(p => p.name === 'Omar Ben Ali') || sd.attackers[0] || {}), pos: 'Attaquant' },
        { ...(sd.midfielders.find(p => p.name === 'Bouara Diarra') || sd.midfielders[0] || {}), pos: 'Milieu' },
        { ...(sd.defenders.find(p => p.name === 'Ali Maâloul') || sd.defenders[0] || {}), pos: 'Défenseur' }
    ].filter(p => p.name);

    grid.innerHTML = stars.map((p, i) => {
        const statEntries = Object.entries(p.stats || {}).slice(0, 3);
        const statLabels = { matchs: 'Matchs', buts: 'Buts', passes: 'Passes', tacles: 'Tacles', tirs: 'Tirs', cleanSheets: 'C. Sheets', arrets: 'Arrêts' };
        const playerImg = p.image
            ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:var(--primary-dark);color:white;font-size:3rem;"><i class="fas fa-user"></i></div>`;
        return `
        <div class="home-player-card" data-reveal="up" style="transition-delay:${i * 120}ms">
            <div class="hp-image-wrap">
                ${playerImg}
                <span class="hp-number">${p.number}</span>
                <span class="hp-nationality">${escapeHtml(p.nationality)}</span>
            </div>
            <div class="hp-body">
                <h3 class="hp-name">${escapeHtml(p.name)}</h3>
                <p class="hp-position">${escapeHtml(p.pos)}</p>
                <div class="hp-stats">
                    ${statEntries.map(([k, v]) => `<div class="hp-stat"><span class="hp-stat-num">${v}</span><span class="hp-stat-label">${statLabels[k] || k}</span></div>`).join('')}
                </div>
            </div>
        </div>`;
    }).join('');
}

function loadHomeGallery() {
    const grid = document.getElementById('homeGalleryGrid');
    if (!grid) return;

    const items = getGalleryData().slice(0, 5);
    const catLabels = { 'match-photo': 'Match', 'training-photo': 'Entraînement', 'video': 'Vidéo', 'fans': 'Supporters', 'stadium': 'Stade' };

    grid.innerHTML = items.map((item, i) => {
        const isVideo = item.type === 'video';
        const typeBadge = isVideo ? '<span class="hg-type-badge"><i class="fas fa-play"></i> Vidéo</span>' : '';
        const bgContent = item.image
            ? `<img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">`
            : `<i class="${isVideo ? 'fas fa-play-circle' : 'fas fa-camera'}"></i>`;
        return `
        <div class="home-gallery-item" data-reveal="up" style="transition-delay:${i * 80}ms">
            <div class="hg-bg">${bgContent}</div>
            ${typeBadge}
            <div class="hg-overlay"></div>
            <div class="hg-info">
                <h4 class="hg-title">${item.title}</h4>
                <p class="hg-cat">${catLabels[item.category] || item.category}</p>
            </div>
        </div>`;
    }).join('');
}

function loadHomeStore() {
    const grid = document.getElementById('homeStoreGrid');
    if (!grid) return;

    const products = DataManager.getAll('products').slice(0, 4);

    if (!products.length) {
        grid.innerHTML = '<p style="text-align:center;color:var(--text-light);grid-column:1/-1;">Boutique bientôt disponible.</p>';
        return;
    }

    grid.innerHTML = products.map((p, i) => {
        const imgContent = p.image
            ? `<img src="${escapeHtml(p.image)}" alt="${escapeHtml(p.name)}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;">`
            : `<i class="fas fa-tshirt"></i>`;
        return `
        <a href="boutique.html" class="home-store-card" data-reveal="up" style="transition-delay:${i * 100}ms">
            <div class="hs-image">
                ${imgContent}
                ${p.badge ? `<span class="hs-badge">${escapeHtml(p.badge)}</span>` : ''}
            </div>
            <div class="hs-body">
                <h3 class="hs-name">${escapeHtml(p.name)}</h3>
                <span class="hs-price">${p.price} <span>TND</span></span>
            </div>
        </a>`;
    }).join('');
}

// PWA Service Worker
if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/service-worker.js').catch(() => {}); }

document.addEventListener('DOMContentLoaded', async () => {
    // Load data from MongoDB API
    await preloadAllData();

    // Start loading screen
    const loader = new LoadingScreen();
    const loadingDone = loader.start();

    // Render sections while loading
    loadMatches();
    loadFixtures();
    loadStandings();
    loadStore();
    loadNews();
    initNewsFilters();
    updateNextMatch();
    updateHeroStats();
    loadGallery();
    initGalleryFilters();
    initLightbox();
    loadSquad();
    loadHistory();
    loadTickets();
    initTicketModal();
    loadSubscriptions();
    initSubModal();
    loadDonation();
    loadMatchInfo();
    loadSportSections();

    // Homepage rich sections
    loadHomeFixtures();
    loadHomeNews();
    loadHomePlayers();
    loadHomeGallery();
    loadHomeStore();

    // Split section titles for char-by-char animation
    try { splitSectionTitles(); } catch(e) { console.warn('splitSectionTitles error:', e); }

    // Create banner particles
    try { createBannerParticles(); } catch(e) { console.warn('bannerParticles error:', e); }

    // Wait for loading to finish
    await loadingDone;

    // Safety: Force remove loading screen if still present
    const ls = document.getElementById('loadingScreen');
    if (ls) ls.remove();

    // ---- POST-LOAD ANIMATIONS ----
    // Each system is wrapped in try-catch so one failure doesn't break all

    try { new CustomCursor(); } catch(e) { console.warn('Cursor error:', e); }

    try { new MagneticElements(); } catch(e) { console.warn('Magnetic error:', e); }

    // Hero video error fallback
    try {
        const heroVideo = document.getElementById('heroVideo');
        if (heroVideo) {
            heroVideo.addEventListener('error', () => {
                const wrap = heroVideo.closest('.hero-video-wrap');
                if (wrap) wrap.classList.add('video-error');
            });
            // Also handle source error
            const source = heroVideo.querySelector('source');
            if (source) {
                source.addEventListener('error', () => {
                    const wrap = heroVideo.closest('.hero-video-wrap');
                    if (wrap) wrap.classList.add('video-error');
                });
            }
        }
    } catch(e) { console.warn('Hero video fallback error:', e); }

    try {
        const heroCanvas = document.getElementById('heroCanvas');
        if (heroCanvas) new ParticleSystem(heroCanvas);
    } catch(e) { console.warn('Particles error:', e); }

    try { animateHero(); } catch(e) { console.warn('Hero error:', e); }

    try { initScrollEffects(); } catch(e) { console.warn('ScrollEffects error:', e); }
    try { initNavScroll(); } catch(e) { console.warn('NavScroll error:', e); }

    // Scroll reveal engine
    try {
        const sr = new ScrollRevealEngine();
        sr.observe('[data-reveal]');
        sr.observe('.section-header');
        sr.observe('.footer-col');
        sr.staggerChildren('#matchesGrid', '.match-card', 120);
        sr.staggerChildren('#storeGrid', '.product-card', 100);
        sr.staggerChildren('#newsGrid', '.news-card', 120);
        sr.staggerChildren('#fixturesList', '.fixture-card', 100);
        sr.staggerChildren('#standingsTable tbody', 'tr', 60);
        sr.staggerChildren('#galleryGrid', '.gallery-item', 80);
        sr.staggerChildren('#goalkeepersGrid', '.player-card', 100);
        sr.staggerChildren('#defendersGrid', '.player-card', 100);
        sr.staggerChildren('#midfieldersGrid', '.player-card', 100);
        sr.staggerChildren('#attackersGrid', '.player-card', 100);
        sr.staggerChildren('#coachGrid', '.staff-card', 120);
        sr.staggerChildren('#staffGrid', '.staff-card', 100);
        sr.observe('.squad-position-group');
        sr.observe('.squad-staff-section');
        sr.observe('.quick-link-card');
        sr.observe('.news-filters');
        sr.staggerChildren('#historyTimeline', '.timeline-item', 150);
        sr.staggerChildren('#trophiesGrid', '.trophy-card', 120);
        sr.staggerChildren('#legendsGrid', '.legend-card', 130);
        sr.staggerChildren('#ticketMatchesGrid', '.ticket-match-card', 100);
        sr.staggerChildren('#stadiumZonesGrid', '.zone-card', 80);
        sr.staggerChildren('#subPlansGrid', '.sub-plan-card', 120);
        sr.staggerChildren('#donWallGrid', '.don-wall-card', 60);
        sr.observe('.sub-benefit-card');
        sr.observe('.don-stat-card');
        sr.observe('.don-usage-card');
        sr.observe('.mi-info-card');
        sr.observe('.mi-main-card');
        sr.observe('.mi-h2h-section');
        sr.observe('.mi-last-meetings');
        sr.observe('.mi-lineup-section');
        // Homepage rich sections
        sr.staggerChildren('#homeFixturesGrid', '.home-fixture-card', 100);
        sr.staggerChildren('#homeNewsGrid', '.home-news-card', 100);
        sr.staggerChildren('#homePlayersGrid', '.home-player-card', 120);
        sr.staggerChildren('#homeGalleryGrid', '.home-gallery-item', 80);
        sr.staggerChildren('#homeStoreGrid', '.home-store-card', 100);
        sr.observe('.trophy-bar-item');
        sr.observe('.home-section-cta');
    } catch(e) { console.warn('ScrollReveal error:', e); }

    // 3D Tilt on cards
    setTimeout(() => {
        try {
            new Tilt3D('.match-card', { maxRotation: 6, glare: true });
            new Tilt3D('.product-card', { maxRotation: 8, glare: true });
            new Tilt3D('.news-card', { maxRotation: 6, glare: true });
            new Tilt3D('.player-card', { maxRotation: 8, glare: true });
            new Tilt3D('.home-player-card', { maxRotation: 6, glare: true });
            new Tilt3D('.home-news-card', { maxRotation: 5, glare: true });
            new Tilt3D('.home-store-card', { maxRotation: 6, glare: true });
        } catch(e) { console.warn('Tilt error:', e); }
    }, 1500);

    // Hamburger
    const hamburger = document.getElementById('hamburger');
    const mainNav = document.getElementById('mainNav');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            mainNav.classList.toggle('open');
            hamburger.classList.toggle('active');
        });
    }

    // Mobile dropdown toggle — click to expand/collapse
    document.querySelectorAll('.nav-dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                const dropdown = toggle.closest('.nav-dropdown');
                dropdown.classList.toggle('active');
            }
        });
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (mainNav) mainNav.classList.remove('open');
            if (hamburger) hamburger.classList.remove('active');
        });
    });

    // Safety fallback: force reveal after 4s if elements are still hidden
    setTimeout(() => {
        const testEl = document.querySelector('.section-header');
        if (testEl && !testEl.classList.contains('revealed')) {
            console.warn('Fallback: forcing reveal of all elements');
            forceRevealAll();
        }
    }, 4000);

    // ===== NEWSLETTER FORM =====
    const nlForm = document.getElementById('newsletterForm');
    if (nlForm) {
        nlForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('nlEmail').value.trim();
            const firstName = document.getElementById('nlFirstName')?.value.trim() || '';
            const status = document.getElementById('nlStatus');
            const cats = [...nlForm.querySelectorAll('.newsletter-cats input:checked')].map(c => c.value);
            if (!email) return;
            try {
                const res = await fetch('/api/newsletter/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, firstName, categories: cats.length ? cats : ['all'] })
                });
                const data = await res.json();
                if (status) {
                    status.textContent = data.message || 'Abonné avec succès !';
                    status.className = 'nl-status nl-success';
                    setTimeout(() => { status.textContent = ''; status.className = 'nl-status'; }, 5000);
                }
                nlForm.reset();
            } catch (err) {
                if (status) { status.textContent = 'Erreur, réessayez.'; status.className = 'nl-status nl-error'; setTimeout(() => { status.textContent = ''; status.className = 'nl-status'; }, 5000); }
            }
        });
    }

    // ===== PUSH NOTIFICATIONS =====
    initPushNotifications();

    // ===== LIVE MATCH TRACKER =====
    initLiveTracker();
});

// ===== PUSH NOTIFICATIONS SYSTEM =====
async function initPushNotifications() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission === 'granted') return; // already subscribed
    if (Notification.permission === 'denied') return;
    if (localStorage.getItem('pushDismissed')) return;

    // Show prompt after 5 seconds
    setTimeout(() => {
        const prompt = document.getElementById('pushPrompt');
        if (prompt) prompt.style.display = 'block';
    }, 5000);

    const acceptBtn = document.getElementById('pushAccept');
    const closeBtn = document.getElementById('pushClose');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', async () => {
            try {
                const reg = await navigator.serviceWorker.ready;
                const res = await fetch('/api/push/vapid-key');
                const { publicKey } = await res.json();
                const sub = await reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(publicKey)
                });
                await fetch('/api/push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription: sub, categories: ['all'] })
                });
                document.getElementById('pushPrompt').style.display = 'none';
            } catch (err) {
                console.warn('Push subscription failed:', err);
                document.getElementById('pushPrompt').style.display = 'none';
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('pushPrompt').style.display = 'none';
            localStorage.setItem('pushDismissed', '1');
        });
    }
}

function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr;
}

// ===== LIVE MATCH TRACKER =====
let livePollingInterval = null;

async function initLiveTracker() {
    try {
        const res = await fetch('/api/live');
        const data = await res.json();
        if (!data || !data.homeTeam) return;
        renderLiveMatch(data);
        const section = document.getElementById('liveTrackerSection');
        if (section) section.style.display = 'block';

        // Poll every 15 seconds if match is live
        if (!['not_started', 'finished'].includes(data.status)) {
            livePollingInterval = setInterval(async () => {
                try {
                    const r = await fetch('/api/live');
                    const d = await r.json();
                    if (d && d.homeTeam) renderLiveMatch(d);
                    if (d.status === 'finished') clearInterval(livePollingInterval);
                } catch(e) {}
            }, 15000);
        }
    } catch (err) {}
}

function renderLiveMatch(m) {
    const $ = id => document.getElementById(id);
    if (!$('liveHomeTeam')) return;

    $('liveHomeTeam').textContent = m.homeTeam;
    $('liveAwayTeam').textContent = m.awayTeam;
    $('liveHomeScore').textContent = m.homeScore || 0;
    $('liveAwayScore').textContent = m.awayScore || 0;
    $('liveCompetition').textContent = m.competition || '';

    const statusMap = { not_started: 'Avant-match', first_half: '1ère MT', half_time: 'Mi-temps', second_half: '2ème MT', extra_time: 'Prolongation', finished: 'Terminé' };
    $('liveMinute').textContent = m.status === 'not_started' ? (m.time || 'À venir') : m.status === 'finished' ? 'Terminé' : (m.minute || 0) + "'";

    const badge = document.querySelector('.live-badge');
    if (badge) {
        if (['first_half', 'second_half', 'extra_time'].includes(m.status)) {
            badge.innerHTML = '<span class="live-dot"></span> LIVE';
            badge.style.display = 'flex';
        } else if (m.status === 'half_time') {
            badge.innerHTML = 'MI-TEMPS';
            badge.style.display = 'flex';
        } else if (m.status === 'finished') {
            badge.innerHTML = 'TERMINÉ';
            badge.style.background = '#555';
        } else {
            badge.innerHTML = 'À VENIR';
            badge.style.background = '#2c3e50';
        }
    }

    // Stats
    if (m.stats) {
        $('lsHomePoss').textContent = (m.stats.homePossession || 50) + '%';
        $('lsAwayPoss').textContent = (m.stats.awayPossession || 50) + '%';
        $('lsPossBar').style.width = (m.stats.homePossession || 50) + '%';
        $('lsHomeShots').textContent = m.stats.homeShots || 0;
        $('lsAwayShots').textContent = m.stats.awayShots || 0;
        const totalShots = (m.stats.homeShots || 0) + (m.stats.awayShots || 0);
        $('lsShotsBar').style.width = totalShots ? ((m.stats.homeShots / totalShots) * 100) + '%' : '50%';
    }

    // Events
    const evBox = $('liveEvents');
    if (evBox && m.events) {
        evBox.innerHTML = m.events.sort((a, b) => (b.minute || 0) - (a.minute || 0)).map(ev => {
            const icons = { goal: '⚽', pen: '⚽(P)', yellow: '🟨', red: '🟥', sub: '🔄', var: '📺', own_goal: '⚽(OG)' };
            const cls = ev.type === 'goal' || ev.type === 'pen' ? 'ev-goal' : ev.type === 'yellow' ? 'ev-yellow' : ev.type === 'red' ? 'ev-red' : 'ev-sub';
            return `<div class="live-event ${cls}">
                <span class="ev-min">${ev.minute}'</span>
                <span class="ev-icon">${icons[ev.type] || '📋'}</span>
                <span class="ev-text">${ev.player || ''}${ev.assist ? ' (assist: ' + ev.assist + ')' : ''}${ev.detail ? ' — ' + ev.detail : ''}</span>
            </div>`;
        }).join('');
    }

    // Comments
    const cmBox = $('liveComments');
    if (cmBox && m.comments) {
        cmBox.innerHTML = m.comments.sort((a, b) => (b.minute || 0) - (a.minute || 0)).map(c => {
            return `<div class="live-comment ${c.type === 'highlight' || c.type === 'key_event' ? 'lc-highlight' : ''}">
                <span class="lc-min">${c.minute}'</span>${c.text}
            </div>`;
        }).join('');
    }
}
