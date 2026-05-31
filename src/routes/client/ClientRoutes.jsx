import React from 'react';
import { Route, Navigate } from 'react-router-dom';

// Layout & Protectors
import AppLayout from '../../layouts/AppLayout';
import ClientProtectedRoute from '../../components/ClientProtectedRoute';

// Pages
import LoginPage from '../../pages/client/LoginPage';
import RegisterPage from '../../pages/client/RegisterPage';
import ShopPage from '../../pages/client/ShopPage';
import ChatPage from '../../pages/client/ChatPage';
import BannedPage from '../../pages/client/BannedPage';
import FriendsPage from '../../pages/client/FriendsPage';
import InvitePage from '../../pages/client/InvitePage';
import VoiceChannelPage from '../../pages/client/VoiceChannelPage';

export const ClientRoutes = (
  <>
    {/* 🟢 Public Authentication Pages */}
    <Route path="login" element={<LoginPage />} />
    <Route path="register" element={<RegisterPage />} />
    <Route path="banned" element={<BannedPage />} />
    <Route path="invite/:inviteCode" element={
      <ClientProtectedRoute>
        <InvitePage />
      </ClientProtectedRoute>
    } />

    {/* 🟢 Client Main Workspace Nested Routes (Secured by ClientProtectedRoute) */}
    <Route 
      path="/" 
      element={
        <ClientProtectedRoute>
          <AppLayout />
        </ClientProtectedRoute>
      }
    >
      {/* Root path auto-redirect to friends instead of hardcoded channel */}
      <Route index element={<Navigate to="/friends" replace />} />
      
      {/* Dynamic text channels routing */}
      <Route path="channels/:id" element={<ChatPage />} />

      {/* Community channel chat */}
      <Route path="community/:communityId/channel/:channelId" element={<ChatPage />} />

      {/* Community voice channel */}
      <Route path="community/:communityId/voice/:channelId" element={<VoiceChannelPage />} />
      
      {/* Avatar frame boutique */}
      <Route path="shop" element={<ShopPage />} />

      {/* Friends list page */}
      <Route path="friends" element={<FriendsPage />} />
    </Route>
  </>
);

export default ClientRoutes;
