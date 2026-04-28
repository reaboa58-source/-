const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'queue',
    description: 'عرض القائمة',
    category: 'ميوزك',
    
    async execute(message, args, client) {
        try {
            const queue = client.musicQueue?.get(message.guild.id);
            
            if (!queue || !queue.length) {
                return message.reply('❌ القائمة فاضية!');
            }
            
            const embed = new EmbedBuilder()
                .setColor('#ff0000')
                .setTitle('🎵 قائمة الانتظار')
                .setDescription(queue.map((song, i) => 
                    `${i === 0 ? '▶️' : `${i + 1}.`} ${song.title} (${formatTime(song.duration)})`
                ).join('\n'))
                .setTimestamp();
                
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Queue error:', error);
        }
    }
};

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
