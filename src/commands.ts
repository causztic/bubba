import { SlashCommandBuilder } from '@discordjs/builders';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { clientId, guildId, token } from '../config.json';

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Plays a song')
    .addStringOption(option =>
    option.setName('url')
          .setDescription('The URL to play from')
          .setRequired(true)),
  new SlashCommandBuilder()
    .setName('skip')
    .setDescription('Skip to the next song in the queue'),  
  new SlashCommandBuilder()
    .setName('queue')
    .setDescription('See the music queue'),          
  new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave the voice channel'),                    
].map(command => command.toJSON());

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
      );
      
      console.log('Successfully registered application commands.');
    } catch (error) {
      console.error(error);
    }
  })();