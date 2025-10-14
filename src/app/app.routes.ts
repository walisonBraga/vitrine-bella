import { Routes } from '@angular/router';
import { HomeComponent } from './core/home/components/home/home.component';
import { SignInComponent } from './core/sign-in/components/sign-in/sign-in.component';
import { ChooseRoleComponent } from './core/choose-role/components/choose-role/choose-role.component'; // <- ajuste o caminho correto
import { SignUpComponent } from './core/sign-up/components/sign-up/sign-up.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'sign-in',
    component: SignInComponent
  },
  {
    path: 'sign-up',
    component: SignUpComponent
  },
  {
    path: 'choose-role',
    component: ChooseRoleComponent
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./module/admin-vitrineBella/admin-vitrinebella.module')
        .then(m => m.AdminVitrinebellaModule)
  },
  {
    path: '**',
    redirectTo: 'sign-in'
  }
];
