import { createContext, Suspense, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, RoundedBox, useTexture } from '@react-three/drei';
import { CanvasTexture, ClampToEdgeWrapping, SRGBColorSpace } from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SceneBoundary from '../SceneBoundary';
import { projects } from '../../data/projects';

const WorkspaceTimeContext = createContext(null);

gsap.registerPlugin(ScrollTrigger);

function rangeProgress(value, start, end) {
  const t = Math.max(0, Math.min(1, (value - start) / Math.max(0.0001, end - start)));
  return t * t * (3 - 2 * t);
}

function ScrollObject({ children, progress, start = 0, end = 0.5, position = [0, 0, 0], offset = [0, -1.4, -1.2], rotation = [0.5, 0.3, 0], scale = 1 }) {
  const object = useRef(null);
  useFrame(() => {
    if (!object.current) return;
    const t = rangeProgress(progress.current.value, start, end);
    object.current.position.set(position[0] + offset[0] * (1 - t), position[1] + offset[1] * (1 - t), position[2] + offset[2] * (1 - t));
    object.current.rotation.set(rotation[0] * (1 - t), rotation[1] * (1 - t), rotation[2] * (1 - t));
    object.current.scale.setScalar(Math.max(0.001, t * scale));
  });
  return <group ref={object} position={position}>{children}</group>;
}

function SceneLights() {
  return <>
    <ambientLight intensity={1.05} color="#dfe7f2" />
    <directionalLight position={[-3, 5, 6]} intensity={2.1} color="#fff5e7" />
    <pointLight position={[4, 1, 3]} intensity={24} distance={11} color="#7895bd" />
    <pointLight position={[-4, -2, -2]} intensity={14} distance={9} color="#c1ccd9" />
  </>;
}

const projectPositions = [
  [-1.82, -0.02, 0.38],
  [0.02, 1.29, -0.46],
  [1.82, -0.02, 0.05],
  [0.02, -1.56, -0.78],
];

function ProjectScreen({ texture, index, progress }) {
  const root = useRef(null);
  const screenHeight = 1.48;
  const imageAspect = texture.image?.width / texture.image?.height || 1.78;
  const width = screenHeight * Math.min(2.5, Math.max(1.42, imageAspect));
  const height = width / imageAspect;
  const [x, y, z] = projectPositions[index];
  const baseRotationY = index === 0 ? 0.12 : index === 2 ? -0.14 : index === 3 ? 0.06 : -0.04;
  const baseRotationX = index === 1 ? -0.035 : index === 3 ? 0.045 : 0;

  useEffect(() => {
    const panelAspect = width / height;
    const imageRatio = imageAspect;
    texture.colorSpace = SRGBColorSpace;
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    if (imageRatio > panelAspect) {
      texture.repeat.set(panelAspect / imageRatio, 1);
      texture.offset.set((1 - texture.repeat.x) / 2, 0);
    } else {
      texture.repeat.set(1, imageRatio / panelAspect);
      texture.offset.set(0, (1 - texture.repeat.y) / 2);
    }
    texture.needsUpdate = true;
  }, [height, imageAspect, texture, width]);

  useFrame(() => {
    if (!root.current) return;
    const p = progress.current.value;
    const entry = rangeProgress(p, index * 0.1, 0.48 + index * 0.09);
    root.current.position.set(x * (0.52 + entry * 0.48), y - (1 - entry) * (index % 2 ? 1.1 : -1.1), z - (1 - entry) * 1.2);
    root.current.rotation.set(baseRotationX + (1 - entry) * 0.5, baseRotationY + (1 - entry) * (index % 2 ? -0.85 : 0.85) + p * 0.16, 0);
    root.current.scale.setScalar(Math.max(0.001, entry));
  });

  return <group ref={root} position={[x, y, z]} rotation={[baseRotationX, baseRotationY, 0]}>
    <mesh>
      <boxGeometry args={[width + 0.1, height + 0.1, 0.075]} />
      <meshStandardMaterial color="#0b1930" metalness={0.72} roughness={0.24} emissive="#294a76" emissiveIntensity={0.2} />
    </mesh>
    <mesh position={[0, 0, 0.041]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
    <mesh position={[0, height / 2 + 0.054, 0.053]}>
      <boxGeometry args={[width, 0.014, 0.012]} />
      <meshBasicMaterial color="#aabbd1" toneMapped={false} />
    </mesh>
  </group>;
}

function ProjectScreens({ progress }) {
  const textures = useTexture(projects.map((project) => project.screenshot));
  const constellation = useRef(null);
  const { viewport } = useThree();
  useFrame(() => {
    if (!constellation.current) return;
    const p = progress.current.value;
    constellation.current.rotation.y = (p - 0.5) * 0.38;
    constellation.current.rotation.x = (0.5 - p) * 0.12;
  });
  const scale = Math.min(1, viewport.width / 7.45);
  return <group ref={constellation} scale={scale}>
    {textures.map((texture, index) => <ProjectScreen key={projects[index].id} texture={texture} index={index} progress={progress} />)}
  </group>;
}

function ContactPhoneScreen({ progress }) {
  const material = useRef(null);
  const textureData = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return { canvas, texture, context: canvas.getContext('2d') };
  }, []);
  const lastState = useRef(-1);
  useEffect(() => () => textureData.texture.dispose(), [textureData]);
  useFrame(() => {
    const p = progress.current.value;
    const state = Math.floor(p * 100);
    if (lastState.current === state) return;
    const { canvas, context, texture } = textureData;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createLinearGradient(0, 0, 512, 1024);
    gradient.addColorStop(0, '#101d30'); gradient.addColorStop(1, '#1a2939');
    context.fillStyle = gradient; context.fillRect(0, 0, 512, 1024);
    context.fillStyle = '#b9c8db'; context.font = '24px Arial'; context.fillText('09:41', 38, 44);
    context.fillStyle = '#91a5bc'; context.font = '20px Arial'; context.fillText('BUSINESS INQUIRY', 38, 112);
    if (p < 0.44) {
      context.fillStyle = '#eef2f7'; context.font = 'bold 54px Arial'; context.fillText('Calling Syeda Hira...', 38, 220, 430);
      context.fillStyle = '#8fa497'; context.font = '34px Arial'; context.fillText('Incoming business inquiry', 38, 290, 430);
      context.fillStyle = '#71869e'; context.font = '22px Arial'; context.fillText('Mobile • Full Stack • Web', 38, 302);
      context.fillStyle = '#385c77'; context.beginPath(); context.arc(256, 520, 102, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#f0f3f7'; context.font = 'bold 44px Arial'; context.textAlign = 'center'; context.fillText('SH', 256, 535); context.textAlign = 'left';
      context.fillStyle = '#dfe7ef'; context.font = '30px Arial'; context.textAlign = 'center'; context.fillText('Project collaboration', 256, 690); context.textAlign = 'left';
      const callPulse = 48 + Math.sin(p * 150) * 5;
      context.fillStyle = '#738c7d'; context.beginPath(); context.arc(256, 850, callPulse, 0, Math.PI * 2); context.fill();
      context.strokeStyle = '#f5f7f8'; context.lineWidth = 13; context.lineCap = 'round'; context.lineJoin = 'round';
      context.beginPath(); context.moveTo(238, 829); context.lineTo(229, 844); context.quadraticCurveTo(241, 870, 270, 879); context.lineTo(282, 863); context.lineTo(263, 852); context.lineTo(253, 861); context.quadraticCurveTo(242, 855, 239, 842); context.lineTo(247, 834); context.stroke();
      context.fillStyle = '#f5f7f8'; context.font = '21px Arial'; context.textAlign = 'center'; context.fillText('ANSWER CALL', 256, 930); context.textAlign = 'left';
    } else if (p < 0.66) {
      context.fillStyle = '#eef2f7'; context.font = 'bold 48px Arial'; context.textAlign = 'center'; context.fillText('Connected with', 256, 218); context.fillText('Syeda Hira', 256, 278); context.textAlign = 'left';
      context.fillStyle = '#8fa497'; context.font = '30px Arial'; context.textAlign = 'center'; context.fillText('00:12  •  Project collaboration', 256, 330); context.textAlign = 'left';
      context.fillStyle = '#385c77'; context.beginPath(); context.arc(256, 520, 102, 0, Math.PI * 2); context.fill();
      context.fillStyle = '#f0f3f7'; context.font = 'bold 44px Arial'; context.textAlign = 'center'; context.fillText('SH', 256, 535); context.textAlign = 'left';
      context.strokeStyle = '#9baab9'; context.lineWidth = 3; context.beginPath(); context.arc(256, 520, 121, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rangeProgress(p, 0.44, 0.66)); context.stroke();
      context.fillStyle = '#b9c8db'; context.font = '27px Arial'; context.textAlign = 'center'; context.fillText('The call is connected', 256, 760); context.textAlign = 'left';
    } else {
      context.fillStyle = '#eef2f7'; context.font = 'bold 36px Arial'; context.fillText('Conversation', 38, 180);
      const messages = [
        { text: 'Have a project in mind?', y: 300, color: '#294a76', start: 0.66, end: 0.69 },
        { text: "Let's build something", y: 415, color: '#344d48', start: 0.68, end: 0.72 },
        { text: 'extraordinary together.', y: 465, color: '#344d48', start: 0.71, end: 0.75 },
        { text: 'Ready to grow your business?', y: 610, color: '#294a76', start: 0.74, end: 0.78 },
        { text: "Let's connect.", y: 730, color: '#294a76', start: 0.77, end: 0.81 },
      ];
      messages.forEach(({ text, y, color, start, end }, index) => {
        const reveal = rangeProgress(p, start, end);
        if (!reveal) return;
        context.font = '36px Arial';
        const width = Math.min(430, context.measureText(text).width + 44);
        const x = index % 2 ? 42 : 512 - width - 36;
        context.globalAlpha = reveal;
        context.fillStyle = color;
        context.beginPath(); context.roundRect(x, y, width, 68, 22); context.fill();
        context.fillStyle = '#f1f4f6'; context.font = '36px Arial';
        context.fillText(text.slice(0, Math.ceil(text.length * reveal)), x + 22, y + 43);
      });
      context.globalAlpha = 1;
      context.fillStyle = '#b9c8db'; context.font = '21px Arial'; context.fillText('Reply to Syeda Hira…', 42, 930);
    }
    texture.needsUpdate = true;
    lastState.current = state;
  });
  return <mesh position={[0, 0, 0.139]}>
    <planeGeometry args={[1.27, 2.64]} />
    <meshBasicMaterial ref={material} map={textureData.texture} toneMapped={false} />
  </mesh>;
}

