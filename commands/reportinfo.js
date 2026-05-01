const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'reportinfo',
    description: 'عرض تفاصيل بلاغ محدد',
    category: 'إدارة',
    usage: '!reportinfo [رقم البلاغ]',

    async execute(message, args, client) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ هذا الأمر للإدارة فقط!');
        }

        const reportId = args[0];
        if (!reportId) return message.reply('❌ اكتب رقم البلاغ!\nمثال: `!reportinfo 1`');

        const report = Array.from(client.reports.values()).find(r => r.id == reportId);
        
        if (!report) {
            return message.reply('❌ ما لقيت البلاغ!');
        }

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`🚨 بلاغ #${report.id}`)
            .addFields(
                { name: '🎮 اللعبة', value: report.game, inline: true },
                { name: '⚠️ نوع المخالفة', value: report.type, inline: true },
                { name: '📊 الحالة', value: report.status, inline: true },
                { name: '👤 المبلغ عنه', value: report.robloxUser, inline: false },
                { name: '🏷️ الاسم الظاهر', value: report.displayName, inline: true },
                { name: '📝 التفاصيل', value: report.details, inline: false },
                { name: '📎 دليل', value: report.evidence, inline: false },
                { name: '👮 مقدم البلاغ', value: `<@${report.reporter}> (${report.reporterTag})`, inline: false }
            )
            .setTimestamp(new Date(report.timestamp));

        await message.reply({ embeds: [embed] });
    }
};
