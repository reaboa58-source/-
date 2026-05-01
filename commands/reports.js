const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'reports',
    description: 'عرض كل البلاغات (للإدارة فقط)',
    category: 'إدارة',
    usage: '!reports',

    async execute(message, args, client) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ هذا الأمر للإدارة فقط!');
        }

        const reports = Array.from(client.reports.values()).filter(r => r.id);
        
        if (reports.length === 0) {
            return message.reply('📭 ما فيه بلاغات حالياً.');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📋 قائمة البلاغات (${reports.length})`)
            .setDescription(
                reports.slice(0, 10).map(r => 
                    `\`#${r.id}\` | **${r.robloxUser}** | ${r.game} | ${r.type} | ${r.status}`
                ).join('\n') || 'لا يوجد'
            )
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
