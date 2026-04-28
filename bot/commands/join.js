const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    name: 'join',
    description: 'يدخل البوت لروم صوتي معين',
    category: 'ميوزك',
    usage: '!join اسم_الروم',
    
    async execute(message, args, client) {
        // التحقق من الصلاحيات
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ تحتاج صلاحية Administrator!');
        }
        
        // لو ما حط اسم روم، نبحث عن أول روم صوتي
        let targetChannel;
        
        if (args.length > 0) {
            const channelName = args.join(' ');
            targetChannel = message.guild.channels.cache.find(
                ch => ch.type === 2 && ch.name.toLowerCase().includes(channelName.toLowerCase())
            );
        } else {
            // أول روم صوتي
            targetChannel = message.guild.channels.cache.find(ch => ch.type === 2);
        }
        
        if (!targetChannel) {
            return message.reply('❌ ما لقيت روم صوتي!');
        }
        
        try {
            const connection = joinVoiceChannel({
                channelId: targetChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });
            
            const embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle('🔊 دخلت الروم')
                .setDescription(`تم الدخول لـ **${targetChannel.name}**`)
                .setFooter({ text: `بواسطة: ${message.author.tag}` });
                
            await message.reply({ embeds: [embed] });
            
        } catch (error) {
            console.error(error);
            await message.reply('❌ فشل الدخول: ' + error.message);
        }
    }
};
