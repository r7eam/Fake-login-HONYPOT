import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Rating,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import {
  Phone as PhoneIcon,
  WhatsApp as WhatsAppIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Work as WorkIcon,
  LocationOn as LocationOnIcon,
  Schedule as ScheduleIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon,
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon,
  RequestPage as RequestPageIcon,
} from '@mui/icons-material';
import { useWorker } from '../hooks/useWorkers';
import PortfolioGallery from '../components/PortfolioGallery';
import FavoriteButton from '../components/favorites/FavoriteButton';

function WorkerDetail() {
  const { workerId, id } = useParams(); // Support both parameter names
  const navigate = useNavigate();
  const actualWorkerId = workerId || id; // Use whichever is available
  const { worker, loading, error } = useWorker(actualWorkerId);

  const handleWhatsAppClick = () => {
    if (worker?.whatsapp_number) {
      const cleanPhone = worker.whatsapp_number.replace(/\D/g, '');
      window.open(`https://wa.me/${cleanPhone}`, '_blank');
    }
  };

  const handlePhoneClick = () => {
    if (worker?.contact_phone) {
      window.location.href = `tel:${worker.contact_phone}`;
    }
  };

  const handleSocialClick = (url) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <Container sx={{ py: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/workers')}>
          العودة إلى قائمة العمال
        </Button>
      </Container>
    );
  }

  if (!worker) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="info">العامل غير موجود</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: 10 }}>
      {/* Back Button */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/workers')}
        sx={{ mb: 3 }}
      >
        العودة إلى قائمة العمال
      </Button>

      <Grid container spacing={3}>
        {/* Left Column - Worker Info */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              {/* Profile Image */}
              <Avatar
                src={
                  worker.profile_image
                    ? `http://localhost:3000${worker.profile_image}`
                    : `https://ui-avatars.com/api/?name=${encodeURIComponent(worker.user.name)}&background=1976d2&color=fff&size=400`
                }
                alt={worker.user.name}
                sx={{
                  width: 200,
                  height: 200,
                  margin: '0 auto',
                  mb: 2,
                  border: '4px solid #1976d2',
                }}
              />

              {/* Name */}
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                {worker.user.name}
              </Typography>

              {/* Profession */}
              <Chip
                icon={<WorkIcon />}
                label={worker.profession.name}
                color="primary"
                sx={{ mb: 2 }}
              />

              {/* Rating */}
              <Box sx={{ mb: 2 }}>
                <Rating value={worker.average_rating || 0} readOnly precision={0.5} size="large" />
                <Typography variant="h6" color="text.secondary">
                  {Number(worker.average_rating || 0).toFixed(1)} / 5.0
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  بناءً على {worker.total_jobs || 0} عمل منجز
                </Typography>
              </Box>

              {/* Availability */}
              <Chip
                icon={worker.is_available ? <CheckCircleIcon /> : <ScheduleIcon />}
                label={worker.is_available ? 'متاح الآن' : 'غير متاح حالياً'}
                color={worker.is_available ? 'success' : 'default'}
                sx={{ mb: 3 }}
              />

              <Divider sx={{ my: 2 }} />

              {/* Quick Stats */}
              <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 3 }}>
                <Box>
                  <Typography variant="h6" color="primary">
                    {worker.experience_years || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    سنوات خبرة
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="h6" color="primary">
                    {worker.total_jobs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    عمل منجز
                  </Typography>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<RequestPageIcon />}
                  disabled={!worker.is_available}
                >
                  طلب خدمة
                </Button>
                
                {/* Favorite Button */}
                <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <FavoriteButton 
                    workerId={actualWorkerId} 
                    showTooltip={true}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                معلومات التواصل
              </Typography>
              <List dense>
                {worker.contact_phone && (
                  <ListItem>
                    <ListItemIcon>
                      <PhoneIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={worker.contact_phone}
                      secondary="رقم الهاتف"
                    />
                    <Button size="small" onClick={handlePhoneClick}>
                      اتصال
                    </Button>
                  </ListItem>
                )}

                {worker.whatsapp_number && (
                  <ListItem>
                    <ListItemIcon>
                      <WhatsAppIcon sx={{ color: '#25D366' }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={worker.whatsapp_number}
                      secondary="واتساب"
                    />
                    <Button size="small" color="success" onClick={handleWhatsAppClick}>
                      مراسلة
                    </Button>
                  </ListItem>
                )}

                {worker.user.email && (
                  <ListItem>
                    <ListItemIcon>
                      <EmailIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={worker.user.email}
                      secondary="البريد الإلكتروني"
                    />
                  </ListItem>
                )}

                {worker.user.neighborhood && (
                  <ListItem>
                    <ListItemIcon>
                      <LocationOnIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${worker.user.neighborhood.name} - ${worker.user.neighborhood.area}`}
                      secondary="الموقع"
                    />
                  </ListItem>
                )}
              </List>

              {/* Social Media */}
              {(worker.facebook_url || worker.instagram_url) && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    مواقع التواصل الاجتماعي
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    {worker.facebook_url && (
                      <Button
                        variant="outlined"
                        startIcon={<FacebookIcon />}
                        onClick={() => handleSocialClick(worker.facebook_url)}
                      >
                        Facebook
                      </Button>
                    )}
                    {worker.instagram_url && (
                      <Button
                        variant="outlined"
                        startIcon={<InstagramIcon />}
                        sx={{ color: '#E4405F', borderColor: '#E4405F' }}
                        onClick={() => handleSocialClick(worker.instagram_url)}
                      >
                        Instagram
                      </Button>
                    )}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Details */}
        <Grid item xs={12} md={8}>
          {/* About Section */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                نبذة عن العامل
              </Typography>
              {worker.bio ? (
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {worker.bio}
                </Typography>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  لا توجد معلومات إضافية
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Profession Details */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                تفاصيل المهنة
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <WorkIcon color="primary" fontSize="large" />
                <Box>
                  <Typography variant="h6">{worker.profession.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {worker.profession.description}
                  </Typography>
                </Box>
              </Box>
              {worker.experience_years && (
                <Typography variant="body1" sx={{ mt: 2 }}>
                  خبرة <strong>{worker.experience_years}</strong> سنة في مجال {worker.profession.name}
                </Typography>
              )}
            </CardContent>
          </Card>

          {/* Reviews Section (Placeholder) */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  التقييمات والمراجعات
                </Typography>
                <Chip
                  icon={<StarIcon />}
                  label={`${Number(worker.average_rating || 0).toFixed(1)} / 5.0`}
                  color="primary"
                />
              </Box>
              <Alert severity="info">
                سيتم عرض التقييمات والمراجعات قريباً
              </Alert>
            </CardContent>
          </Card>

          {/* Portfolio Section */}
          <Card>
            <CardContent>
              <PortfolioGallery workerId={actualWorkerId} canEdit={false} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}

export default WorkerDetail;
