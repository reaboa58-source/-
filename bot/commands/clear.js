const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'clear',
    description: 'مسح الرسائل',
    category: 'إدارة',
    usage: '!clear [عدد]',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return message.reply('❌ تحتاج صلاحية Manage Messages!');
        }
        
        const amount = parseInt(args[0]);
        if (!amount || amount < 1 || amount > 100) {
            return message.reply('❌ حط عدد بين 1 و 100!');
        }
        
        await message.channel.bulkDelete(amount + 1);
        
        const msg = await message.channel.send(`✅ تم مسح ${amount} رسالة!`);
        setTimeout(() => msg.delete(), 3000);
    }
};
