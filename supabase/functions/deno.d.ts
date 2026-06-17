// Minimal Deno type declarations for VS Code TypeScript compatibility.
// These types make Deno globals recognised without the Deno VS Code extension.

declare namespace Deno {
  /** Access environment variables. */
  const env: {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    delete(key: string): void;
    toObject(): Record<string, string>;
  };

  /** Start an HTTP server. */
  function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: { port?: number; hostname?: string; onListen?: (params: { hostname: string; port: number }) => void },
  ): Promise<void>;
}
