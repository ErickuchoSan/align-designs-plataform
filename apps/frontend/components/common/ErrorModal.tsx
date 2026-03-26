'use client';

import { useEffect, useMemo } from 'react';
import { AxiosRequestConfig } from 'axios';

// Helper function to get status-based colors
function getStatusColors(statusCode?: number | string): {
  headerBg: string;
  iconBg: string;
  iconColor: string;
} {
  const code = Number(statusCode);
  if (code === 401 || code === 403) {
    return { headerBg: 'bg-red-50 border-red-200', iconBg: 'bg-red-100', iconColor: 'text-red-600' };
  }
  if (code >= 500) {
    return { headerBg: 'bg-orange-50 border-orange-200', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' };
  }
  return { headerBg: 'bg-amber-50 border-amber-200', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' };
}

interface ErrorObject {
  name?: string;
  message?: string;
  code?: string;
  stack?: string;
  [key: string]: unknown;
}

interface ResponseData {
  message?: string;
  error?: string;
  statusCode?: number;
  [key: string]: unknown;
}

interface ErrorModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string[];
  endpoint?: string;
  method?: string;
  statusCode?: number | string;
  onClose: () => void;
  willRedirect?: boolean;
  // Typed fields for dev mode display
  errorObject?: ErrorObject;
  requestConfig?: Partial<AxiosRequestConfig>;
  responseData?: ResponseData;
  stackTrace?: string;
  errorCode?: string;
}

export default function ErrorModal({
  isOpen,
  title,
  message,
  details = [],
  endpoint,
  method,
  statusCode,
  onClose,
  willRedirect = false,
  errorObject: _errorObject,
  requestConfig,
  responseData,
  stackTrace,
  errorCode,
}: Readonly<ErrorModalProps>) {
  // Use safe version to avoid errors when modal is rendered outside AuthProvider
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Check devMode from localStorage
  const isDevMode = typeof globalThis !== 'undefined' && globalThis.localStorage?.getItem('devMode') === 'true';

  // Show technical details only in dev mode
  const showTechnicalDetails = isDevMode;

  // Get status-based colors
  const statusColors = useMemo(() => getStatusColors(statusCode), [statusCode]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
        onClick={onClose}
        aria-label="Close modal"
      />

      {/* Modal */}
      <div className={`relative bg-white rounded-xl shadow-2xl ${showTechnicalDetails ? 'max-w-4xl' : 'max-w-md'} w-full max-h-[90vh] overflow-hidden animate-slideUp`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${statusColors.headerBg}`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${statusColors.iconBg}`}>
              <svg
                className={`w-6 h-6 ${statusColors.iconColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-navy-900">
                {title}
              </h3>
              {statusCode && (
                <p className="text-sm text-stone-600 mt-0.5">
                  Status Code: {statusCode}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {/* Main error message */}
          <div className="mb-4">
            <p className="text-base text-navy-800 font-medium mb-2">
              {message}
            </p>
          </div>

          {/* Endpoint info - Only for admins/developers */}
          {showTechnicalDetails && (endpoint || method) && (
            <div className="mb-4 p-3 bg-stone-50 rounded-lg border border-stone-200">
              <p className="text-xs font-semibold text-stone-500 uppercase mb-1">
                Request Details {!isDevelopment && '(Admin Only)'}
              </p>
              {method && endpoint && (
                <p className="text-sm font-mono text-navy-900">
                  <span className="font-bold text-gold-600">{method}</span>{' '}
                  <span className="text-stone-700">{endpoint}</span>
                </p>
              )}
            </div>
          )}

          {/* Validation errors or details */}
          {details.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-navy-900 mb-2">
                Details:
              </p>
              <ul className="space-y-1">
                {details.map((detail) => (
                  <li
                    key={detail}
                    className="text-sm text-stone-700 flex items-start gap-2"
                  >
                    <span className="text-red-500 flex-shrink-0 mt-0.5">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Non-admin message in production */}
          {!showTechnicalDetails && !isDevelopment && (endpoint || method) && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                ℹ️ Contact support if you need technical assistance. Error details are available to administrators.
              </p>
            </div>
          )}

          {/* DEV MODE: Request Details */}
          {showTechnicalDetails && requestConfig && (
            <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-lg">
              <p className="text-xs font-bold text-stone-900 mb-2">📤 REQUEST DETAILS</p>
              <div className="space-y-1 text-xs font-mono text-stone-900">
                <div><span className="font-semibold text-navy-900">Base URL:</span> {requestConfig.baseURL || 'N/A'}</div>
                <div><span className="font-semibold text-navy-900">Path:</span> {endpoint}</div>
                <div><span className="font-semibold text-navy-900">Full URL:</span> {requestConfig.baseURL ? `${requestConfig.baseURL}${endpoint}` : endpoint}</div>
                <div><span className="font-semibold text-navy-900">Method:</span> {method}</div>

                {requestConfig.params && (
                  <div className="mt-2">
                    <span className="font-semibold text-navy-900">Query Params:</span>
                    <pre className="mt-1 bg-white p-2 rounded border border-stone-300 overflow-x-auto text-xs text-stone-900">
                      {JSON.stringify(requestConfig.params, null, 2)}
                    </pre>
                  </div>
                )}

                {requestConfig.data && (
                  <div className="mt-2">
                    <span className="font-semibold text-navy-900">Request Body:</span>
                    <pre className="mt-1 bg-white p-2 rounded border border-stone-300 overflow-x-auto text-xs max-h-48 text-stone-900">
                      {JSON.stringify(
                        typeof requestConfig.data === 'string' ? JSON.parse(requestConfig.data) : requestConfig.data,
                        null,
                        2
                      )}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DEV MODE: Response Details */}
          {showTechnicalDetails && responseData && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs font-bold text-red-900 mb-2">📥 RESPONSE DATA</p>
              <pre className="bg-white p-2 rounded border border-red-300 overflow-x-auto text-xs max-h-48 font-mono text-stone-900">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </div>
          )}

          {/* DEV MODE: Stack Trace */}
          {showTechnicalDetails && stackTrace && (
            <div className="mb-4 p-3 bg-gray-900 text-gray-100 rounded-lg border border-gray-700">
              <p className="text-xs font-bold mb-2">📚 STACK TRACE</p>
              <pre className="overflow-x-auto text-xs font-mono whitespace-pre-wrap max-h-64">
                {stackTrace}
              </pre>
            </div>
          )}

          {/* DEV MODE: Error Code */}
          {showTechnicalDetails && errorCode && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-lg">
              <p className="text-xs font-mono text-amber-900"><span className="font-bold">Error Code:</span> {errorCode}</p>
            </div>
          )}

          {/* Redirect warning */}
          {willRedirect && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ You will be redirected to the login page after closing this dialog.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500 focus:ring-offset-2"
          >
            {willRedirect ? 'OK, Go to Login' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}
