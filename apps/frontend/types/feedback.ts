// Import enums from centralized enums file
import { FeedbackStatus, FeedbackAudience } from './enums';
export { FeedbackStatus, FeedbackAudience, FEEDBACK_STATUS_LABELS, FEEDBACK_AUDIENCE_LABELS } from './enums';

export interface FeedbackCycle {
    id: string;
    projectId: string;
    employeeId: string;
    startDate: string;
    endDate?: string;
    status: FeedbackStatus;
    createdAt: string;
    employee: {
        id: string;
        firstName: string;
        lastName: string;
    };
    feedback: Feedback[];
    files: { id: string; url: string; originalName: string; mimeType: string; }[];
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
    targetAudience: FeedbackAudience;
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
