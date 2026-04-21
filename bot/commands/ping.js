const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'ping',
    description: 'يظهر سرعة استجابة البوت',
    category: 'عام',
    
    async execute(message, args, client) {
        const ping = client.ws.ping;
        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('🏓 بينغ!')
            .setDescription(`سرعة الاستجابة: **${ping}ms**`)
            .setTimestamp();
            
        await message.reply({ embeds: [embed] });
    }
};
