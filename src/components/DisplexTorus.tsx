/* eslint-disable @typescript-eslint/no-explicit-any */
/* @typescript-eslint/no-unused-vars */
import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from "three"
import { useControls } from "leva"

const vertex = `
    varying vec3 vPosition;
    varying vec3 vNormal;
    varying vec2 vUv;
    varying vec3 vPattern;

    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uDisplace;
    uniform float uSpread;
    uniform float uNoise;


    #define PI 3.14159265358979
    #define MOD3 vec3(.1031,.11369,.13787)

    vec3 hash33(vec3 p3) {
        p3 = fract(p3 * MOD3);
        p3 += dot(p3, p3.yxz+19.19);
        return -1.0 + 2.0 * fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
    }

    float pnoise(vec3 p) {
        vec3 pi = floor(p);
        vec3 pf = p - pi;
        vec3 w = pf * pf * (3. - 2.0 * pf);
        return 	mix(
                    mix(
                        mix(dot(pf - vec3(0, 0, 0), hash33(pi + vec3(0, 0, 0))),
                            dot(pf - vec3(1, 0, 0), hash33(pi + vec3(1, 0, 0))),
                            w.x),
                        mix(dot(pf - vec3(0, 0, 1), hash33(pi + vec3(0, 0, 1))),
                            dot(pf - vec3(1, 0, 1), hash33(pi + vec3(1, 0, 1))),
                            w.x),
                        w.z),
                    mix(
                        mix(dot(pf - vec3(0, 1, 0), hash33(pi + vec3(0, 1, 0))),
                            dot(pf - vec3(1, 1, 0), hash33(pi + vec3(1, 1, 0))),
                            w.x),
                        mix(dot(pf - vec3(0, 1, 1), hash33(pi + vec3(0, 1, 1))),
                            dot(pf - vec3(1, 1, 1), hash33(pi + vec3(1, 1, 1))),
                            w.x),
                        w.z),
                    w.y);
    }

    void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normal;
        
        float pat = pnoise(vec3(vUv * uNoise , sin(uTime) * 1.4 )) * uDisplace ;
        float proximity = abs(vUv.x - (.5 + sin(uTime)/(12. * uSpread ) ));

        vec3 full = pat * vec3(clamp(.23 * uSpread  - proximity , 0., 1.));
        vec3 newPosition = vPosition + vNormal * full; 

        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
`

const fragment = `
    varying vec3 vPosition;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPattern;

    uniform vec2 uResolution;
    uniform float uTime;
    uniform float uDisplace;
    uniform float uSpread;
    uniform float uNoise;

    #define PI 3.14159265358979
    #define MOD3 vec3(.1031,.11369,.13787)

    vec3 hash33(vec3 p3) {
        p3 = fract(p3 * MOD3);
        p3 += dot(p3, p3.yxz+19.19);
        return -1.0 + 2.0 * fract(vec3((p3.x + p3.y)*p3.z, (p3.x+p3.z)*p3.y, (p3.y+p3.z)*p3.x));
    }
    float pnoise(vec3 p) {
        vec3 pi = floor(p);
        vec3 pf = p - pi;
        vec3 w = pf * pf * (3. - 2.0 * pf);
        return 	mix(
                    mix(
                        mix(dot(pf - vec3(0, 0, 0), hash33(pi + vec3(0, 0, 0))),
                            dot(pf - vec3(1, 0, 0), hash33(pi + vec3(1, 0, 0))),
                            w.x),
                        mix(dot(pf - vec3(0, 0, 1), hash33(pi + vec3(0, 0, 1))),
                            dot(pf - vec3(1, 0, 1), hash33(pi + vec3(1, 0, 1))),
                            w.x),
                        w.z),
                    mix(
                        mix(dot(pf - vec3(0, 1, 0), hash33(pi + vec3(0, 1, 0))),
                            dot(pf - vec3(1, 1, 0), hash33(pi + vec3(1, 1, 0))),
                            w.x),
                        mix(dot(pf - vec3(0, 1, 1), hash33(pi + vec3(0, 1, 1))),
                            dot(pf - vec3(1, 1, 1), hash33(pi + vec3(1, 1, 1))),
                            w.x),
                        w.z),
                    w.y);
    }

    void main() {
        float pat = pnoise(vec3(vUv * uNoise , sin(uTime) * 1.4 )) * uDisplace ;
        float proximity = abs(vUv.x - (.5 + sin(uTime)/(12. * uSpread ) ));

        vec3 full = pat * vec3(clamp(.23 * uSpread  - proximity , 0., 1.));
        vec3 newPosition = vPosition + vNormal * full; 
        vec3 purpleColor = vec3(0.498, 0.2039, 0.8314) / vec3(0.4941, 0.4941, 0.051);
        vec3 color = -vec3(pnoise(vec3(1. - newPosition.z * 35.))*40.) * (.01 -full) * purpleColor;
        gl_FragColor = vec4(color , 1.);
    }
`

export const Torus = () => {
    const torusRef = useRef<THREE.Mesh>(null)

    const { u_Displace, u_Spread, u_Noise } = useControls({ 
        u_Displace: {value: 2, min: 0, max: 2, step: 0.1, label: 'displacement' }, 
        u_Spread: { value: 1.2, min: 0, max: 2, step: 0.1, label: 'spread' },
        u_Noise: { value: 16, min: 10, max: 25, step: 0.1, label: 'noise' },        
      })

    const uniforms: { [uniform: string]: THREE.IUniform<any> } = useMemo(() => ({
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2() },
        uDisplace: { value: u_Displace },
        uSpread: { value: u_Spread },
        uNoise: { value: u_Noise },
    }), []);

    useFrame((state)=>{
        const t = state.clock.getElapsedTime()
        if(torusRef.current){
            const material = torusRef.current.material as THREE.ShaderMaterial
            material.uniforms.uTime.value = t

            material.uniforms.uDisplace.value = u_Displace
            material.uniforms.uSpread.value = u_Spread
            material.uniforms.uNoise.value = u_Noise
        }
    })

    return (
        <>
            <mesh ref={torusRef}>
                <torusGeometry args={[1, 0.3, 100, 100]} />
                <shaderMaterial
                    vertexShader={vertex}
                    fragmentShader={fragment}
                    uniforms={uniforms}
                    side={THREE.DoubleSide}
                />
            </mesh>
            <EffectComposer>
                <Bloom
                    intensity={1.4} // similar to strength
                    luminanceThreshold={0.0001} // similar to threshold
                    luminanceSmoothing={0.01}  // similar to radius
                    height={300} // adjust based on resolution
                />
            </EffectComposer>
        </>
    )
}