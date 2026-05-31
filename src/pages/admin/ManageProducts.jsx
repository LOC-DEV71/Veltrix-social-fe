import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingBag, PlusCircle, Coins, Sparkles, Loader,
  FolderTree, ChevronRight, ChevronDown, Folder, FolderOpen,
  Tag, X, Check, Image as ImageIcon, UploadCloud, FileVideo,
  Pencil, Trash2, AlertCircle, Save
} from 'lucide-react';
import productService from '../../services/admin/productService';
import categoryService from '../../services/admin/categoryService';

// ─── Tree Category Picker ──────────────────────────────────────────────────
function CategoryTreePicker({ treeData, selectedId, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const findName = (nodes, id) => {
    for (const n of nodes) {
      if (n._id === id) return n.name;
      if (n.children?.length) {
        const found = findName(n.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const selectedName = selectedId ? findName(treeData, selectedId) : null;

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full bg-[#1e1f22] border rounded-lg p-2.5 text-sm text-left flex items-center justify-between transition-colors ${
          open ? 'border-amber-500' : 'border-[#1f2023] hover:border-[#35373c]'
        }`}
      >
        <span className={`flex items-center gap-2 ${selectedName ? 'text-white' : 'text-[#949ba4]'}`}>
          <FolderTree className="w-4 h-4 text-amber-400 shrink-0" />
          {selectedName || '— Không có danh mục (Không phân loại) —'}
        </span>
        <span className="flex items-center gap-1">
          {selectedId && (
            <span
              onClick={(e) => { e.stopPropagation(); onSelect(''); }}
              className="p-0.5 rounded hover:bg-[#35373c] text-[#949ba4] hover:text-rose-400 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 text-[#949ba4] transition-transform ${open ? 'rotate-180' : ''}`} />
        </span>
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-[#2b2d31] border border-[#1f2023] rounded-lg shadow-2xl max-h-56 overflow-y-auto py-1">
          <button
            type="button"
            onClick={() => { onSelect(''); setOpen(false); }}
            className={`w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-[#35373c] transition-all ${
              !selectedId ? 'text-amber-400 font-bold' : 'text-[#949ba4]'
            }`}
          >
            <Tag className="w-3.5 h-3.5 shrink-0" />
            — Không phân loại —
            {!selectedId && <Check className="w-3.5 h-3.5 ml-auto" />}
          </button>
          <div className="border-t border-[#1f2023] my-1" />
          {treeData.length === 0 ? (
            <p className="text-xs text-[#949ba4] text-center py-3">Chưa có danh mục nào.</p>
          ) : (
            treeData.map((node) => (
              <TreePickerNode
                key={node._id}
                node={node}
                depth={0}
                selectedId={selectedId}
                onSelect={(id) => { onSelect(id); setOpen(false); }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function TreePickerNode({ node, depth, selectedId, onSelect }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children?.length > 0;
  const isSelected = node._id === selectedId;

  return (
    <>
      <div
        className={`flex items-center gap-1.5 px-3 py-2 cursor-pointer transition-all text-xs ${
          isSelected ? 'bg-amber-500/10 text-amber-400 font-bold' : 'text-[#dbdee1] hover:bg-[#35373c]'
        }`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
      >
        {hasChildren ? (
          <span
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
            className="shrink-0 text-[#949ba4] hover:text-white transition-colors"
          >
            {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </span>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        <span onClick={() => onSelect(node._id)} className="flex items-center gap-1.5 flex-1 min-w-0">
          {depth === 0 ? <FolderOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
          <span className="truncate">{node.name}</span>
          {isSelected && <Check className="w-3.5 h-3.5 ml-auto shrink-0" />}
        </span>
      </div>
      {hasChildren && expanded && node.children.map((child) => (
        <TreePickerNode key={child._id} node={child} depth={depth + 1} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </>
  );
}

// ─── Component Chính ────────────────────────────────────────────────────────
export default function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Form State
  const [editingId, setEditingId] = useState(null); // null = Create, string = Edit
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  
  // File upload state
  const [staticImage, setStaticImage] = useState(null);
  const [animatedImage, setAnimatedImage] = useState(null);
  
  // Previews (for editing existing products or new file selection)
  const [staticPreview, setStaticPreview] = useState(null);
  const [animatedPreview, setAnimatedPreview] = useState(null);

  // Filter state
  const [filterCategoryId, setFilterCategoryId] = useState('');

  // Notification states
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productService.getAll(),
        categoryService.getAll()
      ]);
      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) setCategoryTree(catRes.data);
    } catch (err) {
      console.error('⚠️ Could not load initial data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Handle File Input Changes
  const handleStaticImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setStaticImage(file);
      setStaticPreview(URL.createObjectURL(file));
    }
  };

  const handleAnimatedImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAnimatedImage(file);
      setAnimatedPreview(URL.createObjectURL(file));
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setCategoryId('');
    setStaticImage(null);
    setAnimatedImage(null);
    setStaticPreview(null);
    setAnimatedPreview(null);
    setError(null);
    setMessage(null);
    
    // Clear file inputs
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => input.value = '');
  };

  // Populate form for Edit
  const handleEditClick = (product) => {
    setEditingId(product._id);
    setName(product.name);
    setPrice(product.price);
    setCategoryId(product.category?._id || '');
    setStaticImage(null);
    setAnimatedImage(null);
    setStaticPreview(product.staticUrl);
    setAnimatedPreview(product.animatedUrl);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Delete
  const handleDeleteClick = async (product) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${product.name}"?`)) return;
    try {
      setLoading(true);
      const result = await productService.delete(product._id);
      if (result.success) {
        setMessage(result.message);
        fetchInitialData();
        if (editingId === product._id) resetForm();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi xóa!');
    } finally {
      setLoading(false);
    }
  };

  // Submit Form (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!editingId && (!name || price === '' || !staticImage || !animatedImage)) {
      setError('Khi tạo mới, vui lòng nhập Tên, Giá và tải lên đủ 2 ảnh!');
      return;
    }
    if (editingId && (!name || price === '')) {
      setError('Vui lòng nhập Tên và Giá!');
      return;
    }

    try {
      setSubmitLoading(true);
      setError(null);
      setMessage(null);

      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', Number(price));
      if (categoryId) formData.append('category', categoryId);
      
      // Chỉ append file nếu người dùng có chọn file mới
      if (staticImage) formData.append('staticImage', staticImage);
      if (animatedImage) formData.append('animatedImage', animatedImage);

      let result;
      if (editingId) {
        result = await productService.update(editingId, formData);
      } else {
        result = await productService.create(formData);
      }

      if (result.success) {
        setMessage(result.message);
        resetForm();
        fetchInitialData();
      } else {
        setError(result.message || 'Có lỗi xảy ra!');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể kết nối tới máy chủ!');
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredProducts = filterCategoryId
    ? products.filter((p) => p.category?._id === filterCategoryId)
    : products;

  if (loading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-indigo-400 space-y-2">
        <Loader className="w-8 h-8 animate-spin" />
        <span className="text-xs font-semibold text-[#949ba4]">Đang tải danh sách sản phẩm...</span>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* ─── Left Column: Form thêm/sửa sản phẩm ──────────────────────────── */}
      <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1f2023]/40 shadow-lg h-fit space-y-5 sticky top-6">
        <div className="flex items-center justify-between border-b border-[#1f2023] pb-3">
          <div className="flex items-center gap-2">
            {editingId ? (
              <Pencil className="w-5 h-5 text-indigo-400 shrink-0" />
            ) : (
              <PlusCircle className="w-5 h-5 text-amber-500 shrink-0" />
            )}
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              {editingId ? 'Chỉnh Sửa Sản Phẩm' : 'Thêm Khung Avatar Mới'}
            </h3>
          </div>
          {editingId && (
            <button onClick={resetForm} className="text-xs font-bold text-[#949ba4] hover:text-white transition-colors">
              Hủy
            </button>
          )}
        </div>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-[#949ba4] uppercase">Tên Khung Avatar</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: Khung Lửa Địa Ngục (Hellfire)"
              className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#949ba4] uppercase">Giá (Coin)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Nhập 0 để đặt làm Premium Miễn Phí"
              className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-[#949ba4] uppercase flex items-center gap-1">
              <FolderTree className="w-3.5 h-3.5 text-amber-400" />
              Danh mục sản phẩm
            </label>
            <CategoryTreePicker
              treeData={categoryTree}
              selectedId={categoryId}
              onSelect={setCategoryId}
            />
          </div>

          {/* Upload Static Image */}
          <div className="space-y-2 pt-2 border-t border-[#1f2023]">
            <label className="text-xs font-bold text-[#949ba4] uppercase flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
              Ảnh Tĩnh (PNG/JPG/WEBP) {editingId ? '(Tùy chọn)' : '*'}
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#35373c] hover:border-amber-500 rounded-lg cursor-pointer bg-[#1e1f22] transition-colors">
                <UploadCloud className="w-6 h-6 text-[#949ba4] mb-1" />
                <span className="text-[10px] text-[#949ba4] font-semibold text-center">Nhấn để tải lên ảnh tĩnh</span>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden" 
                  onChange={handleStaticImageChange} 
                />
              </label>
              {staticPreview && (
                <div className="w-16 h-16 rounded-lg border border-[#35373c] overflow-hidden shrink-0 bg-black/50 flex items-center justify-center">
                  <img src={staticPreview} alt="Static Preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          {/* Upload Animated GIF/APNG */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#949ba4] uppercase flex items-center gap-1">
              <FileVideo className="w-3.5 h-3.5 text-rose-400" />
              Ảnh Động (GIF/WEBP/APNG) {editingId ? '(Tùy chọn)' : '*'}
            </label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#35373c] hover:border-amber-500 rounded-lg cursor-pointer bg-[#1e1f22] transition-colors">
                <UploadCloud className="w-6 h-6 text-[#949ba4] mb-1" />
                <span className="text-[10px] text-[#949ba4] font-semibold text-center">Nhấn để tải lên ảnh động</span>
                <input 
                  type="file" 
                  accept="image/gif, image/webp, image/png, image/apng" 
                  className="hidden" 
                  onChange={handleAnimatedImageChange} 
                />
              </label>
              {animatedPreview && (
                <div className="w-16 h-16 rounded-lg border border-[#35373c] overflow-hidden shrink-0 bg-black/50 flex items-center justify-center">
                  <img src={animatedPreview} alt="Animated Preview" className="max-w-full max-h-full object-contain" />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={submitLoading}
            className={`w-full text-sm font-extrabold py-3.5 rounded-lg transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer mt-4 ${
              editingId 
                ? 'bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 text-white' 
                : 'bg-amber-500 hover:bg-amber-600 disabled:bg-amber-800 text-slate-950'
            }`}
          >
            {submitLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {editingId ? <Save className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                {editingId ? 'LƯU THAY ĐỔI' : 'ĐĂNG BÁN NGAY'}
              </>
            )}
          </button>
        </form>
      </div>

      {/* ─── Right Column: Danh sách sản phẩm ─────────────────────────────── */}
      <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1f2023]/40 shadow-lg lg:col-span-2 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-[#1f2023] pb-4">
          <div className="flex items-center gap-2 flex-1">
            <ShoppingBag className="w-5 h-5 text-indigo-400 shrink-0" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Khung Avatar Đang Bán
              <span className="ml-2 text-xs text-[#949ba4] font-normal normal-case">
                ({filteredProducts.length}/{products.length} sản phẩm)
              </span>
            </h3>
          </div>

          <div className="w-full sm:w-56 shrink-0">
            <CategoryTreePicker
              treeData={categoryTree}
              selectedId={filterCategoryId}
              onSelect={setFilterCategoryId}
            />
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-[#949ba4] gap-2">
            <ShoppingBag className="w-10 h-10 opacity-30" />
            <p className="text-sm font-semibold">Không có sản phẩm nào{filterCategoryId ? ' trong danh mục này' : ''}.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((item) => (
              <div
                key={item._id}
                className="bg-[#232428] border border-[#1f2023] rounded-xl p-4 flex flex-col space-y-3 shadow-md hover:border-indigo-500/30 transition-all group"
              >
                <div className="flex items-center space-x-4">
                  {/* Product Frame Showcase */}
                  <div className="relative shrink-0 w-14 h-14 rounded-full p-[2.5px] bg-indigo-500/20 group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:via-red-500 group-hover:to-yellow-500 transition-all duration-300">
                    <div className="w-full h-full rounded-full overflow-hidden border border-slate-900 bg-slate-800 relative">
                      <img
                        src={item.staticUrl}
                        alt="Static"
                        className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0 absolute inset-0 rounded-full"
                      />
                      <img
                        src={item.animatedUrl}
                        alt="Animated"
                        className="w-full h-full object-cover opacity-0 group-hover:opacity-100 absolute inset-0 rounded-full transition-opacity duration-300"
                      />
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                    <div className="flex items-center flex-wrap gap-1.5">
                      {item.price === 0 ? (
                        <span className="text-[10px] bg-purple-500/10 text-purple-400 font-extrabold uppercase px-1.5 py-0.5 rounded border border-purple-500/20 flex items-center gap-0.5">
                          <Sparkles className="w-3 h-3 text-purple-400" /> Premium Free
                        </span>
                      ) : (
                        <span className="text-xs font-extrabold text-amber-400 flex items-center gap-0.5">
                          <Coins className="w-3.5 h-3.5 text-amber-500" /> {item.price} Coin
                        </span>
                      )}
                      {item.category ? (
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5 truncate max-w-[100px]">
                          <Folder className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{item.category.name}</span>
                        </span>
                      ) : (
                        <span className="text-[9px] bg-[#35373c] text-[#949ba4] px-1.5 py-0.5 rounded font-medium italic">
                          Chưa phân loại
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Block */}
                <div className="flex items-center justify-between pt-3 border-t border-[#1f2023] mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <span className="text-[9px] text-[#949ba4] font-medium block truncate max-w-[120px]">
                      ID: {item._id}
                    </span>
                   <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditClick(item)}
                      className="p-1.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 transition-all"
                      title="Chỉnh sửa"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(item)}
                      className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                      title="Xóa sản phẩm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
