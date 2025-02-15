<script lang="ts">
  import * as THREE from "three";
  import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
  import { API_BASE } from "../../../environment";
  import { onMount } from "svelte";

  async function getNodes() {
    const response = await fetch(`${API_BASE}/api/secure/personality/all-personality`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("jwt")}`
            }
        });

        if (response.ok) {
            // Handle successful signup
            console.log('Signup successful');
        } else {
            // Handle signup error
            console.error('Signup failed');
        }
  }
  const nodes = getNodes().then((res) => {
    console.log(res)
  });


  let container: HTMLDivElement;
  let scene: THREE.Scene;
  let camera: THREE.PerspectiveCamera;
  let renderer: THREE.WebGLRenderer;
  let controls: OrbitControls;
  let cube: THREE.Mesh;

  onMount(() => {
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

    container.appendChild(renderer.domElement);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    camera.position.z = 5;

    function animate() {
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      controls.update();
      renderer.render(scene, camera);
    }

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
      scene.remove(cube);
      cube.geometry.dispose();
      controls.dispose();
    };
  });
</script>
<div class="in-nav-container">
  <div bind:this={container} style="width:100%; height:100%;"></div>
</div>