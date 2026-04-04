const mongoose = require('mongoose');

const trophySchema = new mongoose.Schema({
    name:  { type: String, required: true },
    icon:  { type: String, default: 'fa-trophy' },
    count: { type: Number, default: 1 },
    years: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('Trophy', trophySchema);
