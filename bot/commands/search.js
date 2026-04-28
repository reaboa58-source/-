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
            
            const query = args.join(' ');
            const node = shoukaku.options.nodeResolver(shoukaku.nodes);
            
            if (!node) {
                return message.reply('❌ ما فيه نود متاح!');
            }
            
            await message.reply('🔍 جاري البحث...');
            
            const result = await node.rest.resolve(`ytsearch:${query}`);
            
            if (!result || !result.tracks.length) {
                return message.reply('❌ ما لقيت شي!');
            }
            
            const tracks = result.tracks.slice(0, 5);
            
            const embed = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('Search Results')
                .setDescription(tracks.map((track, i) => {
                    return `${i + 1}. **${track.info.title}**\n` +
                           `   Channel: ${track.info.author} | Duration: ${formatTime(track.info.length)}\n` +
                           `   [Link](${track.info.uri})`;
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
    if (!ms) return '00:00';
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
