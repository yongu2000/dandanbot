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
        execute(msg, serverQueue);
    } else if (msg.content === `${prefix}그만`) {
        player.stop()
        serverQueue.songs = []
        msg.react('⏹')
        msg.reply('그만 부를게요')
    } else if (msg.content === `${prefix}스킵`) {
        player.stop()
        msg.react('⏩')
        if (serverQueue.songs.length >= 1) {
            msg.reply(`부를 노래가 없어요`);
        } else {
            msg.reply('다음 노래 부를게요')
        }
    } else if (msg.content === `${prefix}잠깐`) {
        player.pause()
        msg.react('⏸')
        msg.reply('잠깐 쉴게요')
    } else if (msg.content === `${prefix}다시`) {
        player.resume()
        msg.react('⏯')
        msg.reply('다시 부를게요')
    }
    if (msg.content.startsWith("` ")) {
        if (!msg.member.voice?.channel) return msg.channel.send('TTS를 재생하려면 음성 채널에 입장해주세요')
        let args = msg.content.split('` ')[1]
        const stream = discordTTS.getVoiceStream(args);
        const audioResource=createAudioResource(stream, {inputType: StreamType.Arbitrary, inlineVolume:true});
        if(!voiceConnection || voiceConnection?.status===VoiceConnectionStatus.Disconnected){
            voiceConnection = joinVoiceChannel({
                channelId: msg.member.voice.channelId,
                guildId: msg.guildId,
                adapterCreator: msg.guild.voiceAdapterCreator,
            });
            voiceConnection=await entersState(voiceConnection, VoiceConnectionStatus.Connecting, 5_000);
        }
        
        if(voiceConnection.status===VoiceConnectionStatus.Connected){
            voiceConnection.subscribe(audioPlayer);
            audioPlayer.play(audioResource);
        }
    }
});


async function execute(msg, serverQueue) {
    if (!msg.member.voice?.channel) return msg.channel.send('노래를 재생하려면 음성 채널에 입장해주세요')
    let args = msg.content.split(`${prefix}불러줘 `)[1]
    yt_info = await play.search(args, {
        limit: 1
    })
    console.log(args);
    const song = {
        title: args,
        url: yt_info[0].url,
    };

    if (!serverQueue) {
        const queueContruct = {
          textChannel: msg.channel,
          voiceChannel: msg.member.voice.channel.id,
          connection: null,
          songs: [],
          volume: 5,
          playing: true
        };

        queue.set(msg.guild.id, queueContruct);
        queueContruct.songs.push(song);

        try {
            const connection = joinVoiceChannel({
                channelId: msg.member.voice.channel.id,
                guildId: msg.guild.id,
                adapterCreator: msg.guild.voiceAdapterCreator
            })
            queueContruct.connection = connection;

            playSong(msg.guild, queueContruct.songs[0], msg);
            msg.react('▶')
            msg.reply(`${args} 불러드릴게요 \n ${yt_info[0].url} 재생중`)
            return 
        } catch (err) {
            console.log(err);
            queue.delete(msg.guild.id);
            return msg.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        console.log(serverQueue);
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
