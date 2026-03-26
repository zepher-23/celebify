const { db, admin } = require('../config/firebase');
const { generateHookAndCaption } = require('./aiService');
const { generateAndFetchReelUrl } = require('./playwrightService');
const { uploadToInstagram } = require('./instagramService');
const logger = require('./loggerService');

class SchedulerService {
  constructor() {
    this.intervalId = null;
    this.runningJobs = new Set();
  }

  async init() {
    logger.info('Scheduler', 'Initializing local smart scheduler (IST)...');
    this.evaluateSchedules();
    this.intervalId = setInterval(() => this.evaluateSchedules(), 5 * 60 * 1000);
  }

  async evaluateSchedules() {
    try {
      logger.info('Scheduler', `Heartbeat: Evaluating schedules at ${new Date().toLocaleString("en-US", {timeZone: 'Asia/Kolkata'})} IST`);
      const snapshot = await db.collection('schedules').where('active', '==', true).get();
      
      for (const doc of snapshot.docs) {
        await this.checkSchedule(doc.id, doc.data());
      }
    } catch (error) {
      logger.error('Scheduler', 'Evaluation loop failed', error);
    }
  }

  getTargetTimesIST(runsPerDay, istDateString) {
    const targets = [];
    if (runsPerDay === 1) {
      // Single run at 1:30 PM (13:30) IST
      targets.push(new Date(`${istDateString} 13:30:00 GMT+0530`));
    } else {
      // Spread across 15 hours (06:00 to 21:00)
      const startTimeMs = new Date(`${istDateString} 06:00:00 GMT+0530`).getTime();
      const intervalMs = (15 * 60 * 60 * 1000) / (runsPerDay - 1);
      
      for (let i = 0; i < runsPerDay; i++) {
        targets.push(new Date(startTimeMs + (i * intervalMs)));
      }
    }
    return targets;
  }

  getDynamicTimeline(runsPerDay, completedToday, istDateString, nowLocal) {
    const baseTargets = this.getTargetTimesIST(runsPerDay, istDateString);
    let intervalMs = runsPerDay === 1 ? (3 * 60 * 60 * 1000) : ((15 * 60 * 60 * 1000) / (runsPerDay - 1));

    const finalTargets = [];
    for (let i = 0; i < completedToday; i++) {
       finalTargets.push(baseTargets[i]);
    }

    let endOfDayAppendMs = baseTargets[baseTargets.length - 1].getTime();
    
    for (let i = completedToday; i < runsPerDay; i++) {
      const targetTimeMs = baseTargets[i].getTime();
      
      if (nowLocal.getTime() > targetTimeMs) {
         const nextTargetTimeMs = (i + 1 < runsPerDay) ? baseTargets[i+1].getTime() : null;
         const distToMissed = Math.abs(nowLocal.getTime() - targetTimeMs);
         const distToNext = nextTargetTimeMs ? Math.abs(nextTargetTimeMs - nowLocal.getTime()) : Infinity;
         
         if (distToNext < distToMissed) {
             endOfDayAppendMs += intervalMs;
             finalTargets.push(new Date(endOfDayAppendMs));
         } else {
             finalTargets.push(baseTargets[i]);
         }
      } else {
         finalTargets.push(baseTargets[i]);
      }
    }

    finalTargets.sort((a, b) => a.getTime() - b.getTime());
    return finalTargets;
  }

  async checkSchedule(scheduleId, data) {
    if (this.runningJobs.has(scheduleId)) return; 

    const { igAccountId, runsPerDay, topic } = data;
    const nowLocal = new Date();
    const istDateString = nowLocal.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata' });

    const startOfTodayISTUTC = new Date(`${istDateString} 00:00:00 GMT+0530`);
    const endOfTodayISTUTC = new Date(`${istDateString} 23:59:59 GMT+0530`);

    // Fetch videos manually by day
    const rawVideosSnapshot = await db.collection('videos')
      .where('scheduleId', '==', scheduleId)
      .get();

    const videosToday = rawVideosSnapshot.docs.filter(doc => {
       const vData = doc.data();
       if (vData.isScheduledRun !== true || !vData.createdAt) return false;
       const ms = vData.createdAt.toMillis();
       return ms >= startOfTodayISTUTC.getTime() && ms <= endOfTodayISTUTC.getTime();
    });

    const completedToday = videosToday.length;

    // Build the smart dynamic timeline
    const targets = this.getDynamicTimeline(runsPerDay, completedToday, istDateString, nowLocal);
    const targetsPassed = targets.filter(time => nowLocal.getTime() >= time.getTime()).length;

    if (completedToday < targetsPassed) {
      logger.info('Scheduler', `Job ${scheduleId} behind! (${completedToday}/${targetsPassed} passed targets). Triggering run...`);
      this.runningJobs.add(scheduleId);
      
      this.executeAutomation(igAccountId, topic, scheduleId).finally(() => {
        this.runningJobs.delete(scheduleId);
      });
    }
  }

