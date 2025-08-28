export function toCSV(rows: any[], delimiter = ",") {
  if (!rows?.length) return "";
  
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  
  const head = headers.map(esc).join(delimiter);
  const body = rows.map(r => headers.map(h => esc(r[h])).join(delimiter)).join("\n");
  
  return head + "\n" + body;
}