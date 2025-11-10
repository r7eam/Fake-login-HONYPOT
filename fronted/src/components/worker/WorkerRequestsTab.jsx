import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { useRequestsByWorker, useUpdateRequest } from '../../hooks/useWorkers';

function WorkerRequestsTab({ workerId }) {
  const { data: requests, isLoading, error, refetch } = useRequestsByWorker(workerId);
  const { mutate: updateRequest, isPending: isUpdating } = useUpdateRequest();

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [action, setAction] = useState(''); // 'accept', 'reject', 'complete'
  const [notes, setNotes] = useState('');

  const handleAction = (request, actionType) => {
    setSelectedRequest(request);
    setAction(actionType);
    setDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedRequest) return;

    try {
      // First update the status
      const statusData = { status: '' };
      
      switch (action) {
        case 'accept':
          statusData.status = 'accepted';
          break;
        case 'reject':
          statusData.status = 'rejected';
          break;
        case 'complete':
          statusData.status = 'completed';
          break;
        default:
          return;
      }

      // Update status first
      await updateRequest(
        { requestId: selectedRequest.id, data: statusData, isStatus: true },
        {
          onSuccess: async () => {
            // If there are notes, update them separately
            if (notes.trim()) {
              await updateRequest(
                { requestId: selectedRequest.id, data: { worker_notes: notes } },
                {
                  onSuccess: () => {
                    setDialogOpen(false);
                    setNotes('');
                    setSelectedRequest(null);
                    refetch();
                  },
                }
              );
            } else {
              setDialogOpen(false);
              setNotes('');
              setSelectedRequest(null);
              refetch();
            }
          },
          onError: (error) => {
            console.error('Error updating request:', error);
            alert('حدث خطأ أثناء تحديث الطلب');
          },
        }
      );
    } catch (error) {
      console.error('Error in handleConfirmAction:', error);
      alert('حدث خطأ أثناء تحديث الطلب');
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { label: 'قيد الانتظار', color: 'warning' },
      accepted: { label: 'مقبول', color: 'info' },
      completed: { label: 'مكتمل', color: 'success' },
      rejected: { label: 'مرفوض', color: 'error' },
      cancelled: { label: 'ملغي', color: 'default' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return <Chip label={config.label} color={config.color} size="small" />;
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        حدث خطأ أثناء تحميل الطلبات: {error.message}
      </Alert>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <Box textAlign="center" py={6}>
        <Typography variant="h6" color="text.secondary">
          لا توجد طلبات حالياً
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold" mb={3}>
        طلبات العمل ({requests.length})
      </Typography>

      <Grid container spacing={3}>
        {requests.map((request) => (
          <Grid size={{ xs: 12 }} key={request.id}>
            <Card
              elevation={2}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      طلب رقم #{request.id}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      <CalendarIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                      {new Date(request.created_at).toLocaleDateString('ar-EG')}
                    </Typography>
                  </Box>
                  {getStatusChip(request.status)}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        <strong>العميل:</strong> {request.client?.name || 'غير محدد'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        <strong>الهاتف:</strong> {request.client?.phone || 'غير محدد'}
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        <strong>الحي:</strong> {request.client?.neighborhood?.name || 'غير محدد'}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Box display="flex" alignItems="center" mb={1}>
                      <MoneyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        <strong>السعر المقترح:</strong> {request.proposed_price || 'غير محدد'} دينار
                      </Typography>
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        <strong>تاريخ الطلب:</strong>{' '}
                        {request.preferred_date
                          ? new Date(request.preferred_date).toLocaleDateString('ar-EG')
                          : 'غير محدد'}
                      </Typography>
                    </Box>
                  </Grid>

                  {request.description && (
                    <Grid item xs={12}>
                      <Box display="flex" alignItems="start" mt={1}>
                        <DescriptionIcon sx={{ mr: 1, color: 'text.secondary', mt: 0.5 }} />
                        <Box>
                          <Typography variant="body2" fontWeight="bold" gutterBottom>
                            وصف الطلب:
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {request.description}
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {request.worker_notes && (
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          <strong>ملاحظاتك:</strong> {request.worker_notes}
                        </Typography>
                      </Alert>
                    </Grid>
                  )}
                </Grid>

                {/* Action Buttons */}
                <Box mt={3} display="flex" gap={1} flexWrap="wrap">
                  {request.status === 'pending' && (
                    <>
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => handleAction(request, 'accept')}
                      >
                        قبول الطلب
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleAction(request, 'reject')}
                      >
                        رفض الطلب
                      </Button>
                    </>
                  )}
                  {request.status === 'accepted' && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={() => handleAction(request, 'complete')}
                    >
                      تم الإنجاز
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Action Confirmation Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {action === 'accept' && 'قبول الطلب'}
          {action === 'reject' && 'رفض الطلب'}
          {action === 'complete' && 'تأكيد الإنجاز'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {action === 'accept' && 'هل أنت متأكد من قبول هذا الطلب؟'}
            {action === 'reject' && 'هل أنت متأكد من رفض هذا الطلب؟'}
            {action === 'complete' && 'هل أنت متأكد من إتمام هذا الطلب؟'}
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="ملاحظات (اختياري)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="أضف أي ملاحظات للعميل..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={isUpdating}>
            إلغاء
          </Button>
          <Button
            onClick={handleConfirmAction}
            variant="contained"
            disabled={isUpdating}
            color={action === 'reject' ? 'error' : 'primary'}
          >
            {isUpdating ? <CircularProgress size={24} /> : 'تأكيد'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default WorkerRequestsTab;
