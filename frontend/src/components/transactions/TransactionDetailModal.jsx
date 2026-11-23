import { useEffect, useState } from "react";
import {
  X,
  FileText,
  Package,
  LoaderCircle,
} from "lucide-react";
import transactionService from "../../services/transactionService";

const TransactionDetailModal = ({ transactionId, onClose }) => {
  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await transactionService.getTransactionById(transactionId);

        setTransaction(response.data);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Gagal mengambil detail transaksi."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [transactionId]);

  const handleClose = () => {
    if (isClosing) return;

    setIsClosing(true);

    setTimeout(() => {
      onClose();
    }, 180);
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getTypeLabel = (type) => {
    const labels = {
      OPENING_BALANCE: "Saldo Awal",
      IN_PURCHASE: "Pembelian",
      IN_PRODUCTION: "Hasil Produksi",
      IN_RETURN: "Retur Masuk",
      OUT_PROJECT: "Pengeluaran Proyek",
      OUT_PRODUCTION: "Pengeluaran Produksi",
      OUT_SALE: "Penjualan",
      OUT_DAMAGED: "Barang Rusak",
      OUT_LOST: "Barang Hilang",
      ADJUSTMENT_IN: "Penyesuaian Masuk",
      ADJUSTMENT_OUT: "Penyesuaian Keluar",
    };

    return labels[type] || type || "-";
  };

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("id-ID");
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm ${
        isClosing
          ? "modal-backdrop-exit"
          : "modal-backdrop-enter"
      }`}
    >
      <div
        className={`max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl ${
          isClosing
            ? "modal-content-exit"
            : "modal-content-enter"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#142D50]">
              Detail Transaksi
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Informasi lengkap aktivitas transaksi inventaris.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isClosing}
            className="rounded-xl p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
          >
            <X size={21} />
          </button>
        </div>

        <div className="p-7">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <LoaderCircle
                size={32}
                className="animate-spin text-blue-600"
              />
              <p className="mt-3 text-sm text-slate-500">
                Memuat detail transaksi...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 p-5 text-sm text-red-600">
              {error}
            </div>
          ) : transaction ? (
            <div className="space-y-6">
              {/* INFORMASI UTAMA */}
              <div className="rounded-2xl bg-blue-50 p-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-white p-3 text-blue-600">
                    <FileText size={22} />
                  </div>

                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Kode Transaksi
                    </p>
                    <h3 className="mt-1 font-bold text-[#142D50]">
                      {transaction.transaction_code}
                    </h3>
                  </div>
                </div>
              </div>

              {/* INFORMASI TRANSAKSI */}
              <div>
                <h3 className="mb-4 font-bold text-[#142D50]">
                  Informasi Transaksi
                </h3>

                <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 p-5 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-400">
                      Jenis Transaksi
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {getTypeLabel(transaction.transaction_type)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Tanggal Transaksi
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {formatDate(transaction.transaction_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Dicatat Oleh
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {transaction.recorded_by ||
                        transaction.username ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Supplier
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {transaction.supplier_name || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Referensi
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {transaction.reference || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-400">
                      Proyek
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {transaction.project_name || "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* DETAIL BARANG */}
              <div>
                <h3 className="mb-4 font-bold text-[#142D50]">
                  Detail Barang
                </h3>

                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-2 bg-slate-50 px-5 py-4">
                    <Package
                      size={18}
                      className="text-blue-600"
                    />
                    <span className="text-sm font-semibold text-slate-700">
                      Daftar Barang Transaksi
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-slate-100 text-xs text-slate-400">
                        <tr>
                          <th className="px-5 py-3">Barang</th>
                          <th className="px-5 py-3">Jumlah</th>
                          <th className="px-5 py-3">Harga Satuan</th>
                          <th className="px-5 py-3">Subtotal</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {(transaction.items || []).map(
                          (item, index) => (
                            <tr key={item.id || index}>
                              <td className="px-5 py-4">
                                <p className="font-semibold text-slate-700">
                                  {item.item_name || item.name}
                                </p>
                                <p className="mt-1 text-xs text-slate-400">
                                  {item.item_code || item.code || "-"}
                                </p>
                              </td>

                              <td className="px-5 py-4 text-slate-600">
                                {formatNumber(item.quantity)}{" "}
                                {item.unit || ""}
                              </td>

                              <td className="px-5 py-4 text-slate-600">
                                {item.unit_price == null
                                  ? "-"
                                  : `Rp ${formatNumber(item.unit_price)}`}
                              </td>

                              <td className="px-5 py-4 font-semibold text-slate-700">
                                {item.subtotal == null
                                  ? "-"
                                  : `Rp ${formatNumber(item.subtotal)}`}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {(!transaction.items ||
                    transaction.items.length === 0) && (
                    <p className="p-5 text-center text-sm text-slate-400">
                      Tidak ada detail barang.
                    </p>
                  )}
                </div>
              </div>

              {/* PENYESUAIAN STOK */}
              {transaction.adjustment && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h3 className="font-bold text-amber-800">
                    Informasi Penyesuaian Stok
                  </h3>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div>
                      <p className="text-xs text-amber-700">
                        Stok Sistem
                      </p>
                      <p className="mt-1 font-bold text-amber-900">
                        {formatNumber(
                          transaction.adjustment.system_stock
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-amber-700">
                        Stok Fisik
                      </p>
                      <p className="mt-1 font-bold text-amber-900">
                        {formatNumber(
                          transaction.adjustment.physical_stock
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-amber-700">
                        Selisih
                      </p>
                      <p className="mt-1 font-bold text-amber-900">
                        {formatNumber(
                          transaction.adjustment.difference
                        )}
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-xs text-amber-700">
                    Alasan: {transaction.adjustment.reason || "-"}
                  </p>
                </div>
              )}

              {/* CATATAN */}
              <div className="rounded-2xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Catatan
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {transaction.notes || "Tidak ada catatan."}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* FOOTER */}
        <div className="flex justify-end border-t border-slate-100 px-7 py-5">
          <button
            type="button"
            onClick={handleClose}
            disabled={isClosing}
            className="rounded-xl bg-[#2463A6] px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-[#142D50] disabled:cursor-not-allowed"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetailModal;