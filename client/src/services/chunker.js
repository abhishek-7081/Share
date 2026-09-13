let worker = null;
let pendingWorkerTasks = new Map();

function getWorker() {
  if (!worker && typeof window !== 'undefined') {
    worker = new Worker(new URL('../workers/hashWorker.js', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const { id, hash, error } = e.data;
      if (pendingWorkerTasks.has(id)) {
        const { resolve, reject } = pendingWorkerTasks.get(id);
        pendingWorkerTasks.delete(id);
        if (error) reject(new Error(error));
        else resolve(hash);
      }
    };
  }
  return worker;
}

export function computeBufferHash(arrayBuffer) {
  return new Promise((resolve, reject) => {
    const taskId = Math.random().toString(36).substring(2) + Date.now();
    pendingWorkerTasks.set(taskId, { resolve, reject });
    const w = getWorker();
    if (w) {
      w.postMessage({ id: taskId, buffer: arrayBuffer }, [arrayBuffer]);
    } else {
      // Fallback in main thread if Web Worker unavailable
      window.crypto.subtle.digest('SHA-256', arrayBuffer)
        .then(hashBuffer => {
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          resolve(hashArray.map(b => b.toString(16).padStart(2, '0')).join(''));
        })
        .catch(reject);
    }
  });
}

export async function computeFileHash(file, chunkSize = 2 * 1024 * 1024, onProgress) {
  const totalChunks = Math.ceil(file.size / chunkSize);
  const hash = window.crypto.subtle;
  // If Web Crypto subtle is available on file
  const stream = file.stream();
  const reader = stream.getReader();
  
  let loaded = 0;
  const chunks = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    if (onProgress) onProgress(Math.min(100, (loaded / file.size) * 100));
  }
  
  const fullBuffer = new Uint8Array(file.size);
  let offset = 0;
  for (const c of chunks) {
    fullBuffer.set(c, offset);
    offset += c.length;
  }

  const hashBuf = await hash.digest('SHA-256', fullBuffer.buffer);
  const hashArray = Array.from(new Uint8Array(hashBuf));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