function ContactWorkspace({ progress }) {
  const phone = useRef(null);
  const rings = useRef([]);
  const { viewport, camera } = useThree();
  const scale = Math.min(1, viewport.width / 5.1);
  useFrame(({ clock }) => {
    const p = progress.current.value;
    const entry = rangeProgress(p, 0, 0.18);
    const answer = rangeProgress(p, 0.38, 0.6);
    const final = rangeProgress(p, 0.9, 1);
    const turn = rangeProgress(p, 0.82, 0.99);
    if (phone.current) {
      phone.current.position.set(0.16 * answer, -0.52 + 0.34 * entry + 0.58 * answer, -2.45 + 2.1 * entry + 0.08 * answer);
      const ringing = p > 0.2 && p < 0.43 ? Math.sin(clock.elapsedTime * 34) * 0.018 : 0;
      phone.current.rotation.set(0.08 + answer * -0.2, -0.12 + answer * 0.22 + turn * Math.PI * 2, ringing + final * -0.06);
      phone.current.scale.setScalar(Math.max(0.001, entry));
    }
    camera.position.set((p - 0.5) * 0.48 + Math.sin(turn * Math.PI * 2) * 0.72, p * 0.16, 7.35 - rangeProgress(p, 0.38, 0.68) * 0.4 + (1 - Math.cos(turn * Math.PI * 2)) * 0.28);
    camera.lookAt(0, 0.06, 0);
    rings.current.forEach((ring, index) => {
      if (!ring) return;
      const reveal = rangeProgress(p, 0.18 + index * 0.045, 0.34 + index * 0.05);
      const fade = Math.max(0, 1 - rangeProgress(p, 0.39, 0.55));
      const pulse = p > 0.18 && p < 0.44 ? 1 + Math.sin(clock.elapsedTime * 4.4 - index * 0.7) * 0.08 : 1;
      ring.scale.setScalar(Math.max(0.001, reveal * (0.82 + index * 0.2) * pulse));
      ring.material.opacity = reveal * fade * 0.72;
    });
  });
  return <group scale={scale}>
    <mesh position={[0, -1.62, -0.42]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[2.55, 64]} />
      <meshStandardMaterial color="#26374b" metalness={0.55} roughness={0.48} />
    </mesh>
    {[0, 1, 2].map(index => <mesh key={index} ref={node => { rings.current[index] = node; }} position={[0, 0.05, -0.18 - index * 0.06]} rotation={[0.16, 0.08, 0]}>
      <torusGeometry args={[1.12 + index * 0.24, 0.018, 8, 80]} />
      <meshBasicMaterial color={index === 1 ? '#b7c9dd' : '#7897c2'} transparent opacity={0} toneMapped={false} />
    </mesh>)}
    <group ref={phone} position={[0, -0.18, -0.35]}>
      <RoundedBox args={[1.56, 3.12, 0.24]} radius={0.18} smoothness={6} castShadow receiveShadow>
        <meshStandardMaterial color="#aab2bd" metalness={0.88} roughness={0.2} />
      </RoundedBox>
      <RoundedBox args={[1.47, 3.02, 0.2]} radius={0.17} smoothness={6} position={[0, 0, 0.025]}>
        <meshStandardMaterial color="#111923" metalness={0.62} roughness={0.2} />
      </RoundedBox>
      <mesh position={[0, 0, 0.105]}>
        <planeGeometry args={[1.34, 2.78]} />
        <meshBasicMaterial color="#101d30" toneMapped={false} />
      </mesh>
      <ContactPhoneScreen progress={progress} />
      <RoundedBox args={[0.42, 0.08, 0.018]} radius={0.035} smoothness={4} position={[0, 1.42, 0.139]}>
        <meshStandardMaterial color="#090e15" roughness={0.24} />
      </RoundedBox>
      <mesh position={[-0.79, 0.62, 0]}><boxGeometry args={[0.055, 0.38, 0.09]} /><meshStandardMaterial color="#8290a0" metalness={0.82} roughness={0.25} /></mesh>
      <mesh position={[0.79, 0.48, 0]}><boxGeometry args={[0.055, 0.25, 0.09]} /><meshStandardMaterial color="#8290a0" metalness={0.82} roughness={0.25} /></mesh>
      <mesh position={[0.79, 0.12, 0]}><boxGeometry args={[0.055, 0.25, 0.09]} /><meshStandardMaterial color="#8290a0" metalness={0.82} roughness={0.25} /></mesh>
    </group>
    <ContactShadows position={[0, -1.55, -0.2]} opacity={0.32} scale={5.8} blur={2.2} far={3.5} resolution={256} frames={1} />
  </group>;
}

