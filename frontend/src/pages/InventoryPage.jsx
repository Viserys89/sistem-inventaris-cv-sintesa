import { useCallback, useEffect, useState } from "react";
import { Search, Plus, RefreshCw, Pencil, Ban, RotateCcw } from "lucide-react";

import ItemFormModal from "../components/inventory/ItemFormModal";
import itemService from "../services/itemService";
import Navbar from "../components/layout/Navbar";
import { useSearchParams } from "react-router-dom";

function InventoryPage() {
  const [summary, setSummary] = useState({
    total_items: 0,
    total_stock: 0,
    low_stock: 0,
  });

  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(() => searchParams.get("status") || "");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  // =====================================
  // MENGAMBIL RINGKASAN INVENTARIS
  // =====================================

  const fetchSummary = async () => {
    try {
      const response = await itemService.getSummary();
      setSummary(response.data);
    } catch (error) {
      console.error("Gagal mengambil ringkasan:", error);
    }
  };

  // =====================================
  // MENGAMBIL KATEGORI
  // =====================================

  const fetchCategories = async () => {
    try {
      const response = await itemService.getCategories();
      setCategories(response.data);
    } catch (error) {
      console.error("Gagal mengambil kategori:", error);
    }
  };

  // =====================================
  // MENGAMBIL DATA BARANG
  // =====================================

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await itemService.getItems({
        search,
        category,
        status,
        page,
        limit: 6,
      });

      setItems(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Gagal mengambil barang:", error);

      setError(error.response?.data?.message || "Gagal mengambil data barang.");
    } finally {
      setLoading(false);
    }
  }, [search, category, status, page]);

  // =====================================
  // LOAD DATA AWAL
  // =====================================

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSummary();
    fetchCategories();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
  }, [fetchItems]);

  // =====================================
  // REFRESH
  // =====================================

  const handleRefresh = () => {
    fetchSummary();
    fetchCategories();
    fetchItems();
  };
  // =====================================
  // TAMBAH BARANG
  // =====================================

  const handleAddItem = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  // =====================================
  // EDIT BARANG
  // =====================================

  const handleEditItem = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  // =====================================
  // NONAKTIFKAN / AKTIFKAN BARANG
  // =====================================

  const handleToggleStatus = async (item) => {
    const nextStatus = !item.is_active;

    const confirmation = window.confirm(
      nextStatus
        ? `Aktifkan kembali barang "${item.name}"?`
        : `Nonaktifkan barang "${item.name}"?`,
    );

    if (!confirmation) return;

    setActionLoading(item.id);

    try {
      await itemService.updateStatus(item.id, nextStatus);

      await fetchItems();
      await fetchSummary();
    } catch (error) {
      alert(error.response?.data?.message || "Gagal mengubah status barang.");
    } finally {
      setActionLoading(null);
    }
  };

  // =====================================
  // SETELAH FORM BERHASIL DISIMPAN
  // =====================================

  const handleFormSuccess = async () => {
    await fetchSummary();
    await fetchItems();
  };
  // =====================================
  // RENDER
  // =====================================

  return (
    <main className="page-enter min-h-screen bg-transparent px-4 py-6 md:px-6 md:py-8">
      <div className="mx-auto max-w-[1200px]">
        {/* NAVBAR */}
        <Navbar />
        {/* PAGE HEADER */}
        <div className="mb-5">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#142D50]">
            Data Barang
          </h1>

          <p className="mt-1 text-[11px] text-[#8290A5]">
            Kelola seluruh data barang persediaan gudang, pantau stok, dan atur
            ketersediaan material.
          </p>
        </div>

        {/* SUMMARY */}
        <section className="mb-5 grid grid-cols-1 gap-3 rounded-[15px] border border-[#D5E7F7] bg-white px-5 py-4 shadow-[0_4px_18px_rgba(20,45,80,0.035)] sm:grid-cols-3">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#8290A5]">
              Jenis Barang
            </p>

            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[23px] font-bold text-[#142D50]">
                {summary.total_items}
              </span>

              <span className="text-[10px] text-[#9AA7B8]">jenis</span>
            </div>
          </div>

          <div className="border-[#E5EDF5] sm:border-x sm:px-5">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#8290A5]">
              Total Stok
            </p>

            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-[23px] font-bold text-[#142D50]">
                {Number(summary.total_stock).toLocaleString("id-ID")}
              </span>

              <span className="text-[10px] text-[#9AA7B8]">unit</span>
            </div>
          </div>

          <div>
            <p className="text-[9px] font-semibold uppercase tracking-wide text-[#8290A5]">
              Stok Menipis
            </p>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[23px] font-bold text-[#F07819]">
                {summary.low_stock}
              </span>

              <span className="text-[9px] text-[#F07819]">
                item · Perlu restock segera
              </span>
            </div>
          </div>
        </section>

        {/* INVENTORY TABLE CONTAINER */}
        <section className="overflow-hidden rounded-[15px] border border-[#D5E7F7] bg-white shadow-[0_4px_18px_rgba(20,45,80,0.035)]">
          {/* TOOLBAR */}
          <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              {/* SEARCH */}
              <div className="relative flex-1 sm:max-w-[250px]">
                <Search
                  size={13}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#91A0B4]"
                />

                <input
                  type="text"
                  placeholder="Cari kode atau nama barang..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  className="h-[34px] w-full rounded-[9px] border border-[#D5E7F7] bg-white pl-9 pr-3 text-[10px] text-[#142D50] outline-none transition focus:border-[#75B9E7]"
                />
              </div>

              {/* CATEGORY FILTER */}
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value);
                  setPage(1);
                }}
                className="h-[34px] rounded-[9px] border border-[#D5E7F7] bg-white px-3 text-[10px] text-[#142D50] outline-none focus:border-[#75B9E7]"
              >
                <option value="">Semua Kategori</option>

                {categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.category_name}
                  </option>
                ))}
              </select>

              {/* STATUS FILTER */}
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
                className="h-[34px] rounded-[9px] border border-[#D5E7F7] bg-white px-3 text-[10px] text-[#142D50] outline-none focus:border-[#75B9E7]"
              >
                <option value="">Semua Status</option>
                <option value="stok_rendah">Semua Stok Menipis</option>
                <option value="tersedia">Tersedia</option>
                <option value="hampir_habis">Hampir Habis</option>
                <option value="habis">Habis</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            {/* ACTION BUTTONS */}
            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-2">
              {/* REFRESH */}
              <button
                onClick={handleRefresh}
                title="Refresh data"
                className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#D5E7F7] text-[#2463A6] transition hover:bg-[#EAF5FC]"
              >
                <RefreshCw size={14} />
              </button>

              {/* TAMBAH BARANG */}
              <button
                onClick={handleAddItem}
                className="flex h-[34px] items-center gap-2 rounded-[9px] bg-[#142D50] px-4 text-[10px] font-medium text-white transition hover:bg-[#1C3C66]"
              >
                <Plus size={13} />
                Tambah Barang
              </button>
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead>
                <tr className="border-b border-[#E7EDF4] text-[8px] font-semibold uppercase tracking-wide text-[#8290A5]">
                  <th className="px-4 py-3">Kode Barang</th>
                  <th className="px-4 py-3">Nama Barang</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Satuan</th>
                  <th className="px-4 py-3 text-center">Stok Saat Ini</th>
                  <th className="px-4 py-3 text-center">Stok Minimum</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="py-12 text-center text-[11px] text-[#91A0B4]"
                    >
                      Memuat data barang...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="py-12 text-center text-[11px] text-red-500"
                    >
                      {error}
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan="8"
                      className="py-12 text-center text-[11px] text-[#91A0B4]"
                    >
                      Belum ada data barang.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#EDF1F6] text-[10px] text-[#253B59] transition hover:bg-[#F8FBFE]"
                    >
                      <td className="whitespace-nowrap px-4 py-3">
                        {item.code}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-medium">
                        {item.name}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {item.category_name}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3">
                        {item.unit}
                      </td>

                      <td
                        className={`px-4 py-3 text-center font-semibold ${
                          Number(item.current_stock) === 0
                            ? "text-red-500"
                            : Number(item.current_stock) <=
                                Number(item.min_stock)
                              ? "text-orange-500"
                              : "text-[#253B59]"
                        }`}
                      >
                        {Number(item.current_stock).toLocaleString("id-ID")}
                      </td>

                      <td className="px-4 py-3 text-center text-[#91A0B4]">
                        {Number(item.min_stock).toLocaleString("id-ID")}
                      </td>

                      <td className="px-4 py-3">
                        <StockBadge status={item.stock_status} />
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => handleEditItem(item)}
                            title="Edit barang"
                            className="inline-flex items-center gap-1 text-[#2463A6] transition hover:text-[#142D50]"
                          >
                            <Pencil size={11} />
                            <span className="text-[10px]">Edit</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(item)}
                            disabled={actionLoading === item.id}
                            title={
                              item.is_active
                                ? "Nonaktifkan barang"
                                : "Aktifkan barang"
                            }
                            className={`inline-flex items-center gap-1 transition disabled:opacity-40 ${
                              item.is_active
                                ? "text-[#F04444] hover:text-red-700"
                                : "text-[#00A66A] hover:text-green-700"
                            }`}
                          >
                            {item.is_active ? (
                              <>
                                <Ban size={11} />
                                <span className="text-[10px]">
                                  {actionLoading === item.id
                                    ? "Memproses..."
                                    : "Nonaktifkan"}
                                </span>
                              </>
                            ) : (
                              <>
                                <RotateCcw size={11} />
                                <span className="text-[10px]">
                                  {actionLoading === item.id
                                    ? "Memproses..."
                                    : "Aktifkan"}
                                </span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div className="flex flex-col gap-3 border-t border-[#E7EDF4] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[9px] text-[#91A0B4]">
              Menampilkan {items.length > 0 ? (page - 1) * 6 + 1 : 0}–
              {(page - 1) * 6 + items.length} dari {pagination.totalItems}{" "}
              barang
            </p>

            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((current) => current - 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E5EDF5] text-[10px] text-[#142D50] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ‹
              </button>

              <span className="text-[10px] text-[#142D50]">
                {page} / {Math.max(1, pagination.totalPages)}
              </span>

              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((current) => current + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#E5EDF5] text-[10px] text-[#142D50] disabled:cursor-not-allowed disabled:opacity-30"
              >
                ›
              </button>
            </div>
          </div>
        </section>
      </div>
      {showForm && (
        <ItemFormModal
          item={editingItem}
          categories={categories}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}
    </main>
  );
}

// =====================================
// KOMPONEN BADGE STATUS
// =====================================

function StockBadge({ status }) {
  const styles = {
    tersedia: "bg-[#E9FAF2] text-[#00A66A]",
    hampir_habis: "bg-[#FFF3E8] text-[#F07819]",
    habis: "bg-[#FFF0F0] text-[#F04444]",
    nonaktif: "bg-[#F0F2F5] text-[#7B8794]",
  };

  const labels = {
    tersedia: "TERSEDIA",
    hampir_habis: "HAMPIR HABIS",
    habis: "HABIS",
    nonaktif: "NONAKTIF",
  };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[7px] font-bold ${
        styles[status] || styles.nonaktif
      }`}
    >
      {labels[status] || "NONAKTIF"}
    </span>
  );
}

export default InventoryPage;
