const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'avatar',
    description: 'صورة البروفايل',
    category: 'عام',
    usage: '!avatar أو !avatar @عضو',
    
    async execute(message, args, client) {
        const target = message.mentions.users.first() || message.author;
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`🖼️ صورة ${target.username}`)
            .setImage(target.displayAvatarURL({ dynamic: true, size: 4096 }))
            .setFooter({ text: `طلب من: ${message.author.tag}` });
            
        await message.reply({ embeds: [embed] });
    }
};
