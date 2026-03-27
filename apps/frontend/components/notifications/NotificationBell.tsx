'use client';

import { useRef, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useClickOutside } from '@/hooks';
import { formatDistanceToNow } from 'date-fns';
import { CheckIcon } from '@/components/ui/icons';

function NotificationBell() {
    const {
        notifications,
        unreadCount,
        isOpen,
        setIsOpen,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    const router = useRouter();
    const menuRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useClickOutside(menuRef, () => setIsOpen(false), isOpen);

    const handleNotificationClick = useCallback(async (notification: Notification) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }
        setIsOpen(false);
        if (notification.link) {
            router.push(notification.link);
        }
    }, [markAsRead, setIsOpen, router]);

    // Memoize getIcon to avoid recreating on every render
    const getIcon = useCallback((type: string) => {
        switch (type) {
            case 'SUCCESS':
                return (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600" aria-hidden="true">
                        <CheckIcon size="sm" />
                    </div>
                );
            case 'WARNING':
                return (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center" aria-hidden="true">
                        <svg className="w-4 h-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                );
            case 'ERROR':
                return (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center" aria-hidden="true">
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            default: // INFO
                return (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center" aria-hidden="true">
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    }, []);

    return (
        <div className="relative mr-4" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-[#C9A84C] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-2 focus:ring-offset-[#0F0F0D] rounded-lg"
                aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
                aria-expanded={isOpen}
                aria-haspopup="true"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white ring-2 ring-[#0F0F0D] animate-pulse" aria-hidden="true">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className="fixed sm:absolute left-0 right-0 sm:left-auto sm:right-0 mt-2 mx-2 sm:mx-0 sm:w-80 md:w-96 rounded-lg bg-white shadow-sm border border-[#D0C5B2]/20 z-50 animate-slideDown overflow-hidden"
                    role="menu"
                    aria-labelledby="notifications-heading"
                >
                    <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-b border-[#D0C5B2]/15 bg-[#F5F4F0]">
                        <h3 id="notifications-heading" className="font-semibold text-[#1B1C1A] text-sm sm:text-base">
                            Notifications {unreadCount > 0 && <span className="text-xs sm:text-sm font-normal text-[#6B6A65]">({unreadCount})</span>}
                        </h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-[10px] sm:text-xs text-[#C9A84C] hover:text-[#755B00] font-medium whitespace-nowrap focus:outline-none focus:underline"
                            >
                                Mark all read
                            </button>
                        )}
                    </div>

                    {/* Optimized scrolling container - uses native browser virtualization with max-height */}
                    <div className="max-h-[60vh] sm:max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="px-4 py-8 text-center text-[#6B6A65] text-sm">
                                No notifications yet.
                            </div>
                        ) : (
                            <ul className="divide-y divide-[#D0C5B2]/15">
                                {notifications.map((notification) => (
                                    <li key={notification.id}>
                                        <button
                                            onClick={() => handleNotificationClick(notification)}
                                            className={`w-full text-left px-3 sm:px-4 py-3 hover:bg-[#F5F4F0] transition-colors focus:outline-none focus:bg-[#F5F4F0] ${notification.isRead ? '' : 'bg-blue-50/50'}`}
                                            aria-label={`${notification.title}. ${notification.message}. ${formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}${notification.isRead ? '' : '. Unread'}`}
                                        >
                                            <div className="flex gap-2 sm:gap-3">
                                                {getIcon(notification.type)}
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs sm:text-sm font-medium line-clamp-2 ${notification.isRead ? 'text-[#6B6A65]' : 'text-[#1B1C1A]'}`}>
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-[11px] sm:text-xs text-[#6B6A65] mt-1 line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-[10px] text-[#6B6A65] mt-1">
                                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                    </p>
                                                </div>
                                                {!notification.isRead && (
                                                    <div className="flex-shrink-0 self-center" aria-hidden="true">
                                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// Memoize component to prevent unnecessary re-renders
export default memo(NotificationBell);
