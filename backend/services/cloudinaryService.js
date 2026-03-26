const cloudinary = require('../config/cloudinary');
const fs = require('fs-extra');
const path = require('path');

async function uploadVideoToCloudinary(localFilePath) {
  try {
    const result = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "video",
      folder: "instagram_reels",
    });

    // Delete the temporary local file
    await fs.remove(localFilePath);
    
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary Service Error:", error);
    throw new Error("Failed to upload video to Cloudinary.");
  }
}

module.exports = { uploadVideoToCloudinary };
