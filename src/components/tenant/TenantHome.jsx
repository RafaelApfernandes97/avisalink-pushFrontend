import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  People as PeopleIcon,
  Link as LinkIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  AccountBalanceWallet as CreditIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

const TenantHome = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/tenant/dashboard');
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

  const creditUsagePercent = stats?.credits?.monthly_limit > 0
    ? ((stats?.credits?.used_this_month || 0) / stats?.credits?.monthly_limit) * 100
    : 0;

  const statCards = [
    {
      title: 'Créditos Disponíveis',
      value: stats?.credits?.current_balance?.toLocaleString() || 0,
      subtitle: `de ${stats?.credits?.monthly_limit?.toLocaleString() || 0}`,
      icon: <CreditIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
    },
    {
      title: 'Total de Clientes',
      value: stats?.customers?.total || 0,
      subtitle: `${stats?.customers?.active || 0} ativos`,
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#2e7d32',
    },
    {
      title: 'Notificações Enviadas',
      value: stats?.notifications?.total_sent || 0,
      subtitle: `${stats?.notifications?.sent_this_month || 0} este mês`,
      icon: <NotificationsIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
    },
    {
      title: 'Taxa de Entrega',
      value: `${stats?.notifications?.delivery_rate || 0}%`,
      subtitle: `${stats?.notifications?.click_rate || 0}% de cliques`,
      icon: <CheckCircleIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
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
                    <Typography variant="body2" color="textSecondary">
                      {card.subtitle}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Opt-In Links Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Links de Opt-In
                  </Typography>
                  <Typography variant="h4">{stats?.optInLinks?.total || 0}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {stats?.optInLinks?.active || 0} ativos
                  </Typography>
                </Box>
                <Box sx={{ color: '#f57c00' }}>
                  <LinkIcon sx={{ fontSize: 40 }} />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Uso de Créditos Mensais
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  {stats?.credits?.used_this_month?.toLocaleString() || 0} / {stats?.credits?.monthly_limit?.toLocaleString() || 0}
                </Typography>
                <Typography variant="body2">{creditUsagePercent.toFixed(1)}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={Math.min(creditUsagePercent, 100)}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: creditUsagePercent > 90 ? '#d32f2f' : creditUsagePercent > 70 ? '#ed6c02' : '#2e7d32',
                  },
                }}
              />
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Disponível: {stats?.credits?.current_balance?.toLocaleString() || 0} créditos
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Performance de Notificações
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box display="flex" alignItems="center" mb={2}>
                <NotificationsIcon sx={{ color: '#1976d2', mr: 1 }} />
                <Typography variant="body1">
                  <strong>Total Enviadas:</strong> {stats?.notifications?.total_sent?.toLocaleString() || 0}
                </Typography>
              </Box>
              <Box display="flex" alignItems="center" mb={2}>
                <CheckCircleIcon sx={{ color: '#2e7d32', mr: 1 }} />
                <Typography variant="body1">
                  <strong>Taxa de Entrega:</strong> {stats?.notifications?.delivery_rate || 0}%
                </Typography>
              </Box>
              <Box display="flex" alignItems="center">
                <LinkIcon sx={{ color: '#ed6c02', mr: 1 }} />
                <Typography variant="body1">
                  <strong>Taxa de Cliques:</strong> {stats?.notifications?.click_rate || 0}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Atividade Recente
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Gráfico de atividade dos últimos 30 dias em desenvolvimento...
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default TenantHome;
