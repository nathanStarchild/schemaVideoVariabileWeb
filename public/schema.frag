// precision highp float;
precision mediump float;

// Uniforms
uniform float u_time;
uniform vec2 u_viewport; // change type

const int NUM_COLOURS = 10;
uniform vec3 colours[NUM_COLOURS];

//From Book of Shaders
float random (vec2 _st) {
    return fract(sin(dot(_st.xy,vec2(12.9898,78.233)))*43758.5453123);
}


float triDist(vec2 p) {
	// p.x = abs(p.x);
    
    float c = dot(p, normalize(vec2(1.732, 1.)));
    // c = max(c, p.x);
    c = max(c, -p.y);
    
    return c;
}

float hexDist(vec2 p) {
	p = abs(p);
    
    float c = dot(p, normalize(vec2(1., 1.732)));
    c = max(c, p.x);
    
    return c;
}

vec4 triCoords(vec2 uv) {
    vec2 r = vec2(1., 1.732/2.);
    vec2 h = vec2(r.x/2., 0.5/1.732);

    float shax = step(mod(uv.y, 2.*r.y), r.y);
    float shbx = step(mod(uv.y+3.*h.y, 2.*r.y), r.y);
    vec2 sha = h.x * vec2(shax, 0.);
    vec2 shb = h.x * vec2(shbx, 0.);
    // uv.y += 0.05;
    vec2 uvb = vec2(uv.x, -uv.y);
    vec2 a = mod(uv-sha, r)-h;
    vec2 b = mod(uvb-shb, r)-h;
    // b.y *= -1.;
    // b = a;

    vec2 gv = a;
    float y;
    if (length(a)<length(b)){
        gv = a;
        y = triDist(-gv);
    } else {
        gv = b;
        y = triDist(-gv);
    }

    float x = length(gv);
    y = 0.5-triDist(gv);
    // y = length(b);
    float z = length(gv);
    vec2 id = uv - gv;
    return vec4(x, y, id.x, id.y);
}

vec4 hexCoords(vec2 uv) {
    vec2 r = vec2(1., 1.732);
    vec2 h = r*0.5;

    vec2 a = mod(uv, r) - h;
    vec2 b = mod(uv-h, r) - h;
    // b = a;

    vec2 gv;
    if (length(a)<length(b)){
        gv = a;
    } else {
        gv = b;
    }

    float x = triDist(gv);
    float y = hexDist(gv);
    vec2 id = uv - gv;
    return vec4(x, y, id.x, id.y);
}

void main() {
    // vec2 uv = (gl_FragCoord.xy / u_viewport.y);
    vec2 uv = (gl_FragCoord.xy)  / u_viewport.y;
    vec3 colour = vec3(0.0);

    uv *= 50.;

    vec4 hc = hexCoords(uv);
    vec4 tc = triCoords(uv);

    // colour.rg = hc.xy;

    float edge = 1./1.732;
    // colour *= smoothstep(0.9*edge, edge, hc.x);
    // colour.r = hc.x;
    // colour.r = smoothstep(0.4, 0.5, hc.y);
    // colour.b = smoothstep(0.2, 0.3, tc.x) * smoothstep(0.5, 0.3, tc.x);
    // colour.b = smoothstep(0.1, 0.3, tc.x);
    // colour.r =  smoothstep(0.4, 0.5, tc.y);
    // colour.r = smoothstep(0.2, 0.3, tc.y) * smoothstep(0.5, 0.3, tc.y);
    colour.g = smoothstep(0.15, 0.25, tc.y)*smoothstep(0.3, 0.25, tc.y);
    // colour.r = tc.w/20.;
    // colour.b = tc.z/20.;
    // float c = triDist(uv);
    // float c2 = hexDist(uv);
    // colour.r += step(c, 1./1.732);
    // colour.g += step(c2, 1.);



    gl_FragColor = vec4(colour, 1.0);
}