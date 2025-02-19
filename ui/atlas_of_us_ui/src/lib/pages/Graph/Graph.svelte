<script lang="ts">
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import { onMount } from "svelte";
  import { HttpService } from "../../services/http-service";
  import type {
    Neo4jApiResponse,
    Neo4jNode,
    Neo4jNodeWithMappedPositions,
    Neo4jRelationship,
    NodeCoordinate,
  } from "./graph-interfaces.interface";

  import galaxyBackground from "../../../assets/galaxy.jpeg";
  import womanJpg from "../../../assets/woman.jpg";
  import manPng from "../../../assets/3-muscular-man-csa-images.jpg"

  const http = new HttpService();

  let personalityNodes: Neo4jApiResponse;
  let healthNodes: Neo4jApiResponse;
  let knowledgeNodes: Neo4jApiResponse;
  let intrinsicsNodes: Neo4jApiResponse;
  let pursuitsNodes: Neo4jApiResponse;
  let skillsNodes: Neo4jApiResponse;

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let raycaster: THREE.Raycaster;
  let mouse: THREE.Vector2;
  let resizeObserver: ResizeObserver;
  let loadedImage: HTMLImageElement;
  let loader: THREE.TextureLoader;

  let instancedMesh: THREE.InstancedMesh;
  const velocities: THREE.Vector3[] = [];
  const boundarySize = 1500;

  //business logic which should be moved to a separate file probably
  async function loadL1Nodes() {
    personalityNodes = await http.getPersonalityNodes();
    healthNodes = await http.getHealthNodes();
    // knowledgeNodes = await http.getKnowledgeNodes();
    // intrinsicsNodes = await http.getIntrinsicNodes();
    // pursuitsNodes = await http.getPursuitNodes();
    // skillsNodes = await http.getSkillNodes();
    const graphData = {
      healthNodes,
      personalityNodes,
      // knowledgeNodes,
      // intrinsicsNodes,
      // pursuitsNodes,
      // skillsNodes
    };
    return graphData;
  }

  async function processImage(
    imageUrl: string,
    numPoints: number,
    threshold: number
  ): Promise<Array<{ x: number; y: number; z: number }>> {
    return new Promise((resolve) => {
      loadedImage = new Image();
      loadedImage.crossOrigin = "Anonymous";
      loadedImage.src = imageUrl;

      loadedImage.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = loadedImage.width;
        canvas.height = loadedImage.height;
        ctx.drawImage(loadedImage, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const edgePixels = [];

        // Collect dark pixels using original pixel coordinates
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;

            if (brightness < threshold) {
              edgePixels.push({ x, y });
            }
          }
        }

        let selectedPixels;
        if (edgePixels.length > numPoints) {
          selectedPixels = [];
          for (let i = 0; i < numPoints; i++) {
            const randomIndex = Math.floor(Math.random() * edgePixels.length);
            selectedPixels.push(edgePixels[randomIndex]);
          }
        } else {
          selectedPixels = edgePixels;
        }

        // Keep original pixel coordinates but center at (0,0)
        const points = selectedPixels.map((pixel) => ({
          x: pixel.x - canvas.width / 2,
          y: -(pixel.y - canvas.height / 2), // Flip Y for Three.js coordinate system
          z: 0, // Set all points to z=0 plane initially
        }));

        resolve(points);
      };
    });
  }

  async function createGraphConstellation(
    imagePoints: NodeCoordinate[],
    sceneLocation: NodeCoordinate,
    graphData?: Neo4jApiResponse
  ): Promise<THREE.Points> {
    const width = loadedImage.width;
    const height = loadedImage.height;

    // Create geometry
    const positions = new Float32Array(imagePoints.length * 3);
    const colors = new Float32Array(imagePoints.length * 3);

    // Create array to track which particles have associated data
    const particleData: (Neo4jNodeWithMappedPositions | null)[] = new Array(
      imagePoints.length
    ).fill(null);

    // Assign graph data to some particles if provided
    if (graphData && graphData.nodes.length > 0) {
      // Determine how many particles will have data
      const dataPointCount = Math.min(
        graphData.nodes.length,
        Math.floor(imagePoints.length * 0.1)
      );

      // Randomly select particles to have data
      const selectedIndices = new Set<number>();
      while (selectedIndices.size < dataPointCount) {
        const randomIndex = Math.floor(Math.random() * imagePoints.length);
        selectedIndices.add(randomIndex);
      }

      // Assign data to selected particles
      let dataIndex = 0;
      selectedIndices.forEach((particleIndex) => {
        if (dataIndex < graphData.nodes.length) {
          // Create coordinates for the node based on particle position
          const nodeWithPosition: Neo4jNodeWithMappedPositions = {
            ...graphData.nodes[dataIndex],
            coordinates: {
              x: imagePoints[particleIndex].x,
              y: imagePoints[particleIndex].y,
              z: imagePoints[particleIndex].z,
            },
          };

          // Store the data with the particle
          particleData[particleIndex] = nodeWithPosition;

          // Set a different color for particles with data (light blue)
          colors[particleIndex * 3] = 0.5; // R
          colors[particleIndex * 3 + 1] = 0.7; // G
          colors[particleIndex * 3 + 2] = 1.0; // B

          dataIndex++;
        }
      });
    }

    // Fill positions array
    for (let i = 0; i < imagePoints.length; i++) {
      positions[i * 3] = imagePoints[i].x;
      positions[i * 3 + 1] = imagePoints[i].y;
      positions[i * 3 + 2] = imagePoints[i].z;

      // For particles without assigned data, set default color (white)
      if (particleData[i] === null) {
        colors[i * 3] = 1.0; // R
        colors[i * 3 + 1] = 1.0; // G
        colors[i * 3 + 2] = 1.0; // B
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    // Create particle material with bigger particle size since we're using pixel coordinates
    const material = new THREE.PointsMaterial({
      size: 2.0, // Much larger size because we're working with pixel coordinates
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      vertexColors: true,
    });

    // Store original size in userData for reference during hover
    material.userData = { originalSize: material.size };

    // Create particle system
    const particleSystem = new THREE.Points(geometry, material);

    // Add click event listener to the container
    container.addEventListener("click", (event) => {
      // Calculate mouse position in normalized device coordinates
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / container.offsetWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / container.offsetHeight) * 2 + 1;

      // Update the raycaster
      raycaster.setFromCamera(mouse, camera);

      // Check for intersections with the particle system
      const intersects = raycaster.intersectObject(particleSystem);

      if (intersects.length > 0) {
        centerCameraOnMesh(camera, controls, particleSystem);
      }
    });

    // Store the particle data and image dimensions for later use
    particleSystem.userData = {
      particleData: particleData,
      graphData: graphData,
      imageWidth: width,
      imageHeight: height,
    };

    particleSystem.position.set(sceneLocation.x, sceneLocation.y, sceneLocation.z);
    scene.add(particleSystem);

    // Adjust camera for the pixel coordinates
    if (camera) {
      // Calculate the necessary camera Z position to view the entire image
      const aspectRatio = container.offsetWidth / container.offsetHeight;
      const imageAspectRatio = width / height;

      let cameraZ;
      if (aspectRatio > imageAspectRatio) {
        // Window is wider than image
        cameraZ = height / (2 * Math.tan((Math.PI * camera.fov) / 360));
      } else {
        // Window is taller than image
        cameraZ =
          width / (2 * Math.tan((Math.PI * camera.fov) / 360) * aspectRatio);
      }

      // Add some padding
      cameraZ *= 1.1;
      camera.position.z = cameraZ;
      camera.updateProjectionMatrix();
    }

    return particleSystem;
  }

  async function mapGraphToImage() {
    const graphData = await loadL1Nodes();
    const imagePoints = await processImage(womanJpg, 1500, 50);
    await createGraphConstellation(imagePoints, {x: 0, y: 0, z: -250},  graphData.healthNodes);

    const imagePoints2 = await processImage(manPng, 1500, 50);
    await createGraphConstellation(imagePoints2, {x: 0, y: 0, z: 250}, graphData.healthNodes);
  }

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
    instancedMesh.position.copy(camera.position);
    scene.add(instancedMesh);
  }

  function updateParticles() {
    const dummy = new THREE.Object3D();

    // Update instancedMesh position to match camera
    instancedMesh.position.copy(camera.position);

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



  

  //threejs scene specific things
  function centerCameraOnMesh(
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    object: THREE.Object3D
  ) {
    // Get the bounding box of the object
    const bbox = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Calculate the size of the bounding box
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Calculate the distance needed to view the entire object
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    // Create a new position for the camera
    const targetPosition = new THREE.Vector3(
      center.x,
      center.y,
      center.z + cameraZ * 1.1 // Add 10% padding
    );

    // Smoothly move the camera to the new position
    const duration = 1000; // Duration in milliseconds
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone(); // Capture the starting target
    const startTime = Date.now();

    function updateCamera() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Use an easing function for smooth animation
      const easeProgress = 1 - Math.cos((progress * Math.PI) / 2);

      camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
      controls.target.lerpVectors(startTarget, center, easeProgress); // Animate the target

      camera.lookAt(center);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(updateCamera);
      }
    }

    updateCamera();
  }

  function onMouseMove(event: MouseEvent) {
    // Calculate mouse position in normalized device coordinates
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.offsetWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.offsetHeight) * 2 + 1;

    // Update raycaster parameters for better point detection
    if (!raycaster.params.Points) {
      raycaster.params.Points = { threshold: 2 }; // Increase point detection threshold
    } else {
      raycaster.params.Points.threshold = 2;
    }
  }

  function animate(delta: number) {
    updateParticles();

    raycaster.setFromCamera(mouse, camera);

    // Reset all point sizes and store currently hovered data
    let hoveredNodeData: Neo4jNodeWithMappedPositions | null = null;

    scene.children.forEach((object) => {
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
    const intersects = raycaster.intersectObjects(scene.children);
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

    controls.update(delta);
    renderer.render(scene, camera);
  }

  onMount(() => {
    //scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      container.offsetWidth / container.offsetHeight,
      0.1,
      10000 //setting this far away since we arent normalizing coordinates of image data
    );

    //renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    //orbit controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.025;
    controls.minPolarAngle = Math.PI / 3;
    controls.maxPolarAngle = Math.PI / 2;

    //fly controls
    // controls = new FlyControls(camera, renderer.domElement);
    // controls.movementSpeed = 100;
    // controls.rollSpeed = 0.5;
    // controls.dragToLook = true;
    // controls.autoForward = false;

    //raycaster for capturing mouse movement
    raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 2 };
    mouse = new THREE.Vector2();
    container.addEventListener("mousemove", onMouseMove);
    container.appendChild(renderer.domElement);

    //handle window resize
    resizeObserver = new ResizeObserver(() => {
      camera.aspect = container.offsetWidth / container.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.offsetWidth, container.offsetHeight);
    });
    resizeObserver.observe(container);

    //set background
    loader = new THREE.TextureLoader();
    const texture = loader.load(galaxyBackground, () => {
      // Convert the equirectangular texture to a cube texture
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      pmremGenerator.compileEquirectangularShader();

      const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      scene.background = envMap; // Set as background
      scene.environment = envMap; // Set as environment map

      pmremGenerator.dispose();
      texture.dispose();
    });

    loadParticles();

    mapGraphToImage();

    let lastTime = 0;
    renderer.setAnimationLoop((time) => {
      const delta = (time - lastTime) / 1000;
      lastTime = time;

      animate(delta);
    });

    return () => {
      // Clean up resources
      resizeObserver.unobserve(container);
      renderer.dispose();
      controls.dispose();
      container.removeEventListener("mousemove", onMouseMove);
    };
  });
</script>

<div class="in-nav-container">
  <div bind:this={container} style="width:100%; height:100%;"></div>
</div>
