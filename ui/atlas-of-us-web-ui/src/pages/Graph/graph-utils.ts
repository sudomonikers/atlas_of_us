import type { HttpService } from "../../services/http-service";
import type { Neo4jApiResponse } from "./graph-interfaces.interface";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useThree } from "@react-three/fiber";

export class GraphUtils {
  constructor(private httpService: HttpService) {}

  async processImage(
    image: HTMLImageElement,
    numPoints: number,
    threshold: number,
    center: THREE.Vector3
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
      x: pixel.x - canvas.width / 2 + center.x, // Add center offset
      y: -(pixel.y - canvas.height / 2) + center.y, // Flip Y for Three.js coordinate system and add center offset
      z: center.z, // Set all points to z=0 plane initially
    }));

    return points;
  }

  async loadMostRelatedNodeBySearch(
    searchTerm: string,
    depth: number
  ): Promise<Neo4jApiResponse> {
    return this.httpService.fetchNodes(
      `/api/secure/graph/get-node-with-relationships-by-search-term?searchTerm=${searchTerm}&depth=${depth}`
    );
  }

  async loadNodeById(
    elementId: string,
    depth: number
  ): Promise<Neo4jApiResponse> {
    const queryParams = new URLSearchParams({
      properties: JSON.stringify({
        elementId: elementId
      }),
      depth: depth.toString()
    });
    return this.httpService.fetchNodes(
      `/api/secure/graph/get-nodes?${queryParams.toString()}`
    );
  }

  centerCameraOnMesh = (object: THREE.Object3D) => {
    const threeState = useThree();
    const controls = threeState.controls as OrbitControls;
    const camera = threeState.camera as THREE.PerspectiveCamera;
    // Get the bounding box of the object
    const bbox = new THREE.Box3().setFromObject(object);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Calculate the size of the bounding box
    const size = new THREE.Vector3();
    bbox.getSize(size);

    // Create a new position for the camera
    const targetPosition = new THREE.Vector3(
      center.x,
      center.y,
      center.z + 150
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
      controls.target.lerpVectors(startTarget, center, easeProgress);

      camera.lookAt(center);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(updateCamera);
      }
    }

    updateCamera();
  };

  // generateNaryTree(data: GraphData, numberOfBranches: number) {
  //   const keys = Object.keys(data);

  //   function buildTree(keys, branches) {
  //     if (keys.length === 0) {
  //       return null;
  //     }

  //     const rootKey = keys[0];
  //     const rootNode = {
  //       key: rootKey,
  //       coordinates: null,
  //       children: [],
  //     };

  //     const remainingKeys = keys.slice(1);
  //     const keysPerBranch = Math.ceil(remainingKeys.length / branches);

  //     for (let i = 0; i < branches; i++) {
  //       if (remainingKeys.length > 0) {
  //         const branchKeys = remainingKeys.splice(0, keysPerBranch);
  //         if (branchKeys.length > 0) {
  //           const childNode = buildTree(branchKeys, branches);
  //           if (childNode) {
  //             rootNode.children.push(childNode);
  //           }
  //         }
  //       }
  //     }

  //     return rootNode;
  //   }

  //   return buildTree(keys, numberOfBranches);
  // }

  // flattenNestedStructure(obj) {
  //   // Start with current node (without children)
  //   const { children, ...currentNode } = obj;
  //   const result = [currentNode];

  //   // Base case: if no children or empty children array
  //   if (!children || children.length === 0) {
  //     return result;
  //   }

  //   // Recursively flatten each child and concatenate results
  //   return result.concat(
  //     children.flatMap(child => this.flattenNestedStructure(child))
  //   );
  // }

  // positionTreeNodesBasedOnTree(
  //   camera: THREE.PerspectiveCamera,
  //   data: GraphData,
  //   branchesPerNode: number,
  //   distanceFactor: number
  // ) {
  //   const tree = this.generateNaryTree(data, branchesPerNode);
  //   const cameraPosition = camera.position.clone();
  //   const cameraDirection = new THREE.Vector3();
  //   camera.getWorldDirection(cameraDirection);

  //   // Position root node in front of camera
  //   tree.coordinates = {
  //     x: cameraPosition.x + cameraDirection.x * distanceFactor,
  //     y: cameraPosition.y + cameraDirection.y * distanceFactor,
  //     z: cameraPosition.z + cameraDirection.z * distanceFactor
  //   };
  //   function positionNodesRecursively(node, parentPosition) {
  //     if (!node || node.children.length === 0) return;

  //     const nodePosition = new THREE.Vector3(
  //       node.coordinates.x,
  //       node.coordinates.y,
  //       node.coordinates.z
  //     );

  //     // Create direction vector from parent to current node
  //     const currentDirection = new THREE.Vector3()
  //       .subVectors(nodePosition, parentPosition)
  //       .normalize();

  //     // Calculate the base circle of the cone for this node's children
  //     const coneAngle = Math.PI / 6; // 30 degrees
  //     const baseRadius = Math.tan(coneAngle) * distanceFactor;

  //     // Create basis vectors for the circle perpendicular to current direction
  //     const right = new THREE.Vector3();
  //     const up = new THREE.Vector3();

  //     // If current direction is nearly parallel to world-up, use a different reference vector
  //     const worldUp = new THREE.Vector3(0, 1, 0);
  //     if (Math.abs(currentDirection.dot(worldUp)) > 0.9) {
  //       right.set(1, 0, 0);
  //     } else {
  //       right.crossVectors(currentDirection, worldUp).normalize();
  //     }
  //     right.crossVectors(currentDirection, worldUp).normalize();
  //     up.crossVectors(right, currentDirection).normalize();

  //     // Position each child around the base of the cone
  //     node.children.forEach((child, index) => {
  //       const angle = (index / node.children.length) * Math.PI * 2;

  //       // Start at the parent node's position
  //       const childPosition = new THREE.Vector3().copy(nodePosition);

  //       // Move in the current direction by distanceFactor
  //       childPosition.add(
  //         currentDirection.clone().multiplyScalar(distanceFactor)
  //       );

  //       // Add circular offset using the basis vectors
  //       childPosition.add(
  //         right.clone().multiplyScalar(Math.cos(angle) * baseRadius)
  //       );
  //       childPosition.add(
  //         up.clone().multiplyScalar(Math.sin(angle) * baseRadius)
  //       );

  //       child.coordinates = {
  //         x: childPosition.x,
  //         y: childPosition.y,
  //         z: childPosition.z
  //       };

  //       // Recursively position this child's children
  //       positionNodesRecursively(child, nodePosition);
  //     });
  //   }

  //   // Start recursive positioning from root
  //   positionNodesRecursively(tree, cameraPosition);
  //   return tree;
  // }
}
