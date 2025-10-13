/**
 * Jest Reporter that fails the build if any tests are skipped or marked as TODO
 * This ensures complete test coverage and prevents accidental skips in CI
 */

class FailOnPendingReporter {
    onRunComplete(contexts, results) {
        const { numPendingTests, numTodoTests } = results;

        if (numPendingTests > 0 || numTodoTests > 0) {
            console.error('\n❌ BUILD FAILED: Skipped or TODO tests detected');
            console.error(`   Skipped tests: ${numPendingTests}`);
            console.error(`   TODO tests: ${numTodoTests}`);
            console.error('\n   All tests must be executed for deployment verification.');
            console.error('   Remove .skip() or .todo() from tests, or implement missing functionality.\n');

            // Set exit code to fail the build
            process.exitCode = 1;
        } else if (numPendingTests === 0 && numTodoTests === 0) {
            console.log('\n✅ No skipped or TODO tests detected - deployment verification passed');
        }
    }
}

module.exports = FailOnPendingReporter;