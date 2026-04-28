const { 
    EmbedBuilder, 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource,
    AudioPlayerStatus,
    StreamType
} = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    name: 'play',
    description: 'تشغيل موسيقى من يوتيوب',
    category: 'ميوزك',
    usage: '!play [رابط أو اسم]',
    
    async execute(message, args, client) {
        try {
            // التحقق من الروم الصوتي
            const voiceChannel = message.member.voice.channel;
            
            if (!voiceChannel) {
                return message.reply('❌ ادخل روم صوتي أولاً!');
            }
            
            if (!args.length) {
                return message.reply('❌ حط رابط يوتيوب أو اسم الأغنية!');
            }
            
            const query = args.join(' ');
            
            // البحث أو التحقق من الرابط
            let video;
            
            if (play.yt_validate(query) === 'video') {
                video = await play.video_info(query);
            } else {
                const search = await play.search(query, { limit: 1 });
                if (!search.length) {
                    return message.reply('❌ ما لقيت شي!');
                }
                video = await play.video_info(search[0].url);
            }
            
            const videoDetails = video.video_details;
            
            // الاتصال بالروم
            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
            
            // إنشاء البلير
            const player = createAudioPlayer();
            
            // تحميل الصوت
            const stream = await play.stream(videoDetails.url);
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });
            
            player.play(resource);
            connection.subscribe(player);
            
            // حفظ في Queue
            if (!client.musicQueue) client.musicQueue = new Map();
            const queue = client.musicQueue.get(message.guild.id) || [];
            queue.push({
                title: videoDetails.title,
                url: videoDetails.url,
                duration: videoDetails.durationInSec,
                requester: message.author.tag,
                thumbnail: videoDetails.thumbnails[0].url
            });
            client.musicQueue.set(message.guild.id, queue);
            
            // إرسال رسالة
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🎵 جاري التشغيل')
                .setThumbnail(videoDetails.thumbnails[0].url)
                .addFields(
                    { name: '🎤 العنوان', value: videoDetails.title, inline: false },
                    { name: '⏱️ المدة', value: formatTime(videoDetails.durationInSec), inline: true },
                    { name: '👤 القناة', value: videoDetails.channel.name, inline: true }
                )
                .setFooter({ text: `طلب من: ${message.author.tag}` })
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
                message.channel.send('❌ خطأ في التشغيل!');
            });
            
        } catch (error) {
            console.error('Play error:', error);
            message.reply('❌ صار خطأ: ' + error.message);
        }
    }
};

async function playNext(connection, player, song) {
    try {
        const stream = await play.stream(song.url);
        const resource = createAudioResource(stream.stream, {
            inputType: stream.type
        });
        player.play(resource);
    } catch (error) {
        console.error('Next error:', error);
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
