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
  LocationOn,
  Description,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useWorkerRequests, useRequestOperations } from '../hooks/useRequests';

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

const WorkerRequestsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Get worker_id from workerProfile if available
  const workerId = user?.workerProfile?.id || null;
  
  const { requests, loading, error, refetch } = useWorkerRequests(workerId);
  const {
    acceptRequest,
    rejectRequest,
    completeRequest,
    loading: actionLoading,
    error: actionError,
    success: actionSuccess,
  } = useRequestOperations();

  const [tabValue, setTabValue] = useState(0);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Filter requests by status
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const acceptedRequests = requests.filter((r) => r.status === 'accepted');
  const completedRequests = requests.filter((r) => r.status === 'completed');
  const otherRequests = requests.filter((r) =>
    ['rejected', 'cancelled'].includes(r.status)
  );

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

  const handleAcceptRequest = async (requestId) => {
    if (window.confirm('هل تريد قبول هذا الطلب؟')) {
      try {
        await acceptRequest(requestId);
        refetch();
      } catch (err) {
        console.error('Error accepting request:', err);
      }
    }
  };

  const handleRejectClick = (request) => {
    setSelectedRequest(request);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (!selectedRequest || !rejectReason.trim()) {
      alert('يرجى إدخال سبب الرفض');
      return;
    }

    try {
      await rejectRequest(selectedRequest.id, rejectReason);
      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectReason('');
      refetch();
    } catch (err) {
      console.error('Error rejecting request:', err);
    }
  };

  const handleCompleteRequest = async (requestId) => {
    if (window.confirm('هل أكملت هذا العمل؟')) {
      try {
        await completeRequest(requestId);
        refetch();
      } catch (err) {
        console.error('Error completing request:', err);
      }
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

  // Check if user is a worker and has worker profile
  if (!workerId) {
    return (
      <Container>
        <Alert severity="warning" sx={{ mt: 4 }}>
          لا يمكن الوصول إلى هذه الصفحة. يجب أن يكون لديك حساب عامل.
        </Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
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
          طلبات العمل
        </Typography>
        <Typography variant="body1" color="text.secondary">
          إدارة الطلبات الواردة من العملاء
        </Typography>
      </Box>

      {/* Action messages */}
      {actionSuccess && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => {}}>
          {actionSuccess}
        </Alert>
      )}
      {actionError && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => {}}>
          {actionError}
        </Alert>
      )}

      {/* Tabs for filtering */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`الكل (${requests.length})`} />
          <Tab label={`جديد (${pendingRequests.length})`} />
          <Tab label={`مقبول (${acceptedRequests.length})`} />
          <Tab label={`مكتمل (${completedRequests.length})`} />
          <Tab label={`أخرى (${otherRequests.length})`} />
        </Tabs>
      </Box>

      {/* Requests list */}
      {filteredRequests.length === 0 ? (
        <Alert severity="info">لا توجد طلبات في هذه الفئة</Alert>
      ) : (
        <Grid container spacing={3}>
          {filteredRequests.map((request) => (
            <Grid item xs={12} key={request.id}>
              <Card
                elevation={2}
                sx={{
                  border: request.status === 'pending' ? 2 : 0,
                  borderColor: 'warning.main',
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="start"
                    mb={2}
                  >
                    <Box flex={1}>
                      <Box display="flex" alignItems="center" gap={2} mb={1}>
                        <Typography variant="h6">{request.client?.name}</Typography>
                        <Chip
                          icon={getStatusIcon(request.status)}
                          label={getStatusText(request.status)}
                          color={getStatusColor(request.status)}
                          size="small"
                        />
                      </Box>

                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Phone fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {request.client?.phone}
                        </Typography>
                      </Box>

                      {request.client?.neighborhood && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <LocationOn fontSize="small" color="action" />
                          <Typography variant="body2" color="text.secondary">
                            {request.client.neighborhood.name} -{' '}
                            {request.client.neighborhood.area}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>

                  <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1, mb: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Description fontSize="small" color="action" />
                      <Typography variant="subtitle2" color="text.secondary">
                        وصف المشكلة:
                      </Typography>
                    </Box>
                    <Typography variant="body2">
                      {request.problem_description}
                    </Typography>
                  </Box>

                  {request.rejected_reason && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        سبب الرفض:
                      </Typography>
                      <Typography variant="body2">{request.rejected_reason}</Typography>
                    </Alert>
                  )}

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      تاريخ الطلب: {formatDate(request.created_at)}
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
                    <>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        onClick={() => handleAcceptRequest(request.id)}
                        disabled={actionLoading}
                      >
                        قبول
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleRejectClick(request)}
                        disabled={actionLoading}
                      >
                        رفض
                      </Button>
                    </>
                  )}
                  {request.status === 'accepted' && (
                    <Button
                      size="small"
                      variant="contained"
                      color="primary"
                      onClick={() => handleCompleteRequest(request.id)}
                      disabled={actionLoading}
                    >
                      إكمال العمل
                    </Button>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    href={`tel:${request.client?.phone}`}
                  >
                    الاتصال بالعميل
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Reject Dialog */}
      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>رفض الطلب</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            يرجى إدخال سبب رفض الطلب. سيتم إرسال هذا السبب للعميل.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="سبب الرفض"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="مثال: غير متوفر في الوقت المحدد حاليا، يرجى المحاولة في وقت لاحق"
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>إلغاء</Button>
          <Button
            onClick={handleRejectConfirm}
            color="error"
            variant="contained"
            disabled={actionLoading || !rejectReason.trim()}
          >
            {actionLoading ? 'جاري الرفض...' : 'تأكيد الرفض'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default WorkerRequestsPage;
