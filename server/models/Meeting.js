const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
    date:   { type: String, required: true },
    home:   { type: String, required: true },
    away:   { type: String, required: true },
    score:  { type: String, default: '' },
    result: { type: String, default: '' } // win, draw, loss
}, { timestamps: true });

module.exports = mongoose.model('Meeting', meetingSchema);
