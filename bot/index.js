// index.js - بوت حماية كامل لـ Viirless
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences
  ]
});

client.commands = new Collection();
client.antiraid = new Map();
client.antispam = new Map();
client.antilink = new Map();
client.antinuke = new Map();
client.blacklist = new Set();
client.whitelist = new Map();
client.logs = new Map();
client.punishments = new Map();

// ===== دالات مساعدة =====

function isOwner(member) {
  return member.id === member.guild.ownerId;
}

function isAdmin(member) {
  return member.permissions.has(PermissionsBitField.Flags.Administrator) || isOwner(member);
}

function isTrusted(member) {
  if (isAdmin(member)) return true;
  const trusted = client.whitelist.get(member.guild.id);
  return trusted && trusted.has(member.id);
}

function sendLog(guild, title, description, color = 0xFF0000) {
  const logChannelId = client.logs.get(guild.id);
  if (!logChannelId) return;
  const channel = guild.channels.cache.get(logChannelId);
  if (!channel) return;
  
  channel.send({
    embeds: [{
      color,
      title,
      description,
      timestamp: new Date(),
      footer: { text: 'نظام الحماية' }
    }]
  }).catch(() => {});
}

function punish(member, reason, type = 'kick') {
  if (isTrusted(member)) return false;
  
  const guild = member.guild;
  const botMember = guild.members.me;
  
  if (!botMember.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return false;
  
  switch(type) {
    case 'kick':
      if (!botMember.permissions.has(PermissionsBitField.Flags.KickMembers)) return false;
      member.kick(reason).catch(() => {});
      break;
    case 'ban':
      if (!botMember.permissions.has(PermissionsBitField.Flags.BanMembers)) return false;
      member.ban({ reason, deleteMessageSeconds: 86400 }).catch(() => {});
      break;
    case 'mute':
      if (!botMember.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return false;
      member.timeout(3600000, reason).catch(() => {});
      break;
  }
  
  sendLog(guild, `🛡️ حماية - ${type.toUpperCase()}`, 
    `**العضو:** ${member.user.tag} (${member.id})\n**السبب:** ${reason}`, 0xFF0000);
  
  return true;
}

// ===== ===== ===== الأوامر ===== ===== =====

// 1. ping
client.commands.set('ping', {
  name: 'ping',
  category: 'عام',
  description: 'سرعة البوت',
  execute(message) {
    const ws = client.ws.ping;
    const msg = Date.now() - message.createdTimestamp;
    message.reply(`🏓 **Pong!**\nAPI: ${ws}ms\nBot: ${msg}ms`);
  }
});

// 2. setlog
client.commands.set('setlog', {
  name: 'setlog',
  category: 'اعدادات',
  description: 'تحديد روم اللوق',
  execute(message) {
    if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
    const channel = message.mentions.channels.first();
    if (!channel) return message.reply('منشن الروم!');
    
    client.logs.set(message.guild.id, channel.id);
    message.reply(`✅ تم تعيين روم اللوق: ${channel}`);
  }
});

// 3. whitelist
client.commands.set('whitelist', {
  name: 'whitelist',
  category: 'اعدادات',
  description: 'إضافة/حذف عضو من القائمة البيضاء',
  execute(message) {
    if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
    const target = message.mentions.members.first();
    if (!target) return message.reply('منشن العضو!');
    
    const guildId = message.guild.id;
    if (!client.whitelist.has(guildId)) client.whitelist.set(guildId, new Set());
    const list = client.whitelist.get(guildId);
    
    if (list.has(target.id)) {
      list.delete(target.id);
      message.reply(`✅ تم حذف ${target.user.tag} من القائمة البيضاء`);
    } else {
      list.add(target.id);
      message.reply(`✅ تم إضافة ${target.user.tag} للقائمة البيضاء`);
    }
  }
});

// 4. antiraid
client.commands.set('antiraid', {
  name: 'antiraid',
  category: 'حماية',
  description: 'تفعيل/تعطيل حماية الريد',
  execute(message, args) {
    if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
    const status = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(status)) return message.reply('الاستخدام: !antiraid on/off');
    
    client.antiraid.set(message.guild.id, status === 'on');
    message.reply(`🛡️ حماية الريد: **${status === 'on' ? 'مفعلة' : 'معطلة'}**`);
  }
});

// 5. antispam
client.commands.set('antispam', {
  name: 'antispam',
  category: 'حماية',
  description: 'تفعيل/تعطيل حماية السبام',
  execute(message, args) {
    if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
    const status = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(status)) return message.reply('الاستخدام: !antispam on/off');
    
    client.antispam.set(message.guild.id, status === 'on');
    message.reply(`🛡️ حماية السبام: **${status === 'on' ? 'مفعلة' : 'معطلة'}**`);
  }
});

