import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  Package,
  TrendingDown,
  TrendingUp,
  CalendarDays,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  RefreshCw,
} from "lucide-react";

import Navbar from "../components/layout/Navbar";
import transactionService from "../services/transactionService";
import IncomingTransactionModal from "../components/transactions/IncomingTransactionModal";
import OutgoingTransactionModal from "../components/transactions/OutgoingTransactionModal";
import AdjustmentTransactionModal from "../components/transactions/AdjustmentTransactionModal";
import TransactionDetailModal from "../components/transactions/TransactionDetailModal";

function TransactionsPage() {
  const today = new Date();

  const [summary, setSummary] = useState(null);
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [selectedTransactionId, setSelectedTransactionId] = useState(null);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showOutgoingModal, setShowOutgoingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 7,
    totalItems: 0,
    totalPages: 0,
  });
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  const monthName = today.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);

      const response = await transactionService.getSummary({
        month,
        year,
      });

      setSummary(response.data);
    } catch (error) {
      console.error("Gagal mengambil ringkasan transaksi:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchTransactions = async () => {
    try {
      setTableLoading(true);

      const response = await transactionService.getTransactions({
        search,
        type,
        start_date: startDate,
        end_date: endDate,
        page: currentPage,
        limit: 7,
      });

      setTransactions(response.data || []);

      setPagination(
        response.pagination || {
          currentPage: 1,
          limit: 7,
          totalItems: 0,
          totalPages: 0,
        },
      );
    } catch (error) {
      console.error("Gagal mengambil riwayat transaksi:", error);
      setTransactions([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      fetchTransactions();
    }, 300);

    return () => clearTimeout(delay);
  }, [search, type, startDate, endDate, currentPage]);

const summaryCards = [
  {
    title: "Transaksi Masuk",
    count: summary?.incoming_transactions ?? 0,
    quantity: summary?.incoming_quantity ?? 0,
    icon: TrendingUp,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    description: "Total barang masuk",
  },
  {
    title: "Transaksi Keluar",
    count: summary?.outgoing_transactions ?? 0,
    quantity: summary?.outgoing_quantity ?? 0,
    icon: TrendingDown,
    color: "text-rose-600",
    bg: "bg-rose-50",
    description: "Total barang keluar",
  },
  {
    title: "Penyesuaian Stok",
    count: summary?.adjustment_transactions ?? 0,
    quantity: summary?.different_items ?? 0,
    icon: ClipboardList,
    color: "text-blue-600",
    bg: "bg-blue-50",
    description: "Total penyesuaian",
  },
];

  const quickActions = [
    {
      title: "Barang Masuk",
      description: "Catat penerimaan barang baru",
      icon: ArrowDownToLine,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "hover:border-emerald-300",
    },
    {
      title: "Barang Keluar",
      description: "Catat pengeluaran barang",
      icon: ArrowUpFromLine,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "hover:border-blue-300",
    },
    {
      title: "Penyesuaian Stok",
      description: "Sesuaikan stok fisik dan sistem",
      icon: ClipboardList,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "hover:border-amber-300",
    },
  ];

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTransactionType = (type) => {
    if (type.startsWith("IN_") || type === "OPENING_BALANCE") {
      return {
        label: "Barang Masuk",
        className: "bg-emerald-50 text-emerald-700",
      };
    }

    if (type.startsWith("OUT_")) {
      return {
        label: "Barang Keluar",
        className: "bg-rose-50 text-rose-700",
      };
    }

    return {
      label: "Penyesuaian",
      className: "bg-amber-50 text-amber-700",
    };
  };

  const getTotalQuantity = (items = []) => {
    return items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  };
return (
 <main className="page-enter min-h-screen bg-transparent px-4 py-6 md:px-6 md:py-8">
    <div className="mx-auto max-w-[1200px]">
        <Navbar />

        {/* PAGE HEADER */}
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#142D50]">
              Transaksi Persediaan
            </h1>

            <p className="mt-1 text-sm text-[#718096]">
              Kelola seluruh aktivitas pergerakan stok barang.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#D5E7F7] bg-white px-4 py-2.5 shadow-sm">
            <CalendarDays size={16} className="text-[#2463A6]" />

            <span className="text-xs font-medium text-[#52647D]">
              Periode: {monthName}
            </span>
          </div>
        </div>

        {/* QUICK ACTIONS */}
        <section className="mb-7">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#142D50]">Aksi Transaksi</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {quickActions.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  onClick={() => {
                    if (action.title === "Barang Masuk") {
                      setShowIncomingModal(true);
                    }

                    if (action.title === "Barang Keluar") {
                      setShowOutgoingModal(true);
                    }

                    if (action.title === "Penyesuaian Stok") {
                      setShowAdjustmentModal(true);
                    }
                  }}
                  key={action.title}
                  type="button"
                  className={`group flex items-center gap-4 rounded-2xl border border-[#DCEAF5] bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${action.border}`}
                >
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${action.bg} ${action.color}`}
                  >
                    <Icon size={22} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-[#142D50]">
                      {action.title}
                    </h3>

                    <p className="mt-1 text-xs text-[#94A0AF]">
                      {action.description}
                    </p>
                  </div>

                  <Plus
                    size={18}
                    className="text-[#94A0AF] transition group-hover:text-[#2463A6]"
                  />
                </button>
              );
            })}
          </div>
        </section>

        {/* SUMMARY */}
        <section className="mb-7">
          <h2 className="mb-3 text-sm font-bold text-[#142D50]">
            Ringkasan Transaksi
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {summaryCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-[#DCEAF5] bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-medium text-[#718096]">
                        {card.title}
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-[#142D50]">
                        {loading ? "..." : card.count}
                      </h3>

                      <p className="mt-1 text-[11px] text-[#94A0AF]">
                        {card.description}
                      </p>
                    </div>

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} ${card.color}`}
                    >
                      <Icon size={20} />
                    </div>
                  </div>

                  <div className="mt-5 border-t border-[#EDF2F7] pt-3">
                    <div className="flex items-center gap-2">
                      <Package size={14} className={card.color} />

                      <span className="text-xs text-[#64748B]">
                        {loading
                          ? "Memuat..."
                         : `${Number(card.quantity).toLocaleString("id-ID")} ${card.quantityLabel}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* TRANSACTION HISTORY */}
        <section className="rounded-2xl border border-[#DCEAF5] bg-white p-6 shadow-sm">
          {/* HEADER */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-[#142D50]">
                Riwayat Transaksi
              </h2>

              <p className="mt-1 text-xs text-[#94A0AF]">
                Daftar seluruh aktivitas pergerakan stok barang.
              </p>
            </div>

            <button
              onClick={() => {
                fetchTransactions();
                fetchSummary();
              }}
              className="flex items-center gap-2 rounded-lg border border-[#DCEAF5] px-3 py-2 text-xs font-medium text-[#52647D] hover:bg-[#F4F8FC]"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          {/* FILTERS */}
          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A0AF]"
              />

              <input
                type="text"
                placeholder="Cari kode atau nama barang..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-[#DCEAF5] py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#75B9E7]"
              />
            </div>

            <div className="relative">
              <Filter
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A0AF]"
              />

              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none rounded-xl border border-[#DCEAF5] bg-white py-2.5 pl-9 pr-3 text-xs text-[#52647D] outline-none focus:border-[#75B9E7]"
              >
                <option value="">Semua Jenis Transaksi</option>
                <option value="IN">Barang Masuk</option>
                <option value="OUT">Barang Keluar</option>
                <option value="ADJUSTMENT">Penyesuaian Stok</option>
              </select>
            </div>

            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-[#DCEAF5] px-3 py-2.5 text-xs text-[#52647D] outline-none focus:border-[#75B9E7]"
              title="Tanggal mulai"
            />

            <input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-[#DCEAF5] px-3 py-2.5 text-xs text-[#52647D] outline-none focus:border-[#75B9E7]"
              title="Tanggal akhir"
            />
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="border-y border-[#EDF2F7] bg-[#F8FAFC]">
                  {[
                    "Kode Transaksi",
                    "Tanggal",
                    "Jenis",
                    "Barang",
                    "Jumlah",
                    "Dicatat Oleh",
                    "Aksi",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-[10px] font-semibold uppercase tracking-wide text-[#94A0AF]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {tableLoading ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-12 text-center text-xs text-[#94A0AF]"
                    >
                      Memuat riwayat transaksi...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td
                      colSpan="7"
                      className="py-12 text-center text-xs text-[#94A0AF]"
                    >
                      Tidak ada transaksi ditemukan.
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => {
                    const transactionType = getTransactionType(
                      transaction.transaction_type,
                    );

                    const isIncoming =
                      transaction.transaction_type.startsWith("IN_") ||
                      transaction.transaction_type === "OPENING_BALANCE";

                    const isAdjustmentIn =
                      transaction.transaction_type === "ADJUSTMENT_IN";

                    const isAdjustmentOut =
                      transaction.transaction_type === "ADJUSTMENT_OUT";

                    const quantity = getTotalQuantity(transaction.items);

                    return (
                      <tr
                        key={transaction.id}
                        className="border-b border-[#EDF2F7] transition hover:bg-[#F8FBFE]"
                      >
                        <td className="px-4 py-4">
                          <p className="text-[11px] font-bold text-[#2463A6]">
                            {transaction.transaction_code}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-xs text-[#64748B]">
                          {formatDate(transaction.transaction_date)}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${transactionType.className}`}
                          >
                            {transactionType.label}
                          </span>
                        </td>

                        <td className="px-4 py-4">
                          <p className="max-w-[180px] truncate text-xs font-medium text-[#142D50]">
                            {transaction.items?.[0]?.item_name || "-"}
                          </p>

                          {transaction.items?.length > 1 && (
                            <p className="mt-1 text-[10px] text-[#94A0AF]">
                              +{transaction.items.length - 1} barang lainnya
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`text-xs font-bold ${
                              isIncoming || isAdjustmentIn
                                ? "text-emerald-600"
                                : isAdjustmentOut ||
                                    transaction.transaction_type.startsWith(
                                      "OUT_",
                                    )
                                  ? "text-rose-600"
                                  : "text-amber-600"
                            }`}
                          >
                            {transaction.transaction_type === "ADJUSTMENT_IN"
                              ? "+"
                              : transaction.transaction_type ===
                                  "ADJUSTMENT_OUT"
                                ? "-"
                                : transaction.transaction_type.startsWith(
                                      "IN_",
                                    ) ||
                                    transaction.transaction_type ===
                                      "OPENING_BALANCE"
                                  ? "+"
                                  : "-"}
                            {Number(quantity).toLocaleString("id-ID")}
                          </span>

                          <span className="ml-1 text-[10px] text-[#94A0AF]">
                            unit
                          </span>
                        </td>

                        <td className="px-4 py-4 text-xs text-[#64748B]">
                          {transaction.recorded_by || "-"}
                        </td>

                        <td className="px-4 py-4">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedTransactionId(transaction.id)
                            }
                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-[10px] font-semibold text-[#2463A6] hover:bg-[#EAF5FC]"
                          >
                            <Eye size={13} />
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#EDF2F7] pt-4">
            <p className="text-[11px] text-[#94A0AF]">
              Total {pagination.totalItems} transaksi
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => page - 1)}
                className="rounded-lg border border-[#DCEAF5] p-2 text-[#52647D] hover:bg-[#F4F8FC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>

              <span className="text-xs font-medium text-[#52647D]">
                Halaman {pagination.totalPages === 0 ? 0 : currentPage} dari{" "}
                {pagination.totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= pagination.totalPages}
                onClick={() => setCurrentPage((page) => page + 1)}
                className="rounded-lg border border-[#DCEAF5] p-2 text-[#52647D] hover:bg-[#F4F8FC] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </section>
        {/* MODAL BARANG MASUK */}
        {showIncomingModal && (
          <IncomingTransactionModal
            onClose={() => setShowIncomingModal(false)}
            onSuccess={async () => {
              await fetchTransactions();
              await fetchSummary();
            }}
          />
        )}
        {/* MODAL BARANG KELUAR */}
        {showOutgoingModal && (
          <OutgoingTransactionModal
            onClose={() => setShowOutgoingModal(false)}
            onSuccess={async () => {
              await fetchTransactions();
              await fetchSummary();
            }}
          />
        )}
        {/* MODAL PENYESUAIAN STOK */}
        {showAdjustmentModal && (
          <AdjustmentTransactionModal
            onClose={() => setShowAdjustmentModal(false)}
            onSuccess={async () => {
              await fetchTransactions();
              await fetchSummary();
            }}
          />
        )}
        {/* MODAL DETAIL TRANSAKSI */}
        {selectedTransactionId && (
          <TransactionDetailModal
            transactionId={selectedTransactionId}
            onClose={() => setSelectedTransactionId(null)}
          />
        )}
      </div>
    </main>
  );
}

export default TransactionsPage;
