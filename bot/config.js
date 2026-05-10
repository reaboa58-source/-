require('dotenv').config();

module.exports = {
   // السطر 4:
token: process.env.DISCORD_TOKEN || null, // بدل ما يكرش
    clientId: process.env.CLIENT_ID,
    prefix: process.env.PREFIX || '!',
    intents: [
        'Guilds',
        'GuildMessages',
        'MessageContent',
        'GuildMembers'
    ]
};
