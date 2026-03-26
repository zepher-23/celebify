const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const logStep = (step, videoId) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Video: ${videoId}] [Step: ${step}]`);
};

/**
 * Robust helper to select a random option from a custom React/Tailwind dropdown
 */
async function selectRandomDropdownOption(page, triggerSelector, videoId, label) {
  logStep(`Selecting random ${label}...`, videoId);
  
  // 1. Click the dropdown trigger
  await page.click(triggerSelector);
  
  // 2. Wait for the listbox/options container to appear
  // Note: We use a generic 'role="listbox"' or similar if possible, or broad class-based selectors
  const optionsSelector = '[role="option"], .select-option, li'; // Generic selectors for common dropdowns
  await page.waitForSelector(optionsSelector, { state: 'visible', timeout: 10000 });
  
  // 3. Count available options
  const options = page.locator(optionsSelector);
  const count = await options.count();
  
  if (count === 0) throw new Error(`No options found for dropdown: ${label}`);
  
  // 4. Click a random index (avoiding index 0 if it's usually a label/placeholder)
  const randomIndex = Math.floor(Math.random() * count);
  await options.nth(randomIndex).click();
  
  logStep(`${label} selected (Option ${randomIndex + 1}/${count})`, videoId);
}

async function generateAndFetchReelUrl(hookText, videoId) {
  let browser;
  let context;
  let page;
  
  try {
    logStep("Launching browser...", videoId);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();

    logStep("Navigating to CelebifyAI (Direct Access)...", videoId);
    await page.goto('https://celebifyai.com/dashboard/clippers', { waitUntil: 'networkidle', timeout: 60000 });

    // --- RANDOMIZATION PHASE ---
    // Selectors are placeholders and would be mapped to actual site elements
    const dropdowns = [
      { trigger: '#video-type-select', label: 'Video Type' },
      { trigger: '#template-select', label: 'Template' },
      { trigger: '#voice-select', label: 'Voice' },
      { trigger: '#avatar-select', label: 'Avatar' },
      { trigger: '#background-select', label: 'Background' }
    ];

    for (const d of dropdowns) {
      try {
        await selectRandomDropdownOption(page, d.trigger, videoId, d.label);
      } catch (err) {
        logStep(`Warning: Could not select random ${d.label} (Fallback to default): ${err.message}`, videoId);
      }
    }

    logStep("Injecting hook text into generator...", videoId);
    await page.fill('textarea', hookText); 

    logStep("Clicking 'Generate' to start rendering (300s timeout)...", videoId);
    await page.click('button:has-text("Generate")');

    logStep("Waiting for rendering completion (Download button visible)...", videoId);
    // Use last() to get the most recent generation's button
    const downloadBtn = page.locator('a:has-text("Download"), button:has-text("Download")').last();
    await downloadBtn.waitFor({ state: 'visible', timeout: 300000 });
    
    logStep("Rendering finished! Extracting CDN URL...", videoId);

    // Extract URL from href (if <a>) or src (if <video> is nearby)
    let videoUrl = await downloadBtn.getAttribute('href');
    
    if (!videoUrl || !videoUrl.startsWith('http')) {
      logStep("Direct link not in button, searching for nearby <video> tag...", videoId);
      videoUrl = await page.locator('video source').first().getAttribute('src') || 
                 await page.locator('video').first().getAttribute('src');
    }

    if (!videoUrl) throw new Error("Failed to extract video CDN URL from the page.");

    logStep("SUCCESS! Extracted CDN URL: " + videoUrl, videoId);
    return videoUrl;

  } catch (error) {
    const timestamp = Date.now();
    const screenshotDir = path.join(__dirname, '../public/errors');
    const screenshotPath = path.join(screenshotDir, `crash-${videoId}-${timestamp}.png`);
    
    console.error(`[CRASH] FAILED during URL extraction: ${error.message}`);
    
    if (page) {
      try {
        await fs.ensureDir(screenshotDir);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`[VITAL EVIDENCE] Screenshot captured: ${screenshotPath}`);
      } catch (err) {
        console.error("Critical: Could not take crash screenshot:", err.message);
      }
    }
    throw error;

  } finally {
    if (browser) {
      logStep("Cleaning up: Closing browser instance...", videoId);
      await browser.close();
    }
  }
}

module.exports = { generateAndFetchReelUrl };
