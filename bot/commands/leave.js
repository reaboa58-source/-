const { getVoiceConnection } = require('@discordjs/voice');

module.exports = {
    name: 'leave',
    description: 'يخرج البوت من الروم الصوتي',
    category: 'ميوزك',
    usage: '!leave',

    async execute(message, args, client) {
        const connection = getVoiceConnection(message.guild.id);

        if (!connection) {
            return message.reply('❌ البوت مو في روم صوتي!');
        }

        connection.destroy();
        client.musicQueue?.delete(message.guild.id);

        message.reply('👋 طلعت من الروم!');
    }
};
