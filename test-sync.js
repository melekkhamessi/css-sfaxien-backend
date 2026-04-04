require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fetch = require('node-fetch');

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/cssfaxien');
    
    // Reset admin password
    const hash = await bcrypt.hash('admin123', 12);
    await mongoose.connection.db.collection('admins').updateOne(
        { username: 'admin' },
        { $set: { password: hash } }
    );
    console.log('Admin password reset OK');
    
    // Login
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    console.log('Login status:', loginRes.status);
    
    if (!loginData.token) {
        console.error('Login failed:', loginData);
        process.exit(1);
    }
    
    console.log('Token received, starting sync...');
    
    // Sync all with season 2024
    const syncRes = await fetch('http://localhost:3000/api/football-api/sync-all', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer ' + loginData.token,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ season: 2024 })
    });
    const syncData = await syncRes.json();
    console.log('Sync result:', JSON.stringify(syncData, null, 2));
    
    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
