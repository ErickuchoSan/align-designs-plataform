import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/ui/Modal';
import { EmployeeSelect } from '@/components/projects/EmployeeSelect';
import { ButtonLoader } from '@/components/ui/Loader';
import { ProjectsService } from '@/services/projects.service';
import { toast } from 'react-hot-toast';
import { User } from '@/types';
import { UsersService } from '@/services/users.service';
import { logger } from '@/lib/logger';
import { handleApiError } from '@/lib/errors';

interface ManageEmployeesModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    currentEmployees: ProjectEmployee[];
    onSuccess: () => void;
}

interface ProjectEmployee {
    projectId: string;
    employeeId: string;
    assignedAt: string;
    employee?: User;
}

export default function ManageEmployeesModal({ isOpen, onClose, projectId, currentEmployees, onSuccess }: ManageEmployeesModalProps) {
    const [availableEmployees, setAvailableEmployees] = useState<User[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Memoize loadEmployees to prevent recreation on every render
    const loadEmployees = useCallback(async () => {
        try {
            setIsLoading(true);
            const users = await UsersService.getEmployees();
            setAvailableEmployees(users);
        } catch (error) {
            logger.error('Failed to load employees for assignment', error);
            toast.error('Error loading available employees');
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initialize selected IDs from current employees when modal opens
    // Fix: Extract employee IDs only when isOpen changes to avoid dependency on currentEmployees array
    useEffect(() => {
        if (isOpen) {
            const currentIds = currentEmployees.map(e => e.employee?.id).filter(Boolean) as string[];
            setSelectedIds(currentIds);
            loadEmployees();
        }
    }, [isOpen, loadEmployees]); // Removed currentEmployees from deps to prevent unnecessary effects

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await ProjectsService.assignEmployees(projectId, selectedIds);
            toast.success('Employees updated successfully');
            onSuccess();
            onClose();
        } catch (error: any) {
            logger.error('Failed to save employee assignments', error, { projectId, selectedIds });
            toast.error(handleApiError(error, 'Error updating employees'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Manage Employees">
            <form onSubmit={handleSave} className="space-y-6">
                <div>
                    <p className="text-sm text-gray-500 mb-4">
                        Select the employees who will work on this project.
                        Remember that an employee can only be active on one project at a time.
                    </p>

                    {isLoading ? (
                        <div className="py-4 text-center text-gray-400">Loading employees...</div>
                    ) : (
                        <EmployeeSelect
                            employees={availableEmployees}
                            selectedIds={selectedIds}
                            onChange={setSelectedIds}
                        />
                    )}
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-200 gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSaving || isLoading}
                        className="flex justify-center px-4 py-2 text-sm font-medium text-white bg-navy-600 border border-transparent rounded-md hover:bg-navy-700 min-w-[100px]"
                    >
                        {isSaving ? <ButtonLoader /> : 'Save'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
