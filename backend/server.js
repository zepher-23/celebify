const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { db, admin } = require('./config/firebase');
const { generateHookAndCaption } = require('./services/aiService');
const { generateAndDownloadReel } = require('./services/playwrightService');
const { uploadVideoToCloudinary } = require('./services/cloudinaryService');
const { uploadToInstagram } = require('./services/instagramService');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// POST /api/videos/generate
app.post('/api/videos/generate', async (req, res) => {
  const { customHook, topic, igAccountId } = req.body;

  try {
    // 1. Create Firestore document
    const videoRef = await db.collection('videos').add({
      hookText: customHook || '',
      status: 'Pending',
      cloudinaryUrl: null,
      instagramUrl: null,
      errorMessage: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const videoId = videoRef.id;

    // 2. Return 202 Accepted
    res.status(202).json({ id: videoId, message: "Video generation queued successfully." });

    // 3. Background Process (Async)
    (async () => {
      try {
        let hook = customHook;
        let caption = "Check out this amazing short!";
        let hashtags = "#reel #ai #trending";

        // Step A: AI Generation (if no custom hook provided)
        if (!hook) {
          await videoRef.update({ status: 'Generating' });
          const aiData = await generateHookAndCaption(topic || "trending facts");
          hook = aiData.hook;
          caption = aiData.caption;
          hashtags = aiData.hashtags;
          await videoRef.update({ hookText: hook });
        } else {
          await videoRef.update({ status: 'Generating' });
        }

        // Step B: Playwright Video Generation
        const localPath = await generateAndDownloadReel(hook, videoId);

        // Step C: Upload to Cloudinary
        const cloudinaryUrl = await uploadVideoToCloudinary(localPath);
        await videoRef.update({ 
          status: 'Uploaded_to_Cloud',
          cloudinaryUrl: cloudinaryUrl 
        });

        // Step D: Upload to Instagram
        const instagramPostId = await uploadToInstagram(cloudinaryUrl, `${caption}\n\n${hashtags}`, igAccountId);
        await videoRef.update({ 
          status: 'Published_to_IG',
          instagramUrl: `https://www.instagram.com/reels/${instagramPostId}/` // Example URL structure
        });

      } catch (err) {
        console.error(`Background processing error for ${videoId}:`, err);
        await videoRef.update({ 
          status: 'Failed', 
          errorMessage: err.message 
        });
      }
    })();

  } catch (error) {
    console.error("Queueing Error:", error);
    res.status(500).json({ error: "Failed to queue video generation." });
  }
});

// GET /api/videos
app.get('/api/videos', async (req, res) => {
  try {
    const snapshot = await db.collection('videos')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const videos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(videos);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ error: "Failed to fetch videos." });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
