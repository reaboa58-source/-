const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.static('public'));

let bot = null;
let botStatus = 'offline';
let logs = [];
let botToken = '';

function addLog(msg) {
  const time = new Date().toLocaleTimeString('ar-SA');
  logs.push(`[${time}] ${msg}`);
  if (logs.length > 100) logs.shift();
  
  // Send to all WebSocket clients
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'log', message: `[${time}] ${msg}` }));
    }
  });
}

// WebSocket for real-time logs
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'status', status: botStatus }));
  logs.forEach(log => ws.send(JSON.stringify({ type: 'log', message: log })));
});

// API: Start bot
app.post('/api/start', async (req, res) => {
  const { token } = req.body;
  
  if (bot) {
    return res.json({ success: false, error: 'البوت شغال!' });
  }
  
  if (!token || token.length < 50) {
    return res.json({ success: false, error: 'توكن غلط!' });
  }
  
  botToken = token;
  
  try {
    bot = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });
    
    bot.on('ready', () => {
      botStatus = 'online';
      addLog(`✅ ${bot.user.tag} شغال!`);
      broadcastStatus();
    });
    
    bot.on('error', (err) => {
      addLog(`❌ خطأ: ${err.message}`);
    });
    
    bot.on('warn', (warn) => {
      addLog(`⚠️ تحذير: ${warn}`);
    });
    
    await bot.login(token);
    res.json({ success: true });
    
  } catch (err) {
    bot = null;
    botStatus = 'offline';
    addLog(`❌ فشل التشغيل: ${err.message}`);
    broadcastStatus();
    res.json({ success: false, error: err.message });
  }
});

// API: Stop bot
app.post('/api/stop', async (req, res) => {
  if (!bot) {
    return res.json({ success: false, error: 'البوت مو شغال!' });
  }
  
  try {
    await bot.destroy();
    bot = null;
    botStatus = 'offline';
    addLog('🛑 البوت توقف');
    broadcastStatus();
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// API: Get status
app.get('/api/status', (req, res) => {
  res.json({
    status: botStatus,
    tag: bot?.user?.tag || null,
    guilds: bot?.guilds?.cache?.size || 0,
    users: bot?.users?.cache?.size || 0,
    ping: bot?.ws?.ping || 0
  });
});

// API: Get logs
app.get('/api/logs', (req, res) => {
  res.json(logs);
});

function broadcastStatus() {
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'status', status: botStatus }));
    }
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Dashboard: http://localhost:${PORT}`);
});
