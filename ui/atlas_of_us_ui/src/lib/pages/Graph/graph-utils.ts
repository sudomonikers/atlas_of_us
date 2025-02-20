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
    imageUrl: string,
    numPoints: number,
    threshold: number
  ): Promise<{
    image: HTMLImageElement,
    points: { x: number; y: number; z: number }[]
  }> {
    return new Promise((resolve) => {
      const loadedImage = new Image();
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

        resolve({
            image: loadedImage,
            points
        });
      };
    });
  }

  async loadL1Nodes(): Promise<GraphData> {
    const personalityNodes = await this.httpService.getPersonalityNodes();
    const healthNodes = await this.httpService.getHealthNodes();
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

  //threejs scene specific things
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
}
