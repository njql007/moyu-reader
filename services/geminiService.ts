import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || "";
const ai = new GoogleGenAI({ apiKey });

export const cleanContentWithAI = async (htmlContent: string): Promise<string> => {
  if (!apiKey) return "API Key not configured. Cannot use AI features.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `
        You are an advanced "Reader Mode" engine. 
        Your task is to take the provided raw HTML/Text content from an RSS feed or webpage and convert it into clean, readable Markdown.
        
        Rules:
        1. Remove all ads, "related posts", social media sharing buttons, and boilerplate navigation.
        2. Keep the core article text intact.
        3. Format nicely with Markdown headers, bold text, and lists.
        4. If there are images (<img> tags in the source), try to preserve the image links in Markdown format ![Image](url) if they seem relevant to the article content.
        5. If the content seems truncated (e.g., ends with "Read more..."), explicitly mention at the end: "> *[Content truncated in source]*".
        
        Input Content:
        ${htmlContent.substring(0, 30000)} 
      `, // Increased limit for full page content
    });
    
    return response.text || "Failed to generate clean content.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to AI service. Please try viewing raw mode.";
  }
};

export const summarizeContentWithAI = async (htmlContent: string): Promise<string> => {
    if (!apiKey) return "API Key missing.";

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize this article in 3 bullet points, using a casual, slightly cynical "internet native" tone (tech enthusiast vibe). Content: ${htmlContent.substring(0, 15000)}`
        });
        return response.text || "Could not summarize.";
    } catch (e) {
        return "Summary failed.";
    }
}