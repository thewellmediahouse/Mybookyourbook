// @ts-ignore `.open-next/worker.js` is generated at OpenNext build time
import { default as handler } from "./.open-next/worker.js";
import { handleQueueBatch } from "./lib/notifications/queue";
export { CommercialProductionWorkflow } from "./lib/workflows/commercial-production";
export { MediaProcessingService } from "./lib/containers/media-processing";

export default {
  fetch: handler.fetch,
  async queue(batch: MessageBatch<unknown>, env: CloudflareEnv) {
    await handleQueueBatch(batch, env);
  },
};

// The re-export is only required if the app uses the DO Queue and DO Tag Cache.
// @ts-ignore `.open-next/worker.js` is generated at OpenNext build time
export { DOQueueHandler, DOShardedTagCache } from "./.open-next/worker.js";
