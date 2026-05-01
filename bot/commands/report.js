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
    description: 'تقديم بلاغ Roblox',
    category: 'بلاغات',
    usage: '!report',
    async execute(message, args, client) {
        const select = new StringSelectMenuBuilder()
            .setCustomId('select_game')
            .setPlaceholder('🎮 اختر اللعبة...')
            .addOptions(GAMES.map(g => new StringSelectMenuOptionBuilder().setLabel(g.name).setValue(g.value).setEmoji(g.emoji).setDescription(`بلاغ في ${g.name}`)));

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚨 نظام البلاغات')
            .setDescription('1️⃣ اختر اللعبة\n2️⃣ اكتب المعلومات\n3️⃣ اختر نوع المخالفة\n\n⚠️ البلاغات الكاذبة = حظر');

        message.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
    }
};
