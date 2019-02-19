// TODO
// Icon

const colors={
	blue   :new Float32Array([.075,.3,1]),
	orange :new Float32Array([1,.225,.075]),
	red    :new Float32Array([1,.15,.05]),
}

gpgpuTexWidth   =1*getUrlParam('gpgpuTexWidth')
spherePointCount=1*getUrlParam('spherePointCount')
particleLifetime=1*getUrlParam('particleLifetime')
emitFrequency   =1*getUrlParam('emitFrequency')

color           =  getUrlParam('color')
curliness       =1*getUrlParam('curliness')
fadeHardness    =1*getUrlParam('fadeHardness')
particleSize    =1*getUrlParam('particleSize')
particleSpeed   =1*getUrlParam('particleSpeed')
particleOpacity =1*getUrlParam('particleOpacity')
reactiveness    =1*getUrlParam('reactiveness')
sphereRadius    =1*getUrlParam('sphereRadius')

// Compile time parameters
gpgpuTexWidth   ||(gpgpuTexWidth   =2048)
spherePointCount||(spherePointCount=gpgpuTexWidth*20)
particleLifetime||(particleLifetime=.5) // Sec
emitFrequency   ||(emitFrequency   =20) // Emits per sec

// NOTE:
// - spherePointCount must be a multiple of gpgpuTexWidth
// - particleLifetime*emitFrequency must be a whole number

// Run time parameters
color          ||(color          ='orange')
curliness      ||(curliness      =1.5)
fadeHardness   ||(fadeHardness   =1)
particleSize   ||(particleSize   =.05)
particleSpeed  ||(particleSpeed  =.25)
particleOpacity||(particleOpacity=.375)
reactiveness   ||(reactiveness   =.25)
sphereRadius   ||(sphereRadius   =2)

// Initializing Constants
const rendererEle        =document.getElementById('renderer')
const batchCount         =particleLifetime*emitFrequency // Particle are emitted in 'batches'
const gpgpuTexBatchHeight=spherePointCount/gpgpuTexWidth
const gpgpuTexHeight     =gpgpuTexBatchHeight*batchCount
const particleCount      =spherePointCount*particleLifetime*emitFrequency
const emitInterval       =1/emitFrequency

// Setup dat.gui
let gui
const setupGui=()=>{
	gui=new dat.GUI()

	const color_          =gui.add(window,'color',Object.keys(colors)).name('Color').onChange(v=>uniforms.uColor.value=colors[v])
	const curliness_      =gui.add(uniforms.uCurliness,'value',0,2).name('Curliness').step(.01)
	const fadeHardness_   =gui.add(uniforms.uFadeHardness,'value',1,2).name('Fade Hardness').step(.01)
	const particleSize_   =gui.add(uniforms.uParticleSize,'value',0,.1).name('Particle Size').step(.005)
	const particleSpeed_  =gui.add(uniforms.uParticleSpeed,'value',0,3).name('Particle Speed').step(.01)
	const particleOpacity_=gui.add(uniforms.uParticleOpacity,'value',0,1).name('Opacity').step(.01)
	const reactiveness_   =gui.add(uniforms.uReactiveness,'value',0,2).name('Reactiveness').step(.01)
	const sphereRadius_   =gui.add(uniforms.uSphereRadius,'value',0,2).name('Sphere Radius').step(.01)

	gui.close()
}
