export const onRequestPost = async ({ request }) => {
  const { token } = await request.json();
  const result = {
    token,
    score: { total: 72, google: 68, social: 58, website: 77, other: 70 },
    confidence: 0.82,
    evidence_count: 41,
    actions_top3: [
      { id: "gmb-photos-weekly", roi_hint: "hoch", effort: "niedrig" },
      { id: "ig-short-reels", roi_hint: "mittel", effort: "mittel" },
      { id: "website-opening-hours", roi_hint: "mittel", effort: "niedrig" }
    ]
  };
  return new Response(JSON.stringify(result), { status: 200 });
};