let counter = 0;
const scriptMap = new Map();

function ScriptCache(scripts) {
  const Cache = {};

  Cache.onLoad = key => cb => {
    const stored = scriptMap.get(key);
    if (stored) {
      stored.promise.then(() => {
        stored.error ? cb(stored.error) : cb(null, stored);
      });
    } else {
      // TODO:
    }
  };

  Cache.scriptTag = (key, src) => {
    if (!scriptMap.has(key)) {
      const tag = document.createElement("script");
      const promise = new Promise((resolve, reject) => {
        const body = document.getElementsByTagName("body")[0];
        tag.type = "text/javascript";
        tag.crossorigin = "crossorigin";
        tag.async = true; // Load in order

        const cbName = `loaderCB${counter++}${Date.now()}`;

        const cleanup = () => {
          if (global[cbName] && typeof global[cbName] === "function") {
            global[cbName] = null;
          }
        };

        const handleResult = state => evt => {
          const stored = scriptMap.get(key);
          stored.resolved = false;
          stored.resolved = false;
          if (state === "loaded") {
            stored.resolved = true;
            resolve(src);
            // stored.handlers.forEach(h => h.call(null, stored))
            // stored.handlers = []
          } else if (state === "error") {
            stored.errored = true;
            // stored.handlers.forEach(h => h.call(null, stored))
            // stored.handlers = [];
            reject(evt);
          }
          cleanup();
        };

        tag.onload = handleResult("loaded");
        tag.onerror = handleResult("error");
        tag.onreadystatechange = () => {
          handleResult(tag.readyState);
        };

        // Pick off callback, if there is one
        if (src.match(/callback=CALLBACK_NAME/)) {
          src = src.replace(/(callback=)[^&]+/, `$1${cbName}`);
        } else {
          tag.addEventListener("load", tag.onload);
        }
        tag.addEventListener("error", tag.onerror);
        tag.src = src;
        body.appendChild(tag);
        return tag;
      });
      const initialState = {
        loaded: false,
        error: false,
        promise,
        tag,
      };
      scriptMap.set(key, initialState);
    }
    return scriptMap.get(key);
  };

  Object.keys(scripts).forEach(key => {
    const script = scripts[key];
    Cache[key] = {
      tag: Cache.scriptTag(key, script),
      onLoad: Cache.onLoad(key),
    };
  });

  return Cache;
}

export default ScriptCache;
