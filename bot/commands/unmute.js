const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unmute',
    description: 'فك كتم عضو',
    category: 'إدارة',
    usage: '!unmute @عضو',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ تحتاج صلاحية Moderate Members!');
        }
        
        const target = message.mentions.members.first();
        if (!target) return message.reply('❌ منشن العضو!');
        
        await target.timeout(null);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔊 فك كتم')
            .setDescription(`تم فك كتم ${target.user.tag}`)
            .setFooter({ text: `من قبل: ${message.author.tag}` })
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