const journeyCode = [
  {
    title: 'HTML · STRUCTURE',
    lines: [
      '<main class="portfolio">',
      '  <section class="intro">',
      '    <h1>Syeda Hira</h1>',
      '    <p>Developer & creator</p>',
      '  </section>',
      '  <ProjectGallery />',
      '</main>',
    ],
  },
  {
    title: 'CSS · EXPERIENCE',
    lines: [
      '.portfolio {',
      '  display: grid;',
      '  gap: clamp(1rem, 3vw, 3rem);',
      '  color: var(--ivory);',
      '}',
      '@media (max-width: 48rem) {',
      '  .portfolio { grid-template: 1fr; }',
      '}',
    ],
  },
  {
    title: 'FULL STACK',
    lines: [
      'export function Portfolio() {',
      '  const projects = useProjects();',
      '  return <Experience data={projects} />;',
      '}',
      'async function saveInquiry(data) {',
      '  return await api.inquiries.create(data);',
      '}',
    ],
  },
];

function JourneyPanel({ position, rotation, index, progress }) {
  const panel = useRef(null);
  const textureData = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 352;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return { canvas, texture, context: canvas.getContext('2d') };
  }, []);
  const lastCount = useRef(-1);
  const source = journeyCode[index].lines.join('\n');

  useEffect(() => () => textureData.texture.dispose(), [textureData]);
  useFrame(() => {
    if (!panel.current) return;
    const p = progress.current.value;
    const t = rangeProgress(p, index * 0.13, 0.52 + index * 0.12);
    panel.current.position.set(position[0] * t, position[1] + (1 - t) * -1.25, position[2] - (1 - t) * 1.6);
    panel.current.rotation.set(rotation[0] + (1 - t) * 0.36, rotation[1] + (1 - t) * (index % 2 ? 0.9 : -0.9), rotation[2]);
    panel.current.scale.setScalar(Math.max(0.001, t));

    const typing = rangeProgress(p, 0.14 + index * 0.12, 0.72 + index * 0.08);
    const count = Math.floor(source.length * typing);
    if (count === lastCount.current) return;
    const { canvas, context, texture } = textureData;
    context.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#0b1930');
    gradient.addColorStop(1, '#192c46');
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#253b58';
    context.fillRect(0, 0, canvas.width, 48);
    ['#d8897c', '#e0c28f', '#91b6a7'].forEach((color, dot) => {
      context.beginPath(); context.fillStyle = color; context.arc(20 + dot * 18, 24, 5, 0, Math.PI * 2); context.fill();
    });
    context.fillStyle = '#bcc3cc';
    context.font = '600 15px Arial, sans-serif';
    context.fillText(journeyCode[index].title, 84, 29);
    context.font = '18px Consolas, ui-monospace, monospace';
    context.textBaseline = 'top';
    let remaining = count;
    journeyCode[index].lines.forEach((line, lineIndex) => {
      const visible = line.slice(0, Math.max(0, Math.min(line.length, remaining)));
      remaining -= line.length + 1;
      context.fillStyle = line.trimStart().startsWith('//') ? '#8294aa'
        : line.includes('function') || line.includes('export') || line.includes('return') ? '#d8c18f'
          : line.includes('<') || line.includes('class') ? '#a7cdbd' : '#d5dfeb';
      context.fillText(visible, 20, 72 + lineIndex * 34);
    });
    if (count < source.length) {
      const typedLines = source.slice(0, count).split('\n');
      const row = Math.min(journeyCode[index].lines.length - 1, typedLines.length - 1);
      context.fillStyle = '#d8c18f';
      context.fillRect(22 + context.measureText(typedLines.at(-1) || '').width, 73 + row * 34, 8, 18);
    }
    texture.needsUpdate = true;
    lastCount.current = count;
  });
  return <group ref={panel} position={position} rotation={rotation}>
    <mesh>
      <boxGeometry args={[2.32, 1.82, 0.16]} />
      <meshStandardMaterial color={index === 1 ? '#243b58' : '#14263d'} metalness={0.62} roughness={0.27} emissive="#294a76" emissiveIntensity={0.14} />
    </mesh>
    <mesh position={[0, 0, 0.086]}>
      <planeGeometry args={[2.16, 1.48]} />
      <meshBasicMaterial map={textureData.texture} toneMapped={false} />
    </mesh>
    <mesh position={[0, -0.79, 0.09]}><boxGeometry args={[0.62, 0.025, 0.018]} /><meshBasicMaterial color="#bcc3cc" /></mesh>
  </group>;
}

function AboutStory({ progress }) {
  const journey = useRef(null);
  const { viewport, camera } = useThree();
  useFrame(() => {
    if (!journey.current) return;
    const p = progress.current.value;
    journey.current.rotation.y = (p - 0.5) * 0.42;
    journey.current.rotation.x = (0.5 - p) * 0.12;
    camera.position.set(-0.35 + p * 0.7, Math.sin(p * Math.PI) * 0.16, 8.6 - rangeProgress(p, 0.25, 0.82) * 0.72);
    camera.lookAt(p * 0.4 - 0.2, 0, 0);
  });
  const scale = Math.min(1, viewport.width / 8.7);
  return <group ref={journey} scale={scale}>
    <JourneyPanel position={[-2.35, 0.16, 0.1]} rotation={[0, 0.14, -0.035]} index={0} progress={progress} />
    <JourneyPanel position={[0, -0.02, -0.35]} rotation={[0, -0.035, 0.015]} index={1} progress={progress} />
    <JourneyPanel position={[2.35, 0.16, 0.02]} rotation={[0, -0.15, -0.035]} index={2} progress={progress} />
    <ScrollObject progress={progress} start={0.12} end={0.8} position={[0, -1.05, -0.6]} offset={[0, -1.4, -0.8]} rotation={[Math.PI / 2 + 0.4, 0, 0]}>
      <mesh>
        <torusGeometry args={[2.9, 0.012, 6, 96]} />
        <meshBasicMaterial color="#667d9e" transparent opacity={0.62} />
      </mesh>
    </ScrollObject>
  </group>;
}

const techTokens = [
  { name: 'HTML5', mark: '5', color: '#e76f42' },
  { name: 'CSS3', mark: '3', color: '#568bd1' },
  { name: 'JavaScript', mark: 'JS', color: '#d8b94e' },
  { name: 'Bootstrap', mark: 'B', color: '#9270c7' },
  { name: 'PHP', mark: 'PHP', color: '#8f9ed2' },
  { name: 'Laravel', mark: 'L', color: '#e66b69' },
  { name: 'MySQL', mark: 'SQL', color: '#72a6ba' },
];

