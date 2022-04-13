# Piston API Client

Client wrapper for the [Piston Code Execution Engine](https://github.com/engineer-man/piston) API.

Inspired by [node-piston](https://github.com/dthree/node-piston).

## Features

- **🚀 Compatibility**: Node.js and Fetch API compatible environments (e.g. Web, React-Native, etc.).
- **🔧 Extensible**: optionally provide your own HTTP methods and bring it to any JS platform if it is not in the supported environments.
- **🤖 IntelliSense**: built with TypeScript.
- **0️⃣ No dependencies**: uses native HTTP clients for requests.

## Installation

```bash
npm i piston-api-client
yarn add piston-api-client
pnpm add piston-api-client
```

## Usage Example

```js
import { PistonClient } from 'piston-api-client';
// or for node.js
import { NodePistonClient as PistonClient } from 'piston-api-client';

(async () => {
  const pistonClient = new PistonClient({ server: 'https://emkc.org' /* default */ });

  const runtimes = await pistonClient.runtimes();
  if (runtimes.success) {
    console.log(runtimes.data);
    // [
    //   {
    //     "language": "typescript",
    //     "version": "1.7.5",
    //     "aliases": [
    //       "deno-ts",
    //       "deno"
    //     ],
    //     "runtime": "deno"
    //   },
    //   ...
    // ]
  }

  const result = await pistonClient.execute({
    language: 'node-js',
    version: '*',
    files: [
      {
        content: 'console.log(process.argv.slice(2))',
      },
    ],
    args: ['Hello', 'World'],
  });
  if (result.success) {
    console.log(result.data);
    // {
    //  "run": {
    //   "stdout": "[ 'Hello', 'World' ]\n",
    //   "stderr": "",
    //   "code": 0,
    //   "signal": null,
    //   "output": "[ 'Hello', 'World' ]\n"
    //  },
    //  "language": "javascript",
    //  "version": "16.3.0"
    // }
  }
})();
```

### Your own HTTP methods

```js
import axios from 'axios';
import { AbstractPistonClient } from 'piston-api-client';

export class PistonClient extends AbstractPistonClient {
  get(url, options) {
    return axios.get(url, options).then((response) => response.data);
  }

  post(url, data, options) {
    return axios.post(url, data, options).then((response) => response.data);
  }
}
```

### Error handling

If an error occurs, the `success` property will be `false` and the `error` property will contain the error. Nothing will be thrown.
