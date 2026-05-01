const { EmbedBuilder } = require('discord.js');
module.exports = {
    name: 'help',
    description: 'مساعدة',
    category: 'عام',
    usage: '!help',
    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📚 الأوامر')
            .addFields(
                { name: '!report', value: 'تقديم بلاغ' },
                { name: '!reports', value: 'عرض البلاغات (إدارة)' },
                { name: '!reportinfo [رقم]', value: 'تفاصيل بلاغ (إدارة)' },
                { name: '!clear', value: 'مسح البلاغات (إدارة)' },
                { name: '!stats', value: 'إحصائيات' },
                { name: '!ping', value: 'فحص البوت' },
                { name: '!help', value: 'هذه القائمة' }
            );
        message.reply({ embeds: [embed] });
    }
};