function TechBadge({ token, groupRef }) {
  const textureData = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const context = canvas.getContext('2d');
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    const gradient = context.createLinearGradient(0, 0, 512, 256);
    gradient.addColorStop(0, '#14243a'); gradient.addColorStop(1, '#263b57');
    context.fillStyle = gradient; context.fillRect(0, 0, 512, 256);
    context.fillStyle = token.color; context.font = 'bold 96px Arial, sans-serif'; context.textAlign = 'center';
    context.fillText(token.mark, 256, 126);
    context.fillStyle = '#e7ebef'; context.font = '600 32px Arial, sans-serif'; context.fillText(token.name, 256, 211);
    texture.needsUpdate = true;
    return { texture };
  }, [token]);
  useEffect(() => () => textureData.texture.dispose(), [textureData]);
  return <group ref={groupRef}>
    <RoundedBox args={[1.18, 0.62, 0.18]} radius={0.11} smoothness={4} castShadow receiveShadow>
      <meshStandardMaterial color="#9ba9b9" metalness={0.72} roughness={0.24} />
    </RoundedBox>
    <RoundedBox args={[1.11, 0.55, 0.15]} radius={0.085} smoothness={4} position={[0, 0, 0.025]}>
      <meshStandardMaterial color="#17283e" metalness={0.48} roughness={0.3} emissive={token.color} emissiveIntensity={0.12} />
    </RoundedBox>
    <mesh position={[0, 0, 0.103]}>
      <planeGeometry args={[1.04, 0.48]} />
      <meshBasicMaterial map={textureData.texture} toneMapped={false} />
    </mesh>
    <mesh position={[-0.48, 0.2, 0.11]}>
      <sphereGeometry args={[0.035, 12, 10]} />
      <meshBasicMaterial color={token.color} toneMapped={false} />
    </mesh>
  </group>;
}

function SkillOrbit({ progress }) {
  const network = useRef(null);
  const badges = useRef([]);
  const { viewport, camera } = useThree();
  const scale = Math.min(1, viewport.width / 8.25);
  useFrame(() => {
    if (!network.current) return;
    const p = progress.current.value;
    network.current.rotation.y = (p - 0.5) * 0.54;
    network.current.rotation.x = (0.5 - p) * 0.1;
    const orbit = p * Math.PI * 2;
    badges.current.forEach((badge, index) => {
      if (!badge) return;
      const start = 0.08 + index * 0.055;
      const reveal = rangeProgress(p, start, start + 0.23);
      const angle = orbit + (index / techTokens.length) * Math.PI * 2 - Math.PI / 2;
      const targetX = Math.cos(angle) * 2.72;
      const targetY = Math.sin(angle) * 1.43;
      badge.position.set(targetX * reveal + Math.cos(angle) * (1 - reveal) * 1.25, targetY * reveal + Math.sin(angle) * (1 - reveal) * 1.1, Math.sin(angle) * 0.36);
      badge.rotation.set(Math.sin(angle) * 0.08 * reveal, -network.current.rotation.y, Math.sin(angle) * 0.035);
      badge.scale.setScalar(Math.max(0.001, reveal));
    });
    camera.position.set(Math.sin(p * Math.PI * 2) * 0.34, Math.sin(p * Math.PI * 2) * 0.1, 7.8);
    camera.lookAt(0, 0, 0);
  });
  return <group ref={network} scale={scale}>
    <mesh rotation={[0.22, 0.35, 0]}>
      <torusGeometry args={[2.05, 0.018, 8, 112]} />
      <meshStandardMaterial color="#667d9e" metalness={0.64} roughness={0.25} emissive="#294a76" emissiveIntensity={0.24} />
    </mesh>
    <mesh rotation={[Math.PI / 2 + 0.25, 0.3, 0.12]}>
      <torusGeometry args={[2.06, 0.012, 8, 112]} />
      <meshStandardMaterial color="#bcc3cc" metalness={0.72} roughness={0.22} emissive="#8eabc9" emissiveIntensity={0.18} />
    </mesh>
    <group position={[0, 0, 0.24]}>
      <mesh><cylinderGeometry args={[0.57, 0.57, 0.32, 48, 1, false]} /><meshStandardMaterial color="#233a58" metalness={0.74} roughness={0.24} emissive="#294a76" emissiveIntensity={0.22} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.19]}><torusGeometry args={[0.42, 0.035, 10, 64]} /><meshStandardMaterial color="#bcc3cc" metalness={0.82} roughness={0.2} /></mesh>
      <mesh position={[0, 0, 0.2]}><sphereGeometry args={[0.13, 24, 18]} /><meshStandardMaterial color="#d8d5cb" metalness={0.55} roughness={0.25} emissive="#667d9e" emissiveIntensity={0.45} /></mesh>
      <mesh position={[0, 0, -0.2]}><cylinderGeometry args={[0.45, 0.45, 0.16, 40]} /><meshStandardMaterial color="#101e31" metalness={0.64} roughness={0.3} /></mesh>
    </group>
    {techTokens.map((token, index) => <TechBadge key={token.name} token={token} groupRef={node => { badges.current[index] = node; }} />)}
  </group>;
}

function BookCover({ title, color }) {
  const textureData = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 320;
    const context = canvas.getContext('2d');
    context.fillStyle = color; context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = 'rgba(220,211,190,.7)'; context.lineWidth = 5; context.strokeRect(24, 24, 464, 272);
    context.fillStyle = '#e8e2d5'; context.textAlign = 'center'; context.font = '600 34px Arial, sans-serif'; context.fillText('SYEDA HIRA', 256, 124);
    context.font = '600 26px Arial, sans-serif'; context.fillText(title.toUpperCase(), 256, 177);
    context.fillStyle = '#c7b88f'; context.fillRect(198, 207, 116, 4);
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; texture.needsUpdate = true;
    return { texture };
  }, [color, title]);
  useEffect(() => () => textureData.texture.dispose(), [textureData]);
  return <mesh position={[0, 0.156, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[1.22, 0.82]} />
    <meshBasicMaterial map={textureData.texture} toneMapped={false} />
  </mesh>;
}

