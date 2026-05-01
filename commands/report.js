const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

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

module.exports = {
    name: 'report',
    description: 'تقديم بلاغ عن لاعب في Roblox',
    category: 'بلاغات',
    usage: '!report',

    async execute(message, args, client) {
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
};
