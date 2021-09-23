import { youtube } from "@googleapis/youtube";
import { youtubeApiKey } from '../../config.json';

export const search = async (query: string) => {
  const yt = youtube('v3');
  const results = await yt.search.list({
    part: ["snippet"],
    q: query,
    maxResults: 1,
    auth: youtubeApiKey,
  })

  const videoId = results.data.items?.[0]?.id?.videoId;

  if (videoId === null || videoId === undefined) {
    return undefined;
  }

  return `https://www.youtube.com/watch?v=${videoId}`;
}