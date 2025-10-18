import { Routes } from '@angular/router';
import { HomeComponent } from './core/home/components/home/home.component';
import { SignInComponent } from './core/sign-in/components/sign-in/sign-in.component';
import { SignUpComponent } from './core/sign-up/components/sign-up/sign-up.component';
import { ProductDetailComponent } from './core/product-detail/product-detail.component';
import { FavoritesComponent } from './core/favorites/favorites.component';
import { CartComponent } from './cart/cart.component';
import { EnderecoComponent } from './checkout/endereco/endereco.component';
import { AuthGuard } from './core/guards/auth.guard';
import { AdminGuard } from './core/guards/admin.guard';
import { ChooseAreaComponent } from './core/choose-area/components/choose-area/choose-area.component';

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
    path: 'loja',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'produto/:id',
    component: ProductDetailComponent
  },
  {
    path: 'favoritos',
    component: FavoritesComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'carrinho',
    component: CartComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'checkout/endereco',
    component: EnderecoComponent,
    canActivate: [AuthGuard]
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
    path: 'choose-area',
    component: ChooseAreaComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./module/admin-vitrineBella/admin-vitrinebella.module')
        .then(m => m.AdminVitrinebellaModule),
    canActivate: [AdminGuard]
  },
  {
    path: '**',
    redirectTo: 'sign-in'
  }
];
