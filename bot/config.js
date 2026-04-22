require('dotenv').config();

module.exports = {
    token: process.env.MTQ5NDEwNTUyNjYyMjIyODU0MA.GWaWQF.mpl8zPFxMYHlaSbDlP3v4oUBhiotasfE0BKW14,
    clientId: process.env.1494105526622228540,
    prefix: process.env.PREFIX || '!',
    intents: [
        'Guilds',
        'GuildMessages',
        'MessageContent',
        'GuildMembers'
    ]
};
