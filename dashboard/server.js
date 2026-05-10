// dashboard/server.js
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));
// بعد:
let bot = null;
try {
  bot = require('../bot');
} catch (e) {
  console.log('Bot not started yet');
}
// متغير التوكن (مؤقت)
let botToken = null;
let botClient = null;

// تشغيل البوت
app.post('/api/start-bot', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });
  
  botToken = token;
  
  // تشغيل البوت هنا
  const { Client, GatewayIntentBits } = require('discord.js');
  botClient = new Client({ intents: [GatewayIntentBits.Guilds] });
  
  botClient.once('ready', () => {
    console.log(`Bot started: ${botClient.user.tag}`);
  });
  
  botClient.login(token).catch(err => {
    return res.status(400).json({ error: 'Invalid token' });
  });
  
  res.json({ success: true, message: 'Bot started' });
});

// إيقاف البوت
app.post('/api/stop-bot', (req, res) => {
  if (botClient) {
    botClient.destroy();
    botClient = null;
    botToken = null;
  }
  res.json({ success: true });
});

// حالة البوت
app.get('/api/bot-status', (req, res) => {
  res.json({ 
    running: !!botClient,
    user: botClient?.user?.tag || null
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Dashboard running on port ${PORT}`);
});
