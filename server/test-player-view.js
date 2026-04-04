const http = require('http');

function request(method, path, token, body) {
    return new Promise((resolve, reject) => {
        const data = body ? JSON.stringify(body) : '';
        const opts = {
            hostname: 'localhost', port: 3000, path,
            method, headers: { 'Content-Type': 'application/json' }
        };
        if (token) opts.headers['Authorization'] = 'Bearer ' + token;
        if (body) opts.headers['Content-Length'] = Buffer.byteLength(data);
        const req = http.request(opts, (res) => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => resolve(JSON.parse(d)));
        });
        if (body) req.write(data);
        req.end();
    });
}

async function test() {
    // Login as player (Onana)
    const login = await request('POST', '/api/player/login', null, { email: 'onana@css.tn', password: 'joueur123' });
    console.log('LOGIN:', login.player ? login.player.name : 'FAILED');
    const token = login.token;

    // Check formations
    const formations = await request('GET', '/api/player/formations', token);
    console.log('\n===== FORMATIONS =====');
    console.log('Total:', formations.length);
    formations.forEach(f => {
        console.log(`  ${f.name} (${f.formation}) | status: ${f.status} | positions: ${f.positions?.length || 0} | subs: ${f.substitutes?.length || 0}`);
        (f.positions || []).forEach(p => console.log(`    ${p.role}: #${p.playerNumber} ${p.playerName} [${p.x}%, ${p.y}%] img: ${p.playerImage ? 'YES' : 'NO'}`));
    });

    // Check trainings
    const trainings = await request('GET', '/api/player/trainings', token);
    console.log('\n===== ENTRAÎNEMENTS =====');
    console.log('Total:', trainings.length);
    trainings.forEach(t => {
        const d = new Date(t.date);
        console.log(`  ${t.title} | ${d.toLocaleDateString('fr-FR')} | ${t.type} | ${t.startTime}-${t.endTime} | exercices: ${t.exercises?.length || 0}`);
        (t.exercises || []).forEach(ex => console.log(`    - ${ex.name} (${ex.duration}) [${ex.category}] ${ex.intensity}`));
    });
}

test().catch(console.error);