// 6. antilink
client.commands.set('antilink', {
  name: 'antilink',
  category: 'حماية',
  description: 'تفعيل/تعطيل حماية الروابط',
  execute(message, args) {
    if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
    const status = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(status)) return message.reply('الاستخدام: !antilink on/off');
    
    client.antilink.set(message.guild.id, status === 'on');
    message.reply(`🛡️ حماية الروابط: **${status === 'on' ? 'مفعلة' : 'معطلة'}**`);
  }
});

// 7. antinuke
client.commands.set('antinuke', {
  name: 'antinuke',
  category: 'حماية',
  description: 'تفعيل/تعطيل حماية النوك',
  execute(message, args) {
    if (!isOwner(message.member)) return message.reply('للمالك فقط!');
    const status = args[0]?.toLowerCase();
    if (!['on', 'off'].includes(status)) return message.reply('الاستخدام: !antinuke on/off');
    
    client.antinuke.set(message.guild.id, status === 'on');
    message.reply(`🛡️ حماية النوك: **${status === 'on' ? 'مفعلة' : 'معطلة'}**`);
  }
});

// 8. blacklist
client.commands.set('blacklist', {
  name: 'blacklist',
  category: 'حماية',
  description: 'إضافة/حذف عضو من القائمة السوداء',
  execute(message) {
    if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
    const target = message.mentions.members.first();
    if (!target) return message.reply('منشن العضو!');
    
    if (client.blacklist.has(target.id)) {
      client.blacklist.delete(target.id);
      message.reply(`✅ تم حذف ${target.user.tag} من القائمة السوداء`);
    } else {
      client.blacklist.add(target.id);
      message.reply(`🚫 تم إضافة ${target.user.tag} للقائمة السوداء`);
      target.kick('القائمة السوداء').catch(() => {});
    }
  }
});

// 9. settings
client.commands.set('settings', {
  name: 'settings',
  category: 'حماية',
  description: 'عرض إعدادات الحماية',
  execute(message) {
    if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
    const guildId = message.guild.id;
    
    message.reply({
      embeds: [{
        color: 0x5865F2,
        title: '🛡️ إعدادات الحماية',
        fields: [
          { name: 'حماية الريد', value: client.antiraid.get(guildId) ? '🟢 مفعلة' : '🔴 معطلة', inline: true },
          { name: 'حماية السبام', value: client.antispam.get(guildId) ? '🟢 مفعلة' : '🔴 معطلة', inline: true },
          { name: 'حماية الروابط', value: client.antilink.get(guildId) ? '🟢 مفعلة' : '🔴 معطلة', inline: true },
          { name: 'حماية النوك', value: client.antinuke.get(guildId) ? '🟢 مفعلة' : '🔴 معطلة', inline: true },
          { name: 'روم اللوق', value: client.logs.get(guildId) ? `<#${client.logs.get(guildId)}>` : 'غير محدد', inline: false }
        ]
      }]
    });
  }
});

// 10. lockdown
client.commands.set('lockdown', {
  name: 'lockdown',
  category: 'حماية',
  description: 'قفل كل الرومات في حالة الطوارئ',
  execute(message) {
    if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
    
    message.guild.channels.cache.forEach(channel => {
      if (channel.isTextBased()) {
        channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false }).catch(() => {});
      }
    });
    
    message.reply('🔒 **تم تفعيل وضع الطوارئ - كل الرومات مقفولة**');
    sendLog(message.guild, '🚨 طوارئ', `تم تفعيل وضع الطوارئ بواسطة ${message.author.tag}`, 0xFF0000);
  }
});

