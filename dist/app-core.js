(function registerOssAppCore(globalScope) {
  "use strict";

  function createRevisionedCache(maxEntries = 1500) {
    const entries = new Map();
    let revision = 0;

    function get(key, factory) {
      const cached = entries.get(key);
      if (cached && cached.revision === revision) return cached.value;
      const value = factory();
      if (entries.size >= maxEntries) entries.clear();
      entries.set(key, { revision, value });
      return value;
    }

    function invalidate() {
      revision += 1;
      entries.clear();
      return revision;
    }

    return {
      get,
      invalidate,
      clear: () => entries.clear(),
      get revision() { return revision; },
      get size() { return entries.size; },
    };
  }

  function createBackgroundCoordinator(options = {}) {
    const documentRef = options.documentRef || globalScope.document || null;
    const tasks = new Map();

    function stop(name) {
      const task = tasks.get(name);
      if (!task) return;
      task.stopped = true;
      if (task.timer) globalScope.clearTimeout(task.timer);
      tasks.delete(name);
    }

    function schedule(task, delay = task.intervalMs) {
      if (task.stopped) return;
      if (task.timer) globalScope.clearTimeout(task.timer);
      task.timer = globalScope.setTimeout(() => execute(task), Math.max(0, delay));
    }

    async function execute(task) {
      if (task.stopped) return;
      task.timer = null;
      if (!task.runWhenHidden && documentRef?.hidden) {
        schedule(task);
        return;
      }
      if (task.running) {
        task.queued = true;
        return;
      }
      task.running = true;
      task.lastStartedAt = new Date().toISOString();
      try {
        await task.run();
        task.lastCompletedAt = new Date().toISOString();
        task.lastError = null;
      } catch (error) {
        task.lastError = error?.message || String(error);
      } finally {
        task.running = false;
        const runQueued = task.queued;
        task.queued = false;
        schedule(task, runQueued ? 0 : task.intervalMs);
      }
    }

    function start(name, run, intervalMs, taskOptions = {}) {
      stop(name);
      const task = {
        name,
        run,
        intervalMs: Math.max(1000, Number(intervalMs || 0)),
        runWhenHidden: taskOptions.runWhenHidden === true,
        running: false,
        queued: false,
        stopped: false,
        timer: null,
        lastStartedAt: null,
        lastCompletedAt: null,
        lastError: null,
      };
      tasks.set(name, task);
      schedule(task, taskOptions.immediate === true ? 0 : task.intervalMs);
      return () => stop(name);
    }

    function trigger(name) {
      const task = tasks.get(name);
      if (!task || task.stopped) return false;
      if (task.running) task.queued = true;
      else schedule(task, 0);
      return true;
    }

    function snapshot() {
      return [...tasks.values()].map((task) => ({
        name: task.name,
        running: task.running,
        lastStartedAt: task.lastStartedAt,
        lastCompletedAt: task.lastCompletedAt,
        lastError: task.lastError,
      }));
    }

    if (documentRef?.addEventListener) {
      documentRef.addEventListener("visibilitychange", () => {
        if (documentRef.hidden) return;
        tasks.forEach((task) => {
          if (!task.running) schedule(task, 0);
        });
      });
    }

    return {
      start,
      stop,
      stopAll: () => [...tasks.keys()].forEach(stop),
      trigger,
      snapshot,
    };
  }

  globalScope.OssAppCore = Object.freeze({
    createRevisionedCache,
    createBackgroundCoordinator,
  });
})(typeof window !== "undefined" ? window : globalThis);
