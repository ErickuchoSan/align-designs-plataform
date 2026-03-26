import { Project, ProjectEmployee, User } from '@/types';

interface EmployeesSectionProps {
  project: Project;
  isAdmin: boolean;
  onManageEmployees?: () => void;
}

/**
 * Employees Section
 * Displays assigned employees and manage button for admins
 */
export function EmployeesSection({
  project,
  isAdmin,
  onManageEmployees,
}: Readonly<EmployeesSectionProps>) {
  const hasEmployees = project.employees && project.employees.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-stone-600">Assigned Employees</h3>
        {isAdmin && onManageEmployees && (
          <button
            onClick={onManageEmployees}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Manage
          </button>
        )}
      </div>

      {hasEmployees ? (
        <div className="flex flex-wrap gap-2">
          {project.employees?.map((pe: ProjectEmployee & { employee: User }) => (
            <div
              key={pe.id}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                {pe.employee.firstName[0]}{pe.employee.lastName[0]}
              </div>
              <span className="text-sm font-medium text-navy-900">
                {pe.employee.firstName} {pe.employee.lastName}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-500 italic">No employees assigned yet</p>
      )}
    </div>
  );
}
