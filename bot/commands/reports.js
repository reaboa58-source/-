const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'reports',
    description: 'عرض البلاغات',
    category: 'إدارة',
    usage: '!reports',
    async execute(message, args, client) {
        if (!message.member.permissions.has('Administrator')) return message.reply('❌ للإدارة فقط!');
        const reports = Array.from(client.reports.values()).filter(r => r.id);
        if (!reports.length) return message.reply('📭 فاضي!');
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📋 البلاغات (${reports.length})`)
            .setDescription(reports.slice(0, 10).map(r => `\`#${r.id}\` | **${r.robloxUser}** | ${r.game} | ${r.type} | ${r.status}`).join('\n'));
        message.reply({ embeds: [embed] });
    }
};
