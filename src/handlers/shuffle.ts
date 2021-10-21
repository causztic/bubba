import { joinVoiceChannel, entersState, VoiceConnectionStatus } from "@discordjs/voice";
import { CommandInteraction, Snowflake, GuildMember } from "discord.js";
import { MusicSubscription } from "../music/subscription";
import { search } from "../search/search";
import { getSubscription } from "../util";

const handleShuffle = async (
	interaction: CommandInteraction,
	subscriptions: Map<Snowflake, MusicSubscription>
	) => {
		const subscription = getSubscription(subscriptions, interaction.guildId);
	}

export default handleShuffle;