'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UsersService } from '@/services/users.service';
import { User } from '@/types';
import { formatDate } from '@/lib/utils/date.utils';
import { handleApiError } from '@/lib/errors';
import { toast } from '@/lib/toast';

export default function ClientsListPage() {
    const [clients, setClients] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadClients();
    }, []);

    async function loadClients() {
        try {
            const data = await UsersService.getClients();
            setClients(data);
        } catch (error) {
            toast.error(handleApiError(error, 'Failed to load clients'));
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="p-8 text-center">Loading clients...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-navy-900">Clients</h1>
                <Link
                    href="/dashboard/admin/users/new?role=CLIENT"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-navy-600 hover:bg-navy-700"
                >
                    <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Add Client
                </Link>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white shadow border border-gray-200 sm:rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Name
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Contact
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Joined
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">View</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold">
                                                {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{client.firstName} {client.lastName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div>{client.email}</div>
                                        {client.phone && <div className="text-xs">{client.phone}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(client.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${client.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {client.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Link href={`/dashboard/admin/clients/${client.id}`} className="text-navy-600 hover:text-navy-900">
                                            View
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {clients.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        No clients found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
                {clients.length === 0 ? (
                    <div className="bg-white shadow border border-gray-200 rounded-lg p-6 text-center text-gray-500">
                        No clients found.
                    </div>
                ) : (
                    clients.map((client) => (
                        <Link key={client.id} href={`/dashboard/admin/clients/${client.id}`}>
                            <div className="bg-white shadow border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="h-12 w-12 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold flex-shrink-0">
                                        {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-base font-semibold text-gray-900">
                                            {client.firstName} {client.lastName}
                                        </div>
                                        <span className={`inline-flex px-2 py-0.5 text-xs leading-5 font-semibold rounded-full ${client.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {client.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex items-start gap-2">
                                        <svg className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-gray-700 break-all">{client.email}</span>
                                    </div>
                                    {client.phone && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                            </svg>
                                            <span className="text-gray-700">{client.phone}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-gray-500 text-xs">Joined {formatDate(client.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
