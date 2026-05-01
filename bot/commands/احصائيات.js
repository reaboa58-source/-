const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'احصائيات',
    description: 'احصائيات',
    category: 'عام',
    usage: '!احصائيات',

    async execute(message, args, client) {
        const reports = Array.from(client.reports.values()).filter(r => r.id);

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('احصائيات')
            .addFields(
                { name: 'الفضائح', value: `${reports.length}`, inline: true },
                { name: 'قيد المراجعه', value: `${reports.filter(r => r.status.includes('قيد')).length}`, inline: true },
                { name: 'مقبوله', value: `${reports.filter(r => r.status.includes('مقبول')).length}`, inline: true },
                { name: 'السيرفرات', value: `${client.guilds.cache.size}`, inline: true }
            );

        message.reply({ embeds: [embed] });
    }
};
