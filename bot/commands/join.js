const { EmbedBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    name: 'join',
    description: 'يدخل البوت لروم صوتي',
    category: 'ميوزك',
    usage: '!join أو !join اسم_الروم',
    
    async execute(message, args, client) {
        try {
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
            
            const connection = joinVoiceChannel({
                channelId: targetChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔊 دخلت الروم')
                .setDescription(`تم الدخول لـ **${targetChannel.name}**`);
                
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error('Join error:', error);
            message.reply('❌ فشل الدخول: ' + error.message);
        }
    }
};
