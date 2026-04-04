const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const playerSchema = new mongoose.Schema({
    category:    { type: String, required: true }, // goalkeepers, defenders, midfielders, attackers, coach, staff
    name:        { type: String, required: true },
    number:      { type: Number },
    nationality: { type: String, default: '' },
    age:         { type: Number },
    value:       { type: String, default: '' },
    image:       { type: String, default: '' },
    rating:      { type: Number, default: 0, min: 0, max: 10 },
    // Auth fields (optional - for player portal)
    email:       { type: String, default: '', lowercase: true, trim: true },
    password:    { type: String, default: '', select: false },
    hasAccount:  { type: Boolean, default: false },
    lastLogin:   { type: Date },
    lastSeen:    { type: Date },
    // Staff fields
    role:        { type: String },
    icon:        { type: String },
    // Injury tracking
    fitnessStatus: { type: String, enum: ['apte', 'blessé', 'récupération', 'suspendu'], default: 'apte' },
    injury:      { type: String, default: '' },
    injuryDate:  { type: Date },
    expectedReturn: { type: Date },
    // Player stats (flexible)
    stats:       { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

playerSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

playerSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Player', playerSchema);
