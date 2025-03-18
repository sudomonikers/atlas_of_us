<script lang="ts">
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import { onMount } from "svelte";
  import { HttpService } from "../../services/http-service";
  import { GraphUtils } from "./graph-utils";

  import type {
    Neo4jApiResponse,
    Neo4jNodeWithMappedPositions,
    NodeCoordinate,
    ThreeContext,
  } from "./graph-interfaces.interface";

  import galaxyBackground from "../../../assets/galaxy.jpeg";

  const http = new HttpService();
  const graphUtils = new GraphUtils(http);
  let threeContext: ThreeContext;
  let container: HTMLDivElement;

  let instancedMesh: THREE.InstancedMesh;
  const velocities: THREE.Vector3[] = [];
  const boundarySize = 1500;

  async function loadL1GraphData() {
    const graphData = await graphUtils.loadL1Nodes();
    const positions = graphUtils.positionTreeNodesBasedOnTree(threeContext.camera, graphData, 2, 500);
    const flattened = graphUtils.flattenNestedStructure(positions);

    for (let index = 0; index < flattened.length; index++) {
      const data = graphData[flattened[index].key];
      const image = await http.getS3Object(
        "atlas-of-us-general-bucket",
        "woman.jpg"
      );
      const points = await graphUtils.processImage(image, 1500, 50);
      await graphUtils.createGraphConstellation(
        points,
        flattened[index].coordinates,
        image,
        threeContext,
        graphData.healthNodes
      );
    }
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
    threeContext.mouse.x =
      ((event.clientX - rect.left) / threeContext.container.offsetWidth) * 2 -
      1;
    threeContext.mouse.y =
      -((event.clientY - rect.top) / threeContext.container.offsetHeight) * 2 +
      1;

    // Update raycaster parameters for better point detection
    if (!threeContext.raycaster.params.Points) {
      threeContext.raycaster.params.Points = { threshold: 2 }; // Increase point detection threshold
    } else {
      threeContext.raycaster.params.Points.threshold = 2;
    }
  }

  function animate(delta: number) {
    updateParticles();

    threeContext.raycaster.setFromCamera(
      threeContext.mouse,
      threeContext.camera
    );

    // Reset all point sizes and store currently hovered data
    let hoveredNodeData: Neo4jNodeWithMappedPositions | null = null;

    threeContext.scene.children.forEach((object) => {
      if (object instanceof THREE.Points) {
        const material = object.material as THREE.PointsMaterial;
        if (material.userData.originalSize) {
          material.size = material.userData.originalSize;
        }
      } else if (object instanceof THREE.Mesh) {
        object.scale.setScalar(1);
      }
    });

    // Scale up intersected particles/nodes
    const intersects = threeContext.raycaster.intersectObjects(
      threeContext.scene.children
    );
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object;

      if (intersectedObject instanceof THREE.Points) {
        const material = intersectedObject.material as THREE.PointsMaterial;

        // Store original size if not already stored
        if (!material.userData.originalSize) {
          material.userData.originalSize = material.size;
        }

        // Scale up the size
        material.size = material.userData.originalSize * 1.5;

        // Get the index of the intersected particle
        const intersectedIndex = intersects[0].index;
        if (
          intersectedIndex !== undefined &&
          intersectedObject.userData.particleData &&
          intersectedObject.userData.particleData[intersectedIndex]
        ) {
          hoveredNodeData =
            intersectedObject.userData.particleData[intersectedIndex];
          console.log("Hovered node data:", hoveredNodeData);
        }
      }
    }

    threeContext.controls.update(delta);
    threeContext.renderer.render(threeContext.scene, threeContext.camera);
  }

  function setUpScene(): ThreeContext {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      container.offsetWidth / container.offsetHeight,
      0.1,
      0 //setting this far away since we arent normalizing coordinates of image data
    );

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

    //raycaster for capturing mouse movement
    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 2 };
    const mouse = new THREE.Vector2();
    container.addEventListener("mousemove", onMouseMove);
    container.appendChild(renderer.domElement);

    //handle window resize
    const resizeObserver = new ResizeObserver(() => {
      camera.aspect = container.offsetWidth / container.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.offsetWidth, container.offsetHeight);
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
      raycaster,
      mouse,
      controls,
      container,
      resizeObserver,
      loader,
      renderer,
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
    };
  });
</script>

<div class="in-nav-container">
  <div bind:this={container} style="width:100%; height:100%;"></div>
</div>
