const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();
client.reports = new Map();
client.reportCounter = 1;
client.isLoggedIn = false;

// ========== تحميل الأوامر ==========
const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
    console.log('📁 Creating commands folder...');
    fs.mkdirSync(commandsPath, { recursive: true });
}

try {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    console.log(`📁 Found ${commandFiles.length} command files`);

    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);
            
            if (command.name && command.execute) {
                client.commands.set(command.name, command);
                console.log(`✅ Loaded: ${command.name}`);
            } else {
                console.log(`⚠️ Skipped ${file} (missing name or execute)`);
            }
        } catch (err) {
            console.error(`❌ Error loading ${file}:`, err.message);
        }
    }
} catch (err) {
    console.error('❌ Error reading commands folder:', err.message);
}

console.log(`📋 Total commands loaded: ${client.commands.size}`);

// ========== البيانات ==========
const GAMES = [
    { name: 'Mini Games', value: 'minigames', emoji: '' },
    { name: 'Timebomb Duels', value: 'timebombduels', emoji: '' },
];

const REPORT_TYPES = [
    { name: 'سندر (Sender/Exploiter)', value: 'sender', emoji: '' },
    { name: 'أوتو كليك (Auto Clicker)', value: 'autoclick', emoji: '' },
    { name: 'سبام (Spam)', value: 'spam', emoji: '' },
    { name: 'قذف/شتم', value: 'harassment', emoji: '' },
    { name: 'غش/هاك', value: 'hack', emoji: '' },
    { name: 'تخريب', value: 'griefing', emoji: '' },
    { name: 'انتحال شخصية', value: 'impersonation', emoji: '' },
    { name: 'سبب آخر', value: 'other', emoji: '' }
];

// ========== Events ==========
client.once('ready', () => {
    console.log(`🤖 Bot logged in as ${client.user.tag}`);
    console.log(`📊 In ${client.guilds.cache.size} servers`);
    console.log(`📋 Commands: ${client.commands.size}`);
    client.isLoggedIn = true;
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    console.log(`📩 Command: ${commandName}`);
    
    const command = client.commands.get(commandName);
    if (!command) {
        console.log(`❌ Not found: ${commandName}`);
        return;
    }
    
    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`❌ Error in ${commandName}:`, error);
        message.reply('❌ حصل خطأ!').catch(() => {});
    }
});

