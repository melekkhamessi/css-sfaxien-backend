/**
 * Seed MongoDB with CS Sfaxien demo data
 * Run: node server/seed.js
 *
 * Images use picsum.photos (reliable placeholder service) with fixed seeds
 * so you get consistent images across runs.
 */
const mongoose = require('mongoose');

const Match = require('./models/Match');
const Fixture = require('./models/Fixture');
const Standing = require('./models/Standing');
const Product = require('./models/Product');
const News = require('./models/News');
const Player = require('./models/Player');
const Gallery = require('./models/Gallery');
const Timeline = require('./models/Timeline');
const Trophy = require('./models/Trophy');
const Legend = require('./models/Legend');
const TicketMatch = require('./models/TicketMatch');
const StadiumZone = require('./models/StadiumZone');
const SubPlan = require('./models/SubPlan');
const Meeting = require('./models/Meeting');
const Donor = require('./models/Donor');
const Lineup = require('./models/Lineup');
const Admin = require('./models/Admin');
const PromoCode = require('./models/PromoCode');
const SportSection = require('./models/SportSection');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cssfaxien';

// Helper: player avatar with initials (black/white theme) — fallback
const avatar = (name, bg = '000') => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=300&font-size=0.4&bold=true`;
const avatarLg = (name, bg = '000') => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${bg}&color=fff&size=400&font-size=0.35&bold=true`;
// Helper: realistic player headshot via i.pravatar.cc (deterministic per seed)
const photo = (seed) => `https://i.pravatar.cc/300?u=${encodeURIComponent(seed)}`;

