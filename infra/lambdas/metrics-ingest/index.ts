// Metrics Ingest Lambda (Node.js 20) — accepts POST /metrics payloads
// Safely forwards to CloudWatch PutMetricData with strict dimension allow-list.

import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

const cw = new CloudWatchClient({});
const NS = process.env.METRICS_NS || "Matbakh/Web";
const LOG_LEVEL = process.env.LOG_LEVEL || "info";
const ALLOWED = new Set([
  "Env","AppVersion","Page","DeviceType","ConnectionType","Rating",
  "Bucket","UploadType","ErrorType","QuotaType","SessionId","Metric",
  "Severity","Type","Success"
]);

// Utilities
const log = (lvl: "debug"|"info"|"warn"|"error", msg: string, extra?: any) => {
  if (lvl === "debug" && LOG_LEVEL !== "debug") return;
  // eslint-disable-next-line no-console
  console[lvl === "error" ? "error" : lvl === "warn" ? "warn" : "log"](
    JSON.stringify({ lvl, msg, ...extra ? { extra } : {} })
  );
};

const sha16 = (s: string) => {
  // lightweight hash (not crypto-strong) to anonymize SessionId dimension
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return ("00000000" + h.toString(16)).slice(-8);
};

type InMetric = {
  metricName?: string;
  value?: number;
  unit?: string;
  dimensions?: Record<string,string>;
  timestamp?: string | number | Date;
};

const sanitizeDims = (dims?: Record<string,string>) => {
  const safe = Object.entries(dims || {})
    .filter(([k]) => ALLOWED.has(k))
    .slice(0, 8)
    .map(([Name, Value]) => {
      const v = String(Value ?? "").slice(0, 128);
      return Name === "SessionId" ? { Name, Value: sha16(v) } : { Name, Value: v };
    });
  return safe;
};

const normalizeMetric = (m: InMetric, now: Date) => ({
  MetricName: String(m.metricName ?? "Unknown").slice(0, 128),
  Value: Number(m.value ?? 0),
  Unit: m.unit ?? "Count",
  Timestamp: m.timestamp ? new Date(m.timestamp) : now,
  Dimensions: sanitizeDims(m.dimensions),
  StorageResolution: 60, // standard resolution
});

const chunk20 = <T,>(arr: T[]) => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 20) out.push(arr.slice(i, i + 20));
  return out;
};

// Lambda handler (APIGW HTTP API)
export const handler = async (event: any) => {
  try {
    if (event.requestContext?.http?.method !== "POST") {
      return { statusCode: 405, headers: cors(), body: "Method Not Allowed" };
    }

    // CORS preflight handled by API Gateway config; accept here as well if needed
    if (event.requestContext?.http?.method === "OPTIONS") {
      return { statusCode: 204, headers: cors() };
    }

    if (!event.body) {
      return { statusCode: 400, headers: cors(), body: "Missing body" };
    }

    const body = parseJson(event.body);
    const items: InMetric[] = Array.isArray(body?.metrics) ? body.metrics : [body];

    const now = new Date();
    const metricData = items.map((m) => normalizeMetric(m, now));

    // CloudWatch limit: 20 per PutMetricData
    const chunks = chunk20(metricData);
    for (const chunk of chunks) {
      const cmd = new PutMetricDataCommand({ Namespace: NS, MetricData: chunk });
      await cw.send(cmd);
    }

    return { statusCode: 204, headers: cors() };
  } catch (err: any) {
    log("error", "metrics_ingest_failed", { error: err?.message });
    // Do not leak details to clients
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: "metrics_ingest_failed" }) };
  }
};

// Helpers
const parseJson = (s: string) => {
  try { return JSON.parse(s); } catch { return {}; }
};

const cors = () => ({
  "Access-Control-Allow-Origin": process.env.CORS_ORIGIN || "*",
  "Access-Control-Allow-Headers": "content-type,authorization,x-requested-with",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
});