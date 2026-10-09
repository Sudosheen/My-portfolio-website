import { describe, expect, it } from 'vitest';
import { factHtml } from './readout';

describe('factHtml', () => {
    it('wraps live keys and inlines the sha', () => {
        expect(factHtml('Local {time} {zone} · {sha}', { time: '--:--', zone: '' }, 'abc1234')).toBe(
            'Local <span data-live="time">--:--</span> <span data-live="zone"></span> · abc1234',
        );
    });
    it('escapes text and leaves unknown keys alone', () => {
        expect(factHtml('<b> {nope}', {}, 'x')).toBe('&lt;b&gt; {nope}');
    });
});
