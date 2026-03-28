'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function IsoGrid() {
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Dynamically import Three.js to avoid SSR issues
    const loadThreeJS = async () => {
      const THREE = await import('three')
      const { OrbitControls } = await import('three/addons/controls/OrbitControls.js')

      // Scene setup
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      // Get container dimensions for proper sizing
      const rect = canvasRef.current!.getBoundingClientRect()
      renderer.setSize(rect.width, rect.height)
      renderer.setClearColor(0x000000, 0) // Transparent background

      // Position canvas within hero section
      renderer.domElement.style.position = 'absolute'
      renderer.domElement.style.top = '0'
      renderer.domElement.style.left = '0'
      renderer.domElement.style.width = '100%'
      renderer.domElement.style.height = '100%'
      renderer.domElement.style.zIndex = '-1'

      canvasRef.current!.appendChild(renderer.domElement)

      const scene = new THREE.Scene()

      // Camera
      const camera = new THREE.PerspectiveCamera(50, rect.width / rect.height, 0.1, 1000)
      camera.position.set(10, 30, 10)
      camera.lookAt(0, 0, 0)

      const controls = new OrbitControls(camera, renderer.domElement)
      controls.enableDamping = true
      controls.dampingFactor = 0.06
      controls.minDistance = 8
      controls.maxDistance = 80
      controls.enableZoom = false // Disable zoom for background use
      controls.enableRotate = false // Disable rotation for background use

      // Grid variables
      let gridMesh: THREE.LineSegments | null = null
      const segments = 60

      // Uniforms
      const uniforms = {
        uWarp: { value: 0.9 },
        uWave: { value: 0.4 }, // Wave effect set to 40/100
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color(0x04c161) },
        uFade: { value: new THREE.Color(0x025e30) },
      }

      const vertexShader = `
        uniform float uWarp;
        uniform float uWave;
        uniform float uTime;
        varying float vHeight;
        varying vec2  vUv;

        void main() {
          vUv = uv;

          vec2 centered = uv * 2.0 - 1.0;
          float dist = length(centered);

          float bowl   = pow(dist, 2.0) * uWarp * 8.0;
          float ripple = sin(dist * 6.0 - uTime * 3.0) * uWave * 2.0;

          vec3 pos = position;
          pos.y += bowl + ripple;

          vHeight = pos.y;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `

      const fragmentShader = `
        uniform vec3  uColor;
        uniform vec3  uFade;
        varying float vHeight;
        varying vec2  vUv;

        void main() {
          float t = clamp(vHeight / 8.0, 0.0, 1.0);
          vec3 col = mix(uColor, uFade, t * 0.6);

          vec2 edge = abs(vUv * 2.0 - 1.0);
          float fade = 1.0 - smoothstep(0.75, 1.0, max(edge.x, edge.y));

          gl_FragColor = vec4(col, fade * 0.3);
        }
      `

      function buildGrid(segs: number) {
        if (gridMesh) {
          scene.remove(gridMesh)
          gridMesh.geometry.dispose()
          const mat = gridMesh.material as THREE.Material
          mat.dispose()
        }

        const size = 40
        const step = size / segs
        const half = size / 2

        const verts: number[] = []
        const uvs: number[] = []
        const indices: number[] = []

        for (let row = 0; row <= segs; row++) {
          for (let col = 0; col <= segs; col++) {
            const x = col * step - half
            const z = row * step - half
            verts.push(x, 0, z)
            uvs.push(col / segs, row / segs)
          }
        }

        for (let row = 0; row <= segs; row++) {
          for (let col = 0; col <= segs; col++) {
            const i = row * (segs + 1) + col
            if (col < segs) indices.push(i, i + 1)
            if (row < segs) indices.push(i, i + (segs + 1))
          }
        }

        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
        geo.setIndex(indices)

        const mat = new THREE.ShaderMaterial({
          uniforms,
          vertexShader,
          fragmentShader,
          transparent: true,
        })

        gridMesh = new THREE.LineSegments(geo, mat)
        scene.add(gridMesh)
      }

      buildGrid(segments)

      // Animation
      const clock = new THREE.Clock()
      let animationId: number

      function animate() {
        animationId = requestAnimationFrame(animate)
        const t = clock.getElapsedTime()
        const speed = 0.15 // Speed set to 20/100
        if (gridMesh) {
          uniforms.uTime.value = t * speed * 3
        }
        controls.update()
        renderer.render(scene, camera)
      }

      animate()

      // Resize handler
      const handleResize = () => {
        if (!canvasRef.current) return
        const rect = canvasRef.current.getBoundingClientRect()
        camera.aspect = rect.width / rect.height
        camera.updateProjectionMatrix()
        renderer.setSize(rect.width, rect.height)
      }

      window.addEventListener('resize', handleResize)

      // Cleanup function
      return () => {
        window.removeEventListener('resize', handleResize)
        cancelAnimationFrame(animationId)
        if (gridMesh) {
          scene.remove(gridMesh)
          gridMesh.geometry.dispose()
          const mat = gridMesh.material as THREE.Material
          mat.dispose()
        }
        renderer.dispose()
        if (canvasRef.current && renderer.domElement) {
          canvasRef.current.removeChild(renderer.domElement)
        }
      }
    }

    const cleanup = loadThreeJS()

    return () => {
      cleanup.then((cleanupFn) => {
        if (cleanupFn) cleanupFn()
      })
    }
  }, [])

  return (
    <div
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-hidden"
      style={{
        background: 'transparent',
        height: '100vh',
        mask: 'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
        WebkitMask:
          'linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) 60%, rgba(0,0,0,0) 100%)',
      }}
    />
  )
}
