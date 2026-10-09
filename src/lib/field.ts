/** Pure helpers for the live contour field (src/scripts/contour-field.ts). */

/** "rgb(58, 90, 46)", "rgba(58 90 46 / 1)" or "#3a5a2e" -> [r, g, b] in 0-1, or null. */
export function parseColor(value: string): [number, number, number] | null {
    const v = value.trim();
    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
    if (hex) {
        const h = hex[1].length === 3 ? [...hex[1]].map((c) => c + c).join('') : hex[1];
        return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number];
    }
    const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(v);
    if (rgb) return [rgb[1], rgb[2], rgb[3]].map((n) => Math.min(255, Number(n)) / 255) as [number, number, number];
    return null;
}

export interface FieldEnvironment {
    motion: boolean;
    /** navigator.connection.saveData, where the browser exposes it. */
    saveData?: boolean;
    /** navigator.deviceMemory in GB, where the browser exposes it. */
    deviceMemory?: number;
}

/**
 * Whether the animated field may run at all; otherwise the static contour poster stays.
 * Respect motion off and data saving; skip low-memory devices (only Chromium reports memory).
 */
export function fieldAllowed({ motion, saveData, deviceMemory }: FieldEnvironment): boolean {
    if (!motion || saveData) return false;
    return deviceMemory === undefined || deviceMemory >= 4;
}

export interface FieldOptions {
    /** Line opacity (light theme; dark is boosted slightly). */
    alpha: number;
    /** Feature size: below 1 zooms in (broader shapes, fewer lines), above 1 zooms out. */
    zoom: number;
    /** Offsets the noise and the clock, so hosts on one page do not draw the same terrain. */
    seed: number;
    /** Contour lines across the field's full height range. */
    lines: number;
    /** Frame-rate cap. */
    fps: number;
    /** Render scale relative to CSS pixels (capped by the device pixel ratio); below 1 is cheaper. */
    ratio: number;
    /** Whether the lines bend around the pointer. */
    pointer: boolean;
}

const number = (value: string | undefined, fallback: number): number => {
    if (value === undefined || value.trim() === '') return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
};

/** Reads a host's data-field-* attributes (dataset keys: fieldAlpha, fieldZoom, ...). */
export function fieldOptions(data: Record<string, string | undefined>): FieldOptions {
    return {
        alpha: Math.min(1, Math.max(0, number(data.fieldAlpha, 0.3))),
        zoom: Math.max(0.1, number(data.fieldZoom, 1)),
        seed: number(data.fieldSeed, 0),
        lines: Math.max(2, number(data.fieldLines, 16)),
        fps: Math.min(60, Math.max(5, number(data.fieldFps, 30))),
        ratio: Math.min(2, Math.max(0.25, number(data.fieldRatio, 1.5))),
        pointer: data.fieldPointer !== 'off',
    };
}
