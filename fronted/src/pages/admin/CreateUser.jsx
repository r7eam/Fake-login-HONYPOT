import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { 
  PersonAdd as PersonAddIcon, 
  Cancel as CancelIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useUserOperations } from '../../hooks/useUsers';

const CreateUser = () => {
  const navigate = useNavigate();
  const { loading, error, success, createUser, clearMessages } = useUserOperations();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'client',
    neighborhood_id: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
    clearMessages();
  };

  const validateForm = () => {
    const errors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'الاسم مطلوب';
    }

    // Phone validation
    if (!formData.phone) {
      errors.phone = 'رقم الهاتف مطلوب';
    } else if (formData.phone.length < 8 || formData.phone.length > 20) {
      errors.phone = 'رقم الهاتف يجب أن يكون بين 8 و 20 حرف';
    }

    // Password validation
    if (!formData.password) {
      errors.password = 'كلمة المرور مطلوبة';
    } else if (formData.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'كلمات المرور غير متطابقة';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      // Prepare data - remove confirmPassword and empty fields
      const userData = {
        name: formData.name,
        phone: formData.phone,
        password: formData.password,
        role: formData.role,
      };

      if (formData.email) {
        userData.email = formData.email;
      }

      if (formData.neighborhood_id) {
        userData.neighborhood_id = parseInt(formData.neighborhood_id);
      }

      await createUser(userData);
      
      // Show success message then navigate
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err) {
      // Error is handled by the hook
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCancel = () => {
    if (window.confirm('هل أنت متأكد؟ سيتم فقدان البيانات المدخلة.')) {
      navigate('/admin/users');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          إضافة مستخدم جديد
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          قم بإنشاء حساب مستخدم جديد في النظام
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={clearMessages}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success} جاري التحويل...
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary">
                المعلومات الأساسية
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="الاسم الكامل *"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={!!validationErrors.name}
                helperText={validationErrors.name}
                placeholder="أحمد محمد علي"
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="البريد الإلكتروني"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!validationErrors.email}
                helperText={validationErrors.email || 'اختياري'}
                placeholder="user@example.com"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم الهاتف *"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={!!validationErrors.phone}
                helperText={validationErrors.phone || 'مثال: 07901234567'}
                placeholder="07901234567"
                required
              />
            </Grid>

            {/* Password Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                كلمة المرور
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="كلمة المرور *"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                error={!!validationErrors.password}
                helperText={validationErrors.password || 'يجب أن تكون 6 أحرف على الأقل'}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="تأكيد كلمة المرور *"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!validationErrors.confirmPassword}
                helperText={validationErrors.confirmPassword}
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            {/* Role & Location */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                الدور والموقع
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>الدور</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="الدور"
                >
                  <MenuItem value="client">عميل</MenuItem>
                  <MenuItem value="worker">عامل</MenuItem>
                  <MenuItem value="admin">مدير</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="معرف الحي"
                name="neighborhood_id"
                type="number"
                value={formData.neighborhood_id}
                onChange={handleChange}
                placeholder="اختياري"
                helperText="معرف الحي (اتركه فارغاً إذا لم يكن متاحاً)"
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancel}
                  disabled={loading}
                  startIcon={<CancelIcon />}
                  sx={{ minWidth: 150 }}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <PersonAddIcon />}
                  sx={{ minWidth: 150 }}
                >
                  {loading ? 'جاري الإنشاء...' : 'إنشاء المستخدم'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default CreateUser;
