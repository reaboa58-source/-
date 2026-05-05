const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource,
    getVoiceConnection,
    StreamType 
} = require('@discordjs/voice');
const googleTTS = require('google-tts-api');

module.exports = {
    name: 'say',
    description: 'البوت يتكلم كلام مكتوب',
    category: 'ميوزك',
    usage: '!say [الكلام]',

    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) return message.reply('ادخل روم صوتي اولاً!');

        const text = args.join(' ');
        if (!text) return message.reply('اكتب شي عشان اقوله!');

        if (text.length > 200) {
            return message.reply('الكلام طويل! (الحد 200 حرف)');
        }

        try {
            const url = googleTTS.getAudioUrl(text, {
                lang: 'ar',
                slow: false,
                host: 'https://translate.google.com',
            });

            let connection = getVoiceConnection(message.guild.id);
            if (!connection) {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });
            }

            const player = createAudioPlayer();
            connection.subscribe(player);

            const resource = createAudioResource(url, {
                inputType: StreamType.Arbitrary
            });
            player.play(resource);

            await message.reply(`قاعد اقول: "${text}"`);

            player.once('idle', () => {
                // ينظف بعد ما يخلص
            });

            player.on('error', (error) => {
                console.error('TTS error:', error);
            });

        } catch (error) {
            console.error('Say error:', error);
            message.reply('خطأ في التشغيل!');
        }
    }
};
