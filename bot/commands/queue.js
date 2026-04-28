const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'queue',
    description: 'عرض قائمة الانتظار',
    category: 'ميوزك',
    
    async execute(message, args, client, shoukaku) {
        try {
            const queue = client.musicQueue?.get(message.guild.id);
            
            if (!queue || !queue.length) {
                return message.reply('❌ القائمة فاضية!');
            }
            
            const embed = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('Queue')
                .setDescription(queue.map((song, i) => 
                    `${i === 0 ? '▶️' : `${i + 1}.`} ${song.title} (${formatTime(song.duration)})`
                ).join('\n'))
                .setFooter({ text: `Total: ${queue.length} songs` })
                .setTimestamp();
                
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Queue error:', error);
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
