import React from 'react';
import { Product, SaleRecord, BrokenRecord } from '../types';
import { formatPrice, exportToCSV } from '../lib/store';
import {
  TrendingUp,
  Award,
  DollarSign,
  AlertOctagon,
  Package,
  Boxes,
  Zap,
  BarChart2,
  AlertTriangle,
  Download
} from 'lucide-react';

interface AnalyticsTabProps {
  products: Product[];
  sales: SaleRecord[];
  brokenRecords: BrokenRecord[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  products,
  sales,
  brokenRecords
}) => {
  // --- 1. Product Sales & Profit Aggregation ---
  interface ProductMetric {
    qr_id: string;
    name: string;
    category: string;
    supplier: string;
    unitsSold: number;
    revenue: number;
    cost: number;
    profit: number;
  }

  const handleExportCSV = () => {
    const headers = ['QR ID', 'Product Name', 'Category', 'Supplier', 'Units Sold', 'Revenue (DA)', 'Cost (DA)', 'Net Profit (DA)'];
    const rows = productMetricsList.map((m) => [
      m.qr_id,
      m.name,
      m.category,
      m.supplier,
      m.unitsSold,
      m.revenue,
      m.cost,
      m.profit
    ]);
    exportToCSV(headers, rows, `analytics_performance_${new Date().toISOString().split('T')[0]}`);
  };

  const productMetricsMap: Record<string, ProductMetric> = {};

  // Initialize with inventory products
  products.forEach((p) => {
    productMetricsMap[p.qr_id] = {
      qr_id: p.qr_id,
      name: p.name,
      category: p.category,
      supplier: p.supplier || 'Unspecified',
      unitsSold: 0,
      revenue: 0,
      cost: 0,
      profit: 0
    };
  });

  // Aggregate sales
  sales.forEach((s) => {
    if (!productMetricsMap[s.qr_id]) {
      productMetricsMap[s.qr_id] = {
        qr_id: s.qr_id,
        name: s.product_name,
        category: 'General',
        supplier: 'Unspecified',
        unitsSold: 0,
        revenue: 0,
        cost: 0,
        profit: 0
      };
    }
    const m = productMetricsMap[s.qr_id];
    m.unitsSold += s.qty;
    m.revenue += s.total;
    const itemCost = (s.buy_price || 0) * s.qty;
    m.cost += itemCost;
    m.profit += s.total - itemCost;
  });

  const productMetricsList = Object.values(productMetricsMap);

  // Most sold product by quantity
  const sortedByQty = [...productMetricsList].sort((a, b) => b.unitsSold - a.unitsSold);
  const mostSoldByQty = sortedByQty[0] && sortedByQty[0].unitsSold > 0 ? sortedByQty[0] : null;

  // Most profitable product by net profit
  const sortedByProfit = [...productMetricsList].sort((a, b) => b.profit - a.profit);
  const mostProfitable = sortedByProfit[0] && sortedByProfit[0].profit > 0 ? sortedByProfit[0] : null;

  // Total Net Store Profit
  const totalNetProfit = productMetricsList.reduce((acc, m) => acc + m.profit, 0);
  const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);

  // --- 2. Supplier Broken / Defective Items Aggregation ---
  interface SupplierBrokenMetric {
    supplierName: string;
    brokenCount: number;
    financialLoss: number;
    productsCount: number;
  }

  const supplierBrokenMap: Record<string, SupplierBrokenMetric> = {};

  // Aggregate from products (broken_count)
  products.forEach((p) => {
    const supp = p.supplier?.trim() || 'Unspecified Supplier';
    if (!supplierBrokenMap[supp]) {
      supplierBrokenMap[supp] = {
        supplierName: supp,
        brokenCount: 0,
        financialLoss: 0,
        productsCount: 0
      };
    }
    const broken = p.broken_count || 0;
    supplierBrokenMap[supp].brokenCount += broken;
    supplierBrokenMap[supp].financialLoss += broken * (p.buy_price || 0);
    supplierBrokenMap[supp].productsCount += 1;
  });

  // Also include logged brokenRecords if any was logged
  brokenRecords.forEach((br) => {
    const supp = br.supplier?.trim() || 'Unspecified Supplier';
    if (!supplierBrokenMap[supp]) {
      supplierBrokenMap[supp] = {
        supplierName: supp,
        brokenCount: 0,
        financialLoss: 0,
        productsCount: 0
      };
    }
  });

  const supplierBrokenList = Object.values(supplierBrokenMap).sort(
    (a, b) => b.brokenCount - a.brokenCount || b.financialLoss - a.financialLoss
  );

  const worstSupplier = supplierBrokenList[0] && supplierBrokenList[0].brokenCount > 0 ? supplierBrokenList[0] : null;
  const maxBrokenSupplierCount = worstSupplier ? worstSupplier.brokenCount : 1;

  const maxProfitVal = mostProfitable ? mostProfitable.profit : 1;
  const maxQtyVal = mostSoldByQty ? mostSoldByQty.unitsSold : 1;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-purple-700 via-indigo-700 to-blue-700 text-white p-6 md:p-8 rounded-2xl shadow-lg flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-purple-200 text-xs font-extrabold uppercase tracking-widest px-3 py-1 rounded-full bg-white/10 backdrop-blur-xs inline-block mb-2">
            Executive Dashboard
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">Advanced Store Analytics</h2>
          <p className="text-purple-100 text-sm mt-1 max-w-xl">
            In-depth insights on product sales performance, net profitability, and supplier defect/broken item losses.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleExportCSV}
            className="py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-xs backdrop-blur-xs hover:scale-105"
          >
            <Download className="w-4 h-4 text-emerald-300" />
            <span>Export Analytics CSV</span>
          </button>
          <div className="flex items-center gap-3 bg-white/10 dark:bg-black/20 p-4 rounded-xl border border-white/20 backdrop-blur-xs font-mono">
            <TrendingUp className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[11px] text-purple-200 uppercase font-bold">Total Net Profit</div>
              <div className="text-xl font-black text-white">{formatPrice(totalNetProfit)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Focus Cards: Most Sold, Most Profitable, Worst Supplier */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Most Sold Product */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800">
              🔥 Top Seller
            </span>
            <Award className="w-6 h-6 text-blue-500" />
          </div>

          {mostSoldByQty ? (
            <div>
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white line-clamp-1">
                {mostSoldByQty.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                ID: {mostSoldByQty.qr_id} • {mostSoldByQty.category}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Units Sold</span>
                  <span className="text-xl font-extrabold text-blue-600 dark:text-blue-400 font-mono">
                    {mostSoldByQty.unitsSold} units
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Revenue</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {formatPrice(mostSoldByQty.revenue)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4">No sales recorded yet.</p>
          )}
        </div>

        {/* Card 2: Most Profitable Product */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800">
              💎 Highest Profit Margin
            </span>
            <DollarSign className="w-6 h-6 text-emerald-500" />
          </div>

          {mostProfitable ? (
            <div>
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white line-clamp-1">
                {mostProfitable.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                ID: {mostProfitable.qr_id} • {mostProfitable.category}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Net Profit</span>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {formatPrice(mostProfitable.profit)}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Units Sold</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {mostProfitable.unitsSold} units
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4">No sales recorded yet.</p>
          )}
        </div>

        {/* Card 3: Supplier with Most Broken Items */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-amber-200 dark:border-amber-800/60 shadow-sm relative overflow-hidden space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-800">
              ⚠️ Highest Defect Supplier
            </span>
            <AlertOctagon className="w-6 h-6 text-amber-500" />
          </div>

          {worstSupplier ? (
            <div>
              <h4 className="font-extrabold text-lg text-slate-900 dark:text-white line-clamp-1">
                {worstSupplier.supplierName}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {worstSupplier.productsCount} catalog item(s) supplied
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Broken Items</span>
                  <span className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                    {worstSupplier.brokenCount} units
                  </span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase font-semibold block">Total Cost Loss</span>
                  <span className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                    -{formatPrice(worstSupplier.financialLoss)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-4 text-emerald-600 dark:text-emerald-400 text-sm font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4" />
              <span>Great news! No broken items reported across suppliers.</span>
            </div>
          )}
        </div>
      </div>

      {/* Breakdown Section: Supplier Defect Analysis & Product Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Supplier Defect Breakdown Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Supplier Defect & Broken Items Ranking
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Ranked by count</span>
          </div>

          <div className="space-y-4">
            {supplierBrokenList.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No supplier defect data available.</p>
            ) : (
              supplierBrokenList.map((supp, index) => {
                const percentage = Math.round((supp.brokenCount / maxBrokenSupplierCount) * 100);
                return (
                  <div key={supp.supplierName} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs flex items-center justify-center shrink-0">
                          #{index + 1}
                        </span>
                        {supp.supplierName}
                      </span>
                      <span className="font-mono text-amber-600 dark:text-amber-400 font-extrabold">
                        {supp.brokenCount} broken unit(s)
                      </span>
                    </div>

                    {/* Progress Visual Bar */}
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, percentage)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-mono pt-1">
                      <span>Inventory items count: {supp.productsCount}</span>
                      <span className="text-rose-500 font-semibold">Cost Loss: -{formatPrice(supp.financialLoss)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Product Net Profitability Rankings Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-500" />
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                Product Net Profitability
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">Ranked by Profit</span>
          </div>

          <div className="space-y-4">
            {sortedByProfit.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No products found.</p>
            ) : (
              sortedByProfit.slice(0, 6).map((item, index) => {
                const percentage = maxProfitVal > 0 ? Math.round((Math.max(0, item.profit) / maxProfitVal) * 100) : 0;
                return (
                  <div key={item.qr_id} className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center text-sm font-bold">
                      <span className="text-slate-900 dark:text-white flex items-center gap-2 line-clamp-1">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center shrink-0">
                          #{index + 1}
                        </span>
                        {item.name}
                      </span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-extrabold shrink-0">
                        +{formatPrice(item.profit)}
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-mono pt-1">
                      <span>
                        Sold: {item.unitsSold} units (Rev: {formatPrice(item.revenue)})
                      </span>
                      <span>Supplier: {item.supplier}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
