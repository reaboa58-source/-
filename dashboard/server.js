const express = require('express');
const path = require('path');
const botManager = require('../bot/index');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ======== API Routes ========

app.get('/api/status', (req, res) => {
    res.json(botManager.getStatus());
});

app.get('/api/commands', (req, res) => {
    res.json(botManager.getCommands());
});

app.post('/api/start', async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.json({ success: false, message: '❌ التوكن فارغ!' });
    }
    process.env.DISCORD_TOKEN = token;
    try {
        const result = await botManager.start(token);
        res.json(result);
    } catch (error) {
        res.json({ success: false, message: '❌ خطأ: ' + error.message });
    }
});

app.post('/api/stop', async (req, res) => {
    try {
        const result = await botManager.stop();
        res.json(result);
    } catch (error) {
        res.json({ success: false, message: '❌ خطأ: ' + error.message });
    }
});

// ======== Music API (بدون Lavalink) ========

app.post('/api/music/play', (req, res) => {
    res.json({ success: true, message: 'Use !play in Discord' });
});

app.post('/api/music/stop', (req, res) => {
    res.json({ success: true, message: 'Use !stop in Discord' });
});

app.post('/api/music/skip', (req, res) => {
    res.json({ success: true, message: 'Use !skip in Discord' });
});

app.get('/api/music/queue', (req, res) => {
    res.json({ queue: [] });
});

// ======== Page Route ========

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ======== Start Server ========

app.listen(PORT, () => {
    console.log(`🌐 Dashboard شغال على البورت: ${PORT}`);
});

process.on('unhandledRejection', console.error);
