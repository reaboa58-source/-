const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
        console.log(`✅ Loaded command: ${command.name}`);
    }
}

// ========== الألعاب والأنواع ==========
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

// ========== Event: Ready ==========
client.once('ready', () => {
    console.log(`🤖 Bot logged in as ${client.user.tag}`);
    console.log(`📊 In ${client.guilds.cache.size} servers`);
    console.log(`📋 Loaded ${client.commands.size} commands`);
});

// ========== Command Handler ==========
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);
    if (!command) return;

    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(`Error executing ${commandName}:`, error);
        message.reply('❌ حصل خطأ!');
    }
});

// ========== Interaction Handler ==========
client.on('interactionCreate', async (interaction) => {
    try {
        // اختيار اللعبة
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_game') {
            const selectedGame = GAMES.find(g => g.value === interaction.values[0]);

            const modal = new ModalBuilder()
                .setCustomId(`report_info_${selectedGame.value}`)
                .setTitle(`🎮 بلاغ - ${selectedGame.name}`);

            const robloxUserInput = new TextInputBuilder()
                .setCustomId('roblox_username')
                .setLabel('اسم المستخدم في Roblox')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('مثال: RobloxPro123...')
                .setRequired(true)
                .setMaxLength(50);

            const displayNameInput = new TextInputBuilder()
                .setCustomId('display_name')
                .setLabel('الاسم الظاهر (Display Name)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('الاسم اللي يظهر فوق الرأس...')
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

            const tempReport = {
                reporter: interaction.user.id,
                reporterTag: interaction.user.tag,
                game: game.name,
                gameValue: game.value,
                robloxUser: robloxUser,
                displayName: displayName,
                details: details,
                evidence: evidence
            };

            client.reports.set(interaction.user.id, tempReport);

            const typeSelect = new StringSelectMenuBuilder()
                .setCustomId('select_report_type')
                .setPlaceholder('⚠️ اختر نوع المخالفة...')
                .addOptions(
                    REPORT_TYPES.map(type => new StringSelectMenuOptionBuilder()
                        .setLabel(type.name)
                        .setValue(type.value)
                        .setEmoji(type.emoji)
                    )
                );

            const row = new ActionRowBuilder().addComponents(typeSelect);

            const embed = new EmbedBuilder()
                .setColor('#ffaa00')
                .setTitle('⚠️ اختر نوع المخالفة')
                .setDescription(`**الشخص:** ${robloxUser}\n**اللعبة:** ${game.name}\n\nاختر نوع المخالفة:`)
                .setTimestamp();

            await interaction.reply({
                embeds: [embed],
                components: [row],
                ephemeral: true
            });
        }

        // اختيار نوع المخالفة
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_report_type') {
            const selectedType = REPORT_TYPES.find(t => t.value === interaction.values[0]);
            const tempReport = client.reports.get(interaction.user.id);

            if (!tempReport) {
                return interaction.reply({
                    content: '❌ انتهت الجلسة! ابدأ من جديد بـ `!report`',
                    ephemeral: true
                });
            }

            const reportId = client.reportCounter++;
            const finalReport = {
                id: reportId,
                ...tempReport,
                type: selectedType.name,
                typeValue: selectedType.value,
                status: '⏳ قيد المراجعة',
                timestamp: Date.now()
            };

            client.reports.set(`report_${reportId}`, finalReport);
            client.reports.delete(interaction.user.id);

            const reportEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`🚨 بلاغ #${reportId}`)
                .addFields(
                    { name: '🎮 اللعبة', value: finalReport.game, inline: true },
                    { name: '⚠️ نوع المخالفة', value: finalReport.type, inline: true },
                    { name: '📊 الحالة', value: finalReport.status, inline: true },
                    { name: '👤 المبلغ عنه', value: `\`${finalReport.robloxUser}\``, inline: false },
                    { name: '🏷️ الاسم الظاهر', value: finalReport.displayName, inline: true },
                    { name: '📝 التفاصيل', value: finalReport.details, inline: false }
                )
                .setFooter({ text: `مقدم البلاغ: ${finalReport.reporterTag} | ID: ${finalReport.reporter}` })
                .setTimestamp();

            if (finalReport.evidence !== 'لا يوجد') {
                reportEmbed.addFields({ name: '📎 دليل', value: finalReport.evidence, inline: false });
            }

            const adminButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`accept_${reportId}`)
                    .setLabel('✅ قبول')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`reject_${reportId}`)
                    .setLabel('❌ رفض')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`investigate_${reportId}`)
                    .setLabel('🔍 تحقيق')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`ban_${reportId}`)
                    .setLabel('🔨 حظر')
                    .setStyle(ButtonStyle.Secondary)
            );

            const reportChannel = interaction.guild.channels.cache.find(
                ch => ch.name.includes('reports') || 
                      ch.name.includes('بلاغات') || 
                      ch.name.includes('roblox-reports')
            );

            if (reportChannel) {
                await reportChannel.send({
                    content: `📢 بلاغ جديد من <@${finalReport.reporter}>`,
                    embeds: [reportEmbed],
                    components: [adminButtons]
                });
            }

            const confirmEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ تم إرسال البلاغ!')
                .setDescription(`رقم البلاغ: \`#${reportId}\`\nتم إرساله للإدارة.`)
                .addFields(
                    { name: '🎮 اللعبة', value: finalReport.game, inline: true },
                    { name: '⚠️ المخالفة', value: finalReport.type, inline: true }
                )
                .setTimestamp();

            await interaction.update({
                embeds: [confirmEmbed],
                components: []
            });
        }

        // أزرار الإدارة
        if (interaction.isButton()) {
            const [action, reportId] = interaction.customId.split('_');
            const report = client.reports.get(`report_${reportId}`);

            if (!report) {
                return interaction.reply({
                    content: '❌ البلاغ غير موجود!',
                    ephemeral: true
                });
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
    }
});

client.login(process.env.DISCORD_TOKEN);
