// Quick debug test
const { evaluateScoreTrend } = require('./src/lib/recommendation/recommendationTrigger.ts');

// Test data similar to the test
const flatScores = Array.from({ length: 30 }, (_, i) => ({
  id: `flat-${i}`,
  business_id: 'test-business',
  score_type: 'overall_visibility',
  score_value: 65 + (Math.random() - 0.5) * 2, // ±1 point variation
  date: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  calculated_at: new Date().toISOString(),
  source: 'test',
  meta: {}
}));

console.log('Flat scores sample:', flatScores.slice(0, 3));
console.log('Score range:', Math.min(...flatScores.map(s => s.score_value)), '-', Math.max(...flatScores.map(s => s.score_value)));

const result = evaluateScoreTrend(flatScores);
console.log('Result:', result);