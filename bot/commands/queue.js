const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'queue',
    description: 'عرض قائمة التشغيل',
    category: 'ميوزك',
    usage: '!queue',

    async execute(message, args, client) {
        const queue = client.musicQueue?.get(message.guild.id);

        if (!queue || queue.length === 0) {
            return message.reply('❌ القائمة فاضية!');
        }

        const embed = new EmbedBuilder()
            .setColor('#1a1a1a')
            .setTitle('📋 Queue')
            .setDescription(
                queue.map((song, i) => 
                    `${i === 0 ? '▶️' : `\`${i + 1}.\``} **${song.title}** | ${song.requester}`
                ).join('\n')
            )
            .setFooter({ text: `Total: ${queue.length} songs` });

        message.reply({ embeds: [embed] });
    }
};
