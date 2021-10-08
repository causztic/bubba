import { joinVoiceChannel, entersState, VoiceConnectionStatus } from "@discordjs/voice";
import { CommandInteraction, Snowflake, GuildMember } from "discord.js";
import { MusicSubscription } from "../music/subscription";
import { Track } from "../music/track";
import { search } from "../search/search";
import { getSubscription } from "../util";

const handlePlay = async (
	interaction: CommandInteraction,
	subscriptions: Map<Snowflake, MusicSubscription>
	) => {
		let subscription = getSubscription(subscriptions, interaction.guildId);
		
		await interaction.deferReply();
		
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
			
			let url: string | undefined;
			
			if (interaction.options.getSubcommand() === 'link') {
				url = interaction.options.getString('url', true);
			} else {
				const keywords = interaction.options.getString('keywords', true);
				url = await search(keywords);
			}
			
			try {
				if (url === undefined) {
					throw new Error('url is undefined');
				}
				
				const methods = {
					onStart() {
						interaction.followUp({ content: 'Now playing!', ephemeral: true }).catch(console.warn);
					},
					onFinish() {
						interaction.followUp({ content: 'Now finished!', ephemeral: true }).catch(console.warn);
					},
					onError(error: Error) {
						console.warn(error);
						interaction.followUp({ content: `Error: ${error.message}`, ephemeral: true }).catch(console.warn);
					},
				}

				// todo: refactor
				const listRegex = new RegExp(/(\?|\&)list=(?<id>.+)&/); 
				const playlistId = listRegex.exec(url)?.groups?.id;

				if (playlistId) {
					// Attempt to add multiple tracks from the user's video URL
					const tracks = await Track.listFrom(playlistId, methods);
					// Enqueue the track and reply a success message to the user
					subscription.enqueueMultiple(tracks);
					await interaction.followUp(`Enqueued playlist with ${tracks.length} tracks!`);
				} else {
					// Attempt to create a Track from the user's video URL
					const track = await Track.from(url, methods);
					// Enqueue the track and reply a success message to the user
					subscription.enqueue(track);
					await interaction.followUp(`Enqueued ${track.link()}`);
				}
			} catch (error) {
				console.warn(error);
				await interaction.followUp('Failed to play track, please try again later!');
			}
		}

export default handlePlay;