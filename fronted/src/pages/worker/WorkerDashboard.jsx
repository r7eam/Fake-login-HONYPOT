import { useState } from 'react';
import { Container, Box, Tabs, Tab, Typography, Paper, CircularProgress } from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useWorkerByUserId } from '../../hooks/useWorkers';
import WorkerProfileTab from '../../components/worker/WorkerProfileTab';
import WorkerRequestsTab from '../../components/worker/WorkerRequestsTab';
import WorkerStatsTab from '../../components/worker/WorkerStatsTab';

function WorkerDashboard() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  
  // Fetch worker profile to get worker ID
  const { worker, loading: workerLoading } = useWorkerByUserId(user?.id);
  const workerId = worker?.id || null;
  
  // DEBUG: Log to see what we're getting
  console.log('Worker Dashboard Debug:', {
    userId: user?.id,
    userRole: user?.role,
    worker: worker,
    workerId: workerId
  });

  // Check if user is a worker
  if (!user || user.role !== 'worker') {
    return (
      <Container sx={{ py: 8, mt: 8 }}>
        <Typography variant="h5" color="error" textAlign="center">
          هذه الصفحة مخصصة للعمال فقط
        </Typography>
      </Container>
    );
  }
  
  // Show loading while fetching worker data
  if (workerLoading) {
    return (
      <Container sx={{ py: 8, mt: 10, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4, mt: 10 }}>
      <Box mb={4}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          لوحة العامل
        </Typography>
        <Typography variant="body1" color="text.secondary">
          إدارة ملفك الشخصي وطلبات العمل
        </Typography>
      </Box>

      <Paper elevation={2}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            '& .MuiTab-root': {
              fontSize: '1.1rem',
              fontWeight: 600,
              py: 2,
            },
          }}
        >
          <Tab icon={<DashboardIcon />} label="الإحصائيات" iconPosition="start" />
          <Tab icon={<AssignmentIcon />} label="طلبات العمل" iconPosition="start" />
          <Tab icon={<PersonIcon />} label="الملف الشخصي" iconPosition="start" />
        </Tabs>

        <Box sx={{ p: 3, minHeight: '500px' }}>
          {/* Tab 0: Statistics */}
          {tabValue === 0 && <WorkerStatsTab workerId={workerId} />}

          {/* Tab 1: Incoming Requests */}
          {tabValue === 1 && <WorkerRequestsTab workerId={workerId} />}

          {/* Tab 2: Profile Management */}
          {tabValue === 2 && <WorkerProfileTab />}
        </Box>
      </Paper>
    </Container>
  );
}

export default WorkerDashboard;
