const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    price:       { type: Number, required: true },
    description: { type: String, default: '' },
    image:       { type: String, default: '' },
    badge:       { type: String, default: '' },
    category:    { type: String, enum: ['maillots', 'vetements', 'equipements', 'accessoires'], default: 'accessoires' },
    sizes:       [{ type: String }],
    customizable:{ type: Boolean, default: false },
    customPrice: { type: Number, default: 0 },
    stock:       { type: Number, default: 50 },
    active:      { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
