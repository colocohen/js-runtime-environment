# js-runtime-environment

**Get where your JavaScript runs.**\
Universal runtime detection for modern JS: Browser, Web Worker, Service Worker, Worklet, Node.js, Node.js Worker, Bun, Deno, Electron (main / renderer), NW\.js, React-Native, Vercel Edge, Cloudflare Workers, and more — with a single tiny dependency-free module.


## Why

JavaScript today runs in many different contexts: sometimes in the browser, sometimes in a Node.js server, sometimes inside a worker, and increasingly in edge environments like Cloudflare Workers or Vercel Edge.

Often the *same* codebase needs to run in more than one place, but with slight differences in behavior — for example:

- Load different modules depending on server vs. browser.
- Use `fs` in Node but fall back to `fetch` in the browser.
- Register event listeners differently in a Service Worker vs. a Web Worker.

**js-runtime-environment** makes this trivial: you can safely detect the exact runtime and branch your logic without hacks, UA sniffing, or brittle feature checks.


## Highlights

- **Feature detection, not UA sniffing.** Safe `try/catch` guards to avoid `ReferenceError` across exotic runtimes.
- **Broad coverage.** Distinguishes Service/Web/Worklet; detects Node main vs worker threads; recognizes Edge runtimes and desktop shells.
- **Drop-in API.** Flat, top-level detection functions (`isBrowser()`, `isNode()`, …) **plus** a rich `run_env` object for advanced logic.
- **UMD / CJS.** Works everywhere the same way. No configuration required.
- **Zero deps.** Small footprint, fast, and side-effect free.


## What it detects

| Category             | Detected environments                                                |
| -------------------- | -------------------------------------------------------------------- |
| **Browsers**         | Browser (window+document), JsDom                                     |
| **Workers**          | Web Worker, Service Worker, Worklet, Dedicated Worker, Shared Worker |
| **Server runtimes**  | Node.js, Node.js Worker, Bun, Deno                                   |
| **Desktop shells**   | Electron (main / renderer), NW\.js                                   |
| **Mobile / Hybrid**  | React-Native                                                         |
| **Edge runtimes**    | Vercel Edge, Cloudflare Workers                                      |
| **OS (best-effort)** | macOS, Windows, Linux, iOS, Android                                  |
| **Other**            | Generic shell fallback                                               |


## Examples

### Node.js

```bash
npm i js-runtime-environment
```

```js
const env = require('js-runtime-environment');
console.log(env.run_env.name); // e.g. "node"
```

### Browser (direct script tag)

```html
<script src="js-runtime-environment.js"></script>
<script>
  console.log(run_env.name);    // "browser"
  console.log(isBrowser());     // true
  console.log(isNode());        // false
</script>
```

### Web Worker

```js
// worker.js
importScripts('js-runtime-environment.js');

postMessage({
  name: run_env.name,          // "web-worker" or "service-worker"
  isWebWorker: isWebWorker()
});
```



## API

### `run_env` (flags & details)

A structured snapshot computed at load time, plus a normalized `name`.

```js
run_env = {
  name: string,
  web: boolean,
  window: boolean,
  worker: boolean,
  web_worker: boolean,
  service_worker: boolean,
  worklet: boolean,
  nodejs: boolean,
  bun: boolean,
  deno: boolean,
  electron: boolean,
  electron_main: boolean,
  electron_renderer: boolean,
  nwjs: boolean,
  node_main: boolean,
  node_worker: boolean,
  react_native: boolean,
  edge_runtime: boolean,
  cloudflare_worker: boolean,
  shell: boolean,
  details: {
    node: string|null,
    bun: string|null,
    deno: string|null,
    electron: string|null,
    edge: string|null
  }
}
```

### Flat detection helpers

All functions return a boolean and are safe across runtimes.

```js
isBrowser()
isNode()
isBun()
isDeno()
isElectron()
isJsDom()

// Workers
isWebWorker()
isDedicatedWorker()
isSharedWorker()
isServiceWorker()

// OS (best-effort)
isMacOs()
isWindows()
isLinux()
isIos()
isAndroid()
```



## How it works (brief)

- Emphasizes **feature detection** (e.g., `skipWaiting`/`clients` for Service Workers; `importScripts` for Web Workers; `WorkletGlobalScope` for Worklets).
- **Node.js main vs worker** via `worker_threads.isMainThread` when available.
- **Electron** via `process.versions.electron` and window presence to split main/renderer.
- Edge runtimes and platforms use stable globals (e.g., `EdgeRuntime`, `WebSocketPair`, `HTMLRewriter`).
- OS checks combine `navigator.userAgentData.platform`, `navigator.platform`, `userAgent`, and `process.platform` when present.



## Comparison with other libraries

| Feature / Runtime   | **js-runtime-environment** | environment | wherearewe | runtimey | js-runtime |
| ------------------- | ------------ | ----------- | ---------- | -------- | ---------- |
| Browser             | 🟩           | 🟩          | 🟩         | 🟩       | ⬜          |
| JsDom               | 🟩           | 🟩          | ⬜          | ⬜        | ⬜          |
| Web Worker          | 🟩           | 🟩          | 🟩         | 🟩       | ⬜          |
| Service Worker      | 🟩           | 🟩          | ⬜          | ⬜        | ⬜          |
| Worklet             | 🟩           | ⬜           | ⬜          | ⬜        | ⬜          |
| Node.js             | 🟩           | 🟩          | 🟩         | 🟩       | 🟩         |
| Node.js Worker      | 🟩           | ⬜           | ⬜          | ⬜        | ⬜          |
| Bun                 | 🟩           | 🟩          | 🟩         | 🟩       | 🟩         |
| Deno                | 🟩           | 🟩          | ⬜          | 🟩       | 🟩         |
| Electron (main)     | 🟩           | 🟩          | ⬜          | ⬜        | ⬜          |
| Electron (renderer) | 🟩           | 🟩          | ⬜          | ⬜        | ⬜          |
| NW\.js              | 🟩           | ⬜           | ⬜          | ⬜        | ⬜          |
| React Native        | 🟩           | ⬜           | ⬜          | ⬜        | ⬜          |
| Vercel Edge Runtime | 🟩           | ⬜           | ⬜          | ⬜        | ⬜          |
| Cloudflare Workers  | 🟩           | ⬜           | ⬜          | ⬜        | ⬜          |
| macOS               | 🟩           | 🟩          | ⬜          | ⬜        | ⬜          |
| Windows             | 🟩           | 🟩          | ⬜          | ⬜        | ⬜          |
| Linux               | 🟩           | 🟩          | ⬜          | ⬜        | ⬜          |
| iOS                 | 🟩           | 🟩          | ⬜          | ⬜        | ⬜          |
| Android             | 🟩           | 🟩          | ⬜          | ⬜        | ⬜          |

> ✅ **js-runtime-environment** offers the broadest coverage, splitting Node.js main/worker and Electron main/renderer, while also detecting modern edge runtimes, mobile shells, and OS platforms.


## Contributing

Issues and PRs are welcome. Useful areas:

- Additional edge-platform detectors.
- More smoke tests across browsers (incl. SW / WW / Worklet).
- Accuracy refinements for React-Native and desktop shells.



## License

MIT