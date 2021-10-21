import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
  .setName('shuffle')
  .setDescription('Shuffles the playlist')