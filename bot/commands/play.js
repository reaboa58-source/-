const { 
    EmbedBuilder, 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource,
    AudioPlayerStatus,
    StreamType
} = require('@discordjs/voice');
const yt = require('yt-stream');

module.exports = {
    name: 'play',
    description: 'تشغيل موسيقى من يوتيوب',
    category: 'ميوزك',
    usage: '!play [رابط أو اسم]',
    
    async execute(message, args, client) {
        try {
            const voiceChannel = message.member.voice.channel;
            
            if (!voiceChannel) {
                return message.reply('❌ ادخل روم صوتي أولاً!');
            }
            
            if (!args.length) {
                return message.reply('❌ حط رابط يوتيوب أو اسم الأغنية!');
            }
            
            const query = args.join(' ');
            
            // البحث
            let videoUrl = query;
            
            if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
                // بحث
                const search = await yt.search(query);
                if (!search || !search.length) {
                    return message.reply('❌ ما لقيت شي!');
                }
                videoUrl = search[0].url;
            }
            
            // معلومات الفيديو
            const info = await yt.getInfo(videoUrl);
            
            if (!info) {
                return message.reply('❌ ما قدرت أجيب معلومات الفيديو!');
            }
            
            // الاتصال بالروم
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
            
            // إنشاء البلير
            const player = createAudioPlayer();
            
            // تحميل الصوت
            const stream = await yt.stream(videoUrl, {
                quality: 'high',
                type: 'audio',
                highWaterMark: 1 << 25
            });
            
            const resource = createAudioResource(stream.stream, {
                inputType: StreamType.Arbitrary
            });
            
            player.play(resource);
            connection.subscribe(player);
            
            // حفظ في Queue
            if (!client.musicQueue) client.musicQueue = new Map();
            const queue = client.musicQueue.get(message.guild.id) || [];
            queue.push({
                title: info.title,
                url: videoUrl,
                duration: info.duration,
                requester: message.author.tag,
                thumbnail: info.thumbnail
            });
            client.musicQueue.set(message.guild.id, queue);
            
            // إرسال رسالة
            const embed = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('Now Playing')
                .setThumbnail(info.thumbnail || '')
                .addFields(
                    { name: 'Title', value: info.title, inline: false },
                    { name: 'Duration', value: formatTime(info.duration), inline: true },
                    { name: 'Channel', value: info.author?.name || 'Unknown', inline: true }
                )
                .setFooter({ text: `Requested by: ${message.author.tag}` })
                .setTimestamp();
                
            await message.reply({ embeds: [embed] });
            
            // لما يخلص
            player.on(AudioPlayerStatus.Idle, () => {
                queue.shift();
                if (queue.length > 0) {
                    playNext(connection, player, queue[0]);
                } else {
                    connection.destroy();
                    client.musicQueue.delete(message.guild.id);
                }
            });
            
            player.on('error', error => {
                console.error('Player error:', error.message);
                message.channel.send('❌ Error playing!').catch(() => {});
            });
            
        } catch (error) {
            console.error('Play error:', error);
            message.reply('❌ Error: ' + error.message);
        }
    }
};

async function playNext(connection, player, song) {
    try {
        const stream = await yt.stream(song.url, {
            quality: 'high',
            type: 'audio'
        });
        
        const resource = createAudioResource(stream.stream, {
            inputType: StreamType.Arbitrary
        });
        
        player.play(resource);
    } catch (error) {
        console.error('Next error:', error);
    }
}

function formatTime(seconds) {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
