'use client';

import { Role } from '@/types';
import UsersPageLayout from './components/UsersPageLayout';

export default function ClientsManagementPage() {
  return (
    <UsersPageLayout
      role={Role.CLIENT}
      title="Clients"
      activeTab="clients"
      buttonLabel="New Client"
      loaderText="Loading clients..."
      countSuffix="client"
    />
  );
}