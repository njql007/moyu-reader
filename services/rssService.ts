import { CORS_PROXY } from '../constants';
import { Article } from '../types';

// Helper to fetch raw text via proxy
const fetchProxyText = async (url: string): Promise<string | null> => {
    try {
        const targetUrl = `${CORS_PROXY}${encodeURIComponent(url)}`;
        const response = await fetch(targetUrl);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status}`);
        }
        return await response.text();
    } catch (error) {
        console.error("Proxy fetch failed:", error);
        return null;
    }
};

export const fetchRSSFeed = async (feedUrl: string): Promise<Article[]> => {
  try {
    const text = await fetchProxyText(feedUrl);
    if (!text) throw new Error("Failed to fetch RSS feed");
    
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");
    
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) {
        throw new Error("XML Parsing failed: " + parseError.textContent);
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
      
      const content = contentEncoded || contentTag || description || summary || "";
      
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = description || summary || content;
      const plainText = tempDiv.textContent || "";
      const contentSnippet = plainText.substring(0, 150) + (plainText.length > 150 ? "..." : "");

      return {
        title,
        link,
        pubDate,
        guid,
        author,
        content, // This might be short initially
        contentSnippet
      };
    });
  } catch (error) {
    console.error("Error fetching RSS feed:", error);
    throw error;
  }
};

export const fetchWebPage = async (url: string): Promise<string | null> => {
    const html = await fetchProxyText(url);
    if (!html) return null;

    // Inject <base> tag so relative links (css, images) work
    const baseTag = `<base href="${url}" target="_blank">`;
    // We also remove X-Frame-Options headers effectively because we are rendering raw HTML string
    
    // Attempt to inject after <head>, or at the start if no head
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
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Fix relative links (img src, a href) manually for extraction
    const baseUrl = new URL(url);
    
    const fixAttribute = (tagName: string, attrName: string) => {
        doc.querySelectorAll(tagName).forEach(el => {
            const val = el.getAttribute(attrName);
            if (val && !val.startsWith('http') && !val.startsWith('data:')) {
                try {
                    const absolute = new URL(val, baseUrl.origin).href;
                    el.setAttribute(attrName, absolute);
                } catch (e) {
                    // Ignore invalid URLs
                }
            }
        });
    };

    fixAttribute('img', 'src');
    fixAttribute('a', 'href');
    fixAttribute('iframe', 'src');

    // Remove clutter and interactive elements that don't work in reader view
    const junkSelectors = [
        'script', 'style', 'iframe', 'nav', 'header', 'footer', 
        '.ads', '.advertisement', '.social-share', '.comments', '#comments', 
        '.sidebar', '.related-posts', '.newsletter-signup', '.cookie-consent',
        'button', 'form'
    ];
    junkSelectors.forEach(sel => {
        doc.querySelectorAll(sel).forEach(el => el.remove());
    });

    // Content Extraction Heuristics
    
    // 1. Look for <article> tag
    const article = doc.querySelector('article');
    if (article) return article.innerHTML;

    // 2. Look for common class names for main content
    const contentClasses = [
        '.post-content', '.article-content', '.entry-content', 
        '.rich_media_content', '.main-content', '#content', 
        '.article-body', '.story-body'
    ];
    for (const cls of contentClasses) {
        const el = doc.querySelector(cls);
        if (el) return el.innerHTML;
    }

    // 3. Fallback: Find the container with the most paragraphs
    let bestCandidate: Element | null = null;
    let maxParagraphs = 0;
    
    doc.querySelectorAll('div, section, main').forEach(container => {
        const pCount = container.querySelectorAll('p').length;
        const aCount = container.querySelectorAll('a').length;
        
        if (pCount > 3 && pCount > maxParagraphs && (pCount / (aCount + 1) > 0.3)) {
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