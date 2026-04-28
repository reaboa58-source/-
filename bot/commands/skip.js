const { getVoiceConnection, createAudioPlayer, createAudioResource } = require('@discordjs/voice');
const ytdl = require('ytdl-core');

module.exports = {
    name: 'skip',
    description: 'تخطي الأغنية الحالية',
    category: 'ميوزك',
    
    async execute(message, args, client) {
        const queue = client.musicQueue?.get(message.guild.id);
        
        if (!queue || queue.length < 2) {
            return message.reply('❌ ما فيه أغنية جاية!');
        }
        
        queue.shift();
        const next = queue[0];
        
        const connection = getVoiceConnection(message.guild.id);
        const player = createAudioPlayer();
        
        const stream = ytdl(next.url, { filter: 'audioonly' });
        const resource = createAudioResource(stream);
        
        player.play(resource);
        connection.subscribe(player);
        
        await message.reply(`⏭️ تم التخطي! الحين: **${next.title}**`);
    }
};
