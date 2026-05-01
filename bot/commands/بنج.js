module.exports = {
    name: 'بنج',
    description: 'فحص البوت',
    category: 'عام',
    usage: '!بنج',

    async execute(message, args, client) {
        const sent = await message.reply('جاري الفحص...');
        const latency = sent.createdTimestamp - message.createdTimestamp;
        sent.edit(`بنج: ${latency}ms`);
    }
};
