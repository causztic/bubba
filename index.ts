// https://github.com/discordjs/voice/tree/main/examples/music-bot

import { Client, GuildMember, Intents, Snowflake } from 'discord.js';
import { joinVoiceChannel, VoiceConnectionStatus, entersState } from '@discordjs/voice';
import { token } from './config.json';
import { MusicSubscription } from './src/music/subscription';
import { Track } from './src/music/track';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]})
const subscriptions = new Map<Snowflake, MusicSubscription>();

client.once('ready', () => {
  console.log('ready!');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() || !interaction.guildId) return;

  let subscription = subscriptions.get(interaction.guildId);

  if (interaction.commandName === 'play') {
    await interaction.deferReply();
    const url = interaction.options.getString('url', true);
    if (!subscription) {
      if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
        const channel = interaction.member.voice.channel;
        subscription = new MusicSubscription(
          joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
          }),
          );
          subscription.voiceConnection.on('error', console.warn);
          subscriptions.set(interaction.guildId, subscription);
        }
      }
      
      // If there is no subscription, tell the user they need to join a channel.
      if (!subscription) {
        await interaction.followUp('Join a voice channel, dumdum');
        return;
      }
      
      // Make sure the connection is ready before processing the user's request
      try {
        await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
      } catch (error) {
        console.warn(error);
        await interaction.followUp('Failed to join voice channel within 20 seconds, please try again later!');
        return;
      }
      
      try {
        // Attempt to create a Track from the user's video URL
        const track = await Track.from(url, {
          onStart() {
            interaction.followUp({ content: 'Now playing!', ephemeral: true }).catch(console.warn);
          },
          onFinish() {
            interaction.followUp({ content: 'Now finished!', ephemeral: true }).catch(console.warn);
          },
          onError(error) {
            console.warn(error);
            interaction.followUp({ content: `Error: ${error.message}`, ephemeral: true }).catch(console.warn);
          },
        });
        // Enqueue the track and reply a success message to the user
        subscription.enqueue(track);
        await interaction.followUp(`Enqueued **${track.title}**`);
      } catch (error) {
        console.warn(error);
        await interaction.reply('Failed to play track, please try again later!');
      }
    }
  });
  
  
  client.login(token);