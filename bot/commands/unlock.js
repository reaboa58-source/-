const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'unlock',
    description: 'فتح القناة',
    category: 'إدارة',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('❌ تحتاج صلاحية Manage Channels!');
        }
        
        await message.channel.permissionOverwrites.edit(message.guild.id, {
            SendMessages: true
        });
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🔓 قناة مفتوحة')
            .setDescription('تم فتح هذه القناة')
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
