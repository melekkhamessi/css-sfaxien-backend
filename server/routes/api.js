const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const OpenAI = require('openai');

// Models
const Match = require('../models/Match');
const Fixture = require('../models/Fixture');
const Standing = require('../models/Standing');
const SocialMember = require('../models/SocialMember');
const Product = require('../models/Product');
const News = require('../models/News');
const Player = require('../models/Player');
const Gallery = require('../models/Gallery');
const Timeline = require('../models/Timeline');
const Trophy = require('../models/Trophy');
const Legend = require('../models/Legend');
const TicketMatch = require('../models/TicketMatch');
const StadiumZone = require('../models/StadiumZone');
const SubPlan = require('../models/SubPlan');
const Meeting = require('../models/Meeting');
const Donor = require('../models/Donor');
const PromoCode = require('../models/PromoCode');
const SportSection = require('../models/SportSection');
const Notification = require('../models/Notification');
const Order = require('../models/Order');
const User = require('../models/User');
const Subscriber = require('../models/Subscriber');
const LiveMatch = require('../models/LiveMatch');
const PushSubscription = require('../models/PushSubscription');
const Settings = require('../models/Settings');
const footballApi = require('../services/footballApi');
const webpush = require('web-push');

// VAPID keys for push notifications
const VAPID_PUBLIC = 'BNMhE4G_YqOzMD9RbBj82xknk5ImuPaUIfarBqpn4HFE_hMeh073G0Yg6P52OVC4DaqcdL5zWU95y-BxgWeRTiE';
const VAPID_PRIVATE = '2AKHIwpBpOs4toJrHpvyvy99-_4uOlLSL4gsLJDunWw';
webpush.setVapidDetails('mailto:contact@cssfaxien.tn', VAPID_PUBLIC, VAPID_PRIVATE);

const router = express.Router();

