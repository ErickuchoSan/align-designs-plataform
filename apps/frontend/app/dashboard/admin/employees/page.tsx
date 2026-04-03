'use client';

import { Role } from '@/types';
import UsersPageLayout from '../users/components/UsersPageLayout';

export default function EmployeesPage() {
  return (
    <UsersPageLayout
      role={Role.EMPLOYEE}
      title="Employees"
      activeTab="employees"
      buttonLabel="New Employee"
      loaderText="Loading employees..."
      countSuffix="employee"
    />
  );
}