const express = require('express');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Player = require('../models/Player');
const Match = require('../models/Match');
const Fixture = require('../models/Fixture');
const Standing = require('../models/Standing');
const Message = require('../models/Message');
const Formation = require('../models/Formation');
const Training = require('../models/Training');
const ChatGroup = require('../models/ChatGroup');
const PlayerNotification = require('../models/PlayerNotification');
const Goal = require('../models/Goal');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Chat file upload setup
const chatUploadsDir = path.join(__dirname, '..', '..', 'uploads');
['images', 'videos', 'files'].forEach(sub => {
    const dir = path.join(chatUploadsDir, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});
const imageExts = /jpeg|jpg|png|gif|webp/;
const videoExts = /mp4|webm|ogg|mov/;
const chatStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase().slice(1);
        const sub = videoExts.test(ext) ? 'videos' : imageExts.test(ext) ? 'images' : 'files';
        cb(null, path.join(chatUploadsDir, sub));
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
        cb(null, unique + path.extname(file.originalname).toLowerCase());
    }
});
const chatUpload = multer({
    storage: chatStorage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Middleware: verify player token
function playerAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Accès non autorisé' });
    }
    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.type !== 'player') {
            return res.status(401).json({ error: 'Token joueur invalide' });
        }
        req.playerId = decoded.id;
        next();
    } catch {
        return res.status(401).json({ error: 'Token invalide' });
    }
}

