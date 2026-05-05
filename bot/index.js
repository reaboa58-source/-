const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection, StreamType } = require('@discordjs/voice');
const googleTTS = require('google-tts-api');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ]
});

client.commands = new Collection();
client.reports = new Map();
client.tickets = new Map();
client.reportCounter = 1;
client.ticketCounter = 1;
client.isLoggedIn = false;

// تحميل الأوامر
const commandsPath = path.join(__dirname, 'commands');

if (!fs.existsSync(commandsPath)) {
    console.log('Creating commands folder...');
    fs.mkdirSync(commandsPath, { recursive: true });
}

try {
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
        try {
            const filePath = path.join(commandsPath, file);
            delete require.cache[require.resolve(filePath)];
            const command = require(filePath);
            if (command.name && command.execute) {
                client.commands.set(command.name, command);
                console.log(`Loaded: ${command.name}`);
            }
        } catch (err) {
            console.error(`Error loading ${file}:`, err.message);
        }
    }
} catch (err) {
    console.error('Error reading commands:', err.message);
}

console.log(`Total commands: ${client.commands.size}`);

// بيانات الفضائح
const GAMES = [
    { name: 'Timebomb Duels', value: 'timebombduels' },
    { name: 'Custom Minigames', value: 'customminigames' }
];

const REPORT_TYPES = [
    { name: 'سندر', value: 'sender' },
    { name: 'اوتو كليك', value: 'autoclick' },
    { name: 'سبام', value: 'spam' },
    { name: 'قذف', value: 'harassment' },
    { name: 'هاك', value: 'hack' },
    { name: 'تخريب', value: 'griefing' },
    { name: 'انتحال', value: 'impersonation' },
    { name: 'سبب اخر', value: 'other' }
];

client.once('ready', () => {
    console.log(`Bot: ${client.user.tag}`);
    console.log(`Servers: ${client.guilds.cache.size}`);
    client.isLoggedIn = true;
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
        console.error(`Error in ${commandName}:`, error);
        message.reply('حصل خطأ!').catch(() => {});
    }
});

