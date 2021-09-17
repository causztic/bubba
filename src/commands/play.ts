import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Plays a song')
  .addStringOption(
    option => option.setName('url')
                    .setDescription('The URL to play from')
                    .setRequired(true)
  )
