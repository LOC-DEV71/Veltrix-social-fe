import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAccounts, fetchRoles, createAccount, updateAccount, deleteAccount, clearAdminError } from '../../redux/slices/adminSlice';
import { ShieldCheck, Plus, Pencil, Trash2, Loader2, AlertCircle, Sparkles, X, ToggleLeft, ToggleRight } from 'lucide-react';

export default function ManageAccounts() {
  const dispatch = useDispatch();
  const { accounts, roles, isLoading, error } = useSelector((state) => state.admin);
  const currentUser = useSelector((state) => state.auth.user);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  // Fields state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState(true);
  
  const [validationError, setValidationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    dispatch(fetchAccounts());
    dispatch(fetchRoles());
  }, [dispatch]);

  const handleOpenAddModal = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setRole(roles.length > 0 ? roles[0]._id : '');
    setIsActive(true);
    setValidationError('');
    setSuccessMsg('');
    setIsEditMode(false);
    dispatch(clearAdminError());
    setShowModal(true);
  };

  const handleOpenEditModal = (acc) => {
    setUsername(acc.username);
    setEmail(acc.email);
    setPassword(''); // Mật khẩu để trống khi sửa
    setRole(acc.role && typeof acc.role === 'object' ? acc.role._id : acc.role || '');
    setIsActive(acc.isActive);
    setValidationError('');
    setSuccessMsg('');
    setIsEditMode(true);
    setSelectedAccountId(acc._id);
    dispatch(clearAdminError());
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMsg('');

    if (!username.trim() || !email.trim() || (!isEditMode && !password)) {
      setValidationError('Vui lòng điền đầy đủ các trường thông tin bắt buộc!');
      return;
    }

    if (!role) {
      setValidationError('Vui lòng chọn một vai trò (Role) cho tài khoản này!');
      return;
    }

    const payload = {
      username: username.trim(),
      email: email.trim(),
      role,
      isActive
    };

    if (password) {
      payload.password = password;
    }

    try {
      let resultAction;
      if (isEditMode) {
        resultAction = await dispatch(updateAccount({ id: selectedAccountId, data: payload }));
      } else {
        resultAction = await dispatch(createAccount(payload));
      }

      if (createAccount.fulfilled.match(resultAction) || updateAccount.fulfilled.match(resultAction)) {
        setSuccessMsg(isEditMode ? 'Cập nhật tài khoản thành công!' : 'Khởi tạo tài khoản mới thành công!');
        setTimeout(() => {
          setShowModal(false);
          setSuccessMsg('');
        }, 1000);
      }
    } catch (err) {
      setValidationError('Đã xảy ra lỗi trong quá trình xử lý tài khoản!');
    }
  };

  const handleDelete = async (id, name) => {
    if (currentUser && currentUser._id === id) {
      alert('🔒 Bạn không được phép tự xóa tài khoản của chính mình!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa tài khoản của "${name}" khỏi hệ thống?`)) {
      await dispatch(deleteAccount(id));
    }
  };

  return (
    <div className="p-6 space-y-6 text-[#dbdee1]">
      {/* 🔵 HEADER BAR */}
      <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1f2023]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight uppercase">
            <ShieldCheck className="w-5 h-5 text-indigo-400 animate-pulse" /> Quản Lý Tài Khoản Nội Bộ
          </h2>
          <p className="text-xs text-[#949ba4] font-medium">Theo dõi, cấp mới và phân quyền hạn cho các tài khoản cán bộ quản trị</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-md font-bold text-xs shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tạo Tài Khoản
        </button>
      </div>

      {/* 🔵 SYSTEM ERROR ALERT */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 🔵 DATA TABLE CONTAINER */}
      <div className="bg-[#2b2d31] rounded-xl border border-[#1f2023]/40 overflow-hidden shadow-2xl">
        {isLoading && accounts.length === 0 ? (
          <div className="p-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
            <p className="text-xs text-[#949ba4] font-medium">Đang truy vấn danh sách tài khoản nội bộ...</p>
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-20 text-center space-y-2">
            <ShieldCheck className="w-10 h-10 text-[#4e5058] mx-auto" />
            <p className="text-sm font-bold text-[#b5bac1]">Chưa có tài khoản quản trị nào</p>
            <p className="text-xs text-[#949ba4]">Click "Tạo Tài Khoản" để khởi tạo tài khoản quản lý nhân sự đầu tiên.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1e1f22] text-[#949ba4] uppercase font-bold border-b border-[#1f2023]/40">
                  <th className="p-4 w-[25%]">Tên tài khoản (Username)</th>
                  <th className="p-4 w-[30%]">Địa chỉ Email</th>
                  <th className="p-4 w-[20%]">Chức Vụ (Role)</th>
                  <th className="p-4 w-[15%]">Trạng Thái</th>
                  <th className="p-4 w-[10%] text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2023]/20">
                {accounts.map((acc) => {
                  const roleName = acc.role && typeof acc.role === 'object' ? acc.role.name : 'Chưa gán vai trò';
                  const isCurrent = currentUser && currentUser._id === acc._id;
                  
                  return (
                    <tr key={acc._id} className="hover:bg-[#313338]/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-white text-sm">
                            {acc.username}
                          </span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.5 rounded bg-[#1e1f22] text-[8px] text-[#00a8fc] border border-[#00a8fc]/20 font-bold uppercase">
                              Bạn
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-indigo-400 font-semibold">{acc.email}</td>
                      <td className="p-4">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 font-black uppercase text-[9px] tracking-wider">
                          {roleName}
                        </span>
                      </td>
                      <td className="p-4">
                        {acc.isActive ? (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold text-[10px]">
                            Đang hoạt động
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-[#4e5058]/20 border border-[#4e5058]/30 text-[#949ba4] font-extrabold text-[10px]">
                            Vô hiệu hóa
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right space-x-1">
                        <button
                          onClick={() => handleOpenEditModal(acc)}
                          className="p-2 hover:bg-indigo-500/10 text-[#949ba4] hover:text-indigo-400 rounded-md transition-colors cursor-pointer"
                          title="Sửa thông tin tài khoản"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(acc._id, acc.username)}
                          className={`p-2 rounded-md transition-colors cursor-pointer ${
                            isCurrent
                              ? 'text-[#4e5058] cursor-not-allowed opacity-40'
                              : 'hover:bg-rose-500/10 text-[#949ba4] hover:text-rose-400'
                          }`}
                          disabled={isCurrent}
                          title={isCurrent ? '🔒 Bạn không được tự xóa chính mình' : 'Xóa tài khoản'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 🔵 DIALOG MODAL: CREATE/EDIT ACCOUNT */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[480px] bg-[#2b2d31] rounded-xl border border-[#1f2023]/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1e1f22] border-b border-[#1f2023]/40 flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" /> {isEditMode ? 'Cập Nhật Tài Khoản' : 'Thêm Tài Khoản Mới'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-[#949ba4] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {validationError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-lg text-xs font-semibold text-center animate-pulse">
                  {validationError}
                </div>
              )}
              {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs font-semibold text-center flex items-center justify-center gap-1 animate-pulse">
                  <Sparkles className="w-3.5 h-3.5 animate-bounce" /> {successMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
                  Tên tài khoản (Username) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ví dụ: khangadmin"
                  className="w-full h-10 bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
                  Địa Chỉ Email <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@vetrix.com"
                  className="w-full h-10 bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
                  Mật khẩu truy cập {isEditMode ? '(Để trống nếu giữ nguyên)' : <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isEditMode ? "•••••••••••• (Không đổi)" : "••••••••••••"}
                  className="w-full h-10 bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required={!isEditMode}
                />
              </div>

              {/* Dropdown for role selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
                  Chức vụ / Vai trò (Role) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-10 bg-[#1e1f22] border border-[#1f2023] rounded px-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  required
                >
                  <option value="" disabled>--- Chọn vai trò thành viên ---</option>
                  {roles.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggle isActive switch */}
              <div className="flex items-center justify-between p-3 bg-[#1e1f22] rounded border border-[#1f2023]">
                <div className="space-y-0.5">
                  <span className="text-xs text-white font-bold block">Trạng thái tài khoản</span>
                  <span className="text-[10px] text-[#949ba4] block">Cho phép đăng nhập và gọi API</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="text-[#b5bac1] hover:text-white transition-colors cursor-pointer"
                  disabled={selectedAccountId === currentUser?._id}
                >
                  {isActive ? (
                    <ToggleRight className="w-9 h-9 text-emerald-500" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-[#4e5058]" />
                  )}
                </button>
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
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs shadow-lg transition-all active:scale-[0.97] cursor-pointer"
                >
                  {isEditMode ? 'Lưu Thay Đổi' : 'Xác nhận Tạo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
