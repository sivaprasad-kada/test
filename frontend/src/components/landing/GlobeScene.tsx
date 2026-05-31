import { useRef, useMemo, useEffect, MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

// ──────────────────────────────────────────────
// Wireframe Globe
// ──────────────────────────────────────────────
const WireframeGlobe = ({
  mouseInfluence,
}: {
  mouseInfluence: MutableRefObject<{ x: number; y: number }>;
}) => {
  const meshRef = useRef<THREE.Mesh>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.12 + mouseInfluence.current.x * 0.3;
      meshRef.current.rotation.x = mouseInfluence.current.y * 0.15;
    }
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.06 + Math.sin(t * 0.8) * 0.02;
    }
  });

  return (
    <group>
      {/* Outer soft glow sphere */}
      <mesh ref={glowRef} scale={1.08}>
        <sphereGeometry args={[2.6, 32, 32]} />
        <meshBasicMaterial
          color="#3b82f6"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
        />
      </mesh>
      {/* Wireframe globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2.6, 48, 48]} />
        <meshBasicMaterial
          color="#2563eb"
          wireframe
          transparent
          opacity={0.32}
        />
      </mesh>
    </group>
  );
};

// ──────────────────────────────────────────────
// Glowing Particle Field
// ──────────────────────────────────────────────
const Particles = () => {
  const pointsRef = useRef<THREE.Points>(null!);
  const COUNT = 240;

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    const col = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = 2.6 + Math.random() * 0.9;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);

      const brightness = 0.55 + Math.random() * 0.45;
      col[i * 3] = 0.15 * brightness;
      col[i * 3 + 1] = 0.45 * brightness;
      col[i * 3 + 2] = brightness;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!pointsRef.current) return;
    const t = clock.getElapsedTime();
    pointsRef.current.rotation.y = t * 0.07;
    pointsRef.current.rotation.x = Math.sin(t * 0.05) * 0.05;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  );
};

// ──────────────────────────────────────────────
// Orbit Ring
// ──────────────────────────────────────────────
const OrbitRing = ({
  radius,
  speed,
  tilt,
  color,
}: {
  radius: number;
  speed: number;
  tilt: number;
  color: string;
}) => {
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.getElapsedTime() * speed;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.004, 8, 96]} />
      <meshBasicMaterial color={color} transparent opacity={0.28} />
    </mesh>
  );
};

// ──────────────────────────────────────────────
// Animated Connection Lines
// ──────────────────────────────────────────────
const ConnectionLines = () => {
  const linesRef = useRef<THREE.LineSegments>(null!);

  const geometry = useMemo(() => {
    const pts: number[] = [];
    const nodeCount = 12;
    const nodes: THREE.Vector3[] = [];

    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = 2 * Math.PI * Math.random();
      const r = 2.62;
      nodes.push(
        new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        )
      );
    }

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 1.5) {
          pts.push(nodes[i].x, nodes[i].y, nodes[i].z);
          pts.push(nodes[j].x, nodes[j].y, nodes[j].z);
        }
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(new Float32Array(pts), 3)
    );
    return geo;
  }, []);

  useFrame(({ clock }) => {
    if (!linesRef.current) return;
    const t = clock.getElapsedTime();
    linesRef.current.rotation.y = t * 0.09;
    linesRef.current.rotation.x = Math.sin(t * 0.05) * 0.04;
    const mat = linesRef.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.2 + Math.sin(t * 0.6) * 0.08;
  });

  return (
    <lineSegments ref={linesRef} geometry={geometry}>
      <lineBasicMaterial color="#3b82f6" transparent opacity={0.25} />
    </lineSegments>
  );
};

// ──────────────────────────────────────────────
// Floating URL Billboard (Three.js sprite approach)
// ──────────────────────────────────────────────
const FloatingURLSprite = ({
  text,
  baseAngle,
  radius,
  height,
  speed,
}: {
  text: string;
  baseAngle: number;
  radius: number;
  height: number;
  speed: number;
}) => {
  const spriteRef = useRef<THREE.Sprite>(null!);

  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext("2d")!;

    // Background pill
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    const r = 16;
    const x = 0, y = 0, w = canvas.width, h = canvas.height;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    // Border
    ctx.strokeStyle = "rgba(37,99,235,0.25)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text
    ctx.fillStyle = "#2563EB";
    ctx.font = "bold 24px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, [text]);

  useFrame(({ clock }) => {
    if (!spriteRef.current) return;
    const t = clock.getElapsedTime();
    const angle = baseAngle + t * speed;
    spriteRef.current.position.x = Math.cos(angle) * radius;
    spriteRef.current.position.z = Math.sin(angle) * radius;
    spriteRef.current.position.y = height + Math.sin(t * 0.5 + baseAngle) * 0.12;
  });

  return (
    <sprite ref={spriteRef} scale={[1.4, 0.35, 1]}>
      <spriteMaterial map={texture} transparent depthWrite={false} />
    </sprite>
  );
};

// ──────────────────────────────────────────────
// Main Scene (inside Canvas)
// ──────────────────────────────────────────────
const Scene = ({
  mouseInfluence,
}: {
  mouseInfluence: MutableRefObject<{ x: number; y: number }>;
}) => {
  return (
    <>
      <ambientLight intensity={0.2} />
      <pointLight position={[4, 4, 4]} color="#3b82f6" intensity={2} />
      <pointLight position={[-4, -2, -4]} color="#2563eb" intensity={1} />

      <WireframeGlobe mouseInfluence={mouseInfluence} />
      <Particles />
      <ConnectionLines />

      {/* Orbit rings at different tilts */}
      <OrbitRing radius={3.0} speed={0.18} tilt={Math.PI / 4} color="#3b82f6" />
      <OrbitRing radius={3.5} speed={-0.12} tilt={Math.PI / 2.8} color="#2563eb" />

      {/* Floating URLs as canvas-texture sprites */}
      <FloatingURLSprite text="short.ly/abc" baseAngle={0} radius={3.2} height={0.5} speed={0.22} />
      <FloatingURLSprite text="go.link/x92" baseAngle={2.1} radius={3.1} height={-0.4} speed={-0.18} />
      <FloatingURLSprite text="app.io/demo" baseAngle={4.2} radius={3.4} height={0.8} speed={0.15} />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        enableRotate={false}
      />
    </>
  );
};

// ──────────────────────────────────────────────
// Exported Globe Scene
// ──────────────────────────────────────────────
const GlobeScene = () => {
  const mouseInfluence = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null!);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
      mouseInfluence.current = { x: x * 0.6, y: y * 0.4 };
    };

    const handleMouseLeave = () => {
      mouseInfluence.current = { x: 0, y: 0 };
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 55 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <Scene mouseInfluence={mouseInfluence} />
      </Canvas>
    </div>
  );
};

export default GlobeScene;
