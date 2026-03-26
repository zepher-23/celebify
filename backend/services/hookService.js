const { db, admin } = require('../config/firebase');
const { generateViralHooks } = require('./aiService');
const logger = require('./loggerService');

async function replenishHooksIfLow() {
  try {
    const snapshot = await db.collection('hooks')
      .where('used', '==', false)
      .get();

    logger.info('HookService', `Currently ${snapshot.size} unused hooks available.`);

    if (snapshot.size <= 3) {
      logger.warn('HookService', `Inventory critical. Triggering auto-replenish of 10 hooks...`);
      const newHooks = await generateViralHooks();
      
      const batch = db.batch();
      const createdList = [];
      
      for (const text of newHooks) {
        const docRef = db.collection('hooks').doc();
        const payload = {
          text,
          used: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        batch.set(docRef, payload);
        createdList.push({ id: docRef.id, ...payload });
      }
      
      await batch.commit();
      logger.info('HookService', `Successfully replenished ${newHooks.length} viral hooks.`);
      return createdList;
    }
    return [];
  } catch (err) {
    logger.error('HookService', 'Failed to replenish hook bank', err);
    throw err;
  }
}

async function getAndConsumeHook() {
  try {
    await replenishHooksIfLow();

    const snapshot = await db.collection('hooks')
      .where('used', '==', false)
      .get();

    if (snapshot.empty) {
       throw new Error('No hooks available and auto-replenish failed.');
    }

    const docs = snapshot.docs.sort((a, b) => {
      const timeA = a.data().createdAt?.toMillis() || 0;
      const timeB = b.data().createdAt?.toMillis() || 0;
      return timeA - timeB;
    });

    const hookDoc = docs[0];
    const hookData = hookDoc.data();

    await db.collection('hooks').doc(hookDoc.id).update({ used: true });

    logger.info('HookService', `Consumed hook: "${hookData.text.substring(0,30)}..."`);
    return hookData.text;
  } catch (err) {
    logger.error('HookService', 'Failed to consume hook from Hook Bank', err);
    throw err;
  }
}

module.exports = { replenishHooksIfLow, getAndConsumeHook };
