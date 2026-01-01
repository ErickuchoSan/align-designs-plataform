import { useState } from 'react';
import { Feedback, FeedbackCycle } from '@/types/feedback';
import { FeedbackService } from '@/services/feedback.service';
import { ButtonLoader } from '@/app/components/Loader'; // Assuming exists
import { toast } from 'react-hot-toast';

interface FeedbackThreadProps {
    cycle: FeedbackCycle;
    onUpdate: () => void;
    currentUserId: string; // To determine side
}

export function FeedbackThread({ cycle, onUpdate, currentUserId }: FeedbackThreadProps) {
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            await FeedbackService.addFeedback({
                projectId: cycle.projectId,
                employeeId: cycle.employeeId,
                targetAudience: 'client_space', // For now hardcoded, logic should determine
                content: newMessage
            });
            setNewMessage('');
            onUpdate();
        } catch (error) {
            console.error('Error sending feedback:', error);
            toast.error('Error sending message');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="flex flex-col h-[600px] border border-gray-200 rounded-lg bg-white">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="font-semibold text-gray-800">Cycle Details</h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {cycle.feedback.map((item) => {
                    const isMe = item.createdBy === currentUserId; // This logic needs to be passed down or handled better
                    return (
                        <div key={item.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                                }`}>
                                <p className="text-sm">{item.content}</p>
                                <div className={`text-xs mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={cycle.status !== 'open' || isSending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending || cycle.status !== 'open'}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSending ? '...' : 'Send'}
                    </button>
                </form>
            </div>
        </div>
    );
}
