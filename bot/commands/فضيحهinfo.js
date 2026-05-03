const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'فضيحهinfo',
    description: 'تفاصيل فضيحه',
    category: 'اداره',
    usage: '!فضيحهinfo [رقم]',

    async execute(message, args, client) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('هذا الامر للاداره فقط!');
        }

        const id = args[0];
        if (!id) return message.reply('اكتب رقم الفضيحه!');

        const report = Array.from(client.reports.values()).find(r => r.id == id);
        if (!report) return message.reply('ما لقيتها!');

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle(`فضيحه #${report.id}`)
            .addFields(
                { name: 'اللعبه', value: report.game, inline: true },
                { name: 'المخالفه', value: report.type, inline: true },
                { name: 'الحاله', value: report.status, inline: true },
                { name: 'المبلغ عنه', value: report.robloxUser, inline: false },
                { name: 'الاسم الظاهر', value: report.displayName, inline: true },
                { name: 'التفاصيل', value: report.details, inline: false }
            )
            .setFooter({ text: `مقدم: ${report.reporterTag}` });

        // ✅ التحقق من الرابط في الإيمبد
        if (report.evidence && report.evidence !== 'مافيه رابط') {
            embed.addFields({ 
                name: 'رابط الفيديو', 
                value: report.evidence, 
                inline: false 
            });
        } else {
            embed.addFields({ 
                name: 'رابط الفيديو', 
                value: 'مافيه رابط', 
                inline: false 
            });
        }

        await message.reply({ embeds: [embed] });

        // ✅ نرسل الرابط منفصل إذا موجود
        if (report.evidence && report.evidence !== 'مافيه رابط') {
            await message.channel.send(`**رابط الفيديو:**\n${report.evidence}`);
        }
    }
};
