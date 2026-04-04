const mongoose = require('mongoose');

const stadiumZoneSchema = new mongoose.Schema({
    name:      { type: String, required: true },
    price:     { type: Number, default: 0 },
    available: { type: Number, default: 0 },
    total:     { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('StadiumZone', stadiumZoneSchema);
