import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-choose-role',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './choose-role.component.html',
  styleUrl: './choose-role.component.scss'
})
export class ChooseRoleComponent {
  constructor(private router: Router) { }

  goTo(path: string) {
    this.router.navigate([path]);
  }
}
