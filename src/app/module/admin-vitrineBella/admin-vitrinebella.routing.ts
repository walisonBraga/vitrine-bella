import { PermissionsManagementComponent } from './permissions/components/permissions-management/permissions-management.component';
import { CategoryTableComponent } from './categories/category-table/components/category-table/category-table.component';
import { LojaUsersManagementComponent } from './users/components/loja-users-management/loja-users-management.component';
import { ProductTableComponent } from './products/product-table/components/product-table/product-table.component';
import { CouponTableComponent } from './coupons/coupon-table/components/coupon-table/coupon-table.component';
import { SlideTableComponent } from './slides/SlideTable/components/slide-table/slide-table.component';
import { InternalSalesComponent } from './sales/components/internal-sales/internal-sales.component';
import { DashboardComponent } from './dashboard/components/dashboard/dashboard.component';
import { ProfileComponent } from './users/profile/components/profile/profile.component';
import { LogTableComponent } from './logs/log-table/components/log-table/log-table.component';
import { LogStatsComponent } from './logs/log-stats/components/log-stats/log-stats.component';
import { GoalsManagementComponent } from './goals/components/goals-management/goals-management.component';
import { AdminGuard } from '../../core/guards/admin.guard';
import { Routes, RouterModule } from '@angular/router';
import { EmployeeGoalsComponent } from './goals/components/employee-goals/employee-goals.component';

export const Admin_vitrinebellaRouting: Routes = [
  { path: '', redirectTo: 'admin-dashboard', pathMatch: 'full' },
  { path: 'admin-dashboard', component: DashboardComponent, canActivate: [AdminGuard] },
  { path: 'adminProductTable', component: ProductTableComponent, canActivate: [AdminGuard] },
  { path: 'coupons', component: CouponTableComponent, canActivate: [AdminGuard] },
  { path: 'categories', component: CategoryTableComponent, canActivate: [AdminGuard] },
  { path: 'slides', component: SlideTableComponent, canActivate: [AdminGuard] },
  { path: 'loja-users-management', component: LojaUsersManagementComponent, canActivate: [AdminGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [AdminGuard] },
  { path: 'permissions-management', component: PermissionsManagementComponent, canActivate: [AdminGuard] },
  { path: 'internal-sales', component: InternalSalesComponent, canActivate: [AdminGuard] },
  { path: 'event-logs', component: LogTableComponent, canActivate: [AdminGuard] },
  { path: 'log-stats', component: LogStatsComponent, canActivate: [AdminGuard] },
  { path: 'goals-management', component: GoalsManagementComponent, canActivate: [AdminGuard] },
  { path: 'employee-goals', component: EmployeeGoalsComponent },
];

export const AdminVitrinebellaRoutes = RouterModule.forChild(Admin_vitrinebellaRouting);
