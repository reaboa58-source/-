const { EmbedBuilder } = require('discord.js');
const yt = require('yt-stream');

module.exports = {
    name: 'search',
    description: 'بحث في يوتيوب',
    category: 'ميوزك',
    usage: '!search [اسم الأغنية]',
    
    async execute(message, args, client) {
        if (!args.length) {
            return message.reply('❌ حط اسم الأغنية!');
        }
        
        try {
            const query = args.join(' ');
            const results = await yt.search(query, { limit: 5 });
            
            if (!results || !results.length) {
                return message.reply('❌ ما لقيت شي!');
            }
            
            const embed = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('Search Results')
                .setDescription(results.map((video, i) => 
                    `${i + 1}. [${video.title}](${video.url})\n` +
                    `   Channel: ${video.author?.name || 'Unknown'} | Duration: ${formatTime(video.duration)}`
                ).join('\n\n'))
                .setFooter({ text: 'Use !play [number] to play' });
                
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Search error:', error);
            message.reply('❌ Error searching: ' + error.message);
        }
    }
};

function formatTime(seconds) {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
