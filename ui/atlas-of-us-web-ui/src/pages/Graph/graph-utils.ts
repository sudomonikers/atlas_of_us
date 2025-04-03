import type { HttpService } from "../../services/http-service";
import type { Neo4jApiResponse } from "./graph-interfaces.interface";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useThree } from "@react-three/fiber";

export class GraphUtils {
  constructor(private httpService: HttpService) {}

  async processImage(
    imageBlob: Blob,
    threshold: number,
    center: THREE.Vector3,
    selectionRatio: number,
  ): Promise<{ x: number; y: number; z: number }[]> {
    const imageUrl = URL.createObjectURL(imageBlob);
    const image = new Image();
    image.src = imageUrl;
    await new Promise<HTMLImageElement>((resolve, reject) => {
      image.onload = () => {
        URL.revokeObjectURL(imageUrl);
        resolve(image);
      };
      image.onerror = (error) => {
        URL.revokeObjectURL(imageUrl);
        reject(error);
      };
    });
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);
  
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const edgePixels = [];
  
    // Center in image coordinates
    const centerX = image.width / 2;
    const centerY = image.height / 2;
    
    let closestPixel = null;
    let minDistance = Infinity;
  
    // Collect dark pixels using original pixel coordinates
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
  
        if (brightness < threshold) {
          edgePixels.push({ x, y });
          
          // Calculate distance to the center
          const distanceToCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          
          // Check if this is the closest dark pixel to center
          if (distanceToCenter < minDistance) {
            minDistance = distanceToCenter;
            closestPixel = { x, y };
          }
        }
      }
    }
  
    // If no dark pixels found, return empty array
    if (edgePixels.length === 0) {
      return [];
    }
  
    // Find offset between closest dark pixel and center
    const offsetX = closestPixel ? (closestPixel.x - centerX) : 0;
    const offsetY = closestPixel ? (closestPixel.y - centerY) : 0;
  
    // Calculate how many points to select (33% of total dark pixels)
    const numPointsToSelect = Math.max(1, Math.floor(edgePixels.length * selectionRatio));
    
    // Select random points
    const selectedPixels = [];
    for (let i = 0; i < numPointsToSelect; i++) {
      const randomIndex = Math.floor(Math.random() * edgePixels.length);
      selectedPixels.push(edgePixels[randomIndex]);
    }
  
    // Adjust points relative to the closest dark pixel to center
    const points = selectedPixels.map((pixel) => ({
      x: pixel.x - (centerX + offsetX) + center.x,
      y: -(pixel.y - (centerY + offsetY)) + center.y,
      z: center.z
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

  centerCameraOnMesh = (object: THREE.Object3D, distanceFactor: number) => {
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
      center.z + distanceFactor
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
