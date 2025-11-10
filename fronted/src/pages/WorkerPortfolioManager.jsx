import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Alert,
  Snackbar,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import PortfolioGallery from '../components/PortfolioGallery';
import PortfolioUpload from '../components/PortfolioUpload';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`portfolio-tabpanel-${index}`}
      aria-labelledby={`portfolio-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

/**
 * Worker Portfolio Management Page
 * Allows workers to view and manage their portfolio
 */
export default function WorkerPortfolioManager() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleUploadSuccess = (result) => {
    setSnackbar({
      open: true,
      message: 'تم رفع الصورة بنجاح إلى معرض الأعمال',
      severity: 'success',
    });
    setRefreshKey(prev => prev + 1); // Force refresh portfolio gallery
    setTabValue(0); // Switch to gallery tab
  };

  const handleUploadError = (error) => {
    setSnackbar({
      open: true,
      message: error.message || 'حدث خطأ أثناء رفع الصورة',
      severity: 'error',
    });
  };

  const handleDeleteSuccess = (portfolioId) => {
    setSnackbar({
      open: true,
      message: 'تم حذف العنصر من معرض الأعمال بنجاح',
      severity: 'success',
    });
    setRefreshKey(prev => prev + 1); // Force refresh portfolio gallery
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Check if user is a worker
  if (!user || user.role !== 'worker') {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="warning">
          هذه الصفحة متاحة للعمال فقط. يرجى تسجيل الدخول كعامل.
        </Alert>
      </Container>
    );
  }

  // Get worker ID from user data
  const workerId = user.worker_id || user.workerId;

  if (!workerId) {
    return (
      <Container sx={{ py: 8 }}>
        <Alert severity="error">
          لم يتم العثور على معلومات العامل. يرجى إكمال ملف التعريف الخاص بك.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: 10 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
        إدارة معرض الأعمال
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="portfolio management tabs">
          <Tab label="معرض الأعمال" />
          <Tab label="إضافة عمل جديد" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <PortfolioGallery
          key={refreshKey} // Force re-render on changes
          workerId={workerId}
          canEdit={true}
          onDelete={handleDeleteSuccess}
        />
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <PortfolioUpload
          onSuccess={handleUploadSuccess}
          onError={handleUploadError}
        />
      </TabPanel>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
