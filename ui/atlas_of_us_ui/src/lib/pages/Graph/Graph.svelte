<script lang="ts">
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import { CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

  import { onMount } from "svelte";
  import { HttpService } from "../../services/http-service";
  import { GraphUtils } from "./graph-utils";

  import { searchState } from "../../nav/input-state.svelte"

  import type {
  Neo4jApiResponse,
    ThreeContext,
  } from "./graph-interfaces.interface";

  import galaxyBackground from "../../../assets/galaxy.jpeg";
  import Nav from "../../nav/Nav.svelte";

  const http = new HttpService();
  const graphUtils = new GraphUtils(http);
  let graphData: Neo4jApiResponse;
  let threeContext: ThreeContext;
  let container: HTMLDivElement;

  let instancedMesh: THREE.InstancedMesh;
  const velocities: THREE.Vector3[] = [];
  const boundarySize = 1500;
  // Track when the mouse was pressed down
  let mouseDownTime: number | null = null;
  let mouseDownPosition = { x: 0, y: 0 };
  const CLICK_THRESHOLD_MS = 300; // Time in ms to consider a "short click"
  const POSITION_THRESHOLD = 5; // Pixels to consider as movement

  let navInputChange = $derived(searchState.text)
  $effect(() => {
    console.log(navInputChange)
  })

  async function loadL1GraphData() {
    graphData = await graphUtils.loadNodeAndAffiliatesById('4:85214d9a-1dfe-48e4-9e42-48eefb670f7a:176');
    console.log(graphData)
    const image = await http.getS3Object(
        "atlas-of-us-general-bucket",
        graphData.nodeRoot.image
      );
      const points = await graphUtils.processImage(image, 2000, 50);
      await graphUtils.createGraphConstellation(
        points,
        {x: 0, y: 0, z: 0},
        image,
        threeContext,
        graphData
      );
  }

  //particles which will always be in camera
  function loadParticles() {
    const particleCount = 350;
    const sphereGeometry = new THREE.SphereGeometry(2, 8, 8);
    const material = new THREE.MeshBasicMaterial({ vertexColors: true });

    instancedMesh = new THREE.InstancedMesh(
      sphereGeometry,
      material,
      particleCount
    );

    const dummy = new THREE.Object3D();
    const colors = new Float32Array(particleCount * 3);

    // Initialize all positions relative to (0,0,0)
    for (let i = 0; i < particleCount; i++) {
      // Random positions within boundary
      dummy.position.set(
        (Math.random() - 0.5) * boundarySize * 2,
        (Math.random() - 0.5) * boundarySize * 2,
        (Math.random() - 0.5) * boundarySize * 2
      );

      // Random velocities
      const velocity = new THREE.Vector3(
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25,
        (Math.random() - 0.5) * 0.25
      );
      velocity.multiplyScalar(0.3 + Math.random() * 0.3);
      velocities.push(velocity);

      dummy.rotation.x = Math.random() * Math.PI * 2;
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.rotation.z = Math.random() * Math.PI * 2;
      dummy.scale.setScalar(Math.random() * 2 + 1);

      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);

      // Color logic
      const color = new THREE.Color();
      const hue = Math.random() * 0.16 + 0.04;
      const saturation = Math.random() * 0.3 + 0.7;
      const lightness = Math.random() * 0.4 + 0.6;
      color.setHSL(hue, saturation, lightness);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
    sphereGeometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Position the entire instancedMesh at the camera
    instancedMesh.position.copy(threeContext.camera.position);
    threeContext.scene.add(instancedMesh);
  }

  function updateParticles() {
    const dummy = new THREE.Object3D();

    // Update instancedMesh position to match camera
    instancedMesh.position.copy(threeContext.camera.position);

    // Get each instance's matrix
    for (let i = 0; i < velocities.length; i++) {
      instancedMesh.getMatrixAt(i, dummy.matrix);
      dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);

      // Move based on velocity
      dummy.position.add(velocities[i]);

      // Wrap around relative to local position (since the whole mesh moves with camera)
      if (dummy.position.x > boundarySize) dummy.position.x = -boundarySize;
      if (dummy.position.x < -boundarySize) dummy.position.x = boundarySize;
      if (dummy.position.y > boundarySize) dummy.position.y = -boundarySize;
      if (dummy.position.y < -boundarySize) dummy.position.y = boundarySize;
      if (dummy.position.z > boundarySize) dummy.position.z = -boundarySize;
      if (dummy.position.z < -boundarySize) dummy.position.z = boundarySize;

      // Update rotation
      dummy.rotation.x += 0.002;
      dummy.rotation.y += 0.002;

      dummy.updateMatrix();
      instancedMesh.setMatrixAt(i, dummy.matrix);
    }

    instancedMesh.instanceMatrix.needsUpdate = true;
  }

  function onMouseMove(event: MouseEvent) {
    // Calculate mouse position in normalized device coordinates
    const rect = threeContext.container.getBoundingClientRect();
    threeContext.mouse.x = ((event.clientX - rect.left) / threeContext.container.offsetWidth) * 2 - 1;
    threeContext.mouse.y = -((event.clientY - rect.top) / threeContext.container.offsetHeight) * 2 + 1;
  }

  function onClick(event: MouseEvent) {
    threeContext.raycaster.setFromCamera(
      threeContext.mouse,
      threeContext.camera
    );

    const intersects = threeContext.raycaster.intersectObjects(
      threeContext.scene.children
    );

    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;
      if (!intersectedObject.userData.isCentered) {
        graphUtils.centerCameraOnMesh(
          threeContext.camera,
          threeContext.controls,
          intersectedObject
        );
        if (intersectedObject instanceof THREE.Mesh) {
          graphUtils.showRelationshipLines(intersectedObject, threeContext, graphData);
        } else if (intersectedObject instanceof THREE.Line) {
          console.log(intersectedObject)
          graphUtils.clearRelationshipLines(threeContext, [intersectedObject.userData.relationship.id]);
        }
      } else {
        console.log(threeContext.homeCameraPosition)
        graphUtils.clearFocus(threeContext, intersectedObject);
      }
      
    }
  }

  function onMouseDown(event: MouseEvent) {
    mouseDownTime = Date.now();
    mouseDownPosition = { x: event.clientX, y: event.clientY };
  }

  function onMouseUp(event: MouseEvent) {
    if (mouseDownTime === null) return;
    
    const clickDuration = Date.now() - mouseDownTime;
    const moveDistance = Math.sqrt(
      Math.pow(event.clientX - mouseDownPosition.x, 2) + 
      Math.pow(event.clientY - mouseDownPosition.y, 2)
    );
    
    // Only handle as a click if it was short and didn't move much
    if (clickDuration < CLICK_THRESHOLD_MS && moveDistance < POSITION_THRESHOLD) {
      onClick(event);
    }
    
    mouseDownTime = null;
  }

  function animate(delta: number) {
    updateParticles();

    threeContext.raycaster.setFromCamera(
      threeContext.mouse,
      threeContext.camera
    );

    // Find intersected sphere
    const intersects = threeContext.raycaster.intersectObjects(
      threeContext.scene.children, 
      true
    );

    let intersectedObject = intersects.length ? intersects[0].object : null;
    if (intersectedObject instanceof THREE.Mesh && !intersectedObject.userData.isFocused) {
      intersectedObject.userData.isFocused = true;
      intersectedObject.scale.setScalar(1.5);
      // If this is a data node, add an infobox
      if (intersectedObject.userData.isDataNode && !intersectedObject.userData.infoBox) {
        graphUtils.addInfoBoxToMesh(intersectedObject);
      }
    }

    // Reset all previously focused objects
    threeContext.scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.userData.isFocused && object !== intersectedObject) {
        object.scale.setScalar(1);
        object.userData.isFocused = false;
        if (object.userData.infoBox && !object.userData.isCentered) {
          graphUtils.removeInfoBoxFromMesh(object)
        }
      }
    });

    threeContext.controls.update(delta);
    threeContext.renderer.render(threeContext.scene, threeContext.camera);
    threeContext.labelRenderer.render(threeContext.scene, threeContext.camera);
  }

  function setUpScene(): ThreeContext {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.offsetWidth / container.offsetHeight,
      0.1,
      10000
    );
    const homeCameraPosition = camera.position;

    //renderer
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    //orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.025;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI / 2;

    //loader
    const loader = new THREE.TextureLoader();

    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.body.appendChild(labelRenderer.domElement);

    //raycaster for capturing mouse movement
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 2 };
    const mouse = new THREE.Vector2(10000, 10000); //initializing this will outside the scene so that it doesnt mess with scene objects
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mouseup', onMouseUp);
    container.appendChild(renderer.domElement);

    //handle window resize
    const resizeObserver = new ResizeObserver(() => {
      camera.aspect = container.offsetWidth / container.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      labelRenderer.setSize(window.innerWidth, window.innerHeight);
    });
    resizeObserver.observe(container);

    //animation loop
    let lastTime = 0;
    renderer.setAnimationLoop((time) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      animate(delta);
    });

    return {
      scene,
      camera,
      homeCameraPosition,
      raycaster,
      mouse,
      controls,
      container,
      resizeObserver,
      loader,
      renderer,
      labelRenderer
    };
  }

  function loadBackground() {
    const texture = threeContext.loader.load(galaxyBackground, () => {
      const pmremGenerator = new THREE.PMREMGenerator(threeContext.renderer);
      pmremGenerator.compileEquirectangularShader();

      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      threeContext.scene.background = envMap; // Set as background
      threeContext.scene.environment = envMap; // Set as environment map

      pmremGenerator.dispose();
      texture.dispose();
    });
  }

  onMount(() => {
    threeContext = setUpScene();
    loadBackground();
    loadParticles();

    loadL1GraphData();

    return () => {
      // Clean up resources
      threeContext.resizeObserver.unobserve(container);
      threeContext.renderer.dispose();
      threeContext.controls.dispose();
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mouseup', onMouseUp);
    };
  });
</script>

<div class="in-nav-container">
  <div bind:this={container} style="width:100%; height:100%;"></div>
</div>