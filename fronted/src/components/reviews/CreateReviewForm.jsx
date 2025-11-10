import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Rating,
  TextField,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { useCreateReview } from '../../hooks/useReviews.js';

function CreateReviewForm({ request, onSuccess, onCancel }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const createReview = useCreateReview();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      return;
    }

    try {
      await createReview.mutateAsync({
        requestId: request.id,
        rating,
        comment: comment.trim() || undefined
      });
      onSuccess?.();
    } catch (error) {
      console.error('Failed to create review:', error);
    }
  };

  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          تقييم الخدمة
        </Typography>
        
        <Typography variant="body2" color="text.secondary" gutterBottom>
          العامل: {request.worker?.user?.name}
        </Typography>

        {createReview.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {createReview.error?.response?.data?.message || 'حدث خطأ أثناء إرسال التقييم'}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 2 }}>
            <Typography component="legend" gutterBottom>
              التقييم
            </Typography>
            <Rating
              value={rating}
              onChange={(e, value) => setRating(value)}
              size="large"
            />
          </Box>

          <TextField
            fullWidth
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            label="تعليقك (اختياري)"
            placeholder="اكتب تجربتك مع العامل..."
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={createReview.isPending || !rating}
              sx={{ flex: 1 }}
            >
              {createReview.isPending ? <CircularProgress size={24} /> : 'إرسال التقييم'}
            </Button>
            {onCancel && (
              <Button
                variant="outlined"
                onClick={onCancel}
                disabled={createReview.isPending}
              >
                إلغاء
              </Button>
            )}
          </Box>
        </form>
      </CardContent>
    </Card>
  );
}

export default CreateReviewForm;
