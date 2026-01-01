export interface FeedbackCycle {
    id: string;
    projectId: string;
    employeeId: string;
    startDate: string;
    endDate?: string;
    status: 'open' | 'submitted' | 'approved' | 'rejected';
    createdAt: string;
    employee: {
        id: string;
        firstName: string;
        lastName: string;
    };
    feedback: Feedback[];
    files: any[]; // File type
    timeElapsed?: {
        days: number;
        hours: number;
    };
}

export interface Feedback {
    id: string;
    projectId: string;
    feedbackCycleId: string;
    createdBy: string;
    targetAudience: 'client_space' | 'employee_space';
    content?: string;
    fileDocumentId?: string;
    sequenceInCycle: number;
    createdAt: string;
    creator: {
        id: string;
        firstName: string;
        lastName: string;
        role: string;
        email?: string;
    };
}