// 11. unlockdown
client.commands.set('unlockdown', {
  name: 'unlockdown',
  category: 'حماية',
  description: 'فك قفل الرومات',
  execute(message) {
    if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
    
    message.guild.channels.cache.forEach(channel => {
      if (channel.isTextBased()) {
        channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true }).catch(() => {});
      }
    });
    
    message.reply('🔓 **تم إلغاء وضع الطوارئ - الرومات مفتوحة**');
    sendLog(message.guild, '✅ إلغاء طوارئ', `تم إلغاء وضع الطوارئ بواسطة ${message.author.tag}`, 0x00FF00);
  }
});

// 12. ban
client.commands.set('ban', {
  name: 'ban',
  category: 'ادارة',
  description: 'حظر عضو',
  execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.BanMembers)) return message.reply('ما عندك صلاحية!');
    const user = message.mentions.users.first();
    if (!user) return message.reply('منشن شخص!');
    
    const reason = args.slice(1).join(' ') || 'بدون سبب';
    message.guild.members.ban(user, { reason, deleteMessageSeconds: 86400 }).then(() => {
      message.reply(`✅ تم حظر ${user.tag} | السبب: ${reason}`);
      sendLog(message.guild, '🔨 حظر يدوي', `**العضو:** ${user.tag}\n**بواسطة:** ${message.author.tag}\n**السبب:** ${reason}`, 0xFF0000);
    }).catch(() => message.reply('❌ ما قدرت!'));
  }
});

// 13. kick
client.commands.set('kick', {
  name: 'kick',
  category: 'ادارة',
  description: 'طرد عضو',
  execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.KickMembers)) return message.reply('ما عندك صلاحية!');
    const member = message.mentions.members.first();
    if (!member) return message.reply('منشن شخص!');
    
    const reason = args.slice(1).join(' ') || 'بدون سبب';
    member.kick(reason).then(() => {
      message.reply(`✅ تم طرد ${member.user.tag} | السبب: ${reason}`);
      sendLog(message.guild, '👢 طرد يدوي', `**العضو:** ${member.user.tag}\n**بواسطة:** ${message.author.tag}\n**السبب:** ${reason}`, 0xFFA500);
    }).catch(() => message.reply('❌ ما قدرت!'));
  }
});

// 14. mute
client.commands.set('mute', {
  name: 'mute',
  category: 'ادارة',
  description: 'كتم عضو',
  execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply('ما عندك صلاحية!');
    const member = message.mentions.members.first();
    if (!member) return message.reply('منشن شخص!');
    
    const duration = args[1] || '1h';
    const ms = duration.endsWith('m') ? parseInt(duration) * 60000 :
               duration.endsWith('h') ? parseInt(duration) * 3600000 :
               duration.endsWith('d') ? parseInt(duration) * 86400000 : 3600000;
    
    const reason = args.slice(2).join(' ') || 'بدون سبب';
    member.timeout(ms, reason).then(() => {
      message.reply(`✅ تم كتم ${member.user.tag} لمدة ${duration} | السبب: ${reason}`);
    }).catch(() => message.reply('❌ ما قدرت!'));
  }
});

// 15. unmute
client.commands.set('unmute', {
  name: 'unmute',
  category: 'ادارة',
  description: 'فك كتم عضو',
  execute(message) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) return message.reply('ما عندك صلاحية!');
    const member = message.mentions.members.first();
    if (!member) return message.reply('منشن شخص!');
    
    member.timeout(null).then(() => {
      message.reply(`✅ تم فك كتم ${member.user.tag}`);
    }).catch(() => message.reply('❌ ما قدرت!'));
  }
});

// 16. clear
client.commands.set('clear', {
  name: 'clear',
  category: 'ادارة',
  description: 'حذف رسائل',
  execute(message, args) {
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) return message.reply('ما عندك صلاحية!');
    const amount = parseInt(args[0]);
    if (!amount || amount < 1 || amount > 100) return message.reply('اكتب رقم من 1-100!');
    
    message.channel.bulkDelete(amount + 1).then(() => {
      message.channel.send(`✅ تم حذف ${amount} رسالة`).then(m => setTimeout(() => m.delete(), 3000));
    });
  }
});

