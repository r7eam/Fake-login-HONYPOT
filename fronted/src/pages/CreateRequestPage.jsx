import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { Send, ArrowBack } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useRequestOperations } from '../hooks/useRequests';
import { useWorker } from '../hooks/useWorkers';

const CreateRequestPage = () => {
  const navigate = useNavigate();
  const { workerId } = useParams();
  const { user } = useAuth();
  const { worker, loading: workerLoading } = useWorker(workerId);
  const { createRequest, loading, error, success } = useRequestOperations();

  const [problemDescription, setProblemDescription] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Check if user is authenticated
    const token = localStorage.getItem('access_token');
    console.log('Token exists:', !!token);
    console.log('User:', user);
    
    if (!token || !user) {
      setFormError('يجب تسجيل الدخول لإنشاء طلب');
      return;
    }

    if (!problemDescription.trim()) {
      setFormError('يرجى إدخال وصف المشكلة');
      return;
    }

    try {
      await createRequest({
        worker_id: parseInt(workerId),
        problem_description: problemDescription.trim(),
      });

      // Navigate to requests page after successful creation
      setTimeout(() => {
        navigate('/my-requests');
      }, 2000);
    } catch (err) {
      console.error('Error creating request:', err);
    }
  };

  if (workerLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!worker) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          لم يتم العثور على العامل
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4, mt: 10 }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => navigate(-1)}
        sx={{ mb: 3 }}
      >
        رجوع
      </Button>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          طلب خدمة
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={4}>
          قم بوصف المشكلة أو الخدمة المطلوبة بشكل تفصيلي
        </Typography>

        {/* Worker Info Card */}
        <Card sx={{ mb: 4, bgcolor: 'grey.50' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              سيتم إرسال الطلب إلى:
            </Typography>
            <Typography variant="h6">{worker.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {worker.profession?.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {worker.neighborhood?.name} - {worker.neighborhood?.area}
            </Typography>
          </CardContent>
        </Card>

        {/* Success Message */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success} - سيتم تحويلك إلى صفحة الطلبات...
          </Alert>
        )}

        {/* Error Messages */}
        {(error || formError) && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error || formError}
          </Alert>
        )}

        {/* Request Form */}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={6}
            label="وصف المشكلة أو الخدمة المطلوبة"
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="مثال: مشكلة في الكهرباء بالمطبخ، الإنارة لا تعمل والمقابس لا تحتوي على تيار كهربائي. المشكلة بدأت منذ يومين."
            required
            disabled={loading || success}
            helperText="قم بوصف المشكلة بشكل تفصيلي لمساعدة العامل على فهم الموقف بشكل أفضل"
            sx={{ mb: 3 }}
          />

          <Box display="flex" gap={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              disabled={loading || success}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Send />}
              disabled={loading || success || !problemDescription.trim()}
            >
              {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </Button>
          </Box>
        </form>

        {/* Additional Info */}
        <Box mt={4} p={2} bgcolor="info.lighter" borderRadius={1}>
          <Typography variant="body2" color="text.secondary">
            💡 <strong>ملاحظة:</strong> بعد إرسال الطلب، سيقوم العامل بمراجعته وسيتمكن من
            قبوله أو رفضه. سيتم إعلامك بالقرار ويمكنك متابعة حالة الطلب من صفحة "طلباتي".
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default CreateRequestPage;
