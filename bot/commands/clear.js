module.exports = {
    name: 'clear',
    description: 'مسح البلاغات (للإدارة)',
    category: 'إدارة',
    usage: '!clear',
    async execute(message, args, client) {
        if (!message.member.permissions.has('Administrator')) return message.reply('❌ للإدارة فقط!');
        client.reports.clear();
        client.reportCounter = 1;
        message.reply('🗑️ تم المسح!');
    }
};
