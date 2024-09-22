import { Component } from '@angular/core';
import { SharedComponentsModule } from '../shared-components/shared-components.module';

@Component({
  selector: 'app-knowledge-graph',
  standalone: true,
  imports: [SharedComponentsModule],
  templateUrl: './knowledge-graph.component.html',
  styleUrl: './knowledge-graph.component.scss'
})
export class KnowledgeGraphComponent {

}
