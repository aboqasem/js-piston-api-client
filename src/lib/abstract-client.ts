import { options, publicServer } from './constants';
import type {
  PistonClientOptions,
  PistonExecuteData,
  PistonExecuteResult,
  PistonRuntime,
  PostRequestData,
  RequestOptions,
} from './types';

export abstract class AbstractPistonClient {
  private baseUrl: string;

  private cachedRuntimes?: PistonRuntime[];

  private cacheTime = 1000 * 60 * 60 * 24;

  public constructor(options?: PistonClientOptions) {
    const server = (options?.server ?? publicServer).replace(/\/$/, '');
    this.baseUrl = server === publicServer ? `${server}/api/v2/piston` : `${server}/api/v2`;
    this.cacheTime = options?.cacheTime ?? this.cacheTime;
  }

  protected abstract get<T>(url: string, options: RequestOptions): Promise<T>;

  protected abstract post<T>(
    url: string,
    data: PostRequestData,
    options: RequestOptions,
  ): Promise<T>;

  /**
   * Get supported runtimes.
   *
   * If `success` is `true`, `data` will be the supported languages along with their current version and aliases. Otherwise, `error` will be the error.
   *
   * ## Example
   * ```js
   * import { PistonClient } from 'piston-api-client';
   * // or for node.js `<18.0.0`
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

    return this.get<PistonRuntime[]>(`${this.baseUrl}/runtimes`, options)
      .then((runtimes) => {
        this.cachedRuntimes = runtimes;

        setTimeout(() => {
          this.cachedRuntimes = undefined;
        }, this.cacheTime);

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
   * // or for node.js `<18.0.0`
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
   *     //   "run": {
   *     //     "stdout": "[ 'Hello', 'World' ]\n",
   *     //     "stderr": "",
   *     //     "code": 0,
   *     //     "signal": null,
   *     //     "output": "[ 'Hello', 'World' ]\n"
   *     //   },
   *     //   "language": "javascript",
   *     //   "version": "16.3.0"
   *     // }
   *   }
   * })();
   * ```
   */
  public async execute(
    data: PistonExecuteData,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<{ success: true; data: PistonExecuteResult } | { success: false; error: any }> {
    return this.post<PistonExecuteResult>(`${this.baseUrl}/execute`, data, options)
      .then((result) => {
        return { success: true as const, data: result };
      })
      .catch((error) => {
        return { success: false, error };
      });
  }
}
