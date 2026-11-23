import { useEffect, useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import itemService from "../../services/itemService";
import transactionService from "../../services/transactionService";

function IncomingTransactionModal({ onClose, onSuccess }) {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  const [form, setForm] = useState({
    transaction_type: "IN_PURCHASE",
    transaction_date: new Date().toISOString().slice(0, 10),
    reference: "",
    notes: "",
  });

  const [details, setDetails] = useState([
    {
      item_id: "",
      quantity: "",
      unit_price: "",
    },
  ]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoadingItems(true);

      const response = await itemService.getItems({
        limit: 1000,
      });

      const itemData = response.data || [];

      setItems(itemData.filter((item) => item.is_active));
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengambil daftar barang.");
    } finally {
      setLoadingItems(false);
    }
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
        i === index ? { ...detail, [field]: value } : detail,
      ),
    );
  };

  const addDetail = () => {
    setDetails((prev) => [
      ...prev,
      {
        item_id: "",
        quantity: "",
        unit_price: "",
      },
    ]);
  };

  const removeDetail = (index) => {
    setDetails((prev) => prev.filter((_, i) => i !== index));
  };
  const handleClose = () => {
    if (submitting || isClosing) return;

    setIsClosing(true);

    setTimeout(() => {
      onClose();
    }, 180);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (details.length === 0) {
      setError("Tambahkan minimal satu barang.");
      return;
    }

    const invalidDetail = details.some(
      (detail) =>
        !detail.item_id ||
        Number(detail.quantity) <= 0 ||
        detail.quantity === "" ||
        detail.unit_price === "" ||
        Number(detail.unit_price) < 0,
    );

    if (invalidDetail) {
      setError(
        "Pastikan barang, jumlah, dan harga satuan sudah diisi dengan benar.",
      );
      return;
    }

    const selectedItemIds = details.map((detail) => detail.item_id);

    if (new Set(selectedItemIds).size !== selectedItemIds.length) {
      setError("Barang yang sama tidak boleh dimasukkan dua kali.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...form,
        items: details.map((detail) => ({
          item_id: Number(detail.item_id),
          quantity: Number(detail.quantity),
          unit_price: Number(detail.unit_price),
        })),
      };

      await transactionService.createIncoming(payload);

      await onSuccess();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "Transaksi barang masuk gagal disimpan.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 ${
        isClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"
      }`}
    >
      <div
        className={`w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl ${
          isClosing ? "modal-content-exit" : "modal-content-enter"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Transaksi Barang Masuk
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Catat penambahan stok barang inventaris.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
            {/* Jenis dan tanggal */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Jenis Transaksi
                </label>

                <select
                  name="transaction_type"
                  value={form.transaction_type}
                  onChange={handleFormChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                >
                  <option value="IN_PURCHASE">Pembelian</option>
                  <option value="IN_PRODUCTION">Hasil Produksi</option>
                  <option value="IN_RETURN">Retur Barang</option>
                  <option value="OPENING_BALANCE">Saldo Awal</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Tanggal Transaksi
                </label>

                <input
                  type="date"
                  name="transaction_date"
                  value={form.transaction_date}
                  onChange={handleFormChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Daftar barang */}
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">
                  Daftar Barang
                </h3>

                <button
                  type="button"
                  onClick={addDetail}
                  className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  <Plus size={16} />
                  Tambah Barang
                </button>
              </div>

              {loadingItems ? (
                <p className="text-sm text-slate-500">
                  Memuat daftar barang...
                </p>
              ) : items.length === 0 ? (
                <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                  Belum ada barang aktif. Tambahkan barang melalui halaman
                  Inventaris terlebih dahulu.
                </p>
              ) : (
                <div className="space-y-3">
                  {details.map((detail, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-500">
                          BARANG {index + 1}
                        </span>

                        {details.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeDetail(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-sm font-medium text-slate-700">
                            Pilih Barang
                          </label>

                          <select
                            value={detail.item_id}
                            onChange={(e) =>
                              handleDetailChange(
                                index,
                                "item_id",
                                e.target.value,
                              )
                            }
                            required
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                          >
                            <option value="">Pilih barang...</option>

                            {items.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.code} - {item.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Jumlah
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
                                  e.target.value,
                                )
                              }
                              required
                              placeholder="0"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                            />
                          </div>

                          <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700">
                              Harga Satuan (Rp)
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={detail.unit_price}
                              onChange={(e) =>
                                handleDetailChange(
                                  index,
                                  "unit_price",
                                  e.target.value,
                                )
                              }
                              required
                              placeholder="0"
                              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Referensi */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Referensi / Nomor Dokumen
              </label>

              <input
                type="text"
                name="reference"
                value={form.reference}
                onChange={handleFormChange}
                placeholder="Contoh: INV/2026/001"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* Catatan */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Catatan
              </label>

              <textarea
                name="notes"
                value={form.notes}
                onChange={handleFormChange}
                rows="3"
                placeholder="Tambahkan catatan jika diperlukan..."
                className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={submitting || loadingItems || items.length === 0}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Menyimpan..." : "Simpan Transaksi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default IncomingTransactionModal;