// POST /api/player/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email et mot de passe requis' });
        }

        const player = await Player.findOne({ email: email.toLowerCase().trim(), hasAccount: true }).select('+password');
        if (!player) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        const isMatch = await player.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Identifiants incorrects' });
        }

        player.lastLogin = new Date();
        await player.save();

        const token = jwt.sign({ id: player._id, type: 'player' }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            token,
            player: {
                id: player._id,
                name: player.name,
                number: player.number,
                category: player.category,
                nationality: player.nationality,
                age: player.age,
                image: player.image,
                rating: player.rating,
                stats: player.stats,
                role: player.role
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/player/me — Get current player profile
router.get('/me', playerAuth, async (req, res) => {
    try {
        const player = await Player.findById(req.playerId).select('-password').lean();
        if (!player) return res.status(404).json({ error: 'Joueur non trouvé' });
        res.json({ ...player, id: player._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/player/me — Update own profile (limited fields)
router.put('/me', playerAuth, async (req, res) => {
    try {
        const allowed = ['nationality', 'age', 'image'];
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }
        const player = await Player.findByIdAndUpdate(req.playerId, updates, { new: true }).select('-password').lean();
        res.json({ ...player, id: player._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/player/password — Change own password
router.put('/password', playerAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Mot de passe invalide (min 6 caractères)' });
        }
        const player = await Player.findById(req.playerId).select('+password');
        if (!player) return res.status(404).json({ error: 'Joueur non trouvé' });

        const isMatch = await player.comparePassword(currentPassword);
        if (!isMatch) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });

        player.password = newPassword;
        await player.save();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/player/dashboard — Dashboard data (stats, matches, fixtures, standings)
router.get('/dashboard', playerAuth, async (req, res) => {
    try {
        const player = await Player.findById(req.playerId).select('-password').lean();
        if (!player) return res.status(404).json({ error: 'Joueur non trouvé' });

        // Get all matches involving CS Sfaxien
        const matches = await Match.find({ status: 'finished' }).sort({ date: -1 }).limit(20).lean();

        // Get upcoming fixtures
        const fixtures = await Fixture.find({ date: { $gte: new Date().toISOString().split('T')[0] } })
            .sort({ date: 1 }).limit(5).lean();

        // Get standings
        const standings = await Standing.find().sort({ points: -1 }).lean();

        // Player personal stats from matches
        const playerName = player.name.trim();
        const playerNumber = player.number;
        // Build name variants for fuzzy matching (full name, last name, first+last, etc.)
        const nameParts = playerName.split(/\s+/);
        const nameVariants = new Set([playerName.toLowerCase()]);
        if (nameParts.length > 1) {
            nameVariants.add(nameParts[nameParts.length - 1].toLowerCase()); // last name
            nameVariants.add(nameParts[0].toLowerCase()); // first name
            nameVariants.add((nameParts[0] + ' ' + nameParts[nameParts.length - 1]).toLowerCase()); // first + last
        }
        
        function matchesPlayer(eventName) {
            if (!eventName) return false;
            const en = eventName.trim().toLowerCase();
            if (nameVariants.has(en)) return true;
            // Check if event name is contained in full name or vice versa
            const fullLower = playerName.toLowerCase();
            if (fullLower.includes(en) && en.length >= 3) return true;
            if (en.includes(fullLower)) return true;
            // Handle sub notation like "Diarra ↔ Mutyaba"
            if (en.includes('↔') || en.includes('<>') || en.includes('→')) {
                const subParts = en.split(/[↔<>→]/);
                for (const sp of subParts) {
                    const spTrim = sp.trim();
                    if (spTrim && nameVariants.has(spTrim)) return true;
                    if (spTrim && fullLower.includes(spTrim) && spTrim.length >= 3) return true;
                }
            }
            return false;
        }

        let personalStats = { matchs: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, minutesPlayed: 0 };
        const recentPerformance = [];

        for (const match of matches) {
            const events = match.events || [];
            let inMatch = false;
            let matchGoals = 0, matchAssists = 0, matchYellows = 0, matchReds = 0;

            // Check lineup first — if player is in lineup, they played
            const csLineup = match.isHome !== false ? [...(match.homeLineup || []), ...(match.homeSubs || [])] : [...(match.awayLineup || []), ...(match.awaySubs || [])];
            for (const lp of csLineup) {
                if (matchesPlayer(lp.name) || (playerNumber && lp.number === playerNumber)) {
                    inMatch = true;
                    break;
                }
            }

            for (const ev of events) {
                const eName = (ev.player || '').trim();
                const aName = (ev.assist || '').trim();

                if (matchesPlayer(eName) || matchesPlayer(aName)) inMatch = true;

                if (matchesPlayer(eName)) {
                    if (ev.type === 'goal' || ev.type === 'pen') { personalStats.goals++; matchGoals++; }
                    if (ev.type === 'yellow') { personalStats.yellowCards++; matchYellows++; }
                    if (ev.type === 'red') { personalStats.redCards++; matchReds++; }
                }
                if (matchesPlayer(aName) && (ev.type === 'goal' || ev.type === 'pen')) {
                    personalStats.assists++; matchAssists++;
                }
            }

            if (inMatch) {
                personalStats.matchs++;
                recentPerformance.push({
                    date: match.date,
                    homeTeam: match.homeTeam,
                    awayTeam: match.awayTeam,
                    homeScore: match.homeScore,
                    awayScore: match.awayScore,
                    goals: matchGoals,
                    assists: matchAssists,
                    yellowCards: matchYellows,
                    redCards: matchReds,
                    competition: match.competition
                });
            }
        }

        // All team players (coéquipiers)
        const teammates = await Player.find({ 
            category: { $nin: ['coach', 'staff'] },
            _id: { $ne: player._id }
        }).select('name number category image rating stats').lean();

        // Coach info
        const coaches = await Player.find({ 
            category: { $in: ['coach', 'staff'] }
        }).select('name role image category').lean();

        res.json({
            player: { ...player, id: player._id.toString() },
            personalStats,
            recentPerformance: recentPerformance.slice(0, 10),
            upcomingFixtures: fixtures.map(f => ({ ...f, id: f._id.toString() })),
            standings: standings.map(s => ({ ...s, id: s._id.toString() })),
            teammates: teammates.map(t => ({ ...t, id: t._id.toString() })),
            coaches: coaches.map(c => ({ ...c, id: c._id.toString() }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== ONLINE STATUS =====

// POST /api/player/heartbeat — Update last seen
router.post('/heartbeat', playerAuth, async (req, res) => {
    try {
        await Player.findByIdAndUpdate(req.playerId, { lastSeen: new Date() });
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/player/online — Get online status of all players with accounts
router.get('/online', playerAuth, async (req, res) => {
    try {
        const players = await Player.find({ hasAccount: true }).select('name image category lastSeen number').lean();
        const now = Date.now();
        const result = players.map(p => {
            const lastSeen = p.lastSeen ? new Date(p.lastSeen).getTime() : 0;
            const diffMs = now - lastSeen;
            const online = diffMs < 2 * 60 * 1000; // 2 minutes = online
            return {
                id: p._id.toString(),
                name: p.name,
                image: p.image || '',
                category: p.category,
                number: p.number,
                online,
                lastSeen: p.lastSeen || null
            };
        });
        res.json(result);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== CHAT FILE UPLOAD =====

// POST /api/player/chat-upload — Upload files for chat messages
router.post('/chat-upload', playerAuth, chatUpload.array('files', 5), (req, res) => {
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'Aucun fichier' });
    const results = req.files.map(f => {
        const ext = path.extname(f.originalname).toLowerCase().slice(1);
        const sub = videoExts.test(ext) ? 'videos' : imageExts.test(ext) ? 'images' : 'files';
        const fileType = videoExts.test(ext) ? 'video' : imageExts.test(ext) ? 'image' : 'file';
        return { type: fileType, url: `/uploads/${sub}/${f.filename}`, name: f.originalname, size: f.size };
    });
    res.json(results);
});

// ===== MESSAGING =====

// GET /api/player/messages/:channel — Get messages for a channel
router.get('/messages/:channel', playerAuth, async (req, res) => {
    try {
        const { channel } = req.params;
        const player = await Player.findById(req.playerId).lean();
        if (!player) return res.status(404).json({ error: 'Joueur non trouvé' });

        // Access control: 'coaches' channel only for coach/staff
        const isCoach = player.category === 'coach' || player.category === 'staff';
        if (channel === 'coaches' && !isCoach) {
            return res.status(403).json({ error: 'Accès réservé aux entraîneurs' });
        }

        // Access control for group/DM channels
        if (channel.startsWith('group_') || channel.startsWith('dm_')) {
            const groupId = channel.replace(/^(group_|dm_)/, '');
            const group = await ChatGroup.findById(groupId).lean();
            if (!group || !group.members.some(m => m.toString() === req.playerId)) {
                return res.status(403).json({ error: 'Accès non autorisé' });
            }
        }

        const before = req.query.before;
        const query = { channel };
        if (before) query.createdAt = { $lt: new Date(before) };

        const messages = await Message.find(query)
            .sort({ createdAt: -1 })
            .limit(50)
            .lean();

        res.json(messages.reverse().map(m => ({ ...m, id: m._id.toString() })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/player/messages/:channel — Send a message
router.post('/messages/:channel', playerAuth, async (req, res) => {
    try {
        const { channel } = req.params;
        const { text, replyTo, attachments } = req.body;
        if ((!text || !text.trim()) && (!attachments || !attachments.length)) return res.status(400).json({ error: 'Message vide' });

        const player = await Player.findById(req.playerId).lean();
        if (!player) return res.status(404).json({ error: 'Joueur non trouvé' });

        const isCoach = player.category === 'coach' || player.category === 'staff';
        if (channel === 'coaches' && !isCoach) {
            return res.status(403).json({ error: 'Accès réservé aux entraîneurs' });
        }

        // Access control for group/DM channels
        if (channel.startsWith('group_') || channel.startsWith('dm_')) {
            const groupId = channel.replace(/^(group_|dm_)/, '');
            const group = await ChatGroup.findById(groupId).lean();
            if (!group || !group.members.some(m => m.toString() === req.playerId)) {
                return res.status(403).json({ error: 'Accès non autorisé' });
            }
        }

        const msg = new Message({
            channel,
            sender: player._id,
            senderName: player.name,
            senderImage: player.image || '',
            senderCategory: player.category,
            text: (text || '').trim().substring(0, 2000),
            attachments: attachments || [],
            replyTo: replyTo || undefined,
            readBy: [player._id]
        });
        await msg.save();
        res.status(201).json({ ...msg.toObject(), id: msg._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/player/messages/:id — Delete own message
router.delete('/messages/msg/:id', playerAuth, async (req, res) => {
    try {
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ error: 'Message non trouvé' });

        const player = await Player.findById(req.playerId).lean();
        const isCoach = player.category === 'coach' || player.category === 'staff';

        // Only sender or coach can delete
        if (msg.sender.toString() !== req.playerId && !isCoach) {
            return res.status(403).json({ error: 'Non autorisé' });
        }
        await Message.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/player/messages/pin/:id — Pin/unpin a message (coach only)
router.put('/messages/pin/:id', playerAuth, async (req, res) => {
    try {
        const player = await Player.findById(req.playerId).lean();
        if (player.category !== 'coach' && player.category !== 'staff') {
            return res.status(403).json({ error: 'Réservé aux entraîneurs' });
        }
        const msg = await Message.findById(req.params.id);
        if (!msg) return res.status(404).json({ error: 'Message non trouvé' });
        msg.pinned = !msg.pinned;
        await msg.save();
        res.json({ ...msg.toObject(), id: msg._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/player/channels — Get available channels for this player
router.get('/channels', playerAuth, async (req, res) => {
    try {
        const player = await Player.findById(req.playerId).lean();
        const isCoach = player.category === 'coach' || player.category === 'staff';
        const channels = [
            { id: 'general', name: 'Général', icon: 'fas fa-comments', description: 'Discussion générale', type: 'channel' },
            { id: 'team', name: 'Équipe', icon: 'fas fa-users', description: 'Discussions d\'équipe', type: 'channel' }
        ];
        if (isCoach) {
            channels.push({ id: 'coaches', name: 'Staff technique', icon: 'fas fa-clipboard', description: 'Entraîneurs & Staff uniquement', type: 'channel' });
        }

        // Get unread counts for channels
        for (const ch of channels) {
            const unread = await Message.countDocuments({
                channel: ch.id,
                readBy: { $ne: player._id }
            });
            ch.unread = unread;
        }

        // Get groups & DMs for this player
        const groups = await ChatGroup.find({ members: player._id }).populate('members', 'name image category number').lean();
        const groupItems = [];
        const dmItems = [];

        for (const g of groups) {
            const channelId = g.isDM ? `dm_${g._id}` : `group_${g._id}`;
            const unread = await Message.countDocuments({
                channel: channelId,
                readBy: { $ne: player._id }
            });
            if (g.isDM) {
                const other = g.members.find(m => m._id.toString() !== req.playerId);
                dmItems.push({
                    id: channelId,
                    name: other ? other.name : 'Inconnu',
                    image: other ? other.image || '' : '',
                    icon: 'fas fa-user',
                    description: 'Message privé',
                    type: 'dm',
                    groupId: g._id.toString(),
                    otherUserId: other ? other._id.toString() : null,
                    unread
                });
            } else {
                groupItems.push({
                    id: channelId,
                    name: g.name,
                    image: g.image || '',
                    icon: 'fas fa-users-cog',
                    description: `${g.members.length} membres`,
                    type: 'group',
                    groupId: g._id.toString(),
                    members: g.members.map(m => ({ id: m._id.toString(), name: m.name, image: m.image || '' })),
                    unread
                });
            }
        }

        res.json({ channels, groups: groupItems, dms: dmItems });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/player/groups — Create a new group
router.post('/groups', playerAuth, async (req, res) => {
    try {
        const { name, memberIds } = req.body;
        if (!name || !name.trim()) return res.status(400).json({ error: 'Nom du groupe requis' });
        if (!memberIds || !Array.isArray(memberIds) || memberIds.length === 0) {
            return res.status(400).json({ error: 'Au moins un membre requis' });
        }
        // Always include the creator
        const allMembers = [...new Set([req.playerId, ...memberIds])];
        const group = new ChatGroup({
            name: name.trim().substring(0, 100),
            members: allMembers,
            creator: req.playerId,
            isDM: false
        });
        await group.save();
        await group.populate('members', 'name image category number');
        res.status(201).json({
            id: `group_${group._id}`,
            name: group.name,
            icon: 'fas fa-users-cog',
            description: `${group.members.length} membres`,
            type: 'group',
            groupId: group._id.toString(),
            members: group.members.map(m => ({ id: m._id.toString(), name: m.name, image: m.image || '' })),
            unread: 0
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/player/dm — Start or get existing DM with a player
router.post('/dm', playerAuth, async (req, res) => {
    try {
        const { targetId } = req.body;
        if (!targetId) return res.status(400).json({ error: 'Destinataire requis' });
        if (targetId === req.playerId) return res.status(400).json({ error: 'Impossible de vous envoyer un message' });

        // Check if DM already exists between these two
        let dm = await ChatGroup.findOne({
            isDM: true,
            members: { $all: [req.playerId, targetId], $size: 2 }
        }).populate('members', 'name image category number').lean();

        if (!dm) {
            const newDm = new ChatGroup({
                name: 'DM',
                members: [req.playerId, targetId],
                creator: req.playerId,
                isDM: true
            });
            await newDm.save();
            await newDm.populate('members', 'name image category number');
            dm = newDm.toObject();
        }

        const other = dm.members.find(m => m._id.toString() !== req.playerId);
        res.json({
            id: `dm_${dm._id}`,
            name: other ? other.name : 'Inconnu',
            image: other ? other.image || '' : '',
            icon: 'fas fa-user',
            description: 'Message privé',
            type: 'dm',
            groupId: dm._id.toString(),
            otherUserId: other ? other._id.toString() : null,
            unread: 0
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/player/groups/:id — Get group details
router.get('/groups/:id', playerAuth, async (req, res) => {
    try {
        const group = await ChatGroup.findById(req.params.id).populate('members', 'name image category number').lean();
        if (!group) return res.status(404).json({ error: 'Groupe non trouvé' });
        if (!group.members.some(m => m._id.toString() === req.playerId)) {
            return res.status(403).json({ error: 'Accès non autorisé' });
        }
        res.json({
            id: group._id.toString(),
            name: group.name,
            image: group.image,
            isDM: group.isDM,
            creator: group.creator.toString(),
            members: group.members.map(m => ({ id: m._id.toString(), name: m.name, image: m.image || '', category: m.category, number: m.number }))
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/player/groups/:id — Delete a group (creator only)
router.delete('/groups/:id', playerAuth, async (req, res) => {
    try {
        const group = await ChatGroup.findById(req.params.id);
        if (!group) return res.status(404).json({ error: 'Groupe non trouvé' });
        if (group.creator.toString() !== req.playerId) {
            return res.status(403).json({ error: 'Seul le créateur peut supprimer le groupe' });
        }
        const channelId = group.isDM ? `dm_${group._id}` : `group_${group._id}`;
        await Message.deleteMany({ channel: channelId });
        await ChatGroup.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/player/messages/read/:channel — Mark messages as read
router.post('/messages/read/:channel', playerAuth, async (req, res) => {
    try {
        await Message.updateMany(
            { channel: req.params.channel, readBy: { $ne: req.playerId } },
            { $addToSet: { readBy: req.playerId } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== FORMATIONS (Coach only for write, all for read published) =====

// Middleware: check coach role
async function coachOnly(req, res, next) {
    const player = await Player.findById(req.playerId).lean();
    if (!player || (player.category !== 'coach' && player.category !== 'staff')) {
        return res.status(403).json({ error: 'Accès réservé aux entraîneurs' });
    }
    req.player = player;
    next();
}

// GET /api/player/formations — Get formations (coach: all, player: published only)
router.get('/formations', playerAuth, async (req, res) => {
    try {
        const player = await Player.findById(req.playerId).lean();
        const isCoach = player.category === 'coach' || player.category === 'staff';
        const query = isCoach ? {} : { status: 'published' };
        const formations = await Formation.find(query).sort({ createdAt: -1 }).limit(20).lean();
        res.json(formations.map(f => ({ ...f, id: f._id.toString() })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/player/formations — Create formation (coach only)
router.post('/formations', playerAuth, coachOnly, async (req, res) => {
    try {
        const { name, formation, matchDate, opponent, competition, positions, substitutes, notes, status } = req.body;
        const f = new Formation({
            name, formation, matchDate, opponent, competition,
            positions: positions || [], substitutes: substitutes || [],
            notes: notes || '',
            createdBy: req.playerId,
            createdByName: req.player.name,
            status: status || 'draft'
        });
        await f.save();
        res.status(201).json({ ...f.toObject(), id: f._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/player/formations/:id — Update formation (coach only)
router.put('/formations/:id', playerAuth, coachOnly, async (req, res) => {
    try {
        const updates = {};
        const allowed = ['name', 'formation', 'matchDate', 'opponent', 'competition', 'positions', 'substitutes', 'notes', 'status'];
        for (const k of allowed) {
            if (req.body[k] !== undefined) updates[k] = req.body[k];
        }
        const f = await Formation.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
        if (!f) return res.status(404).json({ error: 'Formation non trouvée' });
        res.json({ ...f, id: f._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/player/formations/:id — Delete formation (coach only)
router.delete('/formations/:id', playerAuth, coachOnly, async (req, res) => {
    try {
        await Formation.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== TRAINING SESSIONS =====

// GET /api/player/trainings — Get training sessions
router.get('/trainings', playerAuth, async (req, res) => {
    try {
        const player = await Player.findById(req.playerId).lean();
        const isCoach = player.category === 'coach' || player.category === 'staff';
        const query = {};
        if (!isCoach) {
            // Players see: trainings for all + trainings for their category + trainings assigned to them
            query.$or = [
                { players: { $size: 0 }, targetCategory: { $in: ['all', player.category] } },
                { players: { $size: 0 }, targetCategory: { $exists: false } },
                { players: req.playerId }
            ];
        }
        const trainings = await Training.find(query).sort({ date: -1 }).limit(50).lean();
        res.json(trainings.map(t => ({ ...t, id: t._id.toString() })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/player/trainings/upcoming — Get next 7 days of training
router.get('/trainings/upcoming', playerAuth, async (req, res) => {
    try {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 14);
        const trainings = await Training.find({
            date: { $gte: now, $lte: nextWeek },
            status: { $ne: 'annulé' }
        }).sort({ date: 1 }).lean();
        res.json(trainings.map(t => ({ ...t, id: t._id.toString() })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/player/trainings — Create training (coach only)
router.post('/trainings', playerAuth, coachOnly, async (req, res) => {
    try {
        const { title, type, date, startTime, endTime, location, description, exercises, players, intensity, status, targetCategory } = req.body;
        const t = new Training({
            title, type: type || 'terrain', date, startTime, endTime, location, description,
            exercises: exercises || [], players: players || [],
            targetCategory: targetCategory || 'all',
            intensity: intensity || 'modérée', status: status || 'planifié',
            createdBy: req.playerId, createdByName: req.player.name
        });
        await t.save();
        // Notify players about new training
        const catFilter = (targetCategory && targetCategory !== 'all') ? { category: targetCategory } : { category: { $nin: ['coach', 'staff'] } };
        notifyPlayers(catFilter, {
            type: 'training', title: '📋 Nouvelle séance planifiée',
            body: `${t.title} — ${new Date(t.date).toLocaleDateString('fr-FR')}`,
            icon: 'fas fa-dumbbell', color: '#e74c3c', link: 'training'
        }).catch(() => {});
        res.status(201).json({ ...t.toObject(), id: t._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/player/trainings/:id — Update training (coach only)
router.put('/trainings/:id', playerAuth, coachOnly, async (req, res) => {
    try {
        const allowed = ['title', 'type', 'date', 'startTime', 'endTime', 'location', 'description', 'exercises', 'players', 'intensity', 'status', 'attendance', 'targetCategory'];
        const updates = {};
        for (const k of allowed) {
            if (req.body[k] !== undefined) updates[k] = req.body[k];
        }
        const t = await Training.findByIdAndUpdate(req.params.id, updates, { new: true }).lean();
        if (!t) return res.status(404).json({ error: 'Séance non trouvée' });
        res.json({ ...t, id: t._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/player/trainings/:id — Delete training (coach only)
router.delete('/trainings/:id', playerAuth, coachOnly, async (req, res) => {
    try {
        await Training.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/player/trainings/:id/attendance — Mark attendance (coach only)
router.post('/trainings/:id/attendance', playerAuth, coachOnly, async (req, res) => {
    try {
        const { attendance } = req.body; // [{playerId, playerName, present, note}]
        const t = await Training.findByIdAndUpdate(req.params.id, { attendance }, { new: true }).lean();
        if (!t) return res.status(404).json({ error: 'Séance non trouvée' });
        res.json({ ...t, id: t._id.toString() });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/player/ai-coach — AI-based physical progression recommendations
router.get('/ai-coach', playerAuth, async (req, res) => {
    try {
        const player = await Player.findById(req.playerId).lean();
        if (!player) return res.status(404).json({ error: 'Joueur non trouvé' });

        // Get player's recent match data
        const matches = await Match.find({
            status: 'terminé',
            $or: [
                { 'events.player': player.name },
                { homeTeam: 'CS Sfaxien' },
                { awayTeam: 'CS Sfaxien' }
            ]
        }).sort({ date: -1 }).limit(10).lean();

        // Get recent training attendance
        const recentTrainings = await Training.find({
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            'attendance.playerId': player._id
        }).lean();

        const attended = recentTrainings.filter(t => {
            const att = t.attendance.find(a => a.playerId && a.playerId.toString() === player._id.toString());
            return att && att.present;
        }).length;

        // Calculate stats
        const stats = player.stats || {};
        const matchCount = stats.matchs || stats.appearances || 0;
        const goals = stats.buts || stats.goals || 0;
        const assists = stats.passes_decisives || stats.assists || 0;

        // Build AI recommendation based on player profile
        const category = player.category;
        const age = player.age || 25;
        const rating = player.rating || 5;
        const attendanceRate = recentTrainings.length > 0 ? Math.round((attended / recentTrainings.length) * 100) : 100;

        const recommendations = generateAIRecommendations({
            name: player.name, category, age, rating, matchCount, goals, assists,
            attendanceRate, recentMatchCount: matches.length, totalTrainings: recentTrainings.length
        });

        res.json({
            player: { name: player.name, category, age, rating, number: player.number, image: player.image },
            stats: { matchCount, goals, assists, attendanceRate, trainingsThisMonth: recentTrainings.length, attended },
            recommendations
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/player/ai-chat — AI Coach chatbot
router.post('/ai-chat', playerAuth, async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || !message.trim()) return res.status(400).json({ error: 'Message vide' });

        const player = await Player.findById(req.playerId).lean();
        if (!player) return res.status(404).json({ error: 'Joueur non trouvé' });

        const stats = player.stats || {};
        const category = player.category;
        const age = player.age || 25;
        const rating = player.rating || 5;
        const q = message.toLowerCase().trim();

        const reply = generateAIChatReply(q, {
            name: player.name, category, age, rating,
            matchs: stats.matchs || 0,
            goals: stats.buts || 0,
            assists: stats.passes_decisives || 0,
            number: player.number
        });

        res.json({ reply });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

function generateAIChatReply(question, player) {
    const { name, category, age, rating, matchs, goals, assists } = player;
    const catLabels = { goalkeepers:'gardien', defenders:'défenseur', midfielders:'milieu', attackers:'attaquant' };
    const pos = catLabels[category] || 'joueur';
    const firstName = name.split(' ').pop();

    // Greeting
    if (/^(salut|bonjour|hello|hey|salam|bonsoir|coucou)/i.test(question)) {
        return `Salut ${firstName} ! 👋 Je suis ton IA Coach personnel. Comment je peux t'aider aujourd'hui ?\n\nTu peux me demander :\n• Des exercices physiques\n• Des conseils tactiques\n• Des tips de nutrition\n• Une analyse de tes stats\n• Des conseils de récupération\n• Comment améliorer un aspect de ton jeu`;
    }

    // Stats / performance
    if (/stat|perf|note|match|but|passe|niveau/.test(question)) {
        const ratingEmoji = rating >= 7 ? '🔥' : rating >= 5 ? '📊' : '⚠️';
        let reply = `${ratingEmoji} Voici tes stats actuelles, ${firstName} :\n\n`;
        reply += `⚽ Matchs joués : ${matchs}\n🎯 Buts : ${goals}\n🅰️ Passes décisives : ${assists}\n📊 Note moyenne : ${rating}/10\n\n`;
        if (rating >= 7) reply += `Tu es en excellente forme ! Continue à maintenir cette régularité. 💪`;
        else if (rating >= 5) reply += `Ton niveau est correct, mais y'a du potentiel ! Je te conseille de travailler tes points faibles en séance individuelle.`;
        else reply += `Ta note est en dessous de la moyenne. Pas de panique, on va bosser ensemble ! Focus sur les fondamentaux et la régularité aux entraînements.`;
        return reply;
    }

    // Exercise / physical
    if (/exercice|physique|muscul|entrainement|entraîn|fitness|salle|gym|force|vitesse|endurance|sprint/.test(question)) {
        const exercises = {
            goalkeepers: `🧤 Programme ${pos} — ${firstName} :\n\n1️⃣ Pliométrie latérale : 4x8 reps\n2️⃣ Détente verticale : 5x5 sauts max\n3️⃣ Réflexes au mur : 3x2min\n4️⃣ Gainage dynamique : 4x30s\n5️⃣ Sprints courts 5m : 10 répétitions\n\n⏱ Durée : 45 min | 📅 3x/semaine\n💡 Tip : Fais les exercices de réflexes en début de séance quand tu es le plus frais.`,
            defenders: `🛡️ Programme ${pos} — ${firstName} :\n\n1️⃣ Squats : 4x8 à 80% 1RM\n2️⃣ Fentes marchées : 3x12\n3️⃣ Box jumps : 4x8\n4️⃣ Course arrière : 6x20m\n5️⃣ Core anti-rotation : 3x12\n\n⏱ Durée : 50 min | 📅 3x/semaine\n💡 Tip : Les duels aériens se gagnent avec la détente — travaille tes box jumps !`,
            midfielders: `🏃 Programme ${pos} — ${firstName} :\n\n1️⃣ Interval 30/30 : 12 séries\n2️⃣ Fartlek : 20min varié\n3️⃣ Échelle de rythme : 5 patterns\n4️⃣ Circuit training : 4 tours\n5️⃣ Gainage dynamique : 3x8 mouvements\n\n⏱ Durée : 45 min | 📅 3x/semaine\n💡 Tip : En tant que milieu tu parcours 10-12km/match — l'endurance est ta priorité !`,
            attackers: `⚡ Programme ${pos} — ${firstName} :\n\n1️⃣ Sprints 30m lancés : 8x\n2️⃣ Sprints résistés (élastique) : 6x\n3️⃣ Squat jump : 4x6\n4️⃣ Contrôle-frappe 1 touche : 5x5\n5️⃣ Courses profondes + finition : 10 reps\n\n⏱ Durée : 40 min | 📅 3x/semaine\n💡 Tip : La première foulée fait la différence — travaille l'explosivité !`
        };
        return exercises[category] || exercises.midfielders;
    }

    // Nutrition
    if (/nutri|manger|repas|alimentation|régime|protéine|glucide|hydrat|eau|boire|nourriture|diète/.test(question)) {
        const nutritionAdvice = {
            goalkeepers: `🥗 Conseils nutrition pour ${pos} :\n\n🥩 Protéines : 1.6g/kg/jour\n🐟 Oméga-3 : poissons gras 3x/semaine pour la concentration\n💧 Hydratation : 3L/jour minimum\n🍌 Avant match : banane + barre énergétique 1h30 avant\n☕ Pas de café 4h avant le coucher\n\n📋 Repas type jour de match :\n• Petit-déj : avoine, œufs, fruits\n• Déjeuner : riz/pâtes, poulet, légumes\n• Collation : fruit sec, amandes\n• Dîner (après match) : protéines + glucides pour récup`,
            defenders: `🥗 Conseils nutrition pour ${pos} :\n\n🥩 Protéines : 1.8g/kg/jour pour la masse\n⚡ Créatine : 5g/jour dans l'eau\n🍚 Glucides complexes avant match\n💧 Hydratation : 3L/jour\n\n📋 Pour prendre du muscle :\n• Mange toutes les 3h\n• 4 portions de protéines/jour\n• Pas de sucre raffiné\n• Collation post-entraînement : whey + banane`,
            midfielders: `🥗 Conseils nutrition pour ${pos} :\n\n🍚 Glucides : 6-8g/kg/jour (tu cours le plus !)\n💊 BCAA : avant/après entraînement intense\n💧 Hydratation : 3.5L/jour\n🍌 Mi-temps : gel énergétique ou fruit\n\n📋 Repas type :\n• Petit-déj : porridge, miel, fruits secs\n• Déjeuner : pâtes complètes, saumon, salade\n• Collation : yaourt grec, amandes\n• Dîner : légumes, poulet, quinoa`,
            attackers: `🥗 Conseils nutrition pour ${pos} :\n\n🥩 Protéines : 1.7g/kg/jour pour l'explosivité\n☕ Caféine : 200mg 30min avant le match\n🍬 Glucides rapides à la mi-temps\n💧 Hydratation : 3L/jour\n\n📋 Secret des buteurs :\n• Petit-déj protéiné (œufs + avoine)\n• Créatine 5g/jour pour les sprints\n• Évite l'alcool — ça tue tes réflexes\n• Bons gras : avocat, noix, huile d'olive`
        };
        return nutritionAdvice[category] || nutritionAdvice.midfielders;
    }

    // Recovery
    if (/récup|repos|dormir|sommeil|fatigue|blessure|douleur|bain|froid|massage|étir|stretch/.test(question)) {
        let reply = `🧘 Protocole de récupération pour ${firstName} :\n\n`;
        reply += `🛁 Après match/entraînement :\n• Bain froid 10min (10-12°C)\n• Étirements passifs 15min\n• Rouleau de massage (foam roller) 10min\n\n`;
        reply += `💤 Sommeil :\n• 8-9h par nuit minimum\n• Sieste 20min l'après-midi\n• Pas d'écrans 1h avant de dormir\n• Chambre fraîche (18°C)\n\n`;
        if (age > 28) reply += `⚠️ À ${age} ans, la récupération est cruciale ! Ajoute :\n• Compression (chaussettes de récupération)\n• Électrostimulation\n• Séances de yoga 2x/semaine`;
        else reply += `💡 À ${age} ans, tu récupères vite mais ne néglige pas le sommeil. C'est pendant le repos que le muscle se construit !`;
        return reply;
    }

    // Tactical
    if (/tactique|positionnement|placement|jeu|conseil|match|adversaire|stratégie|défense|attaque|pressing|contre/.test(question)) {
        const tactics = {
            goalkeepers: `🧤 Tactique ${pos} — ${firstName} :\n\n📍 Positionnement :\n• Toujours sur la ligne des 6m au minimum\n• Couvre le 1er poteau sur les centres\n• Communication constante avec ta défense\n\n🎮 Points clés :\n• Relance au pied : travaille les 2 pieds\n• Sorties aériennes : décide vite (sortir ou rester)\n• 1v1 : reste debout le plus longtemps possible\n• Distribution : cherche les ailes pour les contre-attaques`,
            defenders: `🛡️ Tactique ${pos} — ${firstName} :\n\n📍 Positionnement :\n• Reste compact avec ta ligne\n• Distance de couverture : max 8m du partenaire\n• Surveille la profondeur, pas que le ballon\n\n🎮 Points clés :\n• Duel : oriente l'attaquant vers l'extérieur\n• Tacle : dernier recours, préfère l'interception\n• Relance : passes courtes sûres, pas de risque dans ta zone\n• Corners : marque ton joueur, attaque le ballon`,
            midfielders: `🏃 Tactique ${pos} — ${firstName} :\n\n📍 Positionnement :\n• Triangle milieu : toujours 2 options de passe\n• Pressing haut : déclenche sur le signal de l'entraîneur\n• Transition : premier à revenir ou à projeter\n\n🎮 Points clés :\n• Vision : scanne le terrain avant de recevoir\n• 1 touche : accélère le jeu quand c'est possible\n• Courses de soutien : arrive en 2e vague sur les frappes\n• Leadership : tu es le métronome, donne le tempo`,
            attackers: `⚡ Tactique ${pos} — ${firstName} :\n\n📍 Positionnement :\n• Reste sur l'épaule du dernier défenseur\n• Appels en diagonale, pas que tout droit\n• Décroche pour créer de l'espace derrière\n\n🎮 Points clés :\n• 1er défenseur : mets la pression, oriente le jeu\n• Timing des courses : synchronise avec le milieu\n• Finition : cadre d'abord, puissance ensuite\n• Pressing : empêche les relances propres du gardien`
        };
        return tactics[category] || tactics.midfielders;
    }

    // Mental / motivation
    if (/mental|motiv|confiance|stress|pression|concentration|focus|psycho/.test(question)) {
        let reply = `🧠 Préparation mentale — ${firstName} :\n\n`;
        reply += `🎯 Avant le match :\n• Visualise tes actions réussies (5min, yeux fermés)\n• Routine d'échauffement identique à chaque fois\n• Musique motivante dans le vestiaire\n• Respiration 4-7-8 pour calmer le stress\n\n`;
        reply += `💪 Pendant le match :\n• Focus sur le prochain ballon, oublie les erreurs\n• Parle à toi-même positivement ("je suis prêt")\n• Objectifs par mi-temps, pas sur 90min\n\n`;
        reply += `📈 Pour progresser :\n• Note 1 point positif après chaque match\n• Regarde tes meilleures vidéos avant un match\n• Célèbre les petites victoires quotidiennes`;
        return reply;
    }

    // Injury prevention
    if (/bless|prévention|échauffement|warm|ischio|adducteur|genou|cheville|muscle/.test(question)) {
        return `🏥 Prévention blessures — ${firstName} :\n\n🔥 Échauffement obligatoire (15min) :\n1. Course légère 5min\n2. Mobilité articulaire (chevilles, genoux, hanches)\n3. Activation musculaire (squats, fentes, skipping)\n4. Accélérations progressives 4x20m\n5. Gestes techniques spécifiques ${pos}\n\n⚠️ Zones à risque pour un ${pos} :\n• Ischio-jambiers (sprints)\n• Adducteurs (changements de direction)\n• Chevilles (terrains irréguliers)\n\n💡 Programme FIFA 11+ :\n• 2x/semaine en échauffement\n• Réduit les blessures de 30-50%\n• 20min : exercices de stabilité et proprioception`;
    }

    // Default / help
    return `🤖 Je suis ton IA Coach, ${firstName} ! Voici ce que je peux faire :\n\n💪 **"Donne-moi des exercices"** — Programme physique personnalisé\n🥗 **"Conseils nutrition"** — Plan alimentaire adapté à ton poste\n🧘 **"Comment récupérer"** — Protocole de récupération\n♟️ **"Conseils tactiques"** — Positionnement et stratégie\n📊 **"Mes stats"** — Analyse de tes performances\n🧠 **"Préparation mentale"** — Gestion du stress et motivation\n🏥 **"Prévention blessures"** — Échauffement et protection\n\nPose-moi n'importe quelle question sur le football ! ⚽`;
}

// AI Recommendation Engine
function generateAIRecommendations(data) {
    const { category, age, rating, matchCount, goals, assists, attendanceRate, recentMatchCount, totalTrainings } = data;
    const recs = [];

    // Physical program based on position
    const physicalPrograms = {
        goalkeepers: [
            { name: 'Réflexes & explosivité', exercises: ['Pliométrie latérale 4x8', 'Plongeons enchaînés 3x10', 'Sprints courts 5m 10x', 'Détente verticale 4x6'], duration: '45 min', frequency: '3x/semaine' },
            { name: 'Souplesse & mobilité', exercises: ['Étirements grand écart', 'Yoga gardien 30min', 'Mobilité hanches', 'Rotation épaules avec élastique'], duration: '30 min', frequency: '4x/semaine' },
            { name: 'Renforcement haut du corps', exercises: ['Pompes claquées 3x12', 'Gainage planche 4x45s', 'Tirage élastique 3x15', 'Boxing pad work 3x3min'], duration: '40 min', frequency: '2x/semaine' }
        ],
        defenders: [
            { name: 'Force & puissance', exercises: ['Squats 4x8 (80% 1RM)', 'Fentes marchées 3x12', 'Soulevé de terre 4x6', 'Hip thrust 3x10'], duration: '50 min', frequency: '3x/semaine' },
            { name: 'Duels aériens', exercises: ['Détente verticale 5x5', 'Box jumps 4x8', 'Headers avec résistance', 'Core anti-rotation 3x12'], duration: '35 min', frequency: '2x/semaine' },
            { name: 'Vitesse de replacement', exercises: ['Navettes 10-20m 8x', 'Course arrière 6x20m', 'Changements direction 5x', 'Sprint-freinage 8x'], duration: '40 min', frequency: '3x/semaine' }
        ],
        midfielders: [
            { name: 'Endurance haute intensité', exercises: ['Interval 30/30 x12', 'Course 4km tempo', 'Fartlek 20min', 'Tabata vélo 4min x3'], duration: '45 min', frequency: '3x/semaine' },
            { name: 'Agilité & coordination', exercises: ['Échelle de rythme 5 patterns', 'Slalom cônes 8x', 'Dribble en espace réduit', 'Jonglage technique 10min'], duration: '35 min', frequency: '4x/semaine' },
            { name: 'Renforcement complet', exercises: ['Circuit training 4 tours', 'Gainage dynamique 3x8', 'Squats bulgares 3x10', 'Pompes TRX 3x12'], duration: '40 min', frequency: '2x/semaine' }
        ],
        attackers: [
            { name: 'Vitesse & accélération', exercises: ['Sprints 30m départ lancé 8x', 'Sprints résistés (élastique) 6x', 'Skipping haute fréquence', 'Réaction signal lumineux 10x'], duration: '40 min', frequency: '3x/semaine' },
            { name: 'Finition sous pression', exercises: ['Frappes enchaînées 5x5', 'Duel 1v1 zones', 'Contrôle-frappe 1 touche', 'Courses profondes + finition'], duration: '45 min', frequency: '4x/semaine' },
            { name: 'Puissance explosive', exercises: ['Squat jump 4x6', 'Lunge jump alternés 3x10', 'Medecine ball throws 3x8', 'Sprint côte 6x'], duration: '35 min', frequency: '2x/semaine' }
        ]
    };

    // Get position-specific program
    const posProgram = physicalPrograms[category] || physicalPrograms.midfielders;
    recs.push({ type: 'programme', title: 'Programme physique personnalisé', items: posProgram });

    // Fitness analysis
    const fitnessNotes = [];
    if (attendanceRate < 70) fitnessNotes.push({ icon: '⚠️', text: `Taux de présence: ${attendanceRate}% — Améliorez votre régularité aux entraînements`, priority: 'high' });
    else if (attendanceRate >= 90) fitnessNotes.push({ icon: '✅', text: `Excellent taux de présence: ${attendanceRate}% — Continuez !`, priority: 'good' });
    else fitnessNotes.push({ icon: '📊', text: `Taux de présence: ${attendanceRate}% — Bon, mais visez 90%+`, priority: 'medium' });

    if (age > 30) {
        fitnessNotes.push({ icon: '🧘', text: 'Priorisez la récupération: yoga, étirements, bains froids après les matchs', priority: 'high' });
        fitnessNotes.push({ icon: '💤', text: 'Sommeil: visez 8-9h/nuit, sieste de 20min l\'après-midi', priority: 'medium' });
    } else if (age < 22) {
        fitnessNotes.push({ icon: '💪', text: 'Période idéale pour le développement musculaire — augmentez la charge progressivement', priority: 'medium' });
        fitnessNotes.push({ icon: '📈', text: 'Potentiel de progression: travaillez les fondamentaux techniques quotidiennement', priority: 'good' });
    }

    if (rating < 5) {
        fitnessNotes.push({ icon: '🎯', text: 'Note en dessous de la moyenne — focus sur les séances individuelles supplémentaires', priority: 'high' });
    } else if (rating >= 7) {
        fitnessNotes.push({ icon: '⭐', text: `Excellente note (${rating}/10) — maintenez cette forme avec de la régularité`, priority: 'good' });
    }

    if (recentMatchCount < 3) {
        fitnessNotes.push({ icon: '🏃', text: 'Peu de temps de jeu récent — intensifiez les entraînements pour rester compétitif', priority: 'medium' });
    }

    recs.push({ type: 'analyse', title: 'Analyse de forme', items: fitnessNotes });

    // Weekly plan suggestion
    const weekPlan = [
        { day: 'Lundi', session: posProgram[0].name, type: 'terrain', intensity: 'Intense' },
        { day: 'Mardi', session: posProgram[2] ? posProgram[2].name : 'Renforcement', type: 'salle', intensity: 'Modéré' },
        { day: 'Mercredi', session: 'Récupération active', type: 'recuperation', intensity: 'Légère' },
        { day: 'Jeudi', session: posProgram[1] ? posProgram[1].name : posProgram[0].name, type: 'terrain', intensity: 'Intense' },
        { day: 'Vendredi', session: 'Tactique collective', type: 'tactique', intensity: 'Modéré' },
        { day: 'Samedi', session: 'Avant-match / Jour de match', type: 'terrain', intensity: age > 30 ? 'Légère' : 'Modéré' },
        { day: 'Dimanche', session: 'Repos complet', type: 'recuperation', intensity: 'Repos' }
    ];
    recs.push({ type: 'planning', title: 'Plan hebdomadaire suggéré', items: weekPlan });

    // Nutrition tips based on position
    const nutritionTips = {
        goalkeepers: ['Protéines: 1.6g/kg/jour pour les réflexes musculaires', 'Oméga-3: poissons gras 3x/semaine pour la concentration', 'Hydratation: 3L/jour minimum'],
        defenders: ['Protéines: 1.8g/kg/jour pour la masse musculaire', 'Créatine: 5g/jour pour la puissance', 'Glucides complexes avant les matchs'],
        midfielders: ['Glucides: 6-8g/kg/jour pour l\'endurance', 'BCAA: avant/après entraînement intense', 'Hydratation: 3.5L/jour — vous parcourez le plus de distance'],
        attackers: ['Protéines: 1.7g/kg/jour pour l\'explosivité', 'Caféine: 200mg avant le match pour la réactivité', 'Glucides rapides: pendant la mi-temps']
    };
    recs.push({ type: 'nutrition', title: 'Conseils nutritionnels', items: nutritionTips[category] || nutritionTips.midfielders });

    return recs;
}

// POST /api/player/setup-account/:id — Admin sets up a player account (protected by admin auth)
router.post('/setup-account/:id', authMiddleware, async (req, res) => {
    try {
        const { email, password, hasAccount } = req.body;
        const player = await Player.findById(req.params.id);
        if (!player) return res.status(404).json({ error: 'Joueur non trouvé' });

        if (hasAccount === false) {
            // Remove account access
            player.hasAccount = false;
            player.email = undefined;
            player.password = undefined;
            await player.save();
            return res.json({ success: true, message: 'Accès supprimé' });
        }

        if (!email || !password || password.length < 6) {
            return res.status(400).json({ error: 'Email et mot de passe requis (min 6 car.)' });
        }

        // Check email not already used by another player
        const existing = await Player.findOne({ email: email.toLowerCase().trim(), _id: { $ne: player._id } });
        if (existing) return res.status(400).json({ error: 'Cet email est déjà utilisé' });

        player.email = email.toLowerCase().trim();
        player.password = password;
        player.hasAccount = true;
        await player.save(); // triggers bcrypt pre-save
        res.json({ success: true, message: 'Compte créé' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ===== NOTIFICATIONS =====
// Helper to broadcast notifications
async function notifyPlayers(filter, data) {
    const players = await Player.find({ ...filter, hasAccount: true }).select('_id').lean();
    const docs = players.map(p => ({ recipient: p._id, ...data }));
    if (docs.length) await PlayerNotification.insertMany(docs);
}

router.get('/notifications', playerAuth, async (req, res) => {
    try {
        const notifs = await PlayerNotification.find({ recipient: req.playerId })
            .sort({ createdAt: -1 }).limit(50).lean();
        const unread = await PlayerNotification.countDocuments({ recipient: req.playerId, read: false });
        res.json({ notifications: notifs, unread });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/notifications/read', playerAuth, async (req, res) => {
    try {
        await PlayerNotification.updateMany({ recipient: req.playerId, read: false }, { read: true });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/notifications/:id/read', playerAuth, async (req, res) => {
    try {
        await PlayerNotification.findOneAndUpdate({ _id: req.params.id, recipient: req.playerId }, { read: true });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== INJURY TRACKING =====
router.get('/injuries', playerAuth, async (req, res) => {
    try {
        const players = await Player.find({ category: { $nin: ['coach', 'staff'] } })
            .select('name number category image fitnessStatus injury injuryDate expectedReturn').lean();
        res.json(players);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/injuries/:id', playerAuth, coachOnly, async (req, res) => {
    try {
        const { fitnessStatus, injury, injuryDate, expectedReturn } = req.body;
        const updates = {};
        if (fitnessStatus) updates.fitnessStatus = fitnessStatus;
        if (injury !== undefined) updates.injury = injury;
        if (injuryDate !== undefined) updates.injuryDate = injuryDate || null;
        if (expectedReturn !== undefined) updates.expectedReturn = expectedReturn || null;
        const p = await Player.findByIdAndUpdate(req.params.id, updates, { new: true })
            .select('name number category image fitnessStatus injury injuryDate expectedReturn').lean();
        if (!p) return res.status(404).json({ error: 'Joueur non trouvé' });

        // Notify the player
        if (fitnessStatus && fitnessStatus !== 'apte') {
            await PlayerNotification.create({
                recipient: req.params.id, type: 'injury',
                title: `Statut mis à jour: ${fitnessStatus}`,
                body: injury || '', icon: 'fas fa-medkit', color: '#e74c3c'
            });
        }
        res.json(p);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== TRAINING ATTENDANCE =====
router.put('/trainings/:id/attendance', playerAuth, coachOnly, async (req, res) => {
    try {
        const { attendance } = req.body;
        const t = await Training.findByIdAndUpdate(req.params.id, { attendance }, { new: true }).lean();
        if (!t) return res.status(404).json({ error: 'Séance non trouvée' });
        res.json({ ...t, id: t._id.toString() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/attendance-stats', playerAuth, async (req, res) => {
    try {
        const player = await Player.findById(req.playerId).lean();
        const sixMonthsAgo = new Date(); sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const trainings = await Training.find({
            date: { $gte: sixMonthsAgo },
            'attendance.playerId': req.playerId
        }).sort({ date: 1 }).lean();

        const stats = trainings.map(t => {
            const att = t.attendance.find(a => a.playerId && a.playerId.toString() === req.playerId.toString());
            return { date: t.date, present: att ? att.present : false, title: t.title, type: t.type };
        });

        const total = stats.length;
        const present = stats.filter(s => s.present).length;
        res.json({ stats, total, present, rate: total > 0 ? Math.round((present / total) * 100) : 100 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== INDIVIDUAL GOALS =====
router.get('/goals', playerAuth, async (req, res) => {
    try {
        const goals = await Goal.find({ player: req.playerId }).sort({ createdAt: -1 }).lean();
        res.json(goals.map(g => ({ ...g, id: g._id.toString() })));
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/goals', playerAuth, async (req, res) => {
    try {
        const { title, target, unit, category, deadline } = req.body;
        if (!title || !target) return res.status(400).json({ error: 'Titre et objectif requis' });
        const g = new Goal({ player: req.playerId, title, target, unit, category, deadline });
        await g.save();
        res.status(201).json({ ...g.toObject(), id: g._id.toString() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/goals/:id', playerAuth, async (req, res) => {
    try {
        const allowed = ['title', 'target', 'current', 'unit', 'category', 'deadline', 'completed'];
        const updates = {};
        for (const k of allowed) { if (req.body[k] !== undefined) updates[k] = req.body[k]; }
        const g = await Goal.findOneAndUpdate({ _id: req.params.id, player: req.playerId }, updates, { new: true }).lean();
        if (!g) return res.status(404).json({ error: 'Objectif non trouvé' });
        res.json({ ...g, id: g._id.toString() });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/goals/:id', playerAuth, async (req, res) => {
    try {
        await Goal.findOneAndDelete({ _id: req.params.id, player: req.playerId });
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== PLAYER COMPARISON =====
router.get('/compare/:id1/:id2', playerAuth, async (req, res) => {
    try {
        const [p1, p2] = await Promise.all([
            Player.findById(req.params.id1).select('-password').lean(),
            Player.findById(req.params.id2).select('-password').lean()
        ]);
        if (!p1 || !p2) return res.status(404).json({ error: 'Joueur non trouvé' });
        res.json({ player1: p1, player2: p2 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ===== PROGRESS STATS (for charts) =====
router.get('/progress', playerAuth, async (req, res) => {
    try {
        const player = await Player.findById(req.playerId).lean();
        if (!player) return res.status(404).json({ error: 'Joueur non trouvé' });

        const matches = await Match.find({ status: 'finished' }).sort({ date: 1 }).lean();
        const playerName = player.name.trim();
        const nameParts = playerName.split(/\s+/);
        const nameVariants = new Set([playerName.toLowerCase()]);
        if (nameParts.length > 1) {
            nameVariants.add(nameParts[nameParts.length - 1].toLowerCase());
            nameVariants.add(nameParts[0].toLowerCase());
        }

        function matchesPlayerName(n) {
            if (!n) return false;
            const en = n.trim().toLowerCase();
            if (nameVariants.has(en)) return true;
            const fullLower = playerName.toLowerCase();
            if (fullLower.includes(en) && en.length >= 3) return true;
            if (en.includes(fullLower)) return true;
            return false;
        }

        const progressData = [];
        let cumGoals = 0, cumAssists = 0, matchCount = 0;

        for (const match of matches) {
            const events = match.events || [];
            let inMatch = false, mGoals = 0, mAssists = 0;
            for (const ev of events) {
                if (matchesPlayerName(ev.player)) { inMatch = true; if (ev.type === 'goal') mGoals++; }
                if (matchesPlayerName(ev.assist)) { inMatch = true; mAssists++; }
            }
            if (inMatch) {
                matchCount++;
                cumGoals += mGoals;
                cumAssists += mAssists;
                progressData.push({
                    date: match.date, matchDay: matchCount,
                    goals: mGoals, assists: mAssists,
                    cumGoals, cumAssists,
                    opponent: match.isHome !== false ? match.awayTeam : match.homeTeam,
                    score: `${match.homeScore}-${match.awayScore}`
                });
            }
        }
        res.json({ progressData, totalMatches: matchCount, totalGoals: cumGoals, totalAssists: cumAssists });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
