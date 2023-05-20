import fs from "fs";

import { createNode, processNode } from './node.js';
import { processedCache } from './cache.js';

let queue = [];

if (!fs.existsSync('./solve')) {
  fs.mkdirSync('./solve');
}

async function drainQueue() {
  const initialLength = queue.length;
  let processedCount = 0;
  while (queue.length > 0) {
    const key = process.env.MODE === 'bfs' ? queue.pop() : queue.shift();
    try {
      let cached = await processedCache.get(key);
    } catch (NotFoundError) {
      await processNode(key, queue);
      await processedCache.put(key, true);
      await processedCache.put("queue", queue);
    }
    if (process.env.MODE === 'bfs') {
      processedCount++;
      if (processedCount%1000 === 0) {
        console.log('Processed: ', processedCount, '/', initialLength);
      }
      if (processedCount === initialLength) {
        break;
      }
    }
  }
  console.log("done");
  if (process.env.CLEAN && process.env.MODE !== 'bfs') {
    await processedCache.clear(async (error) => {
      if (error) {
        console.log('processed clear error', error);
        return;
      }
      else
        console.log("cleared process queue");
    });
  }
}

processedCache.get("queue", async (error, cachedQueue) => {
  if (error) {
    queue.push(createNode({
      known: [],
      misplaced: [[],[],[],[],[]],
      missing: [],
      counts: {},
    }, 0));

    await processedCache.clear(async (error) => {
      if (error) {
        console.log('processed clear error', error);
        return;
      }
      await drainQueue();
    });
  }
  else {
    queue = cachedQueue.split(",");
    console.log("found previous queue", queue.length);
    await drainQueue();
  }
});

