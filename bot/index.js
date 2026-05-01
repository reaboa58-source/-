const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config'); // ✅ استخدام config.js

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
    { name: 'Mini Games', value: 'minigames', emoji: '🎮' },
    { name: 'Timebomb Duels', value: 'timebombduels', emoji: '💣' },
    { name: 'Flee the Facility', value: 'fleethefacility', emoji: '🏃' },
    { name: 'Murder Mystery 2', value: 'murdermystery2', emoji: '🔪' },
    { name: 'Adopt Me', value: 'adoptme', emoji: '🐾' },
    { name: 'Blox Fruits', value: 'bloxfruits', emoji: '🍎' },
    { name: 'BedWars', value: 'bedwars', emoji: '🛏️' },
    { name: 'Doors', value: 'doors', emoji: '🚪' },
    { name: 'Tower of Hell', value: 'towerofhell', emoji: '🏗️' },
    { name: 'لعبة أخرى', value: 'other', emoji: '❓' }
];

const REPORT_TYPES = [
    { name: 'سندر (Sender/Exploiter)', value: 'sender', emoji: '🤖' },
    { name: 'أوتو كليك (Auto Clicker)', value: 'autoclick', emoji: '⚡' },
    { name: 'سبام (Spam)', value: 'spam', emoji: '💬' },
    { name: 'قذف/شتم', value: 'harassment', emoji: '😡' },
    { name: 'غش/هاك', value: 'hack', emoji: '💻' },
    { name: 'تخريب', value: 'griefing', emoji: '🔨' },
    { name: 'انتحال شخصية', value: 'impersonation', emoji: '🎭' },
    { name: 'سبب آخر', value: 'other', emoji: '❓' }
];

// ========== Events ==========
client.once('ready', () => {
    console.log(`🤖 Bot logged in as ${client.user.tag}`);
    console.log(`📊 In ${client.guilds.cache.size} servers`);
    console.log(`📋 Commands: ${client.commands.size}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith(config.prefix)) return; // ✅ استخدام prefix من config
    
    const args = message.content.slice(config.prefix.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    
    console.log(`📩 Command received: ${commandName}`);
    
    const command = client.commands.get(commandName);
    if (!command) {
        console.log(`❌ Command not found: ${commandName}`);
        return;
    }
    
    try {
        console.log(`▶️ Executing: ${commandName}`);
        await command.execute(message, args, client);
        console.log(`✅ Done: ${commandName}`);
    } catch (error) {
        console.error(`❌ Error in ${commandName}:`, error);
        message.reply('❌ حصل خطأ أثناء تنفيذ الأمر!').catch(() => {});
    }
});

client.on('interactionCreate', async (interaction) => {
    try {
        // اختيار اللعبة
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_game') {
            const selectedGame = GAMES.find(g => g.value === interaction.values[0]);
            
            const modal = new ModalBuilder()
                .setCustomId(`report_info_${selectedGame.value}`)
                .setTitle(`🎮 ${selectedGame.name}`);

            const robloxUserInput = new TextInputBuilder()
                .setCustomId('roblox_username')
                .setLabel('Roblox Username')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('RobloxPro123')
                .setRequired(true)
                .setMaxLength(50);

            const displayNameInput = new TextInputBuilder()
                .setCustomId('display_name')
                .setLabel('Display Name')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('الاسم الظاهر فوق الرأس')
                .setRequired(false)
                .setMaxLength(50);

            const detailsInput = new TextInputBuilder()
                .setCustomId('report_details')
                .setLabel('تفاصيل المخالفة')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('اشرح بالتفصيل ايش سوى...')
                .setRequired(true)
                .setMaxLength(1000);

            const evidenceInput = new TextInputBuilder()
                .setCustomId('evidence')
                .setLabel('رابط صورة/فيديو (اختياري)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://...')
                .setRequired(false)
                .setMaxLength(200);

            modal.addComponents(
                new ActionRowBuilder().addComponents(robloxUserInput),
                new ActionRowBuilder().addComponents(displayNameInput),
                new ActionRowBuilder().addComponents(detailsInput),
                new ActionRowBuilder().addComponents(evidenceInput)
            );

            await interaction.showModal(modal);
        }

        // استلام معلومات البلاغ
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
                .setPlaceholder('⚠️ اختر نوع المخالفة...')
                .addOptions(REPORT_TYPES.map(t => new StringSelectMenuOptionBuilder()
                    .setLabel(t.name)
                    .setValue(t.value)
                    .setEmoji(t.emoji)
                ));

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ffaa00')
                    .setTitle('⚠️ اختر نوع المخالفة')
                    .setDescription(`**الشخص:** ${robloxUser}\n**اللعبة:** ${game.name}`)
                ],
                components: [new ActionRowBuilder().addComponents(typeSelect)],
                ephemeral: true
            });
        }

        // اختيار نوع المخالفة
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_report_type') {
            const selectedType = REPORT_TYPES.find(t => t.value === interaction.values[0]);
            const temp = client.reports.get(interaction.user.id);
            
            if (!temp) {
                return interaction.reply({ 
                    content: '❌ انتهت الجلسة! ابدأ من جديد بـ `!report`', 
                    ephemeral: true 
                });
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
                    { name: '🎮 اللعبة', value: final.game, inline: true },
                    { name: '⚠️ المخالفة', value: final.type, inline: true },
                    { name: '📊 الحالة', value: final.status, inline: true },
                    { name: '👤 المبلغ عنه', value: `\`${final.robloxUser}\``, inline: false },
                    { name: '🏷️ الاسم الظاهر', value: final.displayName, inline: true },
                    { name: '📝 التفاصيل', value: final.details, inline: false }
                )
                .setFooter({ text: `مقدم البلاغ: ${final.reporterTag}` })
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
                embeds: [new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('✅ تم إرسال البلاغ!')
                    .setDescription(`رقم البلاغ: \`#${reportId}\``)
                    .addFields(
                        { name: '🎮 اللعبة', value: final.game, inline: true },
                        { name: '⚠️ المخالفة', value: final.type, inline: true }
                    )
                ],
                components: []
            });
        }

        // أزرار الإدارة
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
                await interaction.message.reply(`✅ تم **قبول** البلاغ #${reportId} بواسطة ${interaction.user}`);
                if (reporter) await reporter.send(`✅ بلاغك #${reportId} تم قبوله!`).catch(() => {});
            }
            
            if (action === 'reject') {
                report.status = '❌ مرفوض';
                await interaction.update({ components: [] });
                await interaction.message.reply(`❌ تم **رفض** البلاغ #${reportId} بواسطة ${interaction.user}`);
                if (reporter) await reporter.send(`❌ بلاغك #${reportId} تم رفضه.`).catch(() => {});
            }
            
            if (action === 'investigate') {
                report.status = '🔍 قيد التحقيق';
                await interaction.message.reply(`🔍 ${interaction.user} يحقق في البلاغ #${reportId}...`);
            }
            
            if (action === 'ban') {
                report.status = '🔨 محظور';
                await interaction.message.reply(`🔨 تم **حظر** ${report.robloxUser} بواسطة ${interaction.user}`);
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

// ✅ استخدام التوكن من config.js
client.login(config.token);
