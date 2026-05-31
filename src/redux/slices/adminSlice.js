import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import permissionService from '../../services/admin/permissionService';
import roleService from '../../services/admin/roleService';
import accountService from '../../services/admin/accountService';

// --- Async Thunks for Permissions ---
export const fetchPermissions = createAsyncThunk(
  'admin/fetchPermissions',
  async (_, { rejectWithValue }) => {
    try {
      const res = await permissionService.getAll();
      return res.success ? res.data : rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể lấy danh sách quyền!');
    }
  }
);

export const createPermission = createAsyncThunk(
  'admin/createPermission',
  async (data, { rejectWithValue }) => {
    try {
      const res = await permissionService.create(data);
      return res.success ? res.data : rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tạo quyền hạn!');
    }
  }
);

export const updatePermission = createAsyncThunk(
  'admin/updatePermission',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await permissionService.update(id, data);
      return res.success ? res.data : rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể cập nhật quyền hạn!');
    }
  }
);

export const deletePermission = createAsyncThunk(
  'admin/deletePermission',
  async (id, { rejectWithValue }) => {
    try {
      const res = await permissionService.delete(id);
      return res.success ? id : rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể xóa quyền hạn!');
    }
  }
);

// --- Async Thunks for Roles ---
export const fetchRoles = createAsyncThunk(
  'admin/fetchRoles',
  async (_, { rejectWithValue }) => {
    try {
      const res = await roleService.getAll();
      return res.success ? res.data : rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể lấy danh sách vai trò!');
    }
  }
);

export const createRole = createAsyncThunk(
  'admin/createRole',
  async (data, { rejectWithValue }) => {
    try {
      const res = await roleService.create(data);
      return res.success ? res.data : rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tạo vai trò!');
    }
  }
);

export const updateRole = createAsyncThunk(
  'admin/updateRole',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await roleService.update(id, data);
      return res.success ? res.data : rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể cập nhật vai trò!');
    }
  }
);

export const deleteRole = createAsyncThunk(
  'admin/deleteRole',
  async (id, { rejectWithValue }) => {
    try {
      const res = await roleService.delete(id);
      return res.success ? id : rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể xóa vai trò!');
    }
  }
);

// --- Async Thunks for Accounts ---
export const fetchAccounts = createAsyncThunk(
  'admin/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const res = await accountService.getAll();
      return res.success ? res.data : rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể lấy danh sách tài khoản!');
    }
  }
);

export const createAccount = createAsyncThunk(
  'admin/createAccount',
  async (data, { rejectWithValue }) => {
    try {
      const res = await accountService.create(data);
      return res.success ? res.data : rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể tạo tài khoản quản trị!');
    }
  }
);

export const updateAccount = createAsyncThunk(
  'admin/updateAccount',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await accountService.update(id, data);
      return res.success ? res.data : rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể cập nhật tài khoản quản trị!');
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'admin/deleteAccount',
  async (id, { rejectWithValue }) => {
    try {
      const res = await accountService.delete(id);
      return res.success ? id : rejectWithValue(res.message);
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Không thể xóa tài khoản quản trị!');
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    accounts: [],
    roles: [],
    permissions: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearAdminError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Permissions Fetch
      .addCase(fetchPermissions.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPermissions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.permissions = action.payload;
      })
      .addCase(fetchPermissions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Permission Create
      .addCase(createPermission.fulfilled, (state, action) => {
        state.permissions.push(action.payload);
      })
      .addCase(createPermission.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Permission Update
      .addCase(updatePermission.fulfilled, (state, action) => {
        const idx = state.permissions.findIndex(p => p._id === action.payload._id);
        if (idx !== -1) {
          state.permissions[idx] = action.payload;
        }
      })
      .addCase(updatePermission.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Permission Delete
      .addCase(deletePermission.fulfilled, (state, action) => {
        state.permissions = state.permissions.filter(p => p._id !== action.payload);
      })
      .addCase(deletePermission.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Roles Fetch
      .addCase(fetchRoles.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.isLoading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Role Create
      .addCase(createRole.fulfilled, (state, action) => {
        state.roles.push(action.payload);
      })
      .addCase(createRole.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Role Update
      .addCase(updateRole.fulfilled, (state, action) => {
        const idx = state.roles.findIndex(r => r._id === action.payload._id);
        if (idx !== -1) {
          state.roles[idx] = action.payload;
        }
      })
      .addCase(updateRole.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Role Delete
      .addCase(deleteRole.fulfilled, (state, action) => {
        state.roles = state.roles.filter(r => r._id !== action.payload);
      })
      .addCase(deleteRole.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Accounts Fetch
      .addCase(fetchAccounts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Account Create
      .addCase(createAccount.fulfilled, (state, action) => {
        state.accounts.push(action.payload);
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Account Update
      .addCase(updateAccount.fulfilled, (state, action) => {
        const idx = state.accounts.findIndex(a => a._id === action.payload._id);
        if (idx !== -1) {
          state.accounts[idx] = action.payload;
        }
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Account Delete
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.accounts = state.accounts.filter(a => a._id !== action.payload);
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const { clearAdminError } = adminSlice.actions;
export default adminSlice.reducer;
