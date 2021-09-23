import { Snowflake } from "discord.js";
import { MusicSubscription } from "./music/subscription";

export const getSubscription = (subscriptions: Map<Snowflake, MusicSubscription>, guildId: string | null) => {
    if (guildId === null) {
      return undefined;
    }
  
    return subscriptions.get(guildId);
  }
  