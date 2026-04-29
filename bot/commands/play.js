const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'play',
    description: 'تشغيل موسيقى من الملفات المحلية',
    category: 'ميوزك',
    usage: '!play [رقم الأغنية أو اسمها]',

    async execute(message, args, client) {
        try {
            const voiceChannel = message.member.voice.channel;

            if (!voiceChannel) {
                return message.reply('❌ ادخل روم صوتي أولاً!');
            }

            // 📁 مجلد الموسيقى
            const musicFolder = path.join(__dirname, '..', '..', 'music');

            // التأكد من وجود المجلد
            if (!fs.existsSync(musicFolder)) {
                fs.mkdirSync(musicFolder, { recursive: true });
                return message.reply('❌ مجلد الموسيقى فاضي! حط ملفات mp3 في مجلد `music/`');
            }

            // جلب جميع ملفات الموسيقى
            const musicFiles = fs.readdirSync(musicFolder)
                .filter(file => file.endsWith('.mp3') || file.endsWith('.wav') || file.endsWith('.ogg'))
                .map((file, index) => ({
                    number: index + 1,
                    name: file.replace(/\.(mp3|wav|ogg)$/i, ''),
                    file: file,
                    path: path.join(musicFolder, file)
                }));

            if (musicFiles.length === 0) {
                return message.reply('❌ ما فيه ملفات موسيقى! حط ملفات صوتية في مجلد `music/`');
            }

            // إذا ما كتب شي، اعرض قائمة الأغاني
            if (!args.length) {
                const listEmbed = new EmbedBuilder()
                    .setColor('#1a1a1a')
                    .setTitle('🎵 قائمة الأغاني المتاحة')
                    .setDescription(
                        musicFiles.map(s => `\`${s.number}.\` **${s.name}**`).join('\n')
                    )
                    .setFooter({ text: `اكتب: !play [رقم أو اسم]` });

                return message.reply({ embeds: [listEmbed] });
            }

            // البحث عن الأغنية
            const query = args.join(' ').toLowerCase();
            let selectedSong;

            // محاولة البحث برقم
            const songNumber = parseInt(query);
            if (!isNaN(songNumber) && songNumber > 0 && songNumber <= musicFiles.length) {
                selectedSong = musicFiles[songNumber - 1];
            } else {
                // البحث بالاسم
                selectedSong = musicFiles.find(s => 
                    s.name.toLowerCase().includes(query) || 
                    s.file.toLowerCase().includes(query)
                );
            }

            if (!selectedSong) {
                return message.reply('❌ ما لقيت الأغنية! جرب رقم من القائمة أو اسم صحيح.');
            }

            // الاتصال بالروم الصوتي
            const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');

            const connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: message.guild.id,
                adapterCreator: message.guild.voiceAdapterCreator,
            });

            // إنشاء مشغل
            const player = createAudioPlayer();

            // إنشاء مصدر صوتي من الملف المحلي
            const resource = createAudioResource(selectedSong.path);

            // تشغيل
            player.play(resource);
            connection.subscribe(player);

            // حفظ في Queue
            if (!client.musicQueue) client.musicQueue = new Map();
            const queue = client.musicQueue.get(message.guild.id) || [];
            queue.push({
                title: selectedSong.name,
                file: selectedSong.file,
                path: selectedSong.path,
                requester: message.author.tag
            });
            client.musicQueue.set(message.guild.id, queue);

            // إرسال رسالة التشغيل
            const embed = new EmbedBuilder()
                .setColor('#1a1a1a')
                .setTitle('🎵 Now Playing')
                .addFields(
                    { name: 'Title', value: selectedSong.name, inline: false },
                    { name: 'File', value: selectedSong.file, inline: true },
                    { name: 'Requested by', value: message.author.tag, inline: true }
                )
                .setTimestamp();

            await message.reply({ embeds: [embed] });

            // لما تخلص الأغنية
            player.on(AudioPlayerStatus.Idle, () => {
                const currentQueue = client.musicQueue.get(message.guild.id);
                if (currentQueue) {
                    currentQueue.shift();
                    if (currentQueue.length > 0) {
                        const nextSong = currentQueue[0];
                        const nextResource = createAudioResource(nextSong.path);
                        player.play(nextResource);

                        message.channel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setColor('#1a1a1a')
                                    .setTitle('▶️ Next Track')
                                    .setDescription(`**${nextSong.title}**`)
                                    .setFooter({ text: `Requested by: ${nextSong.requester}` })
                            ]
                        }).catch(() => {});
                    } else {
                        connection.destroy();
                        client.musicQueue.delete(message.guild.id);
                        message.channel.send('✅ القائمة خلصت!').catch(() => {});
                    }
                }
            });

            player.on('error', (error) => {
                console.error('Player error:', error);
                message.channel.send('❌ خطأ في التشغيل!').catch(() => {});
            });

        } catch (error) {
            console.error('Play error:', error);
            message.reply('❌ Error: ' + error.message);
        }
    }
};
