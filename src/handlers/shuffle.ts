import { CommandInteraction, Snowflake } from "discord.js";
import { MusicSubscription } from "../music/subscription";
import { getSubscription } from "../util";

const handleShuffle = async (
	interaction: CommandInteraction,
	subscriptions: Map<Snowflake, MusicSubscription>
	) => {
		const subscription = getSubscription(subscriptions, interaction.guildId);
		subscription?.shuffle();
		await interaction.reply('Shuffled playlist!');
	}

export default handleShuffle;