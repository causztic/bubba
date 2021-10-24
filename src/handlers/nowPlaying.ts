import { AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import { CommandInteraction, Snowflake } from "discord.js";
import { MusicSubscription } from "../music/subscription";
import { Track } from "../music/track";
import { getSubscription } from "../util";

const handleNowPlaying = async (
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
				current = `Playing ${metadata.link(false)}`
			}
	
			await interaction.reply(current);
		} else {
			await interaction.reply('Not playing in this server!');
		}
	}

export default handleNowPlaying;