const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'stats',
    description: 'إحصائيات البوت',
    category: 'عام',
    usage: '!stats',

    async execute(message, args, client) {
        const reports = Array.from(client.reports.values()).filter(r => r.id);
        const pending = reports.filter(r => r.status.includes('⏳')).length;
        const accepted = reports.filter(r => r.status.includes('✅')).length;
        const rejected = reports.filter(r => r.status.includes('❌')).length;

        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('📊 إحصائيات البوت')
            .addFields(
                { name: '📋 إجمالي البلاغات', value: `${reports.length}`, inline: true },
                { name: '⏳ قيد المراجعة', value: `${pending}`, inline: true },
                { name: '✅ مقبولة', value: `${accepted}`, inline: true },
                { name: '❌ مرفوضة', value: `${rejected}`, inline: true },
                { name: '🤖 السيرفرات', value: `${client.guilds.cache.size}`, inline: true },
                { name: '👥 المستخدمين', value: `${client.users.cache.size}`, inline: true }
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
