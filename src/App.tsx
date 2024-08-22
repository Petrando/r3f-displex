import { useState, Suspense } from 'react'
import { Canvas } from "@react-three/fiber";
import { EffectComposer, Vignette } from "@react-three/postprocessing";
import './App.css'

function App() {

  return (
    <div style={{width: "100vw", height: "100vh"}}>
       <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
        <Suspense fallback={null}>
          <ambientLight />
          <directionalLight />
          <mesh scale={25} position={-1}>
            <planeGeometry />
            <meshStandardMaterial color="#ffffff" />
          </mesh>

          <EffectComposer>
            <Vignette eskil={false} offset={0.3} darkness={0.9} />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}

export default App
