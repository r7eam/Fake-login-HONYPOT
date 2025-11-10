import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useUploadPortfolio } from '../hooks/usePortfolio';

/**
 * Portfolio Upload Component
 * Allows workers to upload new portfolio items with images
 * 
 * @param {Function} onSuccess - Callback when upload is successful
 * @param {Function} onError - Callback when upload fails
 */
export default function PortfolioUpload({ onSuccess, onError }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [description, setDescription] = useState('');
  const [uploadError, setUploadError] = useState(null);

  const { uploadPortfolio, isUploading } = useUploadPortfolio();

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    
    if (!file) {
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('يرجى اختيار صورة بصيغة JPG, PNG, GIF أو WEBP');
      return;
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setUploadError('حجم الملف يجب أن لا يتجاوز 10 ميجابايت');
      return;
    }

    setUploadError(null);
    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedFile) {
      setUploadError('الرجاء اختيار صورة');
      return;
    }

    try {
      setUploadError(null);

      const formData = new FormData();
      formData.append('image', selectedFile);
      if (description.trim()) {
        formData.append('description', description.trim());
      }

      const result = await uploadPortfolio(formData);

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription('');

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (err) {
      const errorMessage = err.message || 'حدث خطأ أثناء رفع الصورة';
      setUploadError(errorMessage);
      
      if (onError) {
        onError(err);
      }
    }
  };

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto', my: 3 }}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
          إضافة عمل جديد إلى المعرض
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            {/* File Upload Button */}
            {!selectedFile ? (
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />
                <CloudUploadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  اختر صورة للرفع
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  JPG, PNG, GIF أو WEBP (حتى 10 ميجابايت)
                </Typography>
              </Box>
            ) : (
              // Image Preview
              <Box sx={{ position: 'relative' }}>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
                <IconButton
                  onClick={handleRemoveFile}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'background.paper',
                    '&:hover': { bgcolor: 'error.main', color: 'white' },
                  }}
                >
                  <DeleteIcon />
                </IconButton>
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1,
                    textAlign: 'center',
                    color: 'text.secondary',
                  }}
                >
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </Typography>
              </Box>
            )}
          </Box>

          {/* Description Field */}
          <TextField
            fullWidth
            multiline
            rows={4}
            label="وصف العمل (اختياري)"
            placeholder="اكتب وصفاً تفصيلياً للعمل المنجز، المواد المستخدمة، والمدة الزمنية..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            sx={{ mb: 3 }}
            disabled={isUploading}
          />

          {/* Error Message */}
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {uploadError}
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={!selectedFile || isUploading}
            startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
          >
            {isUploading ? 'جاري الرفع...' : 'رفع الصورة'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
