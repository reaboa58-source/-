const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'lock',
    description: 'قفل القناة',
    category: 'إدارة',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return message.reply('❌ تحتاج صلاحية Manage Channels!');
        }
        
        await message.channel.permissionOverwrites.edit(message.guild.id, {
            SendMessages: false
        });
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🔒 قناة مقفلة')
            .setDescription('تم قفل هذه القناة')
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
