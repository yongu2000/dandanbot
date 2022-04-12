const { Client, Intents } = require('discord.js');
const discordTTS = require('discord-tts');
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MEMBERS]
});
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayer, StreamType, createAudioResource, VoiceConnectionStatus, entersState, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');
const { token } = require('./config.json');
const prefix = '단젤아';

client.on('ready', () => { 
    console.log(`Logged in as ${client.user.tag}`); 
}); 

let voiceConnection;
let audioPlayer = new AudioPlayer();

const queue = new Map();
let yt_info;
let stream;
let resource;
let player;

client.on('messageCreate', async msg => { 
    if (msg.author.bot) return;
    const serverQueue = queue.get(msg.guild.id);
    if (msg.content.startsWith(`${prefix}불러줘 `)) {
        console.log('불러줘')
        execute(msg, serverQueue, false);
    } else if (msg.content.startsWith(`${prefix} 불러줘 `)) {
        console.log('불러줘 띄어쓰기')
        execute(msg, serverQueue, true);
    } else if (msg.content === `${prefix}스킵` || msg.content === `${prefix} 스킵`) {
        if (!msg.member.voice?.channel) return msg.channel.send('노래를 스킵하려면 음성 채널에 입장해주세요')
        console.log('스킵')
        if (player) {
            player.stop()
            msg.react('⏩')
            if (serverQueue.songs.length === 0) {
                msg.reply(`부를 노래가 없어요`);
            } else {
                msg.reply('다음 노래 부를게요')
            }
        }
    } else if (msg.content === `${prefix}그만` || msg.content === `${prefix} 그만`) {
        if (!msg.member.voice?.channel) return msg.channel.send('노래를 멈추려면 음성 채널에 입장해주세요')
        console.log('그만')
        if (player) {
            player.stop()
            serverQueue.songs = []
            msg.react('⏹')
            msg.reply('그만 부를게요')
        } else {
            msg.reply('그만 부를 노래가 없어요');
        }
    } else if (msg.content === `${prefix}잠깐` || msg.content === `${prefix} 잠깐`) {
        if (!msg.member.voice?.channel) return msg.channel.send('노래를 일시 정지하려면 음성 채널에 입장해주세요')
        console.log('잠깐')
        player.pause()
        msg.react('⏸')
        msg.reply('잠깐 쉴게요')
    } else if (msg.content === `${prefix}다시` || msg.content === `${prefix} 다시`) {
        if (!msg.member.voice?.channel) return msg.channel.send('노래를 다시 재생하려면 음성 채널에 입장해주세요')
        console.log('다시')
        player.resume()
        msg.react('⏯')
        msg.reply('다시 부를게요')
    } else if (msg.content === `${prefix}목록` || msg.content === `${prefix} 목록`) {
        console.log('목록')
        if (serverQueue) {
            songs = serverQueue.songs.map((song) => song.title)
            output = []
            songs.forEach((song, i) => {
                if (i === 0) {
                    output.push(`지금 부르는 중: ${song}`)
                } else {
                    output.push(`끝나고 ${i}번째로 부를 곡: ${song}`)
                }
            })
            msg.reply(`${output.join('\n')}`);
        } else {
            msg.reply(`부를 노래가 없어요`);
        }
    }
    // } else if (msg.content === `${prefix}나가`) {
    //     serverQueue.songs = []
    //     serverQueue.connection.destroy();
    // }

    if (msg.content === `${prefix}설명해` || msg.content === `${prefix} 설명해`) {
        console.log('설명')
        msg.reply(' 단젤아불러줘 [노래제목] - 노래 예약, 재생 \n단젤아스킵 - 노래 스킵 \n단젤아목록 - 예약 노래 목록 \n단젤아잠깐 - 노래 일시정지 \n단젤아다시 - 노래 일시정지 해제 \n단젤아그만 - 예약, 재생중인 노래 제거');
    }

});


async function execute(msg, serverQueue, space) {
    if (!msg.member.voice?.channel) return msg.channel.send('노래를 재생하려면 음성 채널에 입장해주세요')
    let args = ''
    if (space) {
        args = msg.content.split(`${prefix} 불러줘 `)[1]
    } else {
        args = msg.content.split(`${prefix}불러줘 `)[1]
    }

    yt_info = await play.search(args, {
        limit: 1
    })

    const song = {
        title: args,
        url: yt_info[0].url,
    };

    if (!serverQueue) {
        const queueStructure = {
          textChannel: msg.channel,
          voiceChannel: msg.member.voice.channel.id,
          connection: null,
          songs: [],
          volume: 5,
          playing: true
        };
        
        queue.set(msg.guild.id, queueStructure);
        queueStructure.songs.push(song);
        console.log(queueStructure.songs)
        try {
            const connection = joinVoiceChannel({
                channelId: msg.member.voice.channel.id,
                guildId: msg.guild.id,
                adapterCreator: msg.guild.voiceAdapterCreator
            })
            queueStructure.connection = connection;

            playSong(msg.guild, queueStructure.songs[0], msg);
            msg.react('▶')
            msg.reply(`${args} 불러드릴게요 \n ${yt_info[0].url} 부르는 중`)
            return 
        } catch (err) {
            console.log(err);
            queue.delete(msg.guild.id);
            return msg.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue.songs)
        msg.react('➡')
        msg.reply(`${serverQueue.songs.length-1}곡 더 부르고 ${song.title} 불러드릴게요`);
    }
}

async function playSong(guild, song) {
    const serverQueue = queue.get(guild.id);

    if (!song) {
        queue.delete(guild.id);
        return;
    }
    stream = await play.stream(song.url)
    resource = createAudioResource(stream.stream, {
        inputType: stream.type
    })
    player = createAudioPlayer({
        behaviors: {
            noSubscriber: NoSubscriberBehavior.Play
        }
    })
    player.play(resource)
    serverQueue.connection.subscribe(player)

    player.on('error', err => {
        console.log(err);
    })

    player.on(AudioPlayerStatus.Idle, () => {
        serverQueue.songs.shift();
        playSong(guild, serverQueue.songs[0]);
        if (serverQueue.songs.length >= 1) serverQueue.textChannel.send(`${serverQueue.songs[0].title} 불러드릴게요 \n ${serverQueue.songs[0].url}`);
    })
  }
         
client.login(token);
