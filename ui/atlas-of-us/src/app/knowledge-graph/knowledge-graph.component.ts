import { Component, OnInit } from '@angular/core';
import { HttpClient, provideHttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new WebGLRenderer({ antialias: true});
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.animate = this.animate.bind(this);
  }

  ngOnInit(): void {
    this.http.get("http://localhost:8001/api/v1/kg/match-all").subscribe((res: any) => {
      console.log(res)

      for (let i = 0; i < res.length; i++) {
        const node = res[i];
        const position = this.calculatePosition(node, i);
        console.log(position)
        this.createNode(position.x, position.y, position.z); // Create a node at the calculated position
      
        // Create a relationship with the previous node if it exists
        if (i > 0) {
          this.createRelationship(this.nodes[i - 1], this.nodes[i]);
        }
      }
    })


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

  // Assuming you have a method to calculate the position based on relationships
  calculatePosition(node: AnimatedMesh, index: number): { x: number, y: number, z: number } {
    // Placeholder for force-directed layout calculation
    // You can implement a more sophisticated algorithm here
    const angle = (index / this.nodes.length) * Math.PI * 2;
    const radius = 10; // Arbitrary radius for spacing
    return {
      x: radius * Math.cos(index),
      y: radius * Math.sin(index),
      z: (index % 2 === 0) ? index : -index // Alternate z positions for variety
    };
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

