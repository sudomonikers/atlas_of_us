import { Routes } from '@angular/router';
import { KnowledgeGraphComponent } from './knowledge-graph/knowledge-graph.component';
import { ProfileComponent } from './profile/profile.component';
import { UserComponent } from './user/user.component';
export const routes: Routes = [
    {
        path: '',
        component: KnowledgeGraphComponent
    },
    {
        path: 'knowledge-graph',
        component: KnowledgeGraphComponent
    },
    {
        path: 'profile',
        component: ProfileComponent
    },
    {
        path: 'user',
        component: UserComponent
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    },
];
