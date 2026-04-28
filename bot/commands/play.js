const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'play',
    description: 'تشغيل موسيقى من يوتيوب',
    category: 'ميوزك',
    usage: '!play [رابط أو اسم]',
    
    async execute(message, args, client, shoukaku) {
        try {
            const voiceChannel = message.member.voice.channel;
            
            if (!voiceChannel) {
                return message.reply('❌ ادخل روم صوتي أولاً!');
            }
            
            if (!args.length) {
                return message.reply('❌ حط رابط يوتيوب أو اسم الأغنية!');
            }
            
            if (!shoukaku) {
                return message.reply('❌ Lavalink مو متصل!');
            }
            
            const query = args.join(' ');
            
            // البحث في Lavalink
            const node = shoukaku.options.nodeResolver(shoukaku.nodes);
            
            if (!node) {
                return message.reply('❌ ما فيه نود متاح!');
            }
            
            await message.reply('🔍 جاري البحث...');
            
            // البحث
            const searchQuery = query.startsWith('http') ? query : `ytsearch:${query}`;
            const result = await node.rest.resolve(searchQuery);
            
            if (!result || !result.tracks.length) {
                return message.reply('❌ ما لقيت شي!');
            }
            
            const track = result.tracks[0];
            
            // الاتصال بالروم
            const player = await shoukaku.joinVoiceChannel({
                guildId: message.guild.id,
                channelId: voiceChannel.id,
                shardId: 0
            });
            
            // تشغيل
            await player.playTrack({ track: track.encoded });
            
            // حفظ في Queue
            if (!client.musicQueue) client.musicQueue = new Map();
            const queue = client.musicQueue.get(message.guild.id) || [];
            queue.push({
                title: track.info.title,
                url: track.info.uri,
                duration: track.info.length,
                requester: message.author.tag,
                author: track.info.author,
                encoded: track.encoded
            });
            client.musicQueue.set(message.guild.id, queue);
            
            // إرسال رسالة
            const embed = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('Now Playing')
                .addFields(
                    { name: 'Title', value: track.info.title, inline: false },
                    { name: 'Duration', value: formatTime(track.info.length), inline: true },
                    { name: 'Channel', value: track.info.author, inline: true }
                )
                .setFooter({ text: `Requested by: ${message.author.tag}` })
                .setTimestamp();
                
            await message.reply({ embeds: [embed] });
            
            // لما يخلص
            player.on('end', () => {
                const currentQueue = client.musicQueue.get(message.guild.id);
                if (currentQueue) {
                    currentQueue.shift();
                    if (currentQueue.length > 0) {
                        player.playTrack({ track: currentQueue[0].encoded });
                    } else {
                        shoukaku.leaveVoiceChannel(message.guild.id);
                        client.musicQueue.delete(message.guild.id);
                    }
                }
            });
            
        } catch (error) {
            console.error('Play error:', error);
            message.reply('❌ Error: ' + error.message);
        }
    }
};

function formatTime(ms) {
    if (!ms) return '00:00';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
