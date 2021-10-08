import ytdl, { getInfo } from 'ytdl-core';
import { AudioResource, createAudioResource, demuxProbe } from '@discordjs/voice';
import { raw } from 'youtube-dl-exec';
import { hideLinkEmbed } from '@discordjs/builders';
import { youtube, youtube_v3 } from '@googleapis/youtube';
import { youtubeApiKey } from '../../config.json';

/**
* This is the data required to create a Track object
*/
export interface TrackData {
  url: string;
  title: string;
  onStart: () => void;
  onFinish: () => void;
  onError: (error: Error) => void;
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/**
* A Track represents information about a YouTube video (in this context) that can be added to a queue.
* It contains the title and URL of the video, as well as functions onStart, onFinish, onError, that act
* as callbacks that are triggered at certain points during the track's lifecycle.
*
* Rather than creating an AudioResource for each video immediately and then keeping those in a queue,
* we use tracks as they don't pre-emptively load the videos. Instead, once a Track is taken from the
* queue, it is converted into an AudioResource just in time for playback.
*/
export class Track implements TrackData {
  public readonly url: string;
  public readonly title: string;
  public readonly onError: (error: Error) => void;
  public repeating: boolean;

  private readonly wrapperOnStart: () => void;
  private readonly wrapperOnFinish: () => void;
  
  private constructor({ url, title, onStart, onFinish, onError }: TrackData) {
    this.url = url;
    this.title = title;
    this.repeating = false;
    this.onError = onError;
    this.wrapperOnStart = onStart;
    this.wrapperOnFinish = onFinish;
  }

  public toggleRepeating(): void {
    this.repeating = !this.repeating;
  }

  public link(): string {
    return `**${this.title}** - ${hideLinkEmbed(this.url)}`;
  }

  /**
   * If a track is being repeated, don't run onStart to prevent additional calls
   * as it is *technically* not started
   */
  public onStart(): void {
    if (!this.repeating) {
      this.wrapperOnStart();
    }
  }

  /**
   * If a track is being repeated, don't run onFinish to prevent additional calls
   * as it is *technically* not finished
   */
  public onFinish(): void {
    if (!this.repeating) {
      this.wrapperOnFinish();
    }
  }
  
  /**
  * Creates an AudioResource from this Track.
  */
  public createAudioResource(): Promise<AudioResource<Track>> {
    return new Promise((resolve, reject) => {
      const process = raw(
        this.url,
        {
          o: '-',
          q: '',
          f: 'bestaudio[ext=webm+acodec=opus+asr=48000]/bestaudio',
          r: '100K',
        },
        { stdio: ['ignore', 'pipe', 'ignore'] },
        );
        if (!process.stdout) {
          reject(new Error('No stdout'));
          return;
        }
        const stream = process.stdout;
        const onError = (error: Error) => {
          if (!process.killed) process.kill();
          stream.resume();
          reject(error);
        };
        process
        .once('spawn', () => {
          demuxProbe(stream)
          .then((probe) => resolve(createAudioResource(probe.stream, { metadata: this, inputType: probe.type })))
          .catch(onError);
        })
        .catch(onError);
      });
    }

    /**
    * Creates a list of Tracks from a playlist id and lifecycle callback methods.
    *
    * @param playlistId The ID of the playlist
    * @param methods Lifecycle callbacks
    * @returns The created Track
    */

    public static async listFrom(playlistId: string): Promise<Track[]> {
      const yt = youtube('v3');
      const { data } = await yt.playlistItems.list({
        playlistId,
        auth: youtubeApiKey,
        maxResults: 100,
        part: ['snippet'],
      })

      function isTrack(track: Track | null): track is Track {
        return track !== null;
      }
      const tracks = data.items?.map((item) => this.fromInfo(item)).filter(isTrack);

      return tracks ?? [];
    }
    
    /**
    * Creates a Track directly from youtube API and lifecycle callback methods.
    *
    * @param item youtube response
    * @param methods Lifecycle callbacks
    * @returns The created Track
    */
    public static fromInfo(item: youtube_v3.Schema$PlaylistItem): Track | null {
      const url = `https://www.youtube.com/watch?v=${item.snippet?.resourceId?.videoId}`;
        
      // No method calls as token would run out in long playlists
      const wrappedMethods = {
        onStart() {
          wrappedMethods.onStart = noop;
        },
        onFinish() {
          wrappedMethods.onFinish = noop;
        },
        onError(error: Error) {
          wrappedMethods.onError = noop;
        },
      };

      // HACK: don't add deleted videos
      if (item.snippet?.title === 'Deleted video') {
        return null;
      }
      
      return new Track({
        title: item.snippet?.title!,
        url,
        ...wrappedMethods,
      });
    }

    /**
    * Creates a Track from a video URL and lifecycle callback methods.
    *
    * @param url The URL of the video
    * @param methods Lifecycle callbacks
    * @returns The created Track
    */
    public static async from(url: string, methods: Pick<Track, 'onStart' | 'onFinish' | 'onError'>): Promise<Track> {
      const info = await getInfo(url);

      // The methods are wrapped so that we can ensure that they are only called once.
      const wrappedMethods = {
        onStart() {
          wrappedMethods.onStart = noop;
          methods.onStart();
        },
        onFinish() {
          wrappedMethods.onFinish = noop;
          methods.onFinish();
        },
        onError(error: Error) {
          wrappedMethods.onError = noop;
          methods.onError(error);
        },
      };
      
      return new Track({
        title: info.videoDetails.title,
        url: info.videoDetails.video_url,
        ...wrappedMethods,
      });
    }
  }