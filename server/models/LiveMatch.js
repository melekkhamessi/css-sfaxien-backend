const mongoose = require('mongoose');

const liveMatchSchema = new mongoose.Schema({
    matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match' },
    homeTeam: { type: String, required: true },
    awayTeam: { type: String, required: true },
    homeScore: { type: Number, default: 0 },
    awayScore: { type: Number, default: 0 },
    status: { type: String, default: 'not_started', enum: ['not_started', 'first_half', 'half_time', 'second_half', 'extra_time', 'finished'] },
    minute: { type: Number, default: 0 },
    competition: { type: String, default: '' },
    venue: { type: String, default: '' },
    date: { type: String, default: '' },
    time: { type: String, default: '' },
    events: [{
        minute: Number,
        type: { type: String }, // goal, yellow, red, sub, var, pen, own_goal
        player: String,
        assist: String,
        team: String,
        detail: String
    }],
    comments: [{
        minute: Number,
        text: String,
        type: { type: String, default: 'comment' }, // comment, highlight, key_event
        createdAt: { type: Date, default: Date.now }
    }],
    stats: {
        homePossession: { type: Number, default: 50 },
        awayPossession: { type: Number, default: 50 },
        homeShots: { type: Number, default: 0 },
        awayShots: { type: Number, default: 0 },
        homeShotsOnTarget: { type: Number, default: 0 },
        awayShotsOnTarget: { type: Number, default: 0 },
        homeCorners: { type: Number, default: 0 },
        awayCorners: { type: Number, default: 0 },
        homeFouls: { type: Number, default: 0 },
        awayFouls: { type: Number, default: 0 }
    },
    updatedAt: { type: Date, default: Date.now }
});

liveMatchSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('LiveMatch', liveMatchSchema);
