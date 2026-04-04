const mongoose = require('mongoose');

const playerNotificationSchema = new mongoose.Schema({
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    type: { type: String, enum: ['training', 'formation', 'message', 'injury', 'goal', 'general'], required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    read: { type: Boolean, default: false },
    link: { type: String, default: '' },
    icon: { type: String, default: 'fas fa-bell' },
    color: { type: String, default: '#3498db' }
}, { timestamps: true });

playerNotificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('PlayerNotification', playerNotificationSchema);
