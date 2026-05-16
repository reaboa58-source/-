const express = require('express');
const WebSocket = require('ws');
const http = require('http');
const { Client, GatewayIntentBits, Collection, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits } = require('discord.js');

const app = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.static('public'));

let bot = null;
let botStatus = 'offline';
let logs = [];
let botToken = '';

function addLog(msg) {
  const time = new Date().toLocaleTimeString('ar-SA');
  const log = `[${time}] ${msg}`;
  logs.push(log);
  if (logs.length > 100) logs.shift();
  
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: 'log', message: log }));
    }
  });
}

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'status', status: botStatus }));
  logs.forEach(log => ws.send(JSON.stringify({ type: 'log', message: log })));
});

// ========== نظام القوانين التلقائي ==========

const badWords = {
  'قذف_اهل': [
    'كس اخت', 'كس ام', 'كس ابو', 'كس اخو', 'كس اختك', 'كس امك', 'كس ابوك', 'كس اخوك',
    'اختك', 'امك', 'ابوك', 'اخوك', 'عرص', 'قحبة', 'شرموطة', 'منيوك', 'زبي', 'طيز',
    'كس', 'نيك', 'مص', 'لحس', 'قحب', 'شرموط', 'منيك', 'خول', 'لوطي', 'سافل'
  ],
  'سب': [
    'يا كلب', 'يا حيوان', 'يا جحش', 'يا حمار', 'يا تيس', 'يا بقر', 'يا جلب',
    'يا واطي', 'يا سافل', 'يا حقير', 'يا ديوث', 'يا خنيث', 'يا عرص',
    'غبي', 'احمق', 'معتوه', 'مجنون', 'فاشل', 'تافه', 'حقير'
  ],
  'تنمر': [
    'اسود', 'عبد', 'هندي', 'بنجالي', 'فلسطيني', 'سوري', 'مصري', 'مغربي',
    'زنجي', 'عجمي', 'بدو', 'صحراوي', 'فقير', 'مسكين', 'معاق', 'اعمى', 'اصم'
  ],
  'اخلاقي': [
    'جنس', 'سكس', 'porn', 'sex', 'xxx', 'نيك', 'مص', 'لحس', 'قحبة', 'شرموطة',
    'masturbation', 'masturbate', 'pornhub', 'xnxx', 'xvideos'
  ],
  'سياسي': [
    'اسرائيل', 'يهود', 'صهيون', 'حمس', 'فتح', 'داعش', 'القاعدة', 'طالبان',
    'ايران', 'السعودية', 'الامارات', 'قطر', 'تركيا', 'امريكا', 'روسيا',
    'حزب الله', 'الحوثي', 'الاخوان', 'صهيوني', 'صهيونية'
  ],
  'مشاكل': [
    'تعال خاص', 'تعال فويس', 'برا السيرفر', 'حوار برا', 'تعال برا',
    'بنحلها برا', 'برا', 'تعال نتقاتل', 'تعال نتهاوش'
  ],
  'اسلوب_سيء': [
    'اسكت', 'اخرس', 'سكوت', 'بلع', 'خرس', 'سد حلقك', 'سد فمك',
    'ما يهمك', 'ما يخصك', 'انقلع', 'اطلع', 'روح', 'غور'
  ]
};

const rulePunishments = {
  'قذف_اهل': { type: 'timeout', duration: 2 * 60 * 60 * 1000, reason: 'قذف الأهل - 2 ساعة' },
  'سب': { type: 'timeout', duration: 1 * 60 * 60 * 1000, reason: 'السب - 1 ساعة' },
  'تنمر': { type: 'timeout', duration: 30 * 60 * 1000, reason: 'تنمر/عنصرية - 30 دقيقة' },
  'اخلاقي': { type: 'timeout', duration: 20 * 60 * 1000, reason: 'مواضيع اخلاقية - 20 دقيقة' },
  'سياسي': { type: 'timeout', duration: 10 * 60 * 1000, reason: 'مواضيع سياسية - 10 دقائق' },
  'مشاكل': { type: 'timeout', duration: 10 * 60 * 1000, reason: 'افتعال مشاكل - 10 دقائق' },
  'اسلوب_سيء': { type: 'warn', reason: 'اسلوب سيء - تحذير' }
};

const adminViolations = new Map();

function checkBadWords(message) {
  if (message.author.bot || !message.guild) return;
  
  const content = message.content.toLowerCase();
  const member = message.member;
  
  for (const [category, words] of Object.entries(badWords)) {
    const found = words.some(word => content.includes(word.toLowerCase()));
    if (!found) continue;
    
    const punishment = rulePunishments[category];
    if (!punishment) continue;
    
    applyPunishment(message, member, punishment, category);
    message.delete().catch(() => {});
    addLog(`🚨 ${message.author.tag} | ${punishment.reason} | "${message.content.substring(0, 50)}..."`);
    
    break;
  }
}