// 17. userinfo
client.commands.set('userinfo', {
  name: 'userinfo',
  category: 'عام',
  description: 'معلومات العضو',
  execute(message) {
    const user = message.mentions.users.first() || message.author;
    const member = message.guild.members.cache.get(user.id);
    
    message.reply({
      embeds: [{
        color: 0x5865F2,
        title: `👤 ${user.username}`,
        thumbnail: { url: user.displayAvatarURL() },
        fields: [
          { name: 'الايدي', value: user.id, inline: true },
          { name: 'الحالة', value: member?.presence?.status || 'غير معروف', inline: true },
          { name: 'الانضمام', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'غير معروف', inline: true },
          { name: 'الحساب', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'بوت؟', value: user.bot ? 'نعم' : 'لا', inline: true },
          { name: 'موثق؟', value: user.flags?.has('VerifiedBot') ? 'نعم' : 'لا', inline: true }
        ]
      }]
    });
  }
});

// 18. serverinfo
client.commands.set('serverinfo', {
  name: 'serverinfo',
  category: 'عام',
  description: 'معلومات السيرفر',
  execute(message) {
    const guild = message.guild;
    message.reply({
      embeds: [{
        color: 0x5865F2,
        title: `🏰 ${guild.name}`,
        thumbnail: { url: guild.iconURL() },
        fields: [
          { name: 'الاعضاء', value: `${guild.memberCount}`, inline: true },
          { name: 'الرومات', value: `${guild.channels.cache.size}`, inline: true },
          { name: 'الرتب', value: `${guild.roles.cache.size}`, inline: true },
          { name: 'المالك', value: `<@${guild.ownerId}>`, inline: true },
          { name: 'الحماية', value: guild.verificationLevel, inline: true },
          { name: 'البوتات', value: `${guild.members.cache.filter(m => m.user.bot).size}`, inline: true }
        ]
      }]
    });
  }
});

// 19. help
client.commands.set('help', {
  name: 'help',
  category: 'عام',
  description: 'قائمة الأوامر',
  execute(message) {
    const categories = { 'حماية': [], 'اعدادات': [], 'ادارة': [], 'عام': [] };
    
    client.commands.forEach(cmd => {
      if (cmd.name === 'help') return;
      const line = `\`!${cmd.name}\` - ${cmd.description}`;
      if (categories[cmd.category]) categories[cmd.category].push(line);
    });
    
    message.reply({
      embeds: [{
        color: 0x5865F2,
        title: '🛡️ قائمة أوامر الحماية',
        fields: [
          { name: '🛡️ الحماية', value: categories['حماية'].join('\n') || 'لا يوجد', inline: false },
          { name: '⚙️ الإعدادات', value: categories['اعدادات'].join('\n') || 'لا يوجد', inline: false },
          { name: '🔨 الإدارة', value: categories['ادارة'].join('\n') || 'لا يوجد', inline: false },
          { name: '📋 العامة', value: categories['عام'].join('\n') || 'لا يوجد', inline: false }
        ],
        footer: { text: `Viirless Protection - ${client.commands.size} امر` }
      }]
    });
  }
});

// ===== ===== ===== أنظمة الحماية ===== ===== =====

// نظام السبام
const spamMap = new Map();

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;
  
  // القائمة السوداء
  if (client.blacklist.has(message.author.id)) {
    message.delete().catch(() => {});
    message.member.kick('القائمة السوداء').catch(() => {});
    return;
  }
  
  const guildId = message.guild.id;
  
  // حماية الروابط
  if (client.antilink.get(guildId) && !isTrusted(message.member)) {
    const linkRegex = /(https?:\/\/|www\.|discord\.gg|discord\.com\/invite)/i;
    if (linkRegex.test(message.content)) {
      message.delete().catch(() => {});
      punish(message.member, 'إرسال روابط', 'mute');
      message.channel.send(`🚫 ${message.author} ممنوع إرسال الروابط!`).then(m => setTimeout(() => m.delete(), 5000));
      return;
    }
  }
  
  // حماية السبام
  if (client.antispam.get(guildId) && !isTrusted(message.member)) {
    const key = `${guildId}-${message.author.id}`;
    const now = Date.now();
    
    if (!spamMap.has(key)) spamMap.set(key, []);
    const userMessages = spamMap.get(key).filter(t => now - t < 5000);
    userMessages.push(now);
    spamMap.set(key, userMessages);
    
    if (userMessages.length > 5) {
      message.channel.bulkDelete(userMessages.length, true).catch(() => {});
      punish(message.member, 'سبام', 'mute');
      message.channel.send(`🚫 ${message.author} تم كتمك بسبب السبام!`).then(m => setTimeout(() => m.delete(), 5000));
      return;
    }
  }
  
  // معالجة الأوامر
  if (!message.content.startsWith('!')) return;
  
  const args = message.content.slice(1).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  
  const command = client.commands.get(commandName);
  if (!command) return;
  
  try {
    command.execute(message, args);
  } catch (error) {
    console.error(error);
    message.reply('❌ صار خطأ!');
  }
});

