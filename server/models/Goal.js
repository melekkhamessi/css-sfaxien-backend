const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    player: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    title: { type: String, required: true },
    target: { type: Number, required: true },
    current: { type: Number, default: 0 },
    unit: { type: String, default: '' },
    category: { type: String, enum: ['buts', 'passes', 'matchs', 'entrainement', 'physique', 'autre'], default: 'autre' },
    deadline: { type: Date },
    completed: { type: Boolean, default: false }
}, { timestamps: true });

goalSchema.index({ player: 1 });

module.exports = mongoose.model('Goal', goalSchema);
