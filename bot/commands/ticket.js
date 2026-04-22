const { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} = require('discord.js');

module.exports = {
    name: 'ticket',
    description: 'إرسال رسالة التكت مع الأزرار',
    category: 'إدارة',
    usage: '!ticket',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ تحتاج صلاحية Administrator!');
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🎫 نظام التذاكر')
            .setDescription('اضغط على الزر أدناه لفتح تذكرة\nسيتم الرد عليك في أقرب وقت')
            .setThumbnail(message.guild.iconURL())
            .setFooter({ text: message.guild.name });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('open_ticket')
                    .setLabel('🎫 فتح تذكرة')
                    .setStyle(ButtonStyle.Primary)
            );

        await message.channel.send({ embeds: [embed], components: [row] });
        await message.delete().catch(() => {});
    }
};
