const mongoose = require('mongoose');

const fixtureSchema = new mongoose.Schema({
    homeTeam:    { type: String, required: true },
    awayTeam:    { type: String, required: true },
    date:        { type: String, required: true },
    time:        { type: String, default: '' },
    competition: { type: String, default: '' },
    venue:       { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Fixture', fixtureSchema);
