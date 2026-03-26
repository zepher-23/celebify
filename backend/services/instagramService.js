const axios = require('axios');
require('dotenv').config();

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const IG_ACCOUNT_ID_DEFAULT = process.env.IG_ACCOUNT_ID;
const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

async function uploadToInstagram(cloudinaryUrl, captionText, igAccountId) {
  const accountId = igAccountId || IG_ACCOUNT_ID_DEFAULT;
  try {
    // Step 1: Initialize Media Upload (Container Creation)
    const mediaResponse = await axios.post(`${BASE_URL}/${accountId}/media`, {
      video_url: cloudinaryUrl,
      caption: captionText,
      media_type: 'REELS',
      access_token: ACCESS_TOKEN
    });

    const creationId = mediaResponse.data.id;

    // Step 2: Poll status until FINISHED
    let status = 'IN_PROGRESS';
    while (status !== 'FINISHED') {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
      const statusResponse = await axios.get(`${BASE_URL}/${creationId}`, {
        params: {
          fields: 'status_code',
          access_token: ACCESS_TOKEN
        }
      });
      status = statusResponse.data.status_code;
      if (status === 'ERROR') throw new Error("Meta API container processing failed.");
    }

    // Step 3: Publish the Media Container
    const publishResponse = await axios.post(`${BASE_URL}/${accountId}/media_publish`, {
      creation_id: creationId,
      access_token: ACCESS_TOKEN
    });

    return publishResponse.data.id; // Returns the Instagram Post ID
  } catch (error) {
    console.error("Instagram Service Error:", error.response?.data || error.message);
    throw new Error("Failed to upload/publish to Instagram.");
  }
}

module.exports = { uploadToInstagram };
