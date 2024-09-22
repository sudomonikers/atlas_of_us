import { Component } from '@angular/core';
import { SharedComponentsModule } from "../shared-components/shared-components.module";
import { UserService } from '../user/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [SharedComponentsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  loggedIn: boolean = false;
  constructor(private userService: UserService) {
    this.loggedIn = this.userService.user.loggedIn;
  }
}
