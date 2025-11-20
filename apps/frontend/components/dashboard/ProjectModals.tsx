import { Project } from '@/types';
import Modal from '@/app/components/Modal';
import ConfirmModal from '@/app/components/ConfirmModal';
import { ButtonLoader } from '@/app/components/Loader';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ProjectFormData {
  name: string;
  description: string;
  clientId: string;
}

interface ProjectModalsProps {
  // Create modal
  showCreateModal: boolean;
  closeCreateModal: () => void;
  createFormData: ProjectFormData;
  setCreateFormData: (data: ProjectFormData) => void;
  handleCreateProject: (e: React.FormEvent) => void;
  creating: boolean;
  clients: Client[];
  // Edit modal
  showEditConfirm: boolean;
  setShowEditConfirm: (show: boolean) => void;
  showEditModal: boolean;
  closeEditModal: () => void;
  editingProject: Project | null;
  setEditingProject: (project: Project | null) => void;
  editFormData: ProjectFormData;
  setEditFormData: (data: ProjectFormData) => void;
  handleEditProject: (e: React.FormEvent) => void;
  editing: boolean;
  confirmEdit: () => void;
  canChangeClient: boolean;
  // Delete modal
  showDeleteConfirm: boolean;
  setShowDeleteConfirm: (show: boolean) => void;
  projectToDelete: Project | null;
  setProjectToDelete: (project: Project | null) => void;
  handleDeleteProject: () => void;
  deleting: boolean;
  // Theme
  theme?: 'navy' | 'blue';
}

export default function ProjectModals({
  showCreateModal,
  closeCreateModal,
  createFormData,
  setCreateFormData,
  handleCreateProject,
  creating,
  clients,
  showEditConfirm,
  setShowEditConfirm,
  showEditModal,
  closeEditModal,
  editingProject,
  setEditingProject,
  editFormData,
  setEditFormData,
  handleEditProject,
  editing,
  confirmEdit,
  canChangeClient,
  showDeleteConfirm,
  setShowDeleteConfirm,
  projectToDelete,
  setProjectToDelete,
  handleDeleteProject,
  deleting,
  theme = 'navy',
}: ProjectModalsProps) {
  const themeStyles = {
    navy: {
      input: 'text-navy-900 placeholder:text-stone-700',
      label: 'text-navy-900',
      cancelButton: 'text-navy-900 bg-stone-200 hover:bg-stone-300',
      createButton: 'bg-navy-800 hover:bg-navy-700',
      editButton: 'bg-gold-600 hover:bg-gold-500',
    },
    blue: {
      input: 'text-gray-900 placeholder:text-gray-700',
      label: 'text-gray-700',
      cancelButton: 'text-gray-800 bg-gray-200 hover:bg-gray-300',
      createButton: 'bg-gradient-to-r from-blue-600 to-indigo-600',
      editButton: 'bg-gradient-to-r from-yellow-600 to-orange-600',
    },
  };

  const styles = themeStyles[theme];

  return (
    <>
      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={closeCreateModal}
        title={theme === 'navy' ? 'Crear Nuevo Proyecto' : 'Create New Project'}
      >
        <form onSubmit={handleCreateProject} className="space-y-5">
          <div>
            <label htmlFor="create-name" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Project Name *
            </label>
            <input
              id="create-name"
              type="text"
              required
              value={createFormData.name}
              onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input}`}
              placeholder="e.g., Logo Design"
            />
          </div>

          <div>
            <label htmlFor="create-description" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Description
            </label>
            <textarea
              id="create-description"
              rows={4}
              value={createFormData.description}
              onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all resize-none ${styles.input}`}
              placeholder={theme === 'navy' ? 'Describe el proyecto...' : 'Describe the project...'}
            />
          </div>

          <div>
            <label htmlFor="create-client" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Client *
            </label>
            <select
              id="create-client"
              required
              value={createFormData.clientId}
              onChange={(e) => setCreateFormData({ ...createFormData, clientId: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input}`}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName} ({client.email})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={closeCreateModal}
              disabled={creating}
              className={`px-5 py-2.5 text-sm font-medium ${styles.cancelButton} rounded-lg transition-colors disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating}
              className={`px-5 py-2.5 text-sm font-medium text-white ${styles.createButton} rounded-lg hover:shadow-lg transition-all disabled:opacity-50 min-w-[120px] flex items-center justify-center`}
            >
              {creating ? <ButtonLoader /> : (theme === 'navy' ? 'Crear Proyecto' : 'Create Project')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Confirmation Modal */}
      <ConfirmModal
        isOpen={showEditConfirm}
        onClose={() => {
          setShowEditConfirm(false);
          setEditingProject(null);
        }}
        onConfirm={confirmEdit}
        title="Confirm Edit"
        message={`Are you sure you want to edit the project "${editingProject?.name}"?`}
        confirmText={theme === 'navy' ? 'Editar' : 'Edit'}
        variant="warning"
      />

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={closeEditModal}
        title={theme === 'navy' ? 'Editar Proyecto' : 'Edit Project'}
      >
        <form onSubmit={handleEditProject} className="space-y-5">
          <div>
            <label htmlFor="edit-name" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Project Name *
            </label>
            <input
              id="edit-name"
              type="text"
              required
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input}`}
              placeholder={theme === 'navy' ? 'Ej: Diseño de Logo' : 'e.g., Logo Design'}
            />
          </div>

          <div>
            <label htmlFor="edit-description" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Description
            </label>
            <textarea
              id="edit-description"
              rows={4}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all resize-none ${styles.input}`}
              placeholder={theme === 'navy' ? 'Describe el proyecto...' : 'Describe the project...'}
            />
          </div>

          <div>
            <label htmlFor="edit-client" className={`block text-sm font-medium ${styles.label} mb-2`}>
              Client *
            </label>
            <select
              id="edit-client"
              required
              value={editFormData.clientId}
              onChange={(e) => setEditFormData({ ...editFormData, clientId: e.target.value })}
              disabled={!canChangeClient}
              className={`w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:ring-2 focus:ring-${theme === 'navy' ? 'gold' : 'blue'}-500 focus:border-transparent transition-all ${styles.input} ${!canChangeClient ? 'opacity-50 cursor-not-allowed bg-stone-100' : ''}`}
              title={!canChangeClient ? 'Cannot change client: current client has uploaded files or comments to this project' : ''}
            >
              <option value="">Select a client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName} ({client.email})
                </option>
              ))}
            </select>
            {!canChangeClient && (
              <p className="mt-2 text-sm text-amber-600 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Client cannot be changed: current client has uploaded files or comments
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={closeEditModal}
              disabled={editing}
              className={`px-5 py-2.5 text-sm font-medium ${styles.cancelButton} rounded-lg transition-colors disabled:opacity-50`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editing}
              className={`px-5 py-2.5 text-sm font-medium text-white ${styles.editButton} rounded-lg hover:shadow-lg transition-all disabled:opacity-50 min-w-[120px] flex items-center justify-center`}
            >
              {editing ? <ButtonLoader /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete the project "${projectToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={deleting}
        variant="danger"
      />
    </>
  );
}
