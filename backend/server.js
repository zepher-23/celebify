const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { db, admin } = require('./config/firebase');
const logger = require('./services/loggerService');

const { generateCaptionForHook } = require('./services/aiService');
const { getAndConsumeHook, replenishHooksIfLow } = require('./services/hookService');
const { generateAndFetchReelUrl } = require('./services/playwrightService');
const { uploadToInstagram } = require('./services/instagramService');
const schedulerService = require('./services/schedulerService');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// POST /api/videos/generate
app.post('/api/videos/generate', async (req, res) => {
  const { customHook, topic, igAccountId, isScheduled, runsPerDay } = req.body;

  try {
    if (isScheduled && runsPerDay) {
      const scheduleId = await schedulerService.addSchedule(igAccountId, runsPerDay, topic);
      return res.status(201).json({ 
        message: `Successfully scheduled automation ${runsPerDay}x per day.`,
        scheduleId: scheduleId
      });
    }

    const videoRef = await db.collection('videos').add({
      hookText: customHook || '',
      status: 'Pending',
      videoUrl: null,
      instagramUrl: null,
      errorMessage: null,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const videoId = videoRef.id;
    res.status(202).json({ id: videoId, message: "Video generation queued successfully." });

    (async () => {
      try {
        let hook = customHook;
        let caption = "Check out this amazing short!";
        let hashtags = "#reel #ai #trending";

        if (!hook) {
          await videoRef.update({ status: 'Drawing from Hook Bank...' });
          
          try {
            hook = await getAndConsumeHook();
          } catch (e) {
            logger.error('API:Generate', `Hook extraction failed for video ${videoId}`, e);
            throw new Error("Could not borrow hook from the bank.");
          }

          await videoRef.update({ hookText: hook, status: 'Generating Caption...' });
          const aiData = await generateCaptionForHook(hook);
          caption = aiData.caption || caption;
          hashtags = aiData.hashtags || hashtags;
        } else {
          await videoRef.update({ status: 'Generating' });
        }

        const cdnVideoUrl = await generateAndFetchReelUrl(hook, videoId);
        await videoRef.update({ videoUrl: cdnVideoUrl });

        const instagramPostId = await uploadToInstagram(cdnVideoUrl, `${caption}\n\n${hashtags}`, igAccountId);
        await videoRef.update({ 
          status: 'Published_to_IG',
          instagramUrl: `https://www.instagram.com/reels/${instagramPostId}/`
        });

      } catch (err) {
        logger.error('API:Generate', `Background processing failed for video ${videoId}`, err);
        await videoRef.update({ status: 'Failed', errorMessage: err.message });
      }
    })();

  } catch (error) {
    logger.error('API:Generate', 'Failed to queue video generation', error);
    res.status(500).json({ error: "Failed to queue video generation." });
  }
});

// GET /api/videos
app.get('/api/videos', async (req, res) => {
  try {
    const snapshot = await db.collection('videos').orderBy('createdAt', 'desc').limit(50).get();
    const videos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(videos);
  } catch (error) {
    logger.error('API:Videos', 'Failed to fetch videos', error);
    res.status(500).json({ error: "Failed to fetch videos." });
  }
});

// Accounts API
app.get('/api/accounts', async (req, res) => {
  // Existing logic
  try {
    const snapshot = await db.collection('accounts').orderBy('createdAt', 'desc').get();
    const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const defaultIgId = process.env.IG_ACCOUNT_ID;
    if (defaultIgId && !accounts.find(acc => acc.igAccountId === defaultIgId)) {
      accounts.push({ id: 'default-env', name: 'Default Account', igAccountId: defaultIgId });
    }
    res.json(accounts);
  } catch (error) {
    logger.error('API:Accounts', 'Failed to fetch accounts', error);
    res.status(500).json({ error: "Failed to fetch accounts." });
  }
});

app.post('/api/accounts', async (req, res) => {
  try {
    const { name, igAccountId } = req.body;
    if (!name || !igAccountId) return res.status(400).json({ error: "Name and IG Account ID are required." });
    
    const newAccount = { name, igAccountId, createdAt: admin.firestore.FieldValue.serverTimestamp() };
    const docRef = await db.collection('accounts').add(newAccount);
    res.status(201).json({ id: docRef.id, ...newAccount });
  } catch (error) {
    res.status(500).json({ error: "Failed to add account." });
  }
});

app.delete('/api/accounts/:id', async (req, res) => {
  try {
    await db.collection('accounts').doc(req.params.id).delete();
    res.status(200).json({ message: "Account deleted." });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete account." });
  }
});

// --- HOOK BANK API ---
app.get('/api/hooks', async (req, res) => {
  try {
    const snapshot = await db.collection('hooks').orderBy('createdAt', 'desc').get();
    const hooks = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(hooks);
  } catch (error) {
    logger.error('API:Hooks', 'Failed to fetch hooks', error);
    res.status(500).json({ error: "Failed to fetch hooks." });
  }
});

app.post('/api/hooks/generate', async (req, res) => {
  try {
    // Force trigger generation
    const snapshot = await db.collection('hooks').where('used', '==', false).get();
    // Simulate drops below 3 to force generator logic (but bypass limit)
    const { generateViralHooks } = require('./services/aiService');
    const newHooks = await generateViralHooks();
    
    const batch = db.batch();
    const createdList = [];
    
    for (const text of newHooks) {
      const docRef = db.collection('hooks').doc();
      const payload = { text, used: false, createdAt: admin.firestore.FieldValue.serverTimestamp() };
      batch.set(docRef, payload);
      createdList.push({ id: docRef.id, ...payload });
    }
    await batch.commit();

    res.status(201).json({ message: "Successfully generated 10 viral hooks.", hooks: createdList });
  } catch (error) {
    logger.error('API:Hooks', 'Failed to generate hooks', error);
    res.status(500).json({ error: "Failed to generate hooks." });
  }
});

app.delete('/api/hooks/:id', async (req, res) => {
  try {
    await db.collection('hooks').doc(req.params.id).delete();
    res.status(200).json({ message: "Hook deleted." });
  } catch (error) {
    logger.error('API:Hooks', `Failed to delete hook ${req.params.id}`, error);
    res.status(500).json({ error: "Failed to delete hook." });
  }
});

// GET /api/schedules
app.get('/api/schedules', async (req, res) => {
  try {
    const schedulesSnap = await db.collection('schedules').where('active', '==', true).get();
    const schedules = schedulesSnap.docs.map(d => {
       const data = d.data();
       return { id: d.id, ...data, runsPerDay: Number(data.runsPerDay) };
    });

    const nowLocal = new Date();
    const istDateString = nowLocal.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
    const startOfTodayISTUTC = new Date(`${istDateString} 00:00:00 GMT+0530`);
    const endOfTodayISTUTC = new Date(`${istDateString} 23:59:59 GMT+0530`);

    // Fetch available hooks to tentatively map them to upcoming runs
    const hooksSnap = await db.collection('hooks').where('used', '==', false).get();
    let availableHooksData = hooksSnap.docs.map(doc => doc.data());
    availableHooksData.sort((a, b) => (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0));
    const availableHooks = availableHooksData.map(h => h.text);
    let hookIndex = 0;

    for (const schedule of schedules) {
      const rawVideosSnapshot = await db.collection('videos')
        .where('scheduleId', '==', schedule.id)
        .get();

      // Filter by boolean flag and createdAt in-memory to avoid Firebase composite-index requirement
      const videosToday = rawVideosSnapshot.docs.filter(doc => {
         const data = doc.data();
         if (data.isScheduledRun !== true || !data.createdAt) return false;
         const ms = data.createdAt.toMillis();
         return ms >= startOfTodayISTUTC.getTime() && ms <= endOfTodayISTUTC.getTime();
      });

      schedule.completedToday = videosToday.length;

      // Calculate the upcoming dynamic iterations remaining
      const targets = schedulerService.getDynamicTimeline(schedule.runsPerDay, schedule.completedToday, istDateString, nowLocal);
      const targetsPassed = targets.filter(time => nowLocal.getTime() >= time.getTime()).length;
      
      schedule.upcomingRuns = [];

      for (let i = schedule.completedToday; i < schedule.runsPerDay; i++) {
        let runTimeStr = "";
        
        if (i < targetsPassed) {
           runTimeStr = `Immediate (Pending proximity execution)`;
        } else {
           runTimeStr = targets[i].toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: true }) + " IST";
        }
        
        let peekHook = "Pending auto-generation...";
        if (hookIndex < availableHooks.length) {
           peekHook = availableHooks[hookIndex];
           hookIndex++;
        }
        
        schedule.upcomingRuns.push({
           id: i,
           time: runTimeStr,
           hookText: peekHook
        });
      }

      if (schedule.upcomingRuns.length === 0) {
         const tomorrow = new Date(nowLocal);
         tomorrow.setDate(tomorrow.getDate() + 1);
         const tmrwStr = tomorrow.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });
         // Tomorrow's targets remain static (we don't pass 'completedToday' or 'nowLocal' as shifts don't apply to tomorrow yet)
         const tmrwTargets = schedulerService.getTargetTimesIST(schedule.runsPerDay, tmrwStr);
         
         let peekHook = "Pending auto-generation...";
         if (hookIndex < availableHooks.length) {
             peekHook = availableHooks[hookIndex];
             hookIndex++;
         }
         
         schedule.upcomingRuns.push({
             id: 'tmrw',
             time: "Tomorrow at " + tmrwTargets[0].toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', minute: 'numeric', hour12: true }) + " IST",
             hookText: peekHook
         });
      }
    }

    res.json(schedules);
  } catch (error) {
    logger.error('API:Schedules', 'Failed to fetch schedules', error);
    res.status(500).json({ error: "Failed to fetch schedules." });
  }
});

app.listen(PORT, async () => {
  logger.info('Server', `Server running on http://localhost:${PORT}`);
  await schedulerService.init();
});
