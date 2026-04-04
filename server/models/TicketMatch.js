const mongoose = require('mongoose');

const ticketMatchSchema = new mongoose.Schema({
    home:      { type: String, required: true },
    away:      { type: String, required: true },
    date:      { type: String, required: true },
    time:      { type: String, default: '' },
    comp:      { type: String, default: '' },
    venue:     { type: String, default: '' },
    available: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TicketMatch', ticketMatchSchema);
