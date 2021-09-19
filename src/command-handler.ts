import { AudioPlayerStatus, AudioResource, entersState, joinVoiceChannel, VoiceConnectionStatus } from "@discordjs/voice";
import { GuildMember, CommandInteraction, Snowflake } from "discord.js";
import { MusicSubscription } from "./music/subscription";
import { Track } from "./music/track";

declare type InteractionConsumer = (
  interaction: CommandInteraction,
  subscriptions: Map<Snowflake, MusicSubscription>
) => Promise<void>

const getSubscription = (subscriptions: Map<Snowflake, MusicSubscription>, guildId: string | null) => {
  if (guildId === null) {
    return undefined;
  }

  return subscriptions.get(guildId);
}

const handlePlay = async (
  interaction: CommandInteraction, 
  subscriptions: Map<Snowflake, MusicSubscription>
) => {
  let subscription = getSubscription(subscriptions, interaction.guildId);

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
      subscriptions.set(interaction.guildId!, subscription);
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
    await interaction.followUp('Failed to play track, please try again later!');
  }
}

const handleSkip = async (
  interaction: CommandInteraction, 
  subscriptions: Map<Snowflake, MusicSubscription>
) => {
  const subscription = getSubscription(subscriptions, interaction.guildId);
  if (subscription) {
    // Calling .stop() on an AudioPlayer causes it to transition into the Idle state. Because of a state transition
    // listener defined in music/subscription.ts, transitions into the Idle state mean the next track from the queue
    // will be loaded and played.
    
    subscription.currentTrack = undefined;
    subscription.audioPlayer.stop();
    await interaction.reply('Skipped song!');
  } else {
    await interaction.reply('Not playing in this server!');
  }
}

const handleQueue = async (
  interaction: CommandInteraction, 
  subscriptions: Map<Snowflake, MusicSubscription>
) => {
  const subscription = getSubscription(subscriptions, interaction.guildId);

  if (subscription) {
    const current =
      subscription.audioPlayer.state.status === AudioPlayerStatus.Idle
        ? 'Nothing is currently playing!'
        : `Playing **${(subscription.audioPlayer.state.resource as AudioResource<Track>).metadata.title}**`;

    const queue = subscription.queue
      .slice(0, 5)
      .map((track, index) => `${index + 1}) ${track.title}`)
      .join('\n');

    await interaction.reply(`${current}\n\n${queue}`);
  } else {
    await interaction.reply('Not playing in this server!');
  }
}

const handleRepeat = async (
  interaction: CommandInteraction, 
  subscriptions: Map<Snowflake, MusicSubscription>
) => {
  const subscription = getSubscription(subscriptions, interaction.guildId);

  if (subscription) {
    if (interaction.options.getSubcommand() === 'song') {
      subscription.repeatTrack();
      await interaction.reply('Repeating current song!');
    }
  } else {
    await interaction.reply('Not playing in this server!');
  }
}

const handleLeave = async (
  interaction: CommandInteraction,
  subscriptions: Map<Snowflake, MusicSubscription>
) => {
  const subscription = getSubscription(subscriptions, interaction.guildId);

  if (subscription) {
    subscription.voiceConnection.destroy();
    subscriptions.delete(interaction.guildId!);
    await interaction.reply({ content: 'Left channel!', ephemeral: true });
  } else {
    await interaction.reply('Not playing in this server!');
  }
}

const COMMAND_MAP: { [key: string]: InteractionConsumer } = {
  play: handlePlay,
  leave: handleLeave,
  queue: handleQueue,
  repeat: handleRepeat,
  skip: handleSkip
}

export const handleCommandByName = (name: string) => {
  if (Object.keys(COMMAND_MAP).includes(name)) {
    return COMMAND_MAP[name];
  }
}
