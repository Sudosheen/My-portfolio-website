import { describe, expect, it } from 'vitest';
import { fieldAllowed, fieldOptions, parseColor } from './field';

describe('contour field helpers', () => {
    it('parses computed colours in the forms browsers return', () => {
        expect(parseColor('rgb(58, 90, 46)')).toEqual([58 / 255, 90 / 255, 46 / 255]);
        expect(parseColor('rgba(237, 232, 218, 1)')).toEqual([237 / 255, 232 / 255, 218 / 255]);
        expect(parseColor('rgb(168 208 141 / 1)')).toEqual([168 / 255, 208 / 255, 141 / 255]);
        expect(parseColor('#3a5a2e')).toEqual([0x3a / 255, 0x5a / 255, 0x2e / 255]);
        expect(parseColor('#fff')).toEqual([1, 1, 1]);
        expect(parseColor('transparent')).toBeNull();
    });

    it('runs only with motion on, without data saving, on capable devices', () => {
        expect(fieldAllowed({ motion: true })).toBe(true);
        expect(fieldAllowed({ motion: false })).toBe(false);
        expect(fieldAllowed({ motion: true, saveData: true })).toBe(false);
        expect(fieldAllowed({ motion: true, deviceMemory: 2 })).toBe(false);
        expect(fieldAllowed({ motion: true, deviceMemory: 8 })).toBe(true);
    });
});

describe('fieldOptions', () => {
    it('has sensible defaults', () => {
        expect(fieldOptions({})).toEqual({ alpha: 0.3, zoom: 1, seed: 0, lines: 16, fps: 30, ratio: 1.5, pointer: true });
    });

    it('reads and clamps data attributes', () => {
        const o = fieldOptions({ fieldAlpha: '0.5', fieldZoom: '0.45', fieldSeed: '3', fieldFps: '20', fieldRatio: '0.6', fieldPointer: 'off' });
        expect(o).toMatchObject({ alpha: 0.5, zoom: 0.45, seed: 3, fps: 20, ratio: 0.6, pointer: false });
        expect(fieldOptions({ fieldAlpha: '9', fieldFps: '1000', fieldRatio: 'x', fieldZoom: '' })).toMatchObject({ alpha: 1, fps: 60, ratio: 1.5, zoom: 1 });
    });
});

