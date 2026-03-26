const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();

const logStep = (step, videoId) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Video: ${videoId}] [Step: ${step}]`);
};

async function generateAndDownloadReel(hookText, videoId) {
  let browser;
  let context;
  let page;
  
  try {
    logStep("Launching browser...", videoId);
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();

    logStep("Navigating to CelebifyAI (Direct/Free Access)...", videoId);
    // Since login was removed per previous instruction, we head straight to clippers
    await page.goto('https://celebifyai.com/dashboard/clippers', { waitUntil: 'networkidle', timeout: 60000 });

    logStep("Injecting hook text into generator...", videoId);
    // Selector for the text input/textarea
    await page.fill('textarea', hookText); 

    logStep("Triggering video generation (Clicking 'Generate')...", videoId);
    await page.click('button:has-text("Generate")');

    logStep("Waiting for download event to trigger...", videoId);
    const downloadPromise = page.waitForEvent('download', { timeout: 300000 }); // 5 min timeout for rendering

    // Handle any rendering/generation delay before the download actually starts
    // In a real scenario, you might need to check for a "Ready" state or progress bar
    const download = await downloadPromise;

    logStep("Download triggered. Saving file to local temp directory...", videoId);
    const tempDir = path.join(__dirname, '../temp');
    await fs.ensureDir(tempDir);
    const filePath = path.join(tempDir, `${videoId}.mp4`);
    
    await download.saveAs(filePath);
    logStep("File successfully saved: " + filePath, videoId);

    return filePath;

  } catch (error) {
    const timestamp = Date.now();
    const screenshotName = `error-${videoId}-${timestamp}.png`;
    const screenshotPath = path.join(__dirname, '../public/errors', screenshotName);
    
    console.error(`[${new Date().toISOString()}] ERROR during ${videoId} generation: ${error.message}`);
    
    if (page) {
      try {
        await fs.ensureDir(path.join(__dirname, '../public/errors'));
        await page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`[CRASH CAPTURED] Screenshot saved to: ${screenshotPath}`);
      } catch (screenshotError) {
        console.error("Failed to capture crash screenshot:", screenshotError.message);
      }
    }

    // Re-throw the error so the controller/database can mark as Failed
    throw error;

  } finally {
    if (browser) {
      logStep("Closing browser server...", videoId);
      await browser.close();
    }
  }
}

module.exports = { generateAndDownloadReel };
