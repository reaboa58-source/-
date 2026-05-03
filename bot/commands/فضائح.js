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

        for (const r of reports.slice(0, 5)) {
            let content = `**فضيحه #${r.id}** | ${r.robloxUser} | ${r.game} | ${r.type} | ${r.status}`;
            
            // ✅ التحقق من الرابط
            if (r.evidence && r.evidence !== 'مافيه رابط') {
                content += `\n**رابط الفيديو:** ${r.evidence}`;
            } else {
                content += `\n**رابط الفيديو:** مافيه رابط`;
            }
            
            await message.channel.send(content);
        }
    }
};
