const axios = require('axios');
const logger = require('./loggerService');
require('dotenv').config();

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const IG_ACCOUNT_ID_DEFAULT = process.env.IG_ACCOUNT_ID;
const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

async function uploadToInstagram(videoUrl, captionText, igAccountId) {
  const accountId = igAccountId || IG_ACCOUNT_ID_DEFAULT;
  try {
    // Step 1: Initialize Media Upload (Container Creation)
    logger.info('Instagram', `Step 1/3: Creating media container for account ${accountId}...`);
    const mediaResponse = await axios.post(`${BASE_URL}/${accountId}/media`, {
      video_url: videoUrl,
      caption: captionText,
      media_type: 'REELS',
      access_token: ACCESS_TOKEN
    });

    const creationId = mediaResponse.data.id;
    logger.info('Instagram', `Step 1/3 complete. Container ID: ${creationId}`);

    // Step 2: Poll status until FINISHED
    let status = 'IN_PROGRESS';
    let pollCount = 0;
    while (status !== 'FINISHED') {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      pollCount++;
      const statusResponse = await axios.get(`${BASE_URL}/${creationId}`, {
        params: {
          fields: 'status_code',
          access_token: ACCESS_TOKEN
        }
      });
      status = statusResponse.data.status_code;
      logger.info('Instagram', `Step 2/3: Polling container ${creationId}... Status: ${status} (poll #${pollCount})`);
      if (status === 'ERROR') {
        logger.error('Instagram', `Container ${creationId} returned ERROR status from Meta API.`);
        throw new Error("Meta API container processing failed.");
      }
    }
    logger.info('Instagram', `Step 2/3 complete. Container ${creationId} is FINISHED.`);

    // Step 3: Publish the Media Container
    logger.info('Instagram', `Step 3/3: Publishing container ${creationId} to account ${accountId}...`);
    const publishResponse = await axios.post(`${BASE_URL}/${accountId}/media_publish`, {
      creation_id: creationId,
      access_token: ACCESS_TOKEN
    });

    logger.info('Instagram', `Step 3/3 complete. Published IG Post ID: ${publishResponse.data.id}`);
    return publishResponse.data.id; // Returns the Instagram Post ID
  } catch (error) {
    const apiErrorData = error.response?.data || error.message;
    logger.error('Instagram', `Publishing failed for account ${accountId}`, { message: error.message, apiResponse: apiErrorData });
    throw new Error("Failed to upload/publish to Instagram.");
  }
}

module.exports = { uploadToInstagram };

