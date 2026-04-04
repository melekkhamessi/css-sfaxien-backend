const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    type:     { type: String, enum: ['ticket', 'product', 'subscription', 'donation'], required: true },
    productId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    label:    { type: String, required: true },
    details:  { type: String, default: '' },
    quantity: { type: Number, default: 1 },
    unitPrice:{ type: Number, required: true },
    image:    { type: String, default: '' },
    size:     { type: String, default: '' },
    customization: {
        playerName:  { type: String, default: '' },
        playerNumber:{ type: String, default: '' },
        noSponsor:   { type: Boolean, default: false }
    }
}, { _id: false });

const shippingSchema = new mongoose.Schema({
    fullName: { type: String, default: '' },
    address:  { type: String, default: '' },
    city:     { type: String, default: '' },
    zip:      { type: String, default: '' },
    phone:    { type: String, default: '' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items:      [orderItemSchema],
    subtotal:   { type: Number, required: true },
    discount:   { type: Number, default: 0 },
    promoCode:  { type: String, default: '' },
    shipping:   shippingSchema,
    shippingCost: { type: Number, default: 0 },
    total:      { type: Number, required: true },
    status:     { type: String, enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], default: 'pending' },
    paymentMethod: { type: String, enum: ['card', 'cash', 'transfer', 'flouci'], default: 'card' },
    paymentStatus: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    flouciPaymentId: { type: String, default: '' },
    reference:  { type: String, unique: true }
}, { timestamps: true });

orderSchema.pre('save', function(next) {
    if (!this.reference) {
        this.reference = 'CSS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);
