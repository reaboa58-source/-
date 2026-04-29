const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// إعدادات البوت
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

// تخزين الأوامر
client.commands = new Collection();
client.musicQueue = new Map();

// تحميل الأوامر
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
        console.log(`✅ Loaded command: ${command.name}`);
    } else {
        console.log(`⚠️ Command ${file} missing required properties`);
    }
}

// Prefix
const PREFIX = '!';

// Event: Ready
client.once('ready', () => {
    console.log(`🤖 Bot logged in as ${client.user.tag}`);
    console.log(`📊 In ${client.guilds.cache.size} servers`);
});

// Event: Message Create
client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(PREFIX)) return;

    const args = message.content.slice(PREFIX.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`Error executing ${commandName}:`, error);
        message.reply('❌ حصل خطأ أثناء تنفيذ الأمر!');
    }
});

// ========== Bot Manager ==========

let isRunning = false;

function getStatus() {
    return {
        isRunning: isRunning && client.isReady(),
        ping: client.ws.ping || 0,
        guilds: client.guilds?.cache?.size || 0,
        users: client.users?.cache?.size || 0,
        commands: client.commands?.size || 0
    };
}

function getCommands() {
    return Array.from(client.commands.values()).map(cmd => ({
        name: cmd.name,
        description: cmd.description || 'No description',
        category: cmd.category || 'General',
        usage: cmd.usage || `!${cmd.name}`
    }));
}

async function start(token) {
    if (isRunning) {
        return { success: false, message: 'البوت شغال بالفعل!' };
    }

    try {
        await client.login(token);
        isRunning = true;
        return { success: true, message: '✅ البوت اشتغل!' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: '❌ خطأ في التوكن: ' + error.message };
    }
}

async function stop() {
    if (!isRunning) {
        return { success: false, message: 'البوت مو شغال!' };
    }

    try {
        // طلع من كل الرومات الصوتية
        client.musicQueue?.clear();
        
        // Destroy all voice connections
        const { getVoiceConnection } = require('@discordjs/voice');
        client.guilds.cache.forEach(guild => {
            const connection = getVoiceConnection(guild.id);
            if (connection) connection.destroy();
        });

        await client.destroy();
        isRunning = false;
        return { success: true, message: '⏹️ البوت توقف!' };
    } catch (error) {
        return { success: false, message: '❌ خطأ: ' + error.message };
    }
}

module.exports = {
    start,
    stop,
    getStatus,
    getCommands
};
