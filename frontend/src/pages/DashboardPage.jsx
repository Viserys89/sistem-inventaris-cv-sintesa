import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  PackagePlus,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import itemService from "../services/itemService";

import Navbar from "../components/layout/Navbar";
import ItemFormModal from "../components/inventory/ItemFormModal";

import IncomingTransactionModal from "../components/transactions/IncomingTransactionModal";
import OutgoingTransactionModal from "../components/transactions/OutgoingTransactionModal";

// ==========================================
// CONSTANTS & HELPERS
// ==========================================

const formatNumber = (value) =>
  new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatDate = (date) =>
  new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

const formatTime = (date) =>
  new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(date));

const transactionLabels = {
  OPENING_BALANCE: "SALDO AWAL",
  IN_PURCHASE: "MASUK",
  IN_PRODUCTION: "MASUK",
  IN_RETURN: "MASUK",
  ADJUSTMENT_IN: "MASUK",
  OUT_PROJECT: "KELUAR",
  OUT_PRODUCTION: "KELUAR",
  OUT_SALE: "KELUAR",
  OUT_DAMAGED: "KELUAR",
  OUT_LOST: "KELUAR",
  ADJUSTMENT_OUT: "KELUAR",
};

// ==========================================
// STAT CARD
// ==========================================

function StatCard({ title, value, unit, color, subtitle }) {
  return (
    <div className="flex min-h-[88px] flex-col justify-center rounded-[16px] border border-[#D5E7F7] bg-white px-4 py-3 shadow-[0_4px_18px_rgba(20,45,80,0.035)]">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-[#77869A]">
          {title}
        </p>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <h2 className={`text-[27px] font-bold tracking-tight ${color.text}`}>
          {formatNumber(value)}
        </h2>

        <span className="text-xs text-[#9AA7B6]">{unit}</span>
      </div>

      <p className="mt-2 text-[11px] text-[#94A0AF]">{subtitle}</p>
    </div>
  );
}

// ==========================================
// STOCK MOVEMENT CHART
// ==========================================

function StockMovementChart({ data, period, setPeriod }) {
  const periods = [
    { label: "7 Hari", value: "7d" },
    { label: "30 Hari", value: "30d" },
    { label: "1 Tahun", value: "1y" },
  ];

  return (
    <section className="rounded-[18px] border border-[#D5E7F7] bg-white p-5 shadow-[0_4px_20px_rgba(20,45,80,0.04)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-[#142D50]">
            Pergerakan Stok
          </h3>

          <p className="mt-1 text-[11px] text-[#A0AABA]">
            Perbandingan barang masuk dan keluar
          </p>
        </div>

        <div className="flex rounded-lg bg-[#F4F7FA] p-1">
          {periods.map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={`rounded-md px-3 py-1.5 text-[10px] transition ${
                period === item.value
                  ? "bg-white font-semibold text-[#142D50] shadow-sm"
                  : "text-[#7C8999] hover:text-[#142D50]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-5 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="h-[3px] w-5 rounded bg-[#2463A6]" />
          <span className="text-[#66758A]">Barang Masuk</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-[3px] w-5 rounded bg-[#75B9E7]" />
          <span className="text-[#66758A]">Barang Keluar</span>
        </div>
      </div>

      <div className="mt-4 h-[235px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="inGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2463A6" stopOpacity={0.13} />
                <stop offset="95%" stopColor="#2463A6" stopOpacity={0} />
              </linearGradient>

              <linearGradient id="outGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#75B9E7" stopOpacity={0.13} />
                <stop offset="95%" stopColor="#75B9E7" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#EDF1F5"
            />

            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "#98A4B4" }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fontSize: 10, fill: "#98A4B4" }}
              axisLine={false}
              tickLine={false}
              width={28}
            />

            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid #E2EAF2",
                fontSize: 11,
              }}
              formatter={(value, name) => [
                formatNumber(value),
                name === "items_in" ? "Barang Masuk" : "Barang Keluar",
              ]}
            />

            <Area
              type="monotone"
              dataKey="items_in"
              name="items_in"
              stroke="#2463A6"
              strokeWidth={2}
              fill="url(#inGradient)"
              activeDot={{ r: 4 }}
            />

            <Area
              type="monotone"
              dataKey="items_out"
              name="items_out"
              stroke="#75B9E7"
              strokeWidth={2}
              fill="url(#outGradient)"
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

// ==========================================
// LOW STOCK
// ==========================================

function LowStockCard({ items, total, onViewAll }) {
  return (
    <section className="flex flex-col rounded-[18px] border border-[#D5E7F7] bg-white p-5 shadow-[0_4px_20px_rgba(20,45,80,0.04)]">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-[#142D50]">
          Stok Menipis
        </h3>

        <span className="rounded bg-[#FFF0DA] px-2 py-1 text-[9px] font-bold text-[#F07819]">
          {formatNumber(total)} TOTAL
        </span>
      </div>

      <div className="mt-5 flex-1 space-y-5">
        {items.length === 0 ? (
          <p className="py-8 text-center text-xs text-[#98A4B4]">
            Tidak ada stok yang menipis.
          </p>
        ) : (
          items.map((item) => {
            const percentage = Math.min(
              Number(item.stock_percentage) || 0,
              100,
            );

            const critical = percentage <= 25;

            return (
              <div key={item.id}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold text-[#19385F]">
                    {item.name}
                  </p>

                  <span
                    className={`shrink-0 text-[10px] font-bold ${
                      critical ? "text-red-500" : "text-orange-500"
                    }`}
                  >
                    {formatNumber(item.current_stock)} {item.unit}
                  </span>
                </div>

                <p className="mt-1 text-[9px] text-[#A0AABA]">
                  SKU-{item.code}
                </p>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EFF2F5]">
                  <div
                    className={`h-full rounded-full ${
                      critical ? "bg-red-400" : "bg-orange-400"
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <p className="mt-1 text-[9px] text-[#A0AABA]">
                  Minimum: {formatNumber(item.min_stock)} {item.unit}
                </p>
              </div>
            );
          })
        )}
      </div>

      <button
        onClick={onViewAll}
        className="mt-5 flex items-center justify-center gap-1 border-t border-[#F0F3F7] pt-4 text-center text-[10px] font-semibold text-[#2463A6] transition hover:text-[#142D50]"
      >
        Lihat Semua Peringatan
        <ChevronRight size={13} />
      </button>
    </section>
  );
}

