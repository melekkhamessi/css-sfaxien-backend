const mongoose = require('mongoose');

const formationSchema = new mongoose.Schema({
    name: { type: String, required: true },           // "Formation vs EST", "Séance 15 Mars"
    formation: { type: String, default: '4-3-3' },    // "4-3-3", "4-4-2", "3-5-2", etc.
    matchDate: { type: String },
    opponent: { type: String },
    competition: { type: String },
    positions: [{
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        playerName: { type: String },
        playerNumber: { type: Number },
        playerImage: { type: String },
        x: { type: Number },  // 0-100 horizontal position on pitch
        y: { type: Number },  // 0-100 vertical position on pitch
        role: { type: String } // "GK", "CB", "RB", "LB", "CM", "CAM", "RW", "LW", "ST"...
    }],
    substitutes: [{
        playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
        playerName: { type: String },
        playerNumber: { type: Number }
    }],
    notes: { type: String, default: '' },             // Tactical notes
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    createdByName: { type: String },
    published: { type: Boolean, default: false },      // visible to players when true
    status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' }
}, { timestamps: true });

formationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Formation', formationSchema);
