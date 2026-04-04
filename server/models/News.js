const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title:    { type: String, required: true },
    category: { type: String, default: '' },
    date:     { type: String, required: true },
    content:  { type: String, default: '' },
    image:    { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('News', newsSchema);
