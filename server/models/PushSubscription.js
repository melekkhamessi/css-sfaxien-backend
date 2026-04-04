const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
    endpoint: { type: String, required: true, unique: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    categories: { type: [String], default: ['all'] }, // all, goals, matchStart, news
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
