const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config');

class BotManager {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers
            ]
        });
        
        this.commands = new Collection();
        this.isRunning = false;
        
        this.loadCommands();
        this.setupEvents();
    }
    
    loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);
            
            if ('name' in command && 'execute' in command) {
                this.commands.set(command.name, command);
                console.log(`✅ تم تحميل الأمر: ${command.name}`);
            } else {
                console.log(`⚠️ الأمر ${file} ناقص خصائص`);
            }
        }
        
        console.log(`📦 إجمالي الأوامر المحملة: ${this.commands.size}`);
    }
    
    setupEvents() {
        this.client.once('ready', () => {
            console.log(`🤖 البوت اشتغل! ${this.client.user.tag}`);
            this.isRunning = true;
        });
        
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot || !message.guild) return;
            
            const prefix = config.prefix;
            if (!message.content.startsWith(prefix)) return;
            
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            
            const command = this.commands.get(commandName);
            if (!command) return;
            
            try {
                await command.execute(message, args, this.client);
            } catch (error) {
                console.error(error);
                await message.reply('❌ صار خطأ في تنفيذ الأمر!');
            }
        });
        
        this.client.on('error', console.error);
        this.client.on('warn', console.warn);
    }
    
    async start() {
        if (this.isRunning) {
            return { success: false, message: 'البوت شغال بالفعل' };
        }
        
        const token = process.env.DISCORD_TOKEN;
        
        if (!token) {
            return { success: false, message: '❌ التوكن فارغ!' };
        }
        
        try {
            await this.client.login(token);
            this.isRunning = true;
            return { success: true, message: '✅ تم تشغيل البوت', tag: this.client.user?.tag };
        } catch (error) {
            console.error('❌ فشل تشغيل البوت:', error.message);
            return { success: false, message: '❌ خطأ: ' + error.message };
        }
    }
    
    async stop() {
        if (!this.isRunning) {
            return { success: false, message: 'البوت موقف بالفعل' };
        }
        
        this.client.destroy();
        this.isRunning = false;
        console.log('🛑 تم إيقاف البوت');
        return { success: true, message: '✅ تم إيقاف البوت' };
    }
    
    getStatus() {
        return {
            isRunning: this.isRunning,
            tag: this.client.user?.tag || 'غير متصل',
            ping: this.client.ws.ping || 0,
            guilds: this.client.guilds.cache.size,
            users: this.client.users.cache.size,
            commands: this.commands.size
        };
    }
    
    getCommands() {
        return Array.from(this.commands.values()).map(cmd => ({
            name: cmd.name,
            description: cmd.description,
            category: cmd.category,
            usage: cmd.usage || `!${cmd.name}`
        }));
    }
}

const botManager = new BotManager();

module.exports = botManager;