function CourseBook({ progress, index, title, color, target, offset }) {
  const rotation = useRef(null);
  useFrame(() => {
    if (!rotation.current) return;
    const p = progress.current.value;
    rotation.current.rotation.y = (index % 2 ? -1 : 1) * rangeProgress(p, 0.1, 0.82) * Math.PI;
    rotation.current.rotation.z = (1 - rangeProgress(p, 0.16 + index * 0.045, 0.58 + index * 0.035)) * (index % 2 ? -0.22 : 0.22);
  });
  return <ScrollObject progress={progress} start={0.08 + index * 0.085} end={0.4 + index * 0.075} position={target} offset={offset} rotation={[0.55 + index * 0.12, index % 2 ? 1.1 : -1.1, 0.28]}>
    <group ref={rotation}>
      <RoundedBox args={[1.5, 0.24, 1.02]} radius={0.055} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#ded8cb" roughness={0.74} />
      </RoundedBox>
      <RoundedBox args={[1.58, 0.075, 1.1]} radius={0.04} smoothness={3} position={[0, 0.14, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} metalness={0.32} roughness={0.36} />
      </RoundedBox>
      <RoundedBox args={[1.58, 0.075, 1.1]} radius={0.04} smoothness={3} position={[0, -0.14, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} metalness={0.32} roughness={0.36} />
      </RoundedBox>
      <RoundedBox args={[0.13, 0.28, 1.08]} radius={0.045} smoothness={3} position={[-0.76, 0, 0]} castShadow>
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.31} />
      </RoundedBox>
      {[0, 1, 2, 3].map(line => <mesh key={line} position={[0.12 + line * 0.025, 0, 0.513]}>
        <boxGeometry args={[0.012, 0.16, 0.008]} /><meshStandardMaterial color="#b6ad9e" roughness={0.78} />
      </mesh>)}
      <BookCover title={title} color={color} />
      <mesh position={[-0.76, 0.04, 0.26]}><boxGeometry args={[0.09, 0.012, 0.025]} /><meshStandardMaterial color="#d7bd91" metalness={0.76} roughness={0.22} /></mesh>
    </group>
  </ScrollObject>;
}

function LearningTimeline({ progress }) {
  const assembly = useRef(null);
  const { viewport, camera } = useThree();
  const scale = Math.min(1, viewport.width / 7.45);
  useFrame(() => {
    if (!assembly.current) return;
    const p = progress.current.value;
    assembly.current.rotation.y = rangeProgress(p, 0.08, 0.84) * Math.PI - 0.14;
    assembly.current.rotation.x = 0.06 + Math.sin(p * Math.PI) * 0.035;
    assembly.current.scale.setScalar(scale * (0.78 + rangeProgress(p, 0.08, 0.5) * 0.22));
    camera.position.set(-0.46 + p * 0.92, Math.sin(p * Math.PI) * 0.16, 8.55 - rangeProgress(p, 0.25, 0.82) * 0.62);
    camera.lookAt(0, 0.05, 0);
  });
  return <group ref={assembly} scale={scale}>
    <mesh position={[0, -1.03, -0.62]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[3.35, 64]} /><meshStandardMaterial color="#1b2e47" metalness={0.5} roughness={0.42} />
    </mesh>
    <mesh position={[0, -0.86, -0.35]}>
      <torusGeometry args={[2.32, 0.022, 8, 96]} /><meshStandardMaterial color="#8eabc9" metalness={0.72} roughness={0.24} emissive="#294a76" emissiveIntensity={0.3} />
    </mesh>
    <CourseBook progress={progress} index={0} title="Foundations" color="#263d5b" target={[-1.68, -0.1, 0.1]} offset={[-2.2, 1.8, 2.2]} />
    <CourseBook progress={progress} index={1} title="Computer Science" color="#526b68" target={[-0.58, 0.48, -0.25]} offset={[2.3, 2.1, -1.6]} />
    <CourseBook progress={progress} index={2} title="Full Stack" color="#8b7059" target={[0.58, -0.08, 0.16]} offset={[-2.5, -1.8, -2]} />
    <CourseBook progress={progress} index={3} title="Experience" color="#334a68" target={[1.68, 0.5, -0.3]} offset={[2.1, -1.6, 2.3]} />
    {[[-2.45, -0.76, 0], [2.45, -0.76, 0]].map(([x, y, z], index) => <mesh key={index} position={[x, y, z]} castShadow>
      <cylinderGeometry args={[0.12, 0.16, 0.32, 24]} /><meshStandardMaterial color="#b7c0ca" metalness={0.82} roughness={0.2} />
    </mesh>)}
  </group>;
}

function AssemblyPiece({ children, target = [0, 0, 0], offset = [0, -1.8, 0], startRotation = [0, 0, 0], delay = 0, duration = 1.2, reducedMotion = false }) {
  const piece = useRef(null);
  const timeline = useContext(WorkspaceTimeContext);
  useFrame(() => {
    if (!piece.current) return;
    const time = reducedMotion ? 9.5 : (timeline?.current?.value || 0) * 9.5;
    const raw = Math.max(0, Math.min(1, (time - delay) / duration));
    const eased = raw * raw * (3 - 2 * raw);
    piece.current.position.set(
      target[0] + offset[0] * (1 - eased),
      target[1] + offset[1] * (1 - eased),
      target[2] + offset[2] * (1 - eased),
    );
    piece.current.rotation.set(startRotation[0] * (1 - eased), startRotation[1] * (1 - eased), startRotation[2] * (1 - eased));
    piece.current.scale.setScalar(Math.max(0.001, eased));
  });
  return <group ref={piece} position={target}>{children}</group>;
}

function CodeDisplay({ reducedMotion }) {
  const material = useRef(null);
  const timeline = useContext(WorkspaceTimeContext);
  const textureData = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 400;
    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return { canvas, texture, context: canvas.getContext('2d') };
  }, []);
  const lastCharacter = useRef(-1);
  const codeLines = useMemo(() => [
    '// syeda-hira / portfolio.tsx',
    "import gsap from 'gsap';",
    "import { Workspace } from './scene';",
    '',
    'export function Experience() {',
    '  return (',
    '    <Portfolio theme="midnight">',
    '      <Hero depth="cinematic">',
    '        <Workspace />',
    '      </Hero>',
    '    </Portfolio>',
    '  );',
    '}',
  ], []);
  const source = codeLines.join('\n');

  useEffect(() => () => textureData.texture.dispose(), [textureData]);
  useFrame(() => {
    const started = 6.2;
    const elapsed = reducedMotion ? 10 : (timeline?.current?.value || 0) * 9.5 - started;
    const typingTime = reducedMotion ? 100 : Math.max(0, elapsed - 0.35);
    const count = Math.min(source.length, Math.floor(typingTime * 100));
    const fade = reducedMotion ? 1 : Math.max(0, Math.min(1, (elapsed - 0.28) / 0.85));
    if (material.current) material.current.opacity = fade;
    if (count === lastCharacter.current || elapsed < 0) return;

    const { context, canvas, texture } = textureData;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#07111f';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#14263d';
    context.fillRect(0, 0, canvas.width, 42);
    ['#d8897c', '#e0c28f', '#91b6a7'].forEach((color, index) => {
      context.beginPath(); context.fillStyle = color; context.arc(22 + index * 18, 21, 5, 0, Math.PI * 2); context.fill();
    });
    context.fillStyle = '#93a5bb';
    context.font = '13px ui-monospace, Consolas, monospace';
    context.fillText('SYEDA HIRA  /  DEVELOPER WORKSPACE', 92, 26);
    context.font = '18px ui-monospace, Consolas, monospace';
    context.textBaseline = 'top';
    let remaining = count;
    codeLines.forEach((line, index) => {
      const visible = line.slice(0, Math.max(0, Math.min(line.length, remaining)));
      remaining -= line.length + 1;
      context.fillStyle = line.trimStart().startsWith('//') ? '#8092a9'
        : line.includes('import') ? '#9bc7b8'
          : line.includes('export') || line.includes('return') ? '#d6bd8f'
            : '#b9cbe0';
      context.fillText(visible, 26, 64 + index * 25);
    });
    if (count < source.length) {
      const cursorRow = Math.min(codeLines.length - 1, source.slice(0, count).split('\n').length - 1);
      const cursorLine = source.slice(0, count).split('\n').at(-1) || '';
      context.fillStyle = '#d7bd91';
      context.fillRect(28 + context.measureText(cursorLine).width, 65 + cursorRow * 25, 9, 17);
    }
    texture.needsUpdate = true;
    lastCharacter.current = count;
  });

  return <mesh position={[0, 0.83, 0.083]} renderOrder={2}>
    <planeGeometry args={[2.66, 1.66]} />
    <meshBasicMaterial ref={material} map={textureData.texture} transparent opacity={0} depthTest={false} depthWrite={false} toneMapped={false} />
  </mesh>;
}

