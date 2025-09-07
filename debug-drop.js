// Debug the exact threshold test
const exactThresholdScores = [
  {
    id: 'exact-1',
    business_id: 'test-business',
    score_type: 'overall_visibility',
    score_value: 100,
    date: '2025-01-01',
    calculated_at: new Date().toISOString(),
    source: 'test',
    meta: {}
  },
  {
    id: 'exact-2',
    business_id: 'test-business',
    score_type: 'overall_visibility',
    score_value: 80,
    date: '2025-01-15',
    calculated_at: new Date().toISOString(),
    source: 'test',
    meta: {}
  }
];

const firstScore = exactThresholdScores[0].score_value; // 100
const currentScore = exactThresholdScores[1].score_value; // 80
const absoluteChange = currentScore - firstScore; // 80 - 100 = -20
const relativeChange = firstScore > 0 ? (firstScore - currentScore) / firstScore : 0; // (100 - 80) / 100 = 0.2

console.log('First score:', firstScore);
console.log('Current score:', currentScore);
console.log('Absolute change:', absoluteChange);
console.log('Relative change:', relativeChange);
console.log('Drop threshold:', 0.2);
console.log('Should trigger:', relativeChange >= 0.2 && absoluteChange < 0);
console.log('Condition 1 (relativeChange >= 0.2):', relativeChange >= 0.2);
console.log('Condition 2 (absoluteChange < 0):', absoluteChange < 0);