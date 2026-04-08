import test from 'node:test';
import assert from 'node:assert/strict';

const { detectEditorLanguage } = await import(
    new URL('./file-editor-language.ts', import.meta.url).href
);

test('detectEditorLanguage resolves common server file types', () => {
    assert.equal(detectEditorLanguage('server.properties'), 'ini');
    assert.equal(detectEditorLanguage('plugins/config.yml'), 'yaml');
    assert.equal(detectEditorLanguage('src/main/java/App.java'), 'java');
    assert.equal(detectEditorLanguage('Dockerfile'), 'dockerfile');
    assert.equal(detectEditorLanguage('.env.production'), 'shell');
    assert.equal(detectEditorLanguage('logs/latest.log'), 'plaintext');
    assert.equal(detectEditorLanguage('unknown.custom'), 'plaintext');
});
