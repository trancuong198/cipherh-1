/**
 * Test ExistenceAnchor lifecycle
 */
import * as fs from 'fs';
import * as path from 'path';
import { existenceAnchor } from './server/core/existenceAnchor';

const ANCHOR_PATH = path.join(process.cwd(), 'data', 'existence_anchor.json');

console.log('Testing ExistenceAnchor lifecycle...\n');

// Clear existing anchor
if (fs.existsSync(ANCHOR_PATH)) {
  fs.unlinkSync(ANCHOR_PATH);
  console.log('✓ Cleared existing anchor');
}

// Re-initialize
existenceAnchor['initialized'] = false;
existenceAnchor.initialize();

console.log('\n1. BOOTSTRAP PHASE');
console.log('   Reading initial state...');
let anchor = existenceAnchor.getAnchor();
console.log('   ✓ cycle_id:', anchor.last_cycle_id);
console.log('   ✓ cycle_count:', anchor.cycle_count);

if (anchor.last_cycle_id !== 'BOOTSTRAP-00000') {
  console.error('   ✗ FAILED: Expected BOOTSTRAP-00000, got', anchor.last_cycle_id);
  process.exit(1);
}

if (anchor.cycle_count !== 0) {
  console.error('   ✗ FAILED: Expected cycle_count 0, got', anchor.cycle_count);
  process.exit(1);
}

console.log('\n2. START FIRST CYCLE');
const cycle1 = existenceAnchor.startNewCycle();
console.log('   ✓ Generated cycle_id:', cycle1);
anchor = existenceAnchor.getAnchor();
console.log('   ✓ cycle_count:', anchor.cycle_count);

if (cycle1 === 'BOOTSTRAP-00000') {
  console.error('   ✗ FAILED: Cycle ID should not be bootstrap after startNewCycle()');
  process.exit(1);
}

if (anchor.cycle_count !== 1) {
  console.error('   ✗ FAILED: Expected cycle_count 1, got', anchor.cycle_count);
  process.exit(1);
}

// Verify format YYYYMMDD-HHMMSS-00001
const cyclePattern = /^\d{8}-\d{6}-00001$/;
if (!cyclePattern.test(cycle1)) {
  console.error('   ✗ FAILED: Cycle ID format incorrect:', cycle1);
  console.error('   Expected format: YYYYMMDD-HHMMSS-00001');
  process.exit(1);
}

console.log('\n3. START SECOND CYCLE');
const cycle2 = existenceAnchor.startNewCycle();
console.log('   ✓ Generated cycle_id:', cycle2);
anchor = existenceAnchor.getAnchor();
console.log('   ✓ cycle_count:', anchor.cycle_count);

if (anchor.cycle_count !== 2) {
  console.error('   ✗ FAILED: Expected cycle_count 2, got', anchor.cycle_count);
  process.exit(1);
}

// Verify format YYYYMMDD-HHMMSS-00002
const cycle2Pattern = /^\d{8}-\d{6}-00002$/;
if (!cycle2Pattern.test(cycle2)) {
  console.error('   ✗ FAILED: Cycle ID format incorrect:', cycle2);
  console.error('   Expected format: YYYYMMDD-HHMMSS-00002');
  process.exit(1);
}

console.log('\n4. VERIFY PERSISTENCE');
const fileContent = fs.readFileSync(ANCHOR_PATH, 'utf-8');
const persisted = JSON.parse(fileContent);
console.log('   ✓ File exists and is valid JSON');
console.log('   ✓ Persisted cycle_id:', persisted.last_cycle_id);
console.log('   ✓ Persisted cycle_count:', persisted.cycle_count);

if (persisted.cycle_count !== 2) {
  console.error('   ✗ FAILED: Persisted cycle_count should be 2');
  process.exit(1);
}

console.log('\n✅ ALL TESTS PASSED!');
console.log('\nLifecycle verified:');
console.log('  BOOTSTRAP (cycle_id=BOOTSTRAP-00000, count=0)');
console.log(`  → START_CYCLE (cycle_id=${cycle1}, count=1)`);
console.log(`  → START_CYCLE (cycle_id=${cycle2}, count=2)`);
console.log('  → PERSIST (saved to disk)');
