const { EmbedBuilder } = require('discord.js');
const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'leave',
    description: 'يخرج البوت من الروم',
    category: 'ميوزك',
    
    async execute(message, args, client) {
        try {
            const connection = getVoiceConnection(message.guild.id);
            
            if (!connection) {
                return message.reply('❌ البوت مو في أي روم!');
            }
            
            connection.destroy();
            client.musicQueue?.delete(message.guild.id);
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('👋 خرجت من الروم');
                
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Leave error:', error);
            message.reply('❌ خطأ: ' + error.message);
        }
    }
};
