const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'search',
    description: 'بحث في يوتيوب',
    category: 'ميوزك',
    usage: '!search [اسم الأغنية]',
    
    async execute(message, args, client, shoukaku) {
        if (!args.length) {
            return message.reply('❌ حط اسم الأغنية!');
        }
        
        try {
            if (!shoukaku) {
                return message.reply('❌ Lavalink مو متصل!');
            }
            
            const nodes = [...shoukaku.nodes.values()];
            if (!nodes.length) {
                return message.reply('❌ ما فيه نودات!');
            }
            
            const node = nodes[0];
            if (node.state !== 1) {
                return message.reply('❌ النود مو متصلة!');
            }
            
            const query = args.join(' ');
            
            await message.reply('🔍 جاري البحث...');
            
            const result = await node.rest.resolve(`ytsearch:${query}`);
            
            console.log('Search result:', JSON.stringify(result, null, 2));
            
            if (!result || !result.tracks || !Array.isArray(result.tracks)) {
                return message.reply('❌ ما لقيت شي! جرب اسم ثاني.');
            }
            
            if (result.tracks.length === 0) {
                return message.reply('❌ القائمة فاضية!');
            }
            
            const tracks = result.tracks.slice(0, 5);
            
            const embed = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('Search Results')
                .setDescription(tracks.map((track, i) => {
                    const duration = track.info?.length ? formatTime(track.info.length) : '00:00';
                    return `${i + 1}. **${track.info?.title || 'Unknown'}**\n` +
                           `   Channel: ${track.info?.author || 'Unknown'} | Duration: ${duration}\n` +
                           `   [Link](${track.info?.uri || '#'})`;
                }).join('\n\n'))
                .setFooter({ text: 'Use !play [number] or !play [url]' });
                
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Search error:', error);
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