// Helper: picsum photos with fixed seed for consistency
const pic = (seed, w = 800, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

async function seed() {
    await mongoose.connect(MONGO_URI);
    console.log('Connecté à MongoDB');

    // Clear all collections
    await Promise.all([
        Match.deleteMany(), Fixture.deleteMany(), Standing.deleteMany(),
        Product.deleteMany(), News.deleteMany(), Player.deleteMany(),
        Gallery.deleteMany(), Timeline.deleteMany(), Trophy.deleteMany(),
        Legend.deleteMany(), TicketMatch.deleteMany(), StadiumZone.deleteMany(),
        SubPlan.deleteMany(), Meeting.deleteMany(), Donor.deleteMany(),
        Lineup.deleteMany(), PromoCode.deleteMany(), SportSection.deleteMany()
    ]);
    console.log('Collections vidées');

    // ===================================================================
    //  MATCHES — Résultats récents (saison 2025-2026) avec données FlashScore
    // ===================================================================
    await Match.insertMany([
        {
            homeTeam:'CS Sfaxien', awayTeam:'Espérance de Tunis', homeScore:'1', awayScore:'2', date:'2026-03-01', time:'16:00',
            competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri', referee:'Sadok Selmi', attendance:22000, isHome:true,
            summary:"Match intense au Taïeb Mhiri. L'Espérance ouvre le score par Belaïli à la 23' puis double la mise via Jaziri (55'). Le CSS réduit l'écart par Khenissi sur penalty (78') mais ne parvient pas à égaliser malgré une forte pression en fin de match.",
            events:[
                {minute:23, type:'goal', player:'Belaïli', team:'away', detail:'Frappe enroulée 20m'},
                {minute:35, type:'yellow', player:'Akid', team:'home'},
                {minute:45, type:'yellow', player:'Jaziri', team:'away'},
                {minute:55, type:'goal', player:'Jaziri', team:'away', assist:'Belaïli', detail:'Contre-attaque'},
                {minute:62, type:'sub', player:'Mutyaba ↔ Diarra', team:'home'},
                {minute:70, type:'sub', player:'Ben Ali ↔ Sekkouhi', team:'home'},
                {minute:76, type:'yellow', player:'Bronn', team:'away'},
                {minute:78, type:'pen', player:'Khenissi', team:'home', detail:'Penalty'},
                {minute:85, type:'sub', player:'Habchia ↔ Ben Khader', team:'home'},
                {minute:90, type:'yellow', player:'Mutyaba', team:'home'}
            ],
            homeFormation:'4-3-3', awayFormation:'4-2-3-1',
            homeLineup:[
                {name:'Gaaloul', number:1, position:'GK', rating:6.5},
                {name:'Ben Ali', number:3, position:'DC', rating:6.0},
                {name:'Akid', number:5, position:'DC', rating:6.5},
                {name:'Mondeko', number:15, position:'DG', rating:6.0},
                {name:'Baccar', number:21, position:'DD', rating:7.0},
                {name:'Habchia', number:4, position:'MC', rating:6.0},
                {name:'Maâloul', number:10, position:'MC', rating:6.5, isCaptain:true},
                {name:'Mathlouthi', number:24, position:'MC', rating:6.0},
                {name:'Mutyaba', number:7, position:'AD', rating:5.5},
                {name:'Khenissi', number:9, position:'AC', rating:7.5},
                {name:'Onana', number:11, position:'AG', rating:6.0}
            ],
            awayLineup:[
                {name:'Moez Hassan', number:1, position:'GK', rating:7.0},
                {name:'Machani', number:2, position:'DD', rating:6.5},
                {name:'Bronn', number:5, position:'DC', rating:7.0},
                {name:'Meriah', number:4, position:'DC', rating:6.5},
                {name:'Abdi', number:3, position:'DG', rating:6.5},
                {name:'Chaâleli', number:6, position:'MC', rating:7.0},
                {name:'Ben Romdhane', number:8, position:'MC', rating:7.0},
                {name:'Belaïli', number:10, position:'MO', rating:8.5, isCaptain:true},
                {name:'Jaziri', number:9, position:'AD', rating:8.0},
                {name:'Rabii', number:7, position:'AG', rating:6.5},
                {name:'Badri', number:11, position:'AC', rating:6.0}
            ],
            homeCoach:'Mohamed Kouki', awayCoach:'Mouïne Chaâbani',
            homeSubs:[{name:'Diarra', number:8, rating:6.0},{name:'Sekkouhi', number:25, rating:5.5},{name:'Ben Khader', number:26, rating:5.5}],
            awaySubs:[{name:'Amamou', number:14, rating:6.0},{name:'Laïdouni', number:15, rating:6.0}],
            stats:{
                possession:[42,58], shots:[12,15], shotsOnTarget:[4,7], corners:[5,8],
                fouls:[14,11], offsides:[2,3], yellowCards:[3,2], redCards:[0,0],
                passes:[380,520], passAccuracy:[78,85], saves:[5,3]
            }
        },
        {
            homeTeam:'CS Sfaxien', awayTeam:'AS Gabès', homeScore:'1', awayScore:'0', date:'2026-02-28', time:'14:00',
            competition:'Coupe de Tunisie — 1/4 de finale', venue:'Stade Taïeb Mhiri', referee:'Mehrez Melki', attendance:18000, isHome:true, isCup:true,
            summary:"Le CSS se qualifie difficilement pour les demi-finales de la Coupe. Baccar marque le seul but de la rencontre à la 67' d'une frappe lointaine superbe. Solide prestation défensive de l'équipe de Kouki.",
            events:[
                {minute:15, type:'yellow', player:'Joueur ASG', team:'away'},
                {minute:38, type:'yellow', player:'Mathlouthi', team:'home'},
                {minute:67, type:'goal', player:'Baccar', team:'home', detail:'Frappe lointaine 25m'},
                {minute:72, type:'sub', player:'Onana ↔ Diarra', team:'home'},
                {minute:80, type:'yellow', player:'Mondeko', team:'home'},
                {minute:85, type:'sub', player:'Khenissi ↔ Ben Khader', team:'home'}
            ],
            homeFormation:'4-3-3', awayFormation:'4-4-2',
            homeLineup:[
                {name:'Gaaloul', number:1, position:'GK', rating:7.0},
                {name:'Ben Ali', number:3, position:'DC', rating:7.0},
                {name:'Akid', number:5, position:'DC', rating:7.5},
                {name:'Mondeko', number:15, position:'DG', rating:6.5},
                {name:'Baccar', number:21, position:'DD', rating:8.0},
                {name:'Habchia', number:4, position:'MC', rating:6.5},
                {name:'Maâloul', number:10, position:'MC', rating:7.0, isCaptain:true},
                {name:'Mathlouthi', number:24, position:'MC', rating:6.5},
                {name:'Mutyaba', number:7, position:'AD', rating:6.5},
                {name:'Khenissi', number:9, position:'AC', rating:6.5},
                {name:'Onana', number:11, position:'AG', rating:6.0}
            ],
            awayLineup:[
                {name:'Gardien ASG', number:1, position:'GK', rating:6.5},
                {name:'Def1 ASG', number:2, position:'DD', rating:6.0},
                {name:'Def2 ASG', number:4, position:'DC', rating:6.0},
                {name:'Def3 ASG', number:5, position:'DC', rating:6.0},
                {name:'Def4 ASG', number:3, position:'DG', rating:5.5},
                {name:'Mil1 ASG', number:6, position:'MD', rating:6.0},
                {name:'Mil2 ASG', number:8, position:'MC', rating:6.0},
                {name:'Mil3 ASG', number:10, position:'MG', rating:5.5},
                {name:'Mil4 ASG', number:7, position:'MD', rating:5.5},
                {name:'Att1 ASG', number:9, position:'AC', rating:5.5},
                {name:'Att2 ASG', number:11, position:'AC', rating:5.5}
            ],
            homeCoach:'Mohamed Kouki', awayCoach:'Coach AS Gabès',
            homeSubs:[{name:'Diarra',number:8,rating:6.0},{name:'Ben Khader',number:26,rating:5.5}],
            awaySubs:[],
            stats:{
                possession:[58,42], shots:[14,6], shotsOnTarget:[5,2], corners:[7,3],
                fouls:[10,15], offsides:[1,3], yellowCards:[2,1], redCards:[0,0],
                passes:[460,320], passAccuracy:[82,72], saves:[2,4]
            },
            cupBracket:[
                {round:'1/8 de finale', homeTeam:'CS Sfaxien', awayTeam:'OS Kef', homeScore:'3', awayScore:'0', played:true},
                {round:'1/4 de finale', homeTeam:'CS Sfaxien', awayTeam:'AS Gabès', homeScore:'1', awayScore:'0', played:true},
                {round:'1/2 finale', homeTeam:'CS Sfaxien', awayTeam:'Espérance de Tunis', homeScore:'', awayScore:'', played:false},
                {round:'Finale', homeTeam:'', awayTeam:'', homeScore:'', awayScore:'', played:false}
            ]
        },
        {
            homeTeam:'CS Sfaxien', awayTeam:'AS Marsa', homeScore:'2', awayScore:'0', date:'2026-02-22', time:'14:00',
            competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri', referee:'Youssef Sraïri', attendance:15000, isHome:true,
            summary:"Victoire convaincante du CSS avec un doublé de Khenissi. Le buteur sfaxien ouvre le score de la tête (32') puis double la mise sur penalty (58'). Domination totale des locaux.",
            events:[
                {minute:32, type:'goal', player:'Khenissi', team:'home', assist:'Maâloul', detail:'Tête sur corner'},
                {minute:41, type:'yellow', player:'Def AS Marsa', team:'away'},
                {minute:58, type:'pen', player:'Khenissi', team:'home', detail:'Penalty'},
                {minute:65, type:'sub', player:'Mutyaba ↔ Diarra', team:'home'},
                {minute:75, type:'yellow', player:'Habchia', team:'home'},
                {minute:80, type:'sub', player:'Khenissi ↔ Ben Khader', team:'home'}
            ],
            homeFormation:'4-3-3', awayFormation:'5-3-2',
            homeLineup:[
                {name:'Gaaloul',number:1,position:'GK',rating:6.5},{name:'Ben Ali',number:3,position:'DC',rating:7.0},
                {name:'Akid',number:5,position:'DC',rating:7.0},{name:'Mondeko',number:15,position:'DG',rating:7.0},
                {name:'Baccar',number:21,position:'DD',rating:7.5},{name:'Habchia',number:4,position:'MC',rating:6.5},
                {name:'Maâloul',number:10,position:'MC',rating:7.5,isCaptain:true},{name:'Mathlouthi',number:24,position:'MC',rating:7.0},
                {name:'Mutyaba',number:7,position:'AD',rating:7.0},{name:'Khenissi',number:9,position:'AC',rating:9.0},
                {name:'Onana',number:11,position:'AG',rating:6.5}
            ],
            awayLineup:[
                {name:'GK Marsa',number:1,position:'GK',rating:5.5},{name:'Def1',number:2,position:'DD',rating:5.5},
                {name:'Def2',number:4,position:'DC',rating:6.0},{name:'Def3',number:5,position:'DC',rating:5.5},
                {name:'Def4',number:6,position:'DC',rating:5.5},{name:'Def5',number:3,position:'DG',rating:5.5},
                {name:'Mil1',number:8,position:'MC',rating:6.0},{name:'Mil2',number:10,position:'MC',rating:5.5},
                {name:'Mil3',number:7,position:'MC',rating:5.5},{name:'Att1',number:9,position:'AC',rating:5.5},
                {name:'Att2',number:11,position:'AC',rating:5.5}
            ],
            homeCoach:'Mohamed Kouki', awayCoach:'Coach AS Marsa',
            stats:{
                possession:[62,38], shots:[18,5], shotsOnTarget:[8,1], corners:[9,2],
                fouls:[8,14], offsides:[2,4], yellowCards:[1,1], redCards:[0,0],
                passes:[510,280], passAccuracy:[86,70], saves:[1,6]
            }
        },
        {
            homeTeam:'Étoile du Sahel', awayTeam:'CS Sfaxien', homeScore:'0', awayScore:'1', date:'2026-02-15', time:'16:00',
            competition:'Ligue 1 Professionnelle', venue:'Stade Olympique de Sousse', referee:'Naïm Hosni', attendance:20000, isHome:false,
            summary:"Victoire mémorable du CSS à Sousse ! But décisif de Onana à la 72' sur une passe lumineuse de Maâloul. Défense héroïque des Sfaxiens face aux assauts de l'ESS en seconde période.",
            events:[
                {minute:20, type:'yellow', player:'Joueur ESS', team:'home'},
                {minute:44, type:'yellow', player:'Mondeko', team:'away'},
                {minute:72, type:'goal', player:'Onana', team:'away', assist:'Maâloul', detail:'Contre-attaque rapide'},
                {minute:78, type:'sub', player:'Onana ↔ Diarra', team:'away'},
                {minute:82, type:'yellow', player:'Joueur ESS', team:'home'},
                {minute:88, type:'sub', player:'Mutyaba ↔ Sekkouhi', team:'away'},
                {minute:90, type:'yellow', player:'Akid', team:'away'}
            ],
            homeFormation:'4-2-3-1', awayFormation:'4-3-3',
            homeLineup:[
                {name:'GK ESS',number:1,position:'GK',rating:6.0},{name:'Def1 ESS',number:2,position:'DD',rating:6.0},
                {name:'Def2 ESS',number:4,position:'DC',rating:6.5},{name:'Def3 ESS',number:5,position:'DC',rating:6.0},
                {name:'Def4 ESS',number:3,position:'DG',rating:5.5},{name:'Mil1 ESS',number:6,position:'MC',rating:6.5},
                {name:'Mil2 ESS',number:8,position:'MC',rating:6.0},{name:'Mil3 ESS',number:10,position:'MO',rating:6.5},
                {name:'Mil4 ESS',number:7,position:'AD',rating:6.0},{name:'Mil5 ESS',number:11,position:'AG',rating:5.5},
                {name:'Att ESS',number:9,position:'AC',rating:5.5}
            ],
            awayLineup:[
                {name:'Gaaloul',number:1,position:'GK',rating:8.0},{name:'Ben Ali',number:3,position:'DC',rating:7.5},
                {name:'Akid',number:5,position:'DC',rating:7.0},{name:'Mondeko',number:15,position:'DG',rating:7.0},
                {name:'Baccar',number:21,position:'DD',rating:7.0},{name:'Habchia',number:4,position:'MC',rating:7.0},
                {name:'Maâloul',number:10,position:'MC',rating:8.0,isCaptain:true},{name:'Mathlouthi',number:24,position:'MC',rating:7.0},
                {name:'Mutyaba',number:7,position:'AD',rating:6.5},{name:'Khenissi',number:9,position:'AC',rating:6.5},
                {name:'Onana',number:11,position:'AG',rating:8.5}
            ],
            homeCoach:'Coach ESS', awayCoach:'Mohamed Kouki',
            stats:{
                possession:[55,45], shots:[13,9], shotsOnTarget:[4,5], corners:[7,4],
                fouls:[12,13], offsides:[3,1], yellowCards:[2,2], redCards:[0,0],
                passes:[470,390], passAccuracy:[81,79], saves:[4,4]
            }
        },
        {
            homeTeam:'US Ben Guerdane', awayTeam:'CS Sfaxien', homeScore:'0', awayScore:'1', date:'2026-02-08', time:'14:00',
            competition:'Ligue 1 Professionnelle', venue:'Stade 7 Mars', referee:'Med Amine Jridi', attendance:5000, isHome:false,
            summary:"Victoire difficile à Ben Guerdane grâce à un but de Baccar (56'). Le CSS gère bien le match malgré les conditions de jeu compliquées.",
            events:[
                {minute:28, type:'yellow', player:'Joueur USBG', team:'home'},
                {minute:56, type:'goal', player:'Baccar', team:'away', detail:'Frappe du droit'},
                {minute:70, type:'yellow', player:'Joueur USBG', team:'home'},
                {minute:75, type:'sub', player:'Mutyaba ↔ Diarra', team:'away'},
                {minute:88, type:'yellow', player:'Mathlouthi', team:'away'}
            ],
            homeFormation:'4-4-2', awayFormation:'4-3-3',
            homeLineup:[
                {name:'GK USBG',number:1,position:'GK',rating:6.0},{name:'D1',number:2,position:'DD',rating:5.5},
                {name:'D2',number:4,position:'DC',rating:6.0},{name:'D3',number:5,position:'DC',rating:5.5},
                {name:'D4',number:3,position:'DG',rating:5.5},{name:'M1',number:6,position:'MD',rating:5.5},
                {name:'M2',number:8,position:'MC',rating:6.0},{name:'M3',number:10,position:'MC',rating:5.5},
                {name:'M4',number:7,position:'MG',rating:5.5},{name:'A1',number:9,position:'AC',rating:5.5},
                {name:'A2',number:11,position:'AC',rating:5.0}
            ],
            awayLineup:[
                {name:'Gaaloul',number:1,position:'GK',rating:7.0},{name:'Ben Ali',number:3,position:'DC',rating:7.0},
                {name:'Akid',number:5,position:'DC',rating:7.5},{name:'Mondeko',number:15,position:'DG',rating:6.5},
                {name:'Baccar',number:21,position:'DD',rating:8.0},{name:'Habchia',number:4,position:'MC',rating:6.5},
                {name:'Maâloul',number:10,position:'MC',rating:7.0,isCaptain:true},{name:'Mathlouthi',number:24,position:'MC',rating:6.5},
                {name:'Mutyaba',number:7,position:'AD',rating:6.0},{name:'Khenissi',number:9,position:'AC',rating:6.5},
                {name:'Onana',number:11,position:'AG',rating:6.5}
            ],
            homeCoach:'Coach USBG', awayCoach:'Mohamed Kouki',
            stats:{
                possession:[40,60], shots:[7,14], shotsOnTarget:[2,6], corners:[3,7],
                fouls:[16,10], offsides:[2,1], yellowCards:[2,1], redCards:[0,0],
                passes:[290,450], passAccuracy:[68,83], saves:[5,2]
            }
        },
        { homeTeam:'CS Sfaxien', awayTeam:'JS El Omrane', homeScore:'2', awayScore:'0', date:'2026-02-01', time:'14:00', competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri', referee:'Ali Jmal', attendance:12000, isHome:true,
          summary:"Large victoire du CSS. Khenissi (22\') et Mutyaba (68\') assurent les 3 points face à une équipe jomoraniste sans solutions.",
          events:[{minute:22,type:'goal',player:'Khenissi',team:'home',assist:'Baccar'},{minute:40,type:'yellow',player:'Joueur JSO',team:'away'},{minute:68,type:'goal',player:'Mutyaba',team:'home',assist:'Onana'}],
          homeFormation:'4-3-3', awayFormation:'4-4-2',
          homeLineup:[{name:'Gaaloul',number:1,position:'GK',rating:6.5},{name:'Ben Ali',number:3,position:'DC',rating:7.0},{name:'Akid',number:5,position:'DC',rating:7.0},{name:'Mondeko',number:15,position:'DG',rating:6.5},{name:'Baccar',number:21,position:'DD',rating:7.5},{name:'Habchia',number:4,position:'MC',rating:7.0},{name:'Maâloul',number:10,position:'MC',rating:7.5,isCaptain:true},{name:'Mathlouthi',number:24,position:'MC',rating:6.5},{name:'Mutyaba',number:7,position:'AD',rating:8.0},{name:'Khenissi',number:9,position:'AC',rating:8.0},{name:'Onana',number:11,position:'AG',rating:7.0}],
          awayLineup:[{name:'GK',number:1,position:'GK',rating:5.5},{name:'D1',number:2,position:'DD',rating:5.5},{name:'D2',number:4,position:'DC',rating:5.5},{name:'D3',number:5,position:'DC',rating:5.5},{name:'D4',number:3,position:'DG',rating:5.0},{name:'M1',number:6,position:'MD',rating:5.5},{name:'M2',number:8,position:'MC',rating:5.5},{name:'M3',number:10,position:'MC',rating:5.0},{name:'M4',number:7,position:'MG',rating:5.0},{name:'A1',number:9,position:'AC',rating:5.5},{name:'A2',number:11,position:'AC',rating:5.0}],
          homeCoach:'Mohamed Kouki', awayCoach:'Coach JSO',
          stats:{possession:[65,35],shots:[20,4],shotsOnTarget:[9,1],corners:[10,1],fouls:[7,15],offsides:[3,2],yellowCards:[0,1],redCards:[0,0],passes:[540,260],passAccuracy:[88,65],saves:[1,7]}
        },
        { homeTeam:'CS Sfaxien', awayTeam:'ES Métlaoui', homeScore:'2', awayScore:'0', date:'2026-01-25', time:'14:00', competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri', referee:'Khalil Trabelsi', attendance:14000, isHome:true,
          summary:"Victoire sereine des Noir et Blanc. Maâloul ouvre le score sur coup franc (35\') puis Onana double la mise en contre (71\'). Le CSS poursuit sa série positive.",
          events:[{minute:35,type:'goal',player:'Maâloul',team:'home',detail:'Coup franc direct'},{minute:50,type:'yellow',player:'Joueur ESM',team:'away'},{minute:71,type:'goal',player:'Onana',team:'home',assist:'Mutyaba'}],
          homeFormation:'4-3-3', awayFormation:'4-5-1',
          homeLineup:[{name:'Gaaloul',number:1,position:'GK',rating:6.5},{name:'Ben Ali',number:3,position:'DC',rating:7.0},{name:'Akid',number:5,position:'DC',rating:7.0},{name:'Mondeko',number:15,position:'DG',rating:6.5},{name:'Baccar',number:21,position:'DD',rating:7.0},{name:'Habchia',number:4,position:'MC',rating:7.0},{name:'Maâloul',number:10,position:'MC',rating:8.5,isCaptain:true},{name:'Mathlouthi',number:24,position:'MC',rating:7.0},{name:'Mutyaba',number:7,position:'AD',rating:7.0},{name:'Khenissi',number:9,position:'AC',rating:7.0},{name:'Onana',number:11,position:'AG',rating:7.5}],
          awayLineup:[{name:'GK',number:1,position:'GK',rating:5.5},{name:'D1',number:2,position:'DD',rating:5.5},{name:'D2',number:4,position:'DC',rating:5.5},{name:'D3',number:5,position:'DC',rating:5.5},{name:'D4',number:3,position:'DG',rating:5.0},{name:'M1',number:6,position:'MD',rating:5.5},{name:'M2',number:8,position:'MC',rating:5.5},{name:'M3',number:10,position:'MC',rating:5.0},{name:'M4',number:7,position:'MG',rating:5.0},{name:'M5',number:14,position:'MC',rating:5.0},{name:'A1',number:9,position:'AC',rating:5.5}],
          homeCoach:'Mohamed Kouki', awayCoach:'Coach ESM',
          stats:{possession:[60,40],shots:[16,5],shotsOnTarget:[7,2],corners:[8,2],fouls:[9,12],offsides:[2,3],yellowCards:[0,1],redCards:[0,0],passes:[490,310],passAccuracy:[85,70],saves:[2,5]}
        },
        { homeTeam:'JS El Omrane', awayTeam:'CS Sfaxien', homeScore:'1', awayScore:'0', date:'2026-01-18', time:'14:00', competition:'Coupe de Tunisie — 1/8 de finale', venue:'Stade Chedly Zouiten', referee:'Sadok Selmi', attendance:8000, isHome:false, isCup:false,
          summary:"Défaite surprenante du CSS à El Omrane. But de Joueur JSO à la 63\' sur une erreur défensive. Le CSS échoue malgré 65% de possession.",
          events:[{minute:30,type:'yellow',player:'Habchia',team:'away'},{minute:63,type:'goal',player:'Joueur JSO',team:'home',detail:'Erreur défensive'},{minute:70,type:'sub',player:'Diarra ↔ Mutyaba',team:'away'},{minute:85,type:'yellow',player:'Joueur JSO',team:'home'}],
          homeFormation:'4-4-2', awayFormation:'4-3-3',
          homeLineup:[{name:'GK',number:1,position:'GK',rating:7.5},{name:'D1',number:2,position:'DD',rating:6.5},{name:'D2',number:4,position:'DC',rating:7.0},{name:'D3',number:5,position:'DC',rating:7.0},{name:'D4',number:3,position:'DG',rating:6.0},{name:'M1',number:6,position:'MD',rating:6.5},{name:'M2',number:8,position:'MC',rating:6.5},{name:'M3',number:10,position:'MC',rating:7.0},{name:'M4',number:7,position:'MG',rating:6.0},{name:'A1',number:9,position:'AC',rating:7.5},{name:'A2',number:11,position:'AC',rating:6.0}],
          awayLineup:[{name:'Gaaloul',number:1,position:'GK',rating:6.0},{name:'Ben Ali',number:3,position:'DC',rating:5.5},{name:'Akid',number:5,position:'DC',rating:6.0},{name:'Mondeko',number:15,position:'DG',rating:6.0},{name:'Baccar',number:21,position:'DD',rating:6.0},{name:'Habchia',number:4,position:'MC',rating:5.5},{name:'Maâloul',number:10,position:'MC',rating:6.5,isCaptain:true},{name:'Mathlouthi',number:24,position:'MC',rating:6.0},{name:'Mutyaba',number:7,position:'AD',rating:6.0},{name:'Khenissi',number:9,position:'AC',rating:5.5},{name:'Onana',number:11,position:'AG',rating:5.5}],
          homeCoach:'Coach JSO', awayCoach:'Mohamed Kouki',
          stats:{possession:[35,65],shots:[6,16],shotsOnTarget:[3,5],corners:[2,9],fouls:[15,8],offsides:[1,3],yellowCards:[1,1],redCards:[0,0],passes:[250,500],passAccuracy:[65,84],saves:[5,2]}
        },
        { homeTeam:'Olympique Béja', awayTeam:'CS Sfaxien', homeScore:'0', awayScore:'1', date:'2026-01-11', time:'14:00', competition:'Ligue 1 Professionnelle', venue:'Stade Boujemaa Kmiti', referee:'Youssef Sraïri', attendance:6000, isHome:false,
          summary:"Victoire à l'extérieur grâce à Khenissi (54\') d'une reprise de volée. Clean sheet pour Gaaloul auteur de 4 arrêts décisifs.",
          events:[{minute:25,type:'yellow',player:'Joueur OB',team:'home'},{minute:54,type:'goal',player:'Khenissi',team:'away',detail:'Volée du droit'},{minute:78,type:'sub',player:'Onana ↔ Diarra',team:'away'},{minute:85,type:'yellow',player:'Akid',team:'away'}],
          homeFormation:'4-4-2', awayFormation:'4-3-3',
          homeLineup:[{name:'GK',number:1,position:'GK',rating:5.5},{name:'D1',number:2,position:'DD',rating:5.5},{name:'D2',number:4,position:'DC',rating:6.0},{name:'D3',number:5,position:'DC',rating:5.5},{name:'D4',number:3,position:'DG',rating:5.5},{name:'M1',number:6,position:'MD',rating:5.5},{name:'M2',number:8,position:'MC',rating:6.0},{name:'M3',number:10,position:'MC',rating:5.5},{name:'M4',number:7,position:'MG',rating:5.5},{name:'A1',number:9,position:'AC',rating:5.5},{name:'A2',number:11,position:'AC',rating:5.0}],
          awayLineup:[{name:'Gaaloul',number:1,position:'GK',rating:8.0},{name:'Ben Ali',number:3,position:'DC',rating:7.0},{name:'Akid',number:5,position:'DC',rating:7.0},{name:'Mondeko',number:15,position:'DG',rating:6.5},{name:'Baccar',number:21,position:'DD',rating:7.0},{name:'Habchia',number:4,position:'MC',rating:7.0},{name:'Maâloul',number:10,position:'MC',rating:7.0,isCaptain:true},{name:'Mathlouthi',number:24,position:'MC',rating:6.5},{name:'Mutyaba',number:7,position:'AD',rating:6.5},{name:'Khenissi',number:9,position:'AC',rating:8.0},{name:'Onana',number:11,position:'AG',rating:6.5}],
          homeCoach:'Coach OB', awayCoach:'Mohamed Kouki',
          stats:{possession:[42,58],shots:[9,12],shotsOnTarget:[3,5],corners:[4,6],fouls:[14,9],offsides:[2,1],yellowCards:[1,1],redCards:[0,0],passes:[310,440],passAccuracy:[72,82],saves:[4,3]}
        },
        { homeTeam:'CS Sfaxien', awayTeam:'CA Bizertin', homeScore:'4', awayScore:'0', date:'2025-12-14', time:'14:00', competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri', referee:'Med Amine Jridi', attendance:16000, isHome:true,
          summary:"Démonstration du CSS ! Doublé de Khenissi (15\', 42\'), buts de Maâloul (60\') et Mutyaba (78\'). La meilleure performance offensive de la saison.",
          events:[{minute:15,type:'goal',player:'Khenissi',team:'home',assist:'Maâloul'},{minute:30,type:'yellow',player:'Joueur CAB',team:'away'},{minute:42,type:'goal',player:'Khenissi',team:'home',detail:'Frappe en pivot'},{minute:55,type:'yellow',player:'Joueur CAB',team:'away'},{minute:60,type:'goal',player:'Maâloul',team:'home',detail:'Coup franc 22m'},{minute:70,type:'sub',player:'Khenissi ↔ Ben Khader',team:'home'},{minute:78,type:'goal',player:'Mutyaba',team:'home',assist:'Baccar'}],
          homeFormation:'4-3-3', awayFormation:'4-4-2',
          homeLineup:[{name:'Gaaloul',number:1,position:'GK',rating:6.5},{name:'Ben Ali',number:3,position:'DC',rating:7.5},{name:'Akid',number:5,position:'DC',rating:7.5},{name:'Mondeko',number:15,position:'DG',rating:7.0},{name:'Baccar',number:21,position:'DD',rating:8.0},{name:'Habchia',number:4,position:'MC',rating:7.5},{name:'Maâloul',number:10,position:'MC',rating:9.0,isCaptain:true},{name:'Mathlouthi',number:24,position:'MC',rating:7.0},{name:'Mutyaba',number:7,position:'AD',rating:8.0},{name:'Khenissi',number:9,position:'AC',rating:9.5},{name:'Onana',number:11,position:'AG',rating:7.0}],
          awayLineup:[{name:'GK',number:1,position:'GK',rating:4.5},{name:'D1',number:2,position:'DD',rating:5.0},{name:'D2',number:4,position:'DC',rating:5.0},{name:'D3',number:5,position:'DC',rating:4.5},{name:'D4',number:3,position:'DG',rating:4.5},{name:'M1',number:6,position:'MD',rating:5.0},{name:'M2',number:8,position:'MC',rating:5.0},{name:'M3',number:10,position:'MC',rating:5.0},{name:'M4',number:7,position:'MG',rating:4.5},{name:'A1',number:9,position:'AC',rating:5.0},{name:'A2',number:11,position:'AC',rating:4.5}],
          homeCoach:'Mohamed Kouki', awayCoach:'Coach CAB',
          stats:{possession:[68,32],shots:[24,3],shotsOnTarget:[12,0],corners:[12,1],fouls:[6,16],offsides:[3,1],yellowCards:[0,2],redCards:[0,0],passes:[580,220],passAccuracy:[90,62],saves:[0,8]}
        },
        { homeTeam:'Club Africain', awayTeam:'CS Sfaxien', homeScore:'1', awayScore:'1', date:'2025-12-07', time:'16:00', competition:'Ligue 1 Professionnelle', venue:'Stade Hammadi Agrebi', referee:'Naïm Hosni', attendance:25000, isHome:false,
          summary:"Match nul équitable à Radès. Le Club Africain ouvre le score par Skhiri (38\') mais Khenissi égalise (65\') sur un centre parfait de Baccar.",
          events:[{minute:20,type:'yellow',player:'Joueur CA',team:'home'},{minute:38,type:'goal',player:'Skhiri',team:'home',detail:'Tête sur corner'},{minute:50,type:'yellow',player:'Mathlouthi',team:'away'},{minute:65,type:'goal',player:'Khenissi',team:'away',assist:'Baccar',detail:'Reprise à bout portant'},{minute:80,type:'sub',player:'Mutyaba ↔ Diarra',team:'away'},{minute:88,type:'yellow',player:'Joueur CA',team:'home'}],
          homeFormation:'4-3-3', awayFormation:'4-3-3',
          homeLineup:[{name:'GK CA',number:1,position:'GK',rating:6.5},{name:'D1',number:2,position:'DD',rating:6.5},{name:'D2',number:4,position:'DC',rating:6.5},{name:'D3',number:5,position:'DC',rating:6.5},{name:'D4',number:3,position:'DG',rating:6.0},{name:'M1',number:6,position:'MC',rating:7.0},{name:'Skhiri',number:8,position:'MC',rating:7.5},{name:'M3',number:10,position:'MC',rating:6.5},{name:'A1',number:7,position:'AD',rating:6.0},{name:'A2',number:9,position:'AC',rating:6.0},{name:'A3',number:11,position:'AG',rating:6.0}],
          awayLineup:[{name:'Gaaloul',number:1,position:'GK',rating:6.5},{name:'Ben Ali',number:3,position:'DC',rating:6.5},{name:'Akid',number:5,position:'DC',rating:7.0},{name:'Mondeko',number:15,position:'DG',rating:6.5},{name:'Baccar',number:21,position:'DD',rating:7.5},{name:'Habchia',number:4,position:'MC',rating:6.5},{name:'Maâloul',number:10,position:'MC',rating:7.0,isCaptain:true},{name:'Mathlouthi',number:24,position:'MC',rating:6.0},{name:'Mutyaba',number:7,position:'AD',rating:6.0},{name:'Khenissi',number:9,position:'AC',rating:7.5},{name:'Onana',number:11,position:'AG',rating:6.5}],
          homeCoach:'Coach CA', awayCoach:'Mohamed Kouki',
          stats:{possession:[52,48],shots:[13,11],shotsOnTarget:[5,5],corners:[6,5],fouls:[12,11],offsides:[2,2],yellowCards:[2,1],redCards:[0,0],passes:[430,410],passAccuracy:[80,80],saves:[4,4]}
        },
        { homeTeam:'CS Sfaxien', awayTeam:'US Monastir', homeScore:'1', awayScore:'0', date:'2025-11-30', time:'14:00', competition:'Ligue 1 Professionnelle', venue:'Stade Taïeb Mhiri', referee:'Mehrez Melki', attendance:17000, isHome:true,
          summary:"Victoire à l'arraché ! But décisif d'Onana dans les arrêts de jeu (90+3\') suite à une action collective sublime. Le Taïeb Mhiri explose de joie.",
          events:[{minute:35,type:'yellow',player:'Joueur USM',team:'away'},{minute:55,type:'yellow',player:'Habchia',team:'home'},{minute:70,type:'sub',player:'Mutyaba ↔ Diarra',team:'home'},{minute:82,type:'yellow',player:'Joueur USM',team:'away'},{minute:93,type:'goal',player:'Onana',team:'home',assist:'Khenissi',detail:'But dans les arrêts de jeu !'}],
          homeFormation:'4-3-3', awayFormation:'4-2-3-1',
          homeLineup:[{name:'Gaaloul',number:1,position:'GK',rating:6.5},{name:'Ben Ali',number:3,position:'DC',rating:7.0},{name:'Akid',number:5,position:'DC',rating:7.0},{name:'Mondeko',number:15,position:'DG',rating:6.5},{name:'Baccar',number:21,position:'DD',rating:7.0},{name:'Habchia',number:4,position:'MC',rating:6.0},{name:'Maâloul',number:10,position:'MC',rating:7.0,isCaptain:true},{name:'Mathlouthi',number:24,position:'MC',rating:6.5},{name:'Mutyaba',number:7,position:'AD',rating:6.0},{name:'Khenissi',number:9,position:'AC',rating:7.0},{name:'Onana',number:11,position:'AG',rating:8.5}],
          awayLineup:[{name:'GK',number:1,position:'GK',rating:6.5},{name:'D1',number:2,position:'DD',rating:6.0},{name:'D2',number:4,position:'DC',rating:6.5},{name:'D3',number:5,position:'DC',rating:6.5},{name:'D4',number:3,position:'DG',rating:6.0},{name:'M1',number:6,position:'MC',rating:6.5},{name:'M2',number:8,position:'MC',rating:6.5},{name:'M3',number:10,position:'MO',rating:6.5},{name:'A1',number:7,position:'AD',rating:6.0},{name:'A2',number:11,position:'AG',rating:5.5},{name:'A3',number:9,position:'AC',rating:6.0}],
          homeCoach:'Mohamed Kouki', awayCoach:'Coach USM',
          stats:{possession:[55,45],shots:[15,10],shotsOnTarget:[5,4],corners:[7,5],fouls:[11,12],offsides:[2,2],yellowCards:[1,2],redCards:[0,0],passes:[450,380],passAccuracy:[82,78],saves:[4,4]}
        },
    ]);
    console.log('✅ Matchs insérés (12)');

    // ===================================================================
    //  FIXTURES — Calendrier à venir
    // ===================================================================
    await Fixture.insertMany([
        { homeTeam:'CS Sfaxien', awayTeam:'JS Kairouan', date:'2026-03-21', time:'16:00', competition:'Ligue 1 Professionnelle — J24', venue:'Stade Taïeb Mhiri' },
        { homeTeam:'AS Marsa', awayTeam:'CS Sfaxien', date:'2026-03-28', time:'15:00', competition:'Ligue 1 Professionnelle — J25', venue:'Stade Abdelaziz Chtioui' },
        { homeTeam:'CS Sfaxien', awayTeam:'Étoile du Sahel', date:'2026-04-05', time:'16:00', competition:'Ligue 1 Professionnelle — J26', venue:'Stade Taïeb Mhiri' },
        { homeTeam:'Espérance de Tunis', awayTeam:'CS Sfaxien', date:'2026-04-12', time:'20:00', competition:'Ligue 1 Professionnelle — J27', venue:'Stade Hammadi Agrebi' },
        { homeTeam:'CS Sfaxien', awayTeam:'Olympique Béja', date:'2026-04-19', time:'16:00', competition:'Ligue 1 Professionnelle — J28', venue:'Stade Taïeb Mhiri' },
        { homeTeam:'AS Soliman', awayTeam:'CS Sfaxien', date:'2026-04-26', time:'15:00', competition:'Ligue 1 Professionnelle — J29', venue:'Stade Municipal de Soliman' },
        { homeTeam:'CS Sfaxien', awayTeam:'Stade Tunisien', date:'2026-05-03', time:'16:00', competition:'Ligue 1 Professionnelle — J30', venue:'Stade Taïeb Mhiri' },
        { homeTeam:'ES Zarzis', awayTeam:'CS Sfaxien', date:'2026-05-10', time:'15:00', competition:'Ligue 1 Professionnelle — J31', venue:'Stade Ennasr' },
        { homeTeam:'CS Sfaxien', awayTeam:'Club Africain', date:'2026-05-17', time:'16:00', competition:'Ligue 1 Professionnelle — J32', venue:'Stade Taïeb Mhiri' },
        { homeTeam:'CA Bizertin', awayTeam:'CS Sfaxien', date:'2026-05-24', time:'15:00', competition:'Ligue 1 Professionnelle — J33', venue:'Stade 15 Octobre' },
    ]);
    console.log('✅ Calendrier inséré (10)');

    // ===================================================================
    //  STANDINGS — Classement Ligue 1 2025-2026 (J23)
    // ===================================================================
    await Standing.insertMany([
        { name:'Espérance de Tunis', isOurTeam:false, played:24, won:17, drawn:5, lost:2, goalsFor:44, goalsAgainst:8,  points:56, form:['W','W','W','D','W'] },
        { name:'Club Africain',      isOurTeam:false, played:24, won:14, drawn:8, lost:2, goalsFor:36, goalsAgainst:10, points:50, form:['W','D','W','D','W'] },
        { name:'Stade Tunisien',     isOurTeam:false, played:24, won:13, drawn:8, lost:3, goalsFor:30, goalsAgainst:11, points:47, form:['W','D','W','W','D'] },
        { name:'CS Sfaxien',         isOurTeam:true,  played:24, won:13, drawn:6, lost:5, goalsFor:33, goalsAgainst:13, points:45, form:['W','W','W','L','W'] },
        { name:'US Monastir',        isOurTeam:false, played:24, won:10, drawn:10,lost:4, goalsFor:26, goalsAgainst:15, points:40, form:['D','L','D','W','D'] },
        { name:'Étoile du Sahel',    isOurTeam:false, played:24, won:9,  drawn:8, lost:7, goalsFor:24, goalsAgainst:20, points:35, form:['L','D','W','D','W'] },
        { name:'ES Zarzis',          isOurTeam:false, played:24, won:8,  drawn:7, lost:9, goalsFor:22, goalsAgainst:25, points:31, form:['D','W','L','W','D'] },
        { name:'JS El Omrane',       isOurTeam:false, played:24, won:8,  drawn:5, lost:11,goalsFor:19, goalsAgainst:28, points:29, form:['L','W','L','W','L'] },
        { name:'ES Métlaoui',        isOurTeam:false, played:24, won:7,  drawn:8, lost:9, goalsFor:17, goalsAgainst:26, points:29, form:['D','D','L','D','W'] },
        { name:'CA Bizertin',        isOurTeam:false, played:24, won:7,  drawn:7, lost:10,goalsFor:15, goalsAgainst:23, points:28, form:['W','D','L','W','L'] },
        { name:'AS Marsa',           isOurTeam:false, played:24, won:8,  drawn:2, lost:14,goalsFor:21, goalsAgainst:27, points:26, form:['L','W','L','L','W'] },
        { name:'US Ben Guerdane',    isOurTeam:false, played:24, won:5,  drawn:9, lost:10,goalsFor:15, goalsAgainst:23, points:24, form:['L','D','D','L','D'] },
        { name:'JS Kairouan',        isOurTeam:false, played:24, won:6,  drawn:4, lost:14,goalsFor:16, goalsAgainst:38, points:22, form:['L','L','L','W','L'] },
        { name:'AS Gabès',           isOurTeam:false, played:24, won:4,  drawn:8, lost:12,goalsFor:11, goalsAgainst:28, points:20, form:['L','D','L','D','L'] },
        { name:'Olympique Béja',     isOurTeam:false, played:24, won:5,  drawn:3, lost:16,goalsFor:13, goalsAgainst:39, points:18, form:['L','L','L','W','L'] },
        { name:'AS Soliman',         isOurTeam:false, played:24, won:2,  drawn:8, lost:14,goalsFor:10, goalsAgainst:28, points:14, form:['D','L','L','D','L'] },
    ]);
    console.log('✅ Classement inséré (16 équipes — J24)');

    // ===================================================================
    //  PRODUCTS — Boutique officielle avec images
    // ===================================================================
    const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
    const shoeSizes = ['39', '40', '41', '42', '43', '44', '45'];
    await Product.insertMany([
        // Maillots (customisables)
        { name:'Maillot Domicile CSS 2025/26', price:89, category:'maillots', sizes, customizable:true, customPrice:20, description:'Le maillot officiel noir et blanc du CS Sfaxien. Tissu Adidas Aeroready respirant, blason brodé, coupe ajustée.', image:pic('css-home-jersey', 400, 500), badge:'Nouveau' },
        { name:'Maillot Extérieur CSS 2025/26', price:89, category:'maillots', sizes, customizable:true, customPrice:20, description:'Maillot extérieur tout blanc avec détails noirs élégants. Technologie ClimaCool pour un confort optimal.', image:pic('css-away-jersey', 400, 500), badge:'Nouveau' },
        { name:'Maillot Third CSS 2025/26', price:85, category:'maillots', sizes, customizable:true, customPrice:20, description:'Le troisième maillot rouge et noir. Édition spéciale pour les matchs continentaux CAF.', image:pic('css-third-jersey', 400, 500), badge:'Exclusif' },
        { name:'Maillot Rétro CSS 2007', price:79, category:'maillots', sizes, customizable:true, customPrice:15, description:'Réédition du maillot historique du triplé 2007. Édition limitée numérotée.', image:pic('css-retro-07', 400, 500), badge:'Limité' },
        { name:'Maillot Gardien CSS 2025/26', price:85, category:'maillots', sizes, customizable:true, customPrice:20, description:'Maillot de gardien jaune fluo avec protections coudes intégrées.', image:pic('css-gk-jersey', 400, 500), badge:'' },
        // Vêtements
        { name:'Survêtement CSS 2025/26', price:120, category:'vetements', sizes, description:"Survêtement complet noir utilisé par les joueurs à l'entraînement. Coupe athlétique.", image:pic('css-tracksuit', 400, 500), badge:'' },
        { name:'Veste Coupe-vent CSS', price:95, category:'vetements', sizes, description:'Veste imperméable légère avec le logo CSS brodé. Capuche rétractable.', image:pic('css-windbreaker', 400, 500), badge:'' },
        { name:'Polo CSS Lifestyle', price:55, category:'vetements', sizes, description:'Polo casual noir avec logo CSS brodé sur la poitrine. Coton premium.', image:pic('css-polo', 400, 500), badge:'Nouveau' },
        { name:'Gilet Sans Manches CSS', price:65, category:'vetements', sizes, description:'Gilet matelassé noir avec logo CSS brodé. Idéal pour les jours frais au stade.', image:pic('css-vest', 400, 500), badge:'' },
        { name:'Short Entraînement CSS', price:40, category:'vetements', sizes, description:'Short officiel noir avec bandes blanches latérales. Tissu léger et respirant.', image:pic('css-shorts', 400, 500), badge:'' },
        { name:'T-shirt Ultras CSS', price:35, category:'vetements', sizes, description:'T-shirt noir "Ultras Sfaxiens" avec impression sérigraphiée. 100% coton.', image:pic('css-ultras-tshirt', 400, 500), badge:'Populaire' },
        // Équipements
        { name:'Crampons Pro CSS Edition', price:180, category:'equipements', sizes:shoeSizes, description:'Crampons moulés édition spéciale CS Sfaxien. Semelle AG/FG polyvalente.', image:pic('css-cleats', 400, 500), badge:'Pro' },
        { name:'Ballon Officiel CS Sfaxien', price:45, category:'equipements', description:'Ballon officiel taille 5 aux couleurs noir et blanc. Approuvé FIFA Quality.', image:pic('css-ball', 400, 500), badge:'-15%' },
        { name:'Gants de Gardien CSS', price:55, category:'equipements', sizes:['7','8','9','10','11'], description:'Gants pro avec grip latex 4mm. Design noir et blanc CS Sfaxien.', image:pic('css-gloves', 400, 500), badge:'' },
        { name:'Protège-tibias CSS', price:25, category:'equipements', sizes:['S','M','L'], description:'Protège-tibias légers avec logo CSS gravé. Mousse absorbante.', image:pic('css-shinguards', 400, 500), badge:'' },
        { name:'Sac de Sport CSS 50L', price:75, category:'equipements', description:'Grand sac de sport avec compartiment chaussures et poche humide.', image:pic('css-sportbag', 400, 500), badge:'' },
        // Accessoires
        { name:'Écharpe CS Sfaxien', price:25, category:'accessoires', description:'Écharpe tissée noir et blanc avec le slogan "Fierté Sfaxienne".', image:pic('css-scarf', 400, 500), badge:'' },
        { name:'Casquette Logo CSS', price:30, category:'accessoires', description:'Casquette brodée avec le logo officiel du CS Sfaxien.', image:pic('css-cap', 400, 500), badge:'Promo' },
        { name:'Sac à Dos CSS', price:65, category:'accessoires', description:'Sac à dos officiel 25L avec compartiment laptop et porte-ballon.', image:pic('css-backpack', 400, 500), badge:'' },
        { name:'Drapeau CS Sfaxien 150x90', price:35, category:'accessoires', description:'Grand drapeau officiel noir et blanc pour les déplacements.', image:pic('css-flag', 400, 500), badge:'' },
        { name:'Bracelet Silicone CSS', price:8, category:'accessoires', description:'Bracelet en silicone noir avec inscription "CSS 1928" en blanc.', image:pic('css-bracelet', 400, 500), badge:'' },
        { name:'Mug Thermos CSS', price:22, category:'accessoires', description:'Mug thermos 350ml inox avec logo CSS gravé. Garde chaud 6h.', image:pic('css-mug', 400, 500), badge:'' },
        { name:'Porte-clés Métal CSS', price:12, category:'accessoires', description:'Porte-clés en métal chromé avec blason du CS Sfaxien.', image:pic('css-keychain', 400, 500), badge:'' },
    ]);
    console.log('✅ Produits insérés (23)');

    // ===================================================================
    //  NEWS — Articles et communiqués
    // ===================================================================
    await News.insertMany([
        { title:'CSS 1-2 EST : Défaite frustrante face au leader', category:'Match', date:'2026-03-01', content:"Le CS Sfaxien s'est incliné 1-2 à domicile face à l'Espérance de Tunis dans un match très disputé au Stade Taïeb Mhiri.\n\nOmar Ben Ali a ouvert le score à la 23ème minute d'une frappe enroulée du pied gauche. L'Espérance a égalisé sur penalty avant la pause, puis a inscrit le but de la victoire dans les arrêts de jeu.\n\nMalgré la défaite, les Noir et Blanc ont montré un visage séduisant et peuvent aborder la suite avec confiance.", image:pic('css-vs-est', 800, 500) },
        { title:'CS Sfaxien 1-0 AS Gabès : 6ème victoire consécutive !', category:'Match', date:'2026-02-28', content:"Le CS Sfaxien continue sur sa lancée avec une victoire 1-0 face à l'AS Gabès au Stade Taïeb Mhiri devant 18 000 spectateurs.\n\nOmar Ben Ali a inscrit le seul but de la rencontre à la 67ème minute sur une passe décisive de Bouara Diarra. Le gardien Gaaloul a réalisé 3 arrêts déterminants pour préserver la victoire.", image:pic('css-gabes', 800, 500) },
        { title:'ESS 0-1 CSS : Victoire historique au derby de Sousse !', category:'Match', date:'2026-02-15', content:"Le CS Sfaxien s'est imposé 1-0 face à l'Étoile du Sahel au Stade Olympique de Sousse dans un derby enflammé.\n\nIyed Belwafi a inscrit le but de la victoire à la 78ème minute d'une tête puissante. La défense sfaxienne, impériale, a tenu bon face aux assauts étoilés.\n\nLes 3 000 supporters sfaxiens en déplacement ont fait trembler les tribunes.", image:pic('derby-sousse', 800, 500) },
        { title:'CSS 2-0 JS El Omrane : La machine continue', category:'Match', date:'2026-02-01', content:"Le Club Sportif Sfaxien a dominé JS El Omrane 2-0 au Taïeb Mhiri. Willy Onana (12') et Omar Ben Ali (58') ont signé les buts d'une victoire méritée.\n\nTravis Mutyaba a été élu homme du match pour sa performance exceptionnelle au milieu.", image:pic('css-omrane', 800, 500) },
        { title:'CSS 4-0 CA Bizertin : Démonstration de force', category:'Match', date:'2025-12-14', content:"Le CS Sfaxien a signé sa plus large victoire de la saison en écrasant le CA Bizertin 4-0 au Taïeb Mhiri.\n\nOmar Ben Ali (doublé), Hichem Baccar et Iyed Belwafi ont été les buteurs d'un après-midi parfait. Le CSS a affiché un jeu collectif de très haute qualité.", image:pic('css-cab-4-0', 800, 500) },
        { title:'Omar Ben Ali : 2ème meilleur buteur de la Ligue 1 avec 9 buts', category:'Actualité', date:'2026-02-25', content:"L'attaquant international tunisien Omar Ben Ali est le 2ème meilleur buteur de la Ligue 1 Professionnelle cette saison avec 9 buts en 23 matchs.\n\nSeul Youssef Msakni de l'Espérance le devance avec 11 réalisations. Ben Ali est sur une série de 5 matchs consécutifs avec un but, confirmant son statut de buteur prolifique.\n\nÉquipier modèle et leader dans le vestiaire, il est l'un des piliers de l'effectif de Mohamed Kouki.", image:pic('omar-benali-star', 800, 500) },
        { title:'CSS 4ème avec 42 points : Objectif podium !', category:'Actualité', date:'2026-03-01', content:"Après 23 journées de Ligue 1 Professionnelle, le CS Sfaxien occupe la 4ème place avec 42 points, à seulement 2 points du Stade Tunisien (3ème).\n\nAvec 10 matchs restants, les Noir et Blanc ont toutes les cartes en main pour viser le podium et une qualification en Ligue des Champions CAF.\n\nLe calendrier à venir est favorable avec 6 matchs à domicile sur les 10 dernières journées.", image:pic('css-classement', 800, 500) },
        { title:'Ali Maâloul : un capitaine exemplaire', category:'Actualité', date:'2026-02-20', content:"À 35 ans, le capitaine Ali Maâloul continue de porter le CS Sfaxien avec un leadership irréprochable.\n\nAncien international tunisien, vainqueur de la Ligue des Champions CAF avec Al Ahly, Maâloul apporte son expérience et sa vision du jeu à la défense sfaxienne.\n\nAuteur de 2 buts et 6 passes décisives cette saison, il est bien plus qu'un latéral gauche.", image:pic('maaloul-capitaine', 800, 500) },
        { title:'Mohamed Kouki : la tactique qui fait la différence', category:'Entraînement', date:'2026-02-12', content:"L'entraîneur Mohamed Kouki a mis en place un 4-3-3 fluide qui porte ses fruits depuis le début de la saison.\n\nLe pressing haut, la transition rapide et la solidité défensive sont les piliers de son système. Les joueurs affirment que les séances d'entraînement sont intenses et parfaitement organisées.\n\n\"Chaque joueur connaît son rôle sur le terrain\", déclare le technicien. \"Nous sommes une famille.\"", image:pic('kouki-tactique', 800, 500) },
        { title:'Aymen Dahmen de retour dans le groupe', category:'Entraînement', date:'2026-02-08', content:"Bonne nouvelle pour le CS Sfaxien ! Le gardien international tunisien Aymen Dahmen a repris l'entraînement collectif après sa blessure au genou.\n\nDahmen, qui a participé à la Coupe du Monde 2022, apporte une concurrence saine avec Mohamed Hedi Gaaloul.", image:pic('dahmen-retour', 800, 500) },
        { title:'Mercato : Travis Mutyaba prolonge jusqu\'en 2028', category:'Transfert', date:'2026-01-15', content:"Le CS Sfaxien a annoncé la prolongation du contrat du milieu ougandais Travis Mutyaba jusqu'en juin 2028.\n\nArrivé en 2025, Mutyaba s'est rapidement imposé comme un élément clé du milieu de terrain sfaxien grâce à sa technique et sa vision du jeu.\n\n\"Je suis très heureux à Sfax. Ce club, ces supporters... c'est spécial\", a déclaré le joueur de 22 ans.", image:pic('mutyaba-prolonge', 800, 500) },
        { title:'Journée portes ouvertes au Taïeb Mhiri : 5 000 visiteurs', category:'Communiqué', date:'2026-02-05', content:"Le CS Sfaxien a organisé une journée portes ouvertes au Stade Taïeb Mhiri qui a attiré plus de 5 000 visiteurs.\n\nLes supporters ont pu visiter les vestiaires, la salle de conférence, le musée des trophées et rencontrer les joueurs. Les jeunes du centre de formation ont animé des ateliers football.", image:pic('portes-ouvertes', 800, 500) },
        { title:'Nouvelle boutique en ligne officielle du CSS', category:'Communiqué', date:'2026-01-28', content:"Le Club Sportif Sfaxien lance sa boutique en ligne officielle ! Maillots, écharpes, accessoires et articles de collection sont désormais disponibles en livraison partout en Tunisie et à l'international.\n\nLes abonnés bénéficient de réductions exclusives allant jusqu'à -20%.", image:pic('boutique-launch', 800, 500) },
        { title:'Le CSS qualifié pour la phase de groupes de la Coupe de Tunisie', category:'Match', date:'2026-01-10', content:"Le CS Sfaxien se qualifie pour les quarts de finale de la Coupe de Tunisie après sa victoire 3-1 face à l'Avenir Sportif de Gabès.\n\nDoublé de Belwafi et but de Onana. Tirage au sort le 20 janvier.", image:pic('coupe-tunisie', 800, 500) },
        { title:'Partenariat avec Adidas renouvelé jusqu\'en 2029', category:'Communiqué', date:'2025-12-01', content:"Le CS Sfaxien et Adidas ont annoncé le renouvellement de leur partenariat d'équipementier jusqu'en 2029.\n\nCe partenariat historique garantit au club des équipements de pointe et une visibilité internationale renforcée.", image:pic('adidas-css', 800, 500) },
        { title:'Saison centenaire : 100ème édition de la Ligue 1', category:'Communiqué', date:'2025-08-09', content:"La saison 2025-26 marque la 100ème édition de la Ligue 1 Tunisienne ! Le CS Sfaxien, l'un des clubs fondateurs du football tunisien, est fier de participer à cette saison historique.\n\nDes événements spéciaux seront organisés tout au long de la saison pour célébrer ce centenaire.", image:pic('centenaire-l1', 800, 500) },
    ]);
    console.log('✅ Nouvelles insérées (16)');

    // ===================================================================
    //  PLAYERS — Effectif complet saison 2025-2026
    // ===================================================================
    await Player.insertMany([
        // Staff technique
        { category:'coach', name:'Mohamed Kouki', role:'Entraîneur Principal', nationality:'🇹🇳 Tunisie', icon:'fas fa-chalkboard-teacher', image:photo('coach-kouki') },
        { category:'staff', name:'Nabil Kouki', role:'Entraîneur Adjoint', nationality:'🇹🇳 Tunisie', icon:'fas fa-clipboard', image:photo('staff-nabil') },
        { category:'staff', name:'Mourad Mechri', role:'Entraîneur des Gardiens', nationality:'🇹🇳 Tunisie', icon:'fas fa-hands', image:photo('staff-mechri') },
        { category:'staff', name:'Sami Trabelsi', role:'Préparateur Physique', nationality:'🇹🇳 Tunisie', icon:'fas fa-dumbbell', image:photo('staff-trabelsi') },

        // Gardiens
        { category:'goalkeepers', name:'Mohamed Hedi Gaaloul', number:1, nationality:'🇹🇳', age:28, value:'800K €', image:photo('gk-gaaloul'), stats:{ matchs:20, buts:0, cleanSheets:10, arrets:58 }},
        { category:'goalkeepers', name:'Aymen Dahmen', number:30, nationality:'🇹🇳', age:27, value:'1.5M €', image:photo('gk-dahmen'), stats:{ matchs:5, buts:0, cleanSheets:3, arrets:18 }},
        { category:'goalkeepers', name:'Araysi', number:16, nationality:'🇹🇳', age:25, value:'300K €', image:photo('gk-araysi'), stats:{ matchs:2, buts:0, cleanSheets:1, arrets:8 }},

        // Défenseurs
        { category:'defenders', name:'Ali Maâloul', number:10, nationality:'🇹🇳', age:35, value:'1.0M €', image:photo('def-maaloul'), stats:{ matchs:22, buts:2, passes:6, tacles:40 }},
        { category:'defenders', name:'Abdessalem Akid', number:5, nationality:'🇹🇳', age:29, value:'700K €', image:photo('def-akid'), stats:{ matchs:21, buts:0, passes:1, tacles:62 }},
        { category:'defenders', name:'Mohamed Ali Ben Ali', number:3, nationality:'🇹🇳', age:27, value:'600K €', image:photo('def-benali'), stats:{ matchs:19, buts:1, passes:2, tacles:48 }},
        { category:'defenders', name:'Kévin Mondeko', number:15, nationality:'🇨🇩', age:28, value:'800K €', image:photo('def-mondeko'), stats:{ matchs:20, buts:1, passes:2, tacles:55 }},
        { category:'defenders', name:'Hichem Baccar', number:21, nationality:'🇹🇳', age:28, value:'1.2M €', image:photo('def-baccar'), stats:{ matchs:23, buts:8, passes:3, tacles:44 }},
        { category:'defenders', name:'Hamza Mathlouthi', number:24, nationality:'🇹🇳', age:30, value:'800K €', image:photo('def-mathlouthi'), stats:{ matchs:21, buts:1, passes:2, tacles:58 }},
        { category:'defenders', name:'Mohamed Amine Jlassi', number:22, nationality:'🇹🇳', age:23, value:'400K €', image:photo('def-jlassi'), stats:{ matchs:8, buts:0, passes:0, tacles:18 }},

        // Milieux
        { category:'midfielders', name:'Ammar Taifour', number:6, nationality:'🇸🇩', age:27, value:'600K €', image:photo('mid-taifour'), stats:{ matchs:20, buts:3, passes:5, tacles:42 }},
        { category:'midfielders', name:'Youssef Habchia', number:4, nationality:'🇹🇳', age:26, value:'500K €', image:photo('mid-habchia'), stats:{ matchs:17, buts:1, passes:4, tacles:35 }},
        { category:'midfielders', name:'Travis Mutyaba', number:12, nationality:'🇺🇬', age:22, value:'700K €', image:photo('mid-mutyaba'), stats:{ matchs:18, buts:4, passes:6, tacles:22 }},
        { category:'midfielders', name:'Bouara Diarra', number:27, nationality:'🇲🇱', age:26, value:'650K €', image:photo('mid-diarra'), stats:{ matchs:19, buts:2, passes:7, tacles:38 }},
        { category:'midfielders', name:'Firas Sekkouhi', number:8, nationality:'🇹🇳', age:24, value:'450K €', image:photo('mid-sekkouhi'), stats:{ matchs:14, buts:1, passes:3, tacles:25 }},
        { category:'midfielders', name:'Hamdi Nagguez', number:14, nationality:'🇹🇳', age:31, value:'550K €', image:photo('mid-nagguez'), stats:{ matchs:16, buts:0, passes:2, tacles:30 }},

        // Attaquants
        { category:'attackers', name:'Omar Ben Ali', number:9, nationality:'🇹🇳', age:26, value:'1.5M €', image:photo('att-benali'), stats:{ matchs:23, buts:9, passes:3, tirs:58 }},
        { category:'attackers', name:'Willy Onana', number:7, nationality:'🇨🇲', age:27, value:'800K €', image:photo('att-onana'), stats:{ matchs:20, buts:5, passes:6, tirs:45 }},
        { category:'attackers', name:'Iyed Belwafi', number:11, nationality:'🇹🇳', age:27, value:'1.0M €', image:photo('att-belwafi'), stats:{ matchs:21, buts:7, passes:4, tirs:40 }},
        { category:'attackers', name:'Yassine Chikhaoui', number:17, nationality:'🇹🇳', age:23, value:'350K €', image:photo('att-chikhaoui'), stats:{ matchs:10, buts:2, passes:1, tirs:15 }},
    ]);
    console.log('✅ Joueurs insérés (24)');

    // ===================================================================
    //  GALLERY — Photos et vidéos avec images
    // ===================================================================
    await Gallery.insertMany([
        // Match photos
        { title:'CSS 4-0 CA Bizertin : Démonstration', desc:'Les joueurs célèbrent la victoire écrasante 4-0 au Taïeb Mhiri. Une performance collective exceptionnelle.', category:'match-photo', type:'photo', layout:'wide', date:'2025-12-14', image:pic('css-victory-celebration', 900, 600) },
        { title:'Omar Ben Ali : Doublé face au CAB', desc:'Omar Ben Ali célèbre son doublé avec le public du Taïeb Mhiri.', category:'match-photo', type:'photo', layout:'', date:'2025-12-14', image:pic('omar-double', 600, 600) },
        { title:'Belwafi marque le but de la victoire', desc:'Iyed Belwafi inscrit le but de la victoire face à l\'Étoile du Sahel au Derby de Sousse.', category:'match-photo', type:'photo', layout:'', date:'2026-02-15', image:pic('belwafi-goal-derby', 600, 600) },
        { title:'CSS 2-0 AS Marsa : Domination totale', desc:'Les joueurs du CSS dominent la rencontre face à l\'AS Marsa.', category:'match-photo', type:'photo', layout:'wide', date:'2026-02-22', image:pic('css-marsa-action', 900, 600) },
        { title:'Gaaloul sauve le CSS', desc:'Le gardien Gaaloul réalise un arrêt décisif dans les dernières minutes.', category:'match-photo', type:'photo', layout:'', date:'2026-02-28', image:pic('gaaloul-save', 600, 600) },

        // Training photos
        { title:'Séance tactique au tableau', desc:'Le coach Mohamed Kouki explique le plan de jeu avant le derby.', category:'training-photo', type:'photo', layout:'wide', date:'2026-02-25', image:pic('kouki-tactics-board', 900, 600) },
        { title:'Exercice de passes au centre d\'entraînement', desc:'Travis Mutyaba et Bouara Diarra travaillent la circulation du ballon.', category:'training-photo', type:'photo', layout:'', date:'2026-02-20', image:pic('training-passes', 600, 600) },
        { title:'Préparation physique intensive', desc:'Les joueurs du CSS lors d\'une séance de préparation physique.', category:'training-photo', type:'photo', layout:'', date:'2026-02-18', image:pic('css-fitness', 600, 600) },
        { title:'Entraînement des gardiens', desc:'Dahmen et Gaaloul lors d\'une séance spécifique gardiens.', category:'training-photo', type:'photo', layout:'wide', date:'2026-02-15', image:pic('goalkeeper-training', 900, 600) },

        // Videos
        { title:'Résumé CSS 4-0 CA Bizertin', desc:'Tous les buts et temps forts de la victoire écrasante.', category:'video', type:'video', layout:'wide', date:'2025-12-14', duration:'8:22', videoUrl:'#', image:pic('css-cab-highlights', 900, 600) },
        { title:'Conférence Mohamed Kouki — Post-Derby', desc:'Mohamed Kouki s\'exprime après la victoire au derby de Sousse.', category:'video', type:'video', layout:'', date:'2026-02-15', duration:'12:30', videoUrl:'#', image:pic('kouki-press-conf', 600, 600) },
        { title:'Omar Ben Ali : Interview exclusive', desc:'L\'attaquant se confie sur ses objectifs et son amour pour le club.', category:'video', type:'video', layout:'', date:'2026-02-20', duration:'6:45', videoUrl:'#', image:pic('omar-interview', 600, 600) },

        // Fans
        { title:'Supporters Sfaxiens en force', desc:'Les ultras noir et blanc au grand complet au Taïeb Mhiri. Ambiance de feu.', category:'fans', type:'photo', layout:'tall', date:'2026-02-28', image:pic('css-ultras', 600, 900) },
        { title:'Tifo géant tribune Nord', desc:'Tifo spectaculaire \"100 ans de passion\" déployé en tribune nord.', category:'fans', type:'photo', layout:'wide', date:'2026-02-14', image:pic('css-tifo-nord', 900, 600) },
        { title:'Cortège noir et blanc', desc:'Les supporters sfaxiens en cortège avant le match au Taïeb Mhiri.', category:'fans', type:'photo', layout:'', date:'2026-01-25', image:pic('css-cortege', 600, 600) },
        { title:'Déplacement à Sousse', desc:'3 000 supporters sfaxiens en déplacement au Stade Olympique de Sousse.', category:'fans', type:'photo', layout:'wide', date:'2026-02-15', image:pic('css-away-fans', 900, 600) },

        // Stadium
        { title:'Stade Taïeb Mhiri — Vue aérienne', desc:'Vue panoramique du stade mythique de Sfax, capacité 18 000 places.', category:'stadium', type:'photo', layout:'wide', date:'2026-01-15', image:pic('taieb-mhiri-aerial', 900, 600) },
        { title:'Pelouse impeccable', desc:'La pelouse du Taïeb Mhiri en préparation avant le match.', category:'stadium', type:'photo', layout:'', date:'2026-02-27', image:pic('css-pitch', 600, 600) },
        { title:'Tribune VIP Est', desc:'La tribune VIP Est rénovée pour la saison centenaire.', category:'stadium', type:'photo', layout:'', date:'2026-01-10', image:pic('css-vip-tribune', 600, 600) },
        { title:'Vestiaires du Taïeb Mhiri', desc:'Les vestiaires entièrement rénovés du stade historique.', category:'stadium', type:'photo', layout:'tall', date:'2026-01-05', image:pic('css-vestiaires', 600, 900) },
    ]);
    console.log('✅ Galerie insérée (20)');

    // ===================================================================
    //  TIMELINE — Histoire du CS Sfaxien
    // ===================================================================
    await Timeline.insertMany([
        { year:'1928', icon:'fa-flag', title:'Fondation du Club Sportif Sfaxien', desc:'Le Club Sportif Sfaxien est fondé le 28 mai 1928 à Sfax. Le noir et blanc sont choisis comme couleurs officielles.' },
        { year:'1963', icon:'fa-medal', title:'Première Coupe de Tunisie', desc:'Le CSS remporte sa première Coupe de Tunisie, marquant les débuts de son palmarès.' },
        { year:'1969', icon:'fa-trophy', title:'Premier Titre de Champion', desc:'Le CSS remporte son premier titre de champion de Tunisie sous la direction d\'Abdelmajid Chetali.' },
        { year:'1981', icon:'fa-star', title:'3ème Titre de Champion', desc:'Nouveau sacre national confirmant le CSS parmi l\'élite du football tunisien.' },
        { year:'1998', icon:'fa-earth-africa', title:'Coupe de la CAF — Premier titre continental', desc:'Victoire historique en Coupe de la CAF. Le CS Sfaxien devient le premier club non-tunisien à remporter cette compétition.' },
        { year:'2004', icon:'fa-shield-halved', title:'Coupe Arabe des Clubs', desc:'Le CSS conquiert la Coupe Arabe des Clubs, s\'imposant face aux géants du football arabe.' },
        { year:'2007', icon:'fa-crown', title:'Le Triplé Historique', desc:'Saison légendaire : Championnat de Tunisie, Coupe de Tunisie ET Coupe de la Confédération CAF. Le CSS entre dans l\'histoire.' },
        { year:'2008', icon:'fa-globe', title:'2ème Confédération CAF consécutive', desc:'Le CSS conserve son titre continental — un exploit rarissime dans le football africain.' },
        { year:'2013', icon:'fa-futbol', title:'3ème Confédération CAF + 7ème Championnat', desc:'Doublé national-continental : le CSS remporte sa 3ème Confédération CAF et son 7ème titre de champion.' },
        { year:'2015', icon:'fa-shield-halved', title:'2ème Coupe Arabe des Clubs', desc:'Nouveau sacre à l\'échelle arabe. Le CSS confirme son rayonnement international.' },
        { year:'2022', icon:'fa-trophy', title:'8ème Titre de Champion', desc:'Le CSS remporte son 8ème titre de champion de Tunisie après une saison dominée.' },
        { year:'2023', icon:'fa-medal', title:'7ème Coupe de Tunisie', desc:'Le CSS remporte sa 7ème Coupe de Tunisie, enrichissant un peu plus son palmarès.' },
        { year:'2025', icon:'fa-fire', title:'Saison du Centenaire', desc:'La saison 2025-26 marque la 100ème édition de la Ligue 1 Tunisienne. Le CSS vise le podium.' },
    ]);
    console.log('✅ Timeline insérée (13 événements)');

    // ===================================================================
    //  TROPHIES — Palmarès complet
    // ===================================================================
    await Trophy.insertMany([
        { name:'Championnat de Tunisie', icon:'fa-trophy', count:8, years:['1969','1971','1981','1995','2000','2007','2013','2022'] },
        { name:'Coupe de Tunisie', icon:'fa-medal', count:7, years:['1963','1966','1983','1999','2007','2009','2023'] },
        { name:'Coupe de la Confédération CAF', icon:'fa-globe', count:3, years:['2007','2008','2013'] },
        { name:'Coupe de la CAF', icon:'fa-earth-africa', count:1, years:['1998'] },
        { name:'Coupe Arabe des Clubs', icon:'fa-shield-halved', count:2, years:['2004','2015'] },
        { name:'Supercoupe de Tunisie', icon:'fa-star', count:3, years:['2000','2007','2022'] },
    ]);
    console.log('✅ Trophées insérés (6 — total 24 titres)');

    // ===================================================================
    //  LEGENDS — Légendes du club
    // ===================================================================
    await Legend.insertMany([
        { name:'Abdelmajid Chetali', position:'Entraîneur', era:'1960s-1980s', number:'', desc:'Entraîneur légendaire qui a façonné l\'identité tactique du CSS. Pilier de la première ère dorée du club, il a remporté de nombreux titres nationaux.', image:avatarLg('Abdelmajid Chetali', '000'), stats:{ années:'20+', titres:8, matchs:'600+' }},
        { name:'Raouf Ben Aziza', position:'Milieu offensif', era:'1990s-2000s', number:'10', desc:'Le maestro du milieu de terrain sfaxien. Technique exceptionnelle, passes décisives légendaires. Lié à la conquête de la Coupe de la CAF 1998.', image:avatarLg('Raouf Ben Aziza', '1a1a1a'), stats:{ matchs:350, buts:67, passes:120 }},
        { name:'Karim Haggui', position:'Défenseur central', era:'2000s-2010s', number:'4', desc:'Défenseur central d\'exception qui a brillé en Tunisie et en Bundesliga (VfB Stuttgart, Hannover 96). International tunisien (50+ sélections).', image:avatarLg('Karim Haggui', '333'), stats:{ matchs:180, buts:15, sélections:55 }},
        { name:'Anis Boussaïdi', position:'Attaquant', era:'2000s-2010s', number:'9', desc:'Buteur prolifique et icône offensive du CSS. Héros du triplé historique de 2007. Meilleur buteur du club sur la décennie 2000.', image:avatarLg('Anis Boussaidi', '111'), stats:{ matchs:220, buts:95, titres:8 }},
        { name:'Fakhreddine Ben Youssef', position:'Attaquant', era:'2010s-2020s', number:'11', desc:'Attaquant international tunisien, présent à la Coupe du Monde 2018 en Russie. A contribué à la 3ème Confédération CAF en 2013.', image:avatarLg('Fakhreddine Ben Youssef', '0a0a0a'), stats:{ matchs:150, buts:55, sélections:40 }},
        { name:'Hamza Mathlouthi', position:'Gardien', era:'2000s-2010s', number:'1', desc:'Gardien emblématique du CSS et de l\'équipe nationale. Mur infranchissable qui a gardé les cages lors des plus grandes victoires continentales.', image:avatarLg('Hamza Mathlouthi GK', '1a1a1a'), stats:{ matchs:280, cleanSheets:105, sélections:70 }},
    ]);
    console.log('✅ Légendes insérées (6)');

    // ===================================================================
    //  TICKET MATCHES — Billetterie
    // ===================================================================
    await TicketMatch.insertMany([
        { home:'CS Sfaxien', away:'JS Kairouan', date:'21 Mars 2026', time:'16:00', comp:'Ligue 1 — J24', venue:'Stade Taïeb Mhiri', available:true },
        { home:'CS Sfaxien', away:'Étoile du Sahel', date:'5 Avril 2026', time:'16:00', comp:'Ligue 1 — J26 (Derby)', venue:'Stade Taïeb Mhiri', available:true },
        { home:'CS Sfaxien', away:'Olympique Béja', date:'19 Avril 2026', time:'16:00', comp:'Ligue 1 — J28', venue:'Stade Taïeb Mhiri', available:true },
        { home:'CS Sfaxien', away:'Stade Tunisien', date:'3 Mai 2026', time:'16:00', comp:'Ligue 1 — J30', venue:'Stade Taïeb Mhiri', available:true },
        { home:'CS Sfaxien', away:'Club Africain', date:'17 Mai 2026', time:'16:00', comp:'Ligue 1 — J32 (Choc)', venue:'Stade Taïeb Mhiri', available:true },
    ]);
    console.log('✅ Billetterie insérée (5 matchs)');

    // ===================================================================
    //  STADIUM ZONES — Zones du stade
    // ===================================================================
    await StadiumZone.insertMany([
        { name:'Tribune Nord (Virage)', price:10, available:5500, total:7000 },
        { name:'Tribune Sud (Virage)', price:10, available:5000, total:7000 },
        { name:'Tribune Ouest (Latérale)', price:20, available:2800, total:5000 },
        { name:'Tribune Est (VIP)', price:45, available:1400, total:3000 },
    ]);
    console.log('✅ Zones stade insérées (4)');

    // ===================================================================
    //  SUBSCRIPTION PLANS — Abonnements
    // ===================================================================
    await SubPlan.insertMany([
        { name:'Gradin', price:100, period:'Saison 2025-2026', icon:'fa-users', description:'Tribune populaire — L\'ambiance du Virage', featured:false, features:[
            {icon:'fa-check',text:'Tribune Nord ou Sud (Virage)'},
            {icon:'fa-check',text:'15 matchs de championnat à domicile'},
            {icon:'fa-check',text:'Carte de membre digitale'},
            {icon:'fa-check',text:'-5% boutique en ligne'},
            {icon:'fa-times',text:'Matchs de coupe non inclus'}
        ]},
        { name:'Chaise', price:220, period:'Saison 2025-2026', icon:'fa-chair', description:'Place assise numérotée', featured:false, features:[
            {icon:'fa-check',text:'Tribune Ouest — Siège numéroté'},
            {icon:'fa-check',text:'Tous les matchs à domicile (championnat + coupe)'},
            {icon:'fa-check',text:'Carte de membre physique'},
            {icon:'fa-check',text:'-10% boutique'},
            {icon:'fa-check',text:'Newsletter exclusive'}
        ]},
        { name:'Centrale', price:400, period:'Saison 2025-2026', icon:'fa-star', description:'Tribune centrale — Vue optimale', featured:true, features:[
            {icon:'fa-check',text:'Tribune Centrale — Meilleure vue du stade'},
            {icon:'fa-check',text:'Tous les matchs (championnat + coupe)'},
            {icon:'fa-check',text:'Carte Premium personnalisée'},
            {icon:'fa-check',text:'-15% boutique + accès prévente'},
            {icon:'fa-check',text:'Kit de bienvenue (écharpe officielle)'}
        ]},
        { name:'Loge VIP', price:750, period:'Saison 2025-2026', icon:'fa-gem', description:'Loge privée — Expérience exclusive', featured:false, features:[
            {icon:'fa-check',text:'Loge VIP privée climatisée'},
            {icon:'fa-check',text:'Tous les matchs + événements spéciaux'},
            {icon:'fa-check',text:'Carte VIP Gold personnalisée'},
            {icon:'fa-check',text:'-20% boutique + maillot offert'},
            {icon:'fa-check',text:'Kit complet (maillot dédicacé + écharpe)'},
            {icon:'fa-check',text:'Parking réservé + Salon VIP + Buffet'}
        ]},
    ]);
    console.log('✅ Plans abonnement insérés (4)');

    // ===================================================================
    //  MEETINGS — Confrontations récentes
    // ===================================================================
    await Meeting.insertMany([
        { date:'01/03/2026', home:'CSS', away:'EST', score:'1 - 2', result:'loss' },
        { date:'28/02/2026', home:'CSS', away:'ASG', score:'1 - 0', result:'win' },
        { date:'22/02/2026', home:'CSS', away:'ASM', score:'2 - 0', result:'win' },
        { date:'15/02/2026', home:'ESS', away:'CSS', score:'0 - 1', result:'win' },
        { date:'08/02/2026', home:'USBG', away:'CSS', score:'0 - 1', result:'win' },
        { date:'01/02/2026', home:'CSS', away:'JSO', score:'2 - 0', result:'win' },
        { date:'25/01/2026', home:'CSS', away:'ESM', score:'2 - 0', result:'win' },
        { date:'18/01/2026', home:'JSO', away:'CSS', score:'1 - 0', result:'loss' },
        { date:'11/01/2026', home:'OB', away:'CSS', score:'0 - 1', result:'win' },
        { date:'14/12/2025', home:'CSS', away:'CAB', score:'4 - 0', result:'win' },
    ]);
    console.log('✅ Confrontations insérées (10)');

    // ===================================================================
    //  DONORS — Donateurs
    // ===================================================================
    await Donor.insertMany([
        { name:'Société Tunisienne de Banque', amount:'10,000 TND' },
        { name:'Groupe Poulina', amount:'5,000 TND' },
        { name:'Mohamed Trabelsi', amount:'2,000 TND' },
        { name:'Ahmed Ben Salem', amount:'1,000 TND' },
        { name:'Association CSS Europe', amount:'3,500 TND' },
        { name:'Fatma Karray', amount:'500 TND' },
        { name:'Donateur Anonyme', amount:'1,500 TND' },
        { name:'Nabil Chaari', amount:'800 TND' },
        { name:'Sami Gargouri', amount:'400 TND' },
        { name:'Riadh Mahfoudh', amount:'600 TND' },
        { name:'Donateur Anonyme', amount:'250 TND' },
        { name:'Sfax Sport Consulting', amount:'2,500 TND' },
    ]);
    console.log('✅ Donateurs insérés (12)');

    // ===================================================================
    //  PROMO CODES — Codes promotionnels
    // ===================================================================
    await PromoCode.insertMany([
        { code:'CSS2026',    discount:10, type:'percent', maxUses:200, minOrder:30,  validFrom:new Date('2025-09-01'), validUntil:new Date('2026-06-30'), appliesTo:['ticket','product','subscription'] },
        { code:'BIENVENUE',  discount:15, type:'percent', maxUses:500, minOrder:0,   validFrom:new Date('2025-09-01'), validUntil:new Date('2026-12-31'), appliesTo:['ticket','product','subscription'] },
        { code:'BOUTIQUE20', discount:20, type:'percent', maxUses:100, minOrder:50,  validFrom:new Date('2025-09-01'), validUntil:new Date('2026-06-30'), appliesTo:['product'] },
        { code:'MATCHDAY',   discount:5,  type:'fixed',   maxUses:300, minOrder:15,  validFrom:new Date('2025-09-01'), validUntil:new Date('2026-06-30'), appliesTo:['ticket'] },
        { code:'FIDELE50',   discount:50, type:'percent', maxUses:20,  minOrder:200, validFrom:new Date('2026-01-01'), validUntil:new Date('2026-06-30'), appliesTo:['subscription'] },
    ]);
    console.log('✅ Codes promo insérés (5)');

    // ===================================================================
    //  SPORT SECTIONS — Sections sportives du CSS
    // ===================================================================
    await SportSection.insertMany([
        {
            name: 'Football',
            icon: 'fa-futbol',
            image: pic('css-football', 800, 500),
            description: 'Section phare du Club Sportif Sfaxien, fondée en 1928. Le CSS est l\'un des clubs les plus titrés de Tunisie et d\'Afrique. Évoluant au Stade Taïeb Mhiri (capacité 18 000), l\'équipe a remporté de nombreux titres nationaux et continentaux, dont la Coupe de la CAF en 2007 et 2013. L\'équipe évolue en noir et blanc, symboles de la fierté sfaxienne.',
            founded: '1928',
            coach: 'Mohamed Sahbi Lamouchi',
            venue: 'Stade Taïeb Mhiri (18 000 places)',
            achievements: [
                { title: 'Champion de Tunisie', year: '1969, 2013' },
                { title: 'Coupe de Tunisie', year: '1963, 1965, 1968, 1974, 2009, 2022, 2024' },
                { title: 'Coupe de la CAF', year: '2007, 2013' },
                { title: 'Supercoupe de la CAF', year: '2008' },
                { title: 'Ligue des Champions arabes', year: '2011' }
            ],
            stats: { 'Titres nationaux': '9', 'Titres continentaux': '3', 'Participations CL CAF': '15+', 'Joueurs formés': '200+' },
            color: '#1a1a1a',
            active: true,
            order: 1
        },
        {
            name: 'Volleyball',
            icon: 'fa-volleyball',
            image: pic('css-volleyball', 800, 500),
            description: 'La section volleyball du CSS est l\'une des plus performantes de Tunisie. Fondée dans les années 1940, elle a accumulé de nombreux titres nationaux en championnat et en coupe. L\'équipe masculine a longtemps dominé le volleyball tunisien et participe régulièrement aux compétitions africaines. La section dispose d\'une excellente formation des jeunes.',
            founded: '1946',
            coach: 'Fethi Mkaouar',
            venue: 'Salle Habib Thamer, Sfax',
            achievements: [
                { title: 'Champion de Tunisie (Hommes)', year: 'Multiple (14 titres)' },
                { title: 'Coupe de Tunisie (Hommes)', year: 'Multiple (10 titres)' },
                { title: 'Championnat d\'Afrique des clubs', year: '2 participations' },
                { title: 'Supercoupe de Tunisie', year: 'Multiple' }
            ],
            stats: { 'Championnats': '14', 'Coupes': '10', 'Joueurs en sélection': '30+', 'Années d\'activité': '80' },
            color: '#2563eb',
            active: true,
            order: 2
        },
        {
            name: 'Basketball',
            icon: 'fa-basketball',
            image: pic('css-basketball', 800, 500),
            description: 'La section basketball du CSS est un pilier du basket tunisien. Fondée dans les années 1950, l\'équipe a marqué l\'histoire du basketball national avec plusieurs titres de champion et de coupe de Tunisie. Le club contribue activement au développement du basketball à Sfax et dans le Sud tunisien, avec un centre de formation reconnu.',
            founded: '1952',
            coach: 'Nabil Missaoui',
            venue: 'Salle Habib Thamer, Sfax',
            achievements: [
                { title: 'Champion de Tunisie', year: 'Multiple (5 titres)' },
                { title: 'Coupe de Tunisie', year: 'Multiple (4 titres)' },
                { title: 'Compétitions africaines', year: 'Participation régulière' },
                { title: 'Formation jeunes', year: 'Centre agréé' }
            ],
            stats: { 'Championnats': '5', 'Coupes': '4', 'Joueurs en sélection': '15+', 'Années d\'activité': '74' },
            color: '#dc2626',
            active: true,
            order: 3
        },
        {
            name: 'Handball',
            icon: 'fa-hand-fist',
            image: pic('css-handball', 800, 500),
            description: 'La section handball du CSS a une riche tradition dans le handball tunisien. Fondée dans les années 1960, l\'équipe a remporté plusieurs titres nationaux. Le club est reconnu pour sa formation de qualité, ayant produit plusieurs joueurs qui ont évolué en sélection nationale tunisienne et dans des championnats européens.',
            founded: '1962',
            coach: 'Slim Hedili',
            venue: 'Salle Habib Thamer, Sfax',
            achievements: [
                { title: 'Champion de Tunisie', year: 'Multiple (6 titres)' },
                { title: 'Coupe de Tunisie', year: 'Multiple (3 titres)' },
                { title: 'Championnat d\'Afrique des clubs', year: 'Participation' },
                { title: 'Internationaux formés', year: '20+ joueurs' }
            ],
            stats: { 'Championnats': '6', 'Coupes': '3', 'Joueurs en sélection': '20+', 'Années d\'activité': '64' },
            color: '#059669',
            active: true,
            order: 4
        }
    ]);
    console.log('✅ Sections sportives insérées (4)');

    // ===================================================================
    //  LINEUP — Composition type (4-3-3)
    // ===================================================================
    await Lineup.create({ formation: [
        [{ number:1, name:'Gaaloul' }],
        [{ number:10, name:'Maâloul' }, { number:5, name:'Akid' }, { number:15, name:'Mondeko' }, { number:24, name:'Mathlouthi' }],
        [{ number:6, name:'Taifour' }, { number:27, name:'Diarra' }, { number:12, name:'Mutyaba' }],
        [{ number:7, name:'Onana' }, { number:9, name:'O. Ben Ali' }, { number:11, name:'Belwafi' }]
    ]});
    console.log('✅ Composition 4-3-3 insérée');

    // ===================================================================
    //  ADMIN ACCOUNT
    // ===================================================================
    const adminCount = await Admin.countDocuments();
    if (adminCount === 0) {
        await Admin.create({ username: 'admin', password: 'admin123' });
        console.log('✅ Compte admin créé (admin / admin123)');
    }

    console.log('\n🎉 Base de données initialisée avec succès !');
    console.log('   📊 12 matchs | 10 fixtures | 16 équipes classement');
    console.log('   🛍️  23 produits | 📰 16 nouvelles | ⚽ 24 joueurs');
    console.log('   📸 20 galerie | 📅 13 timeline | 🏆 6 trophées');
    console.log('   🌟 6 légendes | 🎟️  5 billets | 4 zones stade');
    console.log('   📋 4 abonnements | 10 confrontations | 12 donateurs');
    console.log('   📝 5 codes promo | 🏐 4 sections sportives');
    process.exit(0);
}

seed().catch(err => {
    console.error('Erreur lors du seed:', err);
    process.exit(1);
});
