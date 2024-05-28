import WindowManager from './WindowManager.js'


const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let cubes = [];
let sceneOffsetTarget = {x: 0, y: 0};
let sceneOffset = {x: 0, y: 0};

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;

function getTime ()
{
	return (new Date().getTime() - today) / 1000.0;
}


if (new URLSearchParams(window.location.search).get("clear"))
{
	localStorage.clear();
}
else
{	
	document.addEventListener("visibilitychange", () => 
	{
		if (document.visibilityState != 'hidden' && !initialized)
		{
			init();
		}
	});

	window.onload = () => {
		if (document.visibilityState != 'hidden')
		{
			init();
		}
	};

	function init ()
	{
		initialized = true;

		
		setTimeout(() => {
			setupScene();
			setupWindowManager();
			resize();
			updateWindowShape(false);
			render();
			window.addEventListener('resize', resize);
		}, 500)	
	}
	

	function setupScene ()
	{
		camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);
		
		camera.position.z = 2.5;
		near = camera.position.z - .5;
		far = camera.position.z + 0.5;

		scene = new t.Scene();
		scene.background = new t.Color(0.0);
		scene.add( camera );

		renderer = new t.WebGLRenderer({antialias: true, depthBuffer: true});
		renderer.setPixelRatio(pixR);
	    
	  	world = new t.Object3D();
		scene.add(world);

		renderer.domElement.setAttribute("id", "scene");
		document.body.appendChild( renderer.domElement );
		
	}

	
	function setupWindowManager ()
	{
		windowManager = new WindowManager();
		windowManager.setWinShapeChangeCallback(updateWindowShape);
		windowManager.setWinChangeCallback(windowsUpdated);

		let metaData = {foo: "bar"};

		windowManager.init(metaData);

		windowsUpdated();
	}

	
	function windowsUpdated ()
	{
		updateNumberOfCubes();
	}

	
	function updateNumberOfCubes ()
	{
		let wins = windowManager.getWindows();

		cubes.forEach((c) => {
			world.remove(c);
		})

		cubes = [];

		for (let i = 0; i < wins.length; i++)
		{
			let win = wins[i];

			let c;
			if (i == 0) {
				c = new t.Color('hsl(230, 80%, 75%)');
			} else if (i == 1) {
				c = new t.Color('hsl(350, 60%, 65%)');
			} else {
				let idBasedHueValue = (win.id % 10) / 10;
				let hue;
				if(idBasedHueValue < 0.5) {
					hue = 240 - (idBasedHueValue * 2 * 60);
				} else {
					hue = 360 - ((idBasedHueValue - 0.5) * 2 * 60);
				}
				c = new t.Color(`hsl(${hue}, 50%, 70%)`);
			}

			let s = 100 + i * 50;
			let radius = s / 2;

			let sphere = createComplexSphere(radius, c);
			sphere.position.x = win.shape.x + (win.shape.w * .5);
			sphere.position.y = win.shape.y + (win.shape.h * .5);
	
			world.add(sphere);
			cubes.push(sphere);

		}
	}

	
	function createComplexSphere(radius, color) {
		let innerSize = radius * 0.9; 
		let outerSize = radius;
		let innerColor = color;
		let outerColor = color;
	
		let complexSphere = new THREE.Group();
	
		let sphereWireframeInner = new THREE.Mesh(
			new THREE.IcosahedronGeometry(innerSize, 2),
			new THREE.MeshLambertMaterial({
				color: innerColor,
				wireframe: true,
				transparent: true,
				shininess: 0
			})
		);
		complexSphere.add(sphereWireframeInner);
	
		let sphereWireframeOuter = new THREE.Mesh(
			new THREE.IcosahedronGeometry(outerSize, 3),
			new THREE.MeshLambertMaterial({
				color: outerColor,
				wireframe: true,
				transparent: true,
				shininess: 0
			})
		);
		complexSphere.add(sphereWireframeOuter);
	

		let sphereGlassInner = new THREE.Mesh(
			new THREE.SphereGeometry(innerSize, 32, 32),
			new THREE.MeshPhongMaterial({
				color: innerColor,
				transparent: true,
				shininess: 25,
				opacity: 0.3
			})
		);
		complexSphere.add(sphereGlassInner);
	
		let sphereGlassOuter = new THREE.Mesh(
			new THREE.SphereGeometry(outerSize, 32, 32),
			new THREE.MeshPhongMaterial({
				color: outerColor,
				transparent: true,
				shininess: 25,
				opacity: 0.3
			})
		);
		complexSphere.add(sphereGlassOuter);

		let particlesOuter = createParticles(outerSize, outerColor);
		complexSphere.add(particlesOuter);
	
		let particlesInner = createParticles(innerSize, innerColor);
		complexSphere.add(particlesInner);
	
		return complexSphere;
	}
	
	function createParticles(size, color) {
		let geometry = new THREE.Geometry();
		for (let i = 0; i < 35000; i++) {
			let x = -1 + Math.random() * 2;
			let y = -1 + Math.random() * 2;
			let z = -1 + Math.random() * 2;
			let d = 1 / Math.sqrt(x * x + y * y + z * z);
			x *= d * size;
			y *= d * size;
			z *= d * size;
			geometry.vertices.push(new THREE.Vector3(x, y, z));
		}
		let material = new THREE.PointsMaterial({
			size: 0.1,
			color: color,
			transparent: true
		});
		return new THREE.Points(geometry, material);
	}
	

	function updateWindowShape (easing = true)
	{
		sceneOffsetTarget = {x: -window.screenX, y: -window.screenY};
		if (!easing) sceneOffset = sceneOffsetTarget;
	}


	function render ()
	{
		let t = getTime();

		windowManager.update();

		let falloff = .05;
		sceneOffset.x = sceneOffset.x + ((sceneOffsetTarget.x - sceneOffset.x) * falloff);
		sceneOffset.y = sceneOffset.y + ((sceneOffsetTarget.y - sceneOffset.y) * falloff);

		world.position.x = sceneOffset.x;
		world.position.y = sceneOffset.y;

		let wins = windowManager.getWindows();

		for (let i = 0; i < cubes.length; i++)
		{
			let complexSphere = cubes[i]; 
			let win = wins[i];
			let _t = t; 

			let posTarget = {x: win.shape.x + (win.shape.w * .5), y: win.shape.y + (win.shape.h * .5)}
			
			complexSphere.position.x = complexSphere.position.x + (posTarget.x - complexSphere.position.x) * falloff;
        	complexSphere.position.y = complexSphere.position.y + (posTarget.y - complexSphere.position.y) * falloff;

        
			complexSphere.rotation.x = _t * .5; 
			complexSphere.rotation.y = _t * .3; 
			updateComplexSphere(complexSphere, t);
		};

		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}

	
	function updateComplexSphere(complexSphere, elapsedTime) {
		let sphereWireframeInner = complexSphere.children[0];
		let sphereWireframeOuter = complexSphere.children[1];
		let sphereGlassInner = complexSphere.children[2];
		let sphereGlassOuter = complexSphere.children[3];
		let particlesOuter = complexSphere.children[4];
		let particlesInner = complexSphere.children[5];
	
		sphereWireframeInner.rotation.x += 0.002;
		sphereWireframeInner.rotation.z += 0.002;
	  
		sphereWireframeOuter.rotation.x += 0.001;
		sphereWireframeOuter.rotation.z += 0.001;
	  
		sphereGlassInner.rotation.y += 0.005;
		sphereGlassInner.rotation.z += 0.005;
	
		sphereGlassOuter.rotation.y += 0.01;
		sphereGlassOuter.rotation.z += 0.01;
	
		particlesOuter.rotation.y += 0.0005;
		particlesInner.rotation.y -= 0.002;
	
		var innerShift = Math.abs(Math.cos(((elapsedTime + 2.5) / 20)));
		var outerShift = Math.abs(Math.cos(((elapsedTime + 5) / 10)));
	
		sphereWireframeOuter.material.color.setHSL(0.55, 1, outerShift);
		sphereGlassOuter.material.color.setHSL(0.55, 1, outerShift);
		particlesOuter.material.color.setHSL(0.55, 1, outerShift);
	
		sphereWireframeInner.material.color.setHSL(0.08, 1, innerShift);
		particlesInner.material.color.setHSL(0.08, 1, innerShift);
		sphereGlassInner.material.color.setHSL(0.08, 1, innerShift);
	
		sphereWireframeInner.material.opacity = Math.abs(Math.cos((elapsedTime + 0.5) / 0.9) * 0.5);
		sphereWireframeOuter.material.opacity = Math.abs(Math.cos(elapsedTime / 0.9) * 0.5);
	
	}
	
	
	function resize ()
	{
		let width = window.innerWidth;
		let height = window.innerHeight
		
		camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
		camera.updateProjectionMatrix();
		renderer.setSize( width, height );
	}
}
