import http from 'http';
import https from 'https';
import { AbstractPistonClient } from './abstract-client';
import type { RequestOptions } from './types';

/**
 * Piston client for Node.js. Uses the Node.js http module to communicate with the Piston API.
 *
 * Do not use this class in the browser.
 */
export class NodePistonClient extends AbstractPistonClient {
  protected get<T>(url: string, options: RequestOptions): Promise<T> {
    const client = url.startsWith('https') ? https : http;

    return new Promise((resolve, reject) => {
      const req = client.get(url, { headers: options.headers }, (res) => {
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

  protected post<T>(url: string, data: unknown, options: RequestOptions): Promise<T> {
    const client = url.startsWith('https') ? https : http;

    return new Promise((resolve, reject) => {
      const req = client.request(url, { method: 'POST', headers: options.headers }, (res) => {
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
