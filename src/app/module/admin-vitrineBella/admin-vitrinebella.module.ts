import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';

// Angular Material Modules
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatStepperModule } from '@angular/material/stepper';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatBadgeModule } from '@angular/material/badge';
import { MatCommonModule } from '@angular/material/core';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSortModule } from '@angular/material/sort';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';

// Importações Ngx-Mask
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';

// Importações Apexcharts
import { NgApexchartsModule } from 'ng-apexcharts';

// Componentes
import { ProductRegistrationModalComponent } from './products/ProductRegistrationModal/components/product-registration-modal/product-registration-modal.component';
import { EmployeeCreateModalComponent } from './users/EmployeeCreateModal/components/employee-create-modal/employee-create-modal.component';
import { UserPermissionModalComponent } from './users/UserPermissionModal/components/user-permission-modal/user-permission-modal.component';
import { EditUserModalComponent } from './users/EditUserModal/components/edit-user-modal/edit-user-modal.component';
import { NavigationAdminComponent } from './sidenav/navigation-admin/components/navigation-admin/navigation-admin.component';
import { UserTableOwnerComponent } from './users/userTableOwner/components/user-table-owner/user-table-owner.component';
import { ProductTableComponent } from './products/product-table/components/product-table/product-table.component';
import { CustomSidenavComponent } from './sidenav/components/custom-sidenav/custom-sidenav.component';
import { DashboardComponent } from './dashboard/components/dashboard/dashboard.component';
import { ProfileComponent } from './users/profile/components/profile/profile.component';
import { PermissionsManagementComponent } from './permissions/components/permissions-management/permissions-management.component';
import { Admin_vitrinebellaRouting } from './admin-vitrinebella.routing';
import { ConfirmDialogComponent } from './event/confirm-dialog/confirm-dialog.component';
import { InternalSalesComponent } from './sales/components/internal-sales/internal-sales.component';




@NgModule({
  declarations: [
    ProductRegistrationModalComponent,
    UserPermissionModalComponent,
    EmployeeCreateModalComponent,
    EditUserModalComponent,
    NavigationAdminComponent,
    UserTableOwnerComponent,
    CustomSidenavComponent,
    ProductTableComponent,
    DashboardComponent,
    ProfileComponent,
    PermissionsManagementComponent,
    ConfirmDialogComponent,
    InternalSalesComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatStepperModule,
    MatToolbarModule,
    MatSidenavModule,
    MatToolbarModule,
    MatDividerModule,
    MatSelectModule,
    MatCommonModule,
    MatButtonModule,
    MatDialogModule,
    MatInputModule,
    MatBadgeModule,
    MatTableModule,
    MatMenuModule,
    MatListModule,
    MatSortModule,
    MatTabsModule,
    MatIconModule,
    MatSnackBarModule,
    MatCardModule,

    //Material Mask
    NgxMaskDirective,
    NgxMaskPipe,

    //Module Apexcharts
    NgApexchartsModule,

    // Routing
    RouterModule.forChild(Admin_vitrinebellaRouting)
  ],
  providers: [
    provideNgxMask(),
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
})
export class AdminVitrinebellaModule { }
