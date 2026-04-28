module.exports = {
    name: 'skip',
    description: 'تخطي الأغنية',
    category: 'ميوزك',
    
    async execute(message, args, client, shoukaku) {
        try {
            const queue = client.musicQueue?.get(message.guild.id);
            
            if (!queue || queue.length < 2) {
                return message.reply('❌ ما فيه أغنية جاية!');
            }
            
            const player = shoukaku.players.get(message.guild.id);
            
            if (!player) {
                return message.reply('❌ ما فيه شي شغال!');
            }
            
            queue.shift();
            const next = queue[0];
            
            await player.playTrack({ track: next.encoded });
            
            await message.reply(`⏭️ الحين: **${next.title}**`);
            
        } catch (error) {
            console.error('Skip error:', error);
            message.reply('❌ Error: ' + error.message);
        }
    }
};
