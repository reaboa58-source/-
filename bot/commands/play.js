const { 
    EmbedBuilder, 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource,
    AudioPlayerStatus,
    StreamType
} = require('@discordjs/voice');
const play = require('play-dl');

// 🔥 Lavalink support (إضافة فقط)
let useLavalink = false;
let lavalinkPlayer;

module.exports = {
    name: 'play',
    description: 'تشغيل موسيقى من يوتيوب',
    category: 'ميوزك',
    usage: '!play [رابط أو اسم]',
    
    async execute(message, args, client, player) {
        try {

            // 🔥 لو Lavalink موجود استخدمه
            if (player) {
                useLavalink = true;
                lavalinkPlayer = player;
            }

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
            if (!query.includes('youtube.com') && !query.includes('youtu.be')) {
                await message.reply('🔍 جاري البحث...');
                
                const results = await play.search(query, { limit: 1 });
                
                if (!results || !results.length) {
                    return message.reply('❌ ما لقيت شي!');
                }
                
                const firstVideo = results[0];
                videoUrl = firstVideo.url;
                videoInfo = {
                    title: firstVideo.title,
                    author: { name: firstVideo.channel?.name || 'Unknown' },
                    lengthSeconds: firstVideo.durationInSec || 0,
                    thumbnails: firstVideo.thumbnails || []
                };
            } else {
                const info = await play.video_info(videoUrl);
                videoInfo = {
                    title: info.video_details.title,
                    author: { name: info.video_details.channel?.name || 'Unknown' },
                    lengthSeconds: info.video_details.durationInSec || 0,
                    thumbnails: info.video_details.thumbnails || []
                };
            }

            // 🔥 إذا فيه Lavalink شغّل منه
            if (useLavalink) {
                const queue = lavalinkPlayer.nodes.create(message.guild, {
                    metadata: {
                        channel: message.channel
                    }
                });

                await queue.connect(message.member.voice.channel);

                const result = await lavalinkPlayer.search(videoUrl);

                if (!result.hasTracks()) {
                    return message.reply('❌ ما لقيت شي في Lavalink');
                }

                queue.addTrack(result.tracks[0]);

                if (!queue.isPlaying()) {
                    queue.node.play();
                }

                return message.reply(`🎧 Lavalink Playing: ${videoInfo.title}`);
            }

            // =========================
            // 🔥 كودك الأصلي (بدون تغيير)
            // =========================

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
            
            const player = createAudioPlayer();
            
            const stream = await play.stream(videoUrl);
            
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });
            
            player.play(resource);
            connection.subscribe(player);
            
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
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
