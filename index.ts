// https://github.com/discordjs/voice/tree/main/examples/music-bot

import { Client, Intents, Snowflake } from 'discord.js';
import { token } from './config.json';
import { MusicSubscription } from './src/music/subscription';
import { handleCommandByName } from './src/handlers';

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES]})
const subscriptions = new Map<Snowflake, MusicSubscription>();

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand() || !interaction.guildId) return;

  handleCommandByName(interaction.commandName)?.(interaction, subscriptions);
});
  
client.login(token);