  async executeAutomation(igAccountId, topic, scheduleId) {
    let videoId;
    try {
      logger.info('Scheduler', `Starting automation pipeline for account: ${igAccountId}, schedule: ${scheduleId}`);
      
      const videoRef = await db.collection('videos').add({
        hookText: '',
        status: 'Generating',
        videoUrl: null,
        instagramUrl: null,
        errorMessage: null,
        scheduleId: scheduleId,
        isScheduledRun: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      videoId = videoRef.id;
      logger.info('Scheduler', `[Video: ${videoId}] Created video document in Firestore.`);

      logger.info('Scheduler', `[Video: ${videoId}] Step 1/4: Generating hook & caption via AI...`);
      const aiData = await generateHookAndCaption(topic || "trending facts");
      const hook = aiData.hook;
      const caption = aiData.caption;
      const hashtags = aiData.hashtags;
      logger.info('Scheduler', `[Video: ${videoId}] Step 1/4 complete. Hook: "${hook.substring(0,40)}..."`);

      await videoRef.update({ hookText: hook });

      logger.info('Scheduler', `[Video: ${videoId}] Step 2/4: Generating reel via Playwright...`);
      const cdnVideoUrl = await generateAndFetchReelUrl(hook, videoId);
      await videoRef.update({ videoUrl: cdnVideoUrl, status: 'Uploaded_to_Cloud' });
      logger.info('Scheduler', `[Video: ${videoId}] Step 2/4 complete. CDN URL obtained.`);

      logger.info('Scheduler', `[Video: ${videoId}] Step 3/4: Publishing to Instagram...`);
      const instagramPostId = await uploadToInstagram(cdnVideoUrl, `${caption}\n\n${hashtags}`, igAccountId);
      await videoRef.update({ 
        status: 'Published_to_IG',
        instagramUrl: `https://www.instagram.com/reels/${instagramPostId}/`
      });
      logger.info('Scheduler', `[Video: ${videoId}] Step 3/4 complete. IG Post: ${instagramPostId}`);

      logger.info('Scheduler', `[Video: ${videoId}] ✅ Step 4/4: Automation pipeline COMPLETE.`);
    } catch (error) {
      logger.error('Scheduler', `[Video: ${videoId || 'unknown'}] ❌ Automation pipeline FAILED`, error);
      if (videoId) {
        try {
          await db.collection('videos').doc(videoId).update({ status: 'Failed', errorMessage: error.message });
        } catch (dbErr) {
          logger.error('Scheduler', `[Video: ${videoId}] Failed to write error status to Firestore`, dbErr);
        }
      }
    }
  }

  async addSchedule(igAccountId, runsPerDay, topic) {
    // Overwrite (deactivate) any existing schedules for this specific account
    const existingSnap = await db.collection('schedules')
      .where('igAccountId', '==', igAccountId)
      .where('active', '==', true)
      .get();
      
    const batch = db.batch();
    existingSnap.forEach(doc => {
      batch.update(doc.ref, { active: false });
    });

    const newDocRef = db.collection('schedules').doc();
    const newSchedule = {
      igAccountId,
      runsPerDay: parseInt(runsPerDay, 10),
      topic: topic || '',
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    batch.set(newDocRef, newSchedule);
    await batch.commit();

    // Execute heartbeat immediately to see if it should run
    this.checkSchedule(newDocRef.id, newSchedule);
    return newDocRef.id;
  }
}

const schedulerInstance = new SchedulerService();
module.exports = schedulerInstance;
