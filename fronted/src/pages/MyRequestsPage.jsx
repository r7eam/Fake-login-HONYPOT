import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Grid,
  Tab,
  Tabs,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  AccessTime,
  CheckCircle,
  Cancel,
  Block,
  Phone,
  Work,
  LocationOn,
  RateReview,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useClientRequests, useWorkerRequests, useRequestOperations } from '../hooks/useRequests';
import { useWorkerByUserId } from '../hooks/useWorkers';
import CreateReviewForm from '../components/reviews/CreateReviewForm.jsx';

const getStatusColor = (status) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'accepted':
      return 'info';
    case 'completed':
      return 'success';
    case 'rejected':
    case 'cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending':
      return 'قيد الانتظار';
    case 'accepted':
      return 'مقبول';
    case 'completed':
      return 'مكتمل';
    case 'rejected':
      return 'مرفوض';
    case 'cancelled':
      return 'ملغي';
    default:
      return status;
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'pending':
      return <AccessTime />;
    case 'accepted':
      return <CheckCircle />;
    case 'completed':
      return <CheckCircle />;
    case 'rejected':
      return <Block />;
    case 'cancelled':
      return <Cancel />;
    default:
      return null;
  }
};

const MyRequestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch worker profile if user is a worker
  const { worker } = useWorkerByUserId(user?.role === 'worker' ? user?.id : null);
  const workerId = worker?.id || null;
  
  // Fetch requests based on user role
  const { requests: clientRequests, loading: clientLoading, error: clientError, refetch: refetchClient } = useClientRequests(user?.id);
  const { requests: workerRequests, loading: workerLoading, error: workerError, refetch: refetchWorker } = useWorkerRequests(workerId);
  
  const { cancelRequest, deleteRequest, loading: actionLoading } = useRequestOperations();
  
  const [tabValue, setTabValue] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [requestToReview, setRequestToReview] = useState(null);

  // Combine requests from both client and worker
  const allRequests = [
    ...(clientRequests || []),
    ...(user?.role === 'worker' && workerRequests ? workerRequests : [])
  ];
  
  // Remove duplicates if any (in case same user is both client and worker for same request)
  const requests = allRequests.filter((request, index, self) =>
    index === self.findIndex((r) => r.id === request.id)
  );
  
  const loading = clientLoading || workerLoading;
  const error = clientError || workerError;
  
  const refetch = () => {
    refetchClient();
    if (workerId) {
      refetchWorker();
    }
  };

  // Filter requests by status
  const pendingRequests = requests.filter(r => r.status === 'pending');
  const acceptedRequests = requests.filter(r => r.status === 'accepted');
  const completedRequests = requests.filter(r => r.status === 'completed');
  const otherRequests = requests.filter(r => ['rejected', 'cancelled'].includes(r.status));

  const getFilteredRequests = () => {
    switch (tabValue) {
      case 0:
        return requests; // All
      case 1:
        return pendingRequests;
      case 2:
        return acceptedRequests;
      case 3:
        return completedRequests;
      case 4:
        return otherRequests;
      default:
        return requests;
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (window.confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) {
      try {
        await cancelRequest(requestId);
        refetch();
      } catch (err) {
        console.error('Error cancelling request:', err);
      }
    }
  };

  const handleDeleteRequest = async () => {
    if (!selectedRequest) return;
    
    try {
      await deleteRequest(selectedRequest.id);
      setDeleteDialogOpen(false);
      setSelectedRequest(null);
      refetch();
    } catch (err) {
      console.error('Error deleting request:', err);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 10 }}>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  const filteredRequests = getFilteredRequests();

  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: 10 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          طلباتي
        </Typography>
        <Typography variant="body1" color="text.secondary">
          عرض وإدارة طلبات الخدمات الخاصة بك
        </Typography>
      </Box>

      {/* Tabs for filtering */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`الكل (${requests.length})`} />
          <Tab label={`قيد الانتظار (${pendingRequests.length})`} />
          <Tab label={`مقبول (${acceptedRequests.length})`} />
          <Tab label={`مكتمل (${completedRequests.length})`} />
          <Tab label={`أخرى (${otherRequests.length})`} />
        </Tabs>
      </Box>

      {/* Requests list */}
      {filteredRequests.length === 0 ? (
        <Alert severity="info">
          لا توجد طلبات في هذه الفئة
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredRequests.map((request) => (
            <Grid item xs={12} key={request.id}>
              <Card elevation={2}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {request.worker?.user?.name || 'غير محدد'}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Work fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {request.worker?.profession?.name || 'غير محدد'}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {request.worker?.contact_phone || request.worker?.user?.phone || 'غير محدد'}
                        </Typography>
                      </Box>
                      {request.worker?.user?.neighborhood && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {request.worker.user.neighborhood.name} - {request.worker.user.neighborhood.area}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    <Chip
                      icon={getStatusIcon(request.status)}
                      label={getStatusText(request.status)}
                      color={getStatusColor(request.status)}
                      size="medium"
                    />
                  </Box>

                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      وصف المشكلة:
                    </Typography>
                    <Typography variant="body2">
                      {request.problem_description}
                    </Typography>
                  </Box>

                  {request.rejected_reason && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        سبب الرفض:
                      </Typography>
                      <Typography variant="body2">
                        {request.rejected_reason}
                      </Typography>
                    </Alert>
                  )}

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      تاريخ الإنشاء: {formatDate(request.created_at)}
                    </Typography>
                    {request.completed_at && (
                      <Typography variant="caption" color="success.main">
                        تاريخ الإكمال: {formatDate(request.completed_at)}
                      </Typography>
                    )}
                  </Box>
                </CardContent>

                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
                  {request.status === 'pending' && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => handleCancelRequest(request.id)}
                      disabled={actionLoading}
                    >
                      إلغاء الطلب
                    </Button>
                  )}
                  {request.status === 'accepted' && (
                    <Button
                      size="small"
                      color="warning"
                      onClick={() => handleCancelRequest(request.id)}
                      disabled={actionLoading}
                    >
                      إلغاء الطلب
                    </Button>
                  )}
                  {request.status === 'completed' && request.client_id === user?.id && !request.review && (
                    <Button
                      size="small"
                      color="primary"
                      variant="contained"
                      startIcon={<RateReview />}
                      onClick={() => {
                        setRequestToReview(request);
                        setReviewDialogOpen(true);
                      }}
                    >
                      تقييم الخدمة
                    </Button>
                  )}
                  {request.status === 'completed' && request.review && (
                    <Chip
                      icon={<RateReview />}
                      label="تم التقييم"
                      color="success"
                      size="small"
                    />
                  )}
                  {['rejected', 'cancelled', 'completed'].includes(request.status) && (
                    <Button
                      size="small"
                      color="error"
                      onClick={() => {
                        setSelectedRequest(request);
                        setDeleteDialogOpen(true);
                      }}
                      disabled={actionLoading}
                    >
                      حذف
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/worker-detail/${request.worker_id}`)}
                  >
                    عرض ملف العامل
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>إلغاء</Button>
          <Button onClick={handleDeleteRequest} color="error" disabled={actionLoading}>
            {actionLoading ? 'جاري الحذف...' : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Review Dialog */}
      <Dialog 
        open={reviewDialogOpen} 
        onClose={() => setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>تقييم الخدمة</DialogTitle>
        <DialogContent>
          {requestToReview && (
            <CreateReviewForm
              request={requestToReview}
              onSuccess={() => {
                setReviewDialogOpen(false);
                setRequestToReview(null);
                refetch();
              }}
              onCancel={() => {
                setReviewDialogOpen(false);
                setRequestToReview(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default MyRequestsPage;
