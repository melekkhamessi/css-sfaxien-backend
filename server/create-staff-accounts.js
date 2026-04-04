const mongoose = require('mongoose');
const Player = require('./models/Player');

async function createStaffAccounts() {
    await mongoose.connect('mongodb://127.0.0.1:27017/cssfaxien');
    console.log('MongoDB connecté');

    const staffAccounts = [
        { name: 'Mohamed Kouki', email: 'kouki@css.tn', password: 'coach123' },
        { name: 'Nabil Kouki', email: 'nabil.kouki@css.tn', password: 'staff123' },
        { name: 'Mourad Mechri', email: 'mechri@css.tn', password: 'staff123' },
        { name: 'Sami Trabelsi', email: 'trabelsi@css.tn', password: 'staff123' },
    ];

    for (const acc of staffAccounts) {
        const player = await Player.findOne({ name: acc.name });
        if (!player) {
            console.log(`❌ Joueur "${acc.name}" non trouvé dans la base`);
            continue;
        }
        if (player.hasAccount) {
            console.log(`⚠️ ${acc.name} a déjà un compte (${player.email})`);
            continue;
        }
        player.email = acc.email;
        player.password = acc.password; // Will be hashed by pre-save middleware
        player.hasAccount = true;
        await player.save();
        console.log(`✅ Compte créé : ${acc.name} → ${acc.email}`);
    }

    await mongoose.disconnect();
    console.log('\nTerminé !');
}

createStaffAccounts().catch(err => { console.error(err); process.exit(1); });
