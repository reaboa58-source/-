const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'stop',
    description: 'إيقاف الموسيقى',
    category: 'ميوزك',
    
    async execute(message, args, client) {
        try {
            const connection = getVoiceConnection(message.guild.id);
            
            if (!connection) {
                return message.reply('❌ البوت مو في روم!');
            }
            
            connection.destroy();
            client.musicQueue?.delete(message.guild.id);
            
            await message.reply('⏹️ تم الإيقاف');
            
        } catch (error) {
            console.error('Stop error:', error);
            message.reply('❌ خطأ: ' + error.message);
        }
    }
};
