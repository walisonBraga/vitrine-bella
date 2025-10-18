import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
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
import { MatChipsModule } from '@angular/material/chips';

// Importações Ngx-Mask
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';

// Importações Apexcharts
import { NgApexchartsModule } from 'ng-apexcharts';

// Serviços
import { ProductService } from './products/service/product.service';
import { CategoryService } from './categories/service/category.service';
import { SlideService } from './slides/service/slide.service';

// Componentes
import { ProductRegistrationModalComponent } from './products/ProductRegistrationModal/components/product-registration-modal/product-registration-modal.component';
import { PermissionsManagementComponent } from './permissions/components/permissions-management/permissions-management.component';
import { NavigationAdminComponent } from './sidenav/navigation-admin/components/navigation-admin/navigation-admin.component';
import { CreateLojaUserModalComponent } from './users/components/create-loja-user-modal/create-loja-user-modal.component';
import { LojaUsersManagementComponent } from './users/components/loja-users-management/loja-users-management.component';
import { CategoryTableComponent } from './categories/category-table/components/category-table/category-table.component';
import { CategoryModalComponent } from './categories/CategoryModal/components/category-modal/category-modal.component';
import { DiscountModalComponent } from './products/DiscountModal/components/discount-modal/discount-modal.component';
import { EditUserModalComponent } from './users/EditUserModal/components/edit-user-modal/edit-user-modal.component';
import { ProductTableComponent } from './products/product-table/components/product-table/product-table.component';
import { CouponModalComponent } from './products/CouponModal/components/coupon-modal/coupon-modal.component';
import { CouponTableComponent } from './coupons/coupon-table/components/coupon-table/coupon-table.component';
import { SlideModalComponent } from './slides/SlideModal/components/slide-modal/slide-modal.component';
import { SlideTableComponent } from './slides/SlideTable/components/slide-table/slide-table.component';
import { CustomSidenavComponent } from './sidenav/components/custom-sidenav/custom-sidenav.component';
import { IconSelectorComponent } from './categories/components/icon-selector/icon-selector.component';
import { LojaUserTableComponent } from './users/components/loja-user-table/loja-user-table.component';
import { InternalSalesComponent } from './sales/components/internal-sales/internal-sales.component';
import { DashboardComponent } from './dashboard/components/dashboard/dashboard.component';
import { ProfileComponent } from './users/profile/components/profile/profile.component';
import { ConfirmDialogComponent } from './event/confirm-dialog/confirm-dialog.component';
import { Admin_vitrinebellaRouting } from './admin-vitrinebella.routing';
import { AvatarComponent } from '../../shared/avatar/avatar.component';

@NgModule({
  declarations: [
    ProductRegistrationModalComponent,
    PermissionsManagementComponent,
    LojaUsersManagementComponent,
    CreateLojaUserModalComponent,
    NavigationAdminComponent,
    CustomSidenavComponent,
    EditUserModalComponent,
    ConfirmDialogComponent,
    InternalSalesComponent,
    DiscountModalComponent,
    LojaUserTableComponent,
    CategoryTableComponent,
    CategoryModalComponent,
    IconSelectorComponent,
    ProductTableComponent,
    CouponModalComponent,
    CouponTableComponent,
    SlideModalComponent,
    SlideTableComponent,
    DashboardComponent,
    ProfileComponent,
    AvatarComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
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
    MatChipsModule,

    //Material Mask
    NgxMaskDirective,
    NgxMaskPipe,

    //Module Apexcharts
    NgApexchartsModule,

    // Routing
    RouterModule.forChild(Admin_vitrinebellaRouting)
  ],
  exports: [
    AvatarComponent
  ],
  providers: [
    provideNgxMask(),
    ProductService,
    CategoryService,
    SlideService,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
})
export class AdminVitrinebellaModule { }
