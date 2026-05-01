const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
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

// ========== الألعاب المتاحة ==========
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

// ========== أنواع البلاغات ==========
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

// ========== حفظ البلاغات ==========
client.reports = new Map();
let reportCounter = 1;

// ========== Event: Ready ==========
client.once('ready', () => {
    console.log(`🤖 Bot logged in as ${client.user.tag}`);
    console.log(`📊 In ${client.guilds.cache.size} servers`);
});

// ========== Command: !report ==========
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith('!')) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'report') {
        // قائمة اختيار اللعبة
        const gameSelect = new StringSelectMenuBuilder()
            .setCustomId('select_game')
            .setPlaceholder('🎮 اختر اللعبة...')
            .addOptions(
                GAMES.map(game => new StringSelectMenuOptionBuilder()
                    .setLabel(game.name)
                    .setValue(game.value)
                    .setEmoji(game.emoji)
                    .setDescription(`بلاغ في لعبة ${game.name}`)
                )
            );

        const row = new ActionRowBuilder().addComponents(gameSelect);

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚨 نظام البلاغات - Roblox')
            .setDescription('مرحباً بك في نظام البلاغات!\n\n**الخطوات:**\n1️⃣ اختر اللعبة من القائمة\n2️⃣ اكتب معلومات المبلغ عنه\n3️⃣ اختر نوع المخالفة\n4️⃣ أرسل البلاغ\n\n⚠️ **تنبيه:** البلاغات الكاذبة تؤدي للحظر!')
            .setFooter({ text: 'Roblox Report System' })
            .setTimestamp();

        await message.reply({
            embeds: [embed],
            components: [row]
        });
    }

    if (command === 'reports') {
        // للإدارة: عرض كل البلاغات
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ هذا الأمر للإدارة فقط!');
        }

        const reports = Array.from(client.reports.values());
        if (reports.length === 0) {
            return message.reply('📭 ما فيه بلاغات حالياً.');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📋 قائمة البلاغات (${reports.length})`)
            .setDescription(
                reports.map(r => 
                    `\`#${r.id}\` | **${r.target}** | ${r.game} | ${r.type} | ${r.status}`
                ).join('\n')
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
});

// ========== Interaction Handler ==========
client.on('interactionCreate', async (interaction) => {
    try {
        // اختيار اللعبة
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_game') {
            const selectedGame = GAMES.find(g => g.value === interaction.values[0]);

            // فتح Modal لإدخال المعلومات
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

            // حفظ البلاغ مؤقتاً
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

            // قائمة اختيار نوع المخالفة
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
                .setDescription(`**الشخص:** ${robloxUser}\n**اللعبة:** ${game.name}\n\nاختر نوع المخالفة من القائمة:`)
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

            // إنشاء البلاغ النهائي
            const reportId = reportCounter++;
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

            // Embed البلاغ النهائي
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

            // أزرار الإدارة
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

            // إرسال للروم المخصص للبلاغات
            const reportChannel = interaction.guild.channels.cache.find(
                ch => ch.name.includes('reports') || 
                      ch.name.includes('بلاغات') || 
                      ch.name.includes('roblox-reports')
            );

            if (reportChannel) {
                await reportChannel.send({
                    content: `📢 <@&ADMIN_ROLE_ID> بلاغ جديد!\nمقدم البلاغ: <@${finalReport.reporter}>`,
                    embeds: [reportEmbed],
                    components: [adminButtons]
                });
            }

            // تأكيد للمستخدم
            const confirmEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('✅ تم إرسال البلاغ!')
                .setDescription(`رقم البلاغ: \`#${reportId}\`\nتم إرساله للإدارة للمراجعة.`)
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
                await interaction.update({
                    components: []
                });
                await interaction.message.reply({
                    content: `✅ تم **قبول** البلاغ #${reportId} بواسطة ${interaction.user}`
                });
                if (reporter) {
                    await reporter.send(`✅ بلاغك #${reportId} تم قبوله!`).catch(() => {});
                }
            }

            if (action === 'reject') {
                report.status = '❌ مرفوض';
                await interaction.update({
                    components: []
                });
                await interaction.message.reply({
                    content: `❌ تم **رفض** البلاغ #${reportId} بواسطة ${interaction.user}`
                });
                if (reporter) {
                    await reporter.send(`❌ بلاغك #${reportId} تم رفضه.`).catch(() => {});
                }
            }

            if (action === 'investigate') {
                report.status = '🔍 قيد التحقيق';
                await interaction.message.reply({
                    content: `🔍 ${interaction.user} يحقق في البلاغ #${reportId}...`
                });
            }

            if (action === 'ban') {
                report.status = '🔨 محظور';
                await interaction.message.reply({
                    content: `🔨 تم **حظر** ${report.robloxUser} من اللعبة بواسطة ${interaction.user}`
                });
                if (reporter) {
                    await reporter.send(`🎉 ${report.robloxUser} تم حظره بسبب بلاغك #${reportId}!`).catch(() => {});
                }
            }
        }

    } catch (error) {
        console.error('Interaction error:', error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({
                content: '❌ حصل خطأ! جرب مرة ثانية.',
                ephemeral: true
            }).catch(() => {});
        } else {
            await interaction.reply({
                content: '❌ حصل خطأ! جرب مرة ثانية.',
                ephemeral: true
            }).catch(() => {});
        }
    }
});

// ========== Login ==========
client.login(process.env.DISCORD_TOKEN);
