const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'server',
    description: 'معلومات السيرفر',
    category: 'عام',
    
    async execute(message, args, client) {
        const guild = message.guild;
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📊 معلومات ${guild.name}`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: '👤 الأعضاء', value: `${guild.memberCount}`, inline: true },
                { name: '📅 تاريخ الإنشاء', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
                { name: '👑 المالك', value: `<@${guild.ownerId}>`, inline: true },
                { name: '🏰 القنوات', value: `${guild.channels.cache.size}`, inline: true },
                { name: '🎭 الرتب', value: `${guild.roles.cache.size}`, inline: true },
                { name: '🌍 المنطقة', value: `${guild.preferredLocale}`, inline: true }
            )
            .setFooter({ text: `الايدي: ${guild.id}` })
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
