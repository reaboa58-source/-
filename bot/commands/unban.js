const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unban',
    description: 'فك حظر عضو',
    category: 'إدارة',
    usage: '!unban [ايدي العضو]',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ تحتاج صلاحية Ban Members!');
        }
        
        const userId = args[0];
        if (!userId) return message.reply('❌ حط ايدي العضو!');
        
        await message.guild.members.unban(userId);
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔓 فك حظر')
            .setDescription(`تم فك حظر العضو: ${userId}`)
            .setFooter({ text: `من قبل: ${message.author.tag}` })
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