client.on('interactionCreate', async (interaction) => {
    try {
        // ========== فضائح: اختيار اللعبة ==========
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_game') {
            const selectedGame = GAMES.find(g => g.value === interaction.values[0]);
            
            const modal = new ModalBuilder()
                .setCustomId(`report_info_${selectedGame.value}`)
                .setTitle(`فضيحه - ${selectedGame.name}`);

            const robloxUserInput = new TextInputBuilder()
                .setCustomId('roblox_username')
                .setLabel('Roblox Username')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('اكتب اسم اللاعب')
                .setRequired(true)
                .setMaxLength(50);

            const displayNameInput = new TextInputBuilder()
                .setCustomId('display_name')
                .setLabel('Display Name')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('الاسم الظاهر')
                .setRequired(false)
                .setMaxLength(50);

            const detailsInput = new TextInputBuilder()
                .setCustomId('report_details')
                .setLabel('تفاصيل الفضيحه')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('اشرح وش سوى...')
                .setRequired(true)
                .setMaxLength(1000);

            const evidenceInput = new TextInputBuilder()
                .setCustomId('evidence')
                .setLabel('رابط صورة او فيديو (اختياري)')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('https://...')
                .setRequired(false)
                .setMaxLength(500);

            modal.addComponents(
                new ActionRowBuilder().addComponents(robloxUserInput),
                new ActionRowBuilder().addComponents(displayNameInput),
                new ActionRowBuilder().addComponents(detailsInput),
                new ActionRowBuilder().addComponents(evidenceInput)
            );

            await interaction.showModal(modal);
        }

        // ========== فضائح: استلام معلومات ==========
        if (interaction.isModalSubmit() && interaction.customId.startsWith('report_info_')) {
            const gameValue = interaction.customId.replace('report_info_', '');
            const game = GAMES.find(g => g.value === gameValue);
            
            const robloxUser = interaction.fields.getTextInputValue('roblox_username');
            const displayName = interaction.fields.getTextInputValue('display_name') || 'غير محدد';
            const details = interaction.fields.getTextInputValue('report_details');
            
            let evidence = interaction.fields.getTextInputValue('evidence');
            if (!evidence || evidence.trim() === '') {
                evidence = 'مافيه رابط';
            }

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
                .setPlaceholder('اختر نوع المخالفة...')
                .addOptions(REPORT_TYPES.map(t => new StringSelectMenuOptionBuilder()
                    .setLabel(t.name)
                    .setValue(t.value)
                ));

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff0000')
                    .setTitle('فضيحه - اختر نوع المخالفة')
                    .setDescription(`الشخص: ${robloxUser}\nاللعبة: ${game.name}`)
                ],
                components: [new ActionRowBuilder().addComponents(typeSelect)],
                ephemeral: true
            });
        }

        // ========== فضائح: اختيار نوع المخالفة ==========
        if (interaction.isStringSelectMenu() && interaction.customId === 'select_report_type') {
            const selectedType = REPORT_TYPES.find(t => t.value === interaction.values[0]);
            const temp = client.reports.get(interaction.user.id);
            
            if (!temp) {
                return interaction.reply({ 
                    content: 'انتهت الجلسه! اكتب !فضيحه', 
                    ephemeral: true 
                });
            }

            const reportId = client.reportCounter++;
            const final = { 
                id: reportId, 
                ...temp, 
                type: selectedType.name, 
                status: 'قيد المراجعه', 
                timestamp: Date.now() 
            };
            
            client.reports.set(`report_${reportId}`, final);
            client.reports.delete(interaction.user.id);

            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`فضيحه #${reportId}`)
                .addFields(
                    { name: 'اللعبه', value: final.game, inline: true },
                    { name: 'نوع المخالفه', value: final.type, inline: true },
                    { name: 'الحاله', value: final.status, inline: true },
                    { name: 'المبلغ عنه', value: final.robloxUser, inline: false },
                    { name: 'الاسم الظاهر', value: final.displayName, inline: true },
                    { name: 'التفاصيل', value: final.details, inline: false }
                )
                .setFooter({ text: `مقدم البلاغ: ${final.reporterTag}` })
                .setTimestamp();

            if (final.evidence !== 'مافيه رابط') {
                embed.addFields({ 
                    name: 'الدليل', 
                    value: `[اضغط هنا](${final.evidence})`, 
                    inline: false 
                });
            } else {
                embed.addFields({ 
                    name: 'الدليل', 
                    value: 'مافيه رابط', 
                    inline: false 
                });
            }

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId(`accept_${reportId}`).setLabel('قبول').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setCustomId(`reject_${reportId}`).setLabel('رفض').setStyle(ButtonStyle.Danger),
                new ButtonBuilder().setCustomId(`investigate_${reportId}`).setLabel('تحقيق').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setCustomId(`ban_${reportId}`).setLabel('حظر').setStyle(ButtonStyle.Secondary)
            );

            const channel = interaction.guild.channels.cache.find(
                ch => ch.name.includes('فضائح') || ch.name.includes('بلاغات') || ch.name.includes('reports')
            );

            if (channel) {
                let messageContent = `فضيحه جديده من <@${final.reporter}>`;
                
                if (final.evidence !== 'مافيه رابط') {
                    messageContent += `\n\n**رابط الفيديو:**\n${final.evidence}`;
                }

                await channel.send({
                    content: messageContent,
                    embeds: [embed],
                    components: [buttons]
                });
            }

            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor('#00ff00')
                    .setTitle('تم ارسال الفضيحه')
                    .setDescription(`رقم الفضيحه: ${reportId}`)
                    .addFields(
                        { name: 'اللعبه', value: final.game, inline: true },
                        { name: 'المخالفه', value: final.type, inline: true }
                    )
                ],
                components: []
            });
        }

        // ========== فضائح: أزرار الإدارة ==========
        if (interaction.isButton() && ['accept', 'reject', 'investigate', 'ban'].includes(interaction.customId.split('_')[0])) {
            const [action, reportId] = interaction.customId.split('_');
            const report = client.reports.get(`report_${reportId}`);
            
            if (!report) {
                return interaction.reply({ content: 'الفضيحه غير موجوده!', ephemeral: true });
            }

            const reporter = await interaction.guild.members.fetch(report.reporter).catch(() => null);

            if (action === 'accept') {
                report.status = 'مقبول';
                await interaction.update({ components: [] });
                await interaction.message.reply(`تم قبول الفضيحه #${reportId} بواسطه ${interaction.user}`);
                if (reporter) await reporter.send(`فضيحتك #${reportId} تم قبولها!`).catch(() => {});
            }
            
            if (action === 'reject') {
                report.status = 'مرفوض';
                await interaction.update({ components: [] });
                await interaction.message.reply(`تم رفض الفضيحه #${reportId} بواسطه ${interaction.user}`);
                if (reporter) await reporter.send(`فضيحتك #${reportId} تم رفضها.`).catch(() => {});
            }
            
            if (action === 'investigate') {
                report.status = 'قيد التحقيق';
                await interaction.message.reply(`${interaction.user} يحقق في الفضيحه #${reportId}...`);
            }
            
            if (action === 'ban') {
                report.status = 'محظور';
                await interaction.message.reply(`تم حظر ${report.robloxUser} بواسطه ${interaction.user}`);
                if (reporter) await reporter.send(`${report.robloxUser} تم حظره بسبب فضيحتك #${reportId}!`).catch(() => {});
            }
        }

        // ========== تكت: فتح تكت ==========
        if (interaction.isButton() && interaction.customId === 'open_ticket') {
            const existingTicket = Array.from(client.tickets.values()).find(t => 
                t.userId === interaction.user.id && t.status === 'open'
            );
            
            if (existingTicket) {
                return interaction.reply({ 
                    content: `عندك تكت مفتوح بالفعل: <#${existingTicket.channelId}>`, 
                    ephemeral: true 
                });
            }

            const ticketId = client.ticketCounter++;
            const ticketName = `تكت-${ticketId}`;

            const channel = await interaction.guild.channels.create({
                name: ticketName,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                    }
                ]
            });

            const adminRoles = interaction.guild.roles.cache.filter(r => 
                r.name.includes('اداره') || 
                r.name.includes('admin') || 
                r.name.includes('مشرف') ||
                r.permissions.has(PermissionFlagsBits.Administrator)
            );

            for (const [, role] of adminRoles) {
                await channel.permissionOverwrites.create(role, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true
                });
            }

            const ticket = {
                id: ticketId,
                userId: interaction.user.id,
                userTag: interaction.user.tag,
                channelId: channel.id,
                status: 'open',
                claimedBy: null,
                claimedByTag: null
            };

            client.tickets.set(ticketId, ticket);

            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`تكت #${ticketId}`)
                .setDescription('هذا مكان تتكلم فيه مع الاداره')
                .addFields(
                    { name: 'تنبيه', value: 'لو تسبب ازعاج او قله ادب = تايم اوت يوم' },
                    { name: 'فايدة التكت', value: 'التواصل مع الاداره بخصوص اي مشكلة' }
                )
                .setFooter({ text: `فتحه: ${interaction.user.tag}` });

            const buttons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`claim_ticket_${ticketId}`)
                    .setLabel('استلام تكت')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`close_ticket_${ticketId}`)
                    .setLabel('اقفال تكت')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`abandon_ticket_${ticketId}`)
                    .setLabel('تخلي عن تكت')
                    .setStyle(ButtonStyle.Secondary)
            );

            await channel.send({
                content: `${interaction.user} تم فتح تكتك`,
                embeds: [welcomeEmbed],
                components: [buttons]
            });

            await interaction.reply({
                content: `تم فتح تكتك: ${channel}`,
                ephemeral: true
            });
        }

        // ========== تكت: استلام ==========
        if (interaction.isButton() && interaction.customId.startsWith('claim_ticket_')) {
            const ticketId = parseInt(interaction.customId.replace('claim_ticket_', ''));
            const ticket = client.tickets.get(ticketId);

            if (!ticket) {
                return interaction.reply({ content: 'التكت غير موجود!', ephemeral: true });
            }

            if (ticket.claimedBy) {
                return interaction.reply({ 
                    content: `الاداري <@${ticket.claimedBy}> ماسك التكت بالفعل!`, 
                    ephemeral: true 
                });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && 
                !interaction.member.roles.cache.some(r => 
                    r.name.includes('اداره') || r.name.includes('admin') || r.name.includes('مشرف')
                )) {
                return interaction.reply({ content: 'هذا للاداره فقط!', ephemeral: true });
            }

            ticket.claimedBy = interaction.user.id;
            ticket.claimedByTag = interaction.user.tag;

            await interaction.update({
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`claim_ticket_${ticketId}`)
                        .setLabel(`ماسكه: ${interaction.user.tag}`)
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId(`close_ticket_${ticketId}`)
                        .setLabel('اقفال تكت')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`abandon_ticket_${ticketId}`)
                        .setLabel('تخلي عن تكت')
                        .setStyle(ButtonStyle.Secondary)
                )]
            });

            await interaction.channel.send({
                content: `الاداري ${interaction.user} استلم التكت`
            });
        }

        // ========== تكت: تخلي ==========
        if (interaction.isButton() && interaction.customId.startsWith('abandon_ticket_')) {
            const ticketId = parseInt(interaction.customId.replace('abandon_ticket_', ''));
            const ticket = client.tickets.get(ticketId);

            if (!ticket) {
                return interaction.reply({ content: 'التكت غير موجود!', ephemeral: true });
            }

            if (ticket.claimedBy !== interaction.user.id) {
                return interaction.reply({ content: 'انت ما مستلم التكت!', ephemeral: true });
            }

            ticket.claimedBy = null;
            ticket.claimedByTag = null;

            await interaction.update({
                components: [new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`claim_ticket_${ticketId}`)
                        .setLabel('استلام تكت')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(`close_ticket_${ticketId}`)
                        .setLabel('اقفال تكت')
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId(`abandon_ticket_${ticketId}`)
                        .setLabel('تخلي عن تكت')
                        .setStyle(ButtonStyle.Secondary)
                )]
            });

            await interaction.channel.send({
                content: `الاداري ${interaction.user} تخلى عن التكت`
            });
        }

        // ========== تكت: اقفال ==========
        if (interaction.isButton() && interaction.customId.startsWith('close_ticket_')) {
            const ticketId = parseInt(interaction.customId.replace('close_ticket_', ''));
            const ticket = client.tickets.get(ticketId);

            if (!ticket) {
                return interaction.reply({ content: 'التكت غير موجود!', ephemeral: true });
            }

            if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && 
                !interaction.member.roles.cache.some(r => 
                    r.name.includes('اداره') || r.name.includes('admin') || r.name.includes('مشرف')
                )) {
                return interaction.reply({ content: 'هذا للاداره فقط!', ephemeral: true });
            }

            const modal = new ModalBuilder()
                .setCustomId(`close_reason_${ticketId}`)
                .setTitle('اقفال تكت');

            const reasonInput = new TextInputBuilder()
                .setCustomId('close_reason')
                .setLabel('سبب الاقفال')
                .setStyle(TextInputStyle.Paragraph)
                .setPlaceholder('اكتب سبب الاقفال...')
                .setRequired(true)
                .setMaxLength(500);

            const solvedInput = new TextInputBuilder()
                .setCustomId('is_solved')
                .setLabel('هل تم حل التكت؟')
                .setStyle(TextInputStyle.Short)
                .setPlaceholder('اكتب: نعم او لا')
                .setRequired(true)
                .setMaxLength(10);

            modal.addComponents(
                new ActionRowBuilder().addComponents(reasonInput),
                new ActionRowBuilder().addComponents(solvedInput)
            );

            await interaction.showModal(modal);
        }

        // ========== تكت: سبب الاقفال ==========
        if (interaction.isModalSubmit() && interaction.customId.startsWith('close_reason_')) {
            const ticketId = parseInt(interaction.customId.replace('close_reason_', ''));
            const ticket = client.tickets.get(ticketId);

            const reason = interaction.fields.getTextInputValue('close_reason');
            const isSolved = interaction.fields.getTextInputValue('is_solved');

            ticket.status = 'closed';
            ticket.closeReason = reason;
            ticket.isSolved = isSolved;
            ticket.closedBy = interaction.user.tag;

            const closeEmbed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle(`تكت #${ticketId} - مقفل`)
                .addFields(
                    { name: 'مقفل بواسطة', value: interaction.user.tag, inline: true },
                    { name: 'سبب الاقفال', value: reason, inline: false },
                    { name: 'تم الحل؟', value: isSolved, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [closeEmbed] });

            const user = await client.users.fetch(ticket.userId).catch(() => null);
            if (user) {
                const ratingRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId(`rate_1_${ticketId}`).setLabel('⭐').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`rate_2_${ticketId}`).setLabel('⭐⭐').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`rate_3_${ticketId}`).setLabel('⭐⭐⭐').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`rate_4_${ticketId}`).setLabel('⭐⭐⭐⭐').setStyle(ButtonStyle.Primary),
                    new ButtonBuilder().setCustomId(`rate_5_${ticketId}`).setLabel('⭐⭐⭐⭐⭐').setStyle(ButtonStyle.Primary)
                );

                await user.send({
                    content: 'كيف كان التكت؟ قيم التجربة:',
                    components: [ratingRow]
                }).catch(() => {
                    interaction.channel.send('ما قدرت ارسل التقييم للمستخدم');
                });
            }

            setTimeout(async () => {
                const channel = interaction.guild.channels.cache.get(ticket.channelId);
                if (channel) await channel.delete('تكت مقفل').catch(() => {});
            }, 5000);
        }

        // ========== تكت: تقييم ==========
        if (interaction.isButton() && interaction.customId.startsWith('rate_')) {
            const [, stars, ticketId] = interaction.customId.split('_');
            
            await interaction.update({
                content: `شكراً لتقييمك! ${'⭐'.repeat(parseInt(stars))}`,
                components: []
            });

            const ticket = client.tickets.get(parseInt(ticketId));
            if (ticket) {
                ticket.rating = stars;
            }
        }

    } catch (error) {
        console.error('Error:', error);
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: 'حصل خطأ!', ephemeral: true }).catch(() => {});
        }
    }
});

