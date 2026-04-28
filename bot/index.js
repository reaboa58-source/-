const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

class BotManager {
    constructor() {
        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.GuildMembers,
                GatewayIntentBits.GuildVoiceStates
            ]
        });
        
        this.commands = new Collection();
        this.isRunning = false;
        this.musicQueue = new Map();
        
        this.loadCommands();
        this.setupEvents();
    }
    
    loadCommands() {
        try {
            const commandsPath = path.join(__dirname, 'commands');
            
            if (!fs.existsSync(commandsPath)) {
                console.log('⚠️ مجلد commands غير موجود');
                return;
            }
            
            const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
            
            for (const file of commandFiles) {
                const filePath = path.join(commandsPath, file);
                
                try {
                    delete require.cache[require.resolve(filePath)];
                    const command = require(filePath);
                    
                    if (command.name && command.execute) {
                        this.commands.set(command.name, command);
                        console.log(`✅ تم تحميل: ${command.name}`);
                    }
                } catch (err) {
                    console.error(`❌ خطأ في تحميل ${file}:`, err.message);
                }
            }
            
            console.log(`📦 إجمالي الأوامر: ${this.commands.size}`);
            
        } catch (error) {
            console.error('❌ خطأ في تحميل الأوامر:', error.message);
        }
    }
    
    setupEvents() {
        this.client.once('ready', () => {
            console.log(`🤖 البوت اشتغل! ${this.client.user.tag}`);
            this.isRunning = true;
        });
        
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot || !message.guild) return;
            
            const prefix = process.env.PREFIX || '!';
            if (!message.content.startsWith(prefix)) return;
            
            const args = message.content.slice(prefix.length).trim().split(/ +/);
            const commandName = args.shift().toLowerCase();
            
            const command = this.commands.get(commandName);
            if (!command) return;
            
            try {
                await command.execute(message, args, this.client);
            } catch (error) {
                console.error(`❌ خطأ في ${commandName}:`, error.message);
                message.reply('❌ صار خطأ!').catch(() => {});
            }
        });
        
        this.client.on('error', (err) => {
            console.error('❌ Discord Error:', err.message);
        });
        
        this.client.on('warn', (warn) => {
            console.warn('⚠️ Discord Warning:', warn);
        });
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
            return { success: true, message: '✅ تم التشغيل', tag: this.client.user?.tag };
        } catch (error) {
            console.error('❌ فشل التشغيل:', error.message);
            return { success: false, message: '❌ خطأ: ' + error.message };
        }
    }
    
    async stop() {
        if (!this.isRunning) {
            return { success: false, message: 'البوت موقف' };
        }
        
        try {
            for (const [guildId, queue] of this.musicQueue) {
                const connection = this.client.voice?.connections?.get(guildId);
                if (connection) connection.destroy();
            }
            this.musicQueue.clear();
            
            this.client.destroy();
            this.isRunning = false;
            
            return { success: true, message: '✅ تم الإيقاف' };
        } catch (error) {
            console.error('❌ خطأ في الإيقاف:', error.message);
            return { success: false, message: '❌ خطأ: ' + error.message };
        }
    }
    
    getStatus() {
        return {
            isRunning: this.isRunning,
            tag: this.client.user?.tag || 'غير متصل',
            ping: this.client.ws?.ping || 0,
            guilds: this.client.guilds?.cache?.size || 0,
            users: this.client.users?.cache?.size || 0,
            commands: this.commands.size
        };
    }
    
    getCommands() {
        return Array.from(this.commands.values()).map(cmd => ({
            name: cmd.name,
            description: cmd.description || 'بدون وصف',
            category: cmd.category || 'عام',
            usage: cmd.usage || `!${cmd.name}`
        }));
    }
}

const botManager = new BotManager();
module.exports = botManager;
