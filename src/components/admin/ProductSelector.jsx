import React, { useState, useEffect } from 'react';
import { Search, Loader, X, Folder, Coins } from 'lucide-react';
import productService from '../../services/admin/productService';
import Pagination from '../Pagination';

export default function ProductSelector({ categoryTree, selectedItems, onSelect, onClose, excludeCombo = false, excludePremium = false }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States cho tìm kiếm và phân trang
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [pagination, setPagination] = useState({ totalPages: 1, totalProducts: 0 });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchProducts();
  }, [debouncedSearch, page, limit]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Gọi chung hàm getAll, truyền vào limit và search
      const res = await productService.getAll({ page, limit, search: debouncedSearch, excludeCombo, excludePremium });
      if (res.success) {
        setProducts(res.data);
        setPagination({
          totalPages: res.pagination.totalPages,
          totalProducts: res.pagination.totalProducts
        });
      }
    } catch (err) {
      console.error('Lỗi khi tải sản phẩm', err);
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (id) => selectedItems.some(item => item._id === id);

  const toggleSelect = (product) => {
    if (isSelected(product._id)) {
      onSelect(selectedItems.filter(item => item._id !== product._id));
    } else {
      onSelect([...selectedItems, product]);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#2b2d31] w-full max-w-2xl rounded-xl border border-[#1f2023] shadow-2xl flex flex-col max-h-[85vh]">
        <div className="p-4 border-b border-[#1f2023] flex items-center justify-between shrink-0">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            Chọn Sản Phẩm Vào Combo
            <span className="text-xs font-normal text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
              Đã chọn {selectedItems.length}
            </span>
          </h3>
          <button onClick={onClose} className="text-[#949ba4] hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-[#1f2023] shrink-0 bg-[#1e1f22]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#949ba4]" />
            <input
              type="text"
              placeholder="Tìm theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#2b2d31] border border-[#1f2023] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex justify-center py-8"><Loader className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : products.length === 0 ? (
            <p className="text-center text-[#949ba4] py-8 text-sm">Không tìm thấy sản phẩm nào.</p>
          ) : (
            products.map((item) => (
              <div 
                key={item._id} 
                onClick={() => toggleSelect(item)}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  isSelected(item._id) 
                    ? 'bg-indigo-500/10 border-indigo-500/50' 
                    : 'bg-[#1e1f22] border-[#1f2023] hover:border-[#35373c]'
                }`}
              >
                <div className="w-10 h-10 rounded bg-black/50 overflow-hidden shrink-0 flex items-center justify-center">
                  <img src={item.staticUrl} alt={item.name} className="max-w-full max-h-full object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">{item.name}</p>
                  <p className="text-xs text-[#949ba4] flex items-center gap-1">
                    <Folder className="w-3 h-3" /> {item.category?.name || 'Chưa phân loại'}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> {item.price}
                  </span>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected(item._id) ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-[#35373c]'
                  }`}>
                    {isSelected(item._id) && <X className="w-3 h-3 rotate-45" style={{ transform: 'rotate(0)' }} />}
                    {/* Wait, I should use a Check icon if selected */}
                    {isSelected(item._id) && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[#1f2023] shrink-0">
          <Pagination 
            page={page} 
            limit={limit}
            totalItems={pagination.totalProducts}
            totalPages={pagination.totalPages} 
            onPageChange={setPage} 
            onLimitChange={(l) => { setLimit(l); setPage(1); }}
          />
        </div>
        
        <div className="p-4 border-t border-[#1f2023] bg-[#1e1f22] rounded-b-xl shrink-0">
          <button 
            onClick={onClose}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-lg transition-colors"
          >
            Xong
          </button>
        </div>
      </div>
    </div>
  );
}