// دوال التحكم
client.loginWithToken = async (token) => {
    try {
        if (client.isLoggedIn) {
            return { success: true, message: 'البوت شغال' };
        }
        await client.login(token);
        return { success: true, message: 'تم التشغيل' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: 'توكن غلط' };
    }
};

client.logoutBot = async () => {
    try {
        if (!client.isLoggedIn) {
            return { success: false, message: 'البوت مو شغال' };
        }
        await client.destroy();
        client.isLoggedIn = false;
        return { success: true, message: 'تم الايقاف' };
    } catch (error) {
        return { success: false, message: 'خطأ' };
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

// دالة say للـ TTS
client.sayText = async (text, voiceChannel, message) => {
    try {
        if (text.length > 200) {
            return { success: false, message: 'الكلام طويل! (الحد 200 حرف)' };
        }

        const url = googleTTS.getAudioUrl(text, {
            lang: 'ar',
            slow: false,
            host: 'https://translate.google.com',
        });

        let connection = getVoiceConnection(voiceChannel.guild.id);
        if (!connection) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guild.id,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
            });
        }

        const player = createAudioPlayer();
        connection.subscribe(player);

        const resource = createAudioResource(url, {
            inputType: StreamType.Arbitrary
        });
        player.play(resource);

        player.once('idle', () => {});
        player.on('error', (error) => {
            console.error('TTS error:', error);
        });

        return { success: true, message: `قاعد اقول: "${text}"` };
    } catch (error) {
        console.error('Say error:', error);
        return { success: false, message: 'خطأ في التشغيل!' };
    }
};

console.log('Waiting for token...');

module.exports = client;
