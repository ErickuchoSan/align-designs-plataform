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
            <svg className="w-5 h-5 text-forest-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm font-medium text-forest-800">{success}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 animate-slideDown">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        </div>
      )}
    </>
  );
}
