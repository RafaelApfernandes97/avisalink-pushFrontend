import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  CircularProgress,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const SystemMetrics = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/metrics');
      console.log('Metrics API Response:', response.data);

      // A API retorna { success: true, data: {...} }
      const metricsData = response.data.data || response.data;
      setMetrics(metricsData);
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          'Erro ao carregar métricas';
      setError(errorMessage);
      enqueueSnackbar(errorMessage, { variant: 'error' });
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

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="textSecondary">
          Verifique se há dados suficientes no sistema para gerar as métricas.
        </Typography>
      </Box>
    );
  }

  if (!metrics) {
    return (
      <Box>
        <Alert severity="info">
          Nenhuma métrica disponível no momento.
        </Alert>
      </Box>
    );
  }

  // Adaptar os dados para os gráficos
  const tenantsByDay = metrics.tenants_by_day || [];
  const customersByDay = metrics.customers_by_day || [];
  const notificationsByDay = metrics.notifications_by_day || [];
  const creditsConsumedByDay = metrics.credits_consumed_by_day || [];

  // Dados do gráfico de pizza (se houver dados de notificações)
  const notificationStatusData = notificationsByDay.length > 0
    ? [
        { name: 'Enviadas', value: notificationsByDay.reduce((sum, item) => sum + (item.total_sent || 0), 0) },
        { name: 'Entregues', value: notificationsByDay.reduce((sum, item) => sum + (item.total_delivered || 0), 0) },
      ]
    : [
        { name: 'Sem dados', value: 1 }
      ];

  // Dados do gráfico de barras de créditos
  const creditUsageData = creditsConsumedByDay.length > 0
    ? creditsConsumedByDay.map(item => ({
        data: item.date,
        Consumidos: item.amount || 0,
      }))
    : [{ data: 'Sem dados', Consumidos: 0 }];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Métricas do Sistema
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Gráfico de Tenants por Dia */}
        {tenantsByDay.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Novos Tenants por Dia
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tenantsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" name="Tenants" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Gráfico de Clientes por Dia */}
        {customersByDay.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Novos Clientes por Dia
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={customersByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#82ca9d" name="Clientes" />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Gráfico de Notificações por Dia */}
        {notificationsByDay.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Notificações por Dia
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={notificationsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total_sent" fill="#8884d8" name="Enviadas" />
                  <Bar dataKey="total_delivered" fill="#82ca9d" name="Entregues" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Gráfico de Créditos Consumidos */}
        {creditsConsumedByDay.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Créditos Consumidos por Dia
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={creditUsageData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="data" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Consumidos" fill="#ffc658" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Status das Notificações - Pizza */}
        {notificationsByDay.length > 0 && (
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Status das Notificações
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={notificationStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {notificationStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        )}

        {/* Cards de Estatísticas */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Resumo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total de Tenants
                    </Typography>
                    <Typography variant="h4">
                      {tenantsByDay.reduce((sum, item) => sum + (item.count || 0), 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total de Clientes
                    </Typography>
                    <Typography variant="h4">
                      {customersByDay.reduce((sum, item) => sum + (item.count || 0), 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Notificações Enviadas
                    </Typography>
                    <Typography variant="h4">
                      {notificationsByDay.reduce((sum, item) => sum + (item.total_sent || 0), 0)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Créditos Consumidos
                    </Typography>
                    <Typography variant="h4">
                      {creditsConsumedByDay.reduce((sum, item) => sum + (item.amount || 0), 0).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Mensagem se não houver dados */}
        {tenantsByDay.length === 0 && customersByDay.length === 0 && notificationsByDay.length === 0 && (
          <Grid item xs={12}>
            <Alert severity="info">
              Não há dados de métricas disponíveis para o período selecionado.
              Crie alguns tenants, clientes e notificações para ver as métricas.
            </Alert>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default SystemMetrics;
