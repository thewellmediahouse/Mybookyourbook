import { getContainer } from "@cloudflare/containers";

export async function fetchMediaProcessing(
  binding: DurableObjectNamespace,
  path: string,
  init: RequestInit,
  instanceName = "branding",
): Promise<Response> {
  const stub = getContainer(binding as never, instanceName);
  return stub.fetch(new Request(`https://media-processing${path}`, init));
}
