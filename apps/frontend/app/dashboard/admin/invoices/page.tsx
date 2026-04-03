'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import InvoiceStatusBadge from '@/components/dashboard/invoices/InvoiceStatusBadge';
import { formatCurrency } from '@/lib/utils/currency.utils';
import { formatDate } from '@/lib/utils/date.utils';
import { useInvoicesListQuery } from '@/hooks/queries';
import { InvoiceStatus } from '@/types/enums';

type FilterTab = 'all' | InvoiceStatus;

const FILTER_TABS: { label: string; value: FilterTab }[] = [
  { label: 'All', value: 'all' },
  { label: 'Draft', value: InvoiceStatus.DRAFT },
  { label: 'Sent', value: InvoiceStatus.SENT },
  { label: 'Paid', value: InvoiceStatus.PAID },
  { label: 'Overdue', value: InvoiceStatus.OVERDUE },
];

function ClientAvatar({ firstName, lastName }: Readonly<{ firstName?: string; lastName?: string }>) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || '?';
  return (
    <div className="w-7 h-7 rounded-full bg-[#C9A84C]/15 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-[#755B00]">
      {initials}
    </div>
  );
}

export default function InvoicesListPage() {
  const router = useRouter();
  const { data: invoices = [], isLoading } = useInvoicesListQuery();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Stat computations
  const stats = useMemo(() => {
    const total = invoices.reduce((s, inv) => s + (inv.totalAmount ?? 0), 0);
    const paid = invoices
      .filter(inv => inv.status === InvoiceStatus.PAID)
      .reduce((s, inv) => s + (inv.totalAmount ?? 0), 0);
    const outstanding = invoices
      .filter(inv => inv.status === InvoiceStatus.SENT || inv.status === InvoiceStatus.DRAFT)
      .reduce((s, inv) => s + (inv.totalAmount ?? 0), 0);
    const overdue = invoices
      .filter(inv => inv.status === InvoiceStatus.OVERDUE)
      .reduce((s, inv) => s + (inv.totalAmount ?? 0), 0);
    return { total, paid, outstanding, overdue };
  }, [invoices]);

  const filtered = useMemo(
    () => activeFilter === 'all' ? invoices : invoices.filter(inv => inv.status === activeFilter),
    [invoices, activeFilter]
  );

  return (
    <div className="flex flex-col h-full">
      <DashboardHeader title="Invoices" />

      <div className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* ── Stat cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Invoiced"
              value={formatCurrency(stats.total)}
              sub="All time volume"
              icon={<WalletIcon />}
              loading={isLoading}
            />
            <StatCard
              label="Total Paid"
              value={formatCurrency(stats.paid)}
              sub={`${invoices.length ? Math.round((invoices.filter(i => i.status === InvoiceStatus.PAID).length / invoices.length) * 100) : 0}% completion rate`}
              icon={<CheckIcon />}
              accent="#2D6A4F"
              loading={isLoading}
            />
            <StatCard
              label="Outstanding"
              value={formatCurrency(stats.outstanding)}
              sub={`${invoices.filter(i => i.status === InvoiceStatus.SENT || i.status === InvoiceStatus.DRAFT).length} active invoices`}
              icon={<ClockIcon />}
              accent="#515E7E"
              loading={isLoading}
            />
            <StatCard
              label="Overdue"
              value={formatCurrency(stats.overdue)}
              sub="Requires attention"
              icon={<WarningIcon />}
              accent="#BA1A1A"
              loading={isLoading}
            />
          </div>

          {/* ── Table card ── */}
          <div className="hidden md:block bg-white rounded-xl overflow-hidden">
            {/* Filter tabs + create button */}
            <div className="px-6 pt-5 pb-4 border-b border-[#D0C5B2]/15 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1 bg-[#F5F4F0] p-1 rounded-lg self-start w-fit">
                {FILTER_TABS.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveFilter(tab.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                      activeFilter === tab.value
                        ? 'bg-white text-[#1B1C1A] shadow-sm'
                        : 'text-[#6B6A65] hover:text-[#1B1C1A]'
                    }`}
                  >
                    {tab.label}
                    {tab.value !== 'all' && (
                      <span className="ml-1.5 text-[10px] opacity-60">
                        ({invoices.filter(i => i.status === tab.value).length})
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <Link
                href="/dashboard/admin/invoices/new"
                className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white text-sm font-semibold hover:brightness-95 transition-all flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create Invoice
              </Link>
              <Link
                href="/dashboard/admin/invoices/new"
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white hover:brightness-95 transition-all flex-shrink-0"
                aria-label="Create Invoice"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#F5F4F0]/50 border-b border-[#D0C5B2]/15">
                    {['Invoice #', 'Client', 'Project', 'Amount', 'Issue Date', 'Due Date', 'Status', ''].map(h => (
                      <th key={h} className="px-6 py-3 text-[10px] font-semibold uppercase tracking-widest text-[#6B6A65]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0C5B2]/15">
                  {isLoading && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-sm text-[#6B6A65]">Loading invoices...</td>
                    </tr>
                  )}
                  {!isLoading && filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-sm text-[#6B6A65]">
                        No invoices{activeFilter === 'all' ? '' : ` with status "${activeFilter}"`}.
                      </td>
                    </tr>
                  )}
                  {filtered.map(invoice => (
                    <tr
                      key={invoice.id}
                      className="hover:bg-[#FAF9F5] transition-colors group cursor-pointer"
                      onClick={() => router.push(`/dashboard/admin/invoices/${invoice.id}`)}
                    >
                      <td className="px-6 py-4 text-sm font-semibold text-[#C9A84C] whitespace-nowrap">
                        {invoice.invoiceNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <ClientAvatar firstName={invoice.client?.firstName} lastName={invoice.client?.lastName} />
                          <span className="text-sm font-medium text-[#1B1C1A] whitespace-nowrap">
                            {invoice.client?.firstName} {invoice.client?.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6B6A65] max-w-[180px] truncate">
                        {invoice.project?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-[#1B1C1A] whitespace-nowrap">
                        {formatCurrency(invoice.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-[#6B6A65] whitespace-nowrap">
                        {formatDate(invoice.issueDate)}
                      </td>
                      <td className={`px-6 py-4 text-sm whitespace-nowrap font-medium ${invoice.status === InvoiceStatus.OVERDUE ? 'text-[#BA1A1A]' : 'text-[#6B6A65]'}`}>
                        {formatDate(invoice.dueDate)}
                      </td>
                      <td className="px-6 py-4">
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => { e.stopPropagation(); router.push(`/dashboard/admin/invoices/${invoice.id}`); }}
                            className="p-1.5 rounded-lg text-[#6B6A65] hover:text-[#1B1C1A] hover:bg-[#F5F4F0] transition-colors"
                            title="View"
                          >
                            <EyeIcon />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); router.push(`/dashboard/admin/invoices/${invoice.id}`); }}
                            className="p-1.5 rounded-lg text-[#6B6A65] hover:text-[#1B1C1A] hover:bg-[#F5F4F0] transition-colors"
                            title="Edit"
                          >
                            <EditIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            {!isLoading && filtered.length > 0 && (
              <div className="px-6 py-4 border-t border-[#D0C5B2]/15">
                <p className="text-xs text-[#6B6A65]">
                  Showing {filtered.length} of {invoices.length} invoice{invoices.length === 1 ? '' : 's'}
                </p>
              </div>
            )}
          </div>

          {/* ── Mobile cards ── */}
          <div className="md:hidden space-y-3">
            {/* Mobile top row: filter pills + create button */}
            <div className="flex items-center gap-2">
              <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
                {FILTER_TABS.map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveFilter(tab.value)}
                    className={`flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                      activeFilter === tab.value
                        ? 'bg-[#C9A84C] text-[#241A00]'
                        : 'bg-white text-[#6B6A65] border border-[#D0C5B2]/30'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <Link
                href="/dashboard/admin/invoices/new"
                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-[#755B00] to-[#C9A84C] text-white hover:brightness-95 transition-all"
                aria-label="Create Invoice"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </Link>
            </div>

            {isLoading && <div className="bg-white rounded-xl p-8 text-center text-sm text-[#6B6A65]">Loading...</div>}
            {!isLoading && filtered.length === 0 && (
              <div className="bg-white rounded-xl p-8 text-center text-sm text-[#6B6A65]">No invoices found.</div>
            )}
            {filtered.map(invoice => (
              <Link key={invoice.id} href={`/dashboard/admin/invoices/${invoice.id}`}>
                <div className="bg-white rounded-xl p-4 hover:bg-[#FAF9F5] transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-sm font-semibold text-[#C9A84C]">{invoice.invoiceNumber}</div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <ClientAvatar firstName={invoice.client?.firstName} lastName={invoice.client?.lastName} />
                        <div className="text-sm font-medium text-[#1B1C1A]">
                          {invoice.client?.firstName} {invoice.client?.lastName}
                        </div>
                      </div>
                      {invoice.project?.name && (
                        <div className="text-xs text-[#6B6A65] mt-0.5">{invoice.project.name}</div>
                      )}
                    </div>
                    <InvoiceStatusBadge status={invoice.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-[#6B6A65]">Issued</div>
                      <div className="text-[#1B1C1A] font-medium">{formatDate(invoice.issueDate)}</div>
                    </div>
                    <div>
                      <div className="text-[#6B6A65]">Due</div>
                      <div className={`font-medium ${invoice.status === InvoiceStatus.OVERDUE ? 'text-[#BA1A1A]' : 'text-[#1B1C1A]'}`}>
                        {formatDate(invoice.dueDate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[#6B6A65]">Amount</div>
                      <div className="text-[#1B1C1A] font-bold">{formatCurrency(invoice.totalAmount)}</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, accent = '#C9A84C', loading }: Readonly<{
  label: string; value: string; sub: string; icon: React.ReactNode; accent?: string; loading?: boolean;
}>) {
  return (
    <div className="bg-white rounded-xl p-5 flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accent}15`, color: accent }}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6B6A65]">{label}</p>
        {loading
          ? <div className="mt-1 h-6 w-20 bg-[#E9E8E4] animate-pulse rounded" />
          : <p className="text-xl font-bold text-[#1B1C1A] mt-0.5 truncate">{value}</p>
        }
        <p className="text-[11px] text-[#6B6A65] mt-0.5 truncate">{sub}</p>
      </div>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
const WalletIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z" />
    <path d="M16 3l-4-1-4 1" />
    <circle cx="17" cy="14" r="1" fill="currentColor" />
  </svg>
);
const CheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);
const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const WarningIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
