const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['donation', 'ticket', 'subscription', 'order'],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false },
    reference: { type: String, default: '' },
    amount: { type: Number, default: 0 },
    userName: { type: String, default: '' },
    userEmail: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
