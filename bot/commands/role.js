const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    name: 'role',
    description: 'إعطاء أو إزالة رتبة',
    category: 'إدارة',
    usage: '!role @عضو @رتبة',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
            return message.reply('❌ تحتاج صلاحية Manage Roles!');
        }
        
        const target = message.mentions.members.first();
        const role = message.mentions.roles.first();
        
        if (!target || !role) return message.reply('❌ استخدم: !role @عضو @رتبة');
        
        if (target.roles.cache.has(role.id)) {
            await target.roles.remove(role);
            await message.reply(`✅ تم إزالة رتبة ${role.name} من ${target.user.tag}`);
        } else {
            await target.roles.add(role);
            await message.reply(`✅ تم إعطاء رتبة ${role.name} لـ ${target.user.tag}`);
        }
    }
};
