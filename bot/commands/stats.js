const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'stats',
    description: 'إحصائيات',
    category: 'عام',
    usage: '!stats',
    async execute(message, args, client) {
        const reports = Array.from(client.reports.values()).filter(r => r.id);
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('📊 إحصائيات')
            .addFields(
                { name: '📋 البلاغات', value: `${reports.length}`, inline: true },
                { name: '⏳ قيد المراجعة', value: `${reports.filter(r => r.status.includes('⏳')).length}`, inline: true },
                { name: '✅ مقبولة', value: `${reports.filter(r => r.status.includes('✅')).length}`, inline: true },
                { name: '🤖 السيرفرات', value: `${client.guilds.cache.size}`, inline: true }
            );
        message.reply({ embeds: [embed] });
    }
};
