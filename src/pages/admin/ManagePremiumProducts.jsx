import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Sparkles, Loader, X, Trash2, Calendar, ShoppingBag, 
  Search, SlidersHorizontal, ChevronDown, Check, Save, Plus
} from 'lucide-react';
import productService from '../../services/admin/productService';
import categoryService from '../../services/admin/categoryService';
import Pagination from '../../components/Pagination';
import ProductSelector from '../../components/admin/ProductSelector';

export default function ManagePremiumProducts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const searchStr = searchParams.get('search') || '';
  const sort = searchParams.get('sort') || 'newest';

  const [localSearch, setLocalSearch] = useState(searchStr);
  const [premiumList, setPremiumList] = useState([]);
  const [pagination, setPagination] = useState({ totalPages: 1, totalItems: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  // Selector / Modal state
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);
  const [isPremiumSelectorOpen, setIsPremiumSelectorOpen] = useState(false);
  const [premiumSelectedItems, setPremiumSelectedItems] = useState([]);
  const [premiumStartDate, setPremiumStartDate] = useState('');
  const [premiumEndDate, setPremiumEndDate] = useState('');

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkActionType, setBulkActionType] = useState('');
  
  // Need category tree for ProductSelector
  const [categoryTree, setCategoryTree] = useState([]);

  useEffect(() => {
    fetchInitialData();
  }, [page, limit, searchStr, sort]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateUrlParams({ search: localSearch, page: 1 });
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [localSearch]);

  const updateUrlParams = (newParams) => {
    const current = Object.fromEntries([...searchParams]);
    setSearchParams({ ...current, ...newParams });
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [res, catRes] = await Promise.all([
        productService.getPremiumList({ page, limit, search: searchStr, sort }),
        categoryService.getAll()
      ]);

      if (res.success) {
        setPremiumList(res.data);
        if (res.pagination) {
          setPagination(res.pagination);
        }
      } else {
        setError(res.message);
      }

      if (catRes.success) {
        setCategoryTree(catRes.data);
      }
    } catch (err) {
      setError('Lỗi khi tải danh sách sản phẩm Premium!');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn gỡ sản phẩm này khỏi danh sách Premium?')) return;
    try {
      const res = await productService.deletePremium(id);
      if (res.success) {
        setMessage(res.message);
        fetchInitialData();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError('Lỗi khi xóa!');
    }
  };

  const handleBulkAction = async () => {
    if (selectedIds.length === 0) {
      setError('Vui lòng chọn ít nhất một sản phẩm để thao tác!');
      return;
    }
    if (!bulkActionType) {
      setError('Vui lòng chọn thao tác!');
      return;
    }

    if (bulkActionType === 'delete') {
      if (!window.confirm(`Bạn có chắc chắn muốn gỡ ${selectedIds.length} sản phẩm khỏi Premium?`)) return;
      try {
        setSubmitLoading(true);
        const res = await productService.bulkActionPremium(selectedIds, bulkActionType);
        if (res.success) {
          setMessage(res.message);
          setSelectedIds([]);
          fetchInitialData();
        } else {
          setError(res.message);
        }
      } catch (err) {
        setError('Có lỗi xảy ra khi thực hiện thao tác hàng loạt!');
      } finally {
        setSubmitLoading(false);
      }
    }
  };

  const handlePremiumSubmit = async () => {
    if (premiumSelectedItems.length === 0) {
      setError('Vui lòng chọn ít nhất một sản phẩm!');
      return;
    }
    if (!premiumStartDate || !premiumEndDate) {
      setError('Vui lòng chọn thời gian bắt đầu và kết thúc!');
      return;
    }
    try {
      setSubmitLoading(true);
      const res = await productService.setupPremium({
        products: premiumSelectedItems.map(p => p._id),
        startDate: premiumStartDate,
        endDate: premiumEndDate
      });
      if (res.success) {
        setMessage(res.message);
        setIsPremiumModalOpen(false);
        setPremiumSelectedItems([]);
        setPremiumStartDate('');
        setPremiumEndDate('');
        fetchInitialData();
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi lưu thiết lập!');
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === premiumList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(premiumList.map(item => item._id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(itemId => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', { 
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-pink-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-6 h-6" />
            Quản Lý Sản Phẩm Premium
          </h1>
          <p className="text-sm text-[#949ba4] mt-1">Quản lý và cấp phát phần thưởng cho hội viên VIP</p>
        </div>
        <button 
          onClick={() => setIsPremiumModalOpen(true)}
          className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Thêm Premium
        </button>
      </div>

      {message && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm font-semibold mb-4 flex justify-between items-center">
          {message}
          <button onClick={() => setMessage(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-sm font-semibold mb-4 flex justify-between items-center">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#1f2023] mb-4 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center z-10 relative">
        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Bulk Action */}
          <div className="flex bg-[#1e1f22] border border-[#1f2023] rounded-lg overflow-hidden shrink-0">
            <select 
              value={bulkActionType}
              onChange={(e) => setBulkActionType(e.target.value)}
              className="bg-transparent text-sm text-[#dbdee1] p-2 outline-none border-r border-[#1f2023] w-[140px] appearance-none"
            >
              <option value="">Thao tác...</option>
              <option value="delete">Xóa đã chọn</option>
            </select>
            <button 
              onClick={handleBulkAction}
              disabled={submitLoading || selectedIds.length === 0}
              className="px-3 hover:bg-[#35373c] transition-colors disabled:opacity-50 text-white text-sm font-semibold"
            >
              Áp dụng
            </button>
          </div>

          <div className="w-px h-6 bg-[#1f2023] mx-1"></div>

          {/* Sort */}
          <div className="relative flex items-center bg-[#1e1f22] border border-[#1f2023] rounded-lg px-3 py-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-[#949ba4] mr-2" />
            <select 
              value={sort}
              onChange={(e) => updateUrlParams({ sort: e.target.value, page: 1 })}
              className="bg-transparent text-sm text-[#dbdee1] outline-none appearance-none pr-4"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Cũ nhất</option>
            </select>
            <ChevronDown className="w-4 h-4 text-[#949ba4] absolute right-2 pointer-events-none" />
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <input 
            type="text" 
            placeholder="Tìm kiếm sản phẩm gốc..." 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg pl-10 pr-4 py-2 text-sm text-[#dbdee1] focus:outline-none focus:border-pink-500 transition-colors"
          />
          <Search className="w-4 h-4 text-[#949ba4] absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      <div className="flex-1 bg-[#2b2d31] rounded-xl border border-[#1f2023] shadow-md flex flex-col overflow-hidden relative">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <Loader className="w-8 h-8 animate-spin text-pink-500" />
          </div>
        ) : premiumList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[#949ba4]">
            <Sparkles className="w-12 h-12 mb-3 opacity-20" />
            <p>Không tìm thấy sản phẩm Premium nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1e1f22] text-[#949ba4] text-xs uppercase tracking-wider">
                  <th className="p-4 w-12 text-center rounded-tl-xl">
                    <button 
                      onClick={toggleSelectAll}
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        selectedIds.length === premiumList.length 
                          ? 'bg-pink-500 border-pink-500 text-white' 
                          : 'border-[#35373c] hover:border-[#949ba4]'
                      }`}
                    >
                      {selectedIds.length === premiumList.length && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 font-bold">Sản Phẩm</th>
                  <th className="px-6 py-4 font-bold">Thời Gian Bắt Đầu</th>
                  <th className="px-6 py-4 font-bold">Thời Gian Kết Thúc</th>
                  <th className="px-6 py-4 font-bold rounded-tr-xl text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2023]">
                {premiumList.map((item) => (
                  <tr key={item._id} className="hover:bg-[#35373c]/50 transition-colors group">
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => toggleSelect(item._id)}
                        className={`w-5 h-5 rounded flex items-center justify-center border transition-colors mx-auto ${
                          selectedIds.includes(item._id)
                            ? 'bg-pink-500 border-pink-500 text-white' 
                            : 'border-[#35373c] group-hover:border-[#949ba4]'
                        }`}
                      >
                        {selectedIds.includes(item._id) && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-black/50 border border-[#1f2023] overflow-hidden flex items-center justify-center shrink-0">
                          <img 
                            src={item.product?.staticUrl || item.product?.animatedUrl} 
                            alt={item.product?.name} 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm">{item.product?.name || 'Sản phẩm đã bị xóa'}</div>
                          <div className="text-xs text-[#949ba4] flex items-center gap-1 mt-1">
                            <ShoppingBag className="w-3 h-3" />
                            Giá Gốc: {item.product?.price || 0}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-[#dbdee1]">
                        <Calendar className="w-4 h-4 text-emerald-400" />
                        {formatDate(item.startDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-[#dbdee1]">
                        <Calendar className="w-4 h-4 text-rose-400" />
                        {formatDate(item.endDate)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="text-[#949ba4] hover:text-rose-400 hover:bg-rose-400/10 p-2 rounded-lg transition-colors"
                        title="Gỡ khỏi Premium"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Section */}
        {pagination.totalPages > 1 && (
          <div className="border-t border-[#1f2023] p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-[#949ba4]">
              Hiển thị <span className="text-white font-semibold">{(page - 1) * limit + 1}</span> đến <span className="text-white font-semibold">{Math.min(page * limit, pagination.totalItems)}</span> trong số <span className="text-white font-semibold">{pagination.totalItems}</span> mục
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-[#949ba4]">
                <span className="hidden md:inline">Hiển thị:</span>
                <select 
                  value={limit}
                  onChange={(e) => updateUrlParams({ limit: e.target.value, page: 1 })}
                  className="bg-[#1e1f22] border border-[#1f2023] rounded px-2 py-1 outline-none text-[#dbdee1]"
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
              </div>
              <Pagination 
                currentPage={page} 
                totalPages={pagination.totalPages} 
                onPageChange={(p) => updateUrlParams({ page: p })} 
              />
            </div>
          </div>
        )}
      </div>

      {/* ─── Premium Product Modal (UI Only) ───────────────────────────────────────────── */}
      {isPremiumModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#2b2d31] rounded-xl border border-[#1f2023] w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
            
            <div className="flex items-center justify-between p-5 border-b border-[#1f2023] bg-[#232428]">
              <h2 className="text-lg font-black text-pink-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Cài Đặt Sản Phẩm Premium
              </h2>
              <button 
                onClick={() => setIsPremiumModalOpen(false)}
                className="text-[#949ba4] hover:text-white transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#949ba4] uppercase">Danh Sách Sản Phẩm Gốc *</label>
                  <button
                    type="button"
                    onClick={() => setIsPremiumSelectorOpen(true)}
                    className="text-[10px] bg-pink-500 hover:bg-pink-600 text-white px-2 py-1 rounded font-bold transition-colors shadow-sm"
                  >
                    Chọn sản phẩm
                  </button>
                </div>
                
                {premiumSelectedItems.length > 0 ? (
                  <div className="bg-[#1e1f22] rounded-lg p-2 max-h-[150px] overflow-y-auto space-y-1.5 border border-[#1f2023]">
                    {premiumSelectedItems.map((item) => (
                      <div key={item._id} className="flex items-center justify-between bg-[#2b2d31] p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <img src={item.staticUrl || item.animatedUrl} alt="" className="w-8 h-8 rounded-md bg-[#1e1f22] object-cover" />
                          <span className="text-sm font-semibold text-white">{item.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPremiumSelectedItems(prev => prev.filter(p => p._id !== item._id))}
                          className="text-red-400 hover:bg-red-400/10 p-1.5 rounded-md"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg p-4 text-sm text-[#949ba4] text-center italic">
                    Chưa chọn sản phẩm nào.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#949ba4] uppercase">Thời gian bắt đầu *</label>
                  <input 
                    type="datetime-local" 
                    value={premiumStartDate}
                    onChange={(e) => setPremiumStartDate(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-pink-500" 
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#949ba4] uppercase">Thời gian kết thúc *</label>
                  <input 
                    type="datetime-local" 
                    value={premiumEndDate}
                    onChange={(e) => setPremiumEndDate(e.target.value)}
                    className="w-full bg-[#1e1f22] border border-[#1f2023] rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-pink-500" 
                  />
                </div>
              </div>

              <div className="bg-pink-500/10 border border-pink-500/20 p-3 rounded-lg flex gap-3 mt-4">
                <Sparkles className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
                <div className="text-sm text-pink-100">
                  <p className="font-bold mb-1">Ghi chú</p>
                  <p className="text-xs opacity-80">Sản phẩm này sẽ trở thành Premium Perk trong khoảng thời gian được thiết lập. (Tính năng đang xây dựng giao diện)</p>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-[#1f2023] shrink-0 flex gap-3">
              <button
                type="button"
                onClick={() => setIsPremiumModalOpen(false)}
                className="flex-1 py-2.5 rounded-lg border border-[#35373c] text-white font-bold hover:bg-[#35373c] transition-colors"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handlePremiumSubmit}
                disabled={submitLoading}
                className="flex-1 py-2.5 rounded-lg font-bold text-white transition-colors flex items-center justify-center gap-2 bg-pink-500 hover:bg-pink-600 disabled:opacity-50"
              >
                {submitLoading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Premium Product Selector ───────────────────────────────────────────── */}
      {isPremiumSelectorOpen && (
        <ProductSelector 
          categoryTree={categoryTree}
          selectedItems={premiumSelectedItems}
          excludePremium={true}
          onSelect={setPremiumSelectedItems}
          onClose={() => setIsPremiumSelectorOpen(false)}
        />
      )}
    </div>
  );
}
