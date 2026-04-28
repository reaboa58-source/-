const { EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'leave',
    description: 'يخرج البوت من الروم الصوتي',
    category: 'ميوزك',
    
    async execute(message, args, client) {
        const connection = getVoiceConnection(message.guild.id);
        
        if (!connection) {
            return message.reply('❌ البوت مو في أي روم!');
        }
        
        connection.destroy();
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('👋 خرجت من الروم')
            .setDescription('تم الخروج بنجاح');
            
        await message.reply({ embeds: [embed] });
    }
};
