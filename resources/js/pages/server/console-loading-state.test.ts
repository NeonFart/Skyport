import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const consolePagePath = resolve(import.meta.dirname, 'console.tsx');

test('console shows daemon connectivity messaging while reconnecting', () => {
    const consolePageContents = readFileSync(consolePagePath, 'utf8');

    assert.match(
        consolePageContents,
        /const \[socketError, setSocketError\] = useState<string \| null>\(null\);/,
    );
    assert.match(consolePageContents, /\? 'Cannot reach the daemon'/);
    assert.match(consolePageContents, /\? 'Waiting for connectivity\.\.\.'/);
    assert.match(consolePageContents, /\? 'Cannot reach the daemon…'/);
});
