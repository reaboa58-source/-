const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'stop',
    description: 'إيقاف الموسيقى ومغادرة الروم',
    category: 'ميوزك',
    
    async execute(message, args, client) {
        const connection = getVoiceConnection(message.guild.id);
        
        if (!connection) {
            return message.reply('❌ البوت مو في روم صوتي!');
        }
        
        connection.destroy();
        client.musicQueue?.delete(message.guild.id);
        
        await message.reply('⏹️ تم الإيقاف ومغادرة الروم');
    }
};
