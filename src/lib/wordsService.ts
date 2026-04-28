export interface WordResultEntry {
  definition: string;
  partOfSpeech: string;
  examples?: string[];
}

export interface WordResult {
  word: string;
  results: WordResultEntry[];
}

export async function fetchWordData(word: string): Promise<WordResult> {
  const res = await fetch(`/api/words/${encodeURIComponent(word)}`);

  if (res.status === 404) {
    throw new Error(`Word not found: ${word}`);
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch word data (${res.status})`);
  }

  return res.json() as Promise<WordResult>;
}
