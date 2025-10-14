// lossless client→server transport for metrics
type MetricPayload = { 
  metrics: any[] 
};

const Q_KEY = 'metrics_queue_v1';

const readQ = (): MetricPayload => {
  try {
    return JSON.parse(localStorage.getItem(Q_KEY) || '{"metrics":[]}');
  } catch {
    return {metrics:[]}
  }
};

const writeQ = (q: MetricPayload) => {
  try {
    localStorage.setItem(Q_KEY, JSON.stringify(q));
  } catch {}
};

export async function sendMetrics(payload: MetricPayload, endpoint: string) {
  const body = JSON.stringify(payload);
  
  // 1) fire-and-forget
  if (navigator.sendBeacon && endpoint.startsWith('https')) {
    if (navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))) return;
  }
  
  // 2) fetch fallback + jittered backoff; queue on failure
  for (let a = 1; a <= 3; a++) {
    try {
      const res = await fetch(endpoint, { 
        method: 'POST', 
        headers:{'Content-Type':'application/json'}, 
        body, 
        keepalive:true 
      });
      if (res.ok) return;
      throw new Error(`HTTP ${res.status}`);
    } catch {
      if (a === 3) {
        const q = readQ(); 
        q.metrics.push(...payload.metrics); 
        writeQ(q);
      } else {
        await new Promise(r => setTimeout(r, 200*Math.pow(2,a) + Math.random()*80));
      }
    }
  }
}

export function flushQueue(endpoint: string) {
  const q = readQ(); 
  if (!q.metrics.length) return;
  writeQ({metrics:[]});
  // best effort, nicht awaiten
  sendMetrics(q, endpoint);
}