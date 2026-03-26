const { GoogleGenAI } = require("@google/genai");
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateHookAndCaption(topic) {
  try {
    const prompt = `Create an Instagram Reel hook and caption for the topic: "${topic}". 
    Return the response strictly in JSON format with exactly:
    - "hook": a catchy 10-word maximum hook.
    - "caption": a 2-sentence engaging caption.
    - "hashtags": a string of 5 relevant hashtags.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const text = response.text;
    
    // Attempt to parse JSON from the response text
    // Sometimes Gemini wraps JSON in code blocks
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("AI Service Error:", error);
    throw new Error("Failed to generate hook and caption via AI.");
  }
}

module.exports = { generateHookAndCaption };