// حماية الريد (دخول أعضاء كثير)
const joinMap = new Map();

client.on('guildMemberAdd', (member) => {
  const guildId = member.guild.id;
  
  // القائمة السوداء
  if (client.blacklist.has(member.id)) {
    member.kick('القائمة السوداء').catch(() => {});
    return;
  }
  
  // حماية الريد
  if (client.antiraid.get(guildId)) {
    const now = Date.now();
    if (!joinMap.has(guildId)) joinMap.set(guildId, []);
    
    const joins = joinMap.get(guildId).filter(t => now - t < 10000);
    joins.push(now);
    joinMap.set(guildId, joins);
    
    if (joins.length > 5) {
      member.kick('حماية الريد').catch(() => {});
      sendLog(member.guild, '🚨 ريد مكتشف', `تم طرد ${member.user.tag} بسبب الريد`, 0xFF0000);
    }
  }
});

// حماية النوك (تغييرات خطيرة)
client.on('channelDelete', (channel) => {
  if (!channel.guild) return;
  if (!client.antinuke.get(channel.guild.id)) return;
  
  const audit = channel.guild.fetchAuditLogs({ type: 12, limit: 1 }).then(audit => {
    const entry = audit.entries.first();
    if (!entry) return;
    
    const executor = channel.guild.members.cache.get(entry.executor.id);
    if (!executor || isTrusted(executor)) return;
    
    punish(executor, 'حذف روم - حماية النوك', 'ban');
    
    // استرجاع الروم
    channel.guild.channels.create({
      name: channel.name,
      type: channel.type,
      parent: channel.parentId,
      position: channel.position,
      permissionOverwrites: channel.permissionOverwrites.cache.map(p => ({
        id: p.id,
        allow: p.allow,
        deny: p.deny
      }))
    }).catch(() => {});
  }).catch(() => {});
});

client.on('roleDelete', (role) => {
  if (!role.guild) return;
  if (!client.antinuke.get(role.guild.id)) return;
  
  role.guild.fetchAuditLogs({ type: 32, limit: 1 }).then(audit => {
    const entry = audit.entries.first();
    if (!entry) return;
    
    const executor = role.guild.members.cache.get(entry.executor.id);
    if (!executor || isTrusted(executor)) return;
    
    punish(executor, 'حذف رتبة - حماية النوك', 'ban');
  }).catch(() => {});
});

client.on('guildMemberRemove', (member) => {
  if (!client.antinuke.get(member.guild.id)) return;
  
  member.guild.fetchAuditLogs({ type: 20, limit: 1 }).then(audit => {
    const entry = audit.entries.first();
    if (!entry) return;
    
    const executor = member.guild.members.cache.get(entry.executor.id);
    if (!executor || isTrusted(executor)) return;
    
    punish(executor, 'طرد عضو - حماية النوك', 'ban');
  }).catch(() => {});
});

// ===== تشغيل =====

client.once('clientReady', () => {
  console.log(`🛡️ بوت الحماية شغال: ${client.user.tag}`);
  console.log(`📊 في ${client.guilds.cache.size} سيرفر`);
  console.log(`🔧 ${client.commands.size} امر`);
});

client.login(process.env.DISCORD_TOKEN);
process.stdin.resume();
