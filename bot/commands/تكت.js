const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    name: 'تكت',
    description: 'فتح تكت للاداره',
    category: 'عام',
    usage: '!تكت',

    async execute(message, args, client) {
        const existingTicket = Array.from(client.tickets.values()).find(t => 
            t.userId === message.author.id && t.status === 'open'
        );
        
        if (existingTicket) {
            return message.reply(`عندك تكت مفتوح بالفعل: <#${existingTicket.channelId}>`);
        }

        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('تكت')
            .setDescription('اضغط الزر عشان تفتح تكت')
            .setFooter({ text: 'التكت للتواصل مع الاداره' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('open_ticket')
                .setLabel('فتح تكت')
                .setStyle(ButtonStyle.Primary)
        );

        await message.reply({ embeds: [embed], components: [row] });
    }
};
