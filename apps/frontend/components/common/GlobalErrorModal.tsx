'use client';

import { useState, useEffect } from 'react';
import ErrorModal from './ErrorModal';
import { errorModalManager } from '@/lib/error-modal-manager';

/**
 * Global Error Modal Component
 * Should be placed once in the root layout
 * Listens to the error modal manager and displays errors
 */
export default function GlobalErrorModal() {
  const [errorData, setErrorData] = useState<{
    title: string;
    message: string;
    details?: string[];
    endpoint?: string;
    method?: string;
    statusCode?: number | string;
    willRedirect?: boolean;
    onClose?: () => void;
    // New fields for dev mode
    errorObject?: any;
    requestConfig?: any;
    responseData?: any;
    stackTrace?: string;
    errorCode?: string;
  } | null>(null);

  useEffect(() => {
    // Subscribe to error modal manager
    const unsubscribe = errorModalManager.subscribe((data) => {
      setErrorData(data);
    });

    return unsubscribe;
  }, []);

  const handleClose = () => {
    errorModalManager.hide();
  };

  if (!errorData) return null;

  return (
    <ErrorModal
      isOpen={true}
      title={errorData.title}
      message={errorData.message}
      details={errorData.details}
      endpoint={errorData.endpoint}
      method={errorData.method}
      statusCode={errorData.statusCode}
      willRedirect={errorData.willRedirect}
      errorObject={errorData.errorObject}
      requestConfig={errorData.requestConfig}
      responseData={errorData.responseData}
      stackTrace={errorData.stackTrace}
      errorCode={errorData.errorCode}
      onClose={handleClose}
    />
  );
}
