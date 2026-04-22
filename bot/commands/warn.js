const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'warn',
    description: 'تحذير عضو',
    category: 'إدارة',
    usage: '!warn @عضو [السبب]',
    
    async execute(message, args, client) {
        if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return message.reply('❌ تحتاج صلاحية Moderate Members!');
        }
        
        const target = message.mentions.members.first();
        if (!target) return message.reply('❌ منشن العضو!');
        
        const reason = args.slice(1).join(' ') || 'بدون سبب';
        
        // حفظ التحذير
        const warnings = JSON.parse(fs.readFileSync('./warnings.json', 'utf8').catch(() => '{}'));
        if (!warnings[target.id]) warnings[target.id] = [];
        
        warnings[target.id].push({
            reason,
            by: message.author.id,
            date: new Date().toISOString()
        });
        
        fs.writeFileSync('./warnings.json', JSON.stringify(warnings, null, 2));
        
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle('⚠️ تحذير')
            .addFields(
                { name: 'العضو', value: `${target.user.tag}`, inline: true },
                { name: 'السبب', value: reason, inline: true },
                { name: 'عدد التحذيرات', value: `${warnings[target.id].length}`, inline: true }
            )
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
