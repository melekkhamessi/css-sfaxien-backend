const mongoose = require('mongoose');
const Player = require('./models/Player');

mongoose.connect('mongodb://127.0.0.1:27017/cssfaxien').then(async () => {
    const players = await Player.find({ 
        hasAccount: { $ne: true }, 
        category: { $nin: ['coach', 'staff'] } 
    }).select('+password');

    for (const p of players) {
        const nameParts = p.name.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9 ]/g, '')
            .split(' ').filter(Boolean);
        
        let email = nameParts[nameParts.length - 1] + '@css.tn';
        const existing = await Player.findOne({ email, _id: { $ne: p._id } });
        if (existing) email = nameParts.join('.') + '@css.tn';

        p.email = email;
        p.password = 'joueur123';
        p.hasAccount = true;
        await p.save();
        console.log('OK:', p.name, '->', email);
    }
    console.log('\nDONE:', players.length, 'comptes créés');
    console.log('Mot de passe par défaut: joueur123');
    await mongoose.disconnect();
    process.exit(0);
});
