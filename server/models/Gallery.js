const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
    title:    { type: String, required: true },
    desc:     { type: String, default: '' },
    category: { type: String, default: '' }, // match-photo, training-photo, video, fans, stadium
    type:     { type: String, default: 'photo' },
    layout:   { type: String, default: '' }, // wide, tall, or empty
    date:     { type: String, default: '' },
    duration: { type: String },
    videoUrl: { type: String },
    image:    { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
