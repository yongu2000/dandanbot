const { Client, Intents } = require('discord.js');
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MEMBERS]
});
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');
const { token } = require('./config.json');
//여기만 바꾸면 개인용 봇 완성!
const prefix = '단젤아';

client.on('ready', () => { 
    console.log(`Logged in as ${client.user.tag}`); 
    client.user.setActivity("명령어 확인: [단젤아 설명해]", {
        type: "LISTENING"
      });
}); 

//노래 큐
const queue = new Map();

//노래 재생용 변수
let yt_info;
let stream;
let resource;
let player;

//명령
client.on('messageCreate', async msg => { 
    if (msg.author.bot) return;
    const serverQueue = queue.get(msg.guild.id);
    
    //노래 추가
    if (msg.content.startsWith(`${prefix}불러줘 `)) {
        //console.log('불러줘')
        console.log(`${msg.guild.id}서버 ${msg.author.username}: ${msg.content}`);
        let args = msg.content.split(`${prefix}불러줘 `)[1];
        execute(msg, serverQueue, args);
        // 노래 추가 띄어쓰기 버전
    } else if (msg.content.startsWith(`${prefix} 불러줘 `)) {
        //console.log('불러줘 띄어쓰기')
        console.log(`${msg.guild.id}서버 ${msg.author.username}: ${msg.content}`);
        let args = msg.content.split(`${prefix} 불러줘 `)[1];
        execute(msg, serverQueue, args);
        
        // 노래 스킵
    } else if (msg.content.startsWith(`${prefix}불러줘`) || msg.content.startsWith(`${prefix} 불러줘`)) {
        //console.log('어허')
        console.log(`${msg.guild.id}서버 ${msg.author.username}: ${msg.content}`);
        msg.reply('띄어쓰기 해줘');
        // 노래 스킵
    } else if (msg.content === `${prefix}스킵` || msg.content === `${prefix} 스킵`) {
        if (!msg.member.voice?.channel) return msg.channel.send('노래를 스킵하려면 음성 채널에 입장해주세요')
        //console.log('스킵')
        console.log(`${msg.guild.id}서버 ${msg.author.username}: ${msg.content}`);
        if (player) {
            player.stop()
            msg.react('⏩')
            if (serverQueue.songs.length === 1) {
                msg.reply(`부를 노래가 없어요`);
            } else {
                msg.reply('다음 노래 부를게요')
            }
        }
        // 노래 중단 (큐 전부 비움)
    } else if (msg.content === `${prefix}그만` || msg.content === `${prefix} 그만`) {
        if (!msg.member.voice?.channel) return msg.channel.send('노래를 멈추려면 음성 채널에 입장해주세요')
        //console.log('그만')
        console.log(`${msg.guild.id}서버 ${msg.author.username}: ${msg.content}`);
        if (player) {
            player.stop()
            serverQueue.songs = []
            msg.react('⏹')
            msg.reply('그만 부를게요')
        } else {
            msg.reply('그만 부를 노래가 없어요');
        }
        // 노래 일시 정지
    } else if (msg.content === `${prefix}잠깐` || msg.content === `${prefix} 잠깐`) {
        if (!msg.member.voice?.channel) return msg.channel.send('노래를 일시 정지하려면 음성 채널에 입장해주세요')
        //console.log('잠깐')
        console.log(`${msg.guild.id}서버 ${msg.author.username}: ${msg.content}`);
        player.pause()
        msg.react('⏸')
        msg.reply('잠깐 쉴게요')
        // 노래 일시 정지 해제
    } else if (msg.content === `${prefix}다시` || msg.content === `${prefix} 다시`) {
        if (!msg.member.voice?.channel) return msg.channel.send('노래를 다시 재생하려면 음성 채널에 입장해주세요')
        //console.log('다시')
        console.log(`${msg.guild.id}서버 ${msg.author.username}: ${msg.content}`);
        player.unpause()
        msg.react('⏯')
        msg.reply('다시 부를게요')
        // 노래 목록 출력
    } else if (msg.content === `${prefix}목록` || msg.content === `${prefix} 목록`) {
        //console.log('목록')
        console.log(`${msg.guild.id}서버 ${msg.author.username}: ${msg.content}`);
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
    } else if (msg.content === `${prefix}나가` || msg.content === `${prefix} 나가`) {
        console.log(`${msg.guild.id}서버 ${msg.author.username}: ${msg.content}`);
        if (queue.get(msg.guild.id)) {
            queue.delete(msg.guild.id);
            serverQueue.connection.destroy();
        } else {
            msg.reply(`이미 방에 없어요`);
        }
    } else if (msg.content === `${prefix}`) {
        console.log(`${msg.guild.id}서버 ${msg.author.username}: ${msg.content}`);
        msg.reply(`${msg.author.username}님 안녕하세요`)
    }

    // 명령어 설명
    if (msg.content === `${prefix}설명해` || msg.content === `${prefix} 설명해`) {
        console.log(`${msg.guild.id}서버 ${msg.author.username}: ${msg.content}`);
        //console.log('설명')
        msg.reply(
        `단젤아 불러줘 / 단젤아불러줘 [노래제목] - 노래 예약, 재생
**노래 검색 시 가수명까지 추가하면 더 정확하게 불러요** \n
단젤아 스킵 / 단젤아스킵 - 노래 스킵
단젤아 목록 / 단젤아목록 - 예약 노래 목록
단젤아 잠깐 / 단젤아잠깐 - 노래 일시정지
단젤아 다시 / 단젤아다시 - 노래 일시정지 해제
단젤아 그만 / 단젤아그만 - 예약, 재생중인 노래 모두 제거
단젤아 나가 / 단젤아나가 - 단젤 내보내기`);
    }

});

// 노래 추가 비동기 함수
async function execute(msg, serverQueue, args) {
    if (!msg.member.voice?.channel) return msg.channel.send('노래를 재생하려면 음성 채널에 입장해주세요')
    const re = /http/g
    const isUrl = re.test(args)
    let song;
    if (!isUrl) {
        yt_info = await play.search(args, {
            limit: 1
        })
        song = {
            title: args,
            url: yt_info[0].url,
        };
    } else {
        song = {
            title: '링크',
            url: args,
        };
    }
        
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
        //console.log(queueStructure.songs)
        try {
            const connection = joinVoiceChannel({
                channelId: msg.member.voice.channel.id,
                guildId: msg.guild.id,
                adapterCreator: msg.guild.voiceAdapterCreator
            })
            queueStructure.connection = connection;

            playSong(msg.guild, queueStructure.songs[0]);
            msg.react('▶')
            if (!isUrl) {
                msg.reply(`${args} 불러드릴게요 \n ${yt_info[0].url} 부르는 중`)
            } else {
                msg.reply(`링크된 노래 불러드릴게요 \n ${args} 부르는 중`)
            }
            return 
        } catch (err) {
            console.log(err);
            queue.delete(msg.guild.id);
            return msg.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        //console.log(serverQueue.songs)
        msg.react('➡')
        msg.reply(`${serverQueue.songs.length-1}곡 더 부르고 ${song.title} 불러드릴게요`);
    }
}

//노래 실행 비동기 함수
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
