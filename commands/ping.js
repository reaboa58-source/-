module.exports = {
    name: 'ping',
    description: 'فحص سرعة البوت',
    category: 'عام',
    usage: '!ping',

    async execute(message, args, client) {
        const sent = await message.reply('🏓 Pong!');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        const apiLatency = Math.round(client.ws.ping);

        sent.edit(`🏓 Pong!\n⏱️ Bot: ${latency}ms\n🌐 API: ${apiLatency}ms`);
    }
};
