/**
 * TanStack Query Hooks
 *
 * Centralized exports for all query and mutation hooks.
 */

// Projects
export {
  useProjectsListQuery,
  useProjectQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useAssignEmployeesMutation,
  useUpdateProjectStatusMutation,
} from './useProjectsQuery';

// Users
export {
  useUsersListQuery,
  useUserQuery,
  useClientsQuery,
  useEmployeesQuery,
  useAvailableEmployeesQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useToggleUserStatusMutation,
  useDeleteUserMutation,
  useResendWelcomeEmailMutation,
} from './useUsersQuery';

// Notifications
export {
  useNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from './useNotificationsQuery';

// Payments
export {
  useProjectPaymentsQuery,
  useProjectInvoicesQuery,
  useApprovePaymentMutation,
  useRejectPaymentMutation,
  useRecordPaymentMutation,
  useEmployeePaymentsByProjectQuery,
  usePaymentPageDataQuery,
  usePaymentStageDataQuery,
  useApproveEmployeePaymentMutation,
  useRejectEmployeePaymentMutation,
} from './usePaymentsQuery';

// Invoices
export {
  useInvoicesListQuery,
  useInvoiceQuery,
  useUpdateInvoiceStatusMutation,
  useUnpaidInvoicesQuery,
  useHasUnpaidInvoicesQuery,
  useProjectForInvoiceQuery,
  useCreateInvoiceMutation,
  useUploadClientPaymentMutation,
} from './useInvoicesQuery';

// Employee Payments
export {
  usePendingItemsQuery,
  useCreateEmployeePaymentMutation,
} from './useEmployeePaymentsQuery';

// Files
export {
  useProjectFilesQuery,
  useProjectFileTypesQuery,
  usePendingPaymentFilesQuery,
  useUploadFileVersionMutation,
} from './useFilesQuery';

// Stages
export { useProjectStagesQuery } from './useStagesQuery';

// Tracking
export { useProjectTrackingStatsQuery } from './useTrackingQuery';

// Client Profile
export { useClientProfileDataQuery } from './useClientProfileQuery';

// Feedback
export {
  useProjectFeedbackCyclesQuery,
  useFeedbackCyclesRefresh,
} from './useFeedbackQuery';