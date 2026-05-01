const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// تشغيل البوت
try {
    require('../bot/index');
    console.log('🤖 Bot module loaded');
} catch (err) {
    console.error('❌ Bot load error:', err.message);
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌐 Dashboard: ${PORT}`);
});
