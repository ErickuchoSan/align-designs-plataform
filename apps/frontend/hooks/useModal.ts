import { useState, useCallback } from 'react';

/**
 * Generic hook for managing a single modal's state
 * Reduces boilerplate for open/close modal logic
 *
 * @param initialState - Initial visibility state (default: false)
 * @returns Object with isOpen state and open/close/toggle handlers
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const uploadModal = useModal();
 *   const deleteModal = useModal();
 *
 *   return (
 *     <>
 *       <button onClick={uploadModal.open}>Upload</button>
 *       <button onClick={deleteModal.open}>Delete</button>
 *       {uploadModal.isOpen && <UploadModal onClose={uploadModal.close} />}
 *       {deleteModal.isOpen && <DeleteModal onClose={deleteModal.close} />}
 *     </>
 *   );
 * }
 * ```
 */
export function useModal(initialState = false) {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}

/**
 * Generic hook for managing a modal with associated data
 * Useful for edit/delete modals that need to track which item is selected
 *
 * @returns Object with data state, isOpen flag, and open/close handlers
 *
 * @example
 * ```tsx
 * function UserList() {
 *   const deleteModal = useModalWithData<User>();
 *
 *   return (
 *     <>
 *       {users.map(user => (
 *         <button onClick={() => deleteModal.open(user)}>Delete {user.name}</button>
 *       ))}
 *       {deleteModal.data && (
 *         <DeleteModal
 *           user={deleteModal.data}
 *           onClose={deleteModal.close}
 *         />
 *       )}
 *     </>
 *   );
 * }
 * ```
 */
export function useModalWithData<T = any>() {
  const [data, setData] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback((item: T) => {
    setData(item);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
  }, []);

  return {
    data,
    isOpen,
    open,
    close,
  };
}
