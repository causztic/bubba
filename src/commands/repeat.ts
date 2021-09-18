import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
  .setName('repeat')
  .setDescription('Repeats the song / playlist')
  .addSubcommand(subcommand =>
    subcommand
      .setName('song')
      .setDescription('Repeats the currently playing song')
  )