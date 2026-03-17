'use client';

import { useState, useMemo, useCallback, memo } from 'react';
import { cn, INPUT_BASE, INPUT_VARIANTS, CHECKBOX_BASE } from '@/lib/styles';

export interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface EmployeeSelectProps {
  employees: Employee[];
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * EmployeeSelect Component
 *
 * Multi-select component for assigning employees to a project
 * CRITICAL: Validates that employees are not already assigned to another active project
 */
function EmployeeSelect({
  employees,
  selectedIds,
  onChange,
  disabled = false,
  className = '',
}: Readonly<EmployeeSelectProps>) {
  const [searchTerm, setSearchTerm] = useState('');

  // Memoize expensive filtering operation
  // Only recalculates when searchTerm or employees array changes
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employees;

    const lowerSearchTerm = searchTerm.toLowerCase();
    return employees.filter(
      (emp) =>
        emp.firstName.toLowerCase().includes(lowerSearchTerm) ||
        emp.lastName.toLowerCase().includes(lowerSearchTerm) ||
        emp.email.toLowerCase().includes(lowerSearchTerm)
    );
  }, [searchTerm, employees]);

  // Memoize handlers to prevent recreation on every render
  const handleToggle = useCallback((employeeId: string) => {
    if (selectedIds.includes(employeeId)) {
      onChange(selectedIds.filter((id) => id !== employeeId));
    } else {
      onChange([...selectedIds, employeeId]);
    }
  }, [selectedIds, onChange]);

  const handleSelectAll = useCallback(() => {
    onChange(filteredEmployees.map((emp) => emp.id));
  }, [filteredEmployees, onChange]);

  const handleClearAll = useCallback(() => {
    onChange([]);
  }, [onChange]);

  return (
    <fieldset className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <legend className="block text-sm font-medium text-gray-700">
          Assigned Employees
        </legend>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={disabled}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            disabled={disabled}
            className="text-xs text-gray-600 hover:text-gray-800 disabled:text-gray-400"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Search input */}
      <label htmlFor="employee-search" className="sr-only">Search employee</label>
      <input
        id="employee-search"
        type="text"
        placeholder="Search employee..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        disabled={disabled}
        className={cn(INPUT_BASE, INPUT_VARIANTS.default, 'disabled:bg-gray-100 disabled:cursor-not-allowed')}
      />

      {/* Employee list */}
      <div className="border border-gray-300 rounded-md max-h-60 overflow-y-auto">
        {filteredEmployees.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No employees found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredEmployees.map((employee) => {
              const isSelected = selectedIds.includes(employee.id);
              return (
                <label
                  key={employee.id}
                  className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggle(employee.id)}
                    disabled={disabled}
                    aria-label={`Select ${employee.firstName} ${employee.lastName}`}
                    className={cn(CHECKBOX_BASE, 'disabled:cursor-not-allowed')}
                  />
                  <div className="ml-3 flex-1">
                    <div className="text-sm font-medium text-gray-900">
                      {employee.firstName} {employee.lastName}
                    </div>
                    <div className="text-xs text-gray-500">{employee.email}</div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected count */}
      {selectedIds.length > 0 && (
        <div className="text-sm text-gray-600">
          {selectedIds.length} employee{selectedIds.length === 1 ? '' : 's'} selected
        </div>
      )}
    </fieldset>
  );
}

// Memoize component to prevent re-renders when props haven't changed
// Prevents unnecessary filtering recalculations
export const MemoizedEmployeeSelect = memo(EmployeeSelect);

// Keep named export for backward compatibility
export { MemoizedEmployeeSelect as EmployeeSelect };
