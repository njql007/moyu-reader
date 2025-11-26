import { Article, RSSFeed } from '../types';

// Proxy Fallback List
// Added more robust proxies (CodeTabs, ThingProxy) to handle strict sites like The Verge
const PROXY_PROVIDERS = [
    (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
    (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`
];

// Helper to fetch raw text via proxy with fallback
const fetchProxyText = async (targetUrl: string): Promise<string | null> => {
    // Some sites (like The Verge) might block requests with unknown query params (cache busters).
    // We only add cache busters for sites we know tolerate them or need them (like CnBeta).
    const isStrictDomain = targetUrl.includes('theverge.com');

    let urlToFetch = targetUrl;
    if (!isStrictDomain) {
        const separator = targetUrl.includes('?') ? '&' : '?';
        urlToFetch = `${targetUrl}${separator}_cb=${Date.now()}`;
    }

    for (const generateProxyUrl of PROXY_PROVIDERS) {
        try {
            const proxyUrl = generateProxyUrl(urlToFetch);
            const response = await fetch(proxyUrl);

            if (response.status === 404) {
                console.warn(`[Proxy] 404 Not Found for: ${targetUrl}`);
                // If 404, the resource is likely actually gone, don't try other proxies for this specific URL
                return null;
            }

            if (!response.ok) {
                console.warn(`[Proxy] Failed with ${response.status} via ${proxyUrl}, trying next...`);
                continue;
            }

            return await response.text();
        } catch (error) {
            console.warn(`[Proxy] Network error via proxy, trying next...`, error);
            continue;
        }
    }
    console.error(`[Proxy] All proxies failed for ${targetUrl}`);
    return null;
};

// --- Content Processing Helper ---
// Centralized logic to fix lazy images and clean content
const processHtmlContent = (html: string, baseUrlStr: string): string => {
    if (!html) return "";
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const baseUrl = new URL(baseUrlStr);

        // Fix Lazy Loading Images (Crucial for sites like SSPai)
        // SSPai uses 'data-original', others use 'data-src'
        doc.querySelectorAll('img').forEach(img => {
            const lazySrc = img.getAttribute('data-original') ||
                img.getAttribute('data-src') ||
                img.getAttribute('data-url') ||
                img.getAttribute('lazy-src');

            if (lazySrc) {
                let validSrc = lazySrc;
                // Fix relative paths in lazy attributes
                if (!validSrc.startsWith('http') && !validSrc.startsWith('data:')) {
                    try {
                        validSrc = new URL(validSrc, baseUrl.origin).href;
                    } catch (e) { }
                }

                img.setAttribute('src', validSrc);
                img.removeAttribute('srcset'); // Remove srcset to avoid browser confusion
                img.style.display = 'block';
                img.style.opacity = '1';
                img.style.maxWidth = '100%';
                img.style.height = 'auto';
            } else {
                // Fix standard src relative paths
                const src = img.getAttribute('src');
                if (src && !src.startsWith('http') && !src.startsWith('data:')) {
                    try {
                        img.setAttribute('src', new URL(src, baseUrl.origin).href);
                    } catch (e) { }
                }
            }
        });

        // Fix Links
        doc.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('#')) {
                try {
                    a.setAttribute('href', new URL(href, baseUrl.origin).href);
                } catch (e) { }
            }
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
        });

        return doc.body.innerHTML;
    } catch (e) {
        console.error("Error processing HTML content", e);
        return html;
    }
};

// --- Custom Pagination Strategies ---
interface PaginationConfig {
    urlGenerator: (page: number, feedUrl?: string) => string;
    mode: 'RSS_PARAM' | 'HTML_SCRAPE' | 'JSON_API';
    htmlSelector?: string;
    jsonParser?: (data: any, feed: RSSFeed) => Article[];
}

const FEED_PAGINATION_OVERRIDES: Record<string, PaginationConfig> = {
    'cnbeta': {
        urlGenerator: (page) => `https://m.cnbeta.com.tw/list/latest/${page}`,
        mode: 'HTML_SCRAPE',
        htmlSelector: '.list .item a, .list-box .item a, .txt-list li a'
    },
    'hackernews': {
        urlGenerator: (page) => `https://news.ycombinator.com/news?p=${page}`,
        mode: 'HTML_SCRAPE',
        htmlSelector: '.titleline > a'
    },
    'v2ex': {
        urlGenerator: (page) => `https://www.v2ex.com/recent?p=${page}`,
        mode: 'HTML_SCRAPE',
        htmlSelector: '.item_title > a'
    },
    'ithome': {
        urlGenerator: (page) => `https://www.ithome.com/list/list_${page}.html`,
        mode: 'HTML_SCRAPE',
        htmlSelector: '.list_1 li .block h2 a'
    },
    'landian': {
        urlGenerator: (page) => `https://www.landiannews.com/page/${page}`,
        mode: 'HTML_SCRAPE',
        htmlSelector: '.article-title a, header h2 a, .post-title a'
    },
    'ifanr': {
        urlGenerator: (page) => `https://www.ifanr.com/page/${page}`,
        mode: 'HTML_SCRAPE',
        htmlSelector: '.article-item h3 a, .article-info h3 a'
    },
    'sspai': {
        urlGenerator: (page) => `https://sspai.com/api/v1/article/index/page/get?limit=20&offset=${(page - 1) * 20}`,
        mode: 'JSON_API',
        jsonParser: (json: any, feed: RSSFeed) => {
            if (!json || !json.data) return [];
            return json.data.map((item: any) => ({
                guid: item.id.toString(),
                title: item.title,
                link: `https://sspai.com/post/${item.id}`,
                pubDate: new Date(item.released_time * 1000).toISOString(),
                author: item.author?.nickname || 'SSPai',
                contentSnippet: item.summary,
                content: processHtmlContent(item.body || '', 'https://sspai.com'), // Process API content immediately
                feedId: feed.id
            }));
        }
    }
};

// Helper to parse articles from a raw HTML listing page
const fetchHtmlList = async (url: string, selectorHint: string, feedId: string): Promise<Article[]> => {
    console.log(`[Scraper] Fetching ${url} with selector: ${selectorHint}`);
    const html = await fetchProxyText(url);
    if (!html) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const articles: Article[] = [];
    const baseUrl = new URL(url).origin;
    const seenLinks = new Set<string>();

    let nodes = doc.querySelectorAll(selectorHint);

    // Fallback selectors
    if (nodes.length === 0) {
        console.log('[Scraper] Specific selector failed, using generic fallback');
        nodes = doc.querySelectorAll('h2 a, h3 a, .entry-title a, .post-title a, article a, .card a');
    }

    nodes.forEach(node => {
        const anchor = node.tagName === 'A' ? (node as HTMLAnchorElement) : node.querySelector('a');

        if (anchor) {
            const title = anchor.textContent?.trim() || anchor.getAttribute('title') || "Untitled";
            let href = anchor.getAttribute('href');

            if (href && title.length > 5) {
                try {
                    if (!href.startsWith('http')) {
                        if (href.startsWith('/')) {
                            href = `${baseUrl}${href}`;
                        } else {
                            href = new URL(href, url).href;
                        }
                    }

                    if (seenLinks.has(href)) return;
                    seenLinks.add(href);

                    if (href.includes('#comment') || href.includes('/tag/') || href.includes('/category/') || href.includes('javascript:')) return;

                    articles.push({
                        guid: href,
                        title,
                        link: href,
                        pubDate: new Date().toISOString(),
                        content: '',
                        contentSnippet: 'Fetched from web listing',
                        feedId: feedId
                    });
                } catch (e) {
                    // invalid url, skip
                }
            }
        }
    });

    return articles;
};

// Helper to fetch and parse JSON API
const fetchJsonList = async (url: string, parser: (data: any) => Article[]): Promise<Article[]> => {
    const jsonStr = await fetchProxyText(url);
    if (!jsonStr) return [];

    try {
        const data = JSON.parse(jsonStr);
        return parser(data);
    } catch (e) {
        console.error("Failed to parse JSON API response", e);
        return [];
    }
};

export const fetchRSSFeed = async (feed: RSSFeed, page: number = 1): Promise<Article[]> => {
    try {
        let targetUrl = feed.url;
        let mode: 'RSS' | 'HTML' | 'JSON_API' = 'RSS';
        let htmlConfig: PaginationConfig | undefined;

        // --- Pagination Logic ---
        if (page > 1) {
            if (FEED_PAGINATION_OVERRIDES[feed.id]) {
                htmlConfig = FEED_PAGINATION_OVERRIDES[feed.id];
                targetUrl = htmlConfig.urlGenerator(page, feed.url);

                if (htmlConfig.mode === 'HTML_SCRAPE') mode = 'HTML';
                if (htmlConfig.mode === 'JSON_API') mode = 'JSON_API';
            } else {
                // Generic Fallback
                const separator = feed.url.includes('?') ? '&' : '?';
                targetUrl = `${feed.url}${separator}page=${page}&p=${page}`;
            }
        }

        // --- Mode: JSON API ---
        if (mode === 'JSON_API' && htmlConfig && htmlConfig.jsonParser) {
            return await fetchJsonList(targetUrl, (data) => htmlConfig!.jsonParser!(data, feed));
        }

        let articles: Article[] = [];

        // --- Mode: HTML Scraping ---
        if (mode === 'HTML' && htmlConfig && htmlConfig.htmlSelector) {
            try {
                articles = await fetchHtmlList(targetUrl, htmlConfig.htmlSelector, feed.id);
            } catch (e) {
                console.warn(`[RSS] Scrape failed for ${targetUrl}`, e);
                return [];
            }
        }

        // If articles were fetched via HTML scraping, return them
        if (mode === 'HTML' && articles.length > 0) {
            return articles;
        }

        // --- Mode: Standard RSS ---
        const text = await fetchProxyText(targetUrl);

        if (!text) {
            if (page > 1) return []; // Stop pagination smoothly
            throw new Error(`Failed to fetch RSS feed from ${targetUrl}`);
        }

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");

        const parseError = xmlDoc.querySelector("parsererror");
        if (parseError) {
            // Fallback for Page > 1 if RSS fails
            if (page > 1) {
                try {
                    return await fetchHtmlList(targetUrl, 'h2 a, h3 a, .entry-title a');
                } catch (e) {
                    return [];
                }
            }
            throw new Error("XML Parsing failed.");
        }

        let items = Array.from(xmlDoc.querySelectorAll("item"));
        if (items.length === 0) {
            items = Array.from(xmlDoc.querySelectorAll("entry"));
        }

        return items.map((item) => {
            const title = item.querySelector("title")?.textContent || "Untitled";

            let link = item.querySelector("link")?.textContent || "";
            if (!link) {
                const atomLink = item.querySelector("link[rel='alternate']");
                link = atomLink?.getAttribute("href") || item.querySelector("link")?.getAttribute("href") || "";
            }

            const pubDate = item.querySelector("pubDate")?.textContent ||
                item.querySelector("published")?.textContent ||
                item.querySelector("updated")?.textContent ||
                new Date().toISOString();

            const guid = item.querySelector("guid")?.textContent ||
                item.querySelector("id")?.textContent ||
                link;

            const author = item.querySelector("author > name")?.textContent ||
                item.querySelector("author")?.textContent ||
                item.querySelector("dc\\:creator")?.textContent ||
                item.querySelector("creator")?.textContent ||
                "";

            const contentEncoded = item.getElementsByTagNameNS("*", "encoded")[0]?.textContent;
            const contentTag = item.querySelector("content")?.textContent;
            const description = item.querySelector("description")?.textContent;
            const summary = item.querySelector("summary")?.textContent;

            // Prioritize full content
            let rawContent = contentEncoded || contentTag || description || summary || "";

            // Process content immediately to fix lazy images in the feed itself
            const processedContent = processHtmlContent(rawContent, link || feed.url);

            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = processedContent;
            const plainText = tempDiv.textContent || "";
            const contentSnippet = plainText.substring(0, 150) + (plainText.length > 150 ? "..." : "");

            return {
                title,
                link,
                pubDate,
                guid,
                author,
                content: processedContent,
                contentSnippet,
                feedId: feed.id
            };
        });
    } catch (error) {
        if (page > 1) {
            return [];
        }
        console.error("Error fetching RSS feed:", error);
        throw error;
    }
};

export const fetchWebPage = async (url: string): Promise<string | null> => {
    const html = await fetchProxyText(url);
    if (!html) return null;

    const baseTag = `<base href="${url}" target="_blank">`;
    if (html.includes('<head>')) {
        return html.replace('<head>', `<head>${baseTag}`);
    } else {
        return `${baseTag}${html}`;
    }
};

export const fetchFullArticle = async (url: string): Promise<string | null> => {
    try {
        const html = await fetchProxyText(url);
        if (!html) return null;

        // Process the entire HTML first to fix lazy images before extracting content
        // This ensures that when we grab innerHTML later, the images are already fixed
        const processedHtml = processHtmlContent(html, url);

        const parser = new DOMParser();
        const doc = parser.parseFromString(processedHtml, 'text/html');

        const junkSelectors = [
            'script', 'style', 'iframe', 'nav', 'header', 'footer',
            '.ads', '.advertisement', '.social-share', '.comments', '#comments',
            '.sidebar', '.related-posts', '.newsletter-signup', '.cookie-consent',
            'button', 'form', '.layout-header', '.layout-footer', '.cb-modal',
            '.is-hidden', '.visually-hidden', '#ad_container', 'aside'
        ];
        junkSelectors.forEach(sel => {
            doc.querySelectorAll(sel).forEach(el => el.remove());
        });

        const article = doc.querySelector('article');
        if (article) return article.innerHTML;

        const contentClasses = [
            '.post-content',
            '.article-content',
            '.entry-content',
            '.c-entry-content',
            '.duet--article--text-component',
            '.rich_media_content',
            '.main-content',
            '#content',
            '.article-body',
            '.story-body',
            '.topic-content',
            '.post_content',
            '#art_content',
            '.article-cont',
            '.content',
            '.article-detail', // ITHome often uses this
            '.news_content' // Solidot
        ];

        for (const cls of contentClasses) {
            const elements = doc.querySelectorAll(cls);
            if (elements.length > 0) {
                if (elements.length > 1) {
                    return Array.from(elements).map(el => el.innerHTML).join('<br/>');
                }
                return elements[0].innerHTML;
            }
        }

        // Heuristic Fallback
        let bestCandidate: Element | null = null;
        let maxParagraphs = 0;

        doc.querySelectorAll('div, section, main').forEach(container => {
            // Simple heuristic: container with most <p> tags
            const pCount = container.querySelectorAll('p').length;
            if (pCount > 3 && pCount > maxParagraphs) {
                maxParagraphs = pCount;
                bestCandidate = container;
            }
        });

        if (bestCandidate) {
            return (bestCandidate as Element).innerHTML;
        }

        return null;
    } catch (e) {
        console.error("Failed to fetch full article", e);
        return null;
    }
};