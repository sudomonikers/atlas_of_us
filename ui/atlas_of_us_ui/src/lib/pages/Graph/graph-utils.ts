import type { HttpService } from "../../services/http-service";
import type {
  GraphData,
  NodeCoordinate,
  Neo4jApiResponse,
  Neo4jNodeWithMappedPositions,
  ThreeContext,
  Neo4jNode,
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

  async loadNodeAndAffiliatesById(id: string): Promise<Neo4jApiResponse> {
    return this.httpService.fetchNodes(`/api/secure/graph/get-node-with-relationships-by-id?id=${id}`);
  }

  async createGraphConstellation(
    imagePoints: NodeCoordinate[],
    sceneLocation: NodeCoordinate,
    loadedImage: HTMLImageElement,
    threeContext: ThreeContext,
    graphData: Neo4jApiResponse
  ): Promise<THREE.Group> {
    console.log(graphData)
    const width = loadedImage.width;
    const height = loadedImage.height;
  
    // Create a group to hold all the spheres
    const constellationGroup = new THREE.Group();
    constellationGroup.position.set(
      sceneLocation.x,
      sceneLocation.y,
      sceneLocation.z
    );
  
    // Map to store sphere objects with their indices for later reference
    const sphereMap = new Map<number, THREE.Mesh>();
    const selectedIndices = new Set<number>();
  
    // Assign graph data to some particles if provided
    if (graphData && graphData.affiliates.length > 0) {
      // Determine how many particles will have data (for the affiliates)
      const dataPointCount = Math.min(
        graphData.affiliates.length,
        Math.floor(imagePoints.length * 0.1) - 1 // Reserve one spot for parent node
      );
  
      while (selectedIndices.size < dataPointCount) {
        // For now choosing random indexes, but skip index 0 (we'll use that for parent)
        const randomIndex = Math.floor(Math.random() * (imagePoints.length - 1)) + 1;
        selectedIndices.add(randomIndex);
      }
    }
  
    // Create shared geometry for better performance
    const regularSphereGeometry = new THREE.SphereGeometry(1.0, 8, 8);
    const dataSphereGeometry = new THREE.SphereGeometry(1.5, 12, 12);
    const parentSphereGeometry = new THREE.SphereGeometry(2.0, 16, 16); // Larger for parent node
    
    // Create shared materials
    const regularMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 });
    const dataMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 1.0 });
    const parentMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 1.0 }); // Different color for parent
  
    // Create parent node at index 0
    const parentSphere = new THREE.Mesh(parentSphereGeometry, parentMaterial);
    parentSphere.position.set(0, 0, 0); // At center of the constellation group
    
    // Store parent node reference
    sphereMap.set(0, parentSphere);
    
    // Add parent node data references to userData for later access
    parentSphere.userData.isParentNode = true;
    parentSphere.userData.isDataNode = true;
    parentSphere.userData.nodeData = graphData.nodeRoot;
    
    // Add to group
    constellationGroup.add(parentSphere);
    
    // Update the parent node with its coordinates
    if (graphData.nodeRoot) {
      (graphData.nodeRoot as Neo4jNodeWithMappedPositions).coordinates = {
        x: 0, // Relative to constellation group
        y: 0,
        z: 0
      };
    }
  
    // Fill positions and create spheres for remaining points
    let affiliateDataPosition = 0;
    for (let i = 1; i < imagePoints.length; i++) { // Start from 1 since 0 is parent
      const isDataNode = selectedIndices.has(i);
      
      // Choose appropriate geometry and material
      const geometry = isDataNode ? dataSphereGeometry : regularSphereGeometry;
      const material = isDataNode ? dataMaterial : regularMaterial;
      
      // Create sphere
      const sphere = new THREE.Mesh(geometry, material);
      
      // Set position
      sphere.position.set(
        imagePoints[i].x,
        imagePoints[i].y,
        imagePoints[i].z
      );
      
      // Store sphere reference with its index
      sphereMap.set(i, sphere);
      
      // Add to group
      constellationGroup.add(sphere);
  
      // If this node is "special" update the affiliate data with its coordinates
      if (isDataNode && graphData.affiliates && affiliateDataPosition < graphData.affiliates.length) {
        (graphData.affiliates[affiliateDataPosition] as Neo4jNodeWithMappedPositions).coordinates = {
          x: imagePoints[i].x,
          y: imagePoints[i].y,
          z: imagePoints[i].z
        };
        
        // Store the node data index in userData for later reference
        sphere.userData.affiliateDataIndex = affiliateDataPosition;
        sphere.userData.isDataNode = true;
        sphere.userData.nodeData = graphData.affiliates[affiliateDataPosition];
        
        affiliateDataPosition++;
      }
    }
  
    // Store references in userData for later access
    constellationGroup.userData = {
      sphereMap,
      selectedIndices,
      graphData
    };
    
    threeContext.scene.add(constellationGroup);
  
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
  
    return constellationGroup;
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
      center.z + cameraZ * 2.0 // Add 10% padding
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
  ): CSS2DObject {
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
    mesh.userData.infoBox = infoBox;
    
    return infoBox;
  }

  addInfoBoxToRelationship(
    line: THREE.Line,
    relationship: Neo4jRelationship,
    threeContext: ThreeContext
  ) {
    // Create the HTML element for the info box
    const infoBoxElement = document.createElement("div");
    infoBoxElement.className = "relationship-info-box";
  
    // Format the relationship content
    let htmlContent = `
      <div class="relationship-info-header">${relationship.type}</div>
      <div class="relationship-info-content">
      `;
  
    // Add any custom properties from the relationship
    if (relationship.props && Object.keys(relationship.props).length > 0) {
      htmlContent += `<div class="relationship-info-properties">`;
      for (const [key, value] of Object.entries(relationship.props)) {
        htmlContent += `<div class="relationship-info-property"><span>${key}:</span> ${value}</div>`;
      }
      htmlContent += `</div>`;
    }
  
    htmlContent += `</div>`;
    infoBoxElement.innerHTML = htmlContent;
  
    // Create the CSS2D object
    const infoBox = new CSS2DObject(infoBoxElement);
    
    // Position the info box at the midpoint of the line
    const startPos = line.geometry.attributes.position.array;
    const midpoint = new THREE.Vector3(
      (startPos[0] + startPos[3]) / 2,
      (startPos[1] + startPos[4]) / 2,
      (startPos[2] + startPos[5]) / 2
    );
    
    infoBox.position.copy(midpoint);
    
    // Add the info box to the scene (not to the line itself, as lines don't have proper hierarchical transform)
    threeContext.scene.add(infoBox);
    
    // Store reference to the info box in the line's userData for later removal
    line.userData.infoBox = infoBox;
  }

  showRelationshipLines(
    activeMesh: THREE.Object3D,
    threeContext: ThreeContext,
    graphData: Neo4jApiResponse
  ) {
    this.clearRelationshipLines(threeContext);
    
    const activeNodeId = activeMesh.userData.nodeData.elementId;
    console.log(activeNodeId)

    
    // Create a line for each relationship
    const relevantRelationships = graphData.relationships.filter(rel => 
      rel.startElementId === activeNodeId || rel.endElementId === activeNodeId
    );
    console.log(relevantRelationships)
    
    relevantRelationships.forEach((relationship) => {
      console.log(relationship)
      // Determine the target node ID (the other end of the relationship)
      const targetNodeId = relationship.startElementId === activeNodeId 
        ? relationship.endElementId 
        : relationship.startElementId;

      console.log(targetNodeId)
      
      // Find the target mesh in the scene
      const targetMesh = this.findObjectByElementId(threeContext.scene, targetNodeId);
      
      // Create a line between the active mesh and target mesh
      const startPosition = activeMesh.position.clone();
      const endPosition = targetMesh.position.clone();
      
      // Create geometry for the line
      const geometry = new THREE.BufferGeometry().setFromPoints([
        startPosition,
        endPosition
      ]);
      
      // Determine line color based on relationship type
      let lineColor;
      switch(relationship.type) {
        default:
          lineColor = 0xff00ff; // Magenta
          break;
      }
      
      const material = new THREE.LineBasicMaterial({ 
        color: lineColor,
        linewidth: 2,
        opacity: 0.7,
        transparent: true
      });
      
      // Create the line and add it to the scene
      const line = new THREE.Line(geometry, material);
      line.userData = {
        relationship: relationship,
        sourceId: activeNodeId,
        targetId: targetNodeId
      };
      
      threeContext.scene.add(line);
      
      this.addInfoBoxToRelationship(
        line,
        relationship,
        threeContext
      );
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
  
  clearRelationshipLines(threeContext: ThreeContext) {
    const children = [...threeContext.scene.children];
    
    children.forEach((child) => {
      if (child instanceof THREE.Line || child instanceof THREE.Sprite) {
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

  removeInfoBoxFromMesh(mesh: THREE.Mesh): void {
    if (mesh.userData.infoBox) {
      mesh.remove(mesh.userData.infoBox);
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
