module.exports = {
    name: 'join',
    description: 'يدخل البوت الروم الصوتي',
    category: 'ميوزك',
    usage: '!join',

    async execute(message, args, client) {
        const voiceChannel = message.member.voice.channel;

        if (!voiceChannel) {
            return message.reply('❌ ادخل روم صوتي أولاً!');
        }

        const { joinVoiceChannel } = require('@discordjs/voice');

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator,
        });

        message.reply(`✅ دخلت الروم: **${voiceChannel.name}**`);
    }
};
