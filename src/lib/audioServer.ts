/**
 * AudioServer — browser singleton for audio playback.
 *
 * Enforces a single-resource constraint: playing a new clip automatically
 * stops the one currently playing. Safe to call stop() when nothing is active.
 *
 * Usage:
 *   audioServer.play("base64EncodedMp3...");
 *   audioServer.stop();
 *   audioServer.isPlaying; // boolean
 */
class AudioServer {
  private current: HTMLAudioElement | null = null;

  play(base64: string): void {
    this.stop();
    const audio = new Audio(`data:audio/mp3;base64,${base64}`);
    this.current = audio;
    void audio.play();
    audio.addEventListener(
      "ended",
      () => {
        if (this.current === audio) {
          this.current = null;
        }
      },
      { once: true },
    );
  }

  stop(): void {
    if (!this.current) return;
    this.current.pause();
    this.current.currentTime = 0;
    this.current = null;
  }

  get isPlaying(): boolean {
    return this.current !== null;
  }
}

export const audioServer = new AudioServer();
