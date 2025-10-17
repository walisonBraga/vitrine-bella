import { Routes } from '@angular/router';
import { HomeComponent } from './core/home/components/home/home.component';
import { SignInComponent } from './core/sign-in/components/sign-in/sign-in.component';
import { ChooseRoleComponent } from './core/choose-role/components/choose-role/choose-role.component'; // <- ajuste o caminho correto
import { SignUpComponent } from './core/sign-up/components/sign-up/sign-up.component';
import { ProductDetailComponent } from './core/product-detail/product-detail.component';
import { FavoritesComponent } from './core/favorites/favorites.component';
import { CartComponent } from './cart/cart.component';
import { EnderecoComponent } from './checkout/endereco/endereco.component';

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
    path: 'produto/:id',
    component: ProductDetailComponent
  },
  {
    path: 'favoritos',
    component: FavoritesComponent
  },
  {
    path: 'carrinho',
    component: CartComponent
  },
  {
    path: 'checkout/endereco',
    component: EnderecoComponent
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
