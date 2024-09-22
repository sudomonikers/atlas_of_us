import { Injectable } from '@angular/core';

export interface User {
  loggedIn: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  user: User = { loggedIn: false };

  constructor() { }
}
