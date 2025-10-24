import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

// Angular Material Modules
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
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
import { MatNativeDateModule } from '@angular/material/core';
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
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

// Importações Ngx-Mask
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';

// Importações Apexcharts
import { NgApexchartsModule } from 'ng-apexcharts';

// Serviços
import { UserContextService } from './logs/service/user-context.service';
import { CategoryService } from './categories/service/category.service';
import { ProductService } from './products/service/product.service';
import { SlideService } from './slides/service/slide.service';
import { GoalService } from './goals/service/goal.service';
import { LogService } from './logs/service/log.service';
import { CreateUserService } from './users/service/create-user.service';

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
import { ClientsManagementComponent } from './users/components/clients-management/clients-management.component';
import { CouponModalComponent } from './products/CouponModal/components/coupon-modal/coupon-modal.component';
import { CouponTableComponent } from './coupons/coupon-table/components/coupon-table/coupon-table.component';
import { SlideModalComponent } from './slides/SlideModal/components/slide-modal/slide-modal.component';
import { SlideTableComponent } from './slides/SlideTable/components/slide-table/slide-table.component';
import { CustomSidenavComponent } from './sidenav/components/custom-sidenav/custom-sidenav.component';
import { IconSelectorComponent } from './categories/components/icon-selector/icon-selector.component';
import { LojaUserTableComponent } from './users/components/loja-user-table/loja-user-table.component';
import { InternalSalesComponent } from './sales/components/internal-sales/internal-sales.component';
import { LogTableComponent } from './logs/log-table/components/log-table/log-table.component';
import { LogStatsComponent } from './logs/log-stats/components/log-stats/log-stats.component';

// Goals Components
import { GoalsManagementComponent } from './goals/components/goals-management/goals-management.component';
import { EmployeeGoalsComponent } from './goals/components/employee-goals/employee-goals.component';
import { MonthClosingModalComponent } from './goals/month-closing-modal/month-closing-modal.component';
import { ReopenMonthModalComponent } from './goals/reopen-month-modal/reopen-month-modal.component';
import { UpdateSalesModalComponent } from './goals/update-sales-modal/update-sales-modal.component';
import { CreateGoalModalComponent } from './goals/create-goal-modal/create-goal-modal.component';
import { DashboardComponent } from './dashboard/components/dashboard/dashboard.component';
import { ProfileComponent } from './users/profile/components/profile/profile.component';
import { ConfirmDialogComponent } from './event/confirm-dialog/confirm-dialog.component';
import { Admin_vitrinebellaRouting } from './admin-vitrinebella.routing';
import { AvatarComponent } from '../../shared/avatar/avatar.component';
import { PreRegistrationModalComponent } from './sales/components/pre-registration-modal/pre-registration-modal.component';
import { CheckoutComponent } from './sales/components/checkout/checkout.component';
import { PreRegistrationService } from './shared/services/pre-registration.service';

@NgModule({
  declarations: [
    ProductRegistrationModalComponent,
    PermissionsManagementComponent,
    LojaUsersManagementComponent,
    CreateLojaUserModalComponent,
    MonthClosingModalComponent,
    ClientsManagementComponent,
    UpdateSalesModalComponent,
    ReopenMonthModalComponent,
    NavigationAdminComponent,
    GoalsManagementComponent,
    CreateGoalModalComponent,
    EmployeeGoalsComponent,
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
    LogTableComponent,
    LogStatsComponent,
    ProfileComponent,
    AvatarComponent,
    PreRegistrationModalComponent,
    CheckoutComponent,

  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatProgressBarModule,
    ReactiveFormsModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatPaginatorModule,
    MatExpansionModule,
    MatCheckboxModule,
    MatSnackBarModule,
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
    MatCardModule,
    MatChipsModule,
    MatRadioModule,
    MatButtonToggleModule,

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
    UserContextService,
    CreateUserService,
    CategoryService,
    ProductService,
    SlideService,
    GoalService,
    LogService,
    PreRegistrationService,
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ],
})
export class AdminVitrinebellaModule { }
