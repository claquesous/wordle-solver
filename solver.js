import fs from "fs";

import { createNode, processNode } from './node.js';
import { processedCache } from './cache.js';

let queue = [];

if (!fs.existsSync('./solve')) {
  fs.mkdirSync('./solve');
}

const doBfs = () => ['bfs','drain'].includes(process.env.MODE);

async function drainQueue() {
  const initialLength = queue.length;
  let processedCount = 0;
  while (queue.length > 0) {
    const key = doBfs() ? queue.pop() : queue.shift();
    try {
      let cached = await processedCache.get(key);
    } catch (NotFoundError) {
      if (process.env.MODE==='drain') {
        queue.unshift(key);
      } else {
        await processNode(key, queue);
        await processedCache.put(key, true);
      }
    }
    processedCount++;
    if (processedCount%1000 === 0) {
      console.log(`Processed: ${processedCount}/${initialLength} (Now: ${queue.length})`);
      await processedCache.put("queue", queue);
    }
    if ((doBfs() && processedCount === initialLength)) {
      break;
    }
  }
  await processedCache.put("queue", queue);
  console.log("done");
  if (process.env.CLEAN && !doBfs()) {
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

