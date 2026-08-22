import { test } from "node:test";
import assert from "node:assert/strict";
import { newId } from "@/lib/id";
import {
  assertIdentityObjectKey,
  assertLibraryObjectKey,
  assertLogoObjectKey,
  assertProductionObjectKey,
  assertProjectReferenceObjectKey,
  assertWorkspaceObjectKey,
  identityObjectKey,
  libraryObjectKey,
  logoObjectKey,
  projectReferenceObjectKey,
  ObjectKeyError,
} from "./keys";

test("logo keys stay under the workspace and brand prefix", () => {
  const workspaceId = newId();
  const businessId = newId();
  const objectId = newId();
  const key = logoObjectKey(workspaceId, businessId, objectId);
  assert.equal(key, `workspaces/${workspaceId}/brands/${businessId}/logo/${objectId}`);
  assert.doesNotThrow(() => assertLogoObjectKey(key, workspaceId, businessId));
});

test("object keys cannot target another workspace", () => {
  const workspaceA = newId();
  const workspaceB = newId();
  const businessId = newId();
  const key = logoObjectKey(workspaceB, businessId, newId());
  assert.throws(
    () => assertWorkspaceObjectKey(key, workspaceA),
    (error: unknown) => error instanceof ObjectKeyError,
  );
  assert.throws(
    () => assertLogoObjectKey(key, workspaceA, businessId),
    (error: unknown) => error instanceof ObjectKeyError,
  );
});

test("filenames and path tricks are rejected", () => {
  const workspaceId = newId();
  assert.throws(() => assertWorkspaceObjectKey(`workspaces/${workspaceId}/../secret`, workspaceId));
  assert.throws(() => assertWorkspaceObjectKey("/workspaces/x", workspaceId));
  assert.throws(() => logoObjectKey(workspaceId, "logo.png", newId()));
});

test("identity keys stay under the workspace and user prefix", () => {
  const workspaceId = newId();
  const userId = newId();
  const objectId = newId();
  const key = identityObjectKey(workspaceId, userId, "IDENTITY_FRONT", objectId);
  assert.equal(
    key,
    `workspaces/${workspaceId}/users/${userId}/identity/front/${objectId}`,
  );
  assert.doesNotThrow(() => assertIdentityObjectKey(key, workspaceId, userId, "IDENTITY_FRONT"));
});

test("identity keys cannot target another user or workspace", () => {
  const workspaceA = newId();
  const workspaceB = newId();
  const userA = newId();
  const userB = newId();
  const key = identityObjectKey(workspaceA, userA, "IDENTITY_VIDEO", newId());
  assert.throws(
    () => assertIdentityObjectKey(key, workspaceB, userA, "IDENTITY_VIDEO"),
    (error: unknown) => error instanceof ObjectKeyError,
  );
  assert.throws(
    () => assertIdentityObjectKey(key, workspaceA, userB, "IDENTITY_VIDEO"),
    (error: unknown) => error instanceof ObjectKeyError,
  );
  assert.throws(
    () => assertIdentityObjectKey(key, workspaceA, userA, "IDENTITY_FRONT"),
    (error: unknown) => error instanceof ObjectKeyError,
  );
});

test("library keys stay under the workspace and brand assets prefix", () => {
  const workspaceId = newId();
  const businessId = newId();
  const objectId = newId();
  const key = libraryObjectKey(workspaceId, businessId, "product", objectId);
  assert.equal(
    key,
    `workspaces/${workspaceId}/brands/${businessId}/assets/product/${objectId}`,
  );
  assert.doesNotThrow(() => assertLibraryObjectKey(key, workspaceId, businessId, "product"));
});

test("library keys cannot target another workspace or identity path", () => {
  const workspaceA = newId();
  const workspaceB = newId();
  const businessId = newId();
  const userId = newId();
  const libraryKey = libraryObjectKey(workspaceB, businessId, "campaign", newId());
  assert.throws(
    () => assertLibraryObjectKey(libraryKey, workspaceA, businessId, "campaign"),
    (error: unknown) => error instanceof ObjectKeyError,
  );
  const identityKey = identityObjectKey(workspaceA, userId, "IDENTITY_FRONT", newId());
  assert.throws(
    () => assertLibraryObjectKey(identityKey, workspaceA, businessId, "product"),
    (error: unknown) => error instanceof ObjectKeyError,
  );
});

test("project reference keys stay under the commercial prefix", () => {
  const workspaceId = newId();
  const projectId = newId();
  const key = projectReferenceObjectKey(workspaceId, projectId, newId());
  assert.match(key, new RegExp(`workspaces/${workspaceId}/projects/${projectId}/references/`));
  assert.doesNotThrow(() => assertProjectReferenceObjectKey(key, workspaceId, projectId));
  assert.throws(() => assertProjectReferenceObjectKey(key, newId(), projectId));
});

test("production object keys reject public URLs", () => {
  const workspaceId = newId();
  const projectId = newId();
  assert.throws(
    () => assertProductionObjectKey("https://cdn.example.com/ad.mp4", workspaceId, projectId, "final"),
    ObjectKeyError,
  );
  assert.throws(
    () => assertWorkspaceObjectKey("https://cdn.example.com/ad.mp4", workspaceId),
    ObjectKeyError,
  );
});
