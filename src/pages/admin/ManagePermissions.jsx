import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPermissions, createPermission, deletePermission, clearAdminError } from '../../redux/slices/adminSlice';
import { Key, Plus, Trash2, Loader2, AlertCircle, Sparkles, X } from 'lucide-react';

export default function ManagePermissions() {
  const dispatch = useDispatch();
  const { permissions, isLoading, error } = useSelector((state) => state.admin);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [validationError, setValidationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    dispatch(fetchPermissions());
  }, [dispatch]);

  const handleOpenModal = () => {
    setName('');
    setDescription('');
    setValidationError('');
    setSuccessMsg('');
    dispatch(clearAdminError());
    setShowModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMsg('');

    if (!name.trim() || !description.trim()) {
      setValidationError('Vui lòng nhập đầy đủ Tên Quyền và Mô Tả!');
      return;
    }

    try {
      const resultAction = await dispatch(createPermission({ name: name.trim(), description: description.trim() }));
      if (createPermission.fulfilled.match(resultAction)) {
        setSuccessMsg('Tạo quyền hạn mới thành công!');
        setName('');
        setDescription('');
        setTimeout(() => {
          setShowModal(false);
          setSuccessMsg('');
        }, 1000);
      }
    } catch (err) {
      setValidationError('Đã xảy ra lỗi khi tạo quyền hạn!');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa quyền hạn này không? Hành động này không thể hoàn tác!')) {
      await dispatch(deletePermission(id));
    }
  };

  return (
    <div className="p-6 space-y-6 text-[#dbdee1]">
      {/* 🔴 HEADER BAR */}
      <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1f2023]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight uppercase">
            <Key className="w-5 h-5 text-pink-400 animate-pulse" /> Quản Lý Quyền Hạn (Permissions)
          </h2>
          <p className="text-xs text-[#949ba4] font-medium">Định nghĩa các mã định danh phân quyền hạt mịn của toàn hệ thống Vetrix</p>
        </div>
        <button
          onClick={handleOpenModal}
          className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2.5 rounded-md font-bold text-xs shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Thêm Quyền Mới
        </button>
      </div>

      {/* 🔴 SYSTEM ERROR ALERT */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 🔴 DATA TABLE CONTAINER */}
      <div className="bg-[#2b2d31] rounded-xl border border-[#1f2023]/40 overflow-hidden shadow-2xl">
        {isLoading && permissions.length === 0 ? (
          <div className="p-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-pink-400 mx-auto" />
            <p className="text-xs text-[#949ba4] font-medium">Đang truy vấn danh sách quyền hạn...</p>
          </div>
        ) : permissions.length === 0 ? (
          <div className="p-20 text-center space-y-2">
            <Key className="w-10 h-10 text-[#4e5058] mx-auto" />
            <p className="text-sm font-bold text-[#b5bac1]">Chưa có quyền hạn nào được khởi tạo</p>
            <p className="text-xs text-[#949ba4]">Click "Thêm Quyền Mới" ở góc trên để bắt đầu định nghĩa.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1e1f22] text-[#949ba4] uppercase font-bold border-b border-[#1f2023]/40">
                  <th className="p-4 w-[35%]">Mã định danh (Key)</th>
                  <th className="p-4 w-[50%]">Mô Tả Chức Năng</th>
                  <th className="p-4 w-[15%] text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2023]/20">
                {permissions.map((perm) => (
                  <tr key={perm._id} className="hover:bg-[#313338]/50 transition-colors">
                    <td className="p-4 font-mono text-pink-400 font-bold text-xs tracking-wide">
                      {perm.name}
                    </td>
                    <td className="p-4 text-[#b5bac1] font-medium leading-relaxed">
                      {perm.description}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDelete(perm._id)}
                        className="p-2 hover:bg-rose-500/10 text-[#949ba4] hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                        title="Xóa Quyền Hạn"
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
      </div>

      {/* 🔴 DIALOG MODAL: CREATE PERMISSION */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-[#2b2d31] rounded-xl border border-[#1f2023]/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1e1f22] border-b border-[#1f2023]/40 flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Key className="w-4 h-4 text-pink-400" /> Tạo Mới Quyền Hạn
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#949ba4] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {validationError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-semibold text-center">
                  {validationError}
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 animate-bounce" /> {successMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
                  Mã Định Danh Quyền <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: views_products"
                  className="w-full h-10 bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-sm text-white focus:outline-none focus:border-pink-500 font-mono transition-colors"
                  required
                />
                <p className="text-[10px] text-[#949ba4]">Nên sử dụng chữ thường, ngăn cách bằng dấu gạch dưới.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
                  Mô Tả Chi Tiết <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả cụ thể vai trò của quyền này trong hệ thống..."
                  rows={3}
                  className="w-full bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-sm text-white focus:outline-none focus:border-pink-500 transition-colors resize-none"
                  required
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#1f2023]/30 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 hover:bg-[#35373c] text-white rounded font-bold text-xs transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded font-bold text-xs shadow-lg transition-all active:scale-[0.97] cursor-pointer"
                >
                  Xác nhận Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