async function applyPunishment(message, member, punishment, category) {
  const guild = message.guild;
  
  if (member.permissions.has(PermissionFlagsBits.ManageMessages) || 
      member.permissions.has(PermissionFlagsBits.KickMembers) ||
      member.permissions.has(PermissionFlagsBits.Administrator)) {
    
    const adminServerRules = {
      'قذف_اهل': { type: 'timeout', duration: 2 * 60 * 60 * 1000, reason: 'قذف الأهل (إداري) - 2 ساعة' },
      'سب': { type: 'timeout', duration: 1 * 60 * 60 * 1000, reason: 'السب (إداري) - 1 ساعة' },
      'تنمر': { type: 'timeout', duration: 30 * 60 * 1000, reason: 'تنمر/عنصرية (إداري) - 30 دقيقة' },
      'اخلاقي': { type: 'timeout', duration: 20 * 60 * 1000, reason: 'مواضيع اخلاقية (إداري) - 20 دقيقة' },
      'سياسي': { type: 'timeout', duration: 10 * 60 * 1000, reason: 'سياسة (إداري) - 10 دقائق' },
      'مشاكل': { type: 'timeout', duration: 10 * 60 * 1000, reason: 'مشاكل (إداري) - 10 دقائق' },
      'اسلوب_سيء': { type: 'warn', reason: 'اسلوب سيء (إداري) - تحذير' }
    };
    
    const isMap = message.channel.name.toLowerCase().includes('map') || 
                  message.channel.name.toLowerCase().includes('ماب') ||
                  message.channel.parent?.name.toLowerCase().includes('map');
    
    if (isMap) {
      const mapRules = {
        'قذف_اهل': { type: 'timeout', duration: 5 * 60 * 60 * 1000, reason: 'قذف في الماب - 5 ساعات' },
        'سب': { type: 'timeout', duration: 1 * 60 * 60 * 1000, reason: 'سب في الماب - 1 ساعة' },
        'تنمر': { type: 'timeout', duration: 30 * 60 * 1000, reason: 'تنمر في الماب - 30 دقيقة' },
        'اخلاقي': { type: 'timeout', duration: 1 * 24 * 60 * 60 * 1000, reason: 'لوك/سايلنت في الماب - يوم' },
        'سياسي': { type: 'timeout', duration: 2 * 24 * 60 * 60 * 1000, reason: 'هاك في الماب - يومين' },
        'مشاكل': { type: 'timeout', duration: 3 * 24 * 60 * 60 * 1000, reason: 'هاك تكرار - 3 أيام' },
        'اسلوب_سيء': { type: 'warn', reason: 'اسلوب سيء في الماب - تحذير' }
      };
      
      const mapPunishment = mapRules[category];
      if (mapPunishment) {
        await executePunishment(member, mapPunishment, message);
        return;
      }
    }
    
    const adminPunishment = adminServerRules[category];
    if (adminPunishment) {
      await executePunishment(member, adminPunishment, message);
    }
    
    return;
  }
  
  await executePunishment(member, punishment, message);
}

async function executePunishment(member, punishment, message) {
  try {
    if (punishment.type === 'timeout') {
      await member.timeout(punishment.duration, punishment.reason);
      
      member.send({
        embeds: [{
          color: 0xFF0000,
          title: '⚠️ تم تطبيق عقوبة',
          description: `**السبب:** ${punishment.reason}\n**المدة:** ${formatDuration(punishment.duration)}\n**الروم:** ${message.channel.name}`,
          footer: { text: 'يرجى الالتزام بقوانين السيرفر' }
        }]
      }).catch(() => {});
      
    } else if (punishment.type === 'warn') {
      const key = `${message.guild.id}-${member.id}-${punishment.reason}`;
      const count = (adminViolations.get(key) || 0) + 1;
      adminViolations.set(key, count);
      
      const warnLimits = {
        'اسلوب سيء - تحذير': 3,
        'السب - 1 ساعة': 2,
        'قذف الأهل - 2 ساعة': 2,
        'تنمر/عنصرية - 30 دقيقة': 2,
        'افتعال مشاكل - 10 دقائق': 2
      };
      
      const limit = warnLimits[punishment.reason] || 3;
      
      if (count >= limit) {
        const warnKey = `${message.guild.id}-${member.id}`;
        if (!bot.warnings.has(warnKey)) bot.warnings.set(warnKey, []);
        bot.warnings.get(warnKey).push({ 
          reason: `${punishment.reason} (تكرار ${count} مرات)`, 
          by: bot.user.id, 
          date: new Date() 
        });
        
        member.send({
          embeds: [{
            color: 0xFFA500,
            title: '⚠️ تحذير رسمي',
            description: `تم إنذارك بسبب: ${punishment.reason}\n**عدد المرات:** ${count}\n**الإنذارات:** ${bot.warnings.get(warnKey).length}/3`,
            footer: { text: '3 إنذارات = طرد تلقائي' }
          }]
        }).catch(() => {});
        
        if (bot.warnings.get(warnKey).length >= 3) {
          await member.kick('3 إنذارات - طرد تلقائي').catch(() => {});
          addLog(`🚫 ${member.user.tag} طرد تلقائي - 3 إنذارات`);
        }
        
        adminViolations.delete(key);
      } else {
        member.send({
          embeds: [{
            color: 0xFFA500,
            title: '⚠️ تنبيه',
            description: `**${punishment.reason}**\n**التكرار:** ${count}/${limit}\n**انتبه:** التكرار يؤدي لإنذار رسمي!`
          }]
        }).catch(() => {});
      }
    }
    
    const alertMsg = await message.channel.send({
      embeds: [{
        color: 0xFF0000,
        description: `🚨 ${member} | ${punishment.reason}`
      }]
    });
    setTimeout(() => alertMsg.delete().catch(() => {}), 5000);
    
  } catch (err) {
    addLog(`❌ فشل العقوبة: ${err.message}`);
  }
}

function formatDuration(ms) {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 0) return `${hours} ساعة ${minutes} دقيقة`;
  return `${minutes} دقيقة`;
}

// ========== BOT FUNCTIONS ==========

function isAdmin(member) {
  return member.permissions.has(PermissionFlagsBits.Administrator) || member.permissions.has(PermissionFlagsBits.ManageGuild);
}

function isModerator(member) {
  return member.permissions.has(PermissionFlagsBits.ManageMessages) || 
         member.permissions.has(PermissionFlagsBits.KickMembers) ||
         member.permissions.has(PermissionFlagsBits.BanMembers) ||
         isAdmin(member);
}

function getXPForLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

function addXP(userId, guildId, amount) {
  const key = `${guildId}-${userId}`;
  if (!bot.levels.has(key)) {
    bot.levels.set(key, { level: 1, xp: 0, totalMessages: 0, voiceTime: 0 });
  }
  const data = bot.levels.get(key);
  data.xp += amount;
  data.totalMessages++;
  let needed = getXPForLevel(data.level);
  let leveledUp = false;
  let oldLevel = data.level;
  while (data.xp >= needed) {
    data.xp -= needed;
    data.level++;
    leveledUp = true;
    oldLevel = data.level - 1;
    needed = getXPForLevel(data.level);
  }
  bot.levels.set(key, data);
  return { leveledUp, oldLevel, newLevel: data.level, data };
}

