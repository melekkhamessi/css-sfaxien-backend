const m = require('mongoose');
const Player = require('./models/Player');
m.connect('mongodb://127.0.0.1:27017/cssfaxien').then(async () => {
    const ps = await Player.find({ category: { $nin: ['coach', 'staff'] } }).select('name number').lean();
    ps.forEach(p => console.log('#' + p.number, p.name));
    m.disconnect();
});
