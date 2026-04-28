const { 
    EmbedBuilder, 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource,
    AudioPlayerStatus,
    VoiceConnectionStatus
} = require('@discordjs/voice');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');

module.exports = {
    name: 'play',
    description: 'تشغيل موسيقى من يوتيوب',
    category: 'ميوزك',
    usage: '!play [رابط يوتيوب أو اسم الأغنية]',
    
    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;
        
        if (!voiceChannel) {
            return message.reply('❌ ادخل روم صوتي أولاً!');
        }
        
        if (!args.length) {
            return message.reply('❌ حط رابط يوتيوب أو اسم الأغنية!');
        }
        
        const query = args.join(' ');
        let videoUrl = query;
        
        // لو مو رابط، نبحث
        if (!ytdl.validateURL(query)) {
            const searchResult = await ytSearch(query);
            if (!searchResult.videos.length) {
                return message.reply('❌ ما لقيت شي!');
            }
            videoUrl = searchResult.videos[0].url;
        }
        
        // الاتصال بالروم
        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });
        
        // إنشاء البلير
        const player = createAudioPlayer();
        
        // تحميل الأغنية
        const stream = ytdl(videoUrl, { 
            filter: 'audioonly',
            highWaterMark: 1 << 25 
        });
        
        const resource = createAudioResource(stream);
        
        player.play(resource);
        connection.subscribe(player);
        
        // معلومات الفيديو
        const videoInfo = await ytdl.getInfo(videoUrl);
        const videoDetails = videoInfo.videoDetails;
        
        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🎵 جاري التشغيل')
            .setThumbnail(videoDetails.thumbnails[0].url)
            .addFields(
                { name: '🎤 العنوان', value: videoDetails.title, inline: false },
                { name: '⏱️ المدة', value: formatTime(videoDetails.lengthSeconds), inline: true },
                { name: '👤 القناة', value: videoDetails.author.name, inline: true }
            )
            .setFooter({ text: `طلب من: ${message.author.tag}` })
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
        
        // حفظ في Queue
        if (!client.musicQueue) client.musicQueue = new Map();
        const queue = client.musicQueue.get(message.guild.id) || [];
        queue.push({
            title: videoDetails.title,
            url: videoUrl,
            duration: videoDetails.lengthSeconds,
            requester: message.author.tag
        });
        client.musicQueue.set(message.guild.id, queue);
        
        // لما يخلص
        player.on(AudioPlayerStatus.Idle, () => {
            queue.shift();
            if (queue.length > 0) {
                // تشغيل اللي بعده
                const nextStream = ytdl(queue[0].url, { filter: 'audioonly' });
                const nextResource = createAudioResource(nextStream);
                player.play(nextResource);
            } else {
                connection.destroy();
            }
        });
        
        connection.on(VoiceConnectionStatus.Disconnected, () => {
            connection.destroy();
        });
    }
};

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
