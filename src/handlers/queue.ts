import { AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import { CommandInteraction, Snowflake } from "discord.js";
import { MusicSubscription } from "../music/subscription";
import { Track } from "../music/track";
import { getSubscription } from "../util";

const handleQueue = async (
  interaction: CommandInteraction,
  subscriptions: Map<Snowflake, MusicSubscription>
) => {
  const subscription = getSubscription(subscriptions, interaction.guildId);

  if (subscription) {
    let current;

    if (subscription.audioPlayer.state.status === AudioPlayerStatus.Idle) {
      current = 'Nothing is currently playing!';
    } else {
      const metadata = (subscription.audioPlayer.state.resource as AudioResource<Track>).metadata;
      current = `Playing ${metadata.link()}`
    }

    const queue = subscription.queue
      .slice(0, 10)
      .map((track, index) => `${index + 1}) ${track.title}`)
      .join('\n');

    await interaction.reply(`${current}\n\n${queue}`);
  } else {
    await interaction.reply('Not playing in this server!');
  }
}

export default handleQueue;