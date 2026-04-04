const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    channel: { type: String, required: true }, // 'general', 'coaches', 'team', or private channel id
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    senderName: { type: String, required: true },
    senderImage: { type: String, default: '' },
    senderCategory: { type: String, default: '' },
    text: { type: String, default: '', maxlength: 2000 },
    attachments: [{
        type: { type: String, enum: ['image', 'video', 'file'], default: 'file' },
        url: { type: String, required: true },
        name: { type: String, default: '' },
        size: { type: Number, default: 0 }
    }],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    pinned: { type: Boolean, default: false }
}, { timestamps: true });

messageSchema.index({ channel: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
