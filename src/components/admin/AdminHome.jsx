import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
} from '@mui/material';
import {
  Business as BusinessIcon,
  People as PeopleIcon,
  Notifications as NotificationsIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const AdminHome = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/admin/dashboard');
      setStats(response.data.data);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const statCards = [
    {
      title: 'Total de Tenants',
      value: stats?.totalTenants || 0,
      icon: <BusinessIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Total de Usuários',
      value: stats?.totalUsers || 0,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Total de Clientes',
      value: stats?.totalCustomers || 0,
      icon: <PersonAddIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
    {
      title: 'Notificações Enviadas',
      value: stats?.totalNotifications || 0,
      icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard Administrativo
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      {card.title}
                    </Typography>
                    <Typography variant="h4">{card.value}</Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Tenants Ativos vs Inativos
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  {
                    name: 'Status',
                    Ativos: stats?.activeTenants || 0,
                    Inativos: (stats?.totalTenants || 0) - (stats?.activeTenants || 0),
                  },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Ativos" fill="#2e7d32" />
                <Bar dataKey="Inativos" fill="#d32f2f" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resumo do Sistema
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" gutterBottom>
                <strong>Créditos Totais Alocados:</strong> {stats?.totalCreditsAllocated?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Créditos Utilizados:</strong> {stats?.totalCreditsUsed?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Taxa de Sucesso:</strong>{' '}
                {stats?.totalNotifications > 0
                  ? ((stats?.successfulNotifications / stats?.totalNotifications) * 100).toFixed(2)
                  : 0}
                %
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>Notificações com Falha:</strong> {stats?.failedNotifications || 0}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdminHome;
