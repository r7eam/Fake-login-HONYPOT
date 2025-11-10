import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Avatar,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Divider,
  LinearProgress,
  IconButton,
  ImageList,
  ImageListItem,
  ImageListItemBar,
} from '@mui/material';
import {
  Save as SaveIcon,
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useWorkerByUserId, useWorkerOperations } from '../../hooks/useWorkers';
import { useWorkerPortfolio, usePortfolioOperations } from '../../hooks/usePortfolio';

const professions = [
  { id: 1, name: 'كهربائي' },
  { id: 2, name: 'سباك' },
  { id: 3, name: 'نجار' },
  { id: 4, name: 'صباغ' },
  { id: 5, name: 'مكيفات' },
  { id: 6, name: 'السيراميك' },
  { id: 7, name: 'جبس' },
  { id: 8, name: 'ألمنيوم' },
  { id: 9, name: 'حداد' },
  { id: 10, name: 'تنظيف' },
  { id: 11, name: 'عامل للحدائق' },
  { id: 12, name: 'عازل حراري' },
];

function WorkerProfileTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { worker, loading: workerLoading, refetch } = useWorkerByUserId(user?.id);
  const {
    loading,
    error,
    success,
    uploadProgress,
    createWorker,
    updateWorker,
    uploadMyProfileImage,
    toggleAvailability,
    clearMessages,
  } = useWorkerOperations();

  // Portfolio hooks
  const { data: portfolioItems, refetch: refetchPortfolio } = useWorkerPortfolio(worker?.id);
  const {
    uploadPortfolioImage,
    uploadMultiplePortfolioImages,
    deletePortfolioItem,
    loading: portfolioLoading,
    error: portfolioError,
    success: portfolioSuccess,
  } = usePortfolioOperations();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    profession_id: '',
    bio: '',
    experience_years: '',
    contact_phone: '',
    whatsapp_number: '',
    facebook_url: '',
    instagram_url: '',
    is_available: true,
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Portfolio states
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [portfolioDescription, setPortfolioDescription] = useState('');

  // Initialize form when worker data loads
  useEffect(() => {
    if (worker) {
      setFormData({
        profession_id: worker.profession_id || '',
        bio: worker.bio || '',
        experience_years: worker.experience_years || '',
        contact_phone: worker.contact_phone || '',
        whatsapp_number: worker.whatsapp_number || '',
        facebook_url: worker.facebook_url || '',
        instagram_url: worker.instagram_url || '',
        is_available: worker.is_available ?? true,
      });
      setIsEditing(true);
    } else {
      setIsEditing(false);
    }
  }, [worker]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSwitchChange = (e) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: checked,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert('يجب أن تكون الصورة من نوع: JPG, PNG, GIF, أو WEBP');
        return;
      }

      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUploadImage = async () => {
    if (!selectedImage) return;

    try {
      await uploadMyProfileImage(selectedImage);
      setSelectedImage(null);
      setImagePreview(null);
      await refetch();
    } catch (err) {
      console.error('Error uploading image:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearMessages();

    const submitData = {};
    Object.keys(formData).forEach((key) => {
      const value = formData[key];
      if (value !== '' && value !== null && value !== undefined) {
        submitData[key] = value;
      }
    });

    try {
      if (isEditing && worker) {
        await updateWorker(worker.id, submitData);
      } else {
        await createWorker(submitData);
        setIsEditing(true);
      }
      await refetch();
    } catch (err) {
      console.error('Error saving worker profile:', err);
    }
  };

  const handleToggleAvailability = async () => {
    if (!worker) return;

    try {
      await toggleAvailability(worker.id, !worker.is_available);
      await refetch();
    } catch (err) {
      console.error('Error toggling availability:', err);
    }
  };

  const handlePortfolioImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Check file sizes
      const oversized = files.filter(file => file.size > 5 * 1024 * 1024);
      if (oversized.length > 0) {
        alert('بعض الصور أكبر من 5 ميجابايت. الرجاء اختيار صور أصغر.');
        return;
      }
      setPortfolioImages(files);
    }
  };

  const handleUploadPortfolioImage = async () => {
    if (!portfolioImages || portfolioImages.length === 0) {
      alert('الرجاء اختيار صورة أو أكثر');
      return;
    }

    try {
      if (portfolioImages.length === 1) {
        // Single image upload
        await uploadPortfolioImage(portfolioImages[0], portfolioDescription);
      } else {
        // Multiple images upload
        await uploadMultiplePortfolioImages(portfolioImages, portfolioDescription);
      }
      
      setPortfolioImages([]);
      setPortfolioDescription('');
      // Reset file input
      const fileInput = document.getElementById('portfolio-image-upload');
      if (fileInput) fileInput.value = '';
      await refetchPortfolio();
    } catch (err) {
      console.error('Error uploading portfolio image:', err);
    }
  };

  const handleDeletePortfolioItem = async (itemId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الصورة؟')) {
      return;
    }

    try {
      await deletePortfolioItem(itemId);
      await refetchPortfolio();
    } catch (err) {
      console.error('Error deleting portfolio item:', err);
    }
  };

  if (workerLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold" mb={3}>
        {isEditing ? 'إدارة الملف الشخصي' : 'إنشاء ملف العامل'}
      </Typography>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" onClose={clearMessages} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={clearMessages} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Left Column - Profile Image & Quick Stats */}
        <Grid item xs={12} md={4}>
          {/* Profile Image Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                الصورة الشخصية
              </Typography>

              <Avatar
                src={
                  imagePreview ||
                  (worker?.profile_image
                    ? `http://localhost:3000${worker.profile_image}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        user?.name || 'Worker'
                      )}&background=1976d2&color=fff&size=400`)
                }
                alt={user?.name}
                sx={{
                  width: 200,
                  height: 200,
                  margin: '0 auto',
                  mb: 2,
                  border: '4px solid #1976d2',
                }}
              />

              {uploadProgress > 0 && uploadProgress < 100 && (
                <Box sx={{ mb: 2 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    جاري الرفع... {uploadProgress}%
                  </Typography>
                </Box>
              )}

              <input
                accept="image/*"
                type="file"
                id="profile-image-upload"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <label htmlFor="profile-image-upload">
                <Button variant="outlined" component="span" fullWidth startIcon={<UploadIcon />} sx={{ mb: 1 }}>
                  اختر صورة
                </Button>
              </label>

              {selectedImage && (
                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleUploadImage}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                >
                  رفع الصورة
                </Button>
              )}

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                الحد الأقصى: 5 ميجابايت
                <br />
                الأنواع المسموحة: JPG, PNG, GIF, WEBP
              </Typography>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          {worker && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  إجراءات سريعة
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    الحالة الحالية
                  </Typography>
                  <FormControlLabel
                    control={
                      <Switch checked={worker.is_available} onChange={handleToggleAvailability} disabled={loading} />
                    }
                    label={worker.is_available ? 'متاح' : 'غير متاح'}
                  />
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    الإحصائيات
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">التقييم:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      ⭐ {typeof worker?.average_rating === 'number' ? worker.average_rating.toFixed(1) : '0.0'} / 5.0
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">الأعمال المنجزة:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {worker?.total_jobs || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Column - Profile Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold" mb={3}>
                معلومات الملف الشخصي
              </Typography>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Profession */}
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>المهنة</InputLabel>
                      <Select
                        name="profession_id"
                        value={formData.profession_id}
                        label="المهنة"
                        onChange={handleInputChange}
                      >
                        {professions.map((prof) => (
                          <MenuItem key={prof.id} value={prof.id}>
                            {prof.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Bio */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="bio"
                      label="نبذة عن خبرتك وخدماتك"
                      multiline
                      rows={4}
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="مثال: كهربائي محترف مع خبرة 5 سنوات في صيانة وتركيب الأجهزة الكهربائية..."
                    />
                  </Grid>

                  {/* Experience Years */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="experience_years"
                      label="سنوات الخبرة"
                      type="number"
                      value={formData.experience_years}
                      onChange={handleInputChange}
                      inputProps={{ min: 0 }}
                    />
                  </Grid>

                  {/* Availability */}
                  <Grid item xs={12} sm={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          name="is_available"
                          checked={formData.is_available}
                          onChange={handleSwitchChange}
                        />
                      }
                      label="متاح لاستقبال طلبات العمل"
                      sx={{ mt: 1 }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Divider />
                  </Grid>

                  {/* Contact Information */}
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom fontWeight="bold">
                      معلومات التواصل
                    </Typography>
                  </Grid>

                  {/* Contact Phone */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="contact_phone"
                      label="رقم الهاتف"
                      value={formData.contact_phone}
                      onChange={handleInputChange}
                      placeholder="07901234568"
                    />
                  </Grid>

                  {/* WhatsApp */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="whatsapp_number"
                      label="رقم الواتساب"
                      value={formData.whatsapp_number}
                      onChange={handleInputChange}
                      placeholder="07901234568"
                    />
                  </Grid>

                  {/* Facebook */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="facebook_url"
                      label="رابط فيسبوك"
                      value={formData.facebook_url}
                      onChange={handleInputChange}
                      placeholder="https://facebook.com/username"
                    />
                  </Grid>

                  {/* Instagram */}
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      name="instagram_url"
                      label="رابط انستغرام"
                      value={formData.instagram_url}
                      onChange={handleInputChange}
                      placeholder="https://instagram.com/username"
                    />
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        startIcon={
                          loading ? (
                            <CircularProgress size={20} />
                          ) : isEditing ? (
                            <SaveIcon />
                          ) : (
                            <CheckCircleIcon />
                          )
                        }
                      >
                        {isEditing ? 'حفظ التغييرات' : 'إنشاء الملف الشخصي'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>

          {/* Portfolio Section */}
          {worker && (
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom fontWeight="bold" mb={3}>
                  معرض الأعمال (Portfolio)
                </Typography>

                {/* Success/Error Messages for Portfolio */}
                {portfolioSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {portfolioSuccess}
                  </Alert>
                )}
                {portfolioError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {portfolioError}
                  </Alert>
                )}

                {/* Upload New Portfolio Image */}
                <Card variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    إضافة صور جديدة للمعرض
                  </Typography>
                  
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                      <input
                        accept="image/*"
                        type="file"
                        id="portfolio-image-upload"
                        multiple
                        style={{ display: 'none' }}
                        onChange={handlePortfolioImageChange}
                      />
                      <label htmlFor="portfolio-image-upload">
                        <Button
                          variant="outlined"
                          component="span"
                          fullWidth
                          startIcon={<AddIcon />}
                        >
                          {portfolioImages.length > 0 
                            ? `تم اختيار ${portfolioImages.length} صورة` 
                            : 'اختر صور (متعددة)'}
                        </Button>
                      </label>
                      {portfolioImages.length > 0 && (
                        <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                          {portfolioImages.map(f => f.name).join(', ')}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="وصف العمل (اختياري)"
                        value={portfolioDescription}
                        onChange={(e) => setPortfolioDescription(e.target.value)}
                        placeholder="مثال: تركيب كهرباء منزل..."
                      />
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleUploadPortfolioImage}
                        disabled={portfolioImages.length === 0 || portfolioLoading}
                        startIcon={portfolioLoading ? <CircularProgress size={20} /> : <UploadIcon />}
                      >
                        {portfolioLoading 
                          ? 'جاري الرفع...' 
                          : `رفع ${portfolioImages.length > 0 ? portfolioImages.length : ''} صورة`}
                      </Button>
                    </Grid>
                  </Grid>
                </Card>

                {/* Portfolio Gallery */}
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  الأعمال المنشورة ({portfolioItems?.length || 0})
                </Typography>

                {portfolioItems && portfolioItems.length > 0 ? (
                  <ImageList sx={{ width: '100%', height: 450 }} cols={3} rowHeight={200}>
                    {portfolioItems.map((item) => (
                      <ImageListItem key={item.id}>
                        <img
                          src={`http://localhost:3000${item.image_url}`}
                          alt={item.description || 'Portfolio item'}
                          loading="lazy"
                          style={{ height: '200px', objectFit: 'cover' }}
                        />
                        <ImageListItemBar
                          title={item.description || 'بدون وصف'}
                          subtitle={new Date(item.created_at).toLocaleDateString('ar-IQ')}
                          actionIcon={
                            <IconButton
                              sx={{ color: 'rgba(255, 255, 255, 0.9)' }}
                              onClick={() => handleDeletePortfolioItem(item.id)}
                              disabled={portfolioLoading}
                            >
                              <DeleteIcon />
                            </IconButton>
                          }
                        />
                      </ImageListItem>
                    ))}
                  </ImageList>
                ) : (
                  <Box
                    sx={{
                      textAlign: 'center',
                      py: 4,
                      border: '2px dashed #ccc',
                      borderRadius: 2,
                      bgcolor: '#fafafa',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      لم تقم بإضافة أي صور لمعرض أعمالك بعد
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      أضف صور لأعمالك السابقة لجذب المزيد من العملاء
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}

export default WorkerProfileTab;
