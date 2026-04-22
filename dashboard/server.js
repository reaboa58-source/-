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

// حالة البوت
app.get('/api/status', (req, res) => {
    res.json(botManager.getStatus());
});

// قائمة الأوامر
app.get('/api/commands', (req, res) => {
    res.json(botManager.getCommands());
});

// تشغيل البوت (مع توكن من الجسم)
app.post('/api/start', async (req, res) => {
    const { token } = req.body;
    
    // لو جاء توكن من Dashboard، نستخدمه
    if (token) {
        process.env.DISCORD_TOKEN = token;
    }
    
    const result = await botManager.start();
    res.json(result);
});

// إيقاف البوت
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
    console.log('📌 لاحظ: البوت ما يشتغل تلقائياً، اضغط "تشغيل" من Dashboard');
});

// معالجة الأخطاء
process.on('unhandledRejection', console.error);
