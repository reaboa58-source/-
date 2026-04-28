const { EmbedBuilder } = require('discord.js');
const { Client: YouTubeClient } = require('youtubei');

const youtube = new YouTubeClient();

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
            
            await message.reply('🔍 جاري البحث...');
            
            const results = await youtube.search(query, { type: 'video' });
            
            if (!results || !results.items || !results.items.length) {
                return message.reply('❌ ما لقيت شي!');
            }
            
            const videos = results.items.slice(0, 5);
            
            const embed = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('Search Results')
                .setDescription(videos.map((video, i) => {
                    const duration = video.duration ? 
                        `${video.duration.minutes || 0}:${(video.duration.seconds || 0).toString().padStart(2, '0')}` : 
                        '00:00';
                    
                    return `${i + 1}. **${video.title}**\n` +
                           `   Channel: ${video.channel?.name || 'Unknown'} | Duration: ${duration}\n` +
                           `   [Link](https://youtube.com/watch?v=${video.id})`;
                }).join('\n\n'))
                .setFooter({ text: 'Use !play [number] or !play [url]' });
                
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Search error:', error);
            message.reply('❌ Error: ' + error.message);
        }
    }
};
