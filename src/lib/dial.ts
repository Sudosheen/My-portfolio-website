/**
 * Position on the solar dial: an ellipse split by the horizon. Sunrise is at the left, the sun
 * climbs the upper arc to sunset at the right, then the moon travels the lower arc back to the
 * next sunrise. `progress` is the 0-1 value from `solarPhase`.
 */
export interface DialGeometry {
    cx: number;
    cy: number;
    rx: number;
    ry: number;
}

export function dialPoint(
    phase: 'day' | 'night',
    progress: number,
    { cx, cy, rx, ry }: DialGeometry,
): { x: number; y: number } {
    const p = Math.max(0, Math.min(1, progress));
    const angle = phase === 'day' ? Math.PI * (1 - p) : -Math.PI * p;
    return { x: cx + rx * Math.cos(angle), y: cy - ry * Math.sin(angle) };
}
