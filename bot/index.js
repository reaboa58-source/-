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

// تحميل الأوامر
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('name' in command && 'execute' in command) {
        client.commands.set(command.name, command);
        console.log(`✅ Loaded: ${command.name}`);
    }
}

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

client.once('ready', () => {
    console.log(`🤖 Bot: ${client.user.tag}`);
    console.log(`📊 Servers: ${client.guilds.cache.size}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot || !message.content.startsWith('!')) return;
    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName);
    if (!command) return;
    try {
        await command.execute(message, args, client);
    } catch (error) {
        console.error(error);
        message.reply('❌ خطأ!');
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
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('roblox_username').setLabel('Roblox Username').setStyle(TextInputStyle.Short).setPlaceholder('RobloxPro123').setRequired(true).setMaxLength(50)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('display_name').setLabel('Display Name').setStyle(TextInputStyle.Short).setPlaceholder('الاسم الظاهر').setRequired(false).setMaxLength(50)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('report_details').setLabel('التفاصيل').setStyle(TextInputStyle.Paragraph).setPlaceholder('اشرح المخالفة...').setRequired(true).setMaxLength(1000)),
                new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId('evidence').setLabel('رابط دليل (اختياري)').setStyle(TextInputStyle.Short).setPlaceholder('https://...').setRequired(false).setMaxLength(200))
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
            if (!temp) return interaction.reply({ content: '❌ انتهت الجلسة! ابدأ بـ `!report`', ephemeral: true });

            const reportId = client.reportCounter++;
            const final = { id: reportId, ...temp, type: selectedType.name, status: '⏳ قيد المراجعة', timestamp: Date.now() };
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
                .setFooter({ text: `مقدم: ${final.reporterTag}` })
                .setTimestamp();

            if (final.evidence !== 'لا يوجد') embed.addFields({ name: '📎 دليل', value: final.evidence, inline: false });

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`accept_${reportId}`).setLabel('✅ قبول').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`reject_${reportId}`).setLabel('❌ رفض').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`investigate_${reportId}`).setLabel('🔍 تحقيق').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`ban_${reportId}`).setLabel('🔨 حظر').setStyle(ButtonStyle.Secondary)
            );

            const channel = interaction.guild.channels.cache.find(ch => ch.name.includes('reports') || ch.name.includes('بلاغات'));
            if (channel) await channel.send({ content: `📢 بلاغ جديد من <@${final.reporter}>`, embeds: [embed], components: [buttons] });

            await interaction.update({
                embeds: [new EmbedBuilder().setColor('#00ff00').setTitle('✅ تم الإرسال!').setDescription(`رقم البلاغ: \`#${reportId}\``).addFields({ name: '🎮 اللعبة', value: final.game, inline: true }, { name: '⚠️ المخالفة', value: final.type, inline: true })],
                components: []
            });
        }

        if (interaction.isButton()) {
            const [action, reportId] = interaction.customId.split('_');
            const report = client.reports.get(`report_${reportId}`);
            if (!report) return interaction.reply({ content: '❌ البلاغ غير موجود!', ephemeral: true });

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
        console.error(error);
    }
});

client.login(process.env.DISCORD_TOKEN);
