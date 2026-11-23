import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import itemService from "../../services/itemService";
import transactionService from "../../services/transactionService";

const OutgoingTransactionModal = ({ onClose, onSuccess }) => {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const [form, setForm] = useState({
    transaction_type: "OUT_SALE",
    transaction_date: new Date().toISOString().split("T")[0],
    project_id: "",
    reference: "",
    notes: "",
  });

  const [details, setDetails] = useState([
    {
      item_id: "",
      quantity: "",
    },
  ]);

  const transactionTypes = [
    { value: "OUT_PROJECT", label: "Pengeluaran Proyek" },
    { value: "OUT_PRODUCTION", label: "Pengeluaran Produksi" },
    { value: "OUT_SALE", label: "Penjualan" },
    { value: "OUT_DAMAGED", label: "Barang Rusak" },
    { value: "OUT_LOST", label: "Barang Hilang" },
  ];

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

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDetailChange = (index, field, value) => {
    setDetails((prev) =>
      prev.map((detail, i) =>
        i === index
          ? { ...detail, [field]: value }
          : detail
      )
    );
  };

  const addDetail = () => {
    setDetails((prev) => [
      ...prev,
      { item_id: "", quantity: "" },
    ]);
  };

  const removeDetail = (index) => {
    if (details.length === 1) return;

    setDetails((prev) =>
      prev.filter((_, i) => i !== index)
    );
  };

  const getSelectedItem = (itemId) => {
    return items.find(
      (item) => String(item.id) === String(itemId)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isClosing) return;

    if (!form.transaction_date) {
      setError("Tanggal transaksi wajib diisi.");
      return;
    }

    if (
      form.transaction_type === "OUT_PROJECT" &&
      (!form.project_id || Number(form.project_id) <= 0)
    ) {
      setError("Project ID wajib diisi untuk pengeluaran proyek.");
      return;
    }

    if (details.some((detail) => !detail.item_id)) {
      setError("Pilih barang untuk setiap detail transaksi.");
      return;
    }

    if (
      details.some(
        (detail) =>
          !detail.quantity ||
          Number(detail.quantity) <= 0
      )
    ) {
      setError("Jumlah barang harus lebih dari 0.");
      return;
    }

    const selectedIds = details.map(
      (detail) => String(detail.item_id)
    );

    if (new Set(selectedIds).size !== selectedIds.length) {
      setError("Barang yang sama tidak boleh dipilih lebih dari sekali.");
      return;
    }

    for (const detail of details) {
      const selectedItem = getSelectedItem(detail.item_id);

      if (!selectedItem) {
        setError("Barang yang dipilih tidak ditemukan.");
        return;
      }

      if (
        Number(detail.quantity) >
        Number(selectedItem.current_stock)
      ) {
        setError(
          `Stok ${selectedItem.name} tidak mencukupi. Stok tersedia: ${selectedItem.current_stock}.`
        );
        return;
      }
    }

    const payload = {
      transaction_type: form.transaction_type,
      transaction_date: form.transaction_date,
      reference: form.reference,
      notes: form.notes,
      items: details.map((detail) => ({
        item_id: Number(detail.item_id),
        quantity: Number(detail.quantity),
        ...(form.transaction_type === "OUT_PROJECT"
          ? { project_id: Number(form.project_id) }
          : {}),
      })),
    };

    try {
      setSubmitting(true);

      await transactionService.createOutgoing(payload);
      await onSuccess();

      setIsClosing(true);

      setTimeout(() => {
        onClose();
      }, 180);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Gagal menyimpan transaksi barang keluar."
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
              Transaksi Barang Keluar
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Catat pengeluaran barang dari inventaris.
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
          {/* INFORMASI TRANSAKSI */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Jenis Transaksi
              </label>

              <select
                name="transaction_type"
                value={form.transaction_type}
                onChange={handleFormChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400"
              >
                {transactionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Tanggal Transaksi
              </label>

              <input
                type="date"
                name="transaction_date"
                value={form.transaction_date}
                onChange={handleFormChange}
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400"
              />
            </div>

            {form.transaction_type === "OUT_PROJECT" && (
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Project ID
                </label>

                <input
                  type="number"
                  name="project_id"
                  min="1"
                  value={form.project_id}
                  onChange={handleFormChange}
                  required
                  placeholder="Masukkan ID proyek"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Masukkan ID proyek yang terdaftar di database.
                </p>
              </div>
            )}

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Referensi
              </label>

              <input
                type="text"
                name="reference"
                value={form.reference}
                onChange={handleFormChange}
                placeholder="Nomor dokumen atau referensi"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400"
              />
            </div>
          </div>

          {/* DAFTAR BARANG */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-[#142D50]">
                  Detail Barang
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Pilih barang dan tentukan jumlah yang dikeluarkan.
                </p>
              </div>

              <button
                type="button"
                onClick={addDetail}
                className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600 transition-all duration-200 hover:bg-blue-100"
              >
                <Plus size={16} />
                Tambah Barang
              </button>
            </div>

            {loadingItems ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                Memuat daftar barang...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                Belum ada barang yang tersedia.
              </div>
            ) : (
              <div className="space-y-4">
                {details.map((detail, index) => {
                  const selectedItem = getSelectedItem(
                    detail.item_id
                  );

                  return (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Barang {index + 1}
                        </span>

                        {details.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDetail(index)}
                            className="rounded-lg p-1.5 text-red-400 transition-all duration-200 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-600">
                            Pilih Barang
                          </label>

                          <select
                            value={detail.item_id}
                            onChange={(e) =>
                              handleDetailChange(
                                index,
                                "item_id",
                                e.target.value
                              )
                            }
                            required
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition-colors focus:border-blue-400"
                          >
                            <option value="">
                              Pilih barang...
                            </option>

                            {items.map((item) => (
                              <option
                                key={item.id}
                                value={item.id}
                              >
                                {item.code} - {item.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-600">
                            Jumlah Keluar
                          </label>

                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={detail.quantity}
                            onChange={(e) =>
                              handleDetailChange(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                            required
                            placeholder="Masukkan jumlah"
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition-colors focus:border-blue-400"
                          />
                        </div>
                      </div>

                      {selectedItem && (
                        <div className="mt-3 flex items-center justify-between rounded-xl bg-blue-50 px-4 py-3">
                          <span className="text-xs text-slate-500">
                            Stok tersedia
                          </span>

                          <span className="text-sm font-bold text-blue-700">
                            {selectedItem.current_stock}{" "}
                            {selectedItem.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CATATAN */}
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Catatan
            </label>

            <textarea
              name="notes"
              value={form.notes}
              onChange={handleFormChange}
              rows="3"
              placeholder="Tambahkan catatan transaksi jika diperlukan..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-blue-400"
            />
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
              disabled={submitting || loadingItems || items.length === 0 || isClosing}
              className="rounded-xl bg-[#2463A6] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/10 transition-all duration-200 hover:bg-[#142D50] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Menyimpan..."
                : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OutgoingTransactionModal;