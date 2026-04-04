const mongoose = require('mongoose');

const socialMemberSchema = new mongoose.Schema({
    memberNumber: { type: String, unique: true },
    firstName:    { type: String, required: true, trim: true },
    lastName:     { type: String, required: true, trim: true },
    cin:          { type: String, required: true, unique: true, trim: true },
    email:        { type: String, default: '', lowercase: true, trim: true },
    phone:        { type: String, default: '' },
    address:      { type: String, default: '' },
    birthDate:    { type: String, default: '' },
    plan:         { type: String, default: '' },
    season:       { type: String, default: 'Saison 2025-2026' },
    status:       { type: String, enum: ['active', 'expired', 'suspended'], default: 'active' },
    paidAmount:   { type: Number, default: 0 },
    orderRef:     { type: String, default: '' },
    user:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    photo:        { type: String, default: '' }
}, { timestamps: true });

// Auto-generate member number before save
socialMemberSchema.pre('save', function(next) {
    if (!this.memberNumber) {
        const year = new Date().getFullYear().toString().slice(-2);
        const seq = Date.now().toString(36).toUpperCase().slice(-5);
        this.memberNumber = `CSS-${year}-${seq}`;
    }
    next();
});

socialMemberSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

module.exports = mongoose.model('SocialMember', socialMemberSchema);
