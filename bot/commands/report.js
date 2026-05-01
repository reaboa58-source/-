const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

const GAMES = [
    { name: 'Mini Games', value: 'minigames', emoji: '' },
    { name: 'Timebomb Duels', value: 'timebombduels', emoji: '' },
];

module.exports = {
    name: 'report',
    description: 'تقديم فضايح Roblox',
    category: 'بلاغات',
    usage: '!report',
    async execute(message, args, client) {
        const select = new StringSelectMenuBuilder()
            .setCustomId('select_game')
            .setPlaceholder('اختر ماب شخص الي انفضح فيه')
            .addOptions(GAMES.map(g => new StringSelectMenuOptionBuilder().setLabel(g.name).setValue(g.value).setEmoji(g.emoji).setDescription(`بلاغ في ${g.name}`)));

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(' نظام افضايح')
            .setDescription('1️⃣ اختر الماب\n2️⃣ اكتب المعلومات\n3️⃣ اختر نوع الفضيحه\n\n⚠️ فضايح الكاذبة = حظر');

        message.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
    }
};