function LaptopHinge({ reducedMotion }) {
  const lid = useRef(null);
  const timeline = useContext(WorkspaceTimeContext);
  useFrame(() => {
    if (!lid.current) return;
    const time = reducedMotion ? 9.5 : (timeline?.current?.value || 0) * 9.5;
    const raw = Math.max(0, Math.min(1, (time - 3.4) / 2.2));
    const ease = raw * raw * (3 - 2 * raw);
    lid.current.rotation.x = Math.PI * 0.49 * (1 - ease) - 0.045 * ease;
  });
  return <group ref={lid} position={[0, 0.17, -0.72]}>
    <RoundedBox args={[2.92, 1.78, 0.12]} radius={0.065} smoothness={3} position={[0, 0.83, 0]} castShadow receiveShadow>
      <meshStandardMaterial color="#111e30" metalness={0.82} roughness={0.24} />
    </RoundedBox>
    <mesh position={[0, 0.83, 0.066]}>
      <planeGeometry args={[2.76, 1.64]} />
      <meshBasicMaterial color="#07111f" toneMapped={false} />
    </mesh>
    <CodeDisplay reducedMotion={reducedMotion} />
    <mesh position={[0, 0.83, 0.088]} renderOrder={3}>
      <planeGeometry args={[2.7, 1.58]} />
      <meshBasicMaterial color="#dbe7f5" transparent opacity={0.035} toneMapped={false} />
    </mesh>
    <mesh position={[0, 0.83, -0.066]}>
      <planeGeometry args={[2.72, 1.58]} />
      <meshBasicMaterial color="#294a76" transparent opacity={0.18} />
    </mesh>
  </group>;
}

function DeveloperLaptop({ reducedMotion }) {
  return <group>
    <AssemblyPiece target={[0, 0.1, -0.32]} offset={[0.4, 1.25, -0.2]} delay={2.1} duration={1.5} startRotation={[0.2, 0.5, -0.18]} reducedMotion={reducedMotion}>
      <RoundedBox args={[3.04, 0.16, 1.72]} radius={0.055} smoothness={3} position={[0, 0, 0.08]} castShadow receiveShadow>
        <meshStandardMaterial color="#26374b" metalness={0.8} roughness={0.25} />
      </RoundedBox>
      <RoundedBox args={[2.76, 0.025, 0.48]} radius={0.045} smoothness={3} position={[0, 0.095, 0.64]}>
        <meshStandardMaterial color="#17263a" metalness={0.66} roughness={0.34} />
      </RoundedBox>
      {Array.from({ length: 48 }, (_, index) => {
        const row = Math.floor(index / 12);
        const column = index % 12;
        return <RoundedBox key={index} args={[0.15, 0.028, 0.074]} radius={0.012} smoothness={2} position={[-1.17 + column * 0.212, 0.118, 0.48 + row * 0.105]}>
          <meshStandardMaterial color={index % 11 === 0 ? '#8293a5' : '#68798d'} metalness={0.5} roughness={0.38} />
        </RoundedBox>;
      })}
      <mesh position={[0, 0.115, 0.9]}>
        <boxGeometry args={[0.04, 0.008, 0.03]} />
        <meshBasicMaterial color="#c8d4e2" />
      </mesh>
      <LaptopHinge reducedMotion={reducedMotion} />
      <mesh position={[0, -0.071, -0.72]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.035, 0.035, 2.76, 16]} />
        <meshStandardMaterial color="#60748c" metalness={0.8} roughness={0.24} />
      </mesh>
    </AssemblyPiece>
  </group>;
}

function DeskBook({ color, target, delay, reducedMotion, index }) {
  return <AssemblyPiece target={target} offset={[-1.8, 1.7, 0.8]} startRotation={[0.35, 0.2, index % 2 ? -0.8 : 0.8]} delay={delay} duration={1.45} reducedMotion={reducedMotion}>
    <RoundedBox args={[1.03, 0.19, 0.78]} radius={0.035} smoothness={2} castShadow receiveShadow>
      <meshStandardMaterial color={color} roughness={0.58} metalness={0.08} />
    </RoundedBox>
    <mesh position={[0, 0, 0.392]}>
      <boxGeometry args={[0.045, 0.15, 0.012]} />
      <meshStandardMaterial color="#c3beb2" roughness={0.72} />
    </mesh>
    <mesh position={[0, 0.098, 0]}>
      <boxGeometry args={[0.91, 0.018, 0.7]} />
      <meshStandardMaterial color="#e6e0d4" roughness={0.78} />
    </mesh>
  </AssemblyPiece>;
}

function CoffeeMug({ reducedMotion }) {
  return <AssemblyPiece target={[2.22, 0.22, 0.36]} offset={[0.7, 1.4, 0.4]} startRotation={[0.2, 0, 0.8]} delay={6.1} duration={1.2} reducedMotion={reducedMotion}>
    <mesh castShadow receiveShadow>
      <cylinderGeometry args={[0.24, 0.2, 0.42, 32, 1, true]} />
      <meshStandardMaterial color="#d8d5cb" roughness={0.26} metalness={0.08} side={2} />
    </mesh>
    <mesh position={[0, 0.205, 0]}>
      <cylinderGeometry args={[0.205, 0.205, 0.012, 32]} />
      <meshStandardMaterial color="#34261e" roughness={0.22} />
    </mesh>
    <mesh position={[0.255, 0.015, 0]} rotation={[0, Math.PI / 2, 0]}>
      <torusGeometry args={[0.15, 0.035, 12, 24]} />
      <meshStandardMaterial color="#c3beb2" roughness={0.3} metalness={0.12} />
    </mesh>
    <mesh position={[0, 0.219, 0]}>
      <torusGeometry args={[0.214, 0.018, 8, 32]} />
      <meshStandardMaterial color="#f0ede7" roughness={0.22} />
    </mesh>
  </AssemblyPiece>;
}

function DeskLamp({ reducedMotion }) {
  return <AssemblyPiece target={[-2.35, 0.12, -0.82]} offset={[-0.8, 1.2, 0]} startRotation={[0.15, 0, -0.65]} delay={6.7} duration={1.35} reducedMotion={reducedMotion}>
    <mesh position={[0, 0.06, 0]} castShadow><cylinderGeometry args={[0.3, 0.34, 0.12, 24]} /><meshStandardMaterial color="#26374b" metalness={0.75} roughness={0.25} /></mesh>
    <mesh position={[0, 0.58, 0]} rotation={[0, 0, -0.18]} castShadow><cylinderGeometry args={[0.035, 0.045, 1.02, 14]} /><meshStandardMaterial color="#8492a0" metalness={0.82} roughness={0.22} /></mesh>
    <mesh position={[0.34, 1.04, 0]} rotation={[0, 0, -0.2]} castShadow><cylinderGeometry args={[0.04, 0.04, 0.72, 14]} /><meshStandardMaterial color="#8492a0" metalness={0.82} roughness={0.22} /></mesh>
    <mesh position={[0.69, 0.82, 0]} rotation={[0, 0, Math.PI]} castShadow>
      <coneGeometry args={[0.28, 0.4, 28, 1, true]} />
      <meshStandardMaterial color="#34475e" metalness={0.63} roughness={0.29} side={2} />
    </mesh>
    <mesh position={[0.69, 0.61, 0]}><circleGeometry args={[0.17, 24]} /><meshBasicMaterial color="#e7d6b9" toneMapped={false} /></mesh>
    <pointLight position={[0.69, 0.55, 0]} intensity={0.8} distance={2.8} color="#e7d6b9" />
  </AssemblyPiece>;
}

