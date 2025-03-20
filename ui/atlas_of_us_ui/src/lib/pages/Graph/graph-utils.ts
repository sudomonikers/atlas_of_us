import type { HttpService } from "../../services/http-service";
import type {
  GraphData,
  NodeCoordinate,
  Neo4jApiResponse,
  Neo4jNodeWithMappedPositions,
  ThreeContext,
  Neo4jNode
} from "./graph-interfaces.interface";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js';

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
    const [
      personalityNodes,
      // healthNodes,
      // knowledgeNodes,
      // intrinsicsNodes,
      // pursuitsNodes,
      // skillsNodes,
    ] = await Promise.all([
      this.httpService.fetchNodes('/api/secure/graph/get-nodes?labels=L1,Personality'),
      // this.httpService.fetchNodes('/api/secure/graph/get-nodes?labels=L1,Health'),
      // this.httpService.fetchNodes('/api/secure/graph/get-nodes?labels=L1,Knowledge'),
      // this.httpService.fetchNodes('/api/secure/graph/get-nodes?labels=L1,Intrinsic'),
      // this.httpService.fetchNodes('/api/secure/graph/get-nodes?labels=L1,Pursuit'),
      // this.httpService.fetchNodes('/api/secure/graph/get-nodes?labels=L1,Skill'),
    ]);
    const graphData = {
      personalityNodes,
      // healthNodes,
      // knowledgeNodes,
      // intrinsicsNodes,
      // pursuitsNodes,
      // skillsNodes
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
    const selectedIndices = new Set<number>();

    // Assign graph data to some particles if provided
    if (graphData && graphData.nodes.length > 0) {
      // Determine how many particles will have data
      const dataPointCount = Math.min(
        graphData.nodes.length,
        Math.floor(imagePoints.length * 0.1)
      );

      while (selectedIndices.size < dataPointCount) {
        //for now choosing random indexes
        const randomIndex = Math.floor(Math.random() * imagePoints.length);
        selectedIndices.add(randomIndex);
      }
    }

    // Fill positions array
    let nodeDataPosition = 0
    for (let i = 0; i < imagePoints.length; i++) {
      positions[i * 3] = imagePoints[i].x;
      positions[i * 3 + 1] = imagePoints[i].y;
      positions[i * 3 + 2] = imagePoints[i].z;

      //if this node is "special" than make it a different color and add its position to our graphData
      if (selectedIndices.has(i)) {
        colors[i * 3] = 1.0; // R
        colors[i * 3 + 1] = 0; // G
        colors[i * 3 + 2] = 0; // B

        (graphData.nodes[nodeDataPosition] as Neo4jNodeWithMappedPositions).coordinates = {
          x: imagePoints[i].x,
          y: imagePoints[i].y,
          z: imagePoints[i].z
        }
        nodeDataPosition ++;
      } else {
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
      opacity: 1,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      vertexColors: true,
    });

    // Create particle system
    const particleSystem = new THREE.Points(geometry, material);

    particleSystem.position.set(
      sceneLocation.x,
      sceneLocation.y,
      sceneLocation.z
    );
    particleSystem.userData = {selectedIndices, graphData}
    console.log(particleSystem)
    threeContext.scene.add(particleSystem);

    // Calculate the necessary camera Z position to view the entire image
    const aspectRatio = threeContext.container.offsetWidth / threeContext.container.offsetHeight;
    const imageAspectRatio = width / height;

    let cameraZ;
    if (aspectRatio > imageAspectRatio) {
      // Window is wider than image
      cameraZ = height / (2 * Math.tan((Math.PI * threeContext.camera.fov) / 360));
    } else {
      // Window is taller than image
      cameraZ = width / (2 * Math.tan((Math.PI * threeContext.camera.fov) / 360) * aspectRatio);
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

  applyBlurEffect(
    threeContext: ThreeContext,
    focusedObject: THREE.Object3D
  ) {

  }

  addInfoBoxToPosition(
    position: THREE.Vector3,
    content: Neo4jNode,
    threeContext: ThreeContext
  ) {
    // Create a div element for the info box
    const infoBoxElement = document.createElement("div");
    infoBoxElement.className = "info-box";

    // Format the content, these classes are set in app.css
    let htmlContent = `
      <div class="info-box-header">${content.Labels.join(", ")}</div>
      <div class="info-box-id">ID: ${content.Id}</div>
      <div class="info-box-content">
    `;

    // Add properties
    for (const [key, value] of Object.entries(content.Props)) {
      htmlContent += `<div class="info-box-property"><span>${key}:</span> ${value}</div>`;
    }

    htmlContent += `</div>`;
    infoBoxElement.innerHTML = htmlContent;

    const infoBox = new CSS2DObject(infoBoxElement);

    // Create a dummy object to hold the info box
    const dummy = new THREE.Object3D();
    dummy.position.copy(position);

    // Position the label at the bottom of the box
    infoBox.position.set(0, 0, 0); // Adjust as needed
    dummy.add(infoBox);

    // Add the dummy object to the scene
    threeContext.scene.add(dummy);

    // Return the dummy object so it can be removed later if needed
    console.log(infoBox)
    return dummy;
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
        coordinates: null,
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
    distanceFactor: number
  ) {
    const tree = this.generateNaryTree(data, branchesPerNode);
    const cameraPosition = camera.position.clone();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldDirection(cameraDirection);
  
    // Position root node in front of camera
    tree.coordinates = {
      x: cameraPosition.x + cameraDirection.x * distanceFactor,
      y: cameraPosition.y + cameraDirection.y * distanceFactor,
      z: cameraPosition.z + cameraDirection.z * distanceFactor
    };
    function positionNodesRecursively(node, parentPosition) {
      if (!node || node.children.length === 0) return;
  
      const nodePosition = new THREE.Vector3(
        node.coordinates.x,
        node.coordinates.y,
        node.coordinates.z
      );
  
      // Create direction vector from parent to current node
      const currentDirection = new THREE.Vector3()
        .subVectors(nodePosition, parentPosition)
        .normalize();
  
      // Calculate the base circle of the cone for this node's children
      const coneAngle = Math.PI / 6; // 30 degrees
      const baseRadius = Math.tan(coneAngle) * distanceFactor;
  
      // Create basis vectors for the circle perpendicular to current direction
      const right = new THREE.Vector3();
      const up = new THREE.Vector3();
  
      // If current direction is nearly parallel to world-up, use a different reference vector
      const worldUp = new THREE.Vector3(0, 1, 0);
      if (Math.abs(currentDirection.dot(worldUp)) > 0.9) {
        right.set(1, 0, 0);
      } else {
        right.crossVectors(currentDirection, worldUp).normalize();
      }
      right.crossVectors(currentDirection, worldUp).normalize();
      up.crossVectors(right, currentDirection).normalize();
  
      // Position each child around the base of the cone
      node.children.forEach((child, index) => {
        const angle = (index / node.children.length) * Math.PI * 2;
        
        // Start at the parent node's position
        const childPosition = new THREE.Vector3().copy(nodePosition);
        
        // Move in the current direction by distanceFactor
        childPosition.add(
          currentDirection.clone().multiplyScalar(distanceFactor)
        );
  
        // Add circular offset using the basis vectors
        childPosition.add(
          right.clone().multiplyScalar(Math.cos(angle) * baseRadius)
        );
        childPosition.add(
          up.clone().multiplyScalar(Math.sin(angle) * baseRadius)
        );
  
        child.coordinates = {
          x: childPosition.x,
          y: childPosition.y,
          z: childPosition.z
        };
  
        // Recursively position this child's children
        positionNodesRecursively(child, nodePosition);
      });
    }
  
    // Start recursive positioning from root
    positionNodesRecursively(tree, cameraPosition);
    return tree;
  }
}
