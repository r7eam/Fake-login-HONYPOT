import { Box, Grid, Paper, Typography, CircularProgress } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Star as StarIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useWorkerById, useRequestsByWorker } from '../../hooks/useWorkers';

function WorkerStatsTab({ workerId }) {
  const { data: worker, isLoading: workerLoading } = useWorkerById(workerId);
  const { data: requests, isLoading: requestsLoading } = useRequestsByWorker(workerId);

  if (workerLoading || requestsLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Calculate statistics
  const totalRequests = requests?.length || 0;
  const completedRequests = requests?.filter(r => r.status === 'completed').length || 0;
  const pendingRequests = requests?.filter(r => r.status === 'pending').length || 0;
  const acceptedRequests = requests?.filter(r => r.status === 'accepted').length || 0;
  const averageRating = worker?.average_rating || 0;
  const completionRate = totalRequests > 0 ? ((completedRequests / totalRequests) * 100).toFixed(1) : 0;

  const statCards = [
    {
      title: 'إجمالي الطلبات',
      value: totalRequests,
      icon: <TrendingUpIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      bgColor: '#e3f2fd',
    },
    {
      title: 'الطلبات المكتملة',
      value: completedRequests,
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
      bgColor: '#e8f5e9',
    },
    {
      title: 'الطلبات قيد الانتظار',
      value: pendingRequests,
      icon: <PendingIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      bgColor: '#fff3e0',
    },
    {
      title: 'التقييم',
      value: typeof averageRating === 'number' ? averageRating.toFixed(1) : '0.0',
      icon: <StarIcon sx={{ fontSize: 40 }} />,
      color: '#f9a825',
      bgColor: '#fffde7',
    },
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom fontWeight="bold" mb={3}>
        الإحصائيات
      </Typography>

      <Grid container spacing={3}>
        {statCards.map((stat, index) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
            <Paper
              elevation={1}
              sx={{
                p: 3,
                textAlign: 'center',
                borderRight: `4px solid ${stat.color}`,
                backgroundColor: stat.bgColor,
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                },
              }}
            >
              <Box sx={{ color: stat.color, mb: 1 }}>
                {stat.icon}
              </Box>
              <Typography variant="h4" fontWeight="bold" color={stat.color}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {stat.title}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} mt={2}>
        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              نسبة الإنجاز
            </Typography>
            <Box display="flex" alignItems="center" mt={2}>
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <CircularProgress
                  variant="determinate"
                  value={parseFloat(completionRate)}
                  size={80}
                  thickness={5}
                  sx={{ color: '#2e7d32' }}
                />
                <Box
                  sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h6" component="div" color="text.secondary" fontWeight="bold">
                    {completionRate}%
                  </Typography>
                </Box>
              </Box>
              <Box ml={3}>
                <Typography variant="body2" color="text.secondary">
                  من إجمالي {totalRequests} طلب
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  تم إنجاز {completedRequests} طلب
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={1} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              معلومات إضافية
            </Typography>
            <Box mt={2}>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  الطلبات المقبولة:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {acceptedRequests}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  سنوات الخبرة:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {worker?.experience_years || 0} سنة
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={2}>
                <Typography variant="body2" color="text.secondary">
                  الحالة:
                </Typography>
                <Typography
                  variant="body1"
                  fontWeight="bold"
                  color={worker?.is_available ? 'success.main' : 'error.main'}
                >
                  {worker?.is_available ? 'متاح' : 'غير متاح'}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default WorkerStatsTab;
