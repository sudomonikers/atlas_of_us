import { Component, OnInit } from '@angular/core';
import { SharedComponentsModule } from '../shared-components/shared-components.module';
import { Scene, PerspectiveCamera, WebGLRenderer, CubeTextureLoader } from 'three';
import {BoxGeometry, MeshBasicMaterial, Mesh, LineBasicMaterial, Vector3, BufferGeometry, Line} from 'three';
import { OrbitControls } from 'three-stdlib';



interface AnimatedMesh extends Mesh {
  objectAnimation?: () => void;
}




@Component({
  selector: 'app-knowledge-graph',
  standalone: true,
  imports: [SharedComponentsModule],
  templateUrl: './knowledge-graph.component.html',
  styleUrls: ['./knowledge-graph.component.scss'],
})
export class KnowledgeGraphComponent implements OnInit {
  scene: Scene;
  camera: PerspectiveCamera;
  renderer: WebGLRenderer;
  controls: OrbitControls;
  nodes: AnimatedMesh[] = [];

  constructor() {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new WebGLRenderer({ antialias: true});
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.animate = this.animate.bind(this);

  }

  ngOnInit(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);
    this.controls.update();


    // Load the skybox images
    const loader = new CubeTextureLoader();
    const texture = loader.load([
      'px.png', // right
      'nx.png', // left
      'py.png', // top
      'ny.png', // bottom
      'pz.png', // front
      'nz.png', // back
    ]);
    this.scene.background = texture;

    this.camera.position.z = 1;

    this.createNode(0, 0, 0); // Example: create a node at the origin
    this.createNode(2, 2, 2); // Example: create a node at position (2, 2, 2)
    this.createRelationship(this.nodes[0], this.nodes[1]); // Create a relationship between the two nodes

    this.animate();
    this.renderer.setAnimationLoop(this.animate);
  }

  animate() {
    this.controls.update();
    this.nodes.forEach((obj) => {
      if (obj.objectAnimation) obj.objectAnimation();
    })
    this.renderer.render(this.scene, this.camera)
  }

  createNode(x: number, y: number, z: number) {
    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube: AnimatedMesh = new Mesh(geometry, material);
    cube.position.set(x, y, z);
    cube.objectAnimation = function() {
      this.rotation.x += 0.01;
      this.rotation.y += 0.01;
    }
    this.nodes.push(cube);
    this.scene.add(cube);
  }

  createRelationship(from: AnimatedMesh, to: AnimatedMesh) {
    const material = new LineBasicMaterial({ color: 0x0000ff });
    const points = [];
    points.push(new Vector3(from.position.x, from.position.y, from.position.z));
    points.push(new Vector3(to.position.x, to.position.y, to.position.z));
    const geometry = new BufferGeometry().setFromPoints(points);
    const line = new Line(geometry, material);
    this.scene.add(line);
  }
}

