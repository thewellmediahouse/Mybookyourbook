import { Container } from "@cloudflare/containers";

const HEALTH_PATH = "/health";

type MediaEnv = {
  INTERNAL_SERVICE_SECRET?: string;
};

export class MediaProcessingService extends Container<MediaEnv> {
  defaultPort = 8080;
  requiredPorts = [8080];
  sleepAfter = "15m";
  enableInternet = false;
  pingEndpoint = "/health";

  constructor(ctx: ConstructorParameters<typeof Container>[0], env: MediaEnv) {
    super(ctx, env);
    this.envVars = {
      INTERNAL_SERVICE_SECRET: env.INTERNAL_SERVICE_SECRET ?? "",
    };
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path !== HEALTH_PATH) {
      const expected = this.env.INTERNAL_SERVICE_SECRET?.trim() ?? "";
      const provided = request.headers.get("X-Internal-Secret") ?? "";
      if (!expected || provided !== expected) {
        return new Response("Unauthorized", { status: 401 });
      }
    }
    return super.fetch(request);
  }
}
