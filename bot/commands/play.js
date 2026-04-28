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
            
            // التحقق من الـ Nodes
            const nodes = [...shoukaku.nodes.values()];
            console.log('Available nodes:', nodes.length);
            
            if (!nodes.length) {
                return message.reply('❌ ما فيه نودات متصلة!');
            }
            
            const node = nodes[0];
            console.log('Using node:', node.name, 'State:', node.state);
            
            if (node.state !== 1) { // 1 = CONNECTED
                return message.reply('❌ النود مو متصلة!');
            }
            
            await message.reply('🔍 جاري البحث...');
            
            // البحث
            const searchQuery = query.startsWith('http') ? query : `ytsearch:${query}`;
            console.log('Search query:', searchQuery);
            
            const result = await node.rest.resolve(searchQuery);
            console.log('Search result:', JSON.stringify(result, null, 2));
            
            // التحقق من النتيجة
            if (!result) {
                return message.reply('❌ ما فيه رد من Lavalink!');
            }
            
            if (!result.tracks || !Array.isArray(result.tracks)) {
                console.log('No tracks found. Result:', result);
                return message.reply('❌ ما لقيت شي! جرب اسم ثاني.');
            }
            
            if (result.tracks.length === 0) {
                return message.reply('❌ القائمة فاضية!');
            }
            
            const track = result.tracks[0];
            console.log('Selected track:', track.info?.title);
            
            // الاتصال بالروم
            let player;
            try {
                player = await shoukaku.joinVoiceChannel({
                    guildId: message.guild.id,
                    channelId: voiceChannel.id,
                    shardId: 0
                });
            } catch (joinError) {
                console.error('Join error:', joinError);
                return message.reply('❌ ما قدرت ادخل الروم!');
            }
            
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
                    { name: 'Title', value: track.info.title || 'Unknown', inline: false },
                    { name: 'Duration', value: formatTime(track.info.length), inline: true },
                    { name: 'Channel', value: track.info.author || 'Unknown', inline: true }
                )
                .setFooter({ text: `Requested by: ${message.author.tag}` })
                .setTimestamp();
                
            await message.reply({ embeds: [embed] });
            
            // لما يخلص
            player.on('end', (data) => {
                console.log('Track ended:', data);
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
            
            player.on('exception', (error) => {
                console.error('Player exception:', error);
                message.channel.send('❌ Error in playback!').catch(() => {});
            });
            
        } catch (error) {
            console.error('Play error:', error);
            message.reply('❌ Error: ' + error.message);
        }
    }
};

function formatTime(ms) {
    if (!ms || ms === 0) return '00:00';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
