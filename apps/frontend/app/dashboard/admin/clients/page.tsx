'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/utils/date.utils';
import { useClientsQuery } from '@/hooks/queries';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function ClientsListPage() {
    const { data: clients = [], isLoading } = useClientsQuery();

    if (isLoading) {
        return (
            <div className="flex flex-col h-full">
                <DashboardHeader title="Clients" />
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-sm text-[#6B6A65]">Loading clients...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <DashboardHeader title="Clients" />

            <div className="flex-1 px-6 py-8">
                <div className="max-w-7xl mx-auto space-y-4">
                    {/* Desktop Table */}
                    <div className="hidden md:block bg-white rounded-lg overflow-hidden">
                        <table className="min-w-full">
                            <thead className="bg-[#F5F4F0]">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[#6B6A65]">Name</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[#6B6A65]">Contact</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[#6B6A65]">Joined</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[#6B6A65]">Status</th>
                                    <th scope="col" className="px-6 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#D0C5B2]/15">
                                {clients.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-sm text-[#6B6A65]">No clients found.</td>
                                    </tr>
                                )}
                                {clients.map((client) => (
                                    <tr key={client.id} className="hover:bg-[#FAF9F5] transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#755B00] to-[#C9A84C] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                                    {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                                                </div>
                                                <span className="text-sm font-medium text-[#1B1C1A]">{client.firstName} {client.lastName}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]">
                                            <div>{client.email}</div>
                                            {client.phone && <div className="text-xs mt-0.5">{client.phone}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#6B6A65]">{formatDate(client.createdAt)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 text-xs font-semibold uppercase tracking-widest rounded-full ${client.isActive ? 'bg-[#D1E7DD] text-[#2D6A4F]' : 'bg-[#FFDAD6]/50 text-[#BA1A1A]'}`}>
                                                {client.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <Link href={`/dashboard/admin/clients/${client.id}`} className="text-[#C9A84C] hover:text-[#755B00] font-medium transition-colors">
                                                View →
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {clients.length === 0 ? (
                            <div className="bg-white rounded-lg p-6 text-center text-sm text-[#6B6A65]">No clients found.</div>
                        ) : (
                            clients.map((client) => (
                                <Link key={client.id} href={`/dashboard/admin/clients/${client.id}`}>
                                    <div className="bg-white rounded-lg p-4 hover:bg-[#F5F4F0] transition-colors">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#755B00] to-[#C9A84C] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-semibold text-[#1B1C1A]">{client.firstName} {client.lastName}</div>
                                                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${client.isActive ? 'bg-[#D1E7DD] text-[#2D6A4F]' : 'bg-[#FFDAD6]/50 text-[#BA1A1A]'}`}>
                                                    {client.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5 text-sm text-[#6B6A65]">
                                            <div className="flex items-start gap-2">
                                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                                <span className="break-all">{client.email}</span>
                                            </div>
                                            {client.phone && (
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                    <span>{client.phone}</span>
                                                </div>
                                            )}
                                            <div className="text-xs">Joined {formatDate(client.createdAt)}</div>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