function MouseAndKeyboard({ reducedMotion }) {
  return <>
    <AssemblyPiece target={[0, 0.07, 1.12]} offset={[0, 1.2, 0.7]} startRotation={[0.25, 0, -0.2]} delay={5.35} duration={1.2} reducedMotion={reducedMotion}>
      <RoundedBox args={[2.78, 0.09, 0.72]} radius={0.09} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#182536" metalness={0.66} roughness={0.3} />
      </RoundedBox>
      {Array.from({ length: 30 }, (_, index) => {
        const row = Math.floor(index / 10);
        const column = index % 10;
        return <RoundedBox key={index} args={[0.2, 0.036, 0.13]} radius={0.025} smoothness={2} position={[-1.12 + column * 0.25, 0.061, -0.23 + row * 0.22]}>
          <meshStandardMaterial color={index % 8 === 0 ? '#9aa7b5' : '#748499'} metalness={0.36} roughness={0.37} />
        </RoundedBox>;
      })}
      <mesh position={[0, 0.082, 0.29]}><boxGeometry args={[0.26, 0.012, 0.035]} /><meshBasicMaterial color="#c3beb2" /></mesh>
    </AssemblyPiece>
    <AssemblyPiece target={[1.92, 0.13, 1.02]} offset={[0.9, 1.4, 0.4]} startRotation={[0.4, -0.2, 0.5]} delay={6.45} duration={1.15} reducedMotion={reducedMotion}>
      <mesh castShadow receiveShadow scale={[0.72, 0.5, 1]}><sphereGeometry args={[0.27, 28, 20]} /><meshStandardMaterial color="#34475e" metalness={0.48} roughness={0.31} /></mesh>
      <mesh position={[0, 0.128, 0.11]}><boxGeometry args={[0.018, 0.014, 0.18]} /><meshBasicMaterial color="#c3beb2" /></mesh>
    </AssemblyPiece>
  </>;
}

function WorkspaceTimeline({ progress, children }) {
  return <WorkspaceTimeContext.Provider value={progress}>{children}</WorkspaceTimeContext.Provider>;
}

