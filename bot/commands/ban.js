const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'ban',
    description: 'حظر عضو من السيرفر',
    category: 'إدارة',
    usage: '!ban @عضو [السبب]',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            return message.reply('❌ تحتاج صلاحية Ban Members!');
        }
        
        const target = message.mentions.members.first();
        if (!target) return message.reply('❌ منشن العضو!');
        
        const reason = args.slice(1).join(' ') || 'بدون سبب';
        
        await target.ban({ reason });
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🔨 حظر عضو')
            .addFields(
                { name: 'العضو', value: `${target.user.tag}`, inline: true },
                { name: 'من قبل', value: `${message.author.tag}`, inline: true },
                { name: 'السبب', value: reason, inline: true }
            )
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
