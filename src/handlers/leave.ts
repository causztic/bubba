import { CommandInteraction, Snowflake } from "discord.js";
import { MusicSubscription } from "../music/subscription";
import { getSubscription } from "../util";

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

export default handleLeave;
