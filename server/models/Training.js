const mongoose = require('mongoose');

const trainingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['terrain', 'salle', 'tactique', 'recuperation'], default: 'terrain' },
    // terrain = field training, salle = gym, tactique = tactical session, recuperation = recovery
    date: { type: Date, required: true },
    startTime: { type: String, default: '09:00' },  // HH:mm
    endTime: { type: String, default: '11:00' },
    location: { type: String, default: '' },         // "Stade Taïeb Mhiri", "Salle de musculation", etc.
    description: { type: String, default: '' },
    exercises: [{
        name: { type: String },
        duration: { type: String },       // "20 min", "3x15"
        category: { type: String },       // "échauffement", "technique", "physique", "tactique", "musculation", "cardio", "étirements"
        intensity: { type: String, enum: ['faible', 'modéré', 'intense', 'max'], default: 'modéré' }
    }],
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],  // empty = all players
    targetCategory: { type: String, enum: ['all', 'goalkeepers', 'defenders', 'midfielders', 'attackers'], default: 'all' },
    intensity: { type: String, enum: ['légère', 'modérée', 'intense', 'double'], default: 'modérée' },
    status: { type: String, enum: ['planifié', 'en-cours', 'terminé', 'annulé'], default: 'planifié' },
    attendance: [{
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        playerName: { type: String },
        present: { type: Boolean, default: false },
        note: { type: String }       // coach notes for player
    }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    createdByName: { type: String }
}, { timestamps: true });

trainingSchema.index({ date: -1, type: 1, status: 1 });

module.exports = mongoose.model('Training', trainingSchema);
