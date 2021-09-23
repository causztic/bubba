import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Plays a song')
  .addSubcommand(
    subcommand => 
      subcommand.setName('link')
        .setDescription('the link to play from')
        .addStringOption(
          option => option.setName('url')
            .setDescription('The URL to play from')
            .setRequired(true)
        )
  ).addSubcommand(
    subcommand => 
      subcommand.setName('search')
        .setDescription('Search for a link')
        .addStringOption(
          option => option.setName('keywords')
            .setDescription('The keywords to search for')
            .setRequired(true)
        )
  )