client.on('interactionCreate', async (interaction) => {
    try {
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_game') {
            const selectedGame = GAMES.find(g => g.value === interaction.values[0]);
            
            const modal = new ModalBuilder()
                .setCustomId(`report_info_${selectedGame.value}`)
                .setTitle(`🎮 ${selectedGame.name}`);

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('roblox_username').setLabel('Roblox Username').setStyle(TextInputStyle.Short).setPlaceholder('RobloxPro123').setRequired(true).setMaxLength(50)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('display_name').setLabel('Display Name').setStyle(TextInputStyle.Short).setPlaceholder('الاسم الظاهر').setRequired(false).setMaxLength(50)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('report_details').setLabel('التفاصيل').setStyle(TextInputStyle.Paragraph).setPlaceholder('اشرح المخالفة...').setRequired(true).setMaxLength(1000)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder().setCustomId('evidence').setLabel('رابط دليل (اختياري)').setStyle(TextInputStyle.Short).setPlaceholder('https://...').setRequired(false).setMaxLength(200)
                )
            );

            await interaction.showModal(modal);
        }

        if (interaction.isModalSubmit() && interaction.customId.startsWith('report_info_')) {
            const gameValue = interaction.customId.replace('report_info_', '');
            const game = GAMES.find(g => g.value === gameValue);
            
            const robloxUser = interaction.fields.getTextInputValue('roblox_username');
            const displayName = interaction.fields.getTextInputValue('display_name') || 'غير محدد';
            const details = interaction.fields.getTextInputValue('report_details');
            const evidence = interaction.fields.getTextInputValue('evidence') || 'لا يوجد';

            client.reports.set(interaction.user.id, {
                reporter: interaction.user.id,
                reporterTag: interaction.user.tag,
                game: game.name,
                robloxUser,
                displayName,
                details,
                evidence
            });

            const typeSelect = new StringSelectMenuBuilder()
                .setCustomId('select_report_type')
                .setPlaceholder('⚠️ نوع المخالفة...')
                .addOptions(REPORT_TYPES.map(t => new StringSelectMenuOptionBuilder().setLabel(t.name).setValue(t.value).setEmoji(t.emoji)));

            await interaction.reply({
                embeds: [new EmbedBuilder().setColor('#ffaa00').setTitle('⚠️ اختر نوع المخالفة').setDescription(`**الشخص:** ${robloxUser}\n**اللعبة:** ${game.name}`)],
                components: [new ActionRowBuilder().addComponents(typeSelect)],
                ephemeral: true
            });
        }

        if (interaction.isStringSelectMenu() && interaction.customId === 'select_report_type') {
            const selectedType = REPORT_TYPES.find(t => t.value === interaction.values[0]);
            const temp = client.reports.get(interaction.user.id);
            
            if (!temp) {
                return interaction.reply({ content: '❌ انتهت الجلسة! ابدأ بـ `!report`', ephemeral: true });
            }

            const reportId = client.reportCounter++;
            const final = { 
                id: reportId, 
                ...temp, 
                type: selectedType.name, 
                status: '⏳ قيد المراجعة', 
                timestamp: Date.now() 
            };
            
            client.reports.set(`report_${reportId}`, final);
            client.reports.delete(interaction.user.id);

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`🚨 بلاغ #${reportId}`)
                .addFields(
                    { name: ' اللعبة', value: final.game, inline: true },
                    { name: ' الفضيحه', value: final.type, inline: true },
                    { name: ' الحالة', value: final.status, inline: true },
                    { name: ' المبلغ عنه', value: `\`${final.robloxUser}\``, inline: false },
                    { name: ' الاسم الظاهر', value: final.displayName, inline: true },
                    { name: ' التفاصيل', value: final.details, inline: false }
                )
                .setFooter({ text: `مقدم: ${final.reporterTag}` })
                .setTimestamp();

            if (final.evidence !== 'لا يوجد') {
                embed.addFields({ name: '📎 دليل', value: final.evidence, inline: false });
            }

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`accept_${reportId}`).setLabel('✅ قبول').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`reject_${reportId}`).setLabel('❌ رفض').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`investigate_${reportId}`).setLabel('🔍 تحقيق').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`ban_${reportId}`).setLabel('🔨 حظر').setStyle(ButtonStyle.Secondary)
            );

            const channel = interaction.guild.channels.cache.find(
                ch => ch.name.includes('reports') || ch.name.includes('بلاغات') || ch.name.includes('roblox')
            );

            if (channel) {
                await channel.send({
                    content: `📢 بلاغ جديد من <@${final.reporter}>`,
                    embeds: [embed],
                    components: [buttons]
                });
            }

            await interaction.update({
                embeds: [new EmbedBuilder().setColor('#00ff00').setTitle('✅ تم الإرسال!').setDescription(`رقم: \`#${reportId}\``).addFields({ name: '🎮 اللعبة', value: final.game, inline: true }, { name: '⚠️ المخالفة', value: final.type, inline: true })],
                components: []
            });
        }

        if (interaction.isButton()) {
            const [action, reportId] = interaction.customId.split('_');
            const report = client.reports.get(`report_${reportId}`);
            
            if (!report) {
                return interaction.reply({ content: '❌ البلاغ غير موجود!', ephemeral: true });
            }

            const reporter = await interaction.guild.members.fetch(report.reporter).catch(() => null);

            if (action === 'accept') {
                report.status = '✅ مقبول';
                await interaction.update({ components: [] });
                await interaction.message.reply(`✅ تم قبول البلاغ #${reportId} بواسطة ${interaction.user}`);
                if (reporter) await reporter.send(`✅ بلاغك #${reportId} تم قبوله!`).catch(() => {});
            }
            
            if (action === 'reject') {
                report.status = '❌ مرفوض';
                await interaction.update({ components: [] });
                await interaction.message.reply(`❌ تم رفض البلاغ #${reportId} بواسطة ${interaction.user}`);
                if (reporter) await reporter.send(`❌ بلاغك #${reportId} تم رفضه.`).catch(() => {});
            }
            
            if (action === 'investigate') {
                report.status = '🔍 قيد التحقيق';
                await interaction.message.reply(`🔍 ${interaction.user} يحقق في البلاغ #${reportId}...`);
            }
            
            if (action === 'ban') {
                report.status = '🔨 محظور';
                await interaction.message.reply(`🔨 تم حظر ${report.robloxUser} بواسطة ${interaction.user}`);
                if (reporter) await reporter.send(`🎉 ${report.robloxUser} تم حظره بسبب بلاغك #${reportId}!`).catch(() => {});
            }
        }

    } catch (error) {
        console.error('Interaction error:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: '❌ حصل خطأ!', ephemeral: true }).catch(() => {});
        }
    }
});

// ========== دوال التحكم ==========
client.loginWithToken = async (token) => {
    try {
        if (client.isLoggedIn) {
            return { success: true, message: 'البوت شغال!' };
        }
        await client.login(token);
        return { success: true, message: '✅ تم التشغيل!' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: '❌ توكن غلط!' };
    }
};

client.logoutBot = async () => {
    try {
        if (!client.isLoggedIn) {
            return { success: false, message: 'البوت مو شغال!' };
        }
        await client.destroy();
        client.isLoggedIn = false;
        return { success: true, message: '⏹️ تم الإيقاف!' };
    } catch (error) {
        return { success: false, message: '❌ خطأ!' };
    }
};

client.getBotStatus = () => {
    return {
        isRunning: client.isLoggedIn && client.user ? true : false,
        ping: client.ws?.ping || 0,
        guilds: client.guilds?.cache?.size || 0,
        users: client.users?.cache?.size || 0,
        commands: client.commands?.size || 0
    };
};

client.getBotCommands = () => {
    return Array.from(client.commands.values()).map(cmd => ({
        name: cmd.name,
        description: cmd.description || 'No description',
        category: cmd.category || 'General',
        usage: cmd.usage || `!${cmd.name}`
    }));
};

console.log('⏳ Waiting for token from Dashboard...');

module.exports = client;
