import React from 'react';
import { Route } from 'react-router-dom';

// Layout & Protectors
import AdminLayout from '../../layouts/AdminLayout';
import AdminProtectedRoute from '../../components/AdminProtectedRoute';

// Pages
import AdminLogin from '../../pages/admin/AdminLogin';
import AdminDashboard from '../../pages/admin/AdminDashboard';
import ManageUsers from '../../pages/admin/ManageUsers';
import ManageProducts from '../../pages/admin/ManageProducts';
import ManageAccounts from '../../pages/admin/ManageAccounts';
import ManageRoles from '../../pages/admin/ManageRoles';
import ManagePermissions from '../../pages/admin/ManagePermissions';
import ManageCategories from '../../pages/admin/ManageCategories';
import ManagePremiumProducts from '../../pages/admin/ManagePremiumProducts';

export const AdminRoutes = (
  <Route path="admin">
    {/* 🔴 Public Admin Route */}
    <Route path="login" element={<AdminLogin />} />

    {/* 🔒 Protected Admin Nested Routes */}
    <Route
      element={
        <AdminProtectedRoute>
          <AdminLayout />
        </AdminProtectedRoute>
      }
    >
      {/* /admin -> Dashboard */}
      <Route index element={<AdminDashboard />} />
      
      {/* /admin/users -> Audit Users */}
      <Route path="users" element={<ManageUsers />} />
      
      {/* /admin/products -> Shop items management */}
      <Route path="products" element={<ManageProducts />} />
      
      {/* /admin/accounts -> Admin accounts management */}
      <Route path="accounts" element={<ManageAccounts />} />
      
      {/* /admin/roles -> Role groups management */}
      <Route path="roles" element={<ManageRoles />} />
      
      {/* /admin/permissions -> Specific keys management */}
      <Route path="permissions" element={<ManagePermissions />} />
      
      {/* /admin/categories -> Hierarchical product categories */}
      <Route path="categories" element={<ManageCategories />} />

      {/* /admin/premium-products -> Premium product perks */}
      <Route path="premium-products" element={<ManagePremiumProducts />} />
    </Route>
  </Route>
);

export default AdminRoutes;
