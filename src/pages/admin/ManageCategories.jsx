import React, { useState, useEffect, useCallback } from 'react';
import {
  FolderTree, FolderOpen, Folder, Plus, Pencil, Trash2,
  ChevronRight, ChevronDown, Loader2, AlertCircle, X, Save,
  LayoutGrid, GitBranch
} from 'lucide-react';
import categoryService from '../../services/admin/categoryService';

// ─── Render đệ quy từng node trong cây danh mục ──────────────────────────────
function CategoryTreeRow({ node, depth = 0, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <>
      <tr className="border-b border-[#1f2023] hover:bg-[#35373c]/30 transition-all group">
        <td className="px-4 py-3">
          <div className="flex items-center gap-1" style={{ paddingLeft: `${depth * 20}px` }}>
            {/* Toggle expand/collapse nếu có con */}
            {hasChildren ? (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-5 h-5 flex items-center justify-center text-[#949ba4] hover:text-white transition-colors shrink-0"
              >
                {expanded
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}

            {/* Icon folder */}
            {depth === 0
              ? <FolderOpen className="w-4 h-4 text-amber-400 shrink-0" />
              : <Folder className="w-4 h-4 text-indigo-400 shrink-0" />}

            <span className={`text-sm font-semibold ml-1 ${depth === 0 ? 'text-white' : 'text-[#dbdee1]'}`}>
              {node.name}
            </span>

            {/* Badge số con */}
            {hasChildren && (
              <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded font-bold">
                {node.children.length} con
              </span>
            )}
          </div>
        </td>

        <td className="px-4 py-3">
          <code className="text-xs text-[#949ba4] bg-[#1e1f22] px-2 py-0.5 rounded font-mono">
            {node.slug}
          </code>
        </td>

        <td className="px-4 py-3 text-xs text-[#949ba4] max-w-[200px] truncate">
          {node.description || <span className="italic opacity-50">— Chưa có mô tả —</span>}
        </td>

        <td className="px-4 py-3">
          {depth === 0 ? (
            <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold uppercase">
              Gốc (Root)
            </span>
          ) : (
            <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase">
              Cấp {depth}
            </span>
          )}
        </td>

        <td className="px-4 py-3">
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => onEdit(node)}
              className="p-1.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-all"
              title="Chỉnh sửa"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(node)}
              className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
              title="Xóa"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Render các node con nếu expanded */}
      {hasChildren && expanded && node.children.map((child) => (
        <CategoryTreeRow
          key={child._id}
          node={child}
          depth={depth + 1}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </>
  );
}

// ─── Modal Form tạo/sửa danh mục ─────────────────────────────────────────────
function CategoryModal({ mode, category, flatList, onClose, onSaved }) {
  const [name, setName] = useState(category?.name || '');
  const [description, setDescription] = useState(category?.description || '');
  const [parentId, setParentId] = useState(
    category?.parentId?._id || category?.parentId || ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Loại bỏ chính nó và các con cháu ra khỏi dropdown khi đang edit
  const availableParents = flatList.filter((c) => c._id !== category?._id);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Tên danh mục là bắt buộc!');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const payload = {
        name: name.trim(),
        description: description.trim(),
        parentId: parentId || null
      };

      let result;
      if (mode === 'create') {
        result = await categoryService.create(payload);
      } else {
        result = await categoryService.update(category._id, payload);
      }

      if (result.success) {
        onSaved(result.message);
      } else {
        setError(result.message || 'Đã xảy ra lỗi!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể kết nối máy chủ!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#2b2d31] rounded-xl border border-[#1f2023]/60 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2023]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            {mode === 'create'
              ? <><Plus className="w-4 h-4 text-emerald-400" /> Tạo Danh Mục Mới</>
              : <><Pencil className="w-4 h-4 text-indigo-400" /> Chỉnh Sửa Danh Mục</>}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[#35373c] text-[#949ba4] hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Tên danh mục */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Khung Avatar Lửa"
              className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          {/* Danh mục cha — Dropdown */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider flex items-center gap-1">
              <GitBranch className="w-3 h-3" /> Danh mục cha
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="">— Không có cha (Danh mục Gốc) —</option>
              {availableParents.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.parentId ? `↳ ${cat.name}` : cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mô tả */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Mô tả ngắn về danh mục này..."
              rows={3}
              className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#949ba4] hover:text-white bg-[#35373c] hover:bg-[#3f4147] rounded-lg transition-all font-semibold"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white rounded-lg transition-all flex items-center gap-1.5 shadow-md"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {mode === 'create' ? 'Tạo Danh Mục' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal xác nhận xóa ───────────────────────────────────────────────────────
function DeleteModal({ category, onClose, onConfirm, loading }) {
  const [strategy, setStrategy] = useState('cascade');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#2b2d31] rounded-xl border border-rose-500/20 shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Xác nhận xóa danh mục</h3>
            <p className="text-xs text-[#949ba4] mt-0.5">
              Danh mục: <span className="text-rose-400 font-semibold">"{category.name}"</span>
            </p>
          </div>
        </div>

        {/* Strategy selector */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-[#b5bac1] uppercase tracking-wider">
            Chiến lược xóa danh mục con:
          </p>
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#1e1f22] border border-[#1f2023] cursor-pointer hover:border-rose-500/30 transition-all">
            <input
              type="radio"
              name="strategy"
              value="cascade"
              checked={strategy === 'cascade'}
              onChange={() => setStrategy('cascade')}
              className="mt-0.5 accent-rose-500"
            />
            <div>
              <span className="text-xs font-bold text-rose-400">Cascade (Xóa luôn tất cả con)</span>
              <p className="text-[10px] text-[#949ba4] mt-0.5">Xóa danh mục này và toàn bộ danh mục con cháu bên trong.</p>
            </div>
          </label>
          <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-[#1e1f22] border border-[#1f2023] cursor-pointer hover:border-amber-500/30 transition-all">
            <input
              type="radio"
              name="strategy"
              value="detach"
              checked={strategy === 'detach'}
              onChange={() => setStrategy('detach')}
              className="mt-0.5 accent-amber-500"
            />
            <div>
              <span className="text-xs font-bold text-amber-400">Detach (Tách con thành gốc)</span>
              <p className="text-[10px] text-[#949ba4] mt-0.5">Chỉ xóa danh mục này, các danh mục con sẽ trở thành danh mục gốc.</p>
            </div>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#949ba4] hover:text-white bg-[#35373c] hover:bg-[#3f4147] rounded-lg transition-all font-semibold"
          >
            Hủy
          </button>
          <button
            onClick={() => onConfirm(strategy)}
            disabled={loading}
            className="px-4 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 text-white rounded-lg transition-all flex items-center gap-1.5"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Xác nhận xóa
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component chính ──────────────────────────────────────────────────────────
export default function ManageCategories() {
  const [treeData, setTreeData] = useState([]);      // Cây phân cấp để hiển thị
  const [flatList, setFlatList] = useState([]);       // Danh sách phẳng cho dropdown
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);           // Thông báo thành công

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Hiển thị toast thành công tự đóng sau 3s
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Tải dữ liệu từ API
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [treeRes, flatRes] = await Promise.all([
        categoryService.getAll(),
        categoryService.getFlat()
      ]);
      if (treeRes.success) setTreeData(treeRes.data);
      if (flatRes.success) setFlatList(flatRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải danh mục từ máy chủ!');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Mở modal tạo mới
  const handleAdd = () => {
    setSelectedCategory(null);
    setModalMode('create');
    setShowModal(true);
  };

  // Mở modal chỉnh sửa
  const handleEdit = (cat) => {
    setSelectedCategory(cat);
    setModalMode('edit');
    setShowModal(true);
  };

  // Sau khi save thành công
  const handleSaved = (msg) => {
    setShowModal(false);
    showToast(msg);
    fetchCategories();
  };

  // Mở confirm xóa
  const handleDeleteClick = (cat) => {
    setDeleteTarget(cat);
  };

  // Thực hiện xóa
  const handleDeleteConfirm = async (strategy) => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      const result = await categoryService.delete(deleteTarget._id, strategy);
      if (result.success) {
        setDeleteTarget(null);
        showToast(result.message);
        fetchCategories();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Không thể xóa danh mục!');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Tổng số danh mục (flat count)
  const totalCount = flatList.length;
  const rootCount = treeData.length;

  return (
    <div className="p-6 space-y-6">

      {/* Toast thành công */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl shadow-2xl text-sm font-semibold flex items-center gap-2 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
          {toast}
        </div>
      )}

      {/* Modals */}
      {showModal && (
        <CategoryModal
          mode={modalMode}
          category={selectedCategory}
          flatList={flatList}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          category={deleteTarget}
          loading={deleteLoading}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      {/* Header Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#2b2d31] border border-[#1f2023]/40 rounded-xl p-5 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Tổng danh mục</span>
            <h3 className="text-2xl font-extrabold text-white mt-1">{loading ? '...' : totalCount}</h3>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-lg text-amber-400">
            <LayoutGrid className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#2b2d31] border border-[#1f2023]/40 rounded-xl p-5 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Danh mục gốc</span>
            <h3 className="text-2xl font-extrabold text-amber-400 mt-1">{loading ? '...' : rootCount}</h3>
          </div>
          <div className="bg-amber-500/10 p-3 rounded-lg text-amber-400">
            <FolderOpen className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-[#2b2d31] border border-[#1f2023]/40 rounded-xl p-5 flex items-center justify-between shadow-md">
          <div>
            <span className="text-xs font-bold text-[#949ba4] uppercase tracking-wider">Danh mục con</span>
            <h3 className="text-2xl font-extrabold text-indigo-400 mt-1">{loading ? '...' : totalCount - rootCount}</h3>
          </div>
          <div className="bg-indigo-500/10 p-3 rounded-lg text-indigo-400">
            <GitBranch className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-[#2b2d31] rounded-xl border border-[#1f2023]/40 shadow-lg overflow-hidden">
        {/* Table Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f2023]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderTree className="w-4 h-4 text-amber-400" />
            Cây Danh Mục Sản Phẩm
          </h3>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Thêm Danh Mục
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
            <span className="text-xs text-[#949ba4] font-semibold">Đang tải cây danh mục từ MongoDB...</span>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex items-center justify-center py-16 gap-3 text-rose-400">
            <AlertCircle className="w-6 h-6" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && treeData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#949ba4]">
            <FolderOpen className="w-10 h-10 opacity-40" />
            <p className="text-sm font-semibold">Chưa có danh mục nào.</p>
            <button
              onClick={handleAdd}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
            >
              Tạo danh mục đầu tiên →
            </button>
          </div>
        )}

        {/* Tree Table */}
        {!loading && !error && treeData.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#232428] text-[10px] font-bold text-[#949ba4] uppercase tracking-wider border-b border-[#1f2023]">
                  <th className="px-4 py-3 w-[35%]">Tên danh mục</th>
                  <th className="px-4 py-3 w-[20%]">Slug</th>
                  <th className="px-4 py-3 w-[25%]">Mô tả</th>
                  <th className="px-4 py-3 w-[10%]">Cấp độ</th>
                  <th className="px-4 py-3 w-[10%]">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {treeData.map((rootNode) => (
                  <CategoryTreeRow
                    key={rootNode._id}
                    node={rootNode}
                    depth={0}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
