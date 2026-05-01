const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// تحميل البوت (بدون تسجيل دخول)
const client = require('../bot/index');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== API Routes ==========

// حالة البوت
app.get('/api/status', (req, res) => {
    res.json(client.getBotStatus());
});

// قائمة الأوامر
app.get('/api/commands', (req, res) => {
    res.json(client.getBotCommands());
});

// تشغيل البوت
app.post('/api/start', async (req, res) => {
    const { token } = req.body;
    if (!token) {
        return res.json({ success: false, message: '❌ التوكن فارغ!' });
    }
    const result = await client.loginWithToken(token);
    res.json(result);
});

// إيقاف البوت
app.post('/api/stop', async (req, res) => {
    const result = await client.logoutBot();
    res.json(result);
});

// صفحة رئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Dashboard: ${PORT}`);
});
