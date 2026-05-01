module.exports = {
    name: 'ping',
    description: 'فحص سرعة البوت',
    category: 'عام',
    usage: '!ping',
    async execute(message, args, client) {
        const sent = await message.reply('🏓 Pong!');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        sent.edit(`🏓 Pong! | ${latency}ms`);
    }
};
