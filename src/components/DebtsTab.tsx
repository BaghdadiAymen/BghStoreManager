import React, { useState } from 'react';
import { DebtRecord, Role } from '../types';
import { formatPrice, exportToCSV } from '../lib/store';
import {
  CreditCard,
  Plus,
  Search,
  Users,
  Building2,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertCircle,
  Pencil,
  Trash2,
  Download,
  X,
  Phone,
  FileText,
  Calendar
} from 'lucide-react';

interface DebtsTabProps {
  debts: DebtRecord[];
  userRole: Role;
  onSaveDebt: (debt: DebtRecord) => void;
  onDeleteDebt: (id: string) => void;
}

export const DebtsTab: React.FC<DebtsTabProps> = ({
  debts,
  userRole,
  onSaveDebt,
  onDeleteDebt
}) => {
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'supplier'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'partially_paid' | 'paid'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtRecord | null>(null);

  // Form Fields
  const [formType, setFormType] = useState<'customer' | 'supplier'>('customer');
  const [formPartyName, setFormPartyName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formTotalAmount, setFormTotalAmount] = useState<number | ''>('');
  const [formPaidAmount, setFormPaidAmount] = useState<number | ''>(0);
  const [formNotes, setFormNotes] = useState('');
  const [formDueDate, setFormDueDate] = useState('');

  // Payment Quick Modal
  const [paymentModalDebt, setPaymentModalDebt] = useState<DebtRecord | null>(null);
  const [paymentAmountToAdd, setPaymentAmountToAdd] = useState<number | ''>('');

  const filteredDebts = debts.filter((d) => {
    if (filterType !== 'all' && d.type !== filterType) return false;
    if (filterStatus !== 'all' && d.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        d.party_name.toLowerCase().includes(term) ||
        (d.phone && d.phone.toLowerCase().includes(term)) ||
        (d.notes && d.notes.toLowerCase().includes(term))
      );
    }
    return true;
  });

  // Calculate totals
  const totalCustomerDebtOwedToUs = debts
    .filter((d) => d.type === 'customer')
    .reduce((acc, d) => acc + (d.total_amount - d.paid_amount), 0);

  const totalSupplierDebtWeOwe = debts
    .filter((d) => d.type === 'supplier')
    .reduce((acc, d) => acc + (d.total_amount - d.paid_amount), 0);

  const openAddModal = (defaultType: 'customer' | 'supplier' = 'customer') => {
    setEditingDebt(null);
    setFormType(defaultType);
    setFormPartyName('');
    setFormPhone('');
    setFormTotalAmount('');
    setFormPaidAmount(0);
    setFormNotes('');
    setFormDueDate('');
    setIsModalOpen(true);
  };

  const openEditModal = (d: DebtRecord) => {
    setEditingDebt(d);
    setFormType(d.type);
    setFormPartyName(d.party_name);
    setFormPhone(d.phone || '');
    setFormTotalAmount(d.total_amount);
    setFormPaidAmount(d.paid_amount);
    setFormNotes(d.notes || '');
    setFormDueDate(d.due_date || '');
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPartyName || formTotalAmount === '') {
      alert('Party Name and Total Amount are required!');
      return;
    }

    const total = Number(formTotalAmount) || 0;
    const paid = Number(formPaidAmount) || 0;

    let status: 'pending' | 'partially_paid' | 'paid' = 'pending';
    if (paid >= total && total > 0) {
      status = 'paid';
    } else if (paid > 0) {
      status = 'partially_paid';
    }

    const record: DebtRecord = {
      id: editingDebt ? editingDebt.id : `DEBT-${Date.now().toString().slice(-5)}`,
      type: formType,
      party_name: formPartyName.trim(),
      phone: formPhone.trim(),
      total_amount: total,
      paid_amount: paid,
      notes: formNotes.trim(),
      due_date: formDueDate || undefined,
      status,
      created_at: editingDebt ? editingDebt.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    onSaveDebt(record);
    setIsModalOpen(false);
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalDebt || paymentAmountToAdd === '') return;

    const addedPaid = Number(paymentAmountToAdd) || 0;
    const newPaidAmount = paymentModalDebt.paid_amount + addedPaid;
    const total = paymentModalDebt.total_amount;

    let status: 'pending' | 'partially_paid' | 'paid' = 'pending';
    if (newPaidAmount >= total) {
      status = 'paid';
    } else if (newPaidAmount > 0) {
      status = 'partially_paid';
    }

    const updated: DebtRecord = {
      ...paymentModalDebt,
      paid_amount: Math.min(total, newPaidAmount),
      status,
      updated_at: new Date().toISOString()
    };

    onSaveDebt(updated);
    setPaymentModalDebt(null);
    setPaymentAmountToAdd('');
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete debt record for '${name}'?`)) {
      onDeleteDebt(id);
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Debt ID',
      'Type',
      'Party Name',
      'Phone Number',
      'Total Debt (DA)',
      'Paid Amount (DA)',
      'Remaining Balance (DA)',
      'Status',
      'Due Date',
      'Notes'
    ];
    const rows = filteredDebts.map((d) => [
      d.id,
      d.type === 'customer' ? 'Customer (Owed to Us)' : 'Supplier (We Owe)',
      d.party_name,
      d.phone || 'N/A',
      d.total_amount,
      d.paid_amount,
      d.total_amount - d.paid_amount,
      d.status,
      d.due_date || 'N/A',
      d.notes || ''
    ]);
    exportToCSV(headers, rows, `debts_report_${new Date().toISOString().split('T')[0]}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Money owed to us by customers */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800/60 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Customer Debts (Owed to Us)
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
              {formatPrice(totalCustomerDebtOwedToUs)}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Credit extended to customers
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Money we owe to suppliers */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-rose-200 dark:border-rose-800/60 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
              Supplier Debts (We Owe)
            </span>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1 block">
              {formatPrice(totalSupplierDebtWeOwe)}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Outstanding bills to suppliers
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Net Outstanding Balance */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-blue-200 dark:border-blue-800/60 shadow-xs flex items-center justify-between col-span-1 md:col-span-2 lg:col-span-1">
          <div>
            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
              Net Debt Position
            </span>
            <span className={`text-2xl font-black font-mono mt-1 block ${
              totalCustomerDebtOwedToUs - totalSupplierDebtWeOwe >= 0
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              {formatPrice(totalCustomerDebtOwedToUs - totalSupplierDebtWeOwe)}
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              (Customer Debts - Supplier Debts)
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Search & Category Tabs */}
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search debtor name, phone, notes..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Debts
            </button>
            <button
              onClick={() => setFilterType('customer')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'customer'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Customers
            </button>
            <button
              onClick={() => setFilterType('supplier')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filterType === 'supplier'
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Suppliers
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            disabled={filteredDebts.length === 0}
            className="py-2 px-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Export Debts to CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => openAddModal('customer')}
            className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Customer Debt</span>
          </button>

          <button
            onClick={() => openAddModal('supplier')}
            className="py-2 px-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Supplier Debt</span>
          </button>
        </div>
      </div>

      {/* Debts Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-500" />
            <span>Debts Register ({filteredDebts.length} entries)</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50">
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Party / Name</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Paid Amount</th>
                <th className="py-3 px-4">Remaining Balance</th>
                <th className="py-3 px-4">Status & Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
                    No debt records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredDebts.map((d) => {
                  const remaining = d.total_amount - d.paid_amount;
                  const isCustomer = d.type === 'customer';

                  return (
                    <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      {/* Type Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-extrabold uppercase ${
                            isCustomer
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                          }`}
                        >
                          {isCustomer ? <Users className="w-3.5 h-3.5" /> : <Building2 className="w-3.5 h-3.5" />}
                          <span>{isCustomer ? 'Customer' : 'Supplier'}</span>
                        </span>
                      </td>

                      {/* Party Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white text-sm">
                          {d.party_name}
                        </div>
                        {d.notes && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                            "{d.notes}"
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {d.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {d.phone}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 dark:text-white">
                        {formatPrice(d.total_amount)}
                      </td>

                      {/* Paid Amount */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPrice(d.paid_amount)}
                      </td>

                      {/* Remaining Balance */}
                      <td className="py-3.5 px-4 font-mono font-extrabold text-sm">
                        <span className={remaining > 0 ? (isCustomer ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400') : 'text-slate-400'}>
                          {formatPrice(remaining)}
                        </span>
                      </td>

                      {/* Status & Due Date */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {d.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Paid Off</span>
                            </span>
                          ) : d.status === 'partially_paid' ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Partial</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Unpaid</span>
                            </span>
                          )}

                          {d.due_date && (
                            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              <span>Due: {d.due_date}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {remaining > 0 && (
                            <button
                              onClick={() => {
                                setPaymentModalDebt(d);
                                setPaymentAmountToAdd(remaining);
                              }}
                              className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                              title="Record payment"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Pay</span>
                            </button>
                          )}

                          <button
                            onClick={() => openEditModal(d)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                            title="Edit Record"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleDelete(d.id, d.party_name)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Debt Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                {editingDebt ? 'Edit Debt Record' : `New ${formType === 'customer' ? 'Customer' : 'Supplier'} Debt`}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Debt Category Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('customer')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formType === 'customer'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Customer Owed</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormType('supplier')}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      formType === 'supplier'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Supplier We Owe</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {formType === 'customer' ? 'Customer Full Name' : 'Supplier Company / Name'} *
                </label>
                <input
                  type="text"
                  value={formPartyName}
                  onChange={(e) => setFormPartyName(e.target.value)}
                  placeholder={formType === 'customer' ? 'e.g. Ahmed Brahimi' : 'e.g. Anker Wholesale Direct'}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="e.g. 0550 12 34 56"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Total Amount (DA) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formTotalAmount}
                    onChange={(e) => setFormTotalAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Paid Amount (DA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formPaidAmount}
                    onChange={(e) => setFormPaidAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formDueDate}
                  onChange={(e) => setFormDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Details
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Additional context, items list, or payment agreement..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  Save Debt Record
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Pay Modal */}
      {paymentModalDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                <span>Record Payment</span>
              </h3>
              <button
                onClick={() => setPaymentModalDebt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
              <div><b>Party:</b> {paymentModalDebt.party_name}</div>
              <div><b>Total Debt:</b> {formatPrice(paymentModalDebt.total_amount)}</div>
              <div><b>Already Paid:</b> {formatPrice(paymentModalDebt.paid_amount)}</div>
              <div className="text-amber-600 dark:text-amber-400 font-bold">
                <b>Remaining:</b> {formatPrice(paymentModalDebt.total_amount - paymentModalDebt.paid_amount)}
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Payment Amount to Add (DA)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  max={paymentModalDebt.total_amount - paymentModalDebt.paid_amount}
                  value={paymentAmountToAdd}
                  onChange={(e) => setPaymentAmountToAdd(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-sm"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition-colors text-sm"
                >
                  Confirm Payment
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentModalDebt(null)}
                  className="py-2.5 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
