import { Routes } from '@angular/router';
import { ThreeCubeComponent } from './three-cube/three-cube.component';
export const routes: Routes = [
    {
        path: '',
        component: ThreeCubeComponent
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    }
];
