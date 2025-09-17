export const onRequestPost = async ({ request }) => {
  const payload = await request.json().catch(() => ({}));
  console.log("[MAIL-SINK]", JSON.stringify(payload));
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
};