const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'banner',
    description: 'بانر العضو',
    category: 'عام',
    usage: '!banner أو !banner @عضو',
    
    async execute(message, args, client) {
        const target = message.mentions.users.first() || message.author;
        const user = await client.users.fetch(target.id, { force: true });
        
        if (!user.banner) {
            return message.reply('❌ هذا المستخدم لا يملك بانر!');
        }
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`🎨 بانر ${user.username}`)
            .setImage(user.bannerURL({ dynamic: true, size: 4096 }))
            .setFooter({ text: `طلب من: ${message.author.tag}` });
            
        await message.reply({ embeds: [embed] });
    }
};
