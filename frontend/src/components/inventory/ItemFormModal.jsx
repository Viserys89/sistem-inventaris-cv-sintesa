import { useEffect, useState } from "react";
import { X, PackagePlus } from "lucide-react";
import itemService from "../../services/itemService";

const initialForm = {
  code: "",
  name: "",
  category_id: "",
  unit: "",
  min_stock: "0",
  purchase_price: "",
  selling_price: "",
  description: "",
};

function ItemFormModal({ item, categories, onClose, onSuccess }) {
  const isEdit = Boolean(item);

  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        code: item.code ?? "",
        name: item.name ?? "",
        category_id: String(item.category_id ?? ""),
        unit: item.unit ?? "",
        min_stock: String(item.min_stock ?? 0),
        purchase_price: item.purchase_price ?? "",
        selling_price: item.selling_price ?? "",
        description: item.description ?? "",
      });
    } else {
      setForm(initialForm);
    }
  }, [item]);

  const handleClose = (force = false) => {
    if (isClosing || (loading && !force)) return;

    setIsClosing(true);

    setTimeout(() => {
      onClose();
    }, 180);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.category_id) {
      setError("Silakan pilih kategori barang.");
      return;
    }

    const payload = {
      ...form,
      category_id: Number(form.category_id),
      min_stock: Number(form.min_stock),
      purchase_price:
        form.purchase_price === "" ? null : Number(form.purchase_price),
      selling_price:
        form.selling_price === "" ? null : Number(form.selling_price),
    };

    setLoading(true);

    try {
      if (isEdit) {
        await itemService.updateItem(item.id, payload);
      } else {
        await itemService.createItem(payload);
      }

      await onSuccess();
      handleClose(true);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Terjadi kesalahan saat menyimpan barang.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#142D50]/35 p-4 backdrop-blur-[3px] ${
        isClosing ? "modal-backdrop-exit" : "modal-backdrop-enter"
      }`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        className={`w-full max-w-[560px] overflow-hidden rounded-2xl border border-[#D5E7F7] bg-white shadow-2xl ${
          isClosing ? "modal-content-exit" : "modal-content-enter"
        }`}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-[#E7EDF4] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF5FC] text-[#2463A6]">
              <PackagePlus size={20} />
            </div>

            <div>
              <h2 className="text-base font-semibold text-[#142D50]">
                {isEdit ? "Edit Barang" : "Tambah Barang"}
              </h2>

              <p className="mt-1 text-[11px] text-[#91A0B4]">
                {isEdit
                  ? "Perbarui informasi barang persediaan."
                  : "Masukkan informasi barang baru."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleClose()}
            disabled={loading || isClosing}
            className="rounded-lg p-2 text-[#91A0B4] transition hover:bg-[#F4F7FA] hover:text-[#142D50] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
            {/* KODE BARANG */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[#52657E]">
                Kode Barang *
              </label>

              <input
                name="code"
                value={form.code}
                onChange={handleChange}
                required
                placeholder="Contoh: PLY-18-STD"
                className="h-10 w-full rounded-lg border border-[#D5E7F7] px-3 text-xs outline-none transition focus:border-[#75B9E7]"
              />
            </div>

            {/* NAMA BARANG */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[#52657E]">
                Nama Barang *
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                required
                placeholder="Nama barang"
                className="h-10 w-full rounded-lg border border-[#D5E7F7] px-3 text-xs outline-none transition focus:border-[#75B9E7]"
              />
            </div>

            {/* KATEGORI */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[#52657E]">
                Kategori *
              </label>

              <select
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                required
                className="h-10 w-full rounded-lg border border-[#D5E7F7] bg-white px-3 text-xs outline-none focus:border-[#75B9E7]"
              >
                <option value="">Pilih kategori</option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* SATUAN */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[#52657E]">
                Satuan *
              </label>

              <input
                name="unit"
                value={form.unit}
                onChange={handleChange}
                required
                placeholder="Contoh: Lembar, Batang, Pail"
                className="h-10 w-full rounded-lg border border-[#D5E7F7] px-3 text-xs outline-none transition focus:border-[#75B9E7]"
              />
            </div>

            {/* STOK MINIMUM */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[#52657E]">
                Stok Minimum *
              </label>

              <input
                type="number"
                name="min_stock"
                value={form.min_stock}
                onChange={handleChange}
                min="0"
                required
                className="h-10 w-full rounded-lg border border-[#D5E7F7] px-3 text-xs outline-none focus:border-[#75B9E7]"
              />
            </div>

            {/* HARGA BELI */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[#52657E]">
                Harga Beli
              </label>

              <input
                type="number"
                name="purchase_price"
                value={form.purchase_price}
                onChange={handleChange}
                min="0"
                placeholder="Opsional"
                className="h-10 w-full rounded-lg border border-[#D5E7F7] px-3 text-xs outline-none focus:border-[#75B9E7]"
              />
            </div>

            {/* HARGA JUAL */}
            <div>
              <label className="mb-2 block text-[11px] font-semibold text-[#52657E]">
                Harga Jual
              </label>

              <input
                type="number"
                name="selling_price"
                value={form.selling_price}
                onChange={handleChange}
                min="0"
                placeholder="Opsional"
                className="h-10 w-full rounded-lg border border-[#D5E7F7] px-3 text-xs outline-none focus:border-[#75B9E7]"
              />
            </div>

            {/* KETERANGAN */}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-[11px] font-semibold text-[#52657E]">
                Deskripsi
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows="3"
                placeholder="Keterangan tambahan barang..."
                className="w-full resize-none rounded-lg border border-[#D5E7F7] px-3 py-3 text-xs outline-none focus:border-[#75B9E7]"
              />
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mx-6 mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-600">
              {error}
            </div>
          )}

          {/* FOOTER */}
          <div className="flex justify-end gap-3 border-t border-[#E7EDF4] bg-[#FAFCFE] px-6 py-4">
            <button
              type="button"
              onClick={() => handleClose()}
              disabled={loading || isClosing}
              className="h-10 rounded-lg border border-[#D5E7F7] px-5 text-xs font-medium text-[#52657E] transition hover:bg-[#F4F7FA] disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={loading || isClosing}
              className="h-10 rounded-lg bg-[#142D50] px-5 text-xs font-semibold text-white transition hover:bg-[#1C3C66] disabled:opacity-50"
            >
              {loading
                ? "Menyimpan..."
                : isEdit
                  ? "Simpan Perubahan"
                  : "Simpan Barang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ItemFormModal;