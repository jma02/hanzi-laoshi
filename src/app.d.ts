declare global {
  namespace App { interface Platform { env: { CARTESIA_API_KEY?: string; CARTESIA_VOICE_ID?: string; ASSETS: { fetch: typeof fetch } } } }
  interface Document {
    modelContext?: { registerTool(tool: { name: string; description: string; inputSchema: object; annotations?: object; execute(input: unknown): unknown }, options?: { signal: AbortSignal }): void | Promise<void> };
  }
}
declare module 'opencc-js';
export {};
