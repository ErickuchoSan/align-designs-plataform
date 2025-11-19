# Button Loading State Standards

This document outlines the standardized approach for handling button loading states in the Align Designs frontend application.

## Core Components

### 1. LoadingButton Component

The `LoadingButton` component provides a consistent way to display buttons with loading states.

**Location:** `app/components/LoadingButton.tsx`

**Features:**
- Prevents layout shift during loading with `min-w-` classes
- Consistent disabled styling across all variants
- Accessibility attributes (`aria-busy`, `aria-live`)
- Optional loading text
- Multiple variants and sizes

**Usage:**

```tsx
import LoadingButton from '@/app/components/LoadingButton';

<LoadingButton
  isLoading={isSubmitting}
  variant="primary"
  size="md"
  onClick={handleSubmit}
>
  Submit
</LoadingButton>
```

**Variants:**
- `primary` - Navy blue (default action buttons)
- `secondary` - Light gray (cancel buttons)
- `danger` - Red (delete/destructive actions)
- `warning` - Yellow (warning/edit actions)
- `ghost` - Transparent (tertiary actions)

**Sizes:**
- `sm` - Small buttons (80px min-width)
- `md` - Medium buttons (100px min-width) - Default
- `lg` - Large buttons (120px min-width)

### 2. useLoadingButton Hook

The `useLoadingButton` hook manages loading state for single-action buttons.

**Location:** `hooks/useLoadingButton.ts`

**Usage:**

```tsx
import { useLoadingButton } from '@/hooks/useLoadingButton';

function MyComponent() {
  const { isLoading, executeAsync } = useLoadingButton();

  const handleSubmit = executeAsync(async () => {
    await api.post('/endpoint', data);
    // Success handling
  });

  return (
    <LoadingButton isLoading={isLoading} onClick={handleSubmit}>
      Submit
    </LoadingButton>
  );
}
```

### 3. useMultipleLoadingStates Hook

The `useMultipleLoadingStates` hook manages loading states for multiple independent actions.

**Location:** `hooks/useLoadingButton.ts`

**Usage:**

```tsx
import { useMultipleLoadingStates } from '@/hooks/useLoadingButton';

function ProjectForm() {
  const { loadingStates, executeAsync, isLoading } = useMultipleLoadingStates<
    'create' | 'edit' | 'delete'
  >();

  const handleCreate = executeAsync('create', async () => {
    await api.post('/projects', data);
  });

  const handleEdit = executeAsync('edit', async () => {
    await api.patch('/projects/123', data);
  });

  return (
    <>
      <LoadingButton isLoading={isLoading('create')} onClick={handleCreate}>
        Create
      </LoadingButton>
      <LoadingButton isLoading={isLoading('edit')} onClick={handleEdit}>
        Save
      </LoadingButton>
    </>
  );
}
```

## Migration Guide

### From Manual State Management

**Before:**
```tsx
const [loading, setLoading] = useState(false);

const handleSubmit = async () => {
  setLoading(true);
  try {
    await api.post('/endpoint', data);
  } catch (error) {
    // Handle error
  } finally {
    setLoading(false);
  }
};

return (
  <button
    disabled={loading}
    onClick={handleSubmit}
    className="px-4 py-2 bg-blue-600 text-white disabled:opacity-50"
  >
    {loading ? <ButtonLoader /> : 'Submit'}
  </button>
);
```

**After:**
```tsx
import { useLoadingButton } from '@/hooks/useLoadingButton';
import LoadingButton from '@/app/components/LoadingButton';

const { isLoading, executeAsync } = useLoadingButton();

const handleSubmit = executeAsync(async () => {
  await api.post('/endpoint', data);
});

return (
  <LoadingButton isLoading={isLoading} onClick={handleSubmit} variant="primary">
    Submit
  </LoadingButton>
);
```

### From Multiple Boolean States

**Before:**
```tsx
const [creating, setCreating] = useState(false);
const [editing, setEditing] = useState(false);
const [deleting, setDeleting] = useState(false);

// Multiple similar async handlers...
```

