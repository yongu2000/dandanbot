const { Client, Intents } = require('discord.js'); 
const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MEMBERS]
});
const { joinVoiceChannel, createAudioPlayer, NoSubscriberBehavior, createAudioResource, AudioPlayerStatus, SubscriptionStatus } = require('@discordjs/voice');
const play = require('play-dl');

const { token, youtube_key } = require('./config.json');
const Youtube = require('youtube-node');
const youtube = new Youtube();
youtube.setKey(youtube_key);

const player = createAudioPlayer();

client.on('ready', () => { 
    console.log(`Logged in as ${client.user.tag}`); 
}); 

client.on('messageCreate', async msg => { 
    if (msg.content.startsWith('!play')) {
        if (!msg.member.voice?.channel) return msg.channel.send('노래를 재생하려면 음성 채널에 입장해주세요')
        const connection = joinVoiceChannel({
            channelId: msg.member.voice.channel.id,
            guildId: msg.guild.id,
            adapterCreator: msg.guild.voiceAdapterCreator
        })
        let args = msg.content.split('play')[1]
        let yt_info = await play.search(args, {
            limit: 1
        })
        let stream = await play.stream(yt_info[0].url)
        let resource = createAudioResource(stream.stream, {
            inputType: stream.type
        })
        let player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Play
            }
        })
        player.play(resource)
        msg.react('▶')
        connection.subscribe(player)
    } else if (msg.content == '!stop') {
        player.stop()
        msg.react('⏹')
        msg.reply('재생을 중지합니다!')
    }
});
         
client.login(token);
