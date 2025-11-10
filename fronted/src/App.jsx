 import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import HomePage from "./pages/HomePage";
import RegisterForm from "./components/auth/RegisterForm";
import Orders from "./pages/Orders";
import OrderDetails from "./pages/OrderDetails";
import WorkersList from "./pages/WorkersList";
import WorkerProfile from "./pages/WorkerProfile";
import Profile from "./pages/Profile";
import ChangePassword from "./pages/ChangePassword";
import UsersList from "./pages/admin/UsersList";
import EditUser from "./pages/admin/EditUser";
import CreateUser from "./pages/admin/CreateUser";
import WorkerDetail from "./pages/WorkerDetail";
import WorkerDashboard from './pages/worker/WorkerDashboard';
import WorkerPortfolioManager from './pages/WorkerPortfolioManager';
import MyRequestsPage from "./pages/MyRequestsPage";
import WorkerRequestsPage from "./pages/WorkerRequestsPage";
import CreateRequestPage from "./pages/CreateRequestPage";
import { SearchProvider } from "./context/SearchContext";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import FakeAdminLogin from "./pages/FakeAdminLogin";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SearchProvider>
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/admin-login" element={<FakeAdminLogin />} />
            
            {/* Workers Routes - Both old and new paths supported */}
            <Route path="/workers" element={<WorkersList />} />
            <Route path="/worker-detail/:workerId" element={<WorkerDetail />} />
            <Route path="/worker-profile/:id" element={<WorkerProfile />} />
            
            {/* Requests Routes - Protected */}
            <Route
              path="/my-requests"
              element={
                <ProtectedRoute>
                  <MyRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker-requests"
              element={
                <ProtectedRoute>
                  <WorkerRequestsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/request-service/:workerId"
              element={
                <ProtectedRoute>
                  <CreateRequestPage />
                </ProtectedRoute>
              }
            />
            
            {/* Protected Routes - Require Authentication */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            {/* Worker Dashboard - Must come before /worker/:id pattern */}
            <Route
              path="/worker-dashboard"
              element={
                <ProtectedRoute>
                  <WorkerDashboard />
                </ProtectedRoute>
              }
            />
            
            {/* Worker Portfolio Management */}
            <Route
              path="/worker/portfolio"
              element={
                <ProtectedRoute>
                  <WorkerPortfolioManager />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order/:id"
              element={
                <ProtectedRoute>
                  <OrderDetails />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes - Require Admin Role */}
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <UsersList />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/create"
              element={
                <AdminRoute>
                  <CreateUser />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/users/:userId/edit"
              element={
                <AdminRoute>
                  <EditUser />
                </AdminRoute>
              }
            />
          </Routes>
        </SearchProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
