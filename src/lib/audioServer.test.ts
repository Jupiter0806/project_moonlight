import { describe, it, expect, vi, beforeEach } from "vitest";

// AudioServer is a module-level singleton, so we import the class internals
// by re-importing the module fresh each test via module reset — instead, we
// test the exported singleton directly and reset its state between tests by
// calling stop() in beforeEach.
import { audioServer } from "./audioServer";

// --- Mock HTMLAudioElement ---

const playMock = vi.fn().mockResolvedValue(undefined);
const pauseMock = vi.fn();
const addEventListenerMock = vi.fn();

interface MockAudioInstance {
  play: typeof playMock;
  pause: typeof pauseMock;
  currentTime: number;
  addEventListener: typeof addEventListenerMock;
  src?: string;
}

let latestAudioInstance: MockAudioInstance;

class AudioMock {
  play = playMock;
  pause = pauseMock;
  currentTime = 0;
  addEventListener = addEventListenerMock;
  src: string;

  constructor(src: string) {
    this.src = src;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    latestAudioInstance = this;
  }
}

vi.stubGlobal("Audio", AudioMock);

// --- Helpers ---

/** Fire the "ended" event on the latest Audio instance. */
function fireEnded() {
  const call = addEventListenerMock.mock.calls.findLast(
    ([event]) => event === "ended",
  );
  const handler = call?.[1] as (() => void) | undefined;
  handler?.();
}

// --- Tests ---

describe("audioServer", () => {
  beforeEach(() => {
    audioServer.stop();
    vi.clearAllMocks();
  });

  describe("play()", () => {
    it("creates an Audio element with a data URI from the base64 string", () => {
      audioServer.play("abc123");
      expect(latestAudioInstance.src).toBe("data:audio/mp3;base64,abc123");
    });

    it("calls play() on the Audio element", () => {
      audioServer.play("abc123");
      expect(playMock).toHaveBeenCalledOnce();
    });

    it("registers an 'ended' listener with { once: true } to auto-remove and break the reference cycle", () => {
      audioServer.play("abc123");
      expect(addEventListenerMock).toHaveBeenCalledWith(
        "ended",
        expect.any(Function),
        { once: true },
      );
    });

    it("stops the current audio before playing a new one", () => {
      audioServer.play("first");
      const first = latestAudioInstance;

      audioServer.play("second");

      expect(first.pause).toHaveBeenCalledOnce();
    });

    it("sets isPlaying to true after play()", () => {
      audioServer.play("abc123");
      expect(audioServer.isPlaying).toBe(true);
    });
  });

  describe("stop()", () => {
    it("pauses the current audio", () => {
      audioServer.play("abc123");
      audioServer.stop();
      expect(pauseMock).toHaveBeenCalledOnce();
    });

    it("resets currentTime to 0", () => {
      audioServer.play("abc123");
      latestAudioInstance.currentTime = 5;
      audioServer.stop();
      expect(latestAudioInstance.currentTime).toBe(0);
    });

    it("sets isPlaying to false", () => {
      audioServer.play("abc123");
      audioServer.stop();
      expect(audioServer.isPlaying).toBe(false);
    });

    it("does not throw when nothing is playing", () => {
      expect(() => audioServer.stop()).not.toThrow();
    });

    it("is idempotent — calling stop() twice does not throw", () => {
      audioServer.play("abc123");
      audioServer.stop();
      expect(() => audioServer.stop()).not.toThrow();
    });
  });

  describe("single-resource constraint", () => {
    it("only one Audio instance plays after two play() calls", () => {
      audioServer.play("first");
      audioServer.play("second");
      // play() is called once per Audio instance: once for "first", once for "second"
      expect(playMock).toHaveBeenCalledTimes(2);
      // But "first" should have been paused
      expect(pauseMock).toHaveBeenCalledOnce();
    });
  });

  describe("'ended' event", () => {
    it("sets isPlaying to false when audio ends naturally", () => {
      audioServer.play("abc123");
      expect(audioServer.isPlaying).toBe(true);

      fireEnded();

      expect(audioServer.isPlaying).toBe(false);
    });

    it("does not clear state if a new clip started before the old one ended", () => {
      audioServer.play("first");
      const endedForFirst = addEventListenerMock.mock.calls.findLast(
        ([event]) => event === "ended",
      )?.[1] as () => void;

      audioServer.play("second");

      // The "ended" event from "first" fires late (stale closure)
      endedForFirst?.();

      // Should not clear the second clip
      expect(audioServer.isPlaying).toBe(true);
    });
  });
});
