const { GoogleGenAI } = require("@google/genai");
const path = require('path');
const logger = require('./loggerService');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateViralHooks() {
  try {
    const prompt = `You are a viral hook generator for a short-form video automation channel.
Theme: Promoting AI content generation to make money online, defining the young hustle culture.
Video Context: The video shows a split screen. Bottom half: a young adult doing some dynamic action. Top half: an AI-generated attractive human character (a "better" clone) mimicking the exact same action to farm more views and cash.
Icons in the center of the video show: Celebify + [Video Platform] = Lots of Cash.

Generate exactly 10 viral hooks that grab attention within seconds.

Examples of the style I want:
"Too ugly for TikTok? Rent a better face."
"The top video is fake. The money is real."
"My AI clone makes more than your 9-to-5."
"POV: You realized pretty privilege is for sale"
"Pretty privilege is a scam. I just bought a better one."
"Your favorite creators are faking it. Here’s how."

RULES:
1. Return ONLY the 10 hooks.
2. Absolutely no intro, no outro, no numbers like "1.", no bullet points, no quotes surrounding the hook itself.
3. Separate each hook by a single newline character.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    const text = response.text;

    // Clean up response: remove empty lines, numbers, quotes
    const hooks = text.split('\n')
      .map(h => h.trim().replace(/^[\d\.\-\*\"\']+/g, '').replace(/[\"\']$/g, '').trim())
      .filter(h => h.length > 5);

    logger.info("aiService", `Successfully generated ${hooks.slice(0,10).length} viral hooks.`);
    return hooks.slice(0, 10);
  } catch (error) {
    logger.error("aiService", "Failed to generate viral hooks via AI", error);
    throw new Error("Failed to generate viral hooks via AI.");
  }
}

async function generateCaptionForHook(hook) {
  try {
    const prompt = `Write an engaging Instagram Reel caption (2 sentences) and 5 relevant hashtags for a short-form video about making money with AI. The video has this exact text hook on screen: "${hook}". 
    Return the response strictly in JSON format with exactly:
    - "caption": the 2-sentence engaging caption.
    - "hashtags": a string of 5 relevant hashtags (e.g. #sidehustle #ai).`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    const text = response.text;
    const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
    logger.info("aiService", `Successfully generated caption for hook: "${hook.substring(0,30)}..."`);
    return JSON.parse(jsonStr);
  } catch (error) {
    logger.error("aiService", `Failed to generate caption for Hook: "${hook}"`, error);
    return {
      caption: "Discover how AI cloning is changing the game for creators. Stop doing everything yourself.",
      hashtags: "#ai #hustle #sidehustle #creatoreconomy #celebify"
    };
  }
}

module.exports = { generateViralHooks, generateCaptionForHook };
