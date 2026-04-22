const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'slowmode',
    description: 'تفعيل الوضع البطيء',
    category: 'إدارة',
    usage: '!slowmode [الثواني]',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('❌ تحتاج صلاحية Manage Channels!');
        }
        
        const seconds = parseInt(args[0]);
        if (isNaN(seconds)) return message.reply('❌ حط عدد الثواني!');
        
        await message.channel.setRateLimitPerUser(seconds);
        
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🐌 وضع بطيء')
            .setDescription(seconds === 0 ? 'تم إيقاف الوضع البطيء' : `تم تعيين الوضع البطيء إلى ${seconds} ثانية`)
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
