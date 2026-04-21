const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'info',
    description: 'معلومات عن السيرفر أو العضو',
    category: 'عام',
    usage: '!info أو !info @عضو',
    
    async execute(message, args, client) {
        const target = message.mentions.members.first() || message.member;
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle(`📊 معلومات ${target.user.username}`)
            .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: '👤 الاسم', value: target.user.tag, inline: true },
                { name: '🆔 الايدي', value: target.id, inline: true },
                { name: '📅 تاريخ الانضمام', value: `<t:${Math.floor(target.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: '🤖 البوت', value: target.user.bot ? 'نعم' : 'لا', inline: true },
                { name: '🎨 اللون', value: target.displayHexColor, inline: true },
                { name: '📊 أعلى رتبة', value: target.roles.highest.name, inline: true }
            )
            .setFooter({ text: `طلب من: ${message.author.tag}` })
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
