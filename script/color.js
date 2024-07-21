
//// COLOR STRING FORMATTING ////

// formatting rounds by default; call func(..., false) to prevent rounding of HSL/HSV
const hslStr    = (h,s,l,round=true) => (round) ? `${h.toFixed(0)}, ${(100*s).toFixed(0)}%, ${(100*l).toFixed(0)}%` : `${h}, ${100*s}%, ${100*l}%`;
const hslCssStr = (h,s,l,round=true) => (round) ? `hsl(${h.toFixed(0)},${(100*s).toFixed(0)}%,${(100*l).toFixed(0)}%)` : `hsl(${h},${100*s}%,${100*l}%)`;
const hsvStr    = (h,s,v,round=true) => (round) ? `${h.toFixed(0)}, ${(100*s).toFixed(0)}%, ${(100*v).toFixed(0)}%` : `${h}, ${100*s}%, ${100*v}%`;
const hsvCssStr = (h,s,v,round=true) => (round) ? `hsv(${h.toFixed(0)},${(100*s).toFixed(0)}%,${(100*v).toFixed(0)}%)` : `hsv(${h},${100*s}%,${100*v}%)`;
const rgbStr    = (r,g,b) => `${r.toFixed(0)}, ${g.toFixed(0)}, ${b.toFixed(0)}`;
const rgbCssStr = (r,g,b) => `rgb(${r.toFixed(0)},${g.toFixed(0)},${b.toFixed(0)})`;
const hexStr = hexCssStr = (hex) => {
    if (hex[0] == '#') hex = hex.slice(1);
    // #rgb and #rgba shorthand
    if (hex.length == 3) return '#' + hex[0]+hex[0] + hex[1]+hex[1] + hex[2]+hex[2];
    if (hex.length == 4) return '#' + hex[0]+hex[0] + hex[1]+hex[1] + hex[2]+hex[2] + hex[3]+hex[3];
    // #rrggbb and #rrggbbaa
    if (hex.length == 6) return '#' + hex;
    if (hex.length == 8) return '#' + hex;
};



//// CONVERSION - FROM HSV ////

function hsv2hsl (h,s,v) {
    // https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_HSL

    // optional optimization:
    // L = (V-L) / min(L,1-L) in the wikipedia formula
    // but we can set a breakpoint at L=0.5 to avoid the expensive min() op
        // (L < 0.5) means (L < 1-L) so min(L,1-L) = L
        // (L > 0.5) means (L > 1-L) so min(L,1-L) = 1-L

    const l = v * (1 - s/2); // lightness

    // convert HSV saturation to HSL saturation
    if      (l == 0)     s = 0;                       // L = 0
    else if (l == 1)     s = 0;                       // L = 1
    else if (l>0 && l<1) s = (v-l) / Math.min(l,1-l); // 0 < L < 1

    // // optimized version
    // if      (l == 0)     s = 0;           // L = 0
    // else if (l == 1)     s = 0;           // L = 1
    // else if (l < 0.5)  s = (v-l) / l;     // 0 < L < 0.5  (thus L < 1-L, and min(L,1-L) = L)
    // else if (l >= 0.5) s = (v-l) / (1-l); // 0.5 <= L < 1 (thus L > 1-L, and min(L,1-L) = 1-L)

    return [h,s,l];
}
function hsv2rgb (h,s,v) {
    // https://en.wikipedia.org/wiki/HSL_and_HSV#HSV_to_RGB
    // https://cs.stackexchange.com/questions/64549/convert-hsv-to-rgb-colors
    
    // H'= h/60 in the wikipedia formula (for nicer breakpoints maybe?)
    // but we can sub in (h/60) when calc'ing x, and work with hue directly everywhere else

    const c = v * s; // chroma (largest component)
    const x = c * (1 - Math.abs((h / 60) % 2 - 1)); // second largest component
    const m = v - c; // match value (added to rgb components to match original V)

    let r,g,b;

    // use hue (or H') to assign initial components
    if      (h >=   0 && h <  60) [r,g,b] = [c,x,0]; // 0 <= H' < 1
    else if (h >=  60 && h < 120) [r,g,b] = [x,c,0]; // 1 <= H' < 2
    else if (h >= 120 && h < 180) [r,g,b] = [0,c,x]; // 2 <= H' < 3
    else if (h >= 180 && h < 240) [r,g,b] = [0,x,c]; // 3 <= H' < 4
    else if (h >= 240 && h < 300) [r,g,b] = [x,0,c]; // 4 <= H' < 5
    else if (h >= 300 && h < 360) [r,g,b] = [c,0,x]; // 5 <= H' < 6

    // add match val to get final components and map from [0,1] to [0,255]
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);

    return [r,g,b];
}
function hsv2hex (h,s,v) {
    // bitshift zero-padding trick from https://stackoverflow.com/a/5623914/2849127
    const [r,g,b] = hsv2rgb(h,s,v);
    return "#" + (1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1);
}



