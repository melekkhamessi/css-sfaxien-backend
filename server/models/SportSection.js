const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
    title: { type: String, required: true },
    year:  { type: String, default: '' }
}, { _id: false });

const sportSectionSchema = new mongoose.Schema({
    name:         { type: String, required: true },
    icon:         { type: String, default: 'fa-trophy' },
    image:        { type: String, default: '' },
    description:  { type: String, default: '' },
    founded:      { type: String, default: '' },
    coach:        { type: String, default: '' },
    venue:        { type: String, default: '' },
    achievements: [achievementSchema],
    stats:        { type: Map, of: String, default: {} },
    color:        { type: String, default: '#1a1a1a' },
    active:       { type: Boolean, default: true },
    order:        { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('SportSection', sportSectionSchema);
