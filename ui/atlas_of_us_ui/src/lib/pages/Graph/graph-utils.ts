import type { HttpService } from "../../services/http-service";
import type {
  GraphData,
  NodeCoordinate,
  Neo4jApiResponse,
  Neo4jNodeWithMappedPositions,
  ThreeContext
} from "./graph-interfaces.interface";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export class GraphUtils {
  constructor(private httpService: HttpService) {}

  async processImage(
    image: HTMLImageElement,
    numPoints: number,
    threshold: number
  ): Promise<{ x: number; y: number; z: number }[]> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

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

    return points;
  }

  async loadL1Nodes(): Promise<GraphData> {
    const personalityNodes = await this.httpService.getPersonalityNodes();
    const healthNodes = await this.httpService.getHealthNodes();
    // knowledgeNodes = await http.getKnowledgeNodes();
    // intrinsicsNodes = await http.getIntrinsicNodes();
    // pursuitsNodes = await http.getPursuitNodes();
    // skillsNodes = await http.getSkillNodes();
    const knowledgeNodes = personalityNodes;
    const intrinsicsNodes = healthNodes;
    const pursuitsNodes = personalityNodes;
    const skillsNodes = healthNodes;
    const graphData = {
      healthNodes,
      personalityNodes,
      knowledgeNodes,
      intrinsicsNodes,
      pursuitsNodes,
      skillsNodes
    };
    return graphData;
  }

  async createGraphConstellation(
    imagePoints: NodeCoordinate[],
    sceneLocation: NodeCoordinate,
    loadedImage: HTMLImageElement,
    threeContext: ThreeContext,
    graphData: Neo4jApiResponse
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
    threeContext.container.addEventListener("click", (event) => {
      // Calculate mouse position in normalized device coordinates
      const rect = threeContext.container.getBoundingClientRect();
      threeContext.mouse.x =
        ((event.clientX - rect.left) / threeContext.container.offsetWidth) * 2 -
        1;
      threeContext.mouse.y =
        -((event.clientY - rect.top) / threeContext.container.offsetHeight) *
          2 +
        1;

      // Update the raycaster
      threeContext.raycaster.setFromCamera(
        threeContext.mouse,
        threeContext.camera
      );

      // Check for intersections with the particle system
      const intersects = threeContext.raycaster.intersectObject(particleSystem);

      if (intersects.length > 0) {
        this.centerCameraOnMesh(
          threeContext.camera,
          threeContext.controls,
          particleSystem
        );
      }
    });

    // Store the particle data and image dimensions for later use
    particleSystem.userData = {
      particleData: particleData,
      graphData: graphData,
      imageWidth: width,
      imageHeight: height,
    };

    particleSystem.position.set(
      sceneLocation.x,
      sceneLocation.y,
      sceneLocation.z
    );
    threeContext.scene.add(particleSystem);

    // Calculate the necessary camera Z position to view the entire image
    const aspectRatio =
      threeContext.container.offsetWidth / threeContext.container.offsetHeight;
    const imageAspectRatio = width / height;

    let cameraZ;
    if (aspectRatio > imageAspectRatio) {
      // Window is wider than image
      cameraZ =
        height / (2 * Math.tan((Math.PI * threeContext.camera.fov) / 360));
    } else {
      // Window is taller than image
      cameraZ =
        width /
        (2 * Math.tan((Math.PI * threeContext.camera.fov) / 360) * aspectRatio);
    }

    // Add some padding
    cameraZ *= 1.1;
    threeContext.camera.position.z = cameraZ;
    threeContext.camera.updateProjectionMatrix();

    return particleSystem;
  }

  centerCameraOnMesh(
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

  generateNaryTree(data: GraphData, numberOfBranches: number) {
    const keys = Object.keys(data);
  
    function buildTree(keys, branches) {
      if (keys.length === 0) {
        return null;
      }
  
      const rootKey = keys[0];
      const rootNode = {
        key: rootKey,
        value: null,
        children: [],
      };
  
      const remainingKeys = keys.slice(1);
      const keysPerBranch = Math.ceil(remainingKeys.length / branches);
  
      for (let i = 0; i < branches; i++) {
        if (remainingKeys.length > 0) {
          const branchKeys = remainingKeys.splice(0, keysPerBranch);
          if (branchKeys.length > 0) {
            const childNode = buildTree(branchKeys, branches);
            if (childNode) {
              rootNode.children.push(childNode);
            }
          }
        }
      }
  
      return rootNode;
    }
  
    return buildTree(keys, numberOfBranches);
  }

  flattenNestedStructure(obj) {
    // Start with current node (without children)
    const { children, ...currentNode } = obj;
    const result = [currentNode];
    
    // Base case: if no children or empty children array
    if (!children || children.length === 0) {
      return result;
    }
  
    // Recursively flatten each child and concatenate results
    return result.concat(
      children.flatMap(child => this.flattenNestedStructure(child))
    );
  }

  positionTreeNodesBasedOnTree(
    camera: THREE.PerspectiveCamera,
    data: GraphData,
    branchesPerNode: number,
    distanceFactor = 2
  ) {
    const tree = this.generateNaryTree(data, branchesPerNode);
    const cameraPosition = camera.position;
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
  
    function calculateNodePosition(node, parentPosition = null, level = 0) {
      if (!node) return;
  
      // Root node positioning
      if (level === 0) {
        node.value = {
          x: cameraPosition.x + cameraDirection.x * distanceFactor,
          y: cameraPosition.y + cameraDirection.y * distanceFactor,
          z: cameraPosition.z + cameraDirection.z * distanceFactor
        };
      } else {
        // Child node positioning
        const angleStep = (2 * Math.PI) / branchesPerNode;
        console.log("angleStep", angleStep)
        const radius = distanceFactor * (Math.sqrt(level) + 1); // Increased base radius
        
        // Calculate position based on parent and branch number
        const childIndex = parentPosition.childCount || 0;
        const angle = angleStep * childIndex + (Math.PI / branchesPerNode); // Offset starting angle
        
        // For 3+ branches, create true pyramid structure
        if (branchesPerNode >= 3) {
          // Calculate golden ratio for better visual distribution
          const goldenRatio = 1.618033988749895;
          
          // Adjust radius and height based on number of branches
          const adjustedRadius = radius * (1 + (childIndex / branchesPerNode));
          const heightFactor = distanceFactor * goldenRatio;
          
          // Calculate 3D coordinates with emphasis on z-axis distribution
          const xOffset = Math.cos(angle) * adjustedRadius;
          const yOffset = Math.sin(angle) * adjustedRadius;
          const zOffset = -radius * heightFactor; // More pronounced z-axis movement
          
          node.value = {
            x: parentPosition.x + xOffset,
            y: parentPosition.y + yOffset,
            z: parentPosition.z + zOffset
          };
        } else {
          // For 2 or fewer branches, maintain original planar distribution
          const xOffset = Math.cos(angle) * radius;
          const yOffset = Math.sin(angle) * radius;
          
          node.value = {
            x: parentPosition.x + xOffset,
            y: parentPosition.y + yOffset,
            z: parentPosition.z - radius * 0.5
          };
        }
  
        // Update parent's child count
        parentPosition.childCount = (parentPosition.childCount || 0) + 1;
      }
  
      // Process children
      for (const child of node.children) {
        calculateNodePosition(child, node.value, level + 1);
      }
    }
  
    calculateNodePosition(tree);
    return tree;
  }
}
