export const flutedGlassVertex = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const flutedGlassFragment = /* glsl */ `
  precision highp float;

  varying vec2 vUv;

  uniform float uTime;
  uniform float uSplitActive;
  uniform float uSplitPosition;
  uniform float uSplitWidth;
  uniform float uSplitAxis;
  uniform float uSplitRipple;
  uniform float uDistortion;
  uniform vec3 uLightPosition;
  uniform float uFill;
  uniform int uPattern;
  uniform vec2 uResolution;
  uniform float uOpacity;
  uniform vec3 uBaseColorA;
  uniform vec3 uBaseColorB;
  uniform vec3 uAccentColor;
  uniform float uGlow;
  uniform float uSplitStyle;
  uniform float uSplitGap;

  #define PI 3.1415926535897932384626433832795

  float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
  }

  vec3 sat(vec3 rgb, float adjustment) {
    const vec3 W = vec3(0.2125, 0.7154, 0.0721);
    vec3 intensity = vec3(dot(rgb, W));
    return mix(intensity, rgb, adjustment);
  }

  float noise(vec2 uv) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  vec3 palette(vec2 uv) {
    float horizon = smoothstep(0.0, 1.0, uv.y);
    vec3 base = mix(uBaseColorA, uBaseColorB, horizon);
    float ribbons = sin((uv.x + uv.y * 0.35) * 10.0 + uTime * 0.25);
    base += ribbons * 0.08 * uAccentColor;
    float glow = smoothstep(0.2, 0.9, uv.y) * 0.18 * uGlow;
    base += glow * uAccentColor;
    float speckle = noise(uv * 24.0 + uTime * 0.1);
    base += (speckle - 0.5) * 0.08;
    return base;
  }

  vec3 sampleBackground(vec2 uv) {
    vec2 warped = uv;
    warped.x += sin((uv.y + uTime * 0.05) * 6.0) * 0.03;
    warped.y += cos((uv.x - uTime * 0.03) * 5.0) * 0.02;
    vec3 color = palette(warped);
    float grid = smoothstep(0.48, 0.5, abs(fract((warped.x + warped.y) * 6.0) - 0.5));
    color += grid * 0.06 * uAccentColor;
    return color;
  }

  vec3 blurSample(vec2 uv, float radius) {
    vec2 texel = vec2(radius) / uResolution;
    vec3 c = sampleBackground(uv) * 0.2;
    c += sampleBackground(uv + vec2(texel.x, 0.0)) * 0.15;
    c += sampleBackground(uv - vec2(texel.x, 0.0)) * 0.15;
    c += sampleBackground(uv + vec2(0.0, texel.y)) * 0.15;
    c += sampleBackground(uv - vec2(0.0, texel.y)) * 0.15;
    c += sampleBackground(uv + texel) * 0.1;
    c += sampleBackground(uv - texel) * 0.1;
    return c;
  }

  void main() {
    vec2 uv = vUv;
    float fluteCount = 35.0;

    float gridCount = uPattern == 3 ? 20.0 : uPattern == 4 ? 100.0 : 20.0;
    float aspectRatio = uResolution.x / uResolution.y;
    vec2 aspectCorrectedUV = vec2(uv.x * aspectRatio, uv.y);
    vec2 staggeredUV = aspectCorrectedUV * gridCount;
    staggeredUV.x += step(1.0, mod(staggeredUV.y, 2.0)) * 0.5;
    vec2 gridPosition = fract(staggeredUV) - 0.5;

    float flutePosition = 0.0;
    if (uPattern == 0) {
      flutePosition = fract(uv.x * fluteCount);
    } else if (uPattern == 1) {
      flutePosition = fract(uv.y * fluteCount);
    } else if (uPattern == 2) {
      flutePosition = fract(uv.x * fluteCount - uv.y * fluteCount);
    }

    float dist = length(gridPosition);
    float bump = smoothstep(0.55, 0.1, dist);

    vec3 normal = vec3(0.0, 0.0, 1.0);
    if (uPattern == 0 || uPattern == 1 || uPattern == 2) {
      normal.x = cos(flutePosition * PI * 2.0) * PI * 0.15;
      normal.y = 0.0;
      normal.z = sqrt(max(1.0 - normal.x * normal.x, 0.0));
      normal = normalize(normal);
    }

    if (uPattern == 3 || uPattern == 4) {
      normal.xy = gridPosition * bump * 2.0;
      normal.z = sqrt(1.0 - clamp(dot(normal.xy, normal.xy), 0.0, 1.0));
      normal = normalize(normal);
    }

    vec3 lightDir = normalize(uLightPosition);
    float diffuse = max(dot(normal, lightDir), 0.0);
    float specular = pow(max(dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0), 32.0);

    float splitAxisCoord = uSplitAxis < 0.5 ? uv.x : uv.y;
    float splitDistance = abs(splitAxisCoord - uSplitPosition);
    float splitRate = smoothstep(uSplitWidth, max(uSplitWidth * 0.2, 0.002), splitDistance);
    float splitGlow = (1.0 - splitRate) * uSplitActive;
    float splitRippleValue = sin((splitDistance * 25.0 - uTime * 2.0)) * 0.25;

    vec2 splitDistortion = vec2(0.0);
    if (splitGlow > 0.01) {
      float rippleSpread = splitGlow * 0.04 + splitRippleValue * uSplitRipple * 0.02;
      if (uSplitAxis < 0.5) {
        splitDistortion = vec2(rippleSpread * sign(uSplitPosition - uv.x), rippleSpread * 0.5);
      } else {
        splitDistortion = vec2(rippleSpread * 0.5, rippleSpread * sign(uSplitPosition - uv.y));
      }
    }

    vec2 baseDistorted = uv + normal.xy * (uDistortion * 0.1);
    vec2 distortedUV = baseDistorted + splitDistortion;

    vec3 baseColor = sampleBackground(uv);

    if (uv.x < uFill) {
      float frost = noise(distortedUV * 45.0 + uTime * 0.2);
      vec2 jitter = vec2(frost - 0.5) * 0.01;
      vec3 blurred = blurSample(distortedUV + jitter, 8.0);

      vec3 color;
      color.r = blurSample(distortedUV + jitter + vec2(uDistortion * 0.002, 0.0), 6.0).r;
      color.g = blurred.g;
      color.b = blurSample(distortedUV + jitter - vec2(uDistortion * 0.002, 0.0), 6.0).b;

      float ambient = 0.55;
      color *= (ambient + diffuse * 0.5);
      color += specular * 0.08 * uAccentColor;
      color = sat(color, 1.1);

      gl_FragColor = vec4(color, uOpacity);
    } else {
      gl_FragColor = vec4(baseColor, uOpacity);
    }

    float ripple = abs(splitRippleValue) * uSplitRipple;
    float core = smoothstep(max(uSplitWidth * 0.35, 0.002), 0.0, splitDistance);
    float halo = smoothstep(max(uSplitWidth * 1.6, 0.006), max(uSplitWidth * 0.35, 0.002), splitDistance);
    float splitOverlay = clamp(core * 0.9 + halo * 0.5 + ripple * 0.25, 0.0, 1.0) * uSplitActive;

    vec3 liquidTint = mix(uAccentColor, vec3(1.0, 0.65, 0.45), 0.35);
    vec3 neonTint = mix(uAccentColor, vec3(1.0, 0.2, 0.7), 0.55);
    float liquidStrength = clamp(core * 0.95 + halo * 0.6 + ripple * 0.35, 0.0, 1.0);
    float neonStrength = clamp(core * 1.1 + halo * 0.75 + ripple * 0.55, 0.0, 1.0);

    vec3 splitTint = uSplitStyle < 0.5 ? uAccentColor : (uSplitStyle < 1.5 ? liquidTint : neonTint);
    float splitStrength = uSplitStyle < 0.5 ? splitOverlay : (uSplitStyle < 1.5 ? liquidStrength : neonStrength);
    gl_FragColor.rgb = mix(gl_FragColor.rgb, splitTint, splitStrength);

    float gapMask = smoothstep(uSplitWidth, 0.0, splitDistance) * uSplitGap;
    gl_FragColor.a *= (1.0 - gapMask);
  }
`;
