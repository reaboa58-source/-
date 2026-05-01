const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'help',
    description: 'عرض قائمة الأوامر',
    category: 'عام',
    usage: '!help',

    async execute(message, args, client) {
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('📚 قائمة الأوامر')
            .setDescription('**أوامر البلاغات:**')
            .addFields(
                { name: '!report', value: 'تقديم بلاغ عن لاعب', inline: false },
                { name: '!reports', value: 'عرض البلاغات (للإدارة)', inline: false },
                { name: '!help', value: 'عرض هذه القائمة', inline: false }
            )
            .setFooter({ text: 'Roblox Report Bot' })
            .setTimestamp();

        await message.reply({ embeds: [embed] });
    }
};