// ==========================================
// QUICK ACTIONS
// ==========================================

function QuickActions({ onIncoming, onOutgoing, onAddItem }) {
  const actions = [
    {
      label: "Barang Masuk",
      icon: ArrowDownToLine,
      onClick: onIncoming,
      style: "bg-[#142D50] text-white hover:bg-[#1D416D]",
    },
    {
      label: "Barang Keluar",
      icon: ArrowUpFromLine,
      onClick: onOutgoing,
      style:
        "border border-[#D5E7F7] bg-white text-[#142D50] hover:bg-[#F5F9FD]",
    },
    {
      label: "Tambah Barang",
      icon: PackagePlus,
      onClick: onAddItem,
      style: "bg-[#EAF5FC] text-[#2463A6] hover:bg-[#DDEFFA]",
    },
  ];

  return (
    <section className="rounded-[18px] border border-[#D5E7F7] bg-white p-5 shadow-[0_4px_20px_rgba(20,45,80,0.04)]">
      <h3 className="text-sm font-bold text-[#142D50]">
        Aksi Cepat
      </h3>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;

          return (
            <button
              key={action.label}
              onClick={action.onClick}
              className={`flex items-center justify-center gap-2 rounded-lg px-3 py-3 text-[11px] font-semibold transition-all duration-200 ease-out hover:-translate-y-0.5 ${action.style}`}
            >
              <Icon size={15} />
              {action.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ==========================================
// RECENT TRANSACTIONS
// ==========================================

function RecentTransactions({ transactions, onViewAll }) {
  return (
    <section className="overflow-hidden rounded-[18px] border border-[#D5E7F7] bg-white p-5 shadow-[0_4px_20px_rgba(20,45,80,0.04)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[#142D50]">
          Transaksi Stok Terbaru
        </h3>

        <button
          onClick={onViewAll}
          className="flex items-center gap-1 text-[10px] font-semibold text-[#2463A6] transition hover:text-[#142D50]"
        >
          Lihat Seluruh Riwayat
          <ChevronRight size={13} />
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b border-[#EDF1F5] text-[9px] font-semibold uppercase tracking-wider text-[#98A4B4]">
              <th className="pb-4 pr-4">Waktu</th>
              <th className="pb-4 pr-4">ID Transaksi</th>
              <th className="pb-4 pr-4">Nama Barang</th>
              <th className="pb-4 pr-4">Tipe</th>
              <th className="pb-4 pr-4">Jumlah</th>
              <th className="pb-4">Pengguna</th>
            </tr>
          </thead>

          <tbody>
            {transactions.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="py-10 text-center text-xs text-[#98A4B4]"
                >
                  Belum ada transaksi.
                </td>
              </tr>
            ) : (
              transactions.map((item) => {
                const inbound =
                  transactionLabels[item.transaction_type]?.includes("MASUK");

                return (
                  <tr
                    key={`${item.id}-${item.item_id}`}
                    className="border-b border-[#F1F4F7] last:border-0 hover:bg-[#FAFCFE]"
                  >
                    <td className="py-4 pr-4">
                      <p className="text-[11px] font-semibold text-[#19385F]">
                        {formatTime(item.transaction_date)}
                      </p>

                      <p className="mt-1 text-[9px] text-[#A0AABA]">
                        {new Date(item.transaction_date).toLocaleDateString(
                          "id-ID",
                        )}
                      </p>
                    </td>

                    <td className="py-4 pr-4 text-[10px] text-[#758399]">
                      #{item.transaction_code}
                    </td>

                    <td className="py-4 pr-4">
                      <p className="text-[11px] font-semibold text-[#19385F]">
                        {item.item_name}
                      </p>

                      <p className="mt-1 text-[9px] text-[#A0AABA]">
                        SKU-{item.item_code}
                      </p>
                    </td>

                    <td className="py-4 pr-4">
                      <span
                        className={`rounded-full px-2 py-1 text-[9px] font-bold ${
                          inbound
                            ? "bg-[#E7FAF2] text-[#0DAD79]"
                            : "bg-[#EAF5FC] text-[#64A9DF]"
                        }`}
                      >
                        {transactionLabels[item.transaction_type] ||
                          item.transaction_type}
                      </span>
                    </td>

                    <td className="py-4 pr-4 text-[11px] font-bold text-[#19385F]">
                      {Number(item.signed_quantity) > 0 ? "+" : ""}
                      {formatNumber(item.signed_quantity)} {item.unit}
                    </td>

                    <td className="py-4 text-[10px] text-[#758399]">
                      {item.user_name}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ==========================================
// MAIN DASHBOARD PAGE
// ==========================================

function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [lowStockTotal, setLowStockTotal] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const [period, setPeriod] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // MODAL STATES
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [showOutgoingModal, setShowOutgoingModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);

  const [categories, setCategories] = useState([]);

  // ==========================================
  // FETCH DASHBOARD DATA
  // ==========================================

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [
        summaryResponse,
        stockResponse,
        lowStockResponse,
        transactionResponse,
      ] = await Promise.all([
        api.get("/dashboard/summary"),
        api.get("/dashboard/stock-movement", {
          params: { period },
        }),
        api.get("/dashboard/low-stock"),
        api.get("/dashboard/recent-transactions", {
          params: { limit: 5 },
        }),
      ]);

      setSummary(summaryResponse.data.data);

      setChartData(
        stockResponse.data.data.map((item) => ({
          ...item,
          items_in: Number(item.items_in),
          items_out: Number(item.items_out),
        })),
      );

      setLowStock(lowStockResponse.data.data);
      setLowStockTotal(lowStockResponse.data.total);

      setTransactions(transactionResponse.data.data);
    } catch (err) {
      console.error("Dashboard fetch error:", err);

      setError(
        err.response?.data?.message || "Gagal mengambil data dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }, [period]);

  // ==========================================
  // CHANGE CHART PERIOD
  // ==========================================

  const changePeriod = (newPeriod) => {
    setPeriod(newPeriod);
  };

  // ==========================================
  // REFRESH DASHBOARD
  // ==========================================

  const refreshDashboard = () => {
    fetchDashboard();
  };

  // ==========================================
  // QUICK ACTION: BARANG MASUK
  // ==========================================

  const handleIncoming = () => {
    setShowIncomingModal(true);
  };

  // ==========================================
  // QUICK ACTION: BARANG KELUAR
  // ==========================================

  const handleOutgoing = () => {
    setShowOutgoingModal(true);
  };

  // ==========================================
  // QUICK ACTION: TAMBAH BARANG
  // ==========================================

  const handleAddItem = async () => {
    try {
      setError("");

      const response = await itemService.getCategories();

      setCategories(response.data || []);
      setShowItemModal(true);
    } catch (err) {
      console.error("Gagal mengambil kategori:", err);

      setError(
        err.response?.data?.message ||
          "Gagal mengambil kategori barang.",
      );
    }
  };

  // ==========================================
  // NAVIGASI RIWAYAT TRANSAKSI
  // ==========================================

  const handleViewTransactions = () => {
    navigate("/transactions");
  };

  // ==========================================
  // NAVIGASI PERINGATAN STOK
  // ==========================================

  const handleViewLowStock = () => {
    navigate("/inventory?status=stok_rendah");
  };

  // ==========================================
  // LOAD DASHBOARD
  // ==========================================

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDashboard();
  }, [fetchDashboard]);

  return (
    <>
      <main className="page-enter min-h-screen bg-transparent px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-[1200px]">
          {/* NAVBAR */}
          <Navbar />

          {/* PAGE HEADER */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-[#142D50] md:text-2xl">
                Selamat Datang, {user?.name?.split(" ")[0] || "Pengguna"}
              </h1>

              <p className="mt-1 text-xs text-[#7C8999]">
                Ringkasan persediaan gudang hari ini dan pergerakan stok
                terbaru.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={refreshDashboard}
                disabled={loading}
                title="Refresh dashboard"
                className="rounded-lg border border-[#D5E7F7] bg-white p-2 text-[#2463A6] transition hover:bg-[#F0F6FC] disabled:opacity-50"
              >
                <RefreshCw
                  size={15}
                  className={loading ? "animate-spin" : ""}
                />
              </button>

              <div className="rounded-lg bg-white px-4 py-2 text-[10px] font-semibold text-[#19385F] shadow-sm">
                {formatDate(new Date())}
              </div>
            </div>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
              <AlertTriangle size={18} />

              <span>{error}</span>

              <button
                onClick={refreshDashboard}
                className="ml-auto font-semibold"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* DASHBOARD GRID */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            {/* STATISTICS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-1">
              <StatCard
                title="Total Barang"
                value={summary?.total_items ?? 0}
                unit="item"
                icon={Boxes}
                color={{
                  bg: "bg-[#EAF5FC]",
                  icon: "text-[#2463A6]",
                  text: "text-[#19385F]",
                }}
                subtitle="Total barang aktif"
              />

              <StatCard
                title="Stok Minimum"
                value={summary?.low_stock ?? 0}
                unit="item"
                icon={AlertTriangle}
                color={{
                  bg: "bg-[#FFF1E7]",
                  icon: "text-[#F07819]",
                  text: "text-[#F07819]",
                }}
                subtitle="Perlu perhatian segera"
              />

              <StatCard
                title="Barang Masuk"
                value={summary?.items_in ?? 0}
                unit="unit"
                icon={ArrowDownToLine}
                color={{
                  bg: "bg-[#EAF5FC]",
                  icon: "text-[#2463A6]",
                  text: "text-[#2463A6]",
                }}
                subtitle="Bulan ini"
              />

              <StatCard
                title="Barang Keluar"
                value={summary?.items_out ?? 0}
                unit="unit"
                icon={ArrowUpFromLine}
                color={{
                  bg: "bg-[#EAF5FC]",
                  icon: "text-[#75B9E7]",
                  text: "text-[#75B9E7]",
                }}
                subtitle="Bulan ini"
              />
            </div>

            {/* CENTER CONTENT: CHART + QUICK ACTIONS */}
            <div className="flex flex-col gap-4 xl:col-span-6">
              <StockMovementChart
                data={chartData}
                period={period}
                setPeriod={changePeriod}
              />

              <QuickActions
                onIncoming={handleIncoming}
                onOutgoing={handleOutgoing}
                onAddItem={handleAddItem}
              />
            </div>

            {/* LOW STOCK */}
            <div className="xl:col-span-3">
              <LowStockCard
                items={lowStock}
                total={lowStockTotal}
                onViewAll={handleViewLowStock}
              />
            </div>

            {/* RECENT TRANSACTIONS */}
            <div className="xl:col-span-12">
              <RecentTransactions
                transactions={transactions}
                onViewAll={handleViewTransactions}
              />
            </div>
          </div>

          {/* FOOTER */}
          <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[#A0AABA]">
            <p>© {new Date().getFullYear()} CV Sintesa Mandiri Karya</p>
            <p>Inventory Management System</p>
          </footer>
        </div>
      </main>

      {/* =====================================
          MODAL BARANG MASUK
      ===================================== */}

      {showIncomingModal && (
        <IncomingTransactionModal
          onClose={() => setShowIncomingModal(false)}
          onSuccess={fetchDashboard}
        />
      )}

      {/* =====================================
          MODAL BARANG KELUAR
      ===================================== */}

      {showOutgoingModal && (
        <OutgoingTransactionModal
          onClose={() => setShowOutgoingModal(false)}
          onSuccess={fetchDashboard}
        />
      )}

      {/* =====================================
          MODAL TAMBAH BARANG
      ===================================== */}

      {showItemModal && (
        <ItemFormModal
          item={null}
          categories={categories}
          onClose={() => setShowItemModal(false)}
          onSuccess={fetchDashboard}
        />
      )}
    </>
  );
}

export default DashboardPage;