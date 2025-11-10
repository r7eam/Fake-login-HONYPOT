import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();

  // التحقق من الصفحة الحالية لتفعيل الأزرار المناسبة
  const isOrdersPage =
    location.pathname.startsWith("/orders") ||
    location.pathname.startsWith("/order");
  const isHomePage = location.pathname === "/";
  const isWorkersPage = location.pathname.startsWith("/workers") || location.pathname.startsWith("/worker");
  const isProfilePage = location.pathname === "/profile";
  const isLoginPage = location.pathname === "/login";
  const isRegisterPage = location.pathname === "/register";
  const isAdminPage = location.pathname.startsWith("/admin");
  const isWorkerDashboardPage = location.pathname === "/worker-dashboard";
  const isMyRequestsPage = location.pathname === "/my-requests";
  const isWorkerRequestsPage = location.pathname === "/worker-requests";
  
  // Check if user is admin or worker
  const isAdmin = user?.role === 'admin';
  const isWorker = user?.role === 'worker' && user?.workerProfile;
  const isClient = user?.role === 'client';

  const buttonStyle = {
    textTransform: "none",
    fontSize: "1.25rem",
    fontWeight: "bold",
    color: "inherit",
    backgroundColor: "transparent",
    transition: "all 0.3s ease",
    padding: "6px 16px",
    minWidth: "120px",
    "&:hover": {
      color: "#fff",
      boxShadow: "0 0 15px #00e5ff",
      backgroundColor: "rgba(0, 229, 255, 0.25)",
    },
  };

  const activeButtonStyle = {
    ...buttonStyle,
    color: "#00e5ff",
    backgroundColor: "rgba(0, 229, 255, 0.15)",
    boxShadow: "0 0 15px #00e5ff",
  };

  return (
    <AppBar
      position="fixed"
      sx={{
        background: "linear-gradient(90deg, #0f2027, #203a43, #2c5364)",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Container maxWidth="xl">
        <Toolbar sx={{ direction: "rtl" }}>
          <Box sx={{ flexGrow: 0, display: "flex", gap: 2, alignItems: "center", flexWrap: "nowrap" }}>
            <Button
              onClick={() => navigate("/")}
              sx={isHomePage ? activeButtonStyle : buttonStyle}
            >
              الواجهة الرئيسية
            </Button>
            <Button
              onClick={() => navigate("/workers")}
              sx={isWorkersPage ? activeButtonStyle : buttonStyle}
            >
              حرف
            </Button>

            {!isAuthenticated ? (
              <>
                <Button
                  onClick={() => navigate("/login")}
                  sx={isLoginPage ? activeButtonStyle : buttonStyle}
                >
                  تسجيل دخول
                </Button>
                <Button
                  onClick={() => navigate("/register")}
                  sx={isRegisterPage ? activeButtonStyle : buttonStyle}
                >
                  حساب جديد
                </Button>
              </>
            ) : (
              <>
                {/* Admin menu */}
                {isAdmin && (
                  <Button
                    onClick={() => navigate("/admin/users")}
                    sx={isAdminPage ? activeButtonStyle : buttonStyle}
                  >
                    لوحة الإدارة
                  </Button>
                )}
                {/* Worker-specific menu items */}
                {isWorker && (
                  <>
                    <Button
                      onClick={() => navigate("/worker-dashboard")}
                      sx={isWorkerDashboardPage ? activeButtonStyle : buttonStyle}
                    >
                      لوحة العامل
                    </Button>
                  </>
                )}
                {/* My Requests - for all authenticated users (clients mainly) */}
                <Button
                  onClick={() => navigate("/my-requests")}
                  sx={isMyRequestsPage ? activeButtonStyle : buttonStyle}
                >
                  طلباتي
                </Button>
                <Button
                  onClick={() => navigate("/profile")}
                  sx={isProfilePage ? activeButtonStyle : buttonStyle}
                >
                  حسابي
                </Button>
              </>
            )}
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Logo */}
          <Box 
            onClick={() => navigate("/")} 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              cursor: "pointer",
              "&:hover": {
                opacity: 0.8,
              }
            }}
          >
            <Typography
              variant="h5"
              sx={{
                fontWeight: "bold",
                background: "linear-gradient(45deg, #00e5ff, #ff9800)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: { xs: "none", md: "block" },
                marginLeft: "10px"
              }}
            >
              FULL CRAFT
            </Typography>
            <img 
              src="/logo.svg" 
              alt="Full Craft Logo" 
              style={{ 
                height: "50px"
              }} 
            />
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default Navbar;
