const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    name: 'warnings',
    description: 'عرض تحذيرات عضو',
    category: 'إدارة',
    usage: '!warnings @عضو',
    
    async execute(message, args, client) {
        const target = message.mentions.members.first() || message.member;
        
        let warnings = {};
        try {
            warnings = JSON.parse(fs.readFileSync('./warnings.json', 'utf8'));
        } catch {
            return message.reply('❌ لا توجد تحذيرات!');
        }
        
        const userWarnings = warnings[target.id] || [];
        
        if (userWarnings.length === 0) {
            return message.reply(`✅ ${target.user.tag} ليس لديه تحذيرات!`);
        }
        
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(`⚠️ تحذيرات ${target.user.tag}`)
            .setDescription(userWarnings.map((w, i) => 
                `${i + 1}. ${w.reason} (بواسطة <@${w.by}>)`
            ).join('\n'))
            .setFooter({ text: `الإجمالي: ${userWarnings.length}` })
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
