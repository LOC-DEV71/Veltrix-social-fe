import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRoles, fetchPermissions, createRole, updateRole, deleteRole, clearAdminError } from '../../redux/slices/adminSlice';
import { UserCheck, Plus, Pencil, Trash2, Loader2, AlertCircle, Sparkles, X, ShieldAlert } from 'lucide-react';

export default function ManageRoles() {
  const dispatch = useDispatch();
  const { roles, permissions, isLoading, error } = useSelector((state) => state.admin);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  
  // Fields state
  const [name, setName] = useState('');
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [validationError, setValidationError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    dispatch(fetchRoles());
    dispatch(fetchPermissions());
  }, [dispatch]);

  const handleOpenAddModal = () => {
    setName('');
    setSelectedPermissionIds([]);
    setValidationError('');
    setSuccessMsg('');
    setIsEditMode(false);
    dispatch(clearAdminError());
    setShowModal(true);
  };

  const handleOpenEditModal = (role) => {
    setName(role.name);
    // Populate checked permission IDs from role.permissions
    const permIds = role.permissions.map(p => typeof p === 'object' ? p._id : p);
    setSelectedPermissionIds(permIds);
    setValidationError('');
    setSuccessMsg('');
    setIsEditMode(true);
    setSelectedRoleId(role._id);
    dispatch(clearAdminError());
    setShowModal(true);
  };

  const handleCheckboxChange = (permId) => {
    setSelectedPermissionIds(prev => 
      prev.includes(permId) 
        ? prev.filter(id => id !== permId) 
        : [...prev, permId]
    );
  };

  const handleSelectAllPermissions = () => {
    if (selectedPermissionIds.length === permissions.length) {
      setSelectedPermissionIds([]); // Deselect all
    } else {
      setSelectedPermissionIds(permissions.map(p => p._id)); // Select all
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setSuccessMsg('');

    if (!name.trim()) {
      setValidationError('Tên vai trò không được để trống!');
      return;
    }

    const payload = {
      name: name.trim(),
      permissions: selectedPermissionIds
    };

    try {
      let resultAction;
      if (isEditMode) {
        resultAction = await dispatch(updateRole({ id: selectedRoleId, data: payload }));
      } else {
        resultAction = await dispatch(createRole(payload));
      }

      if (createRole.fulfilled.match(resultAction) || updateRole.fulfilled.match(resultAction)) {
        setSuccessMsg(isEditMode ? 'Cập nhật vai trò thành công!' : 'Tạo vai trò mới thành công!');
        setTimeout(() => {
          setShowModal(false);
          setSuccessMsg('');
        }, 1000);
      }
    } catch (err) {
      setValidationError('Đã xảy ra lỗi trong quá trình xử lý vai trò!');
    }
  };

  const handleDelete = async (id, roleName) => {
    if (roleName === 'Super Admin') {
      alert('🔒 Không thể xóa vai trò tối cao Super Admin!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa vai trò "${roleName}" không?`)) {
      await dispatch(deleteRole(id));
    }
  };

  return (
    <div className="p-6 space-y-6 text-[#dbdee1]">
      {/* 🟣 HEADER BAR */}
      <div className="bg-[#2b2d31] p-6 rounded-xl border border-[#1f2023]/40 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-white flex items-center gap-2 tracking-tight uppercase">
            <UserCheck className="w-5 h-5 text-purple-400 animate-pulse" /> Quản Lý Vai Trò (Roles)
          </h2>
          <p className="text-xs text-[#949ba4] font-medium">Thiết lập các nhóm chức danh và phân bổ ma trận quyền hạn cho ban quản trị</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-md font-bold text-xs shadow-lg transition-all active:scale-[0.97] flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Tạo Vai Trò Mới
        </button>
      </div>

      {/* 🟣 SYSTEM ERROR ALERT */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 🟣 DATA TABLE CONTAINER */}
      <div className="bg-[#2b2d31] rounded-xl border border-[#1f2023]/40 overflow-hidden shadow-2xl">
        {isLoading && roles.length === 0 ? (
          <div className="p-20 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto" />
            <p className="text-xs text-[#949ba4] font-medium">Đang truy vấn danh sách vai trò...</p>
          </div>
        ) : roles.length === 0 ? (
          <div className="p-20 text-center space-y-2">
            <UserCheck className="w-10 h-10 text-[#4e5058] mx-auto" />
            <p className="text-sm font-bold text-[#b5bac1]">Chưa có vai trò nào được khởi tạo</p>
            <p className="text-xs text-[#949ba4]">Click "Tạo Vai Trò Mới" ở góc trên để cấu hình vai trò quản trị.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1e1f22] text-[#949ba4] uppercase font-bold border-b border-[#1f2023]/40">
                  <th className="p-4 w-[25%]">Tên Vai Trò</th>
                  <th className="p-4 w-[60%]">Quyền Hạn Được Gán</th>
                  <th className="p-4 w-[15%] text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2023]/20">
                {roles.map((role) => (
                  <tr key={role._id} className="hover:bg-[#313338]/50 transition-colors">
                    <td className="p-4">
                      <span className="font-extrabold text-purple-400 text-sm tracking-wide">
                        {role.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[650px]">
                        {role.permissions && role.permissions.length > 0 ? (
                          role.permissions.map((p) => {
                            const name = typeof p === 'object' ? p.name : p;
                            return (
                              <span
                                key={typeof p === 'object' ? p._id : p}
                                className="px-2 py-0.5 rounded bg-[#1e1f22] text-[10px] text-[#b5bac1] border border-[#1f2023] font-mono shadow-sm"
                              >
                                {name}
                              </span>
                            );
                          })
                        ) : (
                          <span className="text-[11px] text-[#949ba4] italic">Chưa được cấp quyền nào</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEditModal(role)}
                        className="p-2 hover:bg-purple-500/10 text-[#949ba4] hover:text-purple-400 rounded-md transition-colors cursor-pointer"
                        title="Chỉnh sửa vai trò"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(role._id, role.name)}
                        className="p-2 hover:bg-rose-500/10 text-[#949ba4] hover:text-rose-400 rounded-md transition-colors cursor-pointer"
                        disabled={role.name === 'Super Admin'}
                        title={role.name === 'Super Admin' ? '🔒 Vai trò tối cao không thể xóa' : 'Xóa vai trò'}
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

      {/* 🟣 DIALOG MODAL: CREATE/EDIT ROLE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[550px] bg-[#2b2d31] rounded-xl border border-[#1f2023]/60 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-[#1e1f22] border-b border-[#1f2023]/40 flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-400" /> {isEditMode ? 'Cập Nhật Vai Trò' : 'Tạo Mới Vai Trò'}
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
                  Tên Vai Trò <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Product Manager"
                  className="w-full h-10 bg-[#1e1f22] border border-[#1f2023] rounded p-3 text-sm text-white focus:outline-none focus:border-purple-500 transition-colors font-semibold"
                  required
                  disabled={isEditMode && name === 'Super Admin'}
                />
                {isEditMode && name === 'Super Admin' && (
                  <p className="text-[10px] text-amber-500 flex items-center gap-1 mt-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> Không được đổi tên của vai trò tối cao.
                  </p>
                )}
              </div>

              {/* Checkbox Permission selection matrix */}
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#1f2023]/30 pb-1">
                  <label className="text-[10px] font-bold text-[#b5bac1] uppercase tracking-wider">
                    Phân Phối Quyền Hạn ({selectedPermissionIds.length}/{permissions.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllPermissions}
                    className="text-[10px] text-purple-400 hover:underline font-bold"
                  >
                    {selectedPermissionIds.length === permissions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                  </button>
                </div>

                <div className="bg-[#1e1f22] rounded border border-[#1f2023] p-3 max-h-[220px] overflow-y-auto space-y-2 no-scrollbar">
                  {permissions.length === 0 ? (
                    <p className="text-xs text-[#949ba4] italic text-center py-4">Chưa có quyền hạn nào được khai báo trên hệ thống!</p>
                  ) : (
                    permissions.map((perm) => {
                      const isChecked = selectedPermissionIds.includes(perm._id);
                      return (
                        <label
                          key={perm._id}
                          className={`flex items-start gap-2.5 p-2 rounded cursor-pointer transition-colors ${
                            isChecked ? 'bg-purple-950/20 border border-purple-500/20' : 'hover:bg-[#2b2d31]/50 border border-transparent'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(perm._id)}
                            className="mt-0.5 accent-purple-500 cursor-pointer"
                          />
                          <div className="space-y-0.5">
                            <span className="text-xs font-mono text-purple-300 font-bold block">{perm.name}</span>
                            <span className="text-[10px] text-[#949ba4] font-medium leading-relaxed block">{perm.description}</span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
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
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded font-bold text-xs shadow-lg transition-all active:scale-[0.97] cursor-pointer"
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
