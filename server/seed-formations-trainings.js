const mongoose = require('mongoose');
const Player = require('./models/Player');
const Formation = require('./models/Formation');
const Training = require('./models/Training');

mongoose.connect('mongodb://127.0.0.1:27017/cssfaxien').then(async () => {
    // ===== 1. CREATE PUBLISHED FORMATION =====
    // Get real players
    const players = await Player.find({ category: { $nin: ['coach', 'staff'] } }).lean();
    const coach = await Player.findOne({ category: 'coach' }).lean();
    
    const byPos = {
        gk: players.filter(p => p.category === 'goalkeepers'),
        def: players.filter(p => p.category === 'defenders'),
        mid: players.filter(p => p.category === 'midfielders'),
        att: players.filter(p => p.category === 'attackers')
    };

    // Build 4-3-3 formation with real players
    const lineup = [
        { ...byPos.gk[0], role: 'GK', x: 50, y: 92 },
        { ...byPos.def[0], role: 'RB', x: 85, y: 72 },
        { ...byPos.def[1], role: 'CB', x: 62, y: 75 },
        { ...byPos.def[2], role: 'CB', x: 38, y: 75 },
        { ...byPos.def[3], role: 'LB', x: 15, y: 72 },
        { ...byPos.mid[0], role: 'CM', x: 65, y: 52 },
        { ...byPos.mid[1], role: 'CDM', x: 50, y: 56 },
        { ...byPos.mid[2], role: 'CM', x: 35, y: 52 },
        { ...byPos.att[0], role: 'RW', x: 82, y: 28 },
        { ...byPos.att[1], role: 'ST', x: 50, y: 20 },
        { ...byPos.att[2], role: 'LW', x: 18, y: 28 }
    ];

    const positions = lineup.map(p => ({
        playerId: p._id,
        playerName: p.name,
        playerNumber: p.number,
        playerImage: p.image || '',
        x: p.x,
        y: p.y,
        role: p.role
    }));

    // Remaining players as substitutes
    const usedIds = new Set(lineup.map(p => p._id.toString()));
    const subs = players.filter(p => !usedIds.has(p._id.toString())).slice(0, 7).map(p => ({
        playerId: p._id,
        playerName: p.name,
        playerNumber: p.number
    }));

    // Delete old test formations
    await Formation.deleteMany({});

    const formation = new Formation({
        name: 'Formation vs Espérance',
        formation: '4-3-3',
        matchDate: '2026-03-28',
        opponent: 'Espérance de Tunis',
        competition: 'Ligue 1',
        positions,
        substitutes: subs,
        notes: 'Bloc haut, pressing intense dès la perte du ballon. Maâloul monte côté gauche en phase offensive.',
        createdBy: coach._id,
        createdByName: coach.name,
        status: 'published'
    });
    await formation.save();
    console.log('✅ Formation publiée créée:', formation.name, '| positions:', positions.length, '| subs:', subs.length);

    // 2nd formation - defensive
    const lineup2 = [
        { ...byPos.gk[0], role: 'GK', x: 50, y: 92 },
        { ...byPos.def[0], role: 'RWB', x: 88, y: 68 },
        { ...byPos.def[1], role: 'CB', x: 68, y: 75 },
        { ...byPos.def[2], role: 'CB', x: 50, y: 78 },
        { ...byPos.def[3], role: 'CB', x: 32, y: 75 },
        { ...byPos.def.length > 4 ? byPos.def[4] : byPos.mid[0], role: 'LWB', x: 12, y: 68 },
        { ...byPos.mid[1], role: 'CM', x: 65, y: 52 },
        { ...byPos.mid[2], role: 'CM', x: 50, y: 55 },
        { ...byPos.mid[3] || byPos.mid[0], role: 'CM', x: 35, y: 52 },
        { ...byPos.att[0], role: 'ST', x: 60, y: 22 },
        { ...byPos.att[1], role: 'ST', x: 40, y: 22 }
    ];

    const positions2 = lineup2.map(p => ({
        playerId: p._id,
        playerName: p.name,
        playerNumber: p.number,
        playerImage: p.image || '',
        x: p.x, y: p.y, role: p.role
    }));

    const formation2 = new Formation({
        name: 'Plan B Défensif',
        formation: '5-3-2',
        matchDate: '2026-03-28',
        opponent: 'Espérance de Tunis',
        competition: 'Ligue 1',
        positions: positions2,
        substitutes: subs,
        notes: 'Formation défensive. Bloc bas, contre-attaque rapide par les côtés.',
        createdBy: coach._id,
        createdByName: coach.name,
        status: 'published'
    });
    await formation2.save();
    console.log('✅ Formation 2 publiée:', formation2.name);

    // ===== 2. CREATE TRAINING SESSIONS =====
    await Training.deleteMany({});

    const today = new Date();
    const sessions = [
        {
            title: 'Entraînement tactique — pressing haut',
            type: 'terrain',
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
            startTime: '09:00', endTime: '11:30',
            location: 'Stade Taïeb Mhiri',
            intensity: 'intense',
            description: 'Travail sur le pressing haut et les transitions offensives rapides.',
            exercises: [
                { name: 'Échauffement avec ballon', duration: '15 min', category: 'échauffement', intensity: 'faible' },
                { name: 'Rondo 5v2', duration: '15 min', category: 'technique', intensity: 'modéré' },
                { name: 'Pressing à 3 sur demi-terrain', duration: '25 min', category: 'tactique', intensity: 'intense' },
                { name: 'Match 11v11 terrain réduit', duration: '30 min', category: 'tactique', intensity: 'intense' },
                { name: 'Étirements + récupération', duration: '15 min', category: 'étirements', intensity: 'faible' }
            ],
            status: 'planifié'
        },
        {
            title: 'Séance musculation + cardio',
            type: 'salle',
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2),
            startTime: '08:00', endTime: '10:00',
            location: 'Salle de musculation',
            intensity: 'intense',
            description: 'Renforcement musculaire ciblé et endurance cardiovasculaire.',
            exercises: [
                { name: 'Vélo / rameur (échauffement)', duration: '10 min', category: 'cardio', intensity: 'faible' },
                { name: 'Squat barre', duration: '4x8', category: 'musculation', intensity: 'intense' },
                { name: 'Presse à cuisses', duration: '3x12', category: 'musculation', intensity: 'intense' },
                { name: 'Gainage dynamique', duration: '3x45s', category: 'musculation', intensity: 'modéré' },
                { name: 'Sprints courts 20m', duration: '10x20m', category: 'cardio', intensity: 'max' },
                { name: 'Étirements actifs', duration: '15 min', category: 'étirements', intensity: 'faible' }
            ],
            status: 'planifié'
        },
        {
            title: 'Récupération active',
            type: 'recuperation',
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
            startTime: '10:00', endTime: '11:30',
            location: 'Centre de récupération CSS',
            intensity: 'légère',
            description: 'Séance légère pour les joueurs ayant joué. Focus sur la récupération.',
            exercises: [
                { name: 'Marche / jogging léger', duration: '15 min', category: 'cardio', intensity: 'faible' },
                { name: 'Bain froid / cryothérapie', duration: '10 min', category: 'étirements', intensity: 'faible' },
                { name: 'Étirements passifs', duration: '20 min', category: 'étirements', intensity: 'faible' },
                { name: 'Massage / foam roller', duration: '15 min', category: 'étirements', intensity: 'faible' }
            ],
            status: 'planifié'
        },
        {
            title: 'Séance tactique — coups de pied arrêtés',
            type: 'tactique',
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4),
            startTime: '09:30', endTime: '11:00',
            location: 'Stade Taïeb Mhiri',
            intensity: 'modérée',
            description: 'Travail sur les corners offensifs et défensifs, coups francs.',
            exercises: [
                { name: 'Échauffement', duration: '15 min', category: 'échauffement', intensity: 'faible' },
                { name: 'Corners offensifs (6 variantes)', duration: '25 min', category: 'tactique', intensity: 'modéré' },
                { name: 'Corners défensifs — marquage zone', duration: '20 min', category: 'tactique', intensity: 'modéré' },
                { name: 'Coups francs offensifs', duration: '15 min', category: 'technique', intensity: 'modéré' },
                { name: 'Mini-match 8v8', duration: '20 min', category: 'tactique', intensity: 'intense' }
            ],
            status: 'planifié'
        },
        {
            title: 'Double séance — foncier + technique',
            type: 'terrain',
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
            startTime: '07:30', endTime: '12:00',
            location: 'Stade Taïeb Mhiri',
            intensity: 'double',
            description: 'Double séance : matin foncier / après-midi technique avec ballon.',
            exercises: [
                { name: 'Course continue 30 min', duration: '30 min', category: 'cardio', intensity: 'intense' },
                { name: 'Intervalles 30/30', duration: '15 min', category: 'cardio', intensity: 'max' },
                { name: 'Pause déjeuner', duration: '90 min', category: 'échauffement', intensity: 'faible' },
                { name: 'Conduite de balle en slalom', duration: '20 min', category: 'technique', intensity: 'modéré' },
                { name: 'Centres et finition', duration: '25 min', category: 'technique', intensity: 'intense' },
                { name: 'Jeu de position 6v6', duration: '20 min', category: 'tactique', intensity: 'intense' }
            ],
            status: 'planifié'
        },
        {
            title: 'Entraînement veille de match',
            type: 'tactique',
            date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 6),
            startTime: '10:00', endTime: '11:00',
            location: 'Stade Taïeb Mhiri',
            intensity: 'légère',
            description: 'Activation légère et mise en place tactique avant le match de demain.',
            exercises: [
                { name: 'Trottinement + mobilité', duration: '10 min', category: 'échauffement', intensity: 'faible' },
                { name: 'Conservation 11v0 (circulation)', duration: '15 min', category: 'tactique', intensity: 'faible' },
                { name: 'Frappes au but', duration: '15 min', category: 'technique', intensity: 'modéré' },
                { name: 'Coups de pied arrêtés', duration: '10 min', category: 'tactique', intensity: 'faible' }
            ],
            status: 'planifié'
        }
    ];

    for (const s of sessions) {
        const t = new Training({
            ...s,
            createdBy: coach._id,
            createdByName: coach.name
        });
        await t.save();
        console.log('✅ Séance créée:', t.title, '|', t.date.toLocaleDateString('fr-FR'), '|', t.type);
    }

    console.log('\n===== RÉSUMÉ =====');
    console.log('Formations publiées: 2');
    console.log('Séances d\'entraînement: ' + sessions.length);
    console.log('Les joueurs verront tout dans leur dashboard !');

    await mongoose.disconnect();
    process.exit(0);
});
