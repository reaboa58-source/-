const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'فضائح',
    description: 'عرض الفضائح',
    category: 'اداره',
    usage: '!فضائح',

    async execute(message, args, client) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('هذا الامر للاداره فقط!');
        }

        const reports = Array.from(client.reports.values()).filter(r => r.id);
        if (!reports.length) return message.reply('ما فيه فضائح.');

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`فضائح (${reports.length})`)
            .setDescription(reports.slice(0, 10).map(r => `#${r.id} | ${r.robloxUser} | ${r.game} | ${r.type} | ${r.status}`).join('\n'));

        message.reply({ embeds: [embed] });
    }
};
