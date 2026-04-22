const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'user',
    description: 'معلومات مستخدم',
    category: 'عام',
    usage: '!user أو !user @عضو',
    
    async execute(message, args, client) {
        const target = message.mentions.users.first() || message.author;
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`👤 ${target.tag}`)
            .setThumbnail(target.displayAvatarURL({ dynamic: true, size: 1024 }))
            .addFields(
                { name: '🆔 الايدي', value: target.id, inline: true },
                { name: '🤖 بوت', value: target.bot ? 'نعم' : 'لا', inline: true },
                { name: '📅 تاريخ الإنشاء', value: `<t:${Math.floor(target.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setFooter({ text: `طلب من: ${message.author.tag}` })
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
