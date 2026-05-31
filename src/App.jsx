import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Modular Routing Sub-systems
import AdminRoutes from './routes/admin/AdminRoutes';
import ClientRoutes from './routes/client/ClientRoutes';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 1. Mount Modular Administrative RBAC Routing Tree */}
        {AdminRoutes}

        {/* 2. Mount Modular Client Chats & Shop Routing Tree */}
        {ClientRoutes}
        {/* 3. Wildcard catch-all redirect fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
