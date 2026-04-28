const { 
    EmbedBuilder, 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource,
    AudioPlayerStatus,
    StreamType
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const { Client: YouTubeClient } = require('youtubei');

const youtube = new YouTubeClient();

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
            let videoUrl = query;
            let videoInfo;
            
            // لو مو رابط، نبحث
            if (!ytdl.validateURL(query) && !query.includes('youtu.be')) {
                await message.reply('🔍 جاري البحث...');
                
                const searchResults = await youtube.search(query, { type: 'video' });
                
                if (!searchResults || !searchResults.items || !searchResults.items.length) {
                    return message.reply('❌ ما لقيت شي!');
                }
                
                const firstVideo = searchResults.items[0];
                videoUrl = `https://youtube.com/watch?v=${firstVideo.id}`;
                videoInfo = {
                    title: firstVideo.title,
                    author: { name: firstVideo.channel?.name || 'Unknown' },
                    lengthSeconds: firstVideo.duration?.seconds || 0,
                    thumbnails: firstVideo.thumbnails || []
                };
            } else {
                // رابط مباشر
                const info = await ytdl.getInfo(videoUrl);
                videoInfo = info.videoDetails;
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
            const stream = ytdl(videoUrl, { 
                filter: 'audioonly',
                quality: 'highestaudio',
                highWaterMark: 1 << 25
            });
            
            const resource = createAudioResource(stream, {
                inputType: StreamType.Arbitrary
            });
            
            player.play(resource);
            connection.subscribe(player);
            
            // حفظ في Queue
            if (!client.musicQueue) client.musicQueue = new Map();
            const queue = client.musicQueue.get(message.guild.id) || [];
            queue.push({
                title: videoInfo.title,
                url: videoUrl,
                duration: videoInfo.lengthSeconds,
                requester: message.author.tag,
                thumbnail: videoInfo.thumbnails?.[0]?.url || ''
            });
            client.musicQueue.set(message.guild.id, queue);
            
            // إرسال رسالة
            const embed = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('Now Playing')
                .setThumbnail(videoInfo.thumbnails?.[0]?.url || '')
                .addFields(
                    { name: 'Title', value: videoInfo.title, inline: false },
                    { name: 'Duration', value: formatTime(videoInfo.lengthSeconds), inline: true },
                    { name: 'Channel', value: videoInfo.author?.name || 'Unknown', inline: true }
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
        const stream = ytdl(song.url, { 
            filter: 'audioonly',
            quality: 'highestaudio'
        });
        
        const resource = createAudioResource(stream, {
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
