const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'kick',
    description: 'طرد عضو من السيرفر',
    category: 'إدارة',
    usage: '!kick @عضو [السبب]',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            return message.reply('❌ تحتاج صلاحية Kick Members!');
        }
        
        const target = message.mentions.members.first();
        if (!target) return message.reply('❌ منشن العضو!');
        
        const reason = args.slice(1).join(' ') || 'بدون سبب';
        
        await target.kick(reason);
        
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('👢 طرد عضو')
            .addFields(
                { name: 'العضو', value: `${target.user.tag}`, inline: true },
                { name: 'من قبل', value: `${message.author.tag}`, inline: true },
                { name: 'السبب', value: reason, inline: true }
            )
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
