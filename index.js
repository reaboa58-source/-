const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ] 
});

const TOKEN = process.env.TOKEN || 'MTQ5NDEwNTUyNjYyMjIyODU0MA.GMAMFn.dOedlVmo7hivMwJpYYFv-PBCma0ZOr6bouSdgo';
const CLIENT_ID = process.env.CLIENT_ID || '1494105526622228540';


const commands = [
  new SlashCommandBuilder().setName('ping').setDescription('يرسل كم سرعة استجابة البوت'),
  new SlashCommandBuilder().setName('server').setDescription('يعرض معلومات السيرفر'),
  new SlashCommandBuilder().setName('user').setDescription('يعرض معلوماتك').addUserOption(option => option.setName('target').setDescription('اختر مستخدم')),
  new SlashCommandBuilder().setName('clear').setDescription('يمسح رسائل').addIntegerOption(option => option.setName('amount').setDescription('عدد الرسائل').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
  new SlashCommandBuilder().setName('ban').setDescription('يبند عضو').addUserOption(option => option.setName('target').setDescription('العضو').setRequired(true)).addStringOption(option => option.setName('reason').setDescription('السبب')).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  new SlashCommandBuilder().setName('kick').setDescription('يطرد عضو').addUserOption(option => option.setName('target').setDescription('العضو').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  new SlashCommandBuilder().setName('guess').setDescription('لعبة تخمين رقم من 1-10')
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
  try {
    console.log('جاري تسجيل الأوامر...');
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
    console.log('✅ تم تسجيل الأوامر بنجاح!');
  } catch (error) {
    console.error(error);
  }
})();


client.on('ready', () => {
  console.log(`✅ Bot is ready! Logged in as ${client.user.tag}`);
  client.user.setActivity('Type /help', { type: 'PLAYING' });
});


client.on('guildMemberAdd', async (member) => {
  const channel = member.guild.channels.cache.find(ch => ch.name === 'general' || ch.name === 'welcome' || ch.name === 'الترحيب');
  if (channel) {
    channel.send(`👋 مرحباً يا ${member}! أهلاً بك في ${member.guild.name} 🎉`);
  }
});


client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  
  const msg = message.content.toLowerCase();
  if (msg === 'السلام عليكم') message.reply('وعليكم السلام! 👋');
  else if (msg === 'كيف الحال') message.reply('الحمدلله، وأنت؟ 😊');
  else if (msg.includes('بوت')) message.reply('أنا هنا! كيف أقدر أساعدك؟ 🤖');
});


const guessGames = new Map();

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  switch (interaction.commandName) {
    case 'ping':
      await interaction.reply(`🏓 Pong! سرعة الاستجابة: ${Date.now() - interaction.createdTimestamp}ms | API: ${Math.round(client.ws.ping)}ms`);
      break;

    case 'server':
      await interaction.reply(`
📊 **معلومات السيرفر:** ${interaction.guild.name}
👥 الأعضاء: ${interaction.guild.memberCount}
📅 تاريخ الإنشاء: ${interaction.guild.createdAt.toLocaleDateString('ar-SA')}
👑 المالك: <@${interaction.guild.ownerId}>
      `);
      break;

    case 'user':
      const target = interaction.options.getUser('target') || interaction.user;
      const member = await interaction.guild.members.fetch(target.id);
      await interaction.reply(`
👤 **معلومات ${target.username}:**
🆔 ID: ${target.id}
📅 انضمام: ${member.joinedAt.toLocaleDateString('ar-SA')}
📆 إنشاء الحساب: ${target.createdAt.toLocaleDateString('ar-SA')}
      `);
      break;

    case 'clear':
      const amount = interaction.options.getInteger('amount');
      if (amount > 100) {
        await interaction.reply({ content: '❌ الحد الأقصى 100 رسالة!', ephemeral: true });
        return;
      }
      await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({ content: `✅ تم مسح ${amount} رسالة`, ephemeral: true });
      break;

    case 'ban':
      const banTarget = interaction.options.getMember('target');
      const banReason = interaction.options.getString('reason') || 'No reason';
      await banTarget.ban({ reason: banReason });
      await interaction.reply(`🔨 ${banTarget.user.tag} تم حظره\nالسبب: ${banReason}`);
      break;

    case 'kick':
      const kickTarget = interaction.options.getMember('target');
      await kickTarget.kick();
      await interaction.reply(`👢 ${kickTarget.user.tag} تم طرده من السيرفر`);
      break;

    case 'guess':
      const number = Math.floor(Math.random() * 10) + 1;
      guessGames.set(interaction.user.id, number);
      await interaction.reply('🎮 لقد اخترت رقم من 1 إلى 10! ارسل رقمك في شات عادي (عندك 30 ثانية)');
      
      const filter = m => m.author.id === interaction.user.id && !isNaN(m.content);
      const collector = interaction.channel.createMessageCollector({ filter, time: 30000, max: 1 });
      
      collector.on('collect', async (m) => {
        const guess = parseInt(m.content);
        if (guess === number) {
          await interaction.followUp('🎉 صحيح! فزت!');
        } else {
          await interaction.followUp(`❌ خطأ! الرقم كان: ${number}`);
        }
        guessGames.delete(interaction.user.id);
      });
      break;
  }
});

client.login(TOKEN);