function addPoints(userId, guildId, amount) {
  const key = `${guildId}-${userId}`;
  if (!bot.points.has(key)) {
    bot.points.set(key, { points: 0, totalEarned: 0, spent: 0 });
  }
  const data = bot.points.get(key);
  data.points += amount;
  data.totalEarned += amount;
  bot.points.set(key, data);
  return data;
}

function sendLog(guild, type, data) {
  const logChannelId = bot.logChannels.get(guild.id);
  if (!logChannelId) return;
  const channel = guild.channels.cache.get(logChannelId);
  if (!channel) return;

  let embed;
  switch(type) {
    case 'message_delete':
      embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('رسالة محذوفة')
        .setThumbnail(data.author.avatar)
        .addFields(
          { name: 'العضو', value: `<@${data.author.id}>`, inline: false },
          { name: 'الروم', value: `<#${data.channelId}>`, inline: false },
          { name: 'المحتوى', value: data.content.substring(0, 1000) || 'فارغة', inline: false }
        )
        .setFooter({ text: `ID: ${data.author.id}` })
        .setTimestamp();
      break;
    case 'role_add':
      embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('رتبة معطاة')
        .addFields(
          { name: 'العضو', value: `<@${data.targetId}>`, inline: false },
          { name: 'الرتبة', value: `<@&${data.roleId}>`, inline: false },
          { name: 'بواسطة', value: `<@${data.modId}>`, inline: false }
        )
        .setFooter({ text: `Member ID: ${data.targetId}` })
        .setTimestamp();
      break;
    case 'role_remove':
      embed = new EmbedBuilder()
        .setColor(0xFFA500)
        .setTitle('رتبة مسحوبة')
        .addFields(
          { name: 'العضو', value: `<@${data.targetId}>`, inline: false },
          { name: 'الرتبة', value: `<@&${data.roleId}>`, inline: false },
          { name: 'بواسطة', value: `<@${data.modId}>`, inline: false }
        )
        .setFooter({ text: `Member ID: ${data.targetId}` })
        .setTimestamp();
      break;
    case 'member_join':
      embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('دخول عضو جديد')
        .setThumbnail(data.avatar)
        .addFields(
          { name: 'العضو', value: `<@${data.userId}>`, inline: false },
          { name: 'الاسم', value: data.tag, inline: false },
          { name: 'الحساب', value: `<t:${Math.floor(data.createdAt / 1000)}:R>`, inline: false }
        )
        .setFooter({ text: `ID: ${data.userId}` })
        .setTimestamp();
      break;
    case 'member_leave':
      embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('خروج عضو')
        .setThumbnail(data.avatar)
        .addFields(
          { name: 'العضو', value: `<@${data.userId}>`, inline: false },
          { name: 'الاسم', value: data.tag, inline: false },
          { name: 'انضم', value: data.joinedAt ? `<t:${Math.floor(data.joinedAt / 1000)}:R>` : 'غير معروف', inline: false }
        )
        .setFooter({ text: `ID: ${data.userId}` })
        .setTimestamp();
      break;
    case 'voice_join':
      embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('دخول روم صوتي')
        .addFields(
          { name: 'العضو', value: `<@${data.userId}>`, inline: false },
          { name: 'الروم', value: data.channelName, inline: false }
        )
        .setFooter({ text: `ID: ${data.userId}` })
        .setTimestamp();
      break;
    case 'voice_leave':
      const durationStr = data.duration ? `${Math.floor(data.duration / 60)}د ${data.duration % 60}ث` : 'غير معروف';
      embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('خروج من روم صوتي')
        .addFields(
          { name: 'العضو', value: `<@${data.userId}>`, inline: false },
          { name: 'الروم', value: data.channelName, inline: false },
          { name: 'المدة', value: durationStr, inline: false }
        )
        .setFooter({ text: `ID: ${data.userId}` })
        .setTimestamp();
      break;
    case 'ticket_open':
      embed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('تكت تم فتحه')
        .addFields(
          { name: 'العضو', value: `<@${data.userId}>`, inline: false },
          { name: 'النوع', value: data.type, inline: false },
          { name: 'رقم التكت', value: `#${data.ticketNum}`, inline: false },
          { name: 'التاريخ', value: `<t:${Math.floor(data.timestamp / 1000)}:F>`, inline: false }
        )
        .setFooter({ text: `Ticket #${data.ticketNum}` })
        .setTimestamp();
      break;
    case 'ticket_close':
      const durationMin = data.duration || 0;
      embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('تكت مغلق')
        .setDescription('تفاصيل التكت المغلق')
        .addFields(
          { name: 'العضو', value: `<@${data.userId}>`, inline: false },
          { name: 'النوع', value: data.type, inline: false },
          { name: 'رقم التكت', value: `#${data.ticketNum}`, inline: false },
          { name: 'هل تم الحل؟', value: data.reason === 'تم الحل' ? 'نعم' : 'لا', inline: false },
          { name: 'تم الحل', value: `<@${data.closedBy}>`, inline: false },
          { name: 'تاريخ الفتح', value: `<t:${Math.floor(data.createdAt / 1000)}:F>`, inline: false },
          { name: 'تاريخ الاغلاق', value: `<t:${Math.floor(data.closedAt / 1000)}:F>`, inline: false },
          { name: 'المدة', value: `${durationMin} دقيقة`, inline: false }
        )
        .setFooter({ text: `مغلق بواسطة ${data.closedByTag || 'غير معروف'}` })
        .setTimestamp();
      break;
    case 'ticket_claim':
      embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('استلام تكت')
        .addFields(
          { name: 'التكت', value: `<#${data.channelId}>`, inline: false },
          { name: 'استلمه', value: `<@${data.claimedBy}>`, inline: false }
        )
        .setFooter({ text: `Ticket Channel: ${data.channelId}` })
        .setTimestamp();
      break;
  }

  if (embed) {
    channel.send({ embeds: [embed] }).catch(err => console.error('Log send error:', err));
  }
}

