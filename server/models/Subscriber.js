const mongoose = require('mongoose');

const subscriberSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, default: '' },
    active: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
    categories: { type: [String], default: ['all'] } // all, matchs, news, boutique
});

module.exports = mongoose.model('Subscriber', subscriberSchema);
