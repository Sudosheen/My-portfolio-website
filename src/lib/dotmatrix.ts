/**
 * Dot-matrix renderer. Not a font: circles in an SVG, so it costs no bytes of
 * font payload and works at build time (static) and at runtime (clock) alike.
 * Always pair it with real text; the SVG itself is decorative (aria-hidden).
 */

// 5x7 glyphs; ':' and '.' are one column wide, '-' is five.
const FONT: Record<string, string[]> = {
    '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
    '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
    '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
    '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
    '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
    '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    ':': ['0', '0', '1', '0', '1', '0', '0'],
    '.': ['0', '0', '0', '0', '0', '0', '1'],
    '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
    ' ': ['00', '00', '00', '00', '00', '00', '00'],
};

export interface DotMatrixOptions {
    pitch?: number;
    radius?: number;
}

export interface DotMatrixSvg {
    viewBox: string;
    width: number;
    height: number;
    /** Markup for the <svg> children. Glyph groups; ':' gets class "colon". */
    inner: string;
}

export function dotMatrix(text: string, { pitch = 7, radius = 2.5 }: DotMatrixOptions = {}): DotMatrixSvg {
    let x = 0;
    let inner = '';

    for (const ch of text) {
        const glyph = FONT[ch] ?? FONT[' '];
        const cols = glyph[0].length;
        let dots = '';
        for (let row = 0; row < 7; row++) {
            for (let col = 0; col < cols; col++) {
                const on = glyph[row][col] === '1';
                dots += `<circle class="${on ? 'on' : 'off'}" cx="${x + col * pitch + radius}" cy="${row * pitch + radius}" r="${radius}"/>`;
            }
        }
        inner += ch === ':' ? `<g class="colon">${dots}</g>` : `<g>${dots}</g>`;
        x += cols * pitch + pitch;
    }

    const width = Math.max(0, x - 2 * pitch + 2 * radius);
    const height = 6 * pitch + 2 * radius;
    return { viewBox: `0 0 ${width} ${height}`, width, height, inner };
}