function registerCommand(name, aliases, options) {
  bot.commands.set(name, { name, aliases, ...options });
  if (aliases) {
    aliases.forEach(alias => bot.aliases.set(alias, name));
  }
}

// ========== COMMANDS ==========

function setupCommands() {
  registerCommand('ping', ['بنق', 'p'], {
    category: 'عام',
    description: 'سرعة البوت',
    execute(message) {
      message.reply(`Pong! ${Date.now() - message.createdTimestamp}ms | API: ${Math.round(bot.ws.ping)}ms`);
    }
  });

  registerCommand('say', ['قل', 's'], {
    category: 'عام',
    description: 'يكرر كلامك',
    execute(message, args) {
      const text = args.join(' ');
      if (!text) return message.reply('اكتب شيء! مثال: !say مرحبا');
      message.channel.send(text);
      message.delete().catch(() => {});
    }
  });

  registerCommand('userinfo', ['معلومات', 'ui'], {
    category: 'عام',
    description: 'معلومات العضو',
    execute(message) {
      const user = message.mentions.users.first() || message.author;
      const member = message.guild.members.cache.get(user.id);
      message.reply({
        embeds: [{
          color: 0x5865F2,
          title: `معلومات ${user.username}`,
          thumbnail: { url: user.displayAvatarURL() },
          fields: [
            { name: 'الايدي', value: user.id, inline: false },
            { name: 'الانضمام', value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'غير معروف', inline: false },
            { name: 'الحساب', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: false },
            { name: 'بوت؟', value: user.bot ? 'نعم' : 'لا', inline: false },
            { name: 'الرتب', value: member ? member.roles.cache.map(r => r.name).slice(0, 5).join(', ') || 'بدون' : 'غير معروف', inline: false }
          ],
          timestamp: new Date()
        }]
      });
    }
  });

  registerCommand('serverinfo', ['سيرفر', 'si'], {
    category: 'عام',
    description: 'معلومات السيرفر',
    execute(message) {
      const guild = message.guild;
      message.reply({
        embeds: [{
          color: 0x5865F2,
          title: guild.name,
          thumbnail: { url: guild.iconURL() },
          fields: [
            { name: 'الاعضاء', value: `${guild.memberCount}`, inline: false },
            { name: 'الرومات', value: `${guild.channels.cache.size}`, inline: false },
            { name: 'الرتب', value: `${guild.roles.cache.size}`, inline: false },
            { name: 'المالك', value: `<@${guild.ownerId}>`, inline: false },
            { name: 'التاريخ', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: false },
            { name: 'البوتات', value: `${guild.members.cache.filter(m => m.user.bot).size}`, inline: false }
          ],
          timestamp: new Date()
        }]
      });
    }
  });

  registerCommand('avatar', ['صورة', 'av'], {
    category: 'عام',
    description: 'صورة البروفايل',
    execute(message) {
      const user = message.mentions.users.first() || message.author;
      message.reply({
        embeds: [{
          color: 0x5865F2,
          title: `صورة ${user.username}`,
          image: { url: user.displayAvatarURL({ size: 4096 }) }
        }]
      });
    }
  });

  registerCommand('banner', ['بانر', 'bn'], {
    category: 'عام',
    description: 'بانر العضو',
    execute(message) {
      const user = message.mentions.users.first() || message.author;
      message.reply({
        embeds: [{
          color: 0x5865F2,
          title: `بانر ${user.username}`,
          image: { url: user.bannerURL({ size: 4096 }) || 'https://via.placeholder.com/600x240?text=No+Banner' }
        }]
      });
    }
  });

  registerCommand('id', ['ايدي', 'i'], {
    category: 'عام',
    description: 'يظهر الايدي',
    execute(message) {
      const user = message.mentions.users.first() || message.author;
      message.reply(`الايدي: \`${user.id}\``);
    }
  });

  registerCommand('roles', ['رتب', 'r'], {
    category: 'عام',
    description: 'رتب العضو',
    execute(message) {
      const member = message.mentions.members.first() || message.member;
      const roles = member.roles.cache.filter(r => r.id !== message.guild.id).sort((a, b) => b.position - a.position);
      message.reply({
        embeds: [{
          color: 0x5865F2,
          title: `رتب ${member.user.username}`,
          description: roles.map(r => `<@&${r.id}>`).join(', ') || 'بدون رتب',
          footer: { text: `العدد: ${roles.size}` }
        }]
      });
    }
  });

  registerCommand('botinfo', ['بوت', 'bi'], {
    category: 'عام',
    description: 'معلومات البوت',
    execute(message) {
      message.reply({
        embeds: [{
          color: 0x5865F2,
          title: 'معلومات البوت',
          fields: [
            { name: 'الاسم', value: bot.user.tag, inline: false },
            { name: 'السيرفرات', value: `${bot.guilds.cache.size}`, inline: false },
            { name: 'المستخدمين', value: `${bot.users.cache.size}`, inline: false },
            { name: 'البنق', value: `${Math.round(bot.ws.ping)}ms`, inline: false },
            { name: 'وقت التشغيل', value: `<t:${Math.floor((Date.now() - process.uptime() * 1000) / 1000)}:R>`, inline: false }
          ]
        }]
      });
    }
  });

  registerCommand('invite', ['دعوة', 'inv'], {
    category: 'عام',
    description: 'رابط دعوة البوت',
    execute(message) {
      message.reply(`رابط الدعوة:\nhttps://discord.com/api/oauth2/authorize?client_id=${bot.user.id}&permissions=8&scope=bot%20applications.commands`);
    }
  });

  registerCommand('rank', ['لفل', 'لفلي', 'rl'], {
    category: 'لفل',
    description: 'لفلك ونقاطك',
    execute(message) {
      const target = message.mentions.users.first() || message.author;
      const key = `${message.guild.id}-${target.id}`;
      const data = bot.levels.get(key) || { level: 1, xp: 0, totalMessages: 0, voiceTime: 0 };
      const needed = getXPForLevel(data.level);
      const progress = Math.floor((data.xp / needed) * 10);
      const bar = '█'.repeat(progress) + '░'.repeat(10 - progress);
      message.reply({
        embeds: [{
          color: 0xFFD700,
          title: `${target.username}`,
          thumbnail: { url: target.displayAvatarURL() },
          fields: [
            { name: 'اللفل', value: `${data.level}`, inline: false },
            { name: 'النقاط', value: `${data.xp}/${needed}`, inline: false },
            { name: 'التقدم', value: `[${bar}] ${Math.floor((data.xp/needed)*100)}%`, inline: false },
            { name: 'الرسائل', value: `${data.totalMessages}`, inline: false },
            { name: 'وقت الصوت', value: `${Math.floor(data.voiceTime / 60)}د`, inline: false }
          ],
          footer: { text: `اللفل القادم يحتاج ${needed} نقطة` }
        }]
      });
    }
  });

  registerCommand('leaderboard', ['ليدر', 'توب', 'lb'], {
    category: 'لفل',
    description: 'أعلى 10 باللفل',
    execute(message) {
      const all = Array.from(bot.levels.entries())
        .filter(([key]) => key.startsWith(message.guild.id))
        .sort((a, b) => b[1].level - a[1].level || b[1].xp - a[1].xp)
        .slice(0, 10);
      const list = all.map(([key, data], i) => {
        const userId = key.split('-')[1];
        return `${i + 1}. <@${userId}> - لفل ${data.level} (${data.xp} نقطة)`;
      }).join('\n') || 'لا يوجد بيانات';
      message.reply({
        embeds: [{
          color: 0xFFD700,
          title: 'ليدربورد اللفل',
          description: list,
          timestamp: new Date()
        }]
      });
    }
  });

  registerCommand('points', ['نقاط', 'نقاطي', 'pt'], {
    category: 'لفل',
    description: 'نقاطك',
    execute(message) {
      const target = message.mentions.users.first() || message.author;
      const key = `${message.guild.id}-${target.id}`;
      const data = bot.points.get(key) || { points: 0, totalEarned: 0, spent: 0 };
      message.reply({
        embeds: [{
          color: 0x00FF00,
          title: `نقاط ${target.username}`,
          fields: [
            { name: 'المتاحة', value: `${data.points}`, inline: false },
            { name: 'مجموع المكتسبة', value: `${data.totalEarned}`, inline: false },
            { name: 'المصروفة', value: `${data.spent}`, inline: false }
          ]
        }]
      });
    }
  });

  registerCommand('addxp', ['اضافة-لفل', 'axp'], {
    category: 'ادارة',
    description: 'إضافة XP لعضو',
    execute(message, args) {
      if (!isModerator(message.member)) return message.reply('للإدارة فقط!');
      const target = message.mentions.users.first();
      if (!target) return message.reply('منشن العضو!');
      const amount = parseInt(args[1]);
      if (!amount) return message.reply('اكتب الكمية!');
      const result = addXP(target.id, message.guild.id, amount);
      if (result.leveledUp) {
        message.reply(`${target} وصل للفل ${result.newLevel}!`);
      } else {
        message.reply(`تم إضافة ${amount} نقطة لـ ${target}`);
      }
    }
  });

  registerCommand('resetxp', ['تصفير-لفل', 'rxp'], {
    category: 'ادارة',
    description: 'تصفير لفل عضو',
    execute(message) {
      if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
      const target = message.mentions.users.first();
      if (!target) return message.reply('منشن العضو!');
      const key = `${message.guild.id}-${target.id}`;
      bot.levels.set(key, { level: 1, xp: 0, totalMessages: 0, voiceTime: 0 });
      message.reply(`تم تصفير لفل ${target}`);
    }
  });

  registerCommand('clear', ['مسح', 'حذف', 'c'], {
    category: 'ادارة',
    description: 'حذف رسائل',
    async execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return message.reply('ما عندك صلاحية!');
      const amount = parseInt(args[0]);
      if (!amount || amount < 1 || amount > 99) return message.reply('اكتب رقم من 1-99!');
      try {
        await message.channel.bulkDelete(amount + 1, true);
        const msg = await message.channel.send(`تم حذف ${amount} رسالة`);
        setTimeout(() => msg.delete().catch(() => {}), 3000);
      } catch (err) {
        message.reply('صار خطأ أثناء حذف الرسائل');
      }
    }
  });

  registerCommand('kick', ['طرد', 'k'], {
    category: 'ادارة',
    description: 'طرد عضو',
    execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.KickMembers)) return message.reply('ما عندك صلاحية!');
      const user = message.mentions.users.first();
      if (!user) return message.reply('منشن شخص!');
      const member = message.guild.members.cache.get(user.id);
      const reason = args.slice(1).join(' ') || 'بدون سبب';
      member.kick(reason).then(() => {
        message.reply(`تم طرد ${user.username} | السبب: ${reason}`);
      }).catch(() => message.reply('ما قدرت!'));
    }
  });

  registerCommand('ban', ['قمنقلع', 'b'], {
    category: 'ادارة',
    description: 'حظر عضو',
    execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('ما عندك صلاحية!');
      const user = message.mentions.users.first();
      if (!user) return message.reply('منشن شخص!');
      const member = message.guild.members.cache.get(user.id);
      const reason = args.slice(1).join(' ') || 'بدون سبب';
      member.ban({ reason }).then(() => {
        message.reply(`تم حظر ${user.username} | السبب: ${reason}`);
      }).catch(() => message.reply('ما قدرت!'));
    }
  });

  registerCommand('unban', ['فك', 'ub'], {
    category: 'ادارة',
    description: 'فك حظر عضو',
    execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return message.reply('ما عندك صلاحية!');
      const userId = args[0];
      if (!userId) return message.reply('اكتب الايدي!');
      message.guild.members.unban(userId).then(() => {
        message.reply(`تم فك حظر ${userId}`);
      }).catch(() => message.reply('ما قدرت!'));
    }
  });

  registerCommand('mute', ['اسكت', 'm'], {
    category: 'ادارة',
    description: 'كتم عضو',
    execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('ما عندك صلاحية!');
      const target = message.mentions.members.first();
      if (!target) return message.reply('منشن العضو!');
      const duration = args[1] || '1h';
      const ms = duration.endsWith('m') ? parseInt(duration) * 60000 :
                 duration.endsWith('h') ? parseInt(duration) * 3600000 :
                 duration.endsWith('d') ? parseInt(duration) * 86400000 : 3600000;
      target.timeout(ms, args.slice(2).join(' ') || 'بدون سبب').then(() => {
        message.reply(`تم كتم ${target.user.username} لمدة ${duration}`);
      }).catch(() => message.reply('ما قدرت!'));
    }
  });

  registerCommand('unmute', ['تكلم', 'um'], {
    category: 'ادارة',
    description: 'فك كتم عضو',
    execute(message) {
      if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return message.reply('ما عندك صلاحية!');
      const target = message.mentions.members.first();
      if (!target) return message.reply('منشن العضو!');
      target.timeout(null).then(() => {
        message.reply(`تم فك كتم ${target.user.username}`);
      }).catch(() => message.reply('ما قدرت!'));
    }
  });

  registerCommand('warn', ['ات', 'w'], {
    category: 'ادارة',
    description: 'إنذار عضو',
    execute(message, args) {
      if (!isModerator(message.member)) return message.reply('للإدارة فقط!');
      const target = message.mentions.users.first();
      if (!target) return message.reply('منشن العضو!');
      const reason = args.slice(1).join(' ') || 'بدون سبب';
      const key = `${message.guild.id}-${target.id}`;
      if (!bot.warnings.has(key)) bot.warnings.set(key, []);
      bot.warnings.get(key).push({ reason, by: message.author.id, date: new Date() });
      const count = bot.warnings.get(key).length;
      message.reply(`تم إنذار ${target} | السبب: ${reason} | إنذارات: ${count}/3`);
      if (count >= 3) {
        const member = message.guild.members.cache.get(target.id);
        if (member) member.kick('3 إنذارات').catch(() => {});
      }
    }
  });

  registerCommand('warnings', ['تحذيرات', 'ws'], {
    category: 'ادارة',
    description: 'عرض إنذارات عضو',
    execute(message) {
      if (!isModerator(message.member)) return message.reply('للإدارة فقط!');
      const target = message.mentions.users.first() || message.author;
      const key = `${message.guild.id}-${target.id}`;
      const warns = bot.warnings.get(key) || [];
      if (!warns.length) return message.reply('لا يوجد إنذارات');
      const list = warns.map((w, i) => `${i + 1}. ${w.reason} - <@${w.by}> - <t:${Math.floor(w.date.getTime() / 1000)}:R>`).join('\n');
      message.reply({
        embeds: [{
          color: 0xFFA500,
          title: `إنذارات ${target.username}`,
          description: list,
          footer: { text: `العدد: ${warns.length}/3` }
        }]
      });
    }
  });

  registerCommand('unwarn', ['شيل', 'uw'], {
    category: 'ادارة',
    description: 'حذف إنذار',
    execute(message, args) {
      if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
      const target = message.mentions.users.first();
      if (!target) return message.reply('منشن العضو!');
      const key = `${message.guild.id}-${target.id}`;
      const warns = bot.warnings.get(key);
      if (!warns || !warns.length) return message.reply('لا يوجد إنذارات');
      const index = parseInt(args[1]) - 1;
      if (isNaN(index) || index < 0 || index >= warns.length) return message.reply('رقم غير صحيح!');
      warns.splice(index, 1);
      message.reply(`تم حذف الإنذار ${index + 1}`);
    }
  });

  registerCommand('slowmode', ['بطيء', 'sm'], {
    category: 'ادارة',
    description: 'تعيين بطيء للروم',
    execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('ما عندك صلاحية!');
      const seconds = parseInt(args[0]);
      if (seconds === undefined) return message.reply('اكتب الثواني! 0 للإلغاء');
      message.channel.setRateLimitPerUser(seconds).then(() => {
        message.reply(seconds ? `تم تعيين بطيء: ${seconds} ثانية` : 'تم إلغاء البطيء');
      }).catch(() => message.reply('ما قدرت!'));
    }
  });

  registerCommand('lock', ['قفل', 'ق'], {
    category: 'ادارة',
    description: 'قفل الروم',
    execute(message) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('ما عندك صلاحية!');
      message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: false }).then(() => {
        message.reply('تم قفل الروم');
      }).catch(() => message.reply('ما قدرت!'));
    }
  });

  registerCommand('unlock', ['فتح', 'ف'], {
    category: 'ادارة',
    description: 'فتح الروم',
    execute(message) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return message.reply('ما عندك صلاحية!');
      message.channel.permissionOverwrites.edit(message.guild.id, { SendMessages: true }).then(() => {
        message.reply('تم فتح الروم');
      }).catch(() => message.reply('ما قدرت!'));
    }
  });

  registerCommand('nick', ['لقب', 'n'], {
    category: 'ادارة',
    description: 'تغيير لقب عضو',
    execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) return message.reply('ما عندك صلاحية!');
      const target = message.mentions.members.first();
      if (!target) return message.reply('منشن العضو!');
      const nick = args.slice(1).join(' ') || null;
      target.setNickname(nick).then(() => {
        message.reply(`تم تغيير اللقب لـ: ${nick || 'الافتراضي'}`);
      }).catch(() => message.reply('ما قدرت!'));
    }
  });

  registerCommand('role', ['رتبة', 'rol'], {
    category: 'ادارة',
    description: 'إعطاء/سحب رتبة',
    execute(message, args) {
      if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply('ما عندك صلاحية!');
      const target = message.mentions.members.first();
      const role = message.mentions.roles.first();
      if (!target || !role) return message.reply('منشن العضو والرتبة!');
      if (target.roles.cache.has(role.id)) {
        target.roles.remove(role).then(() => {
          message.reply(`تم سحب ${role.name} من ${target.user.username}`);
          sendLog(message.guild, 'role_remove', { targetId: target.id, roleId: role.id, modId: message.author.id });
        });
      } else {
        target.roles.add(role).then(() => {
          message.reply(`تم إعطاء ${role.name} لـ ${target.user.username}`);
          sendLog(message.guild, 'role_add', { targetId: target.id, roleId: role.id, modId: message.author.id });
        });
      }
    }
  });

  registerCommand('announce', ['اعلان', 'ann'], {
    category: 'ادارة',
    description: 'إرسال إعلان',
    execute(message, args) {
      if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
      const channel = message.mentions.channels.first() || message.channel;
      const text = args.join(' ').replace(/<<#\d+>/, '').trim();
      if (!text) return message.reply('اكتب نص الإعلان!');
      channel.send({
        embeds: [{
          color: 0xFF0000,
          title: 'إعلان',
          description: text,
          footer: { text: `بواسطة ${message.author.username}` },
          timestamp: new Date()
        }]
      });
      message.delete().catch(() => {});
    }
  });

  registerCommand('تكت', ['تذكرة', 'tk'], {
    category: 'ادارة',
    description: 'إرسال رسالة التكت',
    execute(message) {
      if (!isModerator(message.member)) return message.reply('للإدارة فقط!');
      const embed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('فتح تذكرة')
        .setDescription(`
اختر نوع التذكرة من القائمة أدناه:

قوانين التذكرة:
1. تفتح تكت وتستهبل = تايم 10 دقايق
2. تفتح تكت وما ترد = يتقفل التكت
3. أسلوبك سيء = تايم 10 دقايق وبنقفل التكت ومحد بيساعدك
4. يرجى فتح تذكرة بسبب واضح
        `)
        .setFooter({ text: 'التذاكر للتواصل مع الإدارة فقط' });

      const selectRow = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('ticket_type')
          .setPlaceholder('اختر نوع التكت')
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('استفسار').setValue('inquiry').setDescription('سؤال أو استفسار عام'),
            new StringSelectMenuOptionBuilder().setLabel('Open Ticket').setValue('open_ticket').setDescription('فتح تذكرة عامة'),
            new StringSelectMenuOptionBuilder().setLabel('شكوى على عضو').setValue('member_report').setDescription('تقديم شكوى على عضو')
          )
      );
      message.channel.send({ embeds: [embed], components: [selectRow] });
    }
  });

  registerCommand('sqmr1', ['تحقق', 'ver'], {
    category: 'ادارة',
    description: 'إرسال رسالة تحقق',
    execute(message) {
      if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('تحقق')
        .setDescription('اضغط على الزر عشان نتحقق انت بوت ولا لا');
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('verify_human')
          .setLabel('تحقق')
          .setStyle(ButtonStyle.Primary)
      );
      message.channel.send({ embeds: [embed], components: [row] });
    }
  });

  registerCommand('poll', ['تصويت', 'pl'], {
    category: 'عام',
    description: 'إنشاء تصويت',
    execute(message, args) {
      const question = args.join(' ');
      if (!question) return message.reply('اكتب السؤال!');
      message.channel.send({
        embeds: [{
          color: 0x5865F2,
          title: 'تصويت',
          description: question,
          footer: { text: `بواسطة ${message.author.username}` }
        }]
      }).then(msg => {
        msg.react('👍');
        msg.react('👎');
      });
    }
  });

  registerCommand('giveaway', ['جيف', 'gv'], {
    category: 'ادارة',
    description: 'إنشاء جيف أواي',
    execute(message, args) {
      if (!isModerator(message.member)) return message.reply('للإدارة فقط!');
      const duration = args[0];
      const winners = parseInt(args[1]);
      const prize = args.slice(2).join(' ');
      if (!duration || !winners || !prize) return message.reply('الاستخدام: !giveaway 1h 1 جوائز شحن');
      const ms = duration.endsWith('m') ? parseInt(duration) * 60000 :
                 duration.endsWith('h') ? parseInt(duration) * 3600000 :
                 duration.endsWith('d') ? parseInt(duration) * 86400000 : 3600000;
      bot.giveawayCounter++;
      const endTime = Date.now() + ms;
      message.channel.send({
        embeds: [{
          color: 0xFF00FF,
          title: 'جيف أواي',
          description: `الجائزة: **${prize}**\nالفائزين: ${winners}\nالانتهاء: <t:${Math.floor(endTime / 1000)}:R>`,
          footer: { text: `ID: ${bot.giveawayCounter}` }
        }]
      }).then(msg => {
        msg.react('🎉');
        bot.giveaways.set(bot.giveawayCounter, { msgId: msg.id, channelId: msg.channel.id, prize, winners, endTime, participants: [] });
        setTimeout(async () => {
          const giveaway = bot.giveaways.get(bot.giveawayCounter);
          const channel = message.guild.channels.cache.get(giveaway.channelId);
          const msg = await channel.messages.fetch(giveaway.msgId);
          const users = (await msg.reactions.cache.get('🎉').users.fetch()).filter(u => !u.bot);
          const winnersList = users.random(giveaway.winners);
          if (winnersList.length) {
            channel.send(`مبروك ${winnersList.join(', ')}! فزتوا بـ: **${prize}**`);
          } else {
            channel.send('ما في مشاركين كفاية!');
          }
        }, ms);
      });
    }
  });

  registerCommand('suggest', ['اقتراح', 'sg'], {
    category: 'عام',
    description: 'اقتراح',
    execute(message, args) {
      const text = args.join(' ');
      if (!text) return message.reply('اكتب الاقتراح!');
      message.channel.send({
        embeds: [{
          color: 0x00FF00,
          title: 'اقتراح جديد',
          description: text,
          footer: { text: `بواسطة ${message.author.username}` },
          timestamp: new Date()
        }]
      }).then(msg => {
        msg.react('👍');
        msg.react('👎');
      });
      message.delete().catch(() => {});
    }
  });

  registerCommand('report', ['ابلاغ', 'rep'], {
    category: 'عام',
    description: 'إبلاغ عن مشكلة',
    execute(message, args) {
      const text = args.join(' ');
      if (!text) return message.reply('اكتب التقرير!');
      message.reply({
        embeds: [{
          color: 0xFF0000,
          title: 'إبلاغ',
          description: text,
          footer: { text: 'تم إرساله للإدارة' }
        }]
      });
    }
  });

  registerCommand('remind', ['تذكير', 'rm'], {
    category: 'عام',
    description: 'تذكير',
    execute(message, args) {
      const time = args[0];
      const text = args.slice(1).join(' ');
      if (!time || !text) return message.reply('الاستخدام: !remind 10m اجتماع');
      const ms = time.endsWith('m') ? parseInt(time) * 60000 :
                 time.endsWith('h') ? parseInt(time) * 3600000 : 60000;
      message.reply(`تم تعيين تذكير بعد ${time}`);
      setTimeout(() => {
        message.author.send(`تذكير: ${text}`);
      }, ms);
    }
  });

  registerCommand('help', ['مساعدة', 'h'], {
    category: 'عام',
    description: 'قائمة الأوامر',
    execute(message) {
      const adminCommands = [];
      const modCommands = [];
      const publicCommands = [];
      const levelCommands = [];
      const setupCommands = [];

      bot.commands.forEach(cmd => {
        if (cmd.name === 'help') return;
        const aliases = cmd.aliases ? ` (${cmd.aliases.join(', ')})` : '';
        const line = `\`!${cmd.name}\`${aliases} - ${cmd.description || 'بدون وصف'}`;
        if (cmd.category === 'ادارة') {
          if (['تكت', 'sqmr1', 'announce', 'resetxp', 'unwarn', 'giveaway'].includes(cmd.name)) {
            adminCommands.push(line);
          } else {
            modCommands.push(line);
          }
        } else if (cmd.category === 'لفل') {
          levelCommands.push(line);
        } else if (cmd.category === 'اعدادات') {
          setupCommands.push(line);
        } else {
          publicCommands.push(line);
        }
      });

      message.reply({
        embeds: [{
          color: 0x5865F2,
          title: 'قائمة الأوامر',
          fields: [
            { name: 'اوامر الادارة (Admin)', value: adminCommands.join('\n') || 'لا يوجد', inline: false },
            { name: 'اوامر المشرفين (Mod)', value: modCommands.join('\n') || 'لا يوجد', inline: false },
            { name: 'اوامر اللفل', value: levelCommands.join('\n') || 'لا يوجد', inline: false },
            { name: 'الاعدادات', value: setupCommands.join('\n') || 'لا يوجد', inline: false },
            { name: 'اوامر عامة', value: publicCommands.join('\n') || 'لا يوجد', inline: false }
          ],
          footer: { text: `Viirless Bot - ${bot.commands.size} امر` }
        }]
      });
    }
  });

  registerCommand('setwelcome', ['روم-ترحيب', 'sw'], {
    category: 'اعدادات',
    description: 'تحديد روم الترحيب',
    execute(message) {
      if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply('منشن الروم!');
      bot.welcomeChannels.set(message.guild.id, channel.id);
      message.reply(`تم تعيين روم الترحيب: ${channel}`);
    }
  });

  registerCommand('setticket', ['روم-تكت', 'st'], {
    category: 'اعدادات',
    description: 'تحديد روم لوق التكت',
    execute(message) {
      if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply('منشن روم اللوق!');
      bot.ticketSettings.set(message.guild.id, { logChannel: channel.id });
      message.reply(`تم تعيين روم لوق التكت: ${channel}`);
    }
  });

  registerCommand('setlevel', ['روم-لفل', 'sl'], {
    category: 'اعدادات',
    description: 'تحديد روم اللفل',
    execute(message) {
      if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply('منشن الروم!');
      bot.levelChannels.set(message.guild.id, channel.id);
      message.reply(`تم تعيين روم اللفل: ${channel}`);
    }
  });

  registerCommand('setlog', ['روم-لوق', 'log'], {
    category: 'اعدادات',
    description: 'تحديد روم اللوق العام',
    execute(message) {
      if (!isAdmin(message.member)) return message.reply('للأدمن فقط!');
      const channel = message.mentions.channels.first();
      if (!channel) return message.reply('منشن روم اللوق!');
      bot.logChannels.set(message.guild.id, channel.id);
      message.reply(`تم تعيين روم اللوق العام: ${channel}`);
    }
  });
}

// ========== BOT EVENTS ==========

function setupEvents() {
  const voiceJoinTimes = new Map();

  bot.on('messageCreate', (message) => {
    // ========== نظام القوانين التلقائي ==========
    checkBadWords(message);
    
    if (message.author.bot || !message.guild) return;
    
    // منشن رتبة = يعطي الرتبة
    if (message.mentions.roles.size > 0 && message.mentions.members.size > 0) {
      const mentionedRole = message.mentions.roles.first();
      const mentionedMember = message.mentions.members.first();
      if (mentionedMember.id === message.author.id) return;
      if (mentionedMember.user.bot) return;
      if (mentionedRole.permissions.has(PermissionFlagsBits.Administrator) || 
          mentionedRole.permissions.has(PermissionFlagsBits.ManageGuild)) return;
      const botMember = message.guild.members.me;
      if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return message.reply('البوت ما عنده صلاحية Manage Roles!');
      }
      if (mentionedRole.position >= botMember.roles.highest.position