function WorkspaceOrbit({ reducedMotion, active }) {
  const { viewport } = useThree();
  const timeline = useContext(WorkspaceTimeContext);
  const scale = Math.min(1, viewport.width / 7.05);
  useFrame(({ camera, clock }) => {
    if (!active && !reducedMotion) return;
    const p = reducedMotion ? 1 : timeline?.current?.value || 0;
    const buildOrbit = rangeProgress(p, 0.62, 0.97) * Math.PI * 0.12;
    const idleOrbit = p > 0.999 && !reducedMotion ? clock.elapsedTime * 0.055 : 0;
    const angle = reducedMotion ? 0 : buildOrbit + idleOrbit;
    const idle = p > 0.999 && !reducedMotion ? Math.sin(clock.elapsedTime * 0.32) * 0.022 : 0;
    const radius = 10.6;
    camera.position.set(Math.sin(angle) * radius + idle, 3.15 + Math.sin(angle * 2) * 0.18 + idle * 0.55, Math.cos(angle) * radius);
    camera.lookAt(0, 0.05, 0);
  });
  return <group scale={scale}>
    <AssemblyPiece target={[0, -0.17, 0]} offset={[0, -2.2, 0]} delay={0.35} duration={1.8} reducedMotion={reducedMotion}>
      <RoundedBox args={[6.3, 0.22, 3.16]} radius={0.065} smoothness={3} castShadow receiveShadow>
        <meshStandardMaterial color="#56483e" roughness={0.42} metalness={0.12} />
      </RoundedBox>
      <mesh position={[0, -0.133, 0]}><boxGeometry args={[6.16, 0.045, 3.02]} /><meshStandardMaterial color="#8a7460" roughness={0.48} /></mesh>
      <RoundedBox args={[5.72, 0.28, 0.16]} radius={0.035} smoothness={2} position={[0, -0.4, 1.44]} castShadow>
        <meshStandardMaterial color="#28384a" metalness={0.58} roughness={0.34} />
      </RoundedBox>
    </AssemblyPiece>
    {[[-2.7, -0.91, -1.26], [2.7, -0.91, -1.26], [-2.7, -0.91, 1.26], [2.7, -0.91, 1.26]].map((position, index) => <AssemblyPiece key={index} target={position} offset={[0, -1.3, 0]} startRotation={[0.15, 0, index % 2 ? 0.3 : -0.3]} delay={0.88 + index * 0.16} duration={1.25} reducedMotion={reducedMotion}>
      <RoundedBox args={[0.2, 1.36, 0.2]} radius={0.035} smoothness={2} castShadow receiveShadow>
        <meshStandardMaterial color="#26374b" metalness={0.62} roughness={0.32} />
      </RoundedBox>
      <mesh position={[0, -0.66, 0]}><boxGeometry args={[0.24, 0.06, 0.24]} /><meshStandardMaterial color="#9baab9" metalness={0.68} roughness={0.28} /></mesh>
    </AssemblyPiece>)}
    <DeveloperLaptop reducedMotion={reducedMotion} />
    <DeskBook color="#42556c" target={[-1.95, 0.08, 0.45]} delay={4.12} reducedMotion={reducedMotion} index={0} />
    <DeskBook color="#c3beb2" target={[-1.95, 0.29, 0.45]} delay={4.76} reducedMotion={reducedMotion} index={1} />
    <DeskBook color="#667d75" target={[-1.95, 0.5, 0.45]} delay={5.38} reducedMotion={reducedMotion} index={2} />
    <MouseAndKeyboard reducedMotion={reducedMotion} />
    <CoffeeMug reducedMotion={reducedMotion} />
    <DeskLamp reducedMotion={reducedMotion} />
    <mesh position={[0, -1.62, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <shadowMaterial transparent opacity={0.3} />
    </mesh>
  </group>;
}

function DeveloperWorkspace({ active, reducedMotion, progress }) {
  return <>
    <ambientLight intensity={0.7} color="#dfe7f2" />
    <directionalLight position={[-3, 7, 6]} intensity={2.5} color="#fff3df" castShadow shadow-mapSize-width={768} shadow-mapSize-height={768} />
    <directionalLight position={[4, 3, -5]} intensity={1.7} color="#7895bd" />
    <pointLight position={[0, 3, 2]} intensity={20} distance={11} color="#c3beb2" />
    <Suspense fallback={null}>
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={3.1} color="#fff0dc" position={[0, 5, 4]} rotation={[Math.PI / 3, 0, 0]} scale={[5, 3, 1]} />
        <Lightformer form="rect" intensity={2.3} color="#667d9e" position={[-5, 1, 1]} rotation={[0, Math.PI / 2, 0]} scale={[3, 5, 1]} />
        <Lightformer form="rect" intensity={1.8} color="#9baab9" position={[4, 3, -3]} rotation={[0, -Math.PI / 3, 0]} scale={[3, 4, 1]} />
      </Environment>
    </Suspense>
    <WorkspaceTimeline progress={progress}>
      <WorkspaceOrbit reducedMotion={reducedMotion} active={active} />
      <ContactShadows position={[0, -1.58, 0]} opacity={0.28} scale={9} blur={2.4} far={4} resolution={256} frames={1} />
    </WorkspaceTimeline>
  </>;
}

const sceneScrollFactors = {
  about: { desktop: 3.45, mobile: 3.55 },
  projects: { desktop: 3.85, mobile: 4.05 },
  skills: { desktop: 3.55, mobile: 3.7 },
  education: { desktop: 3.65, mobile: 3.8 },
  contact: { desktop: 4.2, mobile: 4.35 },
};

function SceneHost({ kind, reducedMotion = false, started = true }) {
  const container = useRef(null);
  const progress = useRef({ value: reducedMotion ? 1 : 0 });
  const [intersecting, setIntersecting] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const node = container.current;
    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => setIntersecting(entry.isIntersecting), { threshold: 0.05 })
      : null;
    if (node && observer) observer.observe(node);
    progress.current.value = reducedMotion ? 1 : 0;
    if (node) {
      node.dataset.sceneProgress = String(progress.current.value);
      node.dataset.sceneControl = kind === 'home' ? 'autoplay' : 'scroll';
      node.dataset.scenePinned = 'false';
      node.dataset.sceneDistance = '0';
      if (kind === 'home') {
        node.dataset.sceneDuration = '9.5';
        node.dataset.sceneStarted = String(started || reducedMotion);
      }
      if (kind === 'contact') node.dataset.contactStage = progress.current.value >= 0.66 ? 'messages' : 'entering';
      if (kind === 'contact') node.dataset.contactRotationDegrees = '0';
      if (kind === 'skills') node.dataset.skillOrbitDegrees = '0';
      if (kind === 'skills') node.dataset.techLogos = 'HTML5,CSS3,JavaScript,Bootstrap,PHP,Laravel,MySQL';
      if (kind === 'education') node.dataset.bookTurnDegrees = '0';
    }
    let timeline;
    if (!reducedMotion && node && kind === 'home' && started) {
      timeline = gsap.to(progress.current, {
        value: 1,
        duration: 9.5,
        ease: 'none',
        onUpdate: () => { node.dataset.sceneProgress = progress.current.value.toFixed(3); },
      });
    } else if (!reducedMotion && node && kind !== 'home') {
      const playhead = { value: 0 };
      const scrollFactor = sceneScrollFactors[kind];
      const getScrollDistance = () => {
        const multiplier = window.innerWidth < 700 ? scrollFactor.mobile : scrollFactor.desktop;
        const distance = Math.round(window.innerHeight * multiplier);
        node.dataset.sceneDistance = String(distance);
        return distance;
      };
      const updateSceneProgress = () => {
        // The final 15% of the pinned travel is a deliberate hold at the completed state.
        progress.current.value = Math.min(1, playhead.value / 0.85);
        node.dataset.sceneProgress = progress.current.value.toFixed(3);
        if (kind === 'contact') {
          const p = progress.current.value;
          node.dataset.contactStage = p < 0.2 ? 'entering' : p < 0.46 ? 'ringing' : p < 0.68 ? 'connected' : 'messages';
          node.dataset.contactRotationDegrees = String(Math.round(rangeProgress(p, 0.82, 0.99) * 360));
        }
        if (kind === 'skills') node.dataset.skillOrbitDegrees = String(Math.round(progress.current.value * 360));
        if (kind === 'education') node.dataset.bookTurnDegrees = String(Math.round(rangeProgress(progress.current.value, 0.08, 0.84) * 180));
      };
      timeline = gsap.to(playhead, {
        value: 1,
        ease: 'none',
        onUpdate: updateSceneProgress,
        scrollTrigger: {
          trigger: node,
          start: 'top 12%',
          end: () => `+=${getScrollDistance()}`,
          scrub: 0.35,
          pin: node,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          fastScrollEnd: true,
          onToggle: (self) => { node.dataset.scenePinned = String(self.isActive); },
        },
      });
    }
    const updateVisibility = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => { timeline?.scrollTrigger?.kill(); timeline?.kill(); observer?.disconnect(); document.removeEventListener('visibilitychange', updateVisibility); };
  }, [kind, reducedMotion, started]);
  const active = (intersecting || typeof IntersectionObserver === 'undefined') && pageVisible && !reducedMotion;
  const labels = {
    projects: ['FOUR ORIGINAL PROJECT SCREENS', 'Animated 3D scene with the four original project screenshots', 'The original project gallery remains below.'],
    contact: ['INCOMING CALL / CREATIVE COLLABORATION', 'Procedural 3D smartphone with a scroll-controlled call and conversation sequence', 'Contact details remain available below.'],
    home: ['A FULL-STACK WORKSPACE, ASSEMBLED IN REAL TIME', 'Procedural 3D developer desk with an animated laptop and typing code', 'The Home introduction remains available below.'],
    about: ['HTML → CSS → JAVASCRIPT / BACKEND', 'Procedural 3D coding journey with progressive HTML, CSS, JavaScript, and backend code', 'The About story remains available below.'],
    skills: ['A CONNECTED FULL-STACK TOOLKIT', 'HTML5, CSS3, JavaScript, Bootstrap, PHP, Laravel, and MySQL orbit a dimensional core', 'The skills list remains available below.'],
    education: ['LEARN → PRACTICE → BUILD', 'Four dimensional books assemble and turn through their covers, spines, and pages', 'Education and experience details remain available below.'],
  };
  const [caption, ariaLabel, fallbackDetail] = labels[kind];
  const fallbackText = `This ${kind} scene requires WebGL. ${fallbackDetail}`;
  const cameraZ = kind === 'home' ? 10.6 : kind === 'projects' ? 8.7 : kind === 'skills' ? 7.8 : 8.6;
  const cameraFov = kind === 'projects' ? 38 : 40;
  const cameraPosition = kind === 'home' ? [0, 3.15, cameraZ] : [0, 0, cameraZ];

  return <div ref={container} className={`phase1-scene phase1-scene--${kind}`} data-scene-kind={kind} data-scene-active={active}>
    <SceneBoundary fallback={<div className="phase1-scene-fallback" role="status">{fallbackText}</div>}>
      <Canvas
        shadows={kind === 'home'}
        dpr={[1, 1.3]}
        frameloop={active ? 'always' : 'demand'}
        camera={{ position: cameraPosition, fov: cameraFov, near: 0.1, far: 60 }}
        gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
        fallback={<div className="phase1-scene-fallback" role="status">{fallbackText}</div>}
        aria-label={ariaLabel}
      >
        {kind === 'home' ? <DeveloperWorkspace active={active} reducedMotion={reducedMotion} progress={progress} /> : <SceneLights />}
        {kind === 'projects'
          ? <Suspense fallback={null}><ProjectScreens progress={progress} /></Suspense>
          : kind === 'contact'
            ? <ContactWorkspace progress={progress} />
              : kind === 'home'
                ? null
                : kind === 'about'
              ? <AboutStory progress={progress} />
              : kind === 'skills'
                ? <SkillOrbit progress={progress} />
                : <LearningTimeline progress={progress} />}
      </Canvas>
    </SceneBoundary>
    <div className="phase1-scene-caption" aria-hidden="true">
      <span>{caption}</span>
      <span>{reducedMotion ? 'MOTION REDUCED' : kind === 'home' ? 'AUTOMATIC ASSEMBLY / IDLE' : 'SCROLL PROGRESS / REVERSIBLE MOTION'}</span>
    </div>
  </div>;
}

export function ProjectsScene({ reducedMotion }) {
  return <SceneHost kind="projects" reducedMotion={reducedMotion} />;
}

export function HomeWorkspace({ reducedMotion, started }) {
  return <SceneHost kind="home" reducedMotion={reducedMotion} started={started} />;
}

export function ContactScene({ reducedMotion }) {
  return <SceneHost kind="contact" reducedMotion={reducedMotion} />;
}

export function AboutScene({ reducedMotion }) {
  return <SceneHost kind="about" reducedMotion={reducedMotion} />;
}

export function SkillsScene({ reducedMotion }) {
  return <SceneHost kind="skills" reducedMotion={reducedMotion} />;
}

export function EducationScene({ reducedMotion }) {
  return <SceneHost kind="education" reducedMotion={reducedMotion} />;
}
