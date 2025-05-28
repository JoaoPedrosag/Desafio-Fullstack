export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
  favicon?: string;
  provider?: string;
}

const previewCache = new Map<
  string,
  { data: LinkPreview | null; timestamp: number }
>();
const CACHE_DURATION = 5 * 60 * 1000;

const LINK_PREVIEW_APIS = [
  {
    name: "LinkPreview.net",
    url: (url: string) =>
      `https://api.linkpreview.net/?q=${encodeURIComponent(url)}`,
    headers: {} as Record<string, string>,
    transform: (data: any, originalUrl: string): LinkPreview => ({
      url: data.url || originalUrl,
      title: data.title,
      description: data.description,
      image: data.image,
      siteName: data.url ? new URL(data.url).hostname : undefined,
      provider: "LinkPreview.net",
    }),
  },
  {
    name: "Microlink.io",
    url: (url: string) =>
      `https://api.microlink.io/?url=${encodeURIComponent(
        url
      )}&screenshot=true&embed=screenshot.url`,
    headers: {} as Record<string, string>,
    transform: (data: any, originalUrl: string): LinkPreview => ({
      url: data.data?.url || originalUrl,
      title: data.data?.title,
      description: data.data?.description,
      image: data.data?.image?.url || data.data?.screenshot?.url,
      siteName: data.data?.publisher,
      provider: "Microlink.io",
    }),
  },
];

function getSpecialPreview(url: string): LinkPreview | null {
  try {
    const urlObj = new URL(url);

    if (
      urlObj.hostname.includes("youtube.com") ||
      urlObj.hostname.includes("youtu.be")
    ) {
      const videoId = extractYouTubeId(url);
      if (videoId) {
        return {
          url,
          title: "Vídeo do YouTube",
          description: "Clique para assistir no YouTube",
          image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          siteName: "YouTube",
          favicon: "https://www.youtube.com/favicon.ico",
          provider: "YouTube",
        };
      }
    }

    if (
      urlObj.hostname.includes("twitter.com") ||
      urlObj.hostname.includes("x.com")
    ) {
      return {
        url,
        title: "Post do X (Twitter)",
        description: "Veja este post no X",
        image: "https://abs.twimg.com/icons/apple-touch-icon-192x192.png",
        siteName: "X (Twitter)",
        favicon: "https://abs.twimg.com/favicons/twitter.2.ico",
        provider: "X/Twitter",
      };
    }

    if (urlObj.hostname.includes("github.com")) {
      return {
        url,
        title: "Repositório no GitHub",
        description: "Confira este projeto no GitHub",
        image:
          "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
        siteName: "GitHub",
        favicon: "https://github.com/favicon.ico",
        provider: "GitHub",
      };
    }

    return null;
  } catch {
    return null;
  }
}

function extractYouTubeId(url: string): string | null {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

async function basicScraping(url: string): Promise<LinkPreview | null> {
  try {
    const urlObj = new URL(url);
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return null;
    }

    const response = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; LinkPreview/2.0)",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!response.ok) return null;

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const getMetaContent = (selectors: string[]): string | undefined => {
      for (const selector of selectors) {
        const meta = doc.querySelector(selector);
        const content = meta?.getAttribute("content");
        if (content && content.trim()) return content.trim();
      }
      return undefined;
    };

    const title =
      getMetaContent([
        'meta[property="og:title"]',
        'meta[name="twitter:title"]',
        'meta[name="title"]',
        "title",
      ]) || doc.querySelector("title")?.textContent?.trim();

    const description = getMetaContent([
      'meta[property="og:description"]',
      'meta[name="twitter:description"]',
      'meta[name="description"]',
    ]);

    const image = getMetaContent([
      'meta[property="og:image"]',
      'meta[name="twitter:image"]',
      'meta[name="twitter:image:src"]',
    ]);

    const siteName =
      getMetaContent(['meta[property="og:site_name"]']) || urlObj.hostname;

    const favicon =
      doc.querySelector('link[rel="icon"]')?.getAttribute("href") ||
      doc.querySelector('link[rel="shortcut icon"]')?.getAttribute("href") ||
      doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute("href") ||
      `${urlObj.origin}/favicon.ico`;

    return {
      url,
      title: title?.substring(0, 100),
      description: description?.substring(0, 200),
      image: image ? new URL(image, url).href : undefined,
      siteName: siteName?.substring(0, 50),
      favicon: favicon ? new URL(favicon, url).href : undefined,
      provider: "Basic Scraping",
    };
  } catch (error) {
    console.error("Erro no scraping básico:", error);
    return null;
  }
}

export async function fetchLinkPreview(
  url: string
): Promise<LinkPreview | null> {
  try {
    const cached = previewCache.get(url);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    const specialPreview = getSpecialPreview(url);
    if (specialPreview) {
      previewCache.set(url, { data: specialPreview, timestamp: Date.now() });
      return specialPreview;
    }

    for (const api of LINK_PREVIEW_APIS) {
      try {
        const response = await fetch(api.url(url), {
          headers: {
            Accept: "application/json",
            "User-Agent": "Mozilla/5.0 (compatible; ChatApp/1.0)",
            ...api.headers,
          },
          signal: AbortSignal.timeout(8000),
        });

        if (response.ok) {
          const data = await response.json();

          if (data && (data.title || data.data?.title)) {
            const preview = api.transform(data, url);
            if (preview.title || preview.description) {
              previewCache.set(url, { data: preview, timestamp: Date.now() });
              return preview;
            }
          }
        }
      } catch (error) {
        console.warn(`API ${api.name} falhou:`, error);
        continue;
      }
    }

    const basicPreview = await basicScraping(url);
    previewCache.set(url, { data: basicPreview, timestamp: Date.now() });
    return basicPreview;
  } catch (error) {
    console.error("Erro geral ao buscar preview:", error);
    const fallback = {
      url,
      title: new URL(url).hostname,
      provider: "Fallback",
    };
    previewCache.set(url, { data: fallback, timestamp: Date.now() });
    return fallback;
  }
}

export function clearOldCache() {
  const now = Date.now();
  for (const [key, value] of previewCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      previewCache.delete(key);
    }
  }
}

setInterval(clearOldCache, 10 * 60 * 1000);
