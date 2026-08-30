import { test } from "node:test";
import assert from "node:assert/strict";
import { isLiveFilmingTaskId, shouldRefundAfterFilmingFailure } from "./filming-charge";

test("mock filming task ids still refund the customer", async () => {
  assert.equal(isLiveFilmingTaskId("mock-video-abc"), false);
  assert.equal(isLiveFilmingTaskId(null), false);
  const refund = await shouldRefundAfterFilmingFailure(
    {
      async submit() {
        throw new Error("unused");
      },
      async getStatus() {
        return { id: "mock-video-abc", status: "complete" };
      },
      async getResult() {
        throw new Error("unused");
      },
    },
    "mock-video-abc",
  );
  assert.equal(refund, true);
});

test("live filming that completed or is still processing keeps the Ad Credit", async () => {
  assert.equal(isLiveFilmingTaskId("task_01a053c9f4ae7049b057a41309c1e02c"), true);
  const complete = await shouldRefundAfterFilmingFailure(
    {
      async submit() {
        throw new Error("unused");
      },
      async getStatus() {
        return { id: "task_01a053c9f4ae7049b057a41309c1e02c", status: "complete" };
      },
      async getResult() {
        throw new Error("unused");
      },
    },
    "task_01a053c9f4ae7049b057a41309c1e02c",
  );
  assert.equal(complete, false);
  const processing = await shouldRefundAfterFilmingFailure(
    {
      async submit() {
        throw new Error("unused");
      },
      async getStatus() {
        return { id: "task_01a053c9f4ae7049b057a41309c1e02c", status: "processing" };
      },
      async getResult() {
        throw new Error("unused");
      },
    },
    "task_01a053c9f4ae7049b057a41309c1e02c",
  );
  assert.equal(processing, false);
});

test("live filming that the provider failed refunds the customer", async () => {
  const refund = await shouldRefundAfterFilmingFailure(
    {
      async submit() {
        throw new Error("unused");
      },
      async getStatus() {
        return { id: "task_01failed", status: "failed" };
      },
      async getResult() {
        throw new Error("unused");
      },
    },
    "task_01failed",
  );
  assert.equal(refund, true);
});
