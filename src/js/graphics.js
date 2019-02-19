const renderer=new THREE.WebGLRenderer({
	antialias:             true,
	canvas:                rendererEle,
	alpha:                 true,
	preserveDrawingBuffer: true,
})

const scene=new THREE.Scene()
const camera=new THREE.PerspectiveCamera()
camera.position.set(0,0,15)
camera.lookAt(0,0,0)
// const controls=new THREE.OrbitControls(camera,rendererEle)

const setupRenderer=()=>{
	let viewportWidth=document.body.offsetWidth
	let viewportHeight=document.body.offsetHeight
	let aspectRatio=viewportWidth/viewportHeight

	renderer.setSize(viewportWidth,viewportHeight)
	renderer.setPixelRatio(window.devicePixelRatio)

	// Universal desktop and mobile friendly FOV algorithm
	camera.fov=45*(aspectRatio>1?1:Math.atan(1/aspectRatio)/piBy180/45)
	camera.aspect=aspectRatio
	camera.updateProjectionMatrix()
}
setupRenderer()
window.addEventListener('resize',()=>{ setupRenderer() },true)

const spherePoints=fibonacciSpherePoints(spherePointCount) // Fibonacci Sphere point positions
const sphereTexture=new THREE.DataTexture( // spherePoints[] as a texture for shaders
	spherePoints,
	gpgpuTexWidth,
	gpgpuTexBatchHeight,
	THREE.RGBFormat,
	THREE.FloatType,
)
sphereTexture.needsUpdate=true

const uniforms={
	uColor           :{ value: colors[color]        },
	uCurliness       :{ value: curliness            },
	uDeltaT          :{ value: 0                    },
	uDirection       :{ value: null                 },
	uFadeHardness    :{ value: fadeHardness         },
	uOffset          :{ value: null                 },
	uOpacity         :{ value: .75*particleLifetime },
	uParticleOpacity :{ value: particleOpacity      },
	uParticleSize    :{ value: particleSize         },
	uParticleSpeed   :{ value: particleSpeed        },
	uReactiveness    :{ value: reactiveness         },
	uSphere          :{ value: sphereTexture        },
	uSphereRadius    :{ value: sphereRadius         },
	uTexBatchHeight    :{ value:gpgpuTexBatchHeight     },
	uTime            :{ value: 0                    },
}

// GPGPU - Perform Calculations in GPU & output as texture
const gpuCompute=new GPUComputationRenderer(gpgpuTexWidth,gpgpuTexHeight,renderer)

// Shaders for computing particle positions(offsets),directions
const offsetShader=httpGetText(document.getElementById('gpuComputeOffset').src)
const directionShader=httpGetText(document.getElementById('gpuComputeDirection').src)

// Texture outputs for particle positions(offsets),directions
const offsets=gpuCompute.addVariable('offset',offsetShader,gpuCompute.createTexture())
const directions=gpuCompute.addVariable('direction',directionShader,gpuCompute.createTexture())

offsets.material.uniforms=uniforms
directions.material.uniforms=uniforms

gpuCompute.setVariableDependencies(directions,[offsets])
gpuCompute.setVariableDependencies(offsets,[offsets,directions])

const gpuComputeError=gpuCompute.init()
if(gpuComputeError) console.error(gpuComputeError)

uniforms.uOffset.value=gpuCompute.getCurrentRenderTarget(offsets).texture
uniforms.uDirection.value=gpuCompute.getCurrentRenderTarget(directions).texture

const triangleVertices=new Float32Array([
	 0                 , 1  ,0,
	-0.8660254037844387,-0.5,0,
	 0.8660254037844387,-0.5,0,
])
const faces=[0,1,2]
const geometry=new THREE.InstancedBufferGeometry()
geometry.addAttribute('position',new THREE.Float32BufferAttribute(triangleVertices,3))
geometry.setIndex(faces)

const indices=new Float32Array(particleCount*2)
for(let i=0,j=0;i<particleCount;++i){
	indices[j++]=(i%gpgpuTexWidth+.5)/gpgpuTexWidth
	indices[j++]=(Math.floor(i/gpgpuTexWidth)+.5)/gpgpuTexHeight
}
geometry.addAttribute('aIndex',new THREE.InstancedBufferAttribute(indices,2))
geometry.maxInstancedCount=particleCount

const material=new THREE.ShaderMaterial({
	vertexShader: httpGetText(document.getElementById('vertexShader').src),
	fragmentShader: httpGetText(document.getElementById('fragmentShader').src),
	blending: THREE.AdditiveBlending,
	transparent: true,
	depthTest: false,
	depthWrite: false,
})
// material.wireframe=true
material.uniforms=uniforms

const particles=new THREE.Mesh(geometry,material)
particles.rotation.x=22.5*piBy180
// particles.rotation.z=22.5*piBy180
scene.add(particles)

const circleGeometry=new THREE.Geometry()
for(let i=0;i<100;++i){
	const theta=Math.PI*2*i/100
	circleGeometry.vertices.push(new THREE.Vector3(Math.cos(theta),0,Math.sin(theta)))
}
const lineMaterial=new THREE.LineBasicMaterial({ color: 0x202020 })

const circle1=new THREE.LineLoop(circleGeometry,lineMaterial)
circle1.rotation.set(15*piBy180,0,7.5*piBy180)
circle1.scale.set(4,4,4)
scene.add(circle1)

const circle2=new THREE.LineLoop(circleGeometry,lineMaterial)
circle2.rotation.set(15*piBy180,0,7.5*piBy180)
circle2.scale.set(6,6,6)
scene.add(circle2)

const start=new Date().getTime()/1000 // Timestamp of start
let then=new Date().getTime()/1000    // Timestamp of last frame
let time=0                            // Time since start

const graphicsUpdate=()=>{
	const now=new Date().getTime()/1000
	const deltaT=now-then
	time+=deltaT

	uniforms.uDeltaT.value=1/60
	uniforms.uTime.value=time

	particles.rotation.y-=deltaT/5

	gpuCompute.compute()
	renderer.render(scene,camera)

	then=now
}
