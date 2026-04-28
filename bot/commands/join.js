const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'join',
    description: 'يدخل البوت لروم صوتي',
    category: 'ميوزك',
    usage: '!join أو !join اسم_الروم',
    
    async execute(message, args, client, shoukaku) {
        try {
            if (!shoukaku) {
                return message.reply('❌ Lavalink مو متصل!');
            }
            
            let targetChannel;
            
            if (args.length > 0) {
                const channelName = args.join(' ');
                targetChannel = message.guild.channels.cache.find(
                    ch => ch.type === 2 && ch.name.toLowerCase().includes(channelName.toLowerCase())
                );
            } else {
                targetChannel = message.member.voice.channel || message.guild.channels.cache.find(ch => ch.type === 2);
            }
            
            if (!targetChannel) {
                return message.reply('❌ ما لقيت روم صوتي!');
            }
            
            await shoukaku.joinVoiceChannel({
                guildId: message.guild.id,
                channelId: targetChannel.id,
                shardId: 0
            });
            
            const embed = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('Joined Voice Channel')
                .setDescription(`Joined **${targetChannel.name}**`);
                
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Join error:', error);
            message.reply('❌ Error: ' + error.message);
        }
    }
};
