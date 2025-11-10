import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Rating,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Pagination,
  InputAdornment,
  IconButton,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Work as WorkIcon,
  Clear as ClearIcon,
  GridView as GridViewIcon,
  ViewList as ViewListIcon,
} from '@mui/icons-material';
import { useWorkers } from '../hooks/useWorkers';

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

const areas = ['الساحل الأيمن', 'الساحل الأيسر'];

const sortOptions = [
  { value: 'rating', label: 'الأعلى تقييماً' },
  { value: 'experience', label: 'الأكثر خبرة' },
  { value: 'jobs', label: 'الأكثر أعمالاً' },
  { value: 'recent', label: 'الأحدث' },
  { value: 'name', label: 'الاسم' },
];

function WorkersBrowse() {
  const navigate = useNavigate();
  const [view, setView] = useState('grid'); // 'grid' or 'list'
  
  // Filter states
  const [filters, setFilters] = useState({
    profession_id: '',
    area: '',
    is_available: '',
    min_rating: '',
    search: '',
    sort: 'rating',
    order: 'DESC',
    page: 1,
    limit: 12,
  });

  const { workers, meta, loading, error, refetch } = useWorkers(filters);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1, // Reset to first page on filter change
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      profession_id: '',
      area: '',
      is_available: '',
      min_rating: '',
      search: '',
      sort: 'rating',
      order: 'DESC',
      page: 1,
      limit: 12,
    });
  };

  const handlePageChange = (event, value) => {
    setFilters(prev => ({ ...prev, page: value }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleViewChange = (event, newView) => {
    if (newView !== null) {
      setView(newView);
    }
  };

  const handleWorkerClick = (workerId) => {
    navigate(`/worker/${workerId}`);
  };

  const handleWhatsAppClick = (phone, e) => {
    e.stopPropagation();
    const cleanPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const handleSocialClick = (url, e) => {
    e.stopPropagation();
    window.open(url, '_blank');
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, mt: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          تصفح العمال والحرفيين
        </Typography>
        <Typography variant="body1" color="text.secondary">
          ابحث عن العامل المناسب لاحتياجاتك من بين {meta?.total || 0} عامل محترف
        </Typography>
      </Box>

      {/* Filters Section */}
      <Card sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          {/* Search */}
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              placeholder="ابحث بالاسم أو الوصف..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: filters.search && (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => handleFilterChange('search', '')}>
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          {/* Profession */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>المهنة</InputLabel>
              <Select
                value={filters.profession_id}
                label="المهنة"
                onChange={(e) => handleFilterChange('profession_id', e.target.value)}
              >
                <MenuItem value="">الكل</MenuItem>
                {professions.map((prof) => (
                  <MenuItem key={prof.id} value={prof.id}>
                    {prof.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Area */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>المنطقة</InputLabel>
              <Select
                value={filters.area}
                label="المنطقة"
                onChange={(e) => handleFilterChange('area', e.target.value)}
              >
                <MenuItem value="">الكل</MenuItem>
                {areas.map((area) => (
                  <MenuItem key={area} value={area}>
                    {area}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Availability */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>الحالة</InputLabel>
              <Select
                value={filters.is_available}
                label="الحالة"
                onChange={(e) => handleFilterChange('is_available', e.target.value)}
              >
                <MenuItem value="">الكل</MenuItem>
                <MenuItem value="true">متاح</MenuItem>
                <MenuItem value="false">غير متاح</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Min Rating */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>التقييم</InputLabel>
              <Select
                value={filters.min_rating}
                label="التقييم"
                onChange={(e) => handleFilterChange('min_rating', e.target.value)}
              >
                <MenuItem value="">الكل</MenuItem>
                <MenuItem value="4">4 نجوم فأكثر</MenuItem>
                <MenuItem value="3">3 نجوم فأكثر</MenuItem>
                <MenuItem value="2">2 نجوم فأكثر</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Sort */}
          <Grid item xs={12} sm={6} md={1}>
            <FormControl fullWidth>
              <InputLabel>ترتيب</InputLabel>
              <Select
                value={filters.sort}
                label="ترتيب"
                onChange={(e) => handleFilterChange('sort', e.target.value)}
              >
                {sortOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        {/* Clear Filters Button */}
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={handleClearFilters}
            size="small"
          >
            مسح الفلاتر
          </Button>

          {/* View Toggle */}
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={handleViewChange}
            size="small"
          >
            <ToggleButton value="grid">
              <GridViewIcon />
            </ToggleButton>
            <ToggleButton value="list">
              <ViewListIcon />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Card>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Workers Grid/List */}
      {!loading && !error && (
        <>
          {workers.length === 0 ? (
            <Alert severity="info">
              لم يتم العثور على عمال. جرب تغيير الفلاتر.
            </Alert>
          ) : (
            <>
              <Grid container spacing={3}>
                {workers.map((worker) => (
                  <Grid
                    item
                    xs={12}
                    sm={view === 'grid' ? 6 : 12}
                    md={view === 'grid' ? 4 : 12}
                    lg={view === 'grid' ? 3 : 12}
                    key={worker.id}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        display: 'flex',
                        flexDirection: view === 'list' ? 'row' : 'column',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        },
                      }}
                      onClick={() => handleWorkerClick(worker.id)}
                    >
                      <CardMedia
                        component="img"
                        sx={{
                          width: view === 'list' ? 200 : '100%',
                          height: view === 'list' ? 'auto' : 200,
                          objectFit: 'cover',
                        }}
                        image={
                          worker.profile_image
                            ? `http://localhost:3000${worker.profile_image}`
                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.user.name)}&background=1976d2&color=fff&size=400`
                        }
                        alt={worker.user.name}
                      />
                      <CardContent sx={{ flexGrow: 1 }}>
                        {/* Name & Profession */}
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                          {worker.user.name}
                        </Typography>
                        <Chip
                          icon={<WorkIcon />}
                          label={worker.profession.name}
                          color="primary"
                          size="small"
                          sx={{ mb: 1 }}
                        />

                        {/* Rating */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Rating value={worker.average_rating} readOnly precision={0.5} size="small" />
                          <Typography variant="body2" color="text.secondary">
                            ({worker.average_rating.toFixed(1)})
                          </Typography>
                        </Box>

                        {/* Experience & Jobs */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                          {worker.experience_years && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>{worker.experience_years}</strong> سنوات خبرة
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            <strong>{worker.total_jobs}</strong> عمل منجز
                          </Typography>
                        </Box>

                        {/* Location */}
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          📍 {worker.user.neighborhood?.name} - {worker.user.neighborhood?.area}
                        </Typography>

                        {/* Availability */}
                        <Chip
                          label={worker.is_available ? 'متاح' : 'غير متاح'}
                          color={worker.is_available ? 'success' : 'default'}
                          size="small"
                          sx={{ mb: 2 }}
                        />

                        {/* Bio */}
                        {worker.bio && (
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              mb: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {worker.bio}
                          </Typography>
                        )}

                        {/* Contact Buttons */}
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {worker.contact_phone && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `tel:${worker.contact_phone}`;
                              }}
                            >
                              <PhoneIcon />
                            </IconButton>
                          )}
                          {worker.whatsapp_number && (
                            <IconButton
                              size="small"
                              color="success"
                              onClick={(e) => handleWhatsAppClick(worker.whatsapp_number, e)}
                            >
                              <WhatsAppIcon />
                            </IconButton>
                          )}
                          {worker.facebook_url && (
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={(e) => handleSocialClick(worker.facebook_url, e)}
                            >
                              <FacebookIcon />
                            </IconButton>
                          )}
                          {worker.instagram_url && (
                            <IconButton
                              size="small"
                              sx={{ color: '#E4405F' }}
                              onClick={(e) => handleSocialClick(worker.instagram_url, e)}
                            >
                              <InstagramIcon />
                            </IconButton>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                  <Pagination
                    count={meta.totalPages}
                    page={filters.page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
}

export default WorkersBrowse;
