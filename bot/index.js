const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');

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
        this.tickets = new Map(); // حفظ التكتات
        
        this.loadCommands();
        this.setupEvents();
        this.setupInteractions();
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
            
            const prefix = process.env.PREFIX || '!';
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
    }
    
    setupInteractions() {
        // التفاعل مع الأزرار
        this.client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isButton()) return;
            
            const { customId, guild, user, channel } = interaction;
            
            // فتح تكت
            if (customId === 'open_ticket') {
                await this.openTicket(interaction);
            }
            // إغلاق تكت
            else if (customId === 'close_ticket') {
                await this.closeTicket(interaction);
            }
            // تغيير الاسم
            else if (customId === 'rename_ticket') {
                await this.renameTicket(interaction);
            }
            // استلام
            else if (customId === 'claim_ticket') {
                await this.claimTicket(interaction);
            }
            // إضافة عضو
            else if (customId === 'add_member') {
                await this.addMember(interaction);
            }
            // إزالة عضو
            else if (customId === 'remove_member') {
                await this.removeMember(interaction);
            }
            // أرشفة
            else if (customId === 'archive_ticket') {
                await this.archiveTicket(interaction);
            }
        });
    }
    
    // فتح تكت جديد
    async openTicket(interaction) {
        const guild = interaction.guild;
        const user = interaction.user;
        
        // التحقق من عدم وجود تكت مفتوحة
        const existingTicket = guild.channels.cache.find(
            ch => ch.name === `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`
        );
        
        if (existingTicket) {
            return interaction.reply({ 
                content: '❌ لديك تذكرة مفتوحة بالفعل!', 
                ephemeral: true 
            });
        }
        
        // إنشاء قناة التكت
        const ticketChannel = await guild.channels.create({
            name: `ticket-${user.username.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            type: ChannelType.GuildText,
            parent: null, // يمكنك تحديد كاتيجوري
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                        PermissionFlagsBits.ReadMessageHistory
                    ]
                }
            ]
        });
        
        // حفظ التكت
        this.tickets.set(ticketChannel.id, {
            creator: user.id,
            claimedBy: null,
            createdAt: Date.now()
        });
        
        // إرسال رسالة التحكم
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🎫 تذكرة جديدة')
            .setDescription(`مرحباً ${user}!\nالموظفون سيساعدونك قريباً.`)
            .addFields(
                { name: 'الحالة', value: '⏳ في الانتظار', inline: true },
                { name: 'المستلم', value: 'غير مستلم', inline: true }
            )
            .setTimestamp();
        
        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('claim_ticket')
                    .setLabel('👤 استلام')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('🔒 إغلاق')
                    .setStyle(ButtonStyle.Danger)
            );
        
        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('rename_ticket')
                    .setLabel('✏️ تغيير الاسم')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('add_member')
                    .setLabel('➕ إضافة عضو')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('remove_member')
                    .setLabel('➖ إزالة عضو')
                    .setStyle(ButtonStyle.Secondary)
            );
        
        const row3 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('archive_ticket')
                    .setLabel('📁 أرشفة')
                    .setStyle(ButtonStyle.Primary)
            );
        
        await ticketChannel.send({ 
            content: `${user}`,
            embeds: [embed], 
            components: [row1, row2, row3] 
        });
        
        await interaction.reply({ 
            content: `✅ تم فتح تذكرتك: ${ticketChannel}`, 
            ephemeral: true 
        });
    }
    
    // استلام التكت
    async claimTicket(interaction) {
        const ticket = this.tickets.get(interaction.channel.id);
        if (!ticket) return;
        
        if (ticket.claimedBy) {
            return interaction.reply({ 
                content: '❌ التذكرة مستلمة بالفعل!', 
                ephemeral: true 
            });
        }
        
        ticket.claimedBy = interaction.user.id;
        
        // إضافة صلاحيات للمستلم
        await interaction.channel.permissionOverwrites.create(interaction.user, {
            ViewChannel: true,
            SendMessages: true,
            ReadMessageHistory: true
        });
        
        // تحديث الرسالة
        const messages = await interaction.channel.messages.fetch({ limit: 10 });
        const botMessage = messages.find(m => m.author.id === this.client.user.id && m.embeds.length > 0);
        
        if (botMessage) {
            const embed = EmbedBuilder.from(botMessage.embeds[0])
                .spliceFields(0, 2)
                .addFields(
                    { name: 'الحالة', value: '👤 مستلم', inline: true },
                    { name: 'المستلم', value: `${interaction.user}`, inline: true }
                );
            
            await botMessage.edit({ embeds: [embed] });
        }
        
        await interaction.reply({ 
            content: `✅ تم استلام التذكرة بواسطة ${interaction.user}`, 
            ephemeral: false 
        });
    }
    
    // إغلاق التكت
    async closeTicket(interaction) {
        const ticket = this.tickets.get(interaction.channel.id);
        if (!ticket) return;
        
        await interaction.reply('🔒 جاري إغلاق التذكرة...');
        
        // حذف من الذاكرة
        this.tickets.delete(interaction.channel.id);
        
        // حذف القناة بعد 5 ثواني
        setTimeout(async () => {
            await interaction.channel.delete().catch(() => {});
        }, 5000);
    }
    
    // تغيير الاسم
    async renameTicket(interaction) {
        const ticket = this.tickets.get(interaction.channel.id);
        if (!ticket) return;
        
        // إنشاء مودال
        const modal = new ModalBuilder()
            .setCustomId('rename_modal')
            .setTitle('تغيير اسم التذكرة');
        
        const nameInput = new TextInputBuilder()
            .setCustomId('new_name')
            .setLabel('الاسم الجديد')
            .setPlaceholder('مثال: مشكلة-فنية')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(100);
        
        const row = new ActionRowBuilder().addComponents(nameInput);
        modal.addComponents(row);
        
        await interaction.showModal(modal);
        
        // انتظار الرد
        const submitted = await interaction.awaitModalSubmit({
            time: 60000,
            filter: i => i.customId === 'rename_modal'
        }).catch(() => null);
        
        if (submitted) {
            const newName = submitted.fields.getTextInputValue('new_name');
            await interaction.channel.setName(`ticket-${newName}`);
            await submitted.reply({ content: `✅ تم تغيير الاسم إلى: ${newName}`, ephemeral: true });
        }
    }
    
    // إضافة عضو
    async addMember(interaction) {
        await interaction.reply({
            content: 'استخدم: `!adduser @عضو` لإضافة عضو للتذكرة',
            ephemeral: true
        });
    }
    
    // إزالة عضو
    async removeMember(interaction) {
        await interaction.reply({
            content: 'استخدم: `!removeuser @عضو` لإزالة عضو من التذكرة',
            ephemeral: true
        });
    }
    
    // أرشفة
    async archiveTicket(interaction) {
        const ticket = this.tickets.get(interaction.channel.id);
        if (!ticket) return;
        
        await interaction.reply('📁 جاري أرشفة التذكرة...');
        
        // تغيير الصلاحيات (قراءة فقط)
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
            ViewChannel: false
        });
        
        // إزالة جميع الصلاحيات الخاصة
        const members = await interaction.channel.members;
        for (const [id, member] of members) {
            if (!member.user.bot) {
                await interaction.channel.permissionOverwrites.delete(id);
            }
        }
        
        // تغيير الاسم
        await interaction.channel.setName(`archived-${interaction.channel.name}`);
        
        // إرسال رسالة تأكيد
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('📁 تذكرة مؤرشفة')
            .setDescription('تم أرشفة هذه التذكرة. لا يمكن التعديل عليها.')
            .setTimestamp();
        
        await interaction.channel.send({ embeds: [embed] });
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
