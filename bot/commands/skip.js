const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'skip',
    description: 'تخطي الأغنية الحالية',
    category: 'ميوزك',
    usage: '!skip',

    async execute(message, args, client) {
        const { getVoiceConnection } = require('@discordjs/voice');

        const connection = getVoiceConnection(message.guild.id);
        if (!connection) {
            return message.reply('❌ البوت مو في روم صوتي!');
        }

        const queue = client.musicQueue?.get(message.guild.id);
        if (!queue || queue.length === 0) {
            return message.reply('❌ القائمة فاضية!');
        }

        // تخطي = نوقف المشغل الحالي (الـ Idle event يروح للي بعدها)
        connection.state.subscription.player.stop();

        message.reply('⏭️ تم التخطي!');
    }
};
