const mongoose = require('mongoose');

const matchEventSchema = new mongoose.Schema({
    minute:  { type: Number, required: true },
    type:    { type: String, enum: ['goal', 'yellow', 'red', 'sub', 'pen', 'og', 'var', 'miss'], required: true },
    player:  { type: String, required: true },
    assist:  { type: String, default: '' },
    team:    { type: String, enum: ['home', 'away'], required: true },
    detail:  { type: String, default: '' }
}, { _id: false });

const lineupPlayerSchema = new mongoose.Schema({
    name:   { type: String, required: true },
    number: { type: Number, default: 0 },
    position: { type: String, default: '' },
    isCaptain: { type: Boolean, default: false },
    rating: { type: Number, default: 0 }
}, { _id: false });

const matchStatsSchema = new mongoose.Schema({
    possession:    [Number],
    shots:         [Number],
    shotsOnTarget: [Number],
    corners:       [Number],
    fouls:         [Number],
    offsides:      [Number],
    yellowCards:   [Number],
    redCards:      [Number],
    passes:        [Number],
    passAccuracy:  [Number],
    saves:         [Number]
}, { _id: false });

const cupRoundSchema = new mongoose.Schema({
    round:    { type: String, default: '' },
    homeTeam: { type: String, default: '' },
    awayTeam: { type: String, default: '' },
    homeScore:{ type: String, default: '' },
    awayScore:{ type: String, default: '' },
    played:   { type: Boolean, default: false }
}, { _id: false });

const otherMatchSchema = new mongoose.Schema({
    homeTeam:  { type: String, required: true },
    awayTeam:  { type: String, required: true },
    homeScore: { type: String, default: '0' },
    awayScore: { type: String, default: '0' }
}, { _id: false });

const matchSchema = new mongoose.Schema({
    homeTeam:    { type: String, required: true },
    awayTeam:    { type: String, required: true },
    homeScore:   { type: String, default: '0' },
    awayScore:   { type: String, default: '0' },
    date:        { type: String, required: true },
    time:        { type: String, default: '14:00' },
    competition: { type: String, default: '' },
    venue:       { type: String, default: '' },
    referee:     { type: String, default: '' },
    attendance:  { type: Number, default: 0 },
    isHome:      { type: Boolean, default: true },
    isCup:       { type: Boolean, default: false },
    matchDay:    { type: Number, default: 0 },
    otherMatches: [otherMatchSchema],
    status:      { type: String, enum: ['finished', 'live', 'upcoming'], default: 'finished' },
    events:      [matchEventSchema],
    homeLineup:  [lineupPlayerSchema],
    awayLineup:  [lineupPlayerSchema],
    homeSubs:    [lineupPlayerSchema],
    awaySubs:    [lineupPlayerSchema],
    homeCoach:   { type: String, default: '' },
    awayCoach:   { type: String, default: '' },
    homeFormation: { type: String, default: '' },
    awayFormation: { type: String, default: '' },
    stats:       matchStatsSchema,
    cupBracket:  [cupRoundSchema],
    summary:     { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