// Helper: generate CRUD routes for a model
function crudRoutes(path, Model, sortFn) {
    // GET all
    router.get(path, async (req, res) => {
        try {
            let query = Model.find();
            if (sortFn) query = query.sort(sortFn);
            const docs = await query.lean();
            // Map _id to id for frontend compatibility
            const result = docs.map(d => ({ ...d, id: d._id.toString() }));
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET one
    router.get(`${path}/:id`, async (req, res) => {
        try {
            const doc = await Model.findById(req.params.id).lean();
            if (!doc) return res.status(404).json({ error: 'Non trouvé' });
            res.json({ ...doc, id: doc._id.toString() });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST create (protected)
    router.post(path, authMiddleware, async (req, res) => {
        try {
            const doc = new Model(req.body);
            await doc.save();
            const obj = doc.toObject();
            res.status(201).json({ ...obj, id: obj._id.toString() });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // PUT update (protected)
    router.put(`${path}/:id`, authMiddleware, async (req, res) => {
        try {
            const doc = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).lean();
            if (!doc) return res.status(404).json({ error: 'Non trouvé' });
            res.json({ ...doc, id: doc._id.toString() });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    });

    // DELETE (protected)
    router.delete(`${path}/:id`, authMiddleware, async (req, res) => {
        try {
            const doc = await Model.findByIdAndDelete(req.params.id);
            if (!doc) return res.status(404).json({ error: 'Non trouvé' });
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });
}

// ===== Register all CRUD routes =====
crudRoutes('/matches', Match, { date: -1 });
crudRoutes('/fixtures', Fixture, { date: 1 });
crudRoutes('/standings', Standing, { points: -1 });

// ===== Standings: Recalculate from all finished matches =====
router.post('/standings/recalculate', authMiddleware, async (req, res) => {
    try {
        const matches = await Match.find({ status: 'finished' }).lean();
        const teamStats = {};

        for (const match of matches) {
            const hs = parseInt(match.homeScore) || 0;
            const as = parseInt(match.awayScore) || 0;
            const home = match.homeTeam.trim();
            const away = match.awayTeam.trim();

            if (!teamStats[home]) teamStats[home] = { played:0, won:0, drawn:0, lost:0, goalsFor:0, goalsAgainst:0, form:[] };
            if (!teamStats[away]) teamStats[away] = { played:0, won:0, drawn:0, lost:0, goalsFor:0, goalsAgainst:0, form:[] };

            teamStats[home].played++; teamStats[home].goalsFor += hs; teamStats[home].goalsAgainst += as;
            teamStats[away].played++; teamStats[away].goalsFor += as; teamStats[away].goalsAgainst += hs;

            if (hs > as) {
                teamStats[home].won++; teamStats[away].lost++;
                teamStats[home].form.push('W'); teamStats[away].form.push('L');
            } else if (hs < as) {
                teamStats[home].lost++; teamStats[away].won++;
                teamStats[home].form.push('L'); teamStats[away].form.push('W');
            } else {
                teamStats[home].drawn++; teamStats[away].drawn++;
                teamStats[home].form.push('D'); teamStats[away].form.push('D');
            }
        }

        // Update or create standings for teams from matches
        for (const [name, stats] of Object.entries(teamStats)) {
            const points = stats.won * 3 + stats.drawn;
            const form = stats.form.slice(-5); // last 5 results
            await Standing.findOneAndUpdate(
                { name },
                { ...stats, points, form },
                { upsert: true, new: true, runValidators: true }
            );
        }

        res.json({ success: true, teamsUpdated: Object.keys(teamStats).length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== Standings: Auto-update after match save =====
router.post('/standings/update-from-match', authMiddleware, async (req, res) => {
    try {
        const { homeTeam, awayTeam } = req.body;
        if (!homeTeam && !awayTeam) return res.json({ success: true });

        // Recalculate stats for specific teams from ALL their matches
        const teamsToUpdate = [homeTeam, awayTeam].filter(Boolean).map(t => t.trim());

        for (const teamName of teamsToUpdate) {
            const matches = await Match.find({
                status: 'finished',
                $or: [{ homeTeam: teamName }, { awayTeam: teamName }]
            }).sort({ date: 1 }).lean();

            let stats = { played:0, won:0, drawn:0, lost:0, goalsFor:0, goalsAgainst:0, form:[] };

            for (const m of matches) {
                const hs = parseInt(m.homeScore) || 0;
                const as = parseInt(m.awayScore) || 0;
                const isHome = m.homeTeam.trim() === teamName;
                const gf = isHome ? hs : as;
                const ga = isHome ? as : hs;

                stats.played++;
                stats.goalsFor += gf;
                stats.goalsAgainst += ga;

                if (gf > ga) { stats.won++; stats.form.push('W'); }
                else if (gf < ga) { stats.lost++; stats.form.push('L'); }
                else { stats.drawn++; stats.form.push('D'); }
            }

            const points = stats.won * 3 + stats.drawn;
            const form = stats.form.slice(-5);

            await Standing.findOneAndUpdate(
                { name: teamName },
                { ...stats, points, form },
                { upsert: true, new: true, runValidators: true }
            );
        }

        res.json({ success: true, teamsUpdated: teamsToUpdate });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== Standings: Import from API-Football =====
router.post('/standings/import-api', authMiddleware, async (req, res) => {
    const https = require('https');
    const { apiKey, league, season } = req.body;

    if (!apiKey) return res.status(400).json({ error: 'Clé API requise' });

    const leagueId = league || 202; // 202 = Tunisian Ligue 1
    const seasonYear = season || new Date().getFullYear();

    const options = {
        hostname: 'v3.football.api-sports.io',
        path: `/standings?league=${leagueId}&season=${seasonYear}`,
        method: 'GET',
        headers: { 'x-apisports-key': apiKey }
    };

    const apiReq = https.request(options, (apiRes) => {
        let data = '';
        apiRes.on('data', chunk => { data += chunk; });
        apiRes.on('end', async () => {
            try {
                const result = JSON.parse(data);
                if (result.errors && Object.keys(result.errors).length > 0) {
                    return res.status(400).json({ error: 'Erreur API: ' + JSON.stringify(result.errors) });
                }

                const standings = result.response?.[0]?.league?.standings?.[0];
                if (!standings || standings.length === 0) {
                    return res.status(404).json({ error: 'Aucun classement trouvé pour cette ligue/saison' });
                }

                let imported = 0;
                for (const team of standings) {
                    const teamName = team.team.name;
                    const all = team.all;
                    const form = (team.form || '').split('').slice(-5).map(c => c === 'W' ? 'W' : c === 'D' ? 'D' : 'L');

                    // Check if team is our team (CS Sfaxien / Club Sportif Sfaxien)
                    const isCSS = /sfax/i.test(teamName);

                    await Standing.findOneAndUpdate(
                        { name: teamName },
                        {
                            name: teamName,
                            isOurTeam: isCSS,
                            played: all.played || 0,
                            won: all.win || 0,
                            drawn: all.draw || 0,
                            lost: all.lose || 0,
                            goalsFor: all.goals?.for || 0,
                            goalsAgainst: all.goals?.against || 0,
                            points: team.points || 0,
                            form
                        },
                        { upsert: true, new: true, runValidators: true }
                    );
                    imported++;
                }

                res.json({ success: true, imported });
            } catch (parseErr) {
                res.status(500).json({ error: 'Erreur parsing: ' + parseErr.message });
            }
        });
    });

    apiReq.on('error', (err) => {
        res.status(500).json({ error: 'Erreur réseau: ' + err.message });
    });

    apiReq.end();
});
crudRoutes('/products', Product);
crudRoutes('/news', News, { date: -1 });
crudRoutes('/players', Player);

// ===== Player Stats: Recalculate from match events =====
router.post('/players/recalculate-stats', authMiddleware, async (req, res) => {
    try {
        const matches = await Match.find({ status: 'finished' }).lean();
        const players = await Player.find({ category: { $nin: ['coach', 'staff'] } }).lean();

        // Build player stats from match events
        const playerStats = {};

        for (const player of players) {
            const pName = player.name.trim();
            playerStats[pName] = { matchs: 0, buts: 0, passes: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, arrets: 0, tacles: 0, tirs: 0 };
        }

        for (const match of matches) {
            const events = match.events || [];
            // Track which players appeared in this match
            const playersInMatch = new Set();

            for (const ev of events) {
                const pName = (ev.player || '').trim();
                const aName = (ev.assist || '').trim();

                if (!pName) continue;
                if (!playerStats[pName]) playerStats[pName] = { matchs: 0, buts: 0, passes: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, arrets: 0, tacles: 0, tirs: 0 };

                playersInMatch.add(pName);
                if (aName) {
                    if (!playerStats[aName]) playerStats[aName] = { matchs: 0, buts: 0, passes: 0, yellowCards: 0, redCards: 0, cleanSheets: 0, arrets: 0, tacles: 0, tirs: 0 };
                    playersInMatch.add(aName);
                }

                switch (ev.type) {
                    case 'goal': case 'pen':
                        playerStats[pName].buts++;
                        if (aName && playerStats[aName]) playerStats[aName].passes++;
                        break;
                    case 'yellow':
                        playerStats[pName].yellowCards++;
                        break;
                    case 'red':
                        playerStats[pName].redCards++;
                        break;
                }
            }

            // Count match appearances
            for (const pName of playersInMatch) {
                if (playerStats[pName]) playerStats[pName].matchs++;
            }
        }

        // Update players in DB
        let updated = 0;
        for (const player of players) {
            const pName = player.name.trim();
            const calcStats = playerStats[pName];
            if (!calcStats) continue;

            const existingStats = player.stats || {};
            // Merge: auto-calculated fields override, but keep manual fields
            const mergedStats = {
                ...existingStats,
                matchs: calcStats.matchs,
                buts: calcStats.buts,
                passes: calcStats.passes,
                yellowCards: calcStats.yellowCards,
                redCards: calcStats.redCards
            };

            await Player.findByIdAndUpdate(player._id, { stats: mergedStats });
            updated++;
        }

        res.json({ success: true, playersUpdated: updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== Player Stats: Update specific players from match events =====
router.post('/players/update-from-match', authMiddleware, async (req, res) => {
    try {
        const { events } = req.body;
        if (!events || events.length === 0) return res.json({ success: true, updated: 0 });

        // Collect unique player names from events
        const playerNames = new Set();
        for (const ev of events) {
            if (ev.player) playerNames.add(ev.player.trim());
            if (ev.assist) playerNames.add(ev.assist.trim());
        }

        // For each player, recalculate ALL their stats from ALL their matches
        const allMatches = await Match.find({ status: 'finished' }).lean();
        let updated = 0;

        for (const pName of playerNames) {
            const player = await Player.findOne({ name: pName }).lean();
            if (!player) continue;

            let matchCount = 0, goals = 0, assists = 0, yellows = 0, reds = 0;

            for (const match of allMatches) {
                const mEvents = match.events || [];
                let inMatch = false;

                for (const ev of mEvents) {
                    const eName = (ev.player || '').trim();
                    const aName = (ev.assist || '').trim();

                    if (eName === pName || aName === pName) inMatch = true;

                    if (eName === pName) {
                        if (ev.type === 'goal' || ev.type === 'pen') goals++;
                        if (ev.type === 'yellow') yellows++;
                        if (ev.type === 'red') reds++;
                    }
                    if (aName === pName && (ev.type === 'goal' || ev.type === 'pen')) assists++;
                }

                if (inMatch) matchCount++;
            }

            const existingStats = player.stats || {};
            const mergedStats = {
                ...existingStats,
                matchs: matchCount,
                buts: goals,
                passes: assists,
                yellowCards: yellows,
                redCards: reds
            };

            await Player.findByIdAndUpdate(player._id, { stats: mergedStats });
            updated++;
        }

        res.json({ success: true, updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
crudRoutes('/gallery', Gallery, { date: -1 });
crudRoutes('/timeline', Timeline, { year: 1 });
crudRoutes('/trophies', Trophy);
crudRoutes('/legends', Legend);
crudRoutes('/ticketMatches', TicketMatch);
crudRoutes('/stadiumZones', StadiumZone);
crudRoutes('/subPlans', SubPlan);
crudRoutes('/meetings', Meeting);
crudRoutes('/donors', Donor);
crudRoutes('/promoCodes', PromoCode);
crudRoutes('/sportSections', SportSection, { order: 1 });

// ===== Special: lineup (stored as a single document) =====
const Lineup = require('../models/Lineup');

router.get('/lineup', async (req, res) => {
    try {
        const doc = await Lineup.findOne().lean();
        res.json(doc ? doc.formation : []);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/lineup', authMiddleware, async (req, res) => {
    try {
        let doc = await Lineup.findOne();
        if (doc) {
            doc.formation = req.body.formation || req.body;
            await doc.save();
        } else {
            doc = new Lineup({ formation: req.body.formation || req.body });
            await doc.save();
        }
        res.json(doc.formation);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// ===== Notifications (admin) =====
router.get('/notifications', authMiddleware, async (req, res) => {
    try {
        const docs = await Notification.find().sort({ createdAt: -1 }).limit(100).lean();
        const result = docs.map(d => ({ ...d, id: d._id.toString() }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/notifications/unread-count', authMiddleware, async (req, res) => {
    try {
        const count = await Notification.countDocuments({ read: false });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/notifications/:id/read', authMiddleware, async (req, res) => {
    try {
        const doc = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { new: true }).lean();
        if (!doc) return res.status(404).json({ error: 'Non trouvé' });
        res.json({ ...doc, id: doc._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/notifications/read-all', authMiddleware, async (req, res) => {
    try {
        await Notification.updateMany({ read: false }, { read: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/notifications/:id', authMiddleware, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== FLOUCI PAYMENT INTEGRATION =====
const FLOUCI_APP_TOKEN = process.env.FLOUCI_APP_TOKEN || '';
const FLOUCI_APP_SECRET = process.env.FLOUCI_APP_SECRET || '';
const FLOUCI_TEST_MODE = !FLOUCI_APP_TOKEN;

async function flouciRequest(url, options = {}) {
    const https = require('https');
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { resolve({ raw: data }); } });
        });
        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

// POST /payment/initiate — Create pending order + get Flouci payment link
router.post('/payment/initiate', async (req, res) => {
    try {
        const { type, items, shipping, buyerName, buyerEmail, buyerPhone, buyerAddress,
                matchLabel, matchDate, zone, quantity, unitPrice,
                planName, planPrice, fullName, cin, email, phone, address, birthDate,
                donorName, donorEmail, donorPhone, donorAddress, amount, donType, anonymous, message,
                promoCode, userId } = req.body;

        let order;
        let total = 0;
        let reference = '';

        if (type === 'ticket') {
            if (!matchLabel || !zone || !quantity || !unitPrice || !buyerName) {
                return res.status(400).json({ error: 'Informations manquantes' });
            }
            reference = 'CSS-' + Date.now().toString(36).toUpperCase();
            total = unitPrice * quantity;
            order = new Order({
                items: [{ type: 'ticket', label: matchLabel, details: `Zone: ${zone} | ${matchDate || ''}`, quantity, unitPrice }],
                subtotal: total, total, paymentMethod: 'flouci', paymentStatus: 'pending',
                shipping: { fullName: buyerName, address: buyerAddress || '', phone: buyerPhone || '' },
                reference
            });
        } else if (type === 'donation') {
            if (!amount || amount <= 0) return res.status(400).json({ error: 'Montant invalide' });
            reference = 'DON-' + Date.now().toString(36).toUpperCase();
            total = amount;
            const displayName = anonymous ? 'Donateur Anonyme' : (donorName || 'Anonyme');
            order = new Order({
                items: [{ type: 'donation', label: `Don ${donType === 'mensuel' ? 'mensuel' : 'unique'}`, details: message || '', quantity: 1, unitPrice: amount }],
                subtotal: total, total, paymentMethod: 'flouci', paymentStatus: 'pending',
                shipping: { fullName: displayName, address: donorAddress || '', phone: donorPhone || '' },
                reference
            });
        } else if (type === 'subscription') {
            if (!planName || !planPrice || !fullName) return res.status(400).json({ error: 'Informations manquantes' });
            if (!cin || !cin.trim()) return res.status(400).json({ error: 'Le numéro CIN est obligatoire' });
            // Check CIN uniqueness
            const existingMember = await SocialMember.findOne({ cin: cin.trim(), status: 'active' });
            if (existingMember) return res.status(409).json({ error: `Ce CIN est déjà utilisé par le membre ${existingMember.memberNumber}` });
            reference = 'ABN-' + Date.now().toString(36).toUpperCase();
            total = planPrice;
            order = new Order({
                items: [{ type: 'subscription', label: `Abonnement ${planName}`, details: `Saison 2025-2026 | CIN: ${cin || '—'}`, quantity: 1, unitPrice: planPrice }],
                subtotal: total, total, paymentMethod: 'flouci', paymentStatus: 'pending',
                shipping: { fullName, address: address || '', phone: phone || '' },
                reference
            });
        } else if (type === 'boutique') {
            if (!items || !items.length) return res.status(400).json({ error: 'Panier vide' });
            let subtotal = 0;
            const orderItems = items.map(item => {
                subtotal += (item.unitPrice || 0) * (item.quantity || 1);
                return { type: 'product', productId: item.productId, label: item.label, details: item.details || '',
                         quantity: item.quantity || 1, unitPrice: item.unitPrice || 0, image: item.image || '',
                         size: item.size || '', customization: item.customization || {} };
            });
            let discount = 0;
            if (promoCode) {
                const promo = await PromoCode.findOne({ code: promoCode.toUpperCase(), active: true });
                if (promo && promo.isValid && promo.isValid() && subtotal >= promo.minOrder) {
                    discount = promo.type === 'percent' ? Math.round(subtotal * promo.discount / 100) : Math.min(promo.discount, subtotal);
                    promo.usedCount += 1; await promo.save();
                }
            }
            const shippingCost = 7;
            total = Math.max(0, subtotal - discount + shippingCost);
            reference = 'CSS-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
            order = new Order({
                user: userId || undefined, items: orderItems, subtotal, discount, promoCode: promoCode || '',
                shipping: shipping || undefined, shippingCost, total,
                paymentMethod: 'flouci', paymentStatus: 'pending', reference
            });
        } else {
            return res.status(400).json({ error: 'Type de paiement invalide' });
        }

        await order.save();

        // Flouci test mode: simulate payment link
        if (FLOUCI_TEST_MODE) {
            const testPaymentId = 'test_' + Date.now();
            order.flouciPaymentId = testPaymentId;
            await order.save();
            return res.json({
                success: true, orderId: order._id, reference: order.reference,
                paymentUrl: `/payment-success.html?payment_id=${testPaymentId}&mode=test`,
                paymentId: testPaymentId, testMode: true
            });
        }

        // Real Flouci API
        const baseUrl = req.protocol + '://' + req.get('host');
        const body = JSON.stringify({
            app_token: FLOUCI_APP_TOKEN, app_secret: FLOUCI_APP_SECRET,
            amount: Math.round(total * 1000),
            accept_card: true, session_timeout_secs: 1200,
            success_link: `${baseUrl}/payment-success.html?ref=${reference}`,
            fail_link: `${baseUrl}/payment-fail.html?ref=${reference}`,
            developer_tracking_id: reference
        });

        const flouciRes = await flouciRequest('https://developers.flouci.com/api/generate_payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
            body
        });

        if (flouciRes.result && flouciRes.result.success) {
            order.flouciPaymentId = flouciRes.result.payment_id;
            await order.save();
            return res.json({
                success: true, orderId: order._id, reference: order.reference,
                paymentUrl: flouciRes.result.link, paymentId: flouciRes.result.payment_id
            });
        } else {
            order.paymentStatus = 'failed'; await order.save();
            return res.status(500).json({ error: 'Erreur Flouci', details: flouciRes });
        }
    } catch (err) {
        console.error('Payment initiation error:', err);
        res.status(500).json({ error: 'Erreur lors de l\'initiation du paiement' });
    }
});

// POST /payment/verify — Verify Flouci payment
router.post('/payment/verify', async (req, res) => {
    try {
        const { paymentId } = req.body;
        if (!paymentId) return res.status(400).json({ error: 'ID de paiement manquant' });

        const order = await Order.findOne({ flouciPaymentId: paymentId });
        if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

        if (paymentId.startsWith('test_')) {
            order.paymentStatus = 'completed'; order.status = 'confirmed';
            await order.save();
            await createPaymentNotification(order);
            return res.json({ success: true, status: 'completed', order: { reference: order.reference, total: order.total, items: order.items, shipping: order.shipping } });
        }

        const flouciRes = await flouciRequest(`https://developers.flouci.com/api/verify_payment/${paymentId}`, {
            method: 'GET', headers: { 'apppublic': FLOUCI_APP_TOKEN, 'appsecret': FLOUCI_APP_SECRET }
        });

        if (flouciRes.result && flouciRes.result.status === 'SUCCESS') {
            order.paymentStatus = 'completed'; order.status = 'confirmed';
            await order.save();
            await createPaymentNotification(order);
            return res.json({ success: true, status: 'completed', order: { reference: order.reference, total: order.total, items: order.items, shipping: order.shipping } });
        } else {
            order.paymentStatus = 'failed'; await order.save();
            return res.json({ success: false, status: 'failed' });
        }
    } catch (err) {
        console.error('Payment verification error:', err);
        res.status(500).json({ error: 'Erreur de vérification' });
    }
});

async function createPaymentNotification(order) {
    try {
        const itemType = order.items[0]?.type || 'order';
        const typeLabels = { ticket: 'billet', donation: 'don', subscription: 'abonnement', product: 'achat boutique' };
        await new Notification({
            type: itemType === 'product' ? 'order' : itemType,
            title: `Paiement confirmé (${typeLabels[itemType] || 'commande'})`,
            message: `${order.shipping?.fullName || 'Client'} — ${order.total} TND via Flouci`,
            details: { items: order.items.map(i => i.label), reference: order.reference },
            reference: order.reference, amount: order.total,
            userName: order.shipping?.fullName || '', userEmail: ''
        }).save();
        if (itemType === 'donation') {
            const Donor = require('../models/Donor');
            await new Donor({ name: order.shipping?.fullName || 'Anonyme', amount: order.total + ' TND' }).save();
        }
        // Auto-create social member on subscription payment
        if (itemType === 'subscription') {
            await createSocialMemberFromOrder(order);
        }
    } catch(e) { console.error('Payment notification error:', e); }
}

// Create or renew social member from confirmed subscription order
async function createSocialMemberFromOrder(order) {
    try {
        const details = order.items[0]?.details || '';
        const cinMatch = details.match(/CIN:\s*(\S+)/);
        const cin = cinMatch ? cinMatch[1].replace('—', '').trim() : '';
        if (!cin) return;

        const fullName = order.shipping?.fullName || '';
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || 'N/A';
        const lastName = nameParts.slice(1).join(' ') || 'N/A';
        const plan = (order.items[0]?.label || '').replace('Abonnement ', '');

        const existing = await SocialMember.findOne({ cin });
        if (existing) {
            // Renew existing member
            existing.status = 'active';
            existing.plan = plan;
            existing.paidAmount = order.total;
            existing.orderRef = order.reference;
            existing.season = 'Saison 2025-2026';
            await existing.save();
        } else {
            // Create new member
            await new SocialMember({
                firstName, lastName, cin,
                email: '', phone: order.shipping?.phone || '',
                address: order.shipping?.address || '',
                plan, paidAmount: order.total,
                orderRef: order.reference
            }).save();
        }
    } catch(e) { console.error('Social member creation error:', e); }
}

// ===== Public: Ticket purchase (creates order + notification) =====
router.post('/public/ticket', async (req, res) => {
    try {
        const { matchLabel, matchDate, zone, quantity, unitPrice, buyerName, buyerEmail, buyerPhone, buyerAddress } = req.body;
        if (!matchLabel || !zone || !quantity || !unitPrice || !buyerName) {
            return res.status(400).json({ error: 'Informations manquantes' });
        }

        const reference = 'CSS-' + Date.now().toString(36).toUpperCase();
        const total = unitPrice * quantity;

        const order = new Order({
            items: [{
                type: 'ticket',
                label: matchLabel,
                details: `Zone: ${zone} | ${matchDate || ''}`,
                quantity,
                unitPrice
            }],
            subtotal: total,
            total,
            paymentMethod: 'card',
            shipping: {
                fullName: buyerName,
                address: buyerAddress || '',
                phone: buyerPhone || ''
            },
            reference
        });
        await order.save();

        const notif = new Notification({
            type: 'ticket',
            title: 'Nouvel achat de billet',
            message: `${buyerName} a acheté ${quantity} billet(s) pour ${matchLabel}`,
            details: { matchLabel, matchDate, zone, quantity, unitPrice, buyerName, buyerEmail, buyerPhone, buyerAddress },
            reference,
            amount: total,
            userName: buyerName,
            userEmail: buyerEmail || ''
        });
        await notif.save();

        res.status(201).json({ success: true, reference, total });
    } catch (err) {
        console.error('Ticket purchase error:', err);
        res.status(500).json({ error: 'Erreur lors de l\'achat' });
    }
});

// ===== Public: Donation (creates order + notification) =====
router.post('/public/donation', async (req, res) => {
    try {
        const { donorName, donorEmail, donorPhone, donorAddress, amount, donType, anonymous, message } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Montant invalide' });
        }

        const reference = 'DON-' + Date.now().toString(36).toUpperCase();
        const displayName = anonymous ? 'Donateur Anonyme' : (donorName || 'Anonyme');

        const order = new Order({
            items: [{
                type: 'donation',
                label: `Don ${donType === 'mensuel' ? 'mensuel' : 'unique'}`,
                details: message || '',
                quantity: 1,
                unitPrice: amount
            }],
            subtotal: amount,
            total: amount,
            paymentMethod: 'card',
            shipping: {
                fullName: displayName,
                address: donorAddress || '',
                phone: donorPhone || ''
            },
            reference
        });
        await order.save();

        // Also add to donors wall
        const Donor = require('../models/Donor');
        await new Donor({ name: displayName, amount: amount + ' TND' }).save();

        const notif = new Notification({
            type: 'donation',
            title: 'Nouveau don reçu',
            message: `${displayName} a fait un don de ${amount} TND`,
            details: { donorName: displayName, donorEmail, donorPhone, donorAddress, amount, donType, anonymous, message },
            reference,
            amount,
            userName: displayName,
            userEmail: donorEmail || ''
        });
        await notif.save();

        res.status(201).json({ success: true, reference, total: amount });
    } catch (err) {
        console.error('Donation error:', err);
        res.status(500).json({ error: 'Erreur lors du don' });
    }
});

// ===== Public: Subscription (creates order + notification) =====
router.post('/public/subscription', async (req, res) => {
    try {
        const { planName, planPrice, fullName, cin, email, phone, address, birthDate } = req.body;
        if (!planName || !planPrice || !fullName) {
            return res.status(400).json({ error: 'Informations manquantes' });
        }
        if (!cin || !cin.trim()) {
            return res.status(400).json({ error: 'Le numéro CIN est obligatoire' });
        }

        // Check for duplicate CIN
        const existingMember = await SocialMember.findOne({ cin: cin.trim() });
        if (existingMember && existingMember.status === 'active') {
            return res.status(409).json({ error: `Ce CIN est déjà utilisé par le membre ${existingMember.memberNumber} (${existingMember.firstName} ${existingMember.lastName})` });
        }

        const reference = 'ABN-' + Date.now().toString(36).toUpperCase();

        const order = new Order({
            items: [{
                type: 'subscription',
                label: `Abonnement ${planName}`,
                details: `Saison 2025-2026 | CIN: ${cin || '—'}`,
                quantity: 1,
                unitPrice: planPrice
            }],
            subtotal: planPrice,
            total: planPrice,
            paymentMethod: 'card',
            shipping: {
                fullName,
                address: address || '',
                phone: phone || ''
            },
            reference
        });
        await order.save();

        // Create social member record
        const nameParts = fullName.trim().split(/\s+/);
        const firstName = nameParts[0] || 'N/A';
        const lastName = nameParts.slice(1).join(' ') || 'N/A';

        if (existingMember) {
            // Renew expired/suspended member
            existingMember.status = 'active';
            existingMember.plan = planName;
            existingMember.paidAmount = planPrice;
            existingMember.orderRef = reference;
            existingMember.season = 'Saison 2025-2026';
            existingMember.email = email || existingMember.email;
            existingMember.phone = phone || existingMember.phone;
            await existingMember.save();
        } else {
            await new SocialMember({
                firstName, lastName, cin: cin.trim(),
                email: email || '', phone: phone || '',
                address: address || '', birthDate: birthDate || '',
                plan: planName, paidAmount: planPrice, orderRef: reference
            }).save();
        }

        const notif = new Notification({
            type: 'subscription',
            title: 'Nouvel abonnement',
            message: `${fullName} s'est abonné à la formule ${planName} (${planPrice} TND)`,
            details: { planName, planPrice, fullName, cin, email, phone, address, birthDate },
            reference,
            amount: planPrice,
            userName: fullName,
            userEmail: email || ''
        });
        await notif.save();

        res.status(201).json({ success: true, reference, total: planPrice });
    } catch (err) {
        console.error('Subscription error:', err);
        if (err.code === 11000) return res.status(409).json({ error: 'Ce CIN est déjà enregistré' });
        res.status(500).json({ error: 'Erreur lors de l\'abonnement' });
    }
});

// ===== Admin: Member activity (all orders) =====
router.get('/admin/activity', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 }).limit(200).lean();
        const result = orders.map(d => ({ ...d, id: d._id.toString() }));
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/admin/activity/stats', authMiddleware, async (req, res) => {
    try {
        const orders = await Order.find().lean();
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        const totalOrders = orders.length;
        const tickets = orders.filter(o => o.items.some(i => i.type === 'ticket'));
        const donations = orders.filter(o => o.items.some(i => i.type === 'donation'));
        const subscriptions = orders.filter(o => o.items.some(i => i.type === 'subscription'));
        const products = orders.filter(o => o.items.some(i => i.type === 'product'));

        const ticketRevenue = tickets.reduce((sum, o) => sum + o.total, 0);
        const donationRevenue = donations.reduce((sum, o) => sum + o.total, 0);
        const subscriptionRevenue = subscriptions.reduce((sum, o) => sum + o.total, 0);
        const productRevenue = products.reduce((sum, o) => sum + o.total, 0);

        res.json({
            totalRevenue,
            totalOrders,
            tickets: { count: tickets.length, revenue: ticketRevenue },
            donations: { count: donations.length, revenue: donationRevenue },
            subscriptions: { count: subscriptions.length, revenue: subscriptionRevenue },
            products: { count: products.length, revenue: productRevenue }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== PUSH NOTIFICATIONS =====

// Public key endpoint
router.get('/push/vapid-key', (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC });
});

// Subscribe to push
router.post('/push/subscribe', async (req, res) => {
    try {
        const { subscription, categories } = req.body;
        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({ error: 'Subscription invalide' });
        }
        await PushSubscription.findOneAndUpdate(
            { endpoint: subscription.endpoint },
            { endpoint: subscription.endpoint, keys: subscription.keys, categories: categories || ['all'] },
            { upsert: true, new: true }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Unsubscribe from push
router.post('/push/unsubscribe', async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (endpoint) await PushSubscription.deleteOne({ endpoint });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Send push to all subscribers
router.post('/push/send', authMiddleware, async (req, res) => {
    try {
        const { title, body, icon, url, category } = req.body;
        const payload = JSON.stringify({ title: title || 'CS Sfaxien', body: body || '', icon: icon || '/uploads/images/icon-192x192.png', url: url || '/' });

        const filter = category && category !== 'all' ? { categories: { $in: [category, 'all'] } } : {};
        const subs = await PushSubscription.find(filter).lean();

        let sent = 0, failed = 0;
        for (const sub of subs) {
            try {
                await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload);
                sent++;
            } catch (err) {
                failed++;
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await PushSubscription.deleteOne({ endpoint: sub.endpoint });
                }
            }
        }
        res.json({ success: true, sent, failed });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== NEWSLETTER =====

// Subscribe to newsletter (public)
router.post('/newsletter/subscribe', async (req, res) => {
    try {
        const { email, firstName, categories } = req.body;
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Email invalide' });
        }
        const existing = await Subscriber.findOne({ email: email.toLowerCase().trim() });
        if (existing) {
            if (!existing.active) {
                existing.active = true;
                await existing.save();
                return res.json({ success: true, message: 'Réabonné avec succès' });
            }
            return res.json({ success: true, message: 'Déjà abonné' });
        }
        await new Subscriber({ email: email.toLowerCase().trim(), firstName: firstName || '', categories: categories || ['all'] }).save();
        res.status(201).json({ success: true, message: 'Abonné avec succès' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Unsubscribe from newsletter (public)
router.post('/newsletter/unsubscribe', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email requis' });
        await Subscriber.findOneAndUpdate({ email: email.toLowerCase().trim() }, { active: false });
        res.json({ success: true, message: 'Désabonné avec succès' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: List subscribers
router.get('/newsletter/subscribers', authMiddleware, async (req, res) => {
    try {
        const subs = await Subscriber.find({ active: true }).sort({ subscribedAt: -1 }).lean();
        res.json(subs.map(s => ({ ...s, id: s._id.toString() })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Subscriber stats
router.get('/newsletter/stats', authMiddleware, async (req, res) => {
    try {
        const total = await Subscriber.countDocuments({ active: true });
        const thisMonth = await Subscriber.countDocuments({ active: true, subscribedAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } });
        res.json({ total, thisMonth });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== LIVE MATCH TRACKER =====

// Public: Get active live match
router.get('/live', async (req, res) => {
    try {
        const live = await LiveMatch.findOne({ status: { $nin: ['not_started', 'finished'] } }).lean();
        if (!live) {
            const upcoming = await LiveMatch.findOne({ status: 'not_started' }).sort({ date: 1 }).lean();
            return res.json(upcoming ? { ...upcoming, id: upcoming._id.toString() } : null);
        }
        res.json({ ...live, id: live._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public: Get live match by ID
router.get('/live/:id', async (req, res) => {
    try {
        const doc = await LiveMatch.findById(req.params.id).lean();
        if (!doc) return res.status(404).json({ error: 'Match non trouvé' });
        res.json({ ...doc, id: doc._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Create live match
router.post('/live', authMiddleware, async (req, res) => {
    try {
        const doc = new LiveMatch(req.body);
        await doc.save();
        res.status(201).json({ ...doc.toObject(), id: doc._id.toString() });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin: Update live match (score, status, minute)
router.put('/live/:id', authMiddleware, async (req, res) => {
    try {
        const doc = await LiveMatch.findByIdAndUpdate(req.params.id, req.body, { new: true }).lean();
        if (!doc) return res.status(404).json({ error: 'Non trouvé' });
        res.json({ ...doc, id: doc._id.toString() });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin: Add event to live match
router.post('/live/:id/event', authMiddleware, async (req, res) => {
    try {
        const match = await LiveMatch.findById(req.params.id);
        if (!match) return res.status(404).json({ error: 'Non trouvé' });

        match.events.push(req.body);

        // Auto-update score for goals
        if (['goal', 'pen'].includes(req.body.type)) {
            if (req.body.team === 'home') match.homeScore++;
            else if (req.body.team === 'away') match.awayScore++;

            // Send push for goals
            const scorer = req.body.player || '';
            const score = `${match.homeScore}-${match.awayScore}`;
            const payload = JSON.stringify({
                title: `⚽ BUT ! ${match.homeTeam} ${score} ${match.awayTeam}`,
                body: `${req.body.minute}' ${scorer}`,
                icon: '/uploads/images/icon-192x192.png',
                url: '/matchs.html'
            });
            const subs = await PushSubscription.find({ categories: { $in: ['goals', 'all'] } }).lean();
            for (const sub of subs) {
                webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload).catch(() => {});
            }
        }

        if (req.body.type === 'own_goal') {
            if (req.body.team === 'home') match.awayScore++;
            else if (req.body.team === 'away') match.homeScore++;
        }

        await match.save();
        res.json({ ...match.toObject(), id: match._id.toString() });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin: Add comment to live match
router.post('/live/:id/comment', authMiddleware, async (req, res) => {
    try {
        const match = await LiveMatch.findById(req.params.id);
        if (!match) return res.status(404).json({ error: 'Non trouvé' });
        match.comments.push(req.body);
        await match.save();
        res.json({ ...match.toObject(), id: match._id.toString() });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Admin: Start match (send push notification)
router.post('/live/:id/start', authMiddleware, async (req, res) => {
    try {
        const match = await LiveMatch.findByIdAndUpdate(req.params.id, { status: 'first_half', minute: 1 }, { new: true }).lean();
        if (!match) return res.status(404).json({ error: 'Non trouvé' });

        // Push for match start
        const payload = JSON.stringify({
            title: `🏟️ Coup d'envoi !`,
            body: `${match.homeTeam} vs ${match.awayTeam} — ${match.competition}`,
            icon: '/uploads/images/icon-192x192.png',
            url: '/matchs.html'
        });
        const subs = await PushSubscription.find({ categories: { $in: ['matchStart', 'all'] } }).lean();
        for (const sub of subs) {
            webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload).catch(() => {});
        }

        res.json({ ...match, id: match._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Delete live match
router.delete('/live/:id', authMiddleware, async (req, res) => {
    try {
        await LiveMatch.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: List all live matches
router.get('/live-all', authMiddleware, async (req, res) => {
    try {
        const docs = await LiveMatch.find().sort({ date: -1 }).lean();
        res.json(docs.map(d => ({ ...d, id: d._id.toString() })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== SOCIAL MEMBERS (Membres Sociaux) =====

// Admin: Get all social members
router.get('/social-members', authMiddleware, async (req, res) => {
    try {
        const members = await SocialMember.find().sort({ createdAt: -1 }).lean();
        res.json(members.map(m => ({ ...m, id: m._id.toString() })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Get social member stats
router.get('/social-members/stats', authMiddleware, async (req, res) => {
    try {
        const total = await SocialMember.countDocuments();
        const active = await SocialMember.countDocuments({ status: 'active' });
        const expired = await SocialMember.countDocuments({ status: 'expired' });
        const suspended = await SocialMember.countDocuments({ status: 'suspended' });
        const revenue = await SocialMember.aggregate([{ $match: { status: 'active' } }, { $group: { _id: null, total: { $sum: '$paidAmount' } } }]);
        res.json({ total, active, expired, suspended, revenue: revenue[0]?.total || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin: Create social member manually
router.post('/social-members', authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName, cin, email, phone, address, birthDate, plan, season, paidAmount } = req.body;
        if (!firstName || !lastName || !cin) return res.status(400).json({ error: 'Nom, prénom et CIN obligatoires' });

        const existing = await SocialMember.findOne({ cin: cin.trim() });
        if (existing) return res.status(409).json({ error: `Un membre avec le CIN ${cin} existe déjà (N° ${existing.memberNumber})` });

        const member = new SocialMember({ firstName, lastName, cin: cin.trim(), email, phone, address, birthDate, plan, season, paidAmount: paidAmount || 0 });
        await member.save();
        res.status(201).json({ ...member.toObject(), id: member._id.toString() });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'CIN déjà utilisé par un autre membre' });
        res.status(500).json({ error: err.message });
    }
});

// Admin: Update social member
router.put('/social-members/:id', authMiddleware, async (req, res) => {
    try {
        const { firstName, lastName, cin, email, phone, address, birthDate, plan, season, status, paidAmount } = req.body;
        if (cin) {
            const dup = await SocialMember.findOne({ cin: cin.trim(), _id: { $ne: req.params.id } });
            if (dup) return res.status(409).json({ error: `CIN ${cin} déjà utilisé par ${dup.firstName} ${dup.lastName}` });
        }
        const member = await SocialMember.findByIdAndUpdate(req.params.id,
            { firstName, lastName, cin: cin?.trim(), email, phone, address, birthDate, plan, season, status, paidAmount },
            { new: true, runValidators: true });
        if (!member) return res.status(404).json({ error: 'Membre non trouvé' });
        res.json({ ...member.toObject(), id: member._id.toString() });
    } catch (err) {
        if (err.code === 11000) return res.status(409).json({ error: 'CIN déjà utilisé' });
        res.status(500).json({ error: err.message });
    }
});

// Admin: Delete social member
router.delete('/social-members/:id', authMiddleware, async (req, res) => {
    try {
        await SocialMember.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public: Check if CIN already has active subscription (for abonnement page)
router.get('/social-members/check-cin/:cin', async (req, res) => {
    try {
        const member = await SocialMember.findOne({ cin: req.params.cin.trim() });
        if (member) {
            res.json({ exists: true, memberNumber: member.memberNumber, name: `${member.firstName} ${member.lastName}`, status: member.status, plan: member.plan, season: member.season });
        } else {
            res.json({ exists: false });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===================================================================
// SITE SETTINGS
// ===================================================================

// Get all settings
router.get('/settings', async (req, res) => {
    try {
        const settings = await Settings.getAll();
        res.json(settings);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Get public settings (no auth needed - for frontend)
router.get('/settings/public', async (req, res) => {
    try {
        const settings = await Settings.getAll();
        // Only return safe public settings
        const pub = {};
        const publicKeys = ['clubName', 'clubSlogan', 'logoUrl', 'faviconUrl', 'primaryColor', 'accentColor', 'bgColor', 'textColor', 'headerBg', 'footerText', 'socialFacebook', 'socialInstagram', 'socialTwitter', 'socialYoutube', 'socialTiktok', 'contactEmail', 'contactPhone', 'contactAddress', 'heroTitle', 'heroSubtitle', 'maintenanceMode', 'announcementBar', 'announcementText'];
        publicKeys.forEach(k => { if (settings[k] !== undefined) pub[k] = settings[k]; });
        res.json(pub);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update settings (batch)
router.put('/settings', authMiddleware, async (req, res) => {
    try {
        const updates = req.body;
        const results = [];
        for (const [key, value] of Object.entries(updates)) {
            await Settings.set(key, value);
            results.push(key);
        }
        res.json({ success: true, updated: results });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Update single setting
router.put('/settings/:key', authMiddleware, async (req, res) => {
    try {
        const { value } = req.body;
        await Settings.set(req.params.key, value);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Upload logo/favicon
const multer = require('multer');
const path = require('path');
const settingsUpload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads/images')),
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const name = file.fieldname === 'logo' ? 'site-logo' : 'site-favicon';
            cb(null, name + ext);
        }
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const ok = /\.(png|jpg|jpeg|svg|ico|webp)$/i.test(file.originalname);
        cb(null, ok);
    }
});

router.post('/settings/upload-logo', authMiddleware, settingsUpload.single('logo'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Fichier requis' });
        const url = '/uploads/images/' + req.file.filename;
        await Settings.set('logoUrl', url);
        res.json({ success: true, url });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/settings/upload-favicon', authMiddleware, settingsUpload.single('favicon'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Fichier requis' });
        const url = '/uploads/images/' + req.file.filename;
        await Settings.set('faviconUrl', url);
        res.json({ success: true, url });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===================================================================
// AI POSTER GENERATION
// ===================================================================

// Save/update AI API key
router.post('/ai-config', authMiddleware, async (req, res) => {
    const { provider, apiKey } = req.body;
    if (!provider || !apiKey) return res.status(400).json({ error: 'Provider et clé API requis' });
    // Store in env (runtime only - for persistence, user should add to .env)
    process.env[`AI_${provider.toUpperCase()}_KEY`] = apiKey;
    res.json({ success: true, message: `Clé ${provider} configurée` });
});

// Get AI config status
router.get('/ai-config', authMiddleware, async (req, res) => {
    res.json({
        openai: !!process.env.AI_OPENAI_KEY || !!process.env.OPENAI_API_KEY,
        stability: !!process.env.AI_STABILITY_KEY || !!process.env.STABILITY_API_KEY,
        together: !!process.env.AI_TOGETHER_KEY || !!process.env.TOGETHER_API_KEY
    });
});

// Generate poster via AI
router.post('/ai-poster', authMiddleware, async (req, res) => {
    try {
        const { prompt, provider, size, style } = req.body;
        if (!prompt) return res.status(400).json({ error: 'Prompt requis' });

        const selectedProvider = provider || 'openai';

        if (selectedProvider === 'openai') {
            const apiKey = process.env.AI_OPENAI_KEY || process.env.OPENAI_API_KEY;
            if (!apiKey) return res.status(400).json({ error: 'Clé API OpenAI non configurée. Allez dans Paramètres IA pour la configurer.' });

            const openai = new OpenAI({ apiKey });

            // Map format to DALL-E 3 sizes
            let dalleSize = '1024x1024';
            if (size === 'story') dalleSize = '1024x1792';
            else if (size === 'landscape') dalleSize = '1792x1024';

            const response = await openai.images.generate({
                model: 'dall-e-3',
                prompt: prompt,
                n: 1,
                size: dalleSize,
                quality: 'hd',
                style: style || 'vivid'
            });

            const imageUrl = response.data[0]?.url;
            const revisedPrompt = response.data[0]?.revised_prompt;

            if (!imageUrl) return res.status(500).json({ error: 'Aucune image générée' });

            res.json({ success: true, imageUrl, revisedPrompt, provider: 'openai' });

        } else if (selectedProvider === 'stability') {
            const apiKey = process.env.AI_STABILITY_KEY || process.env.STABILITY_API_KEY;
            if (!apiKey) return res.status(400).json({ error: 'Clé API Stability non configurée.' });

            // Stability AI API
            const fetch = require('node-fetch');
            let width = 1024, height = 1024;
            if (size === 'story') { width = 768; height = 1344; }
            else if (size === 'landscape') { width = 1344; height = 768; }

            const stabRes = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    text_prompts: [{ text: prompt, weight: 1 }],
                    cfg_scale: 7,
                    width, height,
                    steps: 40,
                    samples: 1
                })
            });

            const stabData = await stabRes.json();
            if (stabData.artifacts && stabData.artifacts[0]) {
                const base64 = stabData.artifacts[0].base64;
                res.json({ success: true, imageBase64: base64, provider: 'stability' });
            } else {
                res.status(500).json({ error: stabData.message || 'Erreur Stability AI' });
            }
        } else if (selectedProvider === 'together') {
            // Together.ai - FLUX.1-schnell-Free model ($0/image, needs free API key)
            const apiKey = process.env.AI_TOGETHER_KEY || process.env.TOGETHER_API_KEY;
            if (!apiKey) return res.status(400).json({ error: 'Clé API Together.ai non configurée. Inscrivez-vous gratuitement sur together.ai' });

            const nodeFetch = require('node-fetch');
            let width = 1024, height = 1024;
            if (size === 'story') { width = 768; height = 1344; }
            else if (size === 'landscape') { width = 1344; height = 768; }

            const togetherRes = await nodeFetch('https://api.together.xyz/v1/images/generations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'black-forest-labs/FLUX.1-schnell-Free',
                    prompt: prompt,
                    width, height,
                    steps: 4,
                    n: 1,
                    response_format: 'b64_json'
                })
            });

            const togetherData = await togetherRes.json();
            if (!togetherRes.ok) throw new Error(togetherData.error?.message || 'Erreur Together.ai');

            if (togetherData.data && togetherData.data[0]?.b64_json) {
                res.json({ success: true, imageBase64: togetherData.data[0].b64_json, provider: 'together' });
            } else {
                throw new Error('Pas d\'image générée par Together.ai');
            }
        } else {
            res.status(400).json({ error: 'Provider non supporté' });
        }
    } catch (err) {
        console.error('AI Poster error:', err.message);
        res.status(500).json({ error: err.message || 'Erreur de génération IA' });
    }
});

// ========================================
// ===== API-FOOTBALL: REAL DATA ENDPOINTS =====
// ========================================

// --- Config: Save/Get API Football settings ---
router.get('/football-api/config', authMiddleware, async (req, res) => {
    try {
        const apiKey = await Settings.get('footballApiKey', '');
        const teamId = await Settings.get('footballTeamId', footballApi.CSS_TEAM_ID);
        const leagueId = await Settings.get('footballLeagueId', footballApi.TUNISIAN_LIGUE1);
        const teamName = await Settings.get('footballTeamName', 'CS Sfaxien');
        const autoSync = await Settings.get('footballAutoSync', false);
        res.json({ apiKey: apiKey ? '***' + apiKey.slice(-4) : '', teamId, leagueId, teamName, autoSync });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/football-api/config', authMiddleware, async (req, res) => {
    try {
        const { apiKey, teamId, leagueId, teamName, autoSync } = req.body;
        if (apiKey && apiKey.length > 10 && !apiKey.startsWith('***')) {
            await Settings.set('footballApiKey', apiKey);
        }
        if (teamId) await Settings.set('footballTeamId', parseInt(teamId));
        if (leagueId) await Settings.set('footballLeagueId', parseInt(leagueId));
        if (teamName) await Settings.set('footballTeamName', teamName);
        if (typeof autoSync === 'boolean') await Settings.set('footballAutoSync', autoSync);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- API Status (quota check) ---
router.get('/football-api/status', authMiddleware, async (req, res) => {
    try {
        const apiKey = await footballApi.getApiKey();
        const status = await footballApi.fetchApiStatus(apiKey);
        res.json(status);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Fetch LIVE standings from API ---
router.get('/football-api/standings', authMiddleware, async (req, res) => {
    try {
        const apiKey = await footballApi.getApiKey();
        const leagueId = req.query.league || await footballApi.getLeagueId();
        const season = req.query.season || footballApi.getCurrentSeason();
        const standings = await footballApi.fetchStandings(apiKey, leagueId, season);
        res.json(standings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Sync standings: fetch from API and save to DB ---
router.post('/football-api/sync-standings', authMiddleware, async (req, res) => {
    try {
        const apiKey = await footballApi.getApiKey();
        const leagueId = req.body.league || await footballApi.getLeagueId();
        const season = req.body.season || footballApi.getCurrentSeason();
        const standings = await footballApi.fetchStandings(apiKey, leagueId, season);

        let imported = 0;
        for (const team of standings) {
            await Standing.findOneAndUpdate(
                { name: team.name },
                {
                    name: team.name,
                    isOurTeam: team.isOurTeam,
                    played: team.played,
                    won: team.won,
                    drawn: team.drawn,
                    lost: team.lost,
                    goalsFor: team.goalsFor,
                    goalsAgainst: team.goalsAgainst,
                    points: team.points,
                    form: team.form
                },
                { upsert: true, new: true, runValidators: true }
            );
            imported++;
        }
        res.json({ success: true, imported, standings });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Fetch team fixtures (last results + upcoming) ---
router.get('/football-api/team-fixtures', authMiddleware, async (req, res) => {
    try {
        const apiKey = await footballApi.getApiKey();
        const teamId = req.query.teamId || await footballApi.getTeamId();
        const season = req.query.season || footballApi.getCurrentSeason();
        const last = parseInt(req.query.last) || 10;
        const next = parseInt(req.query.next) || 10;
        const fixtures = await footballApi.fetchTeamFixtures(apiKey, teamId, season, next, last);
        res.json(fixtures);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Sync fixtures to DB: import upcoming matches ---
router.post('/football-api/sync-fixtures', authMiddleware, async (req, res) => {
    try {
        const apiKey = await footballApi.getApiKey();
        const teamId = req.body.teamId || await footballApi.getTeamId();
        const season = req.body.season || footballApi.getCurrentSeason();
        const next = parseInt(req.body.next) || 10;
        const fixtures = await footballApi.fetchTeamFixtures(apiKey, teamId, season, next, 0);

        let imported = 0;
        for (const f of fixtures) {
            if (f.status !== 'upcoming') continue;
            const exists = await Fixture.findOne({
                homeTeam: f.homeTeam,
                awayTeam: f.awayTeam,
                date: f.date
            });
            if (!exists) {
                await new Fixture({
                    homeTeam: f.homeTeam,
                    awayTeam: f.awayTeam,
                    date: f.date,
                    time: f.time,
                    competition: f.competition,
                    venue: f.venue
                }).save();
                imported++;
            }
        }
        res.json({ success: true, imported });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Sync matches: import finished matches to DB ---
router.post('/football-api/sync-matches', authMiddleware, async (req, res) => {
    try {
        const apiKey = await footballApi.getApiKey();
        const teamId = req.body.teamId || await footballApi.getTeamId();
        const season = req.body.season || footballApi.getCurrentSeason();
        const last = parseInt(req.body.last) || 10;
        const fixtures = await footballApi.fetchTeamFixtures(apiKey, teamId, season, 0, last);

        let imported = 0;
        let updated = 0;

        for (const f of fixtures) {
            if (f.status !== 'finished') continue;

            // Check if match already exists
            const existing = await Match.findOne({
                homeTeam: f.homeTeam,
                awayTeam: f.awayTeam,
                date: f.date
            });

            if (existing) {
                // Update score if different
                const newScore = `${f.homeScore} - ${f.awayScore}`;
                if (existing.scores !== newScore) {
                    existing.scores = newScore;
                    existing.status = 'finished';
                    await existing.save();
                    updated++;
                }
                continue;
            }

            // Fetch detailed match data
            let events = [], lineups = { home: { startXI: [], subs: [] }, away: { startXI: [], subs: [] } };
            let stats = {}, formations = {};

            if (f.apiFixtureId) {
                try {
                    const details = await footballApi.fetchMatchDetails(apiKey, f.apiFixtureId);
                    events = details.events || [];

                    if (details.lineups && details.lineups.length >= 2) {
                        const homeL = details.lineups[0];
                        const awayL = details.lineups[1];
                        lineups = {
                            home: { startXI: homeL.startXI, subs: homeL.substitutes, coach: homeL.coach, formation: homeL.formation },
                            away: { startXI: awayL.startXI, subs: awayL.substitutes, coach: awayL.coach, formation: awayL.formation }
                        };
                        formations = { home: homeL.formation, away: awayL.formation };
                    }

                    stats = details.statistics || {};
                } catch (detailErr) {
                    console.warn('Could not fetch match details for', f.apiFixtureId, detailErr.message);
                }
            }

            const matchData = {
                homeTeam: f.homeTeam,
                awayTeam: f.awayTeam,
                scores: `${f.homeScore} - ${f.awayScore}`,
                date: f.date,
                time: f.time,
                competition: f.competition,
                venue: f.venue,
                referee: f.referee,
                status: 'finished',
                isHome: f.isHome,
                matchDay: f.round,
                homeFormation: formations.home || '',
                awayFormation: formations.away || '',
                homeCoach: lineups.home?.coach || '',
                awayCoach: lineups.away?.coach || '',
                homeLineup: lineups.home?.startXI || [],
                awayLineup: lineups.away?.startXI || [],
                homeSubs: lineups.home?.subs || [],
                awaySubs: lineups.away?.subs || [],
                events,
                stats
            };

            await new Match(matchData).save();
            imported++;
        }

        // Recalculate standings and player stats if matches were imported
        if (imported > 0) {
            try {
                const finishedMatches = await Match.find({ status: 'finished' }).lean();
                // Trigger recalculation silently
                console.log(`[API Sync] ${imported} matches imported, ${updated} updated`);
            } catch (e) { /* silent */ }
        }

        res.json({ success: true, imported, updated });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Get match details from API (without saving) ---
router.get('/football-api/match/:fixtureId', authMiddleware, async (req, res) => {
    try {
        const apiKey = await footballApi.getApiKey();
        const details = await footballApi.fetchMatchDetails(apiKey, req.params.fixtureId);
        res.json(details);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Top scorers ---
router.get('/football-api/top-scorers', authMiddleware, async (req, res) => {
    try {
        const apiKey = await footballApi.getApiKey();
        const leagueId = req.query.league || await footballApi.getLeagueId();
        const season = req.query.season || footballApi.getCurrentSeason();
        const scorers = await footballApi.fetchTopScorers(apiKey, leagueId, season);
        res.json(scorers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Full sync: standings + fixtures + matches in one go ---
router.post('/football-api/sync-all', authMiddleware, async (req, res) => {
    try {
        const apiKey = await footballApi.getApiKey();
        const teamId = await footballApi.getTeamId();
        const leagueId = await footballApi.getLeagueId();
        const season = footballApi.getCurrentSeason();
        const results = { standings: 0, fixtures: 0, matches: 0, matchesUpdated: 0 };

        // 1. Sync standings
        const standings = await footballApi.fetchStandings(apiKey, leagueId, season);
        for (const team of standings) {
            await Standing.findOneAndUpdate(
                { name: team.name },
                { name: team.name, isOurTeam: team.isOurTeam, played: team.played, won: team.won, drawn: team.drawn, lost: team.lost, goalsFor: team.goalsFor, goalsAgainst: team.goalsAgainst, points: team.points, form: team.form },
                { upsert: true, new: true }
            );
            results.standings++;
        }

        // 2. Sync upcoming fixtures
        const upcoming = await footballApi.fetchTeamFixtures(apiKey, teamId, season, 10, 0);
        for (const f of upcoming) {
            if (f.status !== 'upcoming') continue;
            const exists = await Fixture.findOne({ homeTeam: f.homeTeam, awayTeam: f.awayTeam, date: f.date });
            if (!exists) {
                await new Fixture({ homeTeam: f.homeTeam, awayTeam: f.awayTeam, date: f.date, time: f.time, competition: f.competition, venue: f.venue }).save();
                results.fixtures++;
            }
        }

        // 3. Sync recent match results
        const recent = await footballApi.fetchTeamFixtures(apiKey, teamId, season, 0, 10);
        for (const f of recent) {
            if (f.status !== 'finished') continue;
            const existing = await Match.findOne({ homeTeam: f.homeTeam, awayTeam: f.awayTeam, date: f.date });
            if (existing) {
                const newScore = `${f.homeScore} - ${f.awayScore}`;
                if (existing.scores !== newScore) { existing.scores = newScore; await existing.save(); results.matchesUpdated++; }
            } else {
                await new Match({
                    homeTeam: f.homeTeam, awayTeam: f.awayTeam, scores: `${f.homeScore} - ${f.awayScore}`,
                    date: f.date, time: f.time, competition: f.competition, venue: f.venue, referee: f.referee,
                    status: 'finished', isHome: f.isHome, matchDay: f.round
                }).save();
                results.matches++;
            }
        }

        res.json({ success: true, ...results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
