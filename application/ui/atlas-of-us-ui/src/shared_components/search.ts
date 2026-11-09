//the words of a search, in lower case
export const searchWords = (query: string) => query.toLowerCase().split(/\s+/).filter(Boolean);

//whether every word of a search is in the texts, such as something's name and its other names
export function matchesAll(words: string[], texts: string[]) {
  const joined = texts.join(' ').toLowerCase();
  return words.every((w) => joined.includes(w));
}
