export interface createUsersAdmin {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  managementType?: string[];
  userPermission?: string[];
  accessCode: string;
  isActive: boolean;
  role: string;
}
