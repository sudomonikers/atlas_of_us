import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavbarComponent } from './navbar/navbar.component';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@NgModule({
  declarations: [NavbarComponent],
  imports: [CommonModule, RouterLink, RouterOutlet, RouterLinkActive, MatIconModule, MatButtonModule, MatToolbarModule],
  exports: [NavbarComponent],
})
export class SharedComponentsModule {}
