import React, { useState } from 'react';
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Tooltip,
  Button,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle,
  Cancel,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useUsers } from '../../hooks/useUsers';
import { usersApi } from '../../config/usersApi';

const UsersList = () => {
  const navigate = useNavigate();
  const { users, loading, error, refetch } = useUsers();
  const [deleting, setDeleting] = useState(null);

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`هل أنت متأكد من حذف المستخدم "${userName}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    setDeleting(userId);
    try {
      await usersApi.deleteUser(userId);
      alert('تم حذف المستخدم بنجاح');
      refetch(); // Reload users list
    } catch (err) {
      alert(err.message || 'فشل في حذف المستخدم');
    } finally {
      setDeleting(null);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'error',
      worker: 'primary',
      client: 'success',
    };
    return colors[role] || 'default';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'مدير',
      worker: 'عامل',
      client: 'عميل',
    };
    return labels[role] || role;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={refetch}>
          إعادة المحاولة
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 12, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" fontWeight="bold">
          إدارة المستخدمين
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={() => navigate('/admin/users/create')}
        >
          إضافة مستخدم جديد
        </Button>
      </Box>

      <Paper elevation={3}>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#1976d2' }}>
                <TableCell sx={{ fontWeight: 'bold', color: 'white', padding: '16px' }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white', padding: '16px' }}>الاسم</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white', padding: '16px' }}>البريد الإلكتروني</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white', padding: '16px' }}>الهاتف</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white', padding: '16px' }}>الدور</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white', padding: '16px' }}>الحي</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white', padding: '16px' }}>التحقق</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white', padding: '16px' }}>الحالة</TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: 'white', padding: '16px' }}>آخر تسجيل دخول</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'white', padding: '16px' }}>الإجراءات</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      لا يوجد مستخدمين في النظام
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow 
                    key={user.id}
                    hover
                    sx={{ 
                      '&:nth-of-type(odd)': { backgroundColor: '#f5f5f5' },
                      '&:hover': { backgroundColor: '#e3f2fd' }
                    }}
                  >
                    <TableCell sx={{ padding: '12px 16px' }}>{user.id}</TableCell>
                    <TableCell sx={{ padding: '12px 16px' }}>
                      <Typography variant="body2" fontWeight="medium">
                        {user.name}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ padding: '12px 16px' }}>{user.email || '-'}</TableCell>
                    <TableCell sx={{ padding: '12px 16px' }} dir="ltr">{user.phone}</TableCell>
                    <TableCell sx={{ padding: '12px 16px' }}>
                      <Chip
                        label={getRoleLabel(user.role)}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell sx={{ padding: '12px 16px' }}>
                      {user.neighborhood ? (
                        <Box>
                          <Typography variant="body2">{user.neighborhood.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {user.neighborhood.area}
                          </Typography>
                        </Box>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell sx={{ padding: '12px 16px' }}>
                      <Box display="flex" gap={1} alignItems="center">
                        <Tooltip title={user.email_verified ? "البريد موثق" : "البريد غير موثق"}>
                          {user.email_verified ? (
                            <CheckCircle color="success" fontSize="small" />
                          ) : (
                            <Cancel color="disabled" fontSize="small" />
                          )}
                        </Tooltip>
                        <Tooltip title={user.phone_verified ? "الهاتف موثق" : "الهاتف غير موثق"}>
                          {user.phone_verified ? (
                            <CheckCircle color="success" fontSize="small" />
                          ) : (
                            <Cancel color="disabled" fontSize="small" />
                          )}
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ padding: '12px 16px' }}>
                      <Chip
                        label={user.is_active ? 'نشط' : 'معطل'}
                        color={user.is_active ? 'success' : 'default'}
                        size="small"
                        variant={user.is_active ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell sx={{ padding: '12px 16px' }}>
                      <Typography variant="caption">
                        {formatDate(user.last_login)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ padding: '12px 16px' }}>
                      <Box display="flex" gap={0.5} justifyContent="center">
                        <Tooltip title="تعديل">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="حذف">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(user.id, user.name)}
                            disabled={deleting === user.id}
                          >
                            {deleting === user.id ? (
                              <CircularProgress size={20} />
                            ) : (
                              <DeleteIcon fontSize="small" />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="textSecondary">
          إجمالي المستخدمين: {users.length}
        </Typography>
      </Box>
    </Container>
  );
};

export default UsersList;