//// CONVERSION - TO HSV ////

function hsl2hsv (h,s,l) {
    const v = l + s * Math.min(l,1-l);

    if (v == 0) s = 0;
    else        s = 2 * (1 - l/v);

    return [h,s,v];
}
function rgb2hsv (r,g,b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const min = Math.min(r,g,b); // largest component
    const max = Math.max(r,g,b); // smallest component
    const c = max - min; // chroma

    let h,s,v;

    v = max;

    if (c == 0)        h = 0;
    else if (r == max) h = 60*( (g-b)/c + 6 ) % 360; // +0 deg for baseline red, then +360 % 360 to wrap correctly
    else if (g == max) h = 60*( (b-r)/c + 2 ); // +120 deg for baseline green
    else if (b == max) h = 60*( (r-g)/c + 4 ); // +240 deg for baseline blue

    if (v == 0) s = 0;
    else        s = c / v; // (max-min) / max

    return [h,s,v]; // h on [0,360], s on [0,1], v on [0,1]
}
function hex2hsv (hex) {
    // https://stackoverflow.com/a/5624139
    const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return (rgb)
        ? rgb2hsv(parseInt(rgb[1],16), parseInt(rgb[2],16), parseInt(rgb[3],16))
        : undefined;
}



//// VALIDATION AND PARSING ////

function isValidColor(colorStr) {
    colorStr = colorStr.replaceAll(/\s/g,'').toLowerCase();
    // add support for hex colors without leading "#" since the color picker can handle them, even if CSS3 can't
    if (/^#?[a-f\d]{6}$/.test(colorStr)) return true;
    if (/^#?([a-f\d])([a-f\d])([a-f\d])$/.test(colorStr)) return true;
    // hsv is not natively supported in CSS3, so validate it manually
    if (/^hsv\(\d+\.?\d*(?:rad|deg)?,\d+\.?\d*%,\d+\.?\d*%\)$/.test(colorStr)) return true;
    // CSS3 can natively validate hsl(h,s,l) + hsla(h,s,l,a) + rgb(r,g,b) + rgba(r,g,b,a) + #rrggbb + #rrggbbaa + #rgb + #rgba + all 140 named colors
    let s = new Option().style;
    s.color = colorStr; // will set to "" if color str invalid
    return s.color != '';
}
function asHSV (colorStr) {
    let match;
    colorStr = colorStr.replaceAll(/\s/g,'').toLowerCase();

    match = /^hsv\((\d+\.?\d*)(?:rad|deg)?,(\d+\.?\d*)%,(\d+\.?\d*)%\)$/.exec(colorStr);
    if (match) return [match[1]/1, match[2]/100, match[3]/100]; // h/1 to implicitly type cast as number
    match = /^hsl\((\d+\.?\d*)(?:rad|deg)?,(\d+\.?\d*)%,(\d+\.?\d*)%\)$/.exec(colorStr);
    if (match) return hsl2hsv(match[1]/1, match[2]/100, match[3]/100); // h/1 to implicitly type cast as number
    match = /^rgb\((\d+\.?\d*),(\d+\.?\d*),(\d+\.?\d*)\)$/.exec(colorStr); // CSS3 natively accepts decimal rgb as valid, so we will too
    if (match) return rgb2hsv(match[1], match[2], match[3]); // rgb2hsv() implicitly casts components as numbers
    match = /^#?[a-f\d]{6}$/.exec(colorStr);
    if (match) return hex2hsv(match[0]); // hex2hsv() implicitly casts components as numbers
    match = /^#?([a-f\d])([a-f\d])([a-f\d])$/.exec(colorStr);
    if (match) return hex2hsv('#' + match[1]+match[1] + match[2]+match[2] + match[3]+match[3]); // hex2hsv() implicitly casts components as numbers
}