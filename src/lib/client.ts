import http from 'http';
import {
  PistonClientOptions,
  PistonExecuteData,
  PistonExecuteResult,
  PistonRuntime,
} from './types';

const publicServer = 'https://emkc.org';

abstract class AbstractPistonClient {
  private baseUrl: string;

  private cachedRuntimes?: PistonRuntime[];

  public constructor(options?: PistonClientOptions) {
    let server = options?.server ?? publicServer;
    server = server.replace(/\/$/, '');
    this.baseUrl = server === publicServer ? `${server}/api/v2/piston` : `${server}/api/v2`;
  }

  protected abstract get<T>(url: string, options: { headers: Record<string, string> }): Promise<T>;

  protected abstract post<T>(
    url: string,
    data: unknown,
    options: { headers: Record<string, string> },
  ): Promise<T>;

  /**
   * Get supported runtimes.
   *
   * If `success` is `true`, `data` will be the supported languages along with their current version and aliases. Otherwise, `error` will be the error.
   *
   * ## Example
   * ```js
   * import { PistonClient } from 'piston-api-client';
   * // or for node.js
   * import { NodePistonClient as PistonClient } from 'piston-api-client';
   *
   * (async () => {
   *   const pistonClient = new PistonClient();
   *   const runtimes = await pistonClient.runtimes();
   *   if (runtimes.success) {
   *     console.log(runtimes.data);
   *     // [
   *     //   {
   *     //     "language": "typescript",
   *     //     "version": "1.7.5",
   *     //     "aliases": [
   *     //       "deno-ts",
   *     //       "deno"
   *     //     ],
   *     //     "runtime": "deno"
   *     //   },
   *     //   ...
   *     // ]
   *   }
   * })();
   * ```
   */
  public async runtimes(): Promise<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { success: true; data: PistonRuntime[] } | { success: false; error: any }
  > {
    if (this.cachedRuntimes) {
      return { success: true, data: this.cachedRuntimes };
    }

    return this.get<PistonRuntime[]>(`${this.baseUrl}/runtimes`, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then((runtimes) => {
        this.cachedRuntimes = runtimes;
        return { success: true as const, data: runtimes };
      })
      .catch((error) => {
        return { success: false, error };
      });
  }

  /**
   * Execute arbitrary code.
   *
   * If `success` is `true`, `data` will contain 1 or 2 keys `run` and `compile`. `compile` will only be present if the language requested requires a compile stage.
   *
   * Each of these keys has an identical structure, containing both a stdout and stderr key, which is a string containing the text outputted during the stage into each buffer. It also contains the code and signal which was returned from each process.
   *
   * Otherwise if `success` is `false`, `error` will be the error.
   *
   * ## Example
   * ```js
   * import { PistonClient } from 'piston-api-client';
   * // or for node.js
   * import { NodePistonClient as PistonClient } from 'piston-api-client';
   *
   * (async () => {
   *   const pistonClient = new PistonClient();
   *
   *   const result = await pistonClient.execute({
   *     language: 'node-js',
   *     version: '*',
   *     files: [
   *       {
   *         content: 'console.log(process.argv.slice(2))',
   *       },
   *     ],
   *     args: ['Hello', 'World'],
   *   });
   *   if (result.success) {
   *     console.log(result.data);
   *     // {
   *     //  "run": {
   *     //   "stdout": "[ 'Hello', 'World' ]\n",
   *     //   "stderr": "",
   *     //   "code": 0,
   *     //   "signal": null,
   *     //   "output": "[ 'Hello', 'World' ]\n"
   *     //  },
   *     //  "language": "javascript",
   *     //  "version": "16.3.0"
   *     // }
   *   }
   * })();
   * ```
   */
  public async execute(
    data: PistonExecuteData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<{ success: true; data: PistonExecuteResult } | { success: false; error: any }> {
    return this.post<PistonExecuteResult>(`${this.baseUrl}/execute`, data, {
      headers: { 'Content-Type': 'application/json' },
    })
      .then((result) => {
        return { success: true as const, data: result };
      })
      .catch((error) => {
        return { success: false, error };
      });
  }
}

/**
 * Piston client for Node.js. Uses the Node.js http module to communicate with the Piston API.
 *
 * Do not use this class in the browser.
 */
export class NodePistonClient extends AbstractPistonClient {
  protected get<T>(url: string, options: { headers: Record<string, string> }): Promise<T> {
    return new Promise((resolve, reject) => {
      const req = http.get(url, { headers: options.headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      });
      req.on('error', (err) => {
        reject(err);
      });
    });
  }

  protected post<T>(
    url: string,
    data: unknown,
    options: { headers: Record<string, string> },
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const req = http.request(url, { method: 'POST', headers: options.headers }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve(JSON.parse(data));
        });
      });
      req.on('error', (err) => {
        reject(err);
      });
      req.write(JSON.stringify(data));
      req.end();
    });
  }
}

/**
 * Piston client for the browser or fetch API compatible environments. Uses the fetch API to communicate with the Piston API.
 *
 * Do not use this class in Node.js.
 */
export class PistonClient extends AbstractPistonClient {
  protected async get<T>(url: string, options: { headers: Record<string, string> }): Promise<T> {
    const res = await fetch(url, {
      method: 'GET',
      headers: options.headers,
    });

    return await res.json();
  }

  protected async post<T>(
    url: string,
    data: unknown,
    options: { headers: Record<string, string> },
  ): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: options.headers,
      body: JSON.stringify(data),
    });

    return await res.json();
  }
}