**After:**
```tsx
import { useMultipleLoadingStates } from '@/hooks/useLoadingButton';

const { isLoading, executeAsync } = useMultipleLoadingStates<
  'create' | 'edit' | 'delete'
>();

const handleCreate = executeAsync('create', async () => {
  await api.post('/projects', data);
});

const handleEdit = executeAsync('edit', async () => {
  await api.patch(`/projects/${id}`, data);
});

return (
  <>
    <LoadingButton isLoading={isLoading('create')} onClick={handleCreate}>
      Create
    </LoadingButton>
    <LoadingButton isLoading={isLoading('edit')} onClick={handleEdit}>
      Save
    </LoadingButton>
  </>
);
```

## Best Practices

### 1. Naming Convention

- Use `isLoading` prop name consistently
- For multiple states, use descriptive keys: `'create'`, `'edit'`, `'delete'`, etc.

### 2. Button Width

- Always set a `min-w-` class to prevent layout shift
- Use the size prop to automatically apply appropriate min-width:
  - `sm`: 80px
  - `md`: 100px (default)
  - `lg`: 120px

### 3. Accessibility

- The `LoadingButton` component automatically adds `aria-busy` and `aria-live` attributes
- Always provide meaningful button text
- Consider adding `loadingText` for longer operations

### 4. Error Handling

- The `executeAsync` function re-throws errors after setting loading to false
- Always wrap in try-catch if you need custom error handling
- Use toast notifications or error states to show errors to users

### 5. Form Submissions

```tsx
const { isLoading, executeAsync } = useLoadingButton();
const [error, setError] = useState('');

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  try {
    await executeAsync(async () => {
      await api.post('/endpoint', formData);
    })();
  } catch (err) {
    setError(getErrorMessage(err));
  }
};

return (
  <form onSubmit={handleSubmit}>
    {error && <ErrorMessage>{error}</ErrorMessage>}
    {/* form fields */}
    <LoadingButton type="submit" isLoading={isLoading}>
      Submit
    </LoadingButton>
  </form>
);
```

## Common Patterns

### Submit Button in Modal

```tsx
<Modal isOpen={showModal} onClose={closeModal} title="Create Item">
  <form onSubmit={handleSubmit}>
    {/* form fields */}
    <div className="flex gap-3 justify-end pt-4 border-t">
      <LoadingButton
        type="button"
        variant="secondary"
        onClick={closeModal}
        disabled={isLoading}
      >
        Cancel
      </LoadingButton>
      <LoadingButton type="submit" variant="primary" isLoading={isLoading}>
        Create
      </LoadingButton>
    </div>
  </form>
</Modal>
```

### Confirmation Dialog

```tsx
<ConfirmModal
  isOpen={showConfirm}
  onClose={closeConfirm}
  onConfirm={handleConfirm}
  isLoading={isLoading('delete')}
  title="Delete Item"
  message="Are you sure?"
  variant="danger"
/>
```

### Inline Action Buttons

```tsx
<div className="flex gap-2">
  <LoadingButton
    size="sm"
    variant="ghost"
    isLoading={isLoading('approve')}
    onClick={handleApprove}
  >
    Approve
  </LoadingButton>
  <LoadingButton
    size="sm"
    variant="danger"
    isLoading={isLoading('reject')}
    onClick={handleReject}
  >
    Reject
  </LoadingButton>
</div>
```

## Testing

When testing components with loading buttons:

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

test('shows loading state during submission', async () => {
  render(<MyForm />);

  const submitButton = screen.getByRole('button', { name: /submit/i });

  fireEvent.click(submitButton);

  // Button should show loading state
  expect(submitButton).toHaveAttribute('aria-busy', 'true');
  expect(submitButton).toBeDisabled();

  await waitFor(() => {
    expect(submitButton).not.toHaveAttribute('aria-busy');
    expect(submitButton).not.toBeDisabled();
  });
});
```

## Troubleshooting

### Button width jumps when loading

**Solution:** Ensure you're using the `size` prop or adding a `min-w-` class.

### Loading state doesn't reset after error

**Solution:** The `executeAsync` function automatically resets loading state. Make sure you're not preventing error propagation.

### Multiple buttons show loading at once

**Solution:** Use `useMultipleLoadingStates` instead of `useLoadingButton` to manage independent loading states.

### Loading state persists after unmount

**Solution:** This is expected React behavior. The loading state will reset when the component remounts. If you need to preserve state across mounts, consider using global state management.
