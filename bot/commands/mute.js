const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'mute',
    description: 'كتم عضو',
    category: 'إدارة',
    usage: '!mute @عضو [المدة بالدقائق]',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ تحتاج صلاحية Moderate Members!');
        }
        
        const target = message.mentions.members.first();
        if (!target) return message.reply('❌ منشن العضو!');
        
        const duration = parseInt(args[1]) || 10; // دقائق
        
        await target.timeout(duration * 60 * 1000, `كتم بواسطة ${message.author.tag}`);
        
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('🔇 كتم عضو')
            .addFields(
                { name: 'العضو', value: `${target.user.tag}`, inline: true },
                { name: 'المدة', value: `${duration} دقيقة`, inline: true },
                { name: 'من قبل', value: `${message.author.tag}`, inline: true }
            )
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
