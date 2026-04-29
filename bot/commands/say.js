const { EmbedBuilder } = require('discord.js');
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
    description: 'البوت يتكلم كلام مكتوب بصوت عربي',
    category: 'ميوزك',
    usage: '!say [الكلام اللي تبيه]',

    async execute(message, args, client) {
        try {
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.reply('❌ ادخل روم صوتي أولاً!');

            const text = args.join(' ');
            if (!text) return message.reply('❌ اكتب شي عشان أقوله!\nمثال: `!say مرحبا بالجميع`');

            if (text.length > 200) {
                return message.reply('❌ الكلام طويل! (الحد الأقصى 200 حرف)');
            }

            await message.reply('🔊 جاري التحضير...');

            // الحصول على رابط الصوت من Google TTS
            const url = googleTTS.getAudioUrl(text, {
                lang: 'ar',
                slow: false,
                host: 'https://translate.google.com',
            });

            // الاتصال بالروم
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

            // تشغيل الصوت من الرابط
            const resource = createAudioResource(url, {
                inputType: StreamType.Arbitrary
            });
            player.play(resource);

            // حفظ في Queue
            if (!client.musicQueue) client.musicQueue = new Map();
            const queue = client.musicQueue.get(message.guild.id) || [];
            queue.push({
                title: `🗣️ "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`,
                requester: message.author.tag,
                type: 'tts'
            });
            client.musicQueue.set(message.guild.id, queue);

            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🗣️ Speaking')
                .setDescription(`**"${text}"**`)
                .setFooter({ text: `Requested by: ${message.author.tag}` })
                .setTimestamp();

            await message.channel.send({ embeds: [embed] });

            // لما يخلص
            player.once('idle', () => {
                const currentQueue = client.musicQueue.get(message.guild.id);
                if (currentQueue) {
                    currentQueue.shift();
                    if (currentQueue.length === 0) {
                        client.musicQueue.delete(message.guild.id);
                    }
                }
            });

            player.on('error', (error) => {
                console.error('TTS error:', error);
                message.channel.send('❌ خطأ في التشغيل!').catch(() => {});
            });

        } catch (error) {
            console.error('Say error:', error);
            message.reply('❌ Error: ' + error.message);
        }
    }
};
