import { fieldOptions, parseColor } from '../lib/field';
import { onMotion } from './motion';

/**
 * Live contour field (lazy chunk, see field.ts), used by every [data-field-host]: the hero Location
 * tile, the hero backdrop, the sage pods and the section dividers. One WebGL2 fragment shader draws
 * iso-lines of a slowly drifting, domain-warped noise field; the lines can bend around the pointer.
 * Each host tunes it with data-field-* attributes (see lib/field.ts): opacity, zoom, seed, line
 * count, frame rate and render scale, so big surfaces render cheaper. Ambient motion: smooth, but
 * polite. Stopped when offscreen, when the tab is hidden and when motion is off (one still frame
 * stays). If anything fails, the static poster underneath is what you see.
 */

const VERTEX = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPointerOn;
uniform vec3 uLine;
uniform float uAlpha;
uniform float uZoom;
uniform float uSeed;
uniform float uLines;
out vec4 color;

float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
    for (int i = 0; i < 5; i++) {
        v += a * noise(p);
        p = m * p;
        a *= 0.5;
    }
    return v;
}

void main() {
    vec2 st = gl_FragCoord.xy / uRes.y;
    vec2 uv = st * uZoom + vec2(uSeed * 7.31, uSeed * 3.17);
    float t = uTime + uSeed * 40.0;
    vec2 warp = vec2(fbm(uv * 1.1 + vec2(0.0, t * 0.04)), fbm(uv * 1.1 + vec2(5.2, 1.3) - t * 0.03));
    float h = fbm(uv * 1.4 + 1.6 * warp);

    vec2 d = st - uPointer;
    h += uPointerOn * 0.16 * exp(-dot(d, d) * 16.0);

    float f = h * uLines;
    float w = fwidth(f);
    float minor = 1.0 - smoothstep(0.0, w * 1.2, abs(fract(f - 0.5) - 0.5));
    float g = f / 5.0;
    float major = 1.0 - smoothstep(0.0, fwidth(g) * 1.6, abs(fract(g - 0.5) - 0.5));
    float a = max(minor * 0.55, major) * uAlpha;
    color = vec4(uLine * a, a);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return gl.getShaderParameter(shader, gl.COMPILE_STATUS) ? shader : null;
}

function link(gl: WebGL2RenderingContext): WebGLProgram | null {
    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) return null;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

export function startField(tile: HTMLElement, canvas: HTMLCanvasElement): void {
    const options = fieldOptions(tile.dataset);
    const gl = canvas.getContext('webgl2', {
        alpha: true,
        premultipliedAlpha: true,
        antialias: false,
        depth: false,
        powerPreference: 'low-power',
    });
    if (!gl) return;
    const program = link(gl);
    if (!program) return;

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW); // one big triangle
    const position = gl.getAttribLocation(program, 'p');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const u = {
        res: uniform('uRes'),
        time: uniform('uTime'),
        pointer: uniform('uPointer'),
        pointerOn: uniform('uPointerOn'),
        line: uniform('uLine'),
        alpha: uniform('uAlpha'),
        zoom: uniform('uZoom'),
        seed: uniform('uSeed'),
        lines: uniform('uLines'),
    };
    gl.uniform1f(u.zoom, options.zoom);
    gl.uniform1f(u.seed, options.seed);
    gl.uniform1f(u.lines, options.lines);

    // Line colour: the theme's moss, read through a probe so any colour format resolves.
    const probe = document.createElement('i');
    probe.className = 'field-probe';
    probe.setAttribute('aria-hidden', 'true');
    tile.append(probe);
    const readColour = () => {
        const [r, g, b] = parseColor(getComputedStyle(probe).color) ?? [0.23, 0.35, 0.18];
        gl.uniform3f(u.line, r, g, b);
        gl.uniform1f(u.alpha, options.alpha * (document.documentElement.classList.contains('dark-mode') ? 1.15 : 1));
    };

    const ratio = Math.min(options.ratio, window.devicePixelRatio || 1);
    const resize = () => {
        const box = canvas.getBoundingClientRect();
        const w = Math.max(1, Math.round(box.width * ratio));
        const h = Math.max(1, Math.round(box.height * ratio));
        if (canvas.width === w && canvas.height === h) return;
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
        gl.uniform2f(u.res, w, h);
    };

    // Pointer, in the shader's height-normalised units; the bump eases in and out.
    let pointerX = 0;
    let pointerY = 0;
    let pointerOn = 0;
    let pointerTarget = 0;
    if (options.pointer) {
        tile.addEventListener('pointermove', (event) => {
            const box = canvas.getBoundingClientRect();
            pointerX = (event.clientX - box.left) / box.height;
            pointerY = (box.bottom - event.clientY) / box.height;
            pointerTarget = 1;
        });
        tile.addEventListener('pointerleave', () => {
            pointerTarget = 0;
        });
    }

    const born = performance.now();
    const draw = (now = performance.now()) => {
        pointerOn += (pointerTarget - pointerOn) * 0.12;
        gl.uniform1f(u.time, ((now - born) / 1000) % 1000);
        gl.uniform2f(u.pointer, pointerX, pointerY);
        gl.uniform1f(u.pointerOn, pointerOn);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    let running = false;
    let frame = 0;
    let last = 0;
    let visible = false;
    let motion = true;
    let lost = false;

    const loop = (now: number) => {
        frame = requestAnimationFrame(loop);
        if (now - last < 1000 / options.fps) return;
        last = now;
        draw(now);
    };

    const update = () => {
        const run = motion && visible && !document.hidden && !lost;
        if (run && !running) {
            running = true;
            frame = requestAnimationFrame(loop);
        } else if (!run && running) {
            running = false;
            cancelAnimationFrame(frame);
        }
    };

    readColour();
    resize();
    draw(); // first frame right away, then reveal the canvas over the poster
    canvas.hidden = false;
    tile.setAttribute('data-field-ready', '');

    new ResizeObserver(() => {
        resize();
        if (!running) draw();
    }).observe(canvas);
    new MutationObserver(() => {
        readColour();
        if (!running) draw();
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    new IntersectionObserver((entries) => {
        visible = entries.some((e) => e.isIntersecting);
        update();
    }).observe(tile);
    document.addEventListener('visibilitychange', update);
    onMotion((on) => {
        motion = on;
        update();
    });

    canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        lost = true;
        update();
        canvas.hidden = true;
        tile.removeAttribute('data-field-ready');
    });
}
