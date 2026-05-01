const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

const GAMES = [
    { name: 'Timebomb Duels', value: 'timebombduels' },
    { name: 'Custom Minigames', value: 'customminigames' }
];

module.exports = {
    name: 'فضيحه',
    description: 'تقديم فضيحه',
    category: 'فضائح',
    usage: '!فضيحه',

    async execute(message, args, client) {
        const select = new StringSelectMenuBuilder()
            .setCustomId('select_game')
            .setPlaceholder('اختر اللعبه...')
            .addOptions(GAMES.map(g => new StringSelectMenuOptionBuilder()
                .setLabel(g.name)
                .setValue(g.value)
            ));

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('فضيحه')
            .setDescription('اختر اللعبه من القائمه\n\nتنبيه: الفضائح الكاذبه = حظر');

        message.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(select)] });
    }
};
