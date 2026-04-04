const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
    year:  { type: String, required: true },
    icon:  { type: String, default: 'fa-trophy' },
    title: { type: String, required: true },
    desc:  { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Timeline', timelineSchema);
