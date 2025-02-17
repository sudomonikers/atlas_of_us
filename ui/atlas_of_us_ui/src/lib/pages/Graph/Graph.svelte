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
  } from "./node-response.interface";
  import womanJpg from "../../../assets/woman.jpg";

  const http = new HttpService();

  interface NodeMesh extends THREE.Mesh {
    userData: Neo4jNodeWithMappedPositions;
  }

  let personalityNodes: Neo4jApiResponse;
  let healthNodes: Neo4jApiResponse;
  let knowledgeNodes: Neo4jApiResponse;
  let intrinsicsNodes: Neo4jApiResponse;
  let pursuitsNodes: Neo4jApiResponse;
  let skillsNodes: Neo4jApiResponse;
  let positions: NodeCoordinate[];
  let mappedNodes = $state([] as Neo4jNodeWithMappedPositions[]);

  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let raycaster: THREE.Raycaster;
  let mouse: THREE.Vector2;

  async function loadNodes() {
    personalityNodes = await http.getPersonalityNodes();
    healthNodes = await http.getHealthNodes();
    // knowledgeNodes = await http.getKnowledgeNodes();
    // intrinsicsNodes = await http.getIntrinsicNodes();
    // pursuitsNodes = await http.getPursuitNodes();
    // skillsNodes = await http.getSkillNodes();
    positions = await processImage(womanJpg, healthNodes.nodes.length, 128);
    //mappedNodes = mapPositionsToNodes(healthNodes.nodes, positions);
    createGraph(healthNodes.nodes, positions, healthNodes.relationships);
  }

  // function mapPositionsToNodes(
  //   nodes: Neo4jNode[],
  //   coorindates: NodeCoordinate[]
  // ): Neo4jNodeWithMappedPositions[] {
  //   return nodes.map((node, index) => {
  //     return {
  //       coordinates: coorindates[index],
  //       ...node,
  //     };
  //   });
  // }

  function createGraph(
    nodes: Neo4jNode[],
    coordinates: NodeCoordinate[],
    relationships: Neo4jRelationship[]
  ) {
    // Create nodes
    nodes.forEach((node, index) => {
      const geometry = new THREE.SphereGeometry(0.2, 8, 8);
      const material = new THREE.MeshBasicMaterial({
        color: 0xccb3ff,
        transparent: true,
        opacity: 0.8,
      });
      const sphere = new THREE.Mesh(geometry, material);

      // Store Neo4j data and coordinates directly on the mesh
      sphere.userData = {
        coordinates: coordinates[index],
        ...node,
      };

      // Position the sphere
      sphere.position.x = coordinates[index].x;
      sphere.position.y = coordinates[index].y;
      sphere.position.z = coordinates[index].z;

      scene.add(sphere);
    });

    // Create relationships
    relationships.forEach((relationship) => {
      const startNode = scene.children.find(
        (mesh) => (mesh as NodeMesh).userData.Id === relationship.StartId
      );
      const endNode = scene.children.find(
        (mesh) => (mesh as NodeMesh).userData.Id === relationship.EndId
      );

      if (startNode && endNode) {
        const points = [startNode.position.clone(), endNode.position.clone()];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0.5,
        });

        const line = new THREE.Line(geometry, material);
        // Store relationship data on the line
        line.userData = relationship;

        scene.add(line);
      }
    });
  }

  async function processImage(
    imageUrl: string,
    numPoints: number,
    threshold: number
  ): Promise<Array<{ x: number; y: number; z: number }>> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d")!;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imageData.data;
        const edgePixels = [];

        // Collect dark pixels
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const i = (y * canvas.width + x) * 4;
            const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;

            if (brightness < threshold) {
              edgePixels.push({ x, y });
            }
          }
        }

        // Select points based on desired number
        const step = Math.max(1, Math.floor(edgePixels.length / numPoints));
        const selectedPoints = [];

        for (
          let i = 0;
          i < edgePixels.length && selectedPoints.length < numPoints;
          i += step
        ) {
          const randomOffset = Math.floor(Math.random() * step);
          const pixel =
            edgePixels[Math.min(i + randomOffset, edgePixels.length - 1)];
          selectedPoints.push(pixel);
        }

        // Normalize coordinates to THREE.js space
        const scale = 10;
        const aspectRatio = canvas.width / canvas.height;

        const normalizedPoints = selectedPoints.map((point) => ({
          x: (point.x / canvas.width - 0.5) * scale * aspectRatio,
          y: -(point.y / canvas.height - 0.5) * scale,
          z: 0,
        }));

        resolve(normalizedPoints);
      };
      img.src = imageUrl;
    });
  }

  function onMouseMove(event: MouseEvent) {
    // Calculate mouse position in normalized device coordinates
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / container.offsetWidth) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / container.offsetHeight) * 2 + 1;
  }

  function animate() {
    raycaster.setFromCamera(mouse, camera);
    // Reset all node scales
    scene.children.forEach((object) => {
      if (object instanceof THREE.Mesh) {
        object.scale.setScalar(1);
      }
    });

    // Scale up intersected node
    const intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0 && intersects[0].object instanceof THREE.Mesh) {
      intersects[0].object.scale.setScalar(1.5);

      // You can now easily access the Neo4j data from the intersected object
      const nodeData = (intersects[0].object as NodeMesh).userData;
      // Do something with nodeData if needed
    }

    controls.update();
    renderer.render(scene, camera);
  }

  onMount(() => {
    loadNodes();
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
      75,
      container.offsetWidth / container.offsetHeight,
      0.1,
      1000
    );

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(container.offsetWidth, container.offsetHeight);
    renderer.setAnimationLoop(animate);
    controls = new OrbitControls(camera, renderer.domElement);
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    container.appendChild(renderer.domElement);
    container.addEventListener("mousemove", onMouseMove);

    camera.position.z = 5;

    const resizeObserver = new ResizeObserver(() => {
      camera.aspect = container.offsetWidth / container.offsetHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.offsetWidth, container.offsetHeight);
    });

    resizeObserver.observe(container);

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
