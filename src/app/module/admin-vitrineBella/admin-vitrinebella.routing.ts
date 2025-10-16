import { ProductTableComponent } from './products/product-table/components/product-table/product-table.component';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './dashboard/components/dashboard/dashboard.component';
import { UserTableOwnerComponent } from './users/userTableOwner/components/user-table-owner/user-table-owner.component';
import { EmployeeCreateModalComponent } from './users/EmployeeCreateModal/components/employee-create-modal/employee-create-modal.component';
import { ProfileComponent } from './users/profile/components/profile/profile.component';
import { PermissionsManagementComponent } from './permissions/components/permissions-management/permissions-management.component';
import { InternalSalesComponent } from './sales/components/internal-sales/internal-sales.component';

export const Admin_vitrinebellaRouting: Routes = [
  { path: '', redirectTo: 'admin-dashboard', pathMatch: 'full' },
  { path: 'admin-dashboard', component: DashboardComponent },
  { path: 'adminProductTable', component: ProductTableComponent },
  { path: 'adminEmployeeCreateModal', component: EmployeeCreateModalComponent },
  { path: 'adminUserTableOwner', component: UserTableOwnerComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'permissions-management', component: PermissionsManagementComponent },
  { path: 'internal-sales', component: InternalSalesComponent },
];

export const AdminVitrinebellaRoutes = RouterModule.forChild(Admin_vitrinebellaRouting);
