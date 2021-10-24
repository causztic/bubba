import handleLeave from "./leave";
import handlePlay from "./play";
import handleQueue from "./queue";
import handleRepeat from "./repeat";
import handleSkip from "./skip";
import handleShuffle from "./shuffle";

import { CommandInteraction, Snowflake } from "discord.js";
import { MusicSubscription } from "../music/subscription";
import handleNowPlaying from "./nowPlaying";

declare type InteractionConsumer = (
  interaction: CommandInteraction,
  subscriptions: Map<Snowflake, MusicSubscription>
) => Promise<void>

const COMMAND_MAP: { [key: string]: InteractionConsumer } = {
  play: handlePlay,
  leave: handleLeave,
  queue: handleQueue,
  repeat: handleRepeat,
  skip: handleSkip,
  shuffle: handleShuffle,
  np: handleNowPlaying,
}

export const handleCommandByName = (name: string) => {
  if (Object.keys(COMMAND_MAP).includes(name)) {
    return COMMAND_MAP[name];
  }
}
