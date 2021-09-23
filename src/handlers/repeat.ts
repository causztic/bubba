import { CommandInteraction, Snowflake } from "discord.js";
import { MusicSubscription } from "../music/subscription";
import { getSubscription } from "../util";

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

export default handleRepeat;