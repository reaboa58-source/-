const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'stop',
    description: 'إيقاف الموسيقى ومغادرة الروم',
    category: 'ميوزك',
    usage: '!stop',

    async execute(message, args, client) {
        const { getVoiceConnection } = require('@discordjs/voice');

        const connection = getVoiceConnection(message.guild.id);
        if (!connection) {
            return message.reply('❌ البوت مو في روم صوتي!');
        }

        connection.destroy();
        client.musicQueue?.delete(message.guild.id);

        message.reply('⏹️ تم الإيقاف ومغادرة الروم!');
    }
};
