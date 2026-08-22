export class ObjectKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ObjectKeyError";
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function workspacePrefix(workspaceId: string): string {
  return `workspaces/${workspaceId}/`;
}

export function logoObjectKey(workspaceId: string, businessId: string, objectId: string): string {
  if (!UUID_RE.test(workspaceId) || !UUID_RE.test(businessId) || !UUID_RE.test(objectId)) {
    throw new ObjectKeyError("Object keys must use generated ids, not filenames.");
  }
  return `workspaces/${workspaceId}/brands/${businessId}/logo/${objectId}`;
}

export function assertWorkspaceObjectKey(objectKey: string, workspaceId: string): void {
  if (!objectKey || objectKey.includes("..") || objectKey.startsWith("/") || objectKey.includes("//")) {
    throw new ObjectKeyError("That file location is not allowed.");
  }
  const prefix = workspacePrefix(workspaceId);
  if (!objectKey.startsWith(prefix)) {
    throw new ObjectKeyError("That file does not belong to this studio.");
  }
  const rest = objectKey.slice(prefix.length);
  if (!rest || rest.split("/").some((part) => part.length === 0)) {
    throw new ObjectKeyError("That file location is not allowed.");
  }
}

export function assertLogoObjectKey(
  objectKey: string,
  workspaceId: string,
  businessId: string,
): void {
  assertWorkspaceObjectKey(objectKey, workspaceId);
  const expectedPrefix = `workspaces/${workspaceId}/brands/${businessId}/logo/`;
  if (!objectKey.startsWith(expectedPrefix)) {
    throw new ObjectKeyError("That file does not belong to this brand.");
  }
  const objectId = objectKey.slice(expectedPrefix.length);
  if (!UUID_RE.test(objectId) || objectId.includes("/")) {
    throw new ObjectKeyError("Object keys must use generated ids, not filenames.");
  }
}

export const IDENTITY_FOLDERS = {
  IDENTITY_FRONT: "front",
  IDENTITY_LEFT: "left",
  IDENTITY_RIGHT: "right",
  IDENTITY_VIDEO: "reference-video",
} as const;

export type IdentityRole = keyof typeof IDENTITY_FOLDERS;

export function isIdentityRole(value: string): value is IdentityRole {
  return value in IDENTITY_FOLDERS;
}

export function identityObjectKey(
  workspaceId: string,
  userId: string,
  role: IdentityRole,
  objectId: string,
): string {
  if (!UUID_RE.test(workspaceId) || !UUID_RE.test(userId) || !UUID_RE.test(objectId)) {
    throw new ObjectKeyError("Object keys must use generated ids, not filenames.");
  }
  return `workspaces/${workspaceId}/users/${userId}/identity/${IDENTITY_FOLDERS[role]}/${objectId}`;
}

export function assertIdentityObjectKey(
  objectKey: string,
  workspaceId: string,
  userId: string,
  role: IdentityRole,
): void {
  assertWorkspaceObjectKey(objectKey, workspaceId);
  const expectedPrefix = `workspaces/${workspaceId}/users/${userId}/identity/${IDENTITY_FOLDERS[role]}/`;
  if (!objectKey.startsWith(expectedPrefix)) {
    throw new ObjectKeyError("That file does not belong to this identity.");
  }
  const objectId = objectKey.slice(expectedPrefix.length);
  if (!UUID_RE.test(objectId) || objectId.includes("/")) {
    throw new ObjectKeyError("Object keys must use generated ids, not filenames.");
  }
}

export const LIBRARY_FOLDERS = {
  logo: "logo",
  product: "product",
  business: "business",
  location: "location",
  campaign: "campaign",
} as const;

export type LibraryRole = keyof typeof LIBRARY_FOLDERS;

export function isLibraryRole(value: string): value is LibraryRole {
  return value in LIBRARY_FOLDERS;
}

export function libraryObjectKey(
  workspaceId: string,
  businessId: string,
  role: LibraryRole,
  objectId: string,
): string {
  if (!UUID_RE.test(workspaceId) || !UUID_RE.test(businessId) || !UUID_RE.test(objectId)) {
    throw new ObjectKeyError("Object keys must use generated ids, not filenames.");
  }
  return `workspaces/${workspaceId}/brands/${businessId}/assets/${LIBRARY_FOLDERS[role]}/${objectId}`;
}

export function assertLibraryObjectKey(
  objectKey: string,
  workspaceId: string,
  businessId: string,
  role: LibraryRole,
): void {
  assertWorkspaceObjectKey(objectKey, workspaceId);
  const expectedPrefix = `workspaces/${workspaceId}/brands/${businessId}/assets/${LIBRARY_FOLDERS[role]}/`;
  if (!objectKey.startsWith(expectedPrefix)) {
    throw new ObjectKeyError("That file does not belong to this library.");
  }
  const objectId = objectKey.slice(expectedPrefix.length);
  if (!UUID_RE.test(objectId) || objectId.includes("/")) {
    throw new ObjectKeyError("Object keys must use generated ids, not filenames.");
  }
}

export function projectReferenceObjectKey(
  workspaceId: string,
  projectId: string,
  objectId: string,
): string {
  if (!UUID_RE.test(workspaceId) || !UUID_RE.test(projectId) || !UUID_RE.test(objectId)) {
    throw new ObjectKeyError("Object keys must use generated ids, not filenames.");
  }
  return `workspaces/${workspaceId}/projects/${projectId}/references/${objectId}`;
}

export function assertProjectReferenceObjectKey(
  objectKey: string,
  workspaceId: string,
  projectId: string,
): void {
  assertWorkspaceObjectKey(objectKey, workspaceId);
  const expectedPrefix = `workspaces/${workspaceId}/projects/${projectId}/references/`;
  if (!objectKey.startsWith(expectedPrefix)) {
    throw new ObjectKeyError("That file does not belong to this commercial.");
  }
  const objectId = objectKey.slice(expectedPrefix.length);
  if (!UUID_RE.test(objectId) || objectId.includes("/")) {
    throw new ObjectKeyError("Object keys must use generated ids, not filenames.");
  }
}

export const PRODUCTION_FOLDERS = {
  source: "source/seedance",
  enhanced: "enhanced/topaz",
  final: "final/master",
  thumbnail: "thumbnails",
} as const;

export type ProductionAssetKind = keyof typeof PRODUCTION_FOLDERS;

export function productionObjectKey(
  workspaceId: string,
  projectId: string,
  kind: ProductionAssetKind,
  objectId: string,
): string {
  if (!UUID_RE.test(workspaceId) || !UUID_RE.test(projectId) || !UUID_RE.test(objectId)) {
    throw new ObjectKeyError("Object keys must use generated ids, not filenames.");
  }
  return `workspaces/${workspaceId}/projects/${projectId}/${PRODUCTION_FOLDERS[kind]}/${objectId}`;
}

export function assertProductionObjectKey(
  objectKey: string,
  workspaceId: string,
  projectId: string,
  kind: ProductionAssetKind,
): void {
  assertWorkspaceObjectKey(objectKey, workspaceId);
  const expectedPrefix = `workspaces/${workspaceId}/projects/${projectId}/${PRODUCTION_FOLDERS[kind]}/`;
  if (!objectKey.startsWith(expectedPrefix)) {
    throw new ObjectKeyError("That file does not belong to this commercial.");
  }
  const objectId = objectKey.slice(expectedPrefix.length);
  if (!UUID_RE.test(objectId) || objectId.includes("/")) {
    throw new ObjectKeyError("Object keys must use generated ids, not filenames.");
  }
}
