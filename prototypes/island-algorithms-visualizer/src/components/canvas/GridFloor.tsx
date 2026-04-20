import { useMemo } from "react";
import * as THREE from "three";

interface Props {
  size?: number;
  divisions?: number;
}

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  uniform float uDivisions;

  float gridLine(vec2 uv, float div) {
    vec2 grid = fract(uv * div);
    vec2 line = abs(grid - 0.5) * 2.0;
    float m = max(line.x, line.y);
    float edge = smoothstep(0.96, 1.00, m);
    return edge;
  }

  void main() {
    float g = gridLine(vUv, uDivisions);
    vec2 centered = vUv - 0.5;
    float r = length(centered);
    float fade = smoothstep(0.55, 0.2, r);
    vec3 col = mix(uColor * 0.1, uAccent, g) * fade;
    float alpha = (0.15 + g * 0.85) * fade;
    gl_FragColor = vec4(col, alpha);
  }
`;

export function GridFloor({ size = 40, divisions = 20 }: Props) {
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: {
        uColor: { value: new THREE.Color(0x0d1526) },
        uAccent: { value: new THREE.Color(0x00e5ff) },
        uDivisions: { value: divisions },
      },
    });
  }, [divisions]);

  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -4, 0]} material={material}>
      <planeGeometry args={[size, size, 1, 1]} />
    </mesh>
  );
}
