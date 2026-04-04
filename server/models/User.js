const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstName:  { type: String, required: true, trim: true },
    lastName:   { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, default: '' },
    phone:      { type: String, default: '' },
    address:    { type: String, default: '' },
    city:       { type: String, default: 'Sfax' },
    avatar:     { type: String, default: '' },
    loyaltyPoints: { type: Number, default: 0 },
    membership: { type: String, enum: ['standard', 'silver', 'gold', 'platinum'], default: 'standard' },
    provider:   { type: String, enum: ['local', 'google', 'facebook'], default: 'local' },
    providerId: { type: String, default: '' }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password') || !this.password) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!this.password) return false;
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getFullName = function() {
    return `${this.firstName} ${this.lastName}`;
};

module.exports = mongoose.model('User', userSchema);
