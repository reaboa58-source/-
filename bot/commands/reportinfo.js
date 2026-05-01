const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'reportinfo',
    description: 'تفاصيل بلاغ',
    category: 'إدارة',
    usage: '!reportinfo [رقم]',
    async execute(message, args, client) {
        if (!message.member.permissions.has('Administrator')) return message.reply('❌ للإدارة فقط!');
        const id = args[0];
        if (!id) return message.reply('❌ اكتب رقم البلاغ!');
        const report = Array.from(client.reports.values()).find(r => r.id == id);
        if (!report) return message.reply('❌ ما لقيته!');
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`🚨 بلاغ #${report.id}`)
            .addFields(
                { name: '🎮 اللعبة', value: report.game, inline: true },
                { name: '⚠️ المخالفة', value: report.type, inline: true },
                { name: '📊 الحالة', value: report.status, inline: true },
                { name: '👤 المبلغ عنه', value: report.robloxUser, inline: false },
                { name: '🏷️ الاسم الظاهر', value: report.displayName, inline: true },
                { name: '📝 التفاصيل', value: report.details, inline: false }
            )
            .setFooter({ text: `مقدم: ${report.reporterTag}` });
        message.reply({ embeds: [embed] });
    }
};
