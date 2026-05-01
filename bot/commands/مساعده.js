const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'مساعده',
    description: 'مساعده',
    category: 'عام',
    usage: '!مساعده',

    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('الاوامر')
            .addFields(
                { name: '!فضيحه', value: 'تقديم فضيحه' },
                { name: '!فضائح', value: 'عرض الفضائح (اداره)' },
                { name: '!فضيحهinfo [رقم]', value: 'تفاصيل فضيحه (اداره)' },
                { name: '!مسح', value: 'مسح الفضائح (اداره)' },
                { name: '!احصائيات', value: 'احصائيات' },
                { name: '!بنج', value: 'فحص البوت' },
                { name: '!مساعده', value: 'هذه القائمه' }
            );

        message.reply({ embeds: [embed] });
    }
};
