import { useEffect, useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import itemService from "../../services/itemService";
import transactionService from "../../services/transactionService";

const AdjustmentTransactionModal = ({ onClose, onSuccess }) => {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const [form, setForm] = useState({
    item_id: "",
    physical_stock: "",
    reason: "",
    transaction_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoadingItems(true);

        const response = await itemService.getItems({
          limit: 1000,
          status: "active",
        });

        setItems(
          (response.data || []).filter((item) => item.is_active)
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Gagal mengambil daftar barang."
        );
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, []);

  const handleClose = () => {
    if (submitting || isClosing) return;

    setIsClosing(true);

    setTimeout(() => {
      onClose();
    }, 180);
  };

  const selectedItem = items.find(
    (item) => String(item.id) === String(form.item_id)
  );

  const systemStock = selectedItem
    ? Number(selectedItem.current_stock)
    : 0;

  const physicalStock =
    form.physical_stock === ""
      ? null
      : Number(form.physical_stock);

  const difference =
    physicalStock === null
      ? null
      : physicalStock - systemStock;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isClosing) return;

    if (!form.item_id) {
      setError("Silakan pilih barang terlebih dahulu.");
      return;
    }

    if (
      form.physical_stock === "" ||
      !Number.isFinite(Number(form.physical_stock)) ||
      Number(form.physical_stock) < 0
    ) {
      setError("Stok fisik tidak boleh kosong atau negatif.");
      return;
    }

    if (!form.reason.trim()) {
      setError("Alasan penyesuaian stok wajib diisi.");
      return;
    }

    if (!form.transaction_date) {
      setError("Tanggal transaksi wajib diisi.");
      return;
    }

    if (difference === 0) {
      setError(
        "Tidak ada selisih stok. Penyesuaian tidak diperlukan."
      );
      return;
    }

    const payload = {
      item_id: Number(form.item_id),
      physical_stock: Number(form.physical_stock),
      reason: form.reason.trim(),
      transaction_date: form.transaction_date,
      notes: form.notes,
    };

    try {
      setSubmitting(true);

      await transactionService.createAdjustment(payload);
      await onSuccess();

      setIsClosing(true);

      setTimeout(() => {
        onClose();
      }, 180);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Gagal menyimpan penyesuaian stok."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm ${
        isClosing
          ? "modal-backdrop-exit"
          : "modal-backdrop-enter"
      }`}
    >
      <div
        className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl ${
          isClosing
            ? "modal-content-exit"
            : "modal-content-enter"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5">
          <div>
            <h2 className="text-xl font-bold text-[#142D50]">
              Penyesuaian Stok
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sesuaikan stok sistem dengan kondisi fisik gudang.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={submitting || isClosing}
            className="rounded-xl p-2 text-slate-400 transition-all duration-200 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed"
          >
            <X size={21} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 p-7">
          {/* PILIH BARANG */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Pilih Barang
            </label>

            {loadingItems ? (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                Memuat daftar barang...
              </div>
            ) : (
              <select
                name="item_id"
                value={form.item_id}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400"
              >
                <option value="">Pilih barang...</option>

                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* INFORMASI STOK */}
          {selectedItem && (
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-blue-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Stok Sistem
                </p>

                <p className="mt-2 text-2xl font-bold text-[#2463A6]">
                  {systemStock}
                  <span className="ml-1 text-sm font-medium">
                    {selectedItem.unit}
                  </span>
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">
                  Stok Fisik
                </p>

                <input
                  type="number"
                  name="physical_stock"
                  min="0"
                  step="any"
                  value={form.physical_stock}
                  onChange={handleChange}
                  placeholder="Masukkan jumlah"
                  required
                  className="mt-2 w-full border-b border-slate-300 bg-transparent text-2xl font-bold text-[#142D50] outline-none transition-colors focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* SELISIH */}
          {selectedItem && difference !== null && (
            <div
              className={`rounded-2xl border p-4 ${
                difference === 0
                  ? "border-slate-200 bg-slate-50"
                  : difference > 0
                    ? "border-green-200 bg-green-50"
                    : "border-red-200 bg-red-50"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Selisih Stok
              </p>

              <div className="mt-2 flex items-center justify-between">
                <p
                  className={`text-2xl font-bold ${
                    difference > 0
                      ? "text-green-600"
                      : difference < 0
                        ? "text-red-600"
                        : "text-slate-600"
                  }`}
                >
                  {difference > 0 ? "+" : ""}
                  {difference} {selectedItem.unit}
                </p>

                <span className="text-xs font-medium text-slate-500">
                  {difference > 0
                    ? "Penambahan stok"
                    : difference < 0
                      ? "Pengurangan stok"
                      : "Tidak ada perubahan"}
                </span>
              </div>
            </div>
          )}

          {/* ALASAN */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Alasan Penyesuaian
            </label>

            <input
              type="text"
              name="reason"
              value={form.reason}
              onChange={handleChange}
              required
              placeholder="Contoh: Hasil stock opname"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400"
            />
          </div>

          {/* TANGGAL */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Tanggal Penyesuaian
            </label>

            <input
              type="date"
              name="transaction_date"
              value={form.transaction_date}
              onChange={handleChange}
              required
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400"
            />
          </div>

          {/* CATATAN */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Catatan Tambahan
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Catatan tambahan jika diperlukan..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400"
            />
          </div>

          {/* PERINGATAN */}
          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle
              size={20}
              className="shrink-0 text-amber-600"
            />

            <p className="text-xs leading-relaxed text-amber-700">
              Penyesuaian akan langsung mengubah stok inventaris
              sesuai jumlah fisik yang dimasukkan. Transaksi yang
              berhasil disimpan akan tercatat dalam riwayat.
            </p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* FOOTER */}
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting || isClosing}
              className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={
                submitting ||
                loadingItems ||
                items.length === 0 ||
                isClosing
              }
              className="rounded-xl bg-[#2463A6] px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[#142D50] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Menyimpan..."
                : "Simpan Penyesuaian"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustmentTransactionModal;