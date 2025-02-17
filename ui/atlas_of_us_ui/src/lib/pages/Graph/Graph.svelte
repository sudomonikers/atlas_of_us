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
    graphData: Neo4jNodeWithMappedPositions;
  }

  interface RelationshipLine extends THREE.Line {
    graphData: Neo4jRelationship;
  }

  let personalityNodes: Neo4jApiResponse;
  let healthNodes: Neo4jApiResponse;
  let knowledgeNodes: Neo4jApiResponse;
  let intrinsicsNodes: Neo4jApiResponse;
  let pursuitsNodes: Neo4jApiResponse;
  let skillsNodes: Neo4jApiResponse;
  let positions: NodeCoordinate[];
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
    positions = await processImage(
      womanJpg,
      healthNodes.nodes.length,
      128
    );
    createGraph(healthNodes.nodes, positions, healthNodes.relationships);
  }

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
      const sphere = new THREE.Mesh(geometry, material) as unknown as NodeMesh;

      // Store Neo4j data and coordinates directly on the mesh
      sphere.graphData = {
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
        (mesh) => (mesh as NodeMesh).graphData.Id === relationship.StartId
      );
      const endNode = scene.children.find(
        (mesh) => (mesh as NodeMesh).graphData.Id === relationship.EndId
      );

      if (startNode && endNode) {
        const points = [startNode.position.clone(), endNode.position.clone()];

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color: 0x888888,
          transparent: true,
          opacity: 0.5,
        });

        const line = new THREE.Line(
          geometry,
          material
        ) as unknown as RelationshipLine;
        line.graphData = relationship; // Store relationship data on the line

        scene.add(line);
      }
    });
  }

  // Helper function to build adjacency list
  function buildAdjacencyList(
    nodes: Neo4jNode[],
    relationships: Neo4jRelationship[]
  ): Map<number, Set<number>> {
    const adjacencyList = new Map<number, Set<number>>();

    // Initialize sets for all nodes
    nodes.forEach((node) => {
      adjacencyList.set(node.Id, new Set<number>());
    });

    // Add relationships
    relationships.forEach((rel) => {
      adjacencyList.get(rel.StartId)?.add(rel.EndId);
      adjacencyList.get(rel.EndId)?.add(rel.StartId);
    });

    return adjacencyList;
  }

  // Helper function to calculate distance between two points
  function distance(
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  }

  // async function processImage(
  //   imageUrl: string,
  //   nodes: Neo4jNode[],
  //   relationships: Neo4jRelationship[],
  //   threshold: number
  // ): Promise<Array<NodeCoordinate>> {
  //   return new Promise((resolve) => {
  //     const img = new Image();
  //     img.crossOrigin = "Anonymous";
  //     img.onload = () => {
  //       const canvas = document.createElement("canvas");
  //       const ctx = canvas.getContext("2d")!;
  //       canvas.width = img.width;
  //       canvas.height = img.height;
  //       ctx.drawImage(img, 0, 0);

  //       const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  //       const pixels = imageData.data;

  //       // Collect all valid dark pixels
  //       const edgePixels: Array<{ x: number; y: number }> = [];
  //       for (let y = 0; y < canvas.height; y++) {
  //         for (let x = 0; x < canvas.width; x++) {
  //           const i = (y * canvas.width + x) * 4;
  //           const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
  //           if (brightness < threshold) {
  //             edgePixels.push({ x, y });
  //           }
  //         }
  //       }

  //       // Build adjacency list for relationship info
  //       const adjacencyList = buildAdjacencyList(nodes, relationships);

  //       // Track placed nodes and their positions
  //       const placedNodes = new Map<number, { x: number; y: number }>();
  //       const finalPositions: NodeCoordinate[] = new Array(nodes.length);

  //       // Divide image into grid sections to ensure even distribution
  //       const gridSize = Math.ceil(Math.sqrt(nodes.length)) + 1; // Add 1 for better spread
  //       const gridWidth = canvas.width / gridSize;
  //       const gridHeight = canvas.height / gridSize;

  //       // Group pixels by grid section
  //       const gridSections: Array<Array<{ x: number; y: number }>> = Array(
  //         gridSize * gridSize
  //       )
  //         .fill(null)
  //         .map(() => []);

  //       edgePixels.forEach((pixel) => {
  //         const gridX = Math.floor(pixel.x / gridWidth);
  //         const gridY = Math.floor(pixel.y / gridHeight);
  //         const gridIndex = gridY * gridSize + gridX;
  //         if (gridSections[gridIndex]) {
  //           gridSections[gridIndex].push(pixel);
  //         }
  //       });

  //       // Function to find position balancing grid distribution and relationships
  //       function findBestPosition(
  //         nodeId: number,
  //         availableGridSections: typeof gridSections
  //       ): { x: number; y: number } {
  //         const connectedNodes = adjacencyList.get(nodeId) || new Set();
  //         const placedConnections = Array.from(connectedNodes).filter((id) =>
  //           placedNodes.has(id)
  //         );

  //         // Find grid sections with available pixels
  //         const validSections = availableGridSections
  //           .map((section, index) => ({ section, index }))
  //           .filter(({ section }) => section.length > 0);

  //         if (validSections.length === 0) {
  //           // If no valid sections, fall back to any remaining pixel
  //           const allRemaining = availableGridSections.flat();
  //           return allRemaining[
  //             Math.floor(Math.random() * allRemaining.length)
  //           ];
  //         }

  //         // If no connections, just pick a random point from a random valid section
  //         if (placedConnections.length === 0) {
  //           const randomSectionIndex = Math.floor(
  //             Math.random() * validSections.length
  //           );
  //           const section = validSections[randomSectionIndex].section;
  //           return section[Math.floor(Math.random() * section.length)];
  //         }

  //         // Score each valid section based on connection distances
  //         let bestPosition = validSections[0].section[0];
  //         let bestScore = Infinity;

  //         validSections.forEach(({ section }) => {
  //           // Sample a few points from the section
  //           const sampleSize = Math.min(5, section.length);
  //           const samples = section
  //             .sort(() => Math.random() - 0.5)
  //             .slice(0, sampleSize);

  //           samples.forEach((point) => {
  //             let totalDistance = 0;
  //             placedConnections.forEach((connectedId) => {
  //               const connectedPos = placedNodes.get(connectedId)!;
  //               totalDistance += distance(point, connectedPos);
  //             });

  //             // Lower score is better, but we divide by section.length to favor
  //             // sections with more available points
  //             const score = totalDistance / section.length;

  //             if (score < bestScore) {
  //               bestScore = score;
  //               bestPosition = point;
  //             }
  //           });
  //         });

  //         return bestPosition;
  //       }

  //       // Sort nodes by connection count for processing order
  //       const nodesByConnections = [...nodes].sort(
  //         (a, b) =>
  //           (adjacencyList.get(b.Id)?.size || 0) -
  //           (adjacencyList.get(a.Id)?.size || 0)
  //       );

  //       // Place each node
  //       for (const node of nodesByConnections) {
  //         const position = findBestPosition(node.Id, gridSections);
  //         placedNodes.set(node.Id, position);

  //         // Remove used position from its grid section
  //         const gridX = Math.floor(position.x / gridWidth);
  //         const gridY = Math.floor(position.y / gridHeight);
  //         const gridIndex = gridY * gridSize + gridX;
  //         if (gridSections[gridIndex]) {
  //           const posIndex = gridSections[gridIndex].findIndex(
  //             (p) => p.x === position.x && p.y === position.y
  //           );
  //           if (posIndex !== -1) {
  //             gridSections[gridIndex].splice(posIndex, 1);
  //           }
  //         }

  //         // Normalize to THREE.js space
  //         const scale = 10;
  //         const aspectRatio = canvas.width / canvas.height;
  //         const normalizedPosition = {
  //           x: (position.x / canvas.width - 0.5) * scale * aspectRatio,
  //           y: -(position.y / canvas.height - 0.5) * scale,
  //           z: 0,
  //         };

  //         // Store in final positions array
  //         const originalIndex = nodes.findIndex((n) => n.Id === node.Id);
  //         finalPositions[originalIndex] = normalizedPosition;
  //       }

  //       resolve(finalPositions);
  //     };
  //     img.src = imageUrl;
  //   });
  // }

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
      const nodeData = (intersects[0].object as NodeMesh).graphData;
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
