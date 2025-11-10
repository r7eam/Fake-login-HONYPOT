import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Avatar,
  Rating,
  Button,
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useClientFavorites } from '../hooks/useFavorites.js';
import FavoriteButton from '../components/favorites/FavoriteButton';

function FavoritesPage() {
  const navigate = useNavigate();
  const { data: favorites, isLoading, isError, error } = useClientFavorites();

  if (isLoading) {
    return (
      <Container sx={{ mt: 10, display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container sx={{ mt: 10 }}>
        <Alert severity="error">
          {error?.response?.data?.message || 'حدث خطأ أثناء تحميل المفضلة'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ mt: 10, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        العمال المفضلون
      </Typography>

      {!favorites || favorites.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            لا توجد عمال في قائمة المفضلة
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            قم بإضافة العمال إلى قائمة المفضلة لسهولة الوصول إليهم
          </Typography>
          <Button variant="contained" onClick={() => navigate('/workers')}>
            تصفح العمال
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {favorites.map((favorite) => {
            const worker = favorite.worker;
            return (
              <Grid item xs={12} sm={6} md={4} key={favorite.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4
                    }
                  }}
                >
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Avatar
                        src={worker.profile_image ? `http://localhost:3000${worker.profile_image}` : null}
                        sx={{ width: 60, height: 60, bgcolor: 'primary.main' }}
                      >
                        {worker.user?.name?.charAt(0)}
                      </Avatar>
                      <FavoriteButton workerId={worker.id} />
                    </Box>

                    <Typography variant="h6" gutterBottom>
                      {worker.user?.name}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {worker.profession}
                    </Typography>

                    {worker.average_rating > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Rating value={worker.average_rating} readOnly size="small" precision={0.1} />
                        <Typography variant="caption" sx={{ ml: 1 }}>
                          ({worker.total_reviews || 0})
                        </Typography>
                      </Box>
                    )}

                    {worker.bio && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          mt: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical'
                        }}
                      >
                        {worker.bio}
                      </Typography>
                    )}

                    <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => navigate(`/worker-detail/${worker.id}`)}
                        sx={{ flex: 1 }}
                      >
                        عرض الملف
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/request-service/${worker.id}`)}
                        sx={{ flex: 1 }}
                      >
                        طلب خدمة
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Container>
  );
}

export default FavoritesPage;
