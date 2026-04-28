module.exports = {
    name: 'stop',
    description: 'إيقاف الموسيقى',
    category: 'ميوزك',
    
    async execute(message, args, client, shoukaku) {
        try {
            if (!shoukaku) {
                return message.reply('❌ Lavalink مو متصل!');
            }
            
            const player = shoukaku.players.get(message.guild.id);
            
            if (!player) {
                return message.reply('❌ ما فيه شي شغال!');
            }
            
            await player.stopTrack();
            await shoukaku.leaveVoiceChannel(message.guild.id);
            
            client.musicQueue?.delete(message.guild.id);
            
            await message.reply('⏹️ تم الإيقاف');
            
        } catch (error) {
            console.error('Stop error:', error);
            message.reply('❌ Error: ' + error.message);
        }
    }
};
