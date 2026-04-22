const { EmbedBuilder } = require('discord.js');

module.exports = {
    name: 'say',
    description: 'يكرر رسالتك',
    category: 'عام',
    usage: '!say [الرسالة]',
    
    async execute(message, args, client) {
        const text = args.join(' ');
        
        if (!text) {
            return message.reply('❌ استخدم: `!say [الرسالة]`');
        }
        
        await message.delete().catch(() => {});
        await message.channel.send(text);
    }
};
