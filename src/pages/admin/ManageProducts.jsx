import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingBag, PlusCircle, Coins, Sparkles, Loader,
  FolderTree, ChevronRight, ChevronDown, Folder, FolderOpen,
  Tag, X, Check, Image as ImageIcon, UploadCloud, FileVideo,
  Pencil, Trash2, Save, Search, Filter, Eye, EyeOff
} from 'lucide-react';
import productService from '../../services/admin/productService';
import categoryService from '../../services/admin/categoryService';
import Pagination from '../../components/Pagination';
import ProductSelector from '../../components/admin/ProductSelector';

// ─── Tree Category Picker ──────────────────────────────────────────────────
function CategoryTreePicker({ treeData, selectedId, onSelect, placeholder = '— Không phân loại —' }) {
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
        <span className={`flex items-center gap-2 ${selectedName ? 'text-white' : 'text-[#949ba4]'} truncate`}>
          <FolderTree className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">{selectedName || placeholder}</span>
        </span>
        <span className="flex items-center gap-1 shrink-0">
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
            — Không phân loại / Bỏ lọc —
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
  const [searchParams, setSearchParams] = useSearchParams();
  
  // URL Params State
  const page = parseInt(searchParams.get('page') || '1', 10);
  const searchStr = searchParams.get('search') || '';
  const filterCat = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const limit = parseInt(searchParams.get('limit') || '10', 10);

  const [products, setProducts] = useState([]);
  const [categoryTree, setCategoryTree] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalProducts: 0 });
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = Create, string = Edit
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [staticImage, setStaticImage] = useState(null);
  const [animatedImage, setAnimatedImage] = useState(null);
  const [staticPreview, setStaticPreview] = useState(null);
  const [animatedPreview, setAnimatedPreview] = useState(null);
  
  // Combo State
  const [isCombo, setIsCombo] = useState(false);
  const [comboItems, setComboItems] = useState([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  
  // Effect Layers State (for hieu-ung-ho-so category)
  const [effectLayerFiles, setEffectLayerFiles] = useState([]);
  const [effectLayerPreviews, setEffectLayerPreviews] = useState([]);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionType, setBulkActionType] = useState('');

  // Local Search input state (to debounce before updating URL)
  const [localSearch, setLocalSearch] = useState(searchStr);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, [page, limit, searchStr, filterCat, sort]);

  useEffect(() => {
    // Debounce search update
    const timeoutId = setTimeout(() => {
      updateUrlParams({ search: localSearch, page: 1 });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [localSearch]);

  // Tự động tính tổng tiền khi thay đổi comboItems
  useEffect(() => {
    if (isCombo && comboItems.length > 0 && !editingId) {
      const sum = comboItems.reduce((acc, curr) => acc + curr.price, 0);
      setPrice(sum.toString());
    }
  }, [comboItems, isCombo]);

  const updateUrlParams = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    setSearchParams(newParams);
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        productService.getAll({ page, limit, search: searchStr, category: filterCat, sort }),
        categoryService.getAll()
      ]);
      if (prodRes.success) {
        setProducts(prodRes.data);
        setPagination(prodRes.pagination);
      }
      if (catRes.success) setCategoryTree(catRes.data);
      setSelectedIds([]); // Reset selection on page change
    } catch (err) {
      console.error('⚠️ Could not load data', err);
    } finally {
      setLoading(false);
    }
  };

  // Checkbox handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(products.map(p => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Bulk Actions Handler
  const handleBulkAction = async () => {
    if (!bulkActionType) return;
    if (selectedIds.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm.");
      return;
    }

    const actionText = bulkActionType === 'activate' ? 'hiển thị' : bulkActionType === 'deactivate' ? 'ẩn' : 'XÓA';
    if (!window.confirm(`Bạn có chắc muốn ${actionText} ${selectedIds.length} sản phẩm đã chọn?`)) return;

    try {
      setLoading(true);
      const res = await productService.bulkAction(selectedIds, bulkActionType);
      if (res.success) {
        setMessage(res.message);
        setBulkActionType('');
        fetchInitialData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Lỗi khi thao tác!');
    } finally {
      setLoading(false);
    }
  };

  // Modal Handlers
  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const findComboCategoryId = (categories) => {
    for (const c of categories) {
      if (c.slug === 'combo') return c._id;
      if (c.children?.length) {
        const found = findComboCategoryId(c.children);
        if (found) return found;
      }
    }
    return null;
  };

  const findCategorySlug = (categories, id) => {
    for (const c of categories) {
      if (c._id === id) return c.slug;
      if (c.children?.length) {
        const found = findCategorySlug(c.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const isProfileEffectCategory = categoryId && findCategorySlug(categoryTree, categoryId) === 'hieu-ung-ho-so';

  const openCreateComboModal = () => {
    resetForm();
    const comboId = findComboCategoryId(categoryTree);
    if (comboId) setCategoryId(comboId);
    setIsCombo(true);
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingId(product._id);
    setName(product.name);
    setPrice(product.price);
    setCategoryId(product.category?._id || '');
    setIsActive(product.isActive !== false); // Default to true if undefined
    setStaticImage(null);
    setAnimatedImage(null);
    setStaticPreview(product.staticUrl);
    setAnimatedPreview(product.animatedUrl);
    
    setIsCombo(product.isCombo || false);
    setComboItems(product.comboItems || []);
    
    setEffectLayerFiles([]);
    setEffectLayerPreviews(product.effectLayers || []);
    
    setError(null);
    setMessage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setCategoryId('');
    setIsActive(true);
    setStaticImage(null);
    setAnimatedImage(null);
    setStaticPreview(null);
    setAnimatedPreview(null);
    
    setIsCombo(false);
    setComboItems([]);
    
    setEffectLayerFiles([]);
    setEffectLayerPreviews([]);
    
    setError(null);
    
    // Clear file inputs if any
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => input.value = '');
  };

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

  // Submit Form (Create / Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let finalPrice = price;
    if (isCombo && (!price || price === '' || Number(price) <= 0)) {
      finalPrice = comboItems.reduce((acc, curr) => acc + (curr.price || 0), 0).toString();
      setPrice(finalPrice);
    }

    if (!name || finalPrice === '' || Number(finalPrice) <= 0) {
      setError('Vui lòng nhập Tên và Giá hợp lệ (phải lớn hơn 0)!');
      return;
    }

    if (!editingId && !isCombo) {
      if (isProfileEffectCategory) {
        if (!staticImage || effectLayerFiles.length === 0) {
          setError('Khi tạo mới hiệu ứng hồ sơ, vui lòng tải lên ảnh tĩnh và ít nhất 1 lớp hiệu ứng!');
          return;
        }
      } else {
        if (!staticImage || !animatedImage) {
          setError('Khi tạo mới, vui lòng tải lên đủ 2 ảnh tĩnh và động!');
          return;
        }
      }
    }

    try {
      setSubmitLoading(true);
      setError(null);
      setMessage(null);

      const formData = new FormData();
      formData.append('name', name);
      formData.append('price', Number(finalPrice));
      formData.append('isActive', isActive);
      if (categoryId) formData.append('category', categoryId);
      
      formData.append('isCombo', isCombo);
      if (isCombo && comboItems.length > 0) {
        formData.append('comboItems', JSON.stringify(comboItems.map(i => i._id)));
      }
      
      if (staticImage) formData.append('staticImage', staticImage);
      if (animatedImage) formData.append('animatedImage', animatedImage);
      
      // Append effect layers
      effectLayerFiles.forEach(file => {
        formData.append('effectLayers', file);
      });

      let result;
      if (editingId) {
        result = await productService.update(editingId, formData);
      } else {
        result = await productService.create(formData);
      }

      if (result.success) {
        setMessage(result.message);
        closeModal();
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

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-amber-500" />
            Quản Lý Sản Phẩm
          </h1>
          <p className="text-sm text-[#949ba4] mt-1">Tổng cộng {pagination.totalProducts} sản phẩm</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={openCreateComboModal}
            className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg"
          >
            <PlusCircle className="w-4 h-4" />
            Tạo Combo Sản Phẩm
          </button>
          <button
            onClick={openCreateModal}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg"
          >
            <PlusCircle className="w-4 h-4" />
            Thêm Sản Phẩm Mới
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm font-semibold mb-4 flex justify-between items-center">
          {message}
          <button onClick={() => setMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Filters Toolbar */}
      <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#1f2023] shadow-md mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#949ba4]" />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-56">
          <CategoryTreePicker
            treeData={categoryTree}
            selectedId={filterCat}
            onSelect={(id) => updateUrlParams({ category: id, page: 1 })}
            placeholder="— Lọc theo Danh mục —"
          />
        </div>

        {/* Sort Filter */}
        <div className="w-full md:w-48 relative">
          <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#949ba4] pointer-events-none" />
          <select
            value={sort}
            onChange={(e) => updateUrlParams({ sort: e.target.value, page: 1 })}
            className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 appearance-none"
          >
            <option value="newest">Mới nhất trước</option>
            <option value="oldest">Cũ nhất trước</option>
            <option value="price_asc">Giá tăng dần</option>
            <option value="price_desc">Giá giảm dần</option>
          </select>
        </div>

        {/* Clear Filters */}
        <button
          onClick={() => { setLocalSearch(''); setSearchParams({}); }}
          className="px-3 py-2 border border-[#35373c] text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded-lg text-sm font-semibold transition-colors"
        >
          Xóa Lọc
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-indigo-500/10 border border-indigo-500/30 p-3 rounded-lg flex items-center justify-between mb-4 animate-in fade-in slide-in-from-top-2">
          <span className="text-sm font-bold text-indigo-400">Đã chọn {selectedIds.length} sản phẩm</span>
          <div className="flex items-center gap-2">
            <select
              value={bulkActionType}
              onChange={(e) => setBulkActionType(e.target.value)}
              className="bg-[#1e1f22] border border-[#1f2023] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
            >
              <option value="">-- Chọn thao tác --</option>
              <option value="activate">Hiển thị (Active)</option>
              <option value="deactivate">Ẩn (Inactive)</option>
              <option value="delete">Xóa vĩnh viễn</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkActionType || loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Áp dụng
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex-1 bg-[#2b2d31] border border-[#1f2023] rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1e1f22] text-[#949ba4] text-xs uppercase border-b border-[#1f2023]">
                <th className="p-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selectedIds.length === products.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-[#35373c] bg-[#2b2d31] checked:bg-indigo-500 cursor-pointer"
                  />
                </th>
                <th className="p-4 font-bold">Hình ảnh</th>
                <th className="p-4 font-bold">Tên sản phẩm</th>
                <th className="p-4 font-bold">Danh mục</th>
                <th className="p-4 font-bold">Giá</th>
                <th className="p-4 font-bold">Trạng thái</th>
                <th className="p-4 font-bold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2023]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center">
                    <Loader className="w-6 h-6 animate-spin text-indigo-500 mx-auto" />
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-[#949ba4]">
                    Không tìm thấy sản phẩm nào.
                  </td>
                </tr>
              ) : (
                products.map((item) => {
                  const isBangTen = item.category?.slug?.includes('bang-ten') || 
                                    item.category?.name?.toLowerCase().includes('bảng tên') ||
                                    item.category?.name?.toLowerCase().includes('bang ten');
                  
                  return (
                    <tr key={item._id} className="hover:bg-[#35373c]/50 transition-colors group">
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item._id)}
                          onChange={(e) => handleSelectOne(e, item._id)}
                          className="w-4 h-4 rounded border-[#35373c] bg-[#2b2d31] checked:bg-indigo-500 cursor-pointer"
                        />
                      </td>
                      <td className="p-4">
                        <div className={`relative bg-slate-800 border border-slate-700 overflow-hidden group/img shadow-md
                          ${isBangTen ? 'w-24 h-8 rounded-md' : 'w-12 h-12 rounded-full'}
                        `}>
                          <img
                            src={item.staticUrl}
                            alt="Static"
                            className="w-full h-full object-cover absolute inset-0 group-hover/img:hidden"
                          />
                          <img
                            src={item.animatedUrl}
                            alt="Animated"
                            className="w-full h-full object-cover absolute inset-0 hidden group-hover/img:block"
                          />
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-bold text-white mb-0.5">
                          {item.name}
                          {item.isCombo && (
                            <span className="ml-2 text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30 uppercase tracking-wider font-extrabold">Combo ({item.comboItems?.length})</span>
                          )}
                        </p>
                        <p className="text-[10px] text-[#949ba4] font-mono">ID: {item._id}</p>
                      </td>
                      <td className="p-4">
                        {item.category ? (
                          <span className="inline-flex items-center gap-1 bg-[#35373c] text-[#dbdee1] px-2 py-1 rounded text-xs">
                            <Folder className="w-3 h-3" /> {item.category.name}
                          </span>
                        ) : (
                          <span className="text-xs text-[#949ba4] italic">Chưa phân loại</span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-sm font-extrabold text-amber-400 inline-flex items-center gap-1">
                            <Coins className="w-4 h-4" /> {item.price}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        {item.isActive !== false ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-xs font-bold border border-emerald-500/20">
                            <Eye className="w-3 h-3" /> Hiển thị
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-1 rounded text-xs font-bold border border-rose-500/20">
                            <EyeOff className="w-3 h-3" /> Đã ẩn
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400"
                            title="Sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-[#1f2023] mt-auto">
          <Pagination 
            page={pagination.page} 
            limit={pagination.limit}
            totalItems={pagination.totalProducts}
            totalPages={pagination.totalPages} 
            onPageChange={(p) => updateUrlParams({ page: p })} 
            onLimitChange={(l) => updateUrlParams({ limit: l, page: 1 })}
          />
        </div>
      </div>

      {/* ─── Modal Create/Edit ────────────────────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#2b2d31] w-full max-w-lg rounded-xl border border-[#1f2023] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-[#1f2023] flex items-center justify-between shrink-0">
              <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                {editingId ? <Pencil className="w-5 h-5 text-indigo-400" /> : <PlusCircle className="w-5 h-5 text-amber-500" />}
                {editingId ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}
              </h3>
              <button onClick={closeModal} className="text-[#949ba4] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm font-semibold mb-4">
                  {error}
                </div>
              )}
              
              <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#949ba4] uppercase">Tên Sản Phẩm *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Khung Lửa Địa Ngục"
                    className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="space-y-1 flex-1">
                    <label className="text-xs font-bold text-[#949ba4] uppercase flex items-center gap-2">
                      Giá (Coin) *
                      {isCombo && (
                        <button
                          type="button"
                          onClick={() => {
                            if (comboItems.length > 0) {
                              const sum = comboItems.reduce((acc, curr) => acc + curr.price, 0);
                              setPrice(sum.toString());
                            }
                          }}
                          className="bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors"
                          title="Tính lại tổng giá các món"
                        >
                          Cộng lại
                        </button>
                      )}
                    </label>
                    <input
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Ví dụ: 150"
                      min="1"
                      required
                      className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-[#949ba4] uppercase">Trạng thái</label>
                    <div className="flex items-center h-10 px-3 bg-[#1e1f22] border border-[#1f2023] rounded-lg">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => setIsActive(e.target.checked)}
                          className="w-4 h-4 rounded border-[#35373c] bg-[#2b2d31] checked:bg-emerald-500 cursor-pointer"
                        />
                        <span className="text-sm font-semibold text-white">Hiển thị</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#949ba4] uppercase">Danh mục sản phẩm</label>
                  <CategoryTreePicker
                    treeData={categoryTree}
                    selectedId={categoryId}
                    onSelect={(id) => {
                      setCategoryId(id);
                      const comboId = findComboCategoryId(categoryTree);
                      if (comboId && id === comboId) {
                        setIsCombo(true);
                      } else if (!editingId) {
                        setIsCombo(false);
                      }
                    }}
                  />
                </div>

                {/* Phân vùng Combo */}
                {isCombo && (
                  <div className="space-y-2 p-3 bg-indigo-500/5 border border-indigo-500/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-indigo-400 uppercase">Danh sách sản phẩm trong Combo</label>
                      <button
                        type="button"
                        onClick={() => setIsSelectorOpen(true)}
                        className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded font-semibold transition-colors"
                      >
                        {comboItems.length > 0 ? 'Sửa danh sách' : 'Chọn sản phẩm'}
                      </button>
                    </div>
                    {comboItems.length === 0 ? (
                      <p className="text-xs text-[#949ba4] italic">Chưa chọn sản phẩm nào.</p>
                    ) : (
                      <div className="space-y-1 mt-2">
                        {comboItems.map((item, idx) => (
                          <div key={item._id} className="flex items-center justify-between bg-[#1e1f22] border border-[#1f2023] rounded p-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-[#949ba4] font-mono">{idx + 1}.</span>
                              <span className="text-white font-semibold">{item.name}</span>
                            </div>
                            <span className="text-amber-400 font-bold">{item.price} Coin</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!isCombo && (
                  <>
                    {/* Upload Static */}
                    <div className="space-y-2 pt-2 border-t border-[#1f2023]">
                      <label className="text-xs font-bold text-[#949ba4] uppercase flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                        Ảnh Tĩnh (PNG/JPG) {editingId ? '(Tùy chọn)' : '*'}
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#35373c] hover:border-indigo-500 rounded-lg cursor-pointer bg-[#1e1f22] transition-colors">
                          <UploadCloud className="w-5 h-5 text-[#949ba4] mb-1" />
                          <span className="text-xs text-[#949ba4] font-semibold text-center">Tải lên ảnh tĩnh</span>
                          <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleStaticImageChange} />
                        </label>
                        {staticPreview && (
                          <div className="w-16 h-16 rounded-lg border border-[#35373c] overflow-hidden shrink-0 bg-black/50 flex items-center justify-center p-1">
                            <img src={staticPreview} alt="Static" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Upload Animated */}
                    {!isProfileEffectCategory && (
                      <div className="space-y-2">
                      <label className="text-xs font-bold text-[#949ba4] uppercase flex items-center gap-1">
                        <FileVideo className="w-3.5 h-3.5 text-rose-400" />
                        Ảnh Động (GIF/APNG) {editingId ? '(Tùy chọn)' : '*'}
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex-1 flex flex-col items-center justify-center p-3 border-2 border-dashed border-[#35373c] hover:border-indigo-500 rounded-lg cursor-pointer bg-[#1e1f22] transition-colors">
                          <UploadCloud className="w-5 h-5 text-[#949ba4] mb-1" />
                          <span className="text-xs text-[#949ba4] font-semibold text-center">Tải lên ảnh động</span>
                          <input type="file" accept="image/gif, image/webp, image/png, image/apng" className="hidden" onChange={handleAnimatedImageChange} />
                        </label>
                        {animatedPreview && (
                          <div className="w-16 h-16 rounded-lg border border-[#35373c] overflow-hidden shrink-0 bg-black/50 flex items-center justify-center p-1">
                            <img src={animatedPreview} alt="Animated" className="max-w-full max-h-full object-contain" />
                          </div>
                        )}
                      </div>
                    </div>
                    )}
                  </>
                )}

                {/* Effect Layers for hieu-ung-ho-so */}
                {isProfileEffectCategory && !isCombo && (
                  <div className="space-y-2 pt-2 border-t border-[#1f2023]">
                    <label className="text-xs font-bold text-purple-400 uppercase flex items-center gap-1">
                      <FileVideo className="w-3.5 h-3.5" />
                      Các lớp hiệu ứng (GIF/APNG) — Tối đa 5
                    </label>
                    <p className="text-[10px] text-[#949ba4]">Mỗi lớp sẽ được xếp chồng lên nhau để tạo hiệu ứng hồ sơ. Lớp đầu tiên ở dưới cùng.</p>
                    <div className="flex flex-wrap gap-2">
                      {effectLayerPreviews.map((preview, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-lg border border-[#35373c] overflow-hidden bg-black/50 group">
                          <img src={preview} alt={`Layer ${idx + 1}`} className="w-full h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => {
                              setEffectLayerPreviews(prev => prev.filter((_, i) => i !== idx));
                              setEffectLayerFiles(prev => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute top-0.5 right-0.5 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-black/70 text-white px-1 rounded">#{idx + 1}</span>
                        </div>
                      ))}
                      {effectLayerPreviews.length < 5 && (
                        <label className="w-20 h-20 flex flex-col items-center justify-center border-2 border-dashed border-[#35373c] hover:border-purple-500 rounded-lg cursor-pointer bg-[#1e1f22] transition-colors">
                          <UploadCloud className="w-5 h-5 text-[#949ba4] mb-1" />
                          <span className="text-[9px] text-[#949ba4] font-semibold">Thêm lớp</span>
                          <input type="file" accept="image/gif, image/png, image/apng, image/webp" className="hidden" onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              setEffectLayerFiles(prev => [...prev, file]);
                              setEffectLayerPreviews(prev => [...prev, URL.createObjectURL(file)]);
                            }
                            e.target.value = '';
                          }} />
                        </label>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>

            <div className="p-5 border-t border-[#1f2023] shrink-0 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-2.5 rounded-lg border border-[#35373c] text-white font-bold hover:bg-[#35373c] transition-colors"
              >
                Hủy
              </button>
              <button
                form="productForm"
                type="submit"
                disabled={submitLoading}
                className={`flex-1 py-2.5 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2 ${
                  editingId ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                } disabled:opacity-50`}
              >
                {submitLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editingId ? 'Lưu Thay Đổi' : 'Tạo Sản Phẩm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Combo Product Selector ───────────────────────────────────────────── */}
      {isSelectorOpen && (
        <ProductSelector 
          categoryTree={categoryTree}
          selectedItems={comboItems}
          excludeCombo={true}
          onSelect={(items) => {
            setComboItems(items);
            if (isCombo && items.length > 0) {
              const sum = items.reduce((acc, curr) => acc + curr.price, 0);
              setPrice(sum.toString());
            }
          }}
          onClose={() => setIsSelectorOpen(false)}
        />
      )}
    </div>
  );
}
