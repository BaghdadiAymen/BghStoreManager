import React, { useState } from 'react';
import { SaleRecord, Role } from '../types';
import { formatPrice, exportToCSV } from '../lib/store';
import { Calendar, DollarSign, PackageCheck, Printer, RefreshCw, Download, Search, Gift, CheckCircle2 } from 'lucide-react';

interface SalesTabProps {
  sales: SaleRecord[];
  userRole: Role;
  onPrintFactureForSale: (sale: SaleRecord) => void;
  onToggleGiftClaimed?: (saleId: string) => void;
}

export const SalesTab: React.FC<SalesTabProps> = ({
  sales,
  userRole,
  onPrintFactureForSale,
  onToggleGiftClaimed
}) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [giftFilter, setGiftFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');

  const resetDateFilterToToday = () => {
    setStartDate(todayStr);
    setEndDate('');
    setSearchQuery('');
    setGiftFilter('all');
  };

  const handleExportCSV = () => {
    const headers = ['Sale ID', 'Date & Time', 'Product Name', 'Barcode/QR ID', 'Sell Price (DA)', 'Cost Price (DA)', 'Quantity', 'Total Amount (DA)', 'Gift Claimed'];
    const rows = filteredSales.map((s) => [
      s.id,
      new Date(s.created_at).toLocaleString('fr-DZ'),
      s.product_name,
      s.qr_id,
      s.price,
      s.buy_price || 0,
      s.qty,
      s.total,
      s.gift_claimed ? 'YES' : 'NO'
    ]);
    exportToCSV(headers, rows, `sales_report_${startDate || 'all'}_to_${endDate || 'today'}`);
  };

  const filteredSales = sales.filter((s) => {
    // Gift Filter
    if (giftFilter === 'claimed' && !s.gift_claimed) return false;
    if (giftFilter === 'unclaimed' && s.gift_claimed) return false;

    const term = searchQuery.trim().toLowerCase();

    // Match Search Query first (Sale ID, Product Name, or QR ID)
    if (term) {
      const matchesSearch =
        s.id.toLowerCase().includes(term) ||
        s.product_name.toLowerCase().includes(term) ||
        s.qr_id.toLowerCase().includes(term);

      if (!matchesSearch) return false;
    }

    // Apply Date Filter only if no direct Sale ID search or if date is specified
    if (!term || (startDate && endDate) || (startDate && !endDate && startDate !== todayStr)) {
      const saleDateStr = new Date(s.created_at).toISOString().split('T')[0];
      if (startDate && endDate) {
        return saleDateStr >= startDate && saleDateStr <= endDate;
      } else if (startDate) {
        return saleDateStr === startDate;
      } else if (endDate) {
        return saleDateStr <= endDate;
      }
    }

    return true;
  });

  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalItemsSold = filteredSales.reduce((acc, s) => acc + s.qty, 0);
  const totalGiftsClaimed = sales.filter((s) => s.gift_claimed).length;

  return (
    <div className="space-y-6">
      {/* Date Filter & Search Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Sale ID / QR / Name Search Field */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Scan or type Sale ID (e.g. SALE-1002) or product name..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          />
        </div>

        {/* Gift Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setGiftFilter('all')}
            className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-all ${
              giftFilter === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            All Factures
          </button>
          <button
            type="button"
            onClick={() => setGiftFilter('claimed')}
            className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-all ${
              giftFilter === 'claimed'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            🎁 Gift Claimed
          </button>
          <button
            type="button"
            onClick={() => setGiftFilter('unclaimed')}
            className={`px-2.5 py-1 rounded text-xs font-bold cursor-pointer transition-all ${
              giftFilter === 'unclaimed'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            Unclaimed
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-blue-500" />
            <span>Filter Period:</span>
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredSales.length === 0}
            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Export sales report to Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export to CSV</span>
          </button>

          <button
            onClick={resetDateFilterToToday}
            className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Today Only</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Revenue
            </span>
            <span className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1 block">
              {formatPrice(totalRevenue)}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Total Items Sold
            </span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
              {totalItemsSold}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <PackageCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-purple-200 dark:border-purple-900/50 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
              Customer Gifts Claimed
            </span>
            <span className="text-3xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1 block">
              {totalGiftsClaimed} <span className="text-sm font-semibold text-slate-400">factures</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Sales Log Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Sales Log ({filteredSales.length} records)
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            🎁 Mark factures as "Gift Claimed" when customer redeems loyalty rewards.
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Sale ID</th>
                <th className="py-3 px-4">Date / Time</th>
                <th className="py-3 px-4">Product Name</th>
                {userRole === 'admin' && <th className="py-3 px-4">Buy Price</th>}
                <th className="py-3 px-4">Sell Price</th>
                <th className="py-3 px-4">Qty</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Gift / Reward</th>
                <th className="py-3 px-4 text-right">Facture</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredSales.length === 0 ? (
                <tr>
                  <td
                    colSpan={userRole === 'admin' ? 9 : 8}
                    className="py-8 text-center text-slate-400 dark:text-slate-500 text-sm"
                  >
                    No sales records found for the selected period.
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {s.id}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 font-mono">
                      {new Date(s.created_at).toLocaleString('fr-DZ')}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                      {s.product_name}
                    </td>
                    {userRole === 'admin' && (
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">
                        {formatPrice(s.buy_price)}
                      </td>
                    )}
                    <td className="py-3 px-4 font-mono text-xs text-slate-800 dark:text-slate-200">
                      {formatPrice(s.price)}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800 dark:text-slate-200">
                      {s.qty}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {formatPrice(s.total)}
                    </td>
                    <td className="py-3 px-4">
                      {s.gift_claimed ? (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                            <span>Gift Claimed 🎁</span>
                          </span>
                          {onToggleGiftClaimed && (
                            <button
                              onClick={() => onToggleGiftClaimed(s.id)}
                              className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline cursor-pointer"
                              title="Undo gift claim mark"
                            >
                              Undo
                            </button>
                          )}
                        </div>
                      ) : (
                        onToggleGiftClaimed && (
                          <button
                            onClick={() => onToggleGiftClaimed(s.id)}
                            className="py-1 px-2.5 rounded-lg border border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Gift className="w-3.5 h-3.5" />
                            <span>Mark Gift Claimed</span>
                          </button>
                        )
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onPrintFactureForSale(s)}
                        className="py-1 px-2.5 rounded border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5 text-blue-500" />
                        <span>Facture</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
