(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    var api = factory();
    // ייצוא “דוך לשם” – פונקציות בנפרד + run_env
    module.exports = api;
  } else if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else {
    var api = factory();
    // בדפדפן: נרשום גם גלובלים וגם window.run_env
    root.run_env = api.run_env;
    // פונקציות “דוך לשם” כגלובליות
    root.isBrowser = api.isBrowser;
    root.isNode = api.isNode;
    root.isBun = api.isBun;
    root.isDeno = api.isDeno;
    root.isElectron = api.isElectron;
    root.isJsDom = api.isJsDom;
    root.isWebWorker = api.isWebWorker;
    root.isDedicatedWorker = api.isDedicatedWorker;
    root.isSharedWorker = api.isSharedWorker;
    root.isServiceWorker = api.isServiceWorker;
    root.isMacOs = api.isMacOs;
    root.isWindows = api.isWindows;
    root.isLinux = api.isLinux;
    root.isIos = api.isIos;
    root.isAndroid = api.isAndroid;
  }
}(this, function () {
  'use strict';

  // ===== helpers =====
  function getGlobal() {
    if (typeof globalThis !== 'undefined') return globalThis;
    try { return Function('return this')(); } catch (e) {}
    if (typeof self !== 'undefined') return self;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;
    return {};
  }
  var G = getGlobal();

  // ===== core detection (run_env) =====
  var run_env = {
    web:false, window:false, worker:false, web_worker:false, service_worker:false,
    worklet:false, nodejs:false, bun:false, deno:false,
    electron:false, electron_main:false, electron_renderer:false,
    node_main:false, node_worker:false, react_native:false,
    edge_runtime:false, cloudflare_worker:false, nwjs:false,
    shell:false,
    details:{ node:null, bun:null, deno:null, electron:null, edge:null },
    name:'unknown'
  };

  try { run_env.window = (typeof window === 'object'); } catch (e) {}
  try { run_env.web    = (typeof window === 'object' && typeof document === 'object'); } catch (e) {}

  var hasSelf=false, hasImportScripts=false;
  try { hasSelf = (typeof self === 'object'); } catch (e) {}
  try { hasImportScripts = (typeof importScripts === 'function'); } catch (e) {}

  // React Native
  try { run_env.react_native = (typeof navigator === 'object' && navigator && navigator.product === 'ReactNative'); } catch (e) {}

  // Worklet
  try { run_env.worklet = (typeof WorkletGlobalScope !== 'undefined') ? (self instanceof WorkletGlobalScope) : false; } catch (e) {}

  // SW/WW
  try {
    var isSW = hasSelf && typeof Window === 'undefined' &&
               typeof self.skipWaiting === 'function' &&
               typeof self.clients === 'object';
    run_env.service_worker = !!isSW;

    var isWW = hasSelf && hasImportScripts && typeof Window === 'undefined' &&
               !run_env.service_worker;
    run_env.web_worker = !!isWW;

    run_env.worker = run_env.service_worker || run_env.web_worker || run_env.worklet;
  } catch (e) {}

  // Deno / Bun
  try { run_env.deno = !!(G.Deno && G.Deno.version); } catch (e) {}
  try {
    run_env.bun = !!(G.Bun && G.Bun.version) ||
                  !!(typeof process === 'object' && process.versions && process.versions.bun);
  } catch (e) {}

  // Node/Electron/NW.js
  var isNodeLike=false, pv=null;
  try { isNodeLike = !!(typeof process === 'object' && process.versions); } catch (e) {}
  try {
    pv = isNodeLike ? process.versions : null;
    run_env.electron = !!(pv && pv.electron);
    run_env.nwjs     = !!(pv && pv.nw);
    run_env.nodejs   = !!(pv && pv.node && !pv.bun);
    if (run_env.electron) {
      run_env.electron_renderer = (typeof window === 'object');
      run_env.electron_main     = !run_env.electron_renderer;
    }
  } catch (e) {}

  // Node main/worker
  if (run_env.nodejs) {
    var isMain = true;
    try {
      var wt = (typeof require === 'function') ? require('worker_threads') : null;
      if (wt && typeof wt.isMainThread === 'boolean') isMain = wt.isMainThread;
    } catch (e) {}
    run_env.node_main   = !!isMain;
    run_env.node_worker = !isMain && !run_env.web_worker && !run_env.service_worker && !run_env.worklet;
  }

  // Edge / CF Workers
  try { run_env.edge_runtime = (typeof G.EdgeRuntime === 'string' && G.EdgeRuntime === 'edge-runtime'); } catch (e) {}
  try {
    var noWin = (typeof Window === 'undefined');
    var hasCF = (typeof G.WebSocketPair === 'function') || (typeof G.HTMLRewriter === 'function');
    run_env.cloudflare_worker = !!(noWin && hasCF && !run_env.service_worker && !run_env.web_worker && !run_env.worklet);
  } catch (e) {}

  // details
  try { run_env.details.node     = (isNodeLike && pv && pv.node) ? pv.node : null; } catch (e) {}
  try { run_env.details.bun      = (G.Bun && G.Bun.version) ? G.Bun.version : (pv && pv.bun ? pv.bun : null); } catch (e) {}
  try { run_env.details.deno     = (G.Deno && G.Deno.version && G.Deno.version.deno) ? G.Deno.version.deno : null; } catch (e) {}
  try { run_env.details.electron = (pv && pv.electron) ? pv.electron : null; } catch (e) {}
  try { run_env.details.edge     = (typeof G.EdgeRuntime === 'string') ? G.EdgeRuntime : null; } catch (e) {}

  // shell + name
  run_env.shell = !run_env.web && !run_env.worker && !run_env.nodejs;
  (function chooseName(){
    if (run_env.electron) run_env.name = run_env.electron_main ? 'electron-main':'electron-renderer';
    else if (run_env.edge_runtime)     run_env.name = 'edge-runtime';
    else if (run_env.cloudflare_worker)run_env.name = 'cloudflare-worker';
    else if (run_env.service_worker)   run_env.name = 'service-worker';
    else if (run_env.worklet)          run_env.name = 'worklet';
    else if (run_env.web_worker)       run_env.name = 'web-worker';
    else if (run_env.react_native)     run_env.name = 'react-native';
    else if (run_env.web)              run_env.name = 'browser';
    else if (run_env.bun)              run_env.name = 'bun';
    else if (run_env.deno)             run_env.name = 'deno';
    else if (run_env.node_worker)      run_env.name = 'node-worker';
    else if (run_env.nodejs)           run_env.name = 'node';
    else if (run_env.nwjs)             run_env.name = 'nwjs';
    else if (run_env.shell)            run_env.name = 'shell';
    else                               run_env.name = 'unknown';
  }());

  // ===== flat API compatible with "environment" (top-level functions) =====
  function safeUA()    { try { return (typeof navigator==='object'&&navigator&&navigator.userAgent)||''; } catch(e){ return ''; } }
  function platform()  {
    try {
      if (typeof navigator==='object' && navigator) {
        if (navigator.userAgentData && navigator.userAgentData.platform) return navigator.userAgentData.platform;
        if (navigator.platform) return navigator.platform;
      }
    } catch(e){}
    return '';
  }
  function instOf(ctorName){
    try {
      var C = G[ctorName]; if (!C) return false;
      var S = (typeof self!=='undefined') ? self : null;
      return !!(S && (S instanceof C));
    } catch(e){ return false; }
  }

  // === פונקציות תאימות – נגישות “דוך לשם” ===
  function isBrowser(){ return !!run_env.web; }
  function isNode(){ return !!run_env.nodejs; }
  function isBun(){ return !!run_env.bun; }
  function isDeno(){ return !!run_env.deno; }
  function isElectron(){ return !!run_env.electron; }
  function isJsDom(){ return safeUA().indexOf('jsdom') !== -1; }

  // לפי ה-API של environment: isWebWorker כולל Service/Dedicated/Shared
  function isWebWorker(){ return !!(run_env.service_worker || run_env.web_worker || instOf('SharedWorkerGlobalScope') || instOf('DedicatedWorkerGlobalScope')); }
  function isDedicatedWorker(){
    if (instOf('DedicatedWorkerGlobalScope')) return true;
    return (!!run_env.web_worker && !instOf('SharedWorkerGlobalScope')); // fallback
  }
  function isSharedWorker(){ return instOf('SharedWorkerGlobalScope'); }
  function isServiceWorker(){ return !!run_env.service_worker || instOf('ServiceWorkerGlobalScope'); }

  function isMacOs(){
    try {
      var pf = platform(), ua = safeUA();
      if (pf === 'macOS') return true;
      if (pf === 'MacIntel') return true;
      if (ua.indexOf(' Mac ') !== -1) return true;
      if (typeof process==='object' && process && process.platform==='darwin') return true;
    } catch(e){}
    return false;
  }
  function isWindows(){
    try {
      var pf = platform(), ua = safeUA();
      if (pf === 'Windows' || pf === 'Win32') return true;
      if (typeof process==='object' && process && process.platform==='win32') return true;
      if (ua.indexOf(' Windows ') !== -1) return true;
    } catch(e){}
    return false;
  }
  function isLinux(){
    try {
      var pf = platform(), ua = safeUA();
      if (pf === 'Linux') return true;
      if (pf && pf.indexOf('Linux')===0) return true;
      if (ua.indexOf(' Linux ') !== -1) return true;
      if (typeof process==='object' && process && process.platform==='linux') return true;
    } catch(e){}
    return false;
  }
  function isIos(){
    try {
      var pf = platform();
      if (pf === 'iOS') return true;
      if (typeof navigator==='object' && navigator) {
        if (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1) return true; // iPadOS
        var plat = navigator.platform || '';
        if (/iPad|iPhone|iPod/.test(plat)) return true;
      }
    } catch(e){}
    return false;
  }
  function isAndroid(){
    try {
      var pf = platform(), ua = safeUA();
      if (pf === 'Android') return true;
      if (typeof navigator==='object' && navigator && navigator.platform==='Android') return true;
      if (ua.indexOf(' Android ') !== -1) return true;
      if (typeof process==='object' && process && process.platform==='android') return true;
    } catch(e){}
    return false;
  }

  // החזר אוסף ישיר – ב-CJS יהיו אלו ה-named-exports; ב-Browser הוצמדו כגלובלים
  return {
    run_env: run_env,
    isBrowser: isBrowser,
    isNode: isNode,
    isBun: isBun,
    isDeno: isDeno,
    isElectron: isElectron,
    isJsDom: isJsDom,
    isWebWorker: isWebWorker,
    isDedicatedWorker: isDedicatedWorker,
    isSharedWorker: isSharedWorker,
    isServiceWorker: isServiceWorker,
    isMacOs: isMacOs,
    isWindows: isWindows,
    isLinux: isLinux,
    isIos: isIos,
    isAndroid: isAndroid
  };
}));