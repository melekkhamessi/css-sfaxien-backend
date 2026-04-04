const mongoose = require('mongoose');

const chatGroupSchema = new mongoose.Schema({
    name: { type: String, required: true, maxlength: 100 },
    image: { type: String, default: '' },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true },
    isDM: { type: Boolean, default: false }
}, { timestamps: true });

chatGroupSchema.index({ members: 1 });

module.exports = mongoose.model('ChatGroup', chatGroupSchema);
