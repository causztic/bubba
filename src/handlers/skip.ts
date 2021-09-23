import { CommandInteraction, Snowflake } from "discord.js";
import { MusicSubscription } from "../music/subscription";
import { getSubscription } from "../util";

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

export default handleSkip;