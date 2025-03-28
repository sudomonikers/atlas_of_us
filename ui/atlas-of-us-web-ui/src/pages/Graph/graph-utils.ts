import type { HttpService } from "../../services/http-service";
import type {
  GraphData,
  NodeCoordinate,
  Neo4jApiResponse,
  Neo4jNodeWithMappedPositions,
  ThreeContext,
  Neo4jRelationship
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

  async loadMostRelatedNodeBySearch(searchTerm: string, depth: number): Promise<Neo4jApiResponse> {
    return this.httpService.fetchNodes(`/api/secure/graph/get-node-with-relationships-by-search-term?searchTerm=${searchTerm}&depth=${depth}`);
  }

  centerCameraOnMesh(
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    object: THREE.Object3D
  ) {
    object.userData.isCentered = true;
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
      center.z + 150 //center.z + cameraZ * 2.0 // Add 10% padding
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

  addInfoBoxToMesh(
    mesh: THREE.Mesh
  ) {
    const content = mesh.userData.nodeData;

    const infoBoxElement = document.createElement("div");
    infoBoxElement.className = "info-box";
  
    // Format the content, these classes are set in app.css
    let htmlContent = `
      <div class="info-box-header">${content.name}</div>
      <div class="info-box-property"><span>Labels:</span> ${content.labels.join(", ")}</div>
      <div class="info-box-content">
      <div class="info-box-property"><span>Description:</span> ${content.description}</div>
      </div>
    `;
    infoBoxElement.innerHTML = htmlContent;
  
    const infoBox = new CSS2DObject(infoBoxElement);
    
    // Position the info box slightly above the mesh (adjust offset as needed)
    infoBox.position.set(0, mesh.geometry.boundingSphere?.radius ?? 2, 0);
    
    // Add the info box directly to the mesh
    mesh.add(infoBox);    
    mesh.userData.infoBox = true
  }

  addInfoBoxToRelationship(
    line: THREE.Line,
    relationship: Neo4jRelationship
  ) {
    // Create the HTML element for the info box
    const infoBoxElement = document.createElement("div");
    infoBoxElement.className = "info-box";
  
    // Format the relationship content
    let htmlContent = `
      <div class="relationship-info-header">${relationship.type}</div>
      `;
  
    // Add any custom properties from the relationship
    if (relationship.props && Object.keys(relationship.props).length > 0) {
      htmlContent += `<div class="relationship-info-properties">`;
      for (const [key, value] of Object.entries(relationship.props)) {
        htmlContent += `<div class="relationship-info-property"><span>${key}:</span> ${value}</div>`;
      }
      htmlContent += `</div>`;
    }
  
    infoBoxElement.innerHTML = htmlContent;
  
    // Create the CSS2D object
    const infoBox = new CSS2DObject(infoBoxElement);
    
    // Position the info box at the midpoint of the line
    let midpoint;
    
    // Check if the line has positions array (for curved lines)
    if (line.geometry.attributes.position.count > 2) {
      // For curved lines, find the middle point in the array
      const positions = line.geometry.attributes.position.array;
      const middleIndex = Math.floor(positions.length / 6) * 3; // Find middle vertex
      midpoint = new THREE.Vector3(
        positions[middleIndex],
        positions[middleIndex + 1],
        positions[middleIndex + 2]
      );
    } else {
      // For straight lines, use the first and last points
      const positions = line.geometry.attributes.position.array;
      midpoint = new THREE.Vector3(
        (positions[0] + positions[3]) / 2,
        (positions[1] + positions[4]) / 2,
        (positions[2] + positions[5]) / 2
      );
    }
    
    infoBox.position.copy(midpoint);
    line.add(infoBox);    
    line.userData.infoBox = true;
  }

  showRelationshipLines(activeMesh: THREE.Object3D, threeContext: ThreeContext, graphData: Neo4jApiResponse) {
    this.clearRelationshipLines(threeContext);
    
    const activeNodeId = activeMesh.userData.nodeData.elementId;
    
    // Find all relationships for the active node
    const relevantRelationships = graphData.relationships.filter(rel =>
      rel.startElementId === activeNodeId || rel.endElementId === activeNodeId
    );
        
    // Group relationships by the target node
    const relationshipsByTarget = {};
    
    relevantRelationships.forEach(rel => {
      const targetNodeId = rel.startElementId === activeNodeId 
        ? rel.endElementId 
        : rel.startElementId;
      
      if (!relationshipsByTarget[targetNodeId]) {
        relationshipsByTarget[targetNodeId] = [];
      }
      relationshipsByTarget[targetNodeId].push(rel);
    });
    
    // Process each target node
    Object.keys(relationshipsByTarget).forEach(targetNodeId => {
      const relationships = relationshipsByTarget[targetNodeId];
      const targetMesh = this.findObjectByElementId(threeContext.scene, targetNodeId);
      const startPosition = activeMesh.position.clone();
      const endPosition = targetMesh.position.clone();
      
      // If single relationship, draw straight line
      if (relationships.length === 1) {
        const relationship = relationships[0];
        const geometry = new THREE.BufferGeometry().setFromPoints([
          startPosition,
          endPosition
        ]);
        
        const lineColor = 0xff00ff; // Magenta as default
        
        const material = new THREE.LineBasicMaterial({
          color: lineColor,
          linewidth: 5,
          opacity: 1,
          transparent: true
        });
        
        const line = new THREE.Line(geometry, material);
        line.userData = {
          relationship: relationship,
          sourceId: activeNodeId,
          targetId: targetNodeId
        };
        
        threeContext.scene.add(line);
        this.addInfoBoxToRelationship(line, relationship);
        
      } else {
        // Multiple relationships - draw curved lines
        relationships.forEach((relationship, index) => {
          const midPoint = new THREE.Vector3().addVectors(startPosition, endPosition).multiplyScalar(0.5);
          const distance = startPosition.distanceTo(endPosition);          
          const direction = new THREE.Vector3().subVectors(endPosition, startPosition).normalize();
          
          // Calculate perpendicular vector in the XY plane
          const perpendicular = new THREE.Vector3(-direction.z, 0, direction.x);
          if (perpendicular.length() < 0.1) {
            // If direction is mainly along Y axis, use a different perpendicular
            perpendicular.set(1, 0, 0);
          }
          perpendicular.normalize();
          
          // Calculate curve offset
          const offsetFactor = 0.2 * distance;
          const indexOffset = index - (relationships.length - 1) / 2;
          const offset = perpendicular.clone().multiplyScalar(indexOffset * offsetFactor);
          
          // Apply offset to midpoint
          const controlPoint = midPoint.clone().add(offset);
          
          // Create curve points
          const curvePoints = [];
          for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            
            // Quadratic Bezier formula: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
            const point = new THREE.Vector3();
            const mt = 1 - t;
            
            point.x = mt * mt * startPosition.x + 2 * mt * t * controlPoint.x + t * t * endPosition.x;
            point.y = mt * mt * startPosition.y + 2 * mt * t * controlPoint.y + t * t * endPosition.y;
            point.z = mt * mt * startPosition.z + 2 * mt * t * controlPoint.z + t * t * endPosition.z;
            
            curvePoints.push(point);
          }
          
          // Create line geometry
          const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
          
          const lineColor = 0xff00ff; // Default magenta
          
          const material = new THREE.LineBasicMaterial({
            color: lineColor,
            linewidth: 4,
            opacity: 1,
            transparent: true
          });
          
          const line = new THREE.Line(geometry, material);
          line.userData = {
            relationship: relationship,
            sourceId: activeNodeId,
            targetId: targetNodeId
          };
          
          threeContext.scene.add(line);
          this.addInfoBoxToRelationship(line, relationship);
        });
      }
    });
  }

  findObjectByElementId(object, elementId) {
    // Check if the current object matches
    if (object.userData?.nodeData?.elementId === elementId) {
      return object;
    }
    
    // If it has children, check them recursively
    if (object.children && object.children.length > 0) {
      for (const child of object.children) {
        const result = this.findObjectByElementId(child, elementId);
        if (result) return result;
      }
    }
    
    // No match found in this branch
    return null;
  }
  
  clearRelationshipLines(threeContext: ThreeContext, exceptionElementIds?: string[]) {
    const children = [...threeContext.scene.children];
    
    children.forEach((child) => {
      if (child instanceof THREE.Line && !exceptionElementIds?.includes(child.userData.relationship.id)) {
        if (child.children.length) {
          child.children.forEach((element) => {
            child.remove(element);
          })
        }
        threeContext.scene.remove(child);
        
        // Proper cleanup to avoid memory leaks
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }

  clearFocus(threeContext: ThreeContext, mesh: THREE.Object3D) {
    mesh.userData.isCentered = false;
    this.removeInfoBoxFromMesh(mesh);
    this.clearRelationshipLines(threeContext);
    this.lerpCameraToPosition(threeContext, mesh.position);
  }

  lerpCameraToPosition(
    threeContext: ThreeContext,
    targetLookAt: THREE.Vector3,
    duration: number = 1000
  ) {
    console.log(threeContext.homeCameraPosition)
    const { camera, homeCameraPosition, controls } = threeContext;
    
    // Capture the starting position and target
    const startPosition = camera.position.clone();
    const startTarget = controls.target.clone();
    const startTime = Date.now();
  
    function updateCamera() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
  
      // Use the same easing function for smooth animation
      const easeProgress = 1 - Math.cos((progress * Math.PI) / 2);
  
      // Lerp the camera position and controls target
      camera.position.lerpVectors(startPosition, homeCameraPosition, easeProgress);
      controls.target.lerpVectors(startTarget, targetLookAt, easeProgress);
  
      camera.lookAt(controls.target);
      controls.update();
  
      if (progress < 1) {
        requestAnimationFrame(updateCamera);
      }
    }
  
    updateCamera();
  }

  removeInfoBoxFromMesh(mesh: THREE.Object3D): void {
    if (mesh.userData.infoBox) {
      mesh.remove(mesh.children[0]);
      mesh.userData.infoBox = null;
    }
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
