// fronted/src/pages/FakeAdminLogin.jsx
// HONEYPOT: This page looks identical to the real login but captures attacker data
import React, { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Menu,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

export default function FakeAdminLogin() {
  const HONEYPOT_URL =
    import.meta.env.VITE_HONEYPOT_URL || "http://localhost:80";

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [language, setLanguage] = useState("ar");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    handleMenuClose();
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!emailOrPhone || !password) {
      setError("الرجاء إدخال جميع الحقول المطلوبة");
      return;
    }

    setIsLoading(true);

    try {
      // Send to honeypot instead of real backend
      const res = await fetch(`${HONEYPOT_URL}/fake-login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ 
          username: emailOrPhone, 
          password: password 
        }).toString(),
      });

      // Simulate a delay to look realistic
      await new Promise(resolve => setTimeout(resolve, 800));

      // Always show error message (even though data was captured)
      setError("بيانات الدخول غير صحيحة");
    } catch (err) {
      setError("حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      bgcolor="#f0f2f5"
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        display="flex"
        flexDirection="column"
        gap={2}
        p={4}
        bgcolor="#fff"
        borderRadius={2}
        boxShadow={24}
        width={350}
      >
        <Typography variant="h5" textAlign="center" mb={2}>
          تسجيل الدخول
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          label="البريد الإلكتروني أو رقم الهاتف"
          type="text"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          placeholder="example@email.com أو 07701234567"
          fullWidth
          disabled={isLoading}
        />

        <TextField
          label="كلمة السر"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          disabled={isLoading}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Button
          type="submit"
          variant="contained"
          disabled={isLoading}
          sx={{
            padding: "12px",
            borderRadius: "20px",
            fontWeight: "bold",
          }}
        >
          {isLoading ? <CircularProgress size={24} /> : "تسجيل الدخول"}
        </Button>

        <Box sx={{ textAlign: "center", mt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            ليس لديك حساب؟{" "}
            <Button
              variant="text"
              onClick={() => {/* Honeypot: Do nothing */}}
              sx={{ textDecoration: "underline" }}
            >
              إنشاء حساب جديد
            </Button>
          </Typography>
        </Box>

        <Button
          variant="text"
          onClick={handleMenuClick}
          sx={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <KeyboardArrowDownIcon />
          اللغة
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleLanguageChange("ar")}>
            العربية
          </MenuItem>
          <MenuItem onClick={() => handleLanguageChange("en")}>
            English
          </MenuItem>
        </Menu>
      </Box>
    </Box>
  );
}
