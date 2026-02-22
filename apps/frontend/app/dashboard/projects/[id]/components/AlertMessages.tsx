import { CheckIcon, CloseIcon } from '@/components/ui/icons';

interface AlertMessagesProps {
  success?: string;
  error?: string;
}

/**
 * Displays success and error alert messages
 * Extracted from ProjectDetailsPage for better reusability
 */
export default function AlertMessages({ success, error }: AlertMessagesProps) {
  if (!success && !error) return null;

  return (
    <>
      {success && (
        <div className="mb-6 rounded-lg bg-forest-50 border border-forest-200 p-4 animate-slideDown">
          <div className="flex items-center">
            <CheckIcon className="text-forest-600 mr-3" size="md" />
            <p className="text-sm font-medium text-forest-800">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 animate-slideDown">
          <div className="flex items-center">
            <CloseIcon className="text-red-600 mr-3" size="md" />
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}
    </>
  );
}
