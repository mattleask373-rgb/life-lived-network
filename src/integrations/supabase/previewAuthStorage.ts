// On a Lovable preview surface, broker the auth session to the editor over
// postMessage so project previews can share a login. Every path keeps the
// browser storage fallback exception-safe.
export interface PreviewAuthStorage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}

type BrokerRequestType = "lovable-preview-auth:get" | "lovable-preview-auth:set" | "lovable-preview-auth:remove";

interface BrokerReply {
  ok: boolean;
  value: string | null;
}

interface LocalStorageLike {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

/** Treat storage getter/method exceptions as unavailable rather than leaking them across auth startup. */
export function safeReadStorage(
  getStorage: () => LocalStorageLike,
  key: string,
): string | null | undefined {
  try {
    return getStorage().getItem(key);
  } catch {
    return undefined;
  }
}

export function safeWriteStorage(
  getStorage: () => LocalStorageLike,
  key: string,
  value: string,
): boolean {
  try {
    getStorage().setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveStorage(getStorage: () => LocalStorageLike, key: string): boolean {
  try {
    getStorage().removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/** Reject malformed replies; in particular, a string such as "false" is not success. */
export function readBrokerReply(data: unknown, requestId: string): BrokerReply | null {
  if (typeof data !== "object" || data === null) return null;
  const reply = data as { type?: unknown; requestId?: unknown; ok?: unknown; value?: unknown };
  if (reply.type !== "lovable-preview-auth:result" || reply.requestId !== requestId) return null;
  if (typeof reply.ok !== "boolean") return null;
  if (reply.value !== null && typeof reply.value !== "string") return null;
  if (!("value" in reply)) return null;
  return { ok: reply.ok, value: reply.value };
}

const TIMEOUT = 2000;
const RETRY_DELAY = 250;
const PREVIEW_ZONES = [
  "lovableproject.com",
  "lovableproject-dev.com",
  "lovable.app",
  "gpt-eng.com",
  "gptengineer.run",
];
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}";

function localStorageOnly(): PreviewAuthStorage {
  const getStorage = () => window.localStorage;
  return {
    getItem: (key) => safeReadStorage(getStorage, key) ?? null,
    setItem: (key, value) => {
      if (!safeWriteStorage(getStorage, key, value)) {
        throw new Error("Browser authentication storage is unavailable.");
      }
    },
    removeItem: (key) => {
      if (!safeRemoveStorage(getStorage, key)) {
        throw new Error("Browser authentication storage is unavailable.");
      }
    },
  };
}

function trustedAncestorOrigin(): string {
  try {
    const ancestor = location.ancestorOrigins?.[0];
    if (ancestor) return ancestor;
  } catch {
    // Some browser/frame combinations do not expose ancestorOrigins.
  }
  try {
    return document.referrer ? new URL(document.referrer).origin : "";
  } catch {
    return "";
  }
}

function newRequestId(): string {
  try {
    return window.crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export function brokeredPreviewStorage(): PreviewAuthStorage | undefined {
  if (typeof window === "undefined") return undefined;

  const host = window.location.hostname;
  const onPreviewZone = PREVIEW_ZONES.some((zone) => host === zone || host.endsWith("." + zone));
  // Only fixed host positions can supply the project ID; a user-controlled
  // preview name is never used to choose another project's auth namespace.
  const projectId = onPreviewZone
    ? (new RegExp("^(?:id-preview(?:-[a-z0-9]+)?|project)--(" + UUID + ")(?:-dev)?(?=\\.|$)", "i").exec(host)?.[1] ??
      new RegExp("^(" + UUID + ")(?=[.-])", "i").exec(host)?.[1])
    : undefined;

  const parentWindow = window.parent as Window | null;
  if (!projectId || parentWindow === null || parentWindow === window) return localStorageOnly();

  const dev =
    host.endsWith(".lovableproject-dev.com") || host.endsWith(".gpt-eng.com");
  const editorPattern = dev
    ? /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$|^http:\/\/localhost:3000$/
    : /^https:\/\/([a-z0-9-]+\.)*(lovable\.dev|gptengineer\.app)$/;
  const ancestor = trustedAncestorOrigin();
  const editorOrigins = ancestor && editorPattern.test(ancestor)
    ? [ancestor]
    : dev
      ? ["https://lovable.dev", "http://localhost:3000"]
      : ["https://lovable.dev"];

  const request = (
    type: BrokerRequestType,
    key: string,
    value?: string,
  ): Promise<BrokerReply | null> =>
    new Promise((resolve) => {
      const requestId = newRequestId();
      let done = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const finish = (reply: BrokerReply | null) => {
        if (done) return;
        done = true;
        if (timer !== undefined) clearTimeout(timer);
        window.removeEventListener("message", onMessage);
        resolve(reply);
      };
      const onMessage = (event: MessageEvent<unknown>) => {
        // Both origin and WindowProxy are required. A same-origin sibling or
        // another frame is not allowed to answer an auth-storage request.
        if (event.source !== parentWindow) return;
        if (!editorOrigins.includes(event.origin)) return;
        const reply = readBrokerReply(event.data, requestId);
        if (reply) finish(reply);
      };

      window.addEventListener("message", onMessage);
      timer = setTimeout(() => finish(null), TIMEOUT);
      const message: Record<string, unknown> = { type, requestId, projectId, key };
      if (value !== undefined) message["value"] = value;

      let posted = false;
      for (const origin of editorOrigins) {
        try {
          parentWindow.postMessage(message, origin);
          posted = true;
        } catch {
          // Try the next explicitly trusted origin. Never use "*" as a fallback.
        }
      }
      if (!posted) finish(null);
    });

  // First GET may race the editor listener during preview startup; retry once.
  let firstGet = true;
  const getStorage = () => window.localStorage;

  return {
    getItem: async (key) => {
      // local is undefined when storage access throws, distinct from a normal
      // empty slot (null). The broker can still provide the shared session.
      const local = safeReadStorage(getStorage, key);
      let reply = await request("lovable-preview-auth:get", key, local ?? undefined);
      if (!reply && firstGet) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        reply = await request("lovable-preview-auth:get", key, local ?? undefined);
      }
      firstGet = false;

      if (reply?.ok && typeof reply.value === "string") {
        if (reply.value === "") {
          // Empty string is the protocol's logout tombstone.
          const current = safeReadStorage(getStorage, key);
          if (local !== undefined && current === local) safeRemoveStorage(getStorage, key);
          return null;
        }
        // Seed only a normal empty slot; do not overwrite an inaccessible or
        // concurrently changed local value.
        if (local === null) safeWriteStorage(getStorage, key, reply.value);
        return reply.value;
      }
      return local ?? null;
    },

    setItem: async (key, value) => {
      // Local persistence is best effort while framed; a working broker is
      // allowed to keep a session when browser third-party storage is blocked.
      const localWritten = safeWriteStorage(getStorage, key, value);
      const reply = await request("lovable-preview-auth:set", key, value);

      if (reply?.ok) {
        if (typeof reply.value === "string" && safeReadStorage(getStorage, key) === value) {
          if (reply.value === "") safeRemoveStorage(getStorage, key);
          else safeWriteStorage(getStorage, key, reply.value);
        }
        return;
      }
      if (!localWritten) {
        throw new Error("Could not persist authentication state in browser storage or the preview broker.");
      }
    },

    removeItem: async (key) => {
      const local = safeReadStorage(getStorage, key);
      safeRemoveStorage(getStorage, key);
      const reply = await request("lovable-preview-auth:remove", key, local ?? undefined);
      // A local deletion alone cannot revoke the shared editor session. Do not
      // report sign-out as complete when the broker did not acknowledge it.
      if (!reply?.ok) {
        throw new Error("The preview broker could not confirm authentication removal.");
      }
      if (reply.value === "") safeRemoveStorage(getStorage, key);
    },
  };
}
