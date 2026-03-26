const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs-extra');
const logger = require('./loggerService');
require('dotenv').config();

const logStep = (step, videoId) => {
  logger.info('Playwright', `[Video: ${videoId}] ${step}`);
};

/**
 * Selects a random option from a Radix UI Select (combobox) dropdown.
 * Strategy: Find label by text -> locate sibling combobox button -> click to open -> pick random [role="option"]
 */
async function selectRandomDropdownOption(page, labelText, videoId) {
  logStep(`Selecting random "${labelText}"...`, videoId);

  // 1. Locate the combobox trigger button by finding the label, then its parent div's button
  const container = page.locator(`label:has-text("${labelText}")`).locator('..');
  const trigger = container.locator('button[role="combobox"]');
  await trigger.waitFor({ state: 'visible', timeout: 10000 });

  // 2. Click to open the Radix popover/listbox
  await trigger.click();

  // 3. Wait for options to appear (Radix renders [role="option"] inside a portal)
  await page.waitForSelector('[role="option"]', { state: 'visible', timeout: 10000 });

  // 4. Count and pick a random option
  const options = page.locator('[role="option"]');
  const count = await options.count();

  if (count === 0) throw new Error(`No options found for: ${labelText}`);

  const randomIndex = Math.floor(Math.random() * count);
  const selectedText = await options.nth(randomIndex).textContent();
  await options.nth(randomIndex).click();

  logStep(`"${labelText}" → "${selectedText.trim()}" (${randomIndex + 1}/${count})`, videoId);
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

    // --- MOTION: Always select "Motion 1" (Motion 2 is broken on CelebifyAI) ---
    try {
      logStep('Setting Motion to "Motion 1"...', videoId);
      const motionContainer = page.locator('label:has-text("Motion")').locator('..');
      const motionTrigger = motionContainer.locator('button[role="combobox"]');
      await motionTrigger.waitFor({ state: 'visible', timeout: 10000 });
      await motionTrigger.click();
      await page.waitForSelector('[role="option"]', { state: 'visible', timeout: 10000 });
      await page.locator('[role="option"]:has-text("Motion 1")').click();
      logStep('Motion locked to "Motion 1"', videoId);
    } catch (err) {
      logStep(`Warning: Could not set Motion (using default): ${err.message}`, videoId);
    }

    // --- RANDOMIZATION PHASE (remaining dropdowns) ---
    const dropdownLabels = ['Background', 'Man Avatar', 'Woman Avatar'];

    for (const label of dropdownLabels) {
      try {
        await selectRandomDropdownOption(page, label, videoId);
      } catch (err) {
        logStep(`Warning: Could not select "${label}" (using default): ${err.message}`, videoId);
      }
    }

    logStep("Injecting hook text into Text Overlay...", videoId);
    await page.fill('textarea[placeholder="Enter the text overlay for the reel..."]', hookText); 

    logStep("Clicking 'Generate Reel' (300s timeout)...", videoId);
    await page.click('button:has-text("Generate Reel")');

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
    
    logger.error('Playwright', `[Video: ${videoId}] CRASHED during reel generation/extraction`, error);
    
    if (page) {
      try {
        await fs.ensureDir(screenshotDir);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        logger.warn('Playwright', `[Video: ${videoId}] Crash screenshot saved: ${screenshotPath}`);
      } catch (err) {
        logger.error('Playwright', `[Video: ${videoId}] Failed to capture crash screenshot`, err);
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
