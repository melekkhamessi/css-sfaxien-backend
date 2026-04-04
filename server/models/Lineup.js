const mongoose = require('mongoose');

const lineupSchema = new mongoose.Schema({
    formation: { type: mongoose.Schema.Types.Mixed, default: [] }
});

module.exports = mongoose.model('Lineup', lineupSchema);
