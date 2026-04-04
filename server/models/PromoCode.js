const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
    code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
    discount:    { type: Number, required: true, min: 1, max: 100 },
    type:        { type: String, enum: ['percent', 'fixed'], default: 'percent' },
    maxUses:     { type: Number, default: 100 },
    usedCount:   { type: Number, default: 0 },
    minOrder:    { type: Number, default: 0 },
    validFrom:   { type: Date, default: Date.now },
    validUntil:  { type: Date, required: true },
    active:      { type: Boolean, default: true },
    appliesTo:   { type: [String], default: ['ticket', 'product', 'subscription'] }
}, { timestamps: true });

promoCodeSchema.methods.isValid = function() {
    const now = new Date();
    return this.active && this.usedCount < this.maxUses && now >= this.validFrom && now <= this.validUntil;
};

module.exports = mongoose.model('PromoCode', promoCodeSchema);
