const { Client, Intents } = require('discord.js');
const discordTTS = require('discord-tts');
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MEMBERS]
});
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, AudioPlayer, StreamType, createAudioResource, VoiceConnectionStatus, entersState } = require('@discordjs/voice');
const play = require('play-dl');

const { token, youtube_key } = require('./config.json');
const Youtube = require('youtube-node');
const youtube = new Youtube();
youtube.setKey(youtube_key);

client.on('ready', () => { 
    console.log(`Logged in as ${client.user.tag}`); 
}); 

let voiceConnection;
let audioPlayer = new AudioPlayer();


let yt_info;
let stream;
let resource;
let player;

client.on('messageCreate', async msg => { 
    if (msg.content.startsWith('!play')) {
        if (!msg.member.voice?.channel) return msg.channel.send('노래를 재생하려면 음성 채널에 입장해주세요')
        const connection = joinVoiceChannel({
            channelId: msg.member.voice.channel.id,
            guildId: msg.guild.id,
            adapterCreator: msg.guild.voiceAdapterCreator
        })
        let args = msg.content.split('play')[1]
        yt_info = await play.search(args, {
            limit: 1
        })
        stream = await play.stream(yt_info[0].url)
        resource = createAudioResource(stream.stream, {
            inputType: stream.type
        })
        player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        })
        player.play(resource)
        msg.react('▶')
        msg.reply(`${args} 불러드릴게요`)
        connection.subscribe(player)
    } else if (msg.content == '!stop') {
        player.stop()
        msg.react('⏹')
        msg.reply('그만 부를게요')
    }
    if (msg.content.startsWith("`")) {
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
         
client.login(token);
