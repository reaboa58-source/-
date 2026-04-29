const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus,
    getVoiceConnection,
    StreamType 
} = require('@discordjs/voice');

module.exports = {
    name: 'play',
    description: 'تشغيل موسيقى من الملفات المحلية',
    category: 'ميوزك',
    usage: '!play [رقم الأغنية أو اسمها]',

    async execute(message, args, client) {
        try {
            const voiceChannel = message.member.voice.channel;
            if (!voiceChannel) return message.reply('❌ ادخل روم صوتي أولاً!');

            const musicFolder = path.join(__dirname, '..', '..', 'music');
            if (!fs.existsSync(musicFolder)) {
                fs.mkdirSync(musicFolder, { recursive: true });
                return message.reply('❌ مجلد الموسيقى فاضي! حط ملفات في `music/`');
            }

            const musicFiles = fs.readdirSync(musicFolder)
                .filter(file => /\.(mp3|wav|ogg|webm|m4a)$/i.test(file))
                .map((file, index) => ({
                    number: index + 1,
                    name: file.replace(/\.[^/.]+$/, ''),
                    file: file,
                    path: path.join(musicFolder, file)
                }));

            if (musicFiles.length === 0) {
                return message.reply('❌ ما فيه ملفات موسيقى! حط ملفات صوتية في `music/`');
            }

            if (!args.length) {
                const listEmbed = new EmbedBuilder()
                    .setColor('#1a1a1a')
                    .setTitle('🎵 قائمة الأغاني المتاحة')
                    .setDescription(musicFiles.map(s => `\`${s.number}.\` **${s.name}**`).join('\n'))
                    .setFooter({ text: `اكتب: !play [رقم أو اسم]` });
                return message.reply({ embeds: [listEmbed] });
            }

            const query = args.join(' ').toLowerCase();
            let selectedSong;
            const songNumber = parseInt(query);
            
            if (!isNaN(songNumber) && songNumber > 0 && songNumber <= musicFiles.length) {
                selectedSong = musicFiles[songNumber - 1];
            } else {
                selectedSong = musicFiles.find(s => 
                    s.name.toLowerCase().includes(query) || 
                    s.file.toLowerCase().includes(query)
                );
            }

            if (!selectedSong) return message.reply('❌ ما لقيت الأغنية!');

            // الاتصال بالروم
            let connection = getVoiceConnection(message.guild.id);
            if (!connection) {
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });
            } else if (connection.joinConfig.channelId !== voiceChannel.id) {
                connection.destroy();
                connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });
            }

            let player = connection.state.subscription?.player;
            if (!player) {
                player = createAudioPlayer();
                connection.subscribe(player);
            }

            // تشغيل الملف المحلي
            const resource = createAudioResource(selectedSong.path, {
                inputType: StreamType.Arbitrary
            });
            player.play(resource);

            // حفظ في Queue
            if (!client.musicQueue) client.musicQueue = new Map();
            const queue = client.musicQueue.get(message.guild.id) || [];
            queue.push({
                title: selectedSong.name,
                file: selectedSong.file,
                path: selectedSong.path,
                requester: message.author.tag,
                type: 'file'
            });
            client.musicQueue.set(message.guild.id, queue);

            const embed = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('🎵 Now Playing')
                .addFields(
                    { name: 'Title', value: selectedSong.name, inline: false },
                    { name: 'Type', value: '🎵 Music File', inline: true },
                    { name: 'Requested by', value: message.author.tag, inline: true }
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });

            // لما تخلص
            player.once(AudioPlayerStatus.Idle, () => {
                const currentQueue = client.musicQueue.get(message.guild.id);
                if (currentQueue) {
                    currentQueue.shift();
                    if (currentQueue.length > 0) {
                        const next = currentQueue[0];
                        const nextResource = createAudioResource(next.path, {
                            inputType: StreamType.Arbitrary
                        });
                        player.play(nextResource);
                        message.channel.send(`▶️ **${next.title}**`).catch(() => {});
                    } else {
                        connection.destroy();
                        client.musicQueue.delete(message.guild.id);
                    }
                }
            });

            player.on('error', (error) => {
                console.error('Player error:', error);
                message.channel.send('❌ خطأ في التشغيل!').catch(() => {});
            });

        } catch (error) {
            console.error('Play error:', error);
            message.reply('❌ Error: ' + error.message);
        }
    }
};
