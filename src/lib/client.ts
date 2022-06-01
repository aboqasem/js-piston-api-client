import { AbstractPistonClient } from './abstract-client';
import type { PostRequestData, RequestOptions } from './types';

/**
 * Piston client for the browser or `Fetch API` compatible environments (e.g. Node.js `>=18.0.0`). Uses the `Fetch API` to communicate with the Piston API.
 *
 * Do not use this class in Node.js `<18.0.0`.
 */
export class PistonClient extends AbstractPistonClient {
  protected async get<T>(url: string, options: RequestOptions): Promise<T> {
    const res = await fetch(url, {
      method: 'GET',
      headers: options.headers,
    });

    return await res.json();
  }

  protected async post<T>(url: string, data: PostRequestData, options: RequestOptions): Promise<T> {
    const res = await fetch(url, {
      method: 'POST',
      headers: options.headers,
      body: JSON.stringify(data),
    });

    return await res.json();
  }
}
