const express = require('express');
const path = require('path');
const botManager = require('../bot/index');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
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
    
    if (token) {
        process.env.DISCORD_TOKEN = token;
    }
    
    const result = await botManager.start();
    res.json(result);
});

app.post('/api/stop', async (req, res) => {
    const result = await botManager.stop();
    res.json(result);
});

// ======== Page Route ========

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ======== Start Server ========

app.listen(PORT, () => {
    console.log(`🌐 Dashboard شغال على: http://localhost:${PORT}`);
});

process.on('unhandledRejection', console.error);
