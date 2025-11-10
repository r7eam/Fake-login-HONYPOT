import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  FormControlLabel,
  Switch,
  Grid,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import { useUser } from '../../hooks/useUsers';
import { usersApi } from '../../config/usersApi';

const EditUser = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user, loading, error } = useUser(userId);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'client',
    neighborhood_id: '',
    email_verified: false,
    phone_verified: false,
    is_active: true,
  });

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email || '',
        role: user.role,
        neighborhood_id: user.neighborhood_id || '',
        email_verified: user.email_verified,
        phone_verified: user.phone_verified,
        is_active: user.is_active,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // Prepare data - remove empty neighborhood_id
      const updateData = { ...formData };
      if (!updateData.neighborhood_id) {
        delete updateData.neighborhood_id;
      }
      
      await usersApi.updateUser(userId, updateData);
      setSaveSuccess(true);
      
      // Show success message then navigate
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err) {
      setSaveError(err.message || 'فشل في تحديث المستخدم');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('هل أنت متأكد؟ سيتم فقدان التغييرات غير المحفوظة.')) {
      navigate('/admin/users');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('/admin/users')}>
          العودة إلى قائمة المستخدمين
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          تعديل المستخدم
        </Typography>

        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
          تعديل معلومات المستخدم: <strong>{user?.name}</strong> (ID: {userId})
        </Typography>

        {saveError && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setSaveError(null)}>
            {saveError}
          </Alert>
        )}

        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 3 }}>
            تم تحديث المستخدم بنجاح! جاري التحويل...
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
                label="الاسم الكامل"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="أحمد محمد علي"
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
                placeholder="user@example.com"
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الهاتف"
                value={user?.phone || ''}
                disabled
                helperText="لا يمكن تعديل رقم الهاتف"
              />
            </Grid>

            {/* Role & Permissions */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                الدور والصلاحيات
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>الدور</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  label="الدور"
                  required
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
                helperText="اترك فارغاً إذا لم يكن متاحاً"
              />
            </Grid>

            {/* Verification Status */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                حالة التوثيق والتفعيل
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    name="email_verified"
                    checked={formData.email_verified}
                    onChange={handleChange}
                    color="success"
                  />
                }
                label="البريد الإلكتروني موثق"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    name="phone_verified"
                    checked={formData.phone_verified}
                    onChange={handleChange}
                    color="success"
                  />
                }
                label="الهاتف موثق"
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControlLabel
                control={
                  <Switch
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    color="primary"
                  />
                }
                label="الحساب نشط"
              />
            </Grid>

            {/* Account Info */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom color="primary" sx={{ mt: 2 }}>
                معلومات الحساب
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="تاريخ الإنشاء"
                value={user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-IQ') : '-'}
                disabled
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="آخر تحديث"
                value={user?.updated_at ? new Date(user.updated_at).toLocaleDateString('ar-IQ') : '-'}
                disabled
              />
            </Grid>

            {/* Action Buttons */}
            <Grid item xs={12}>
              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleCancel}
                  disabled={saving}
                  startIcon={<CancelIcon />}
                  sx={{ minWidth: 150 }}
                >
                  إلغاء
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={saving}
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ minWidth: 150 }}
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
};

export default EditUser;
