import { SlashCommandBuilder } from '@discordjs/builders';

export const data = new SlashCommandBuilder().setName('skip').setDescription('Skip to the next song in the queue');