import { AbstractPistonClient } from './abstract-client';
import type { RequestOptions } from './types';

/**
 * Piston client for the browser or fetch API compatible environments. Uses the fetch API to communicate with the Piston API.
 *
 * Do not use this class in Node.js.
 */
export class PistonClient extends AbstractPistonClient {
  protected async get<T>(url: string, options: RequestOptions): Promise<T> {
    const res = await fetch(url, {
      method: 'GET',
      headers: options.headers,
    });

    return await res.json();
  }

  protected async post<T>(url: string, data: unknown, options: RequestOptions): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: options.headers,
      body: JSON.stringify(data),
    });

    return await res.json();
  }
}
