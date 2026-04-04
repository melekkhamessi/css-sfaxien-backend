const mongoose = require('mongoose');

const legendSchema = new mongoose.Schema({
    name:     { type: String, required: true },
    position: { type: String, default: '' },
    era:      { type: String, default: '' },
    number:   { type: String, default: '' },
    desc:     { type: String, default: '' },
    image:    { type: String, default: '' },
    stats:    { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('Legend', legendSchema);
