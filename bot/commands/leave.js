module.exports = {
    name: 'leave',
    description: 'يخرج البوت من الروم',
    category: 'ميوزك',
    
    async execute(message, args, client, shoukaku) {
        try {
            if (!shoukaku) {
                return message.reply('❌ Lavalink مو متصل!');
            }
            
            const player = shoukaku.players.get(message.guild.id);
            
            if (player) {
                await player.stopTrack();
            }
            
            await shoukaku.leaveVoiceChannel(message.guild.id);
            client.musicQueue?.delete(message.guild.id);
            
            await message.reply('👋 تم الخروج');
            
        } catch (error) {
            console.error('Leave error:', error);
            message.reply('❌ Error: ' + error.message);
        }
    }
};
