module.exports = {
    name: 'مسح',
    description: 'مسح الفضائح',
    category: 'اداره',
    usage: '!مسح',

    async execute(message, args, client) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('هذا الامر للاداره فقط!');
        }

        client.reports.clear();
        client.reportCounter = 1;
        message.reply('تم المسح!');
    }
};
