module.exports = {
    name: 'clear',
    description: 'مسح كل البلاغات (للإدارة فقط)',
    category: 'إدارة',
    usage: '!clear',

    async execute(message, args, client) {
        if (!message.member.permissions.has('Administrator')) {
            return message.reply('❌ هذا الأمر للإدارة فقط!');
        }

        client.reports.clear();
        client.reportCounter = 1;

        await message.reply('🗑️ تم مسح جميع البلاغات!');
    }
};
