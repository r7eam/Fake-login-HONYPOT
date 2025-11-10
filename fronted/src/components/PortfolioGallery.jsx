import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogContent,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import { useWorkerPortfolio, useDeletePortfolio } from '../hooks/usePortfolio';

/**
 * Portfolio Gallery Component
 * Displays worker's portfolio items in a responsive grid
 * 
 * @param {number} workerId - Worker ID to fetch portfolio for
 * @param {boolean} canEdit - Whether user can edit/delete items (default: false)
 * @param {Function} onEdit - Callback when edit is clicked
 * @param {Function} onDelete - Callback when item is deleted
 */
export default function PortfolioGallery({ workerId, canEdit = false, onEdit, onDelete }) {
  const { data: portfolio, isLoading, isError, error, refetch } = useWorkerPortfolio(workerId);
  const { deletePortfolio, isDeleting } = useDeletePortfolio();
  
  const [selectedImage, setSelectedImage] = React.useState(null);
  const [deletingId, setDeletingId] = React.useState(null);

  const handleDelete = async (portfolioId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العنصر من معرض الأعمال؟')) {
      return;
    }

    try {
      setDeletingId(portfolioId);
      await deletePortfolio(portfolioId);
      refetch(); // Refresh the portfolio list
      if (onDelete) {
        onDelete(portfolioId);
      }
    } catch (err) {
      alert('حدث خطأ أثناء حذف العنصر: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageClick = (item) => {
    setSelectedImage(item);
  };

  const handleCloseDialog = () => {
    setSelectedImage(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={8}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        حدث خطأ أثناء تحميل معرض الأعمال: {error?.message || 'خطأ غير معروف'}
      </Alert>
    );
  }

  if (!portfolio || portfolio.length === 0) {
    return (
      <Box textAlign="center" py={8}>
        <Typography variant="h6" color="text.secondary">
          لا توجد أعمال في المعرض حتى الآن
        </Typography>
        {canEdit && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            قم بإضافة أعمالك السابقة لعرضها للعملاء
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        معرض الأعمال ({portfolio.length})
      </Typography>

      <Grid container spacing={3}>
        {portfolio.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6,
                },
              }}
            >
              {canEdit && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    zIndex: 1,
                    display: 'flex',
                    gap: 1,
                  }}
                >
                  {onEdit && (
                    <IconButton
                      size="small"
                      sx={{
                        bgcolor: 'background.paper',
                        '&:hover': { bgcolor: 'primary.main', color: 'white' },
                      }}
                      onClick={() => onEdit(item)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  <IconButton
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'error.main', color: 'white' },
                    }}
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? (
                      <CircularProgress size={20} />
                    ) : (
                      <DeleteIcon fontSize="small" />
                    )}
                  </IconButton>
                </Box>
              )}

              <CardMedia
                component="img"
                height="250"
                image={`http://localhost:3000${item.image_url}`}
                alt={item.description || 'صورة من معرض الأعمال'}
                sx={{
                  objectFit: 'cover',
                  cursor: 'pointer',
                }}
                onClick={() => handleImageClick(item)}
              />

              <CardContent sx={{ flexGrow: 1 }}>
                {item.description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.description}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1 }}
                >
                  {new Date(item.created_at).toLocaleDateString('ar-IQ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Image Viewer Dialog */}
      <Dialog
        open={!!selectedImage}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
      >
        <IconButton
          onClick={handleCloseDialog}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' },
            zIndex: 1,
          }}
        >
          <CloseIcon />
        </IconButton>
        <DialogContent sx={{ p: 0, bgcolor: 'black' }}>
          {selectedImage && (
            <Box>
              <img
                src={`http://localhost:3000${selectedImage.image_url}`}
                alt={selectedImage.description}
                style={{
                  width: '100%',
                  height: 'auto',
                  display: 'block',
                }}
              />
              {selectedImage.description && (
                <Box sx={{ p: 3, bgcolor: 'background.paper' }}>
                  <Typography variant="body1">
                    {selectedImage.description}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    {new Date(selectedImage.created_at).toLocaleDateString('ar-IQ', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
