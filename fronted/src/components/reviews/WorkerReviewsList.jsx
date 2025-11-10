import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  CircularProgress,
  Alert,
  Avatar,
  Divider
} from '@mui/material';
import { useWorkerReviews } from '../../hooks/useReviews.js';

function WorkerReviewsList({ workerId }) {
  const { data: reviews, isLoading, isError, error } = useWorkerReviews(workerId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error">
        {error?.response?.data?.message || 'حدث خطأ أثناء تحميل التقييمات'}
      </Alert>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          لا توجد تقييمات بعد
        </Typography>
      </Box>
    );
  }

  // Safety check: ensure reviews is an array
  const reviewsArray = Array.isArray(reviews) ? reviews : [];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        التقييمات ({reviewsArray.length})
      </Typography>

      {reviewsArray.map((review, index) => (
        <Card key={review.id} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {review.client?.name?.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="subtitle1">
                  {review.client?.name || 'عميل'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(review.created_at).toLocaleDateString('ar-IQ', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Box>
              <Rating value={review.rating} readOnly size="small" />
            </Box>

            {review.comment && (
              <>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.primary">
                  {review.comment}
                </Typography>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}

export default WorkerReviewsList;
