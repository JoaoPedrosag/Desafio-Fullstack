import LinkifyIt from "linkify-it";

const linkify = new LinkifyIt();

export interface DetectedLink {
  url: string;
  text: string;
  index: number;
}

export function detectUrls(text: string): DetectedLink[] {
  const matches = linkify.match(text) || [];

  return matches.map((match) => ({
    url: match.url,
    text: match.text,
    index: match.index,
  }));
}

export function getFirstUrl(text: string): string | null {
  const urls = detectUrls(text);
  return urls.length > 0 ? urls[0].url : null;
}
