import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  ShoppingCart as ShoppingCartIcon,
  Timeline as TimelineIcon,
  RequestQuote as RequestQuoteIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function CreditManagement() {
  const [credits, setCredits] = useState(null);
  const [usage, setUsage] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [requestAmount, setRequestAmount] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchCreditData();
  }, []);

  const fetchCreditData = async () => {
    try {
      setLoading(true);
      const [creditsRes, usageRes, transactionsRes] = await Promise.all([
        api.get('/tenant/credits'),
        api.get('/tenant/credits/usage'),
        api.get('/tenant/credits/transactions'),
      ]);

      setCredits(creditsRes.data);
      setUsage(usageRes.data);
      setTransactions(transactionsRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados de créditos:', error);
      enqueueSnackbar('Erro ao carregar dados de créditos', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCredits = async () => {
    try {
      if (!requestAmount || parseInt(requestAmount) <= 0) {
        enqueueSnackbar('Informe uma quantidade válida de créditos', { variant: 'warning' });
        return;
      }

      await api.post('/tenant/credits/request', {
        amount: parseInt(requestAmount),
        reason: requestReason,
      });

      enqueueSnackbar('Solicitação enviada com sucesso', { variant: 'success' });
      setOpenRequestDialog(false);
      setRequestAmount('');
      setRequestReason('');
      fetchCreditData();
    } catch (error) {
      console.error('Erro ao solicitar créditos:', error);
      enqueueSnackbar(error.response?.data?.message || 'Erro ao solicitar créditos', {
        variant: 'error'
      });
    }
  };

  const calculateUsagePercentage = () => {
    if (!credits || !credits.limit) return 0;
    const used = credits.limit - credits.available;
    return (used / credits.limit) * 100;
  };

  const getUsageColor = () => {
    const percentage = calculateUsagePercentage();
    if (percentage >= 90) return 'error';
    if (percentage >= 70) return 'warning';
    return 'success';
  };

  const getTransactionTypeLabel = (type) => {
    const types = {
      purchase: 'Compra',
      usage: 'Uso',
      refund: 'Reembolso',
      adjustment: 'Ajuste',
      bonus: 'Bônus',
    };
    return types[type] || type;
  };

  const getTransactionTypeColor = (type) => {
    const colors = {
      purchase: 'success',
      usage: 'error',
      refund: 'info',
      adjustment: 'warning',
      bonus: 'success',
    };
    return colors[type] || 'default';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Gerenciar Créditos
        </Typography>
        <Button
          variant="contained"
          startIcon={<RequestQuoteIcon />}
          onClick={() => setOpenRequestDialog(true)}
        >
          Solicitar Créditos
        </Button>
      </Box>

      {/* Cards de Resumo */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AccountBalanceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Créditos Disponíveis</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {credits?.available?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                de {credits?.limit?.toLocaleString() || 0} no limite mensal
              </Typography>
              <Box mt={2}>
                <LinearProgress
                  variant="determinate"
                  value={100 - calculateUsagePercentage()}
                  color={getUsageColor()}
                  sx={{ height: 8, borderRadius: 1 }}
                />
                <Typography variant="caption" color="textSecondary" mt={0.5}>
                  {calculateUsagePercentage().toFixed(1)}% utilizado
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TimelineIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Usado este Mês</Typography>
              </Box>
              <Typography variant="h3" color="info.main">
                {credits?.usedThisMonth?.toLocaleString() || 0}
              </Typography>
              <Box display="flex" alignItems="center" mt={1}>
                {credits?.trend === 'up' ? (
                  <>
                    <TrendingUpIcon color="error" fontSize="small" />
                    <Typography variant="body2" color="error.main" ml={0.5}>
                      +{credits?.trendPercentage || 0}% vs mês anterior
                    </Typography>
                  </>
                ) : (
                  <>
                    <TrendingDownIcon color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main" ml={0.5}>
                      -{credits?.trendPercentage || 0}% vs mês anterior
                    </Typography>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <ShoppingCartIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Adquirido</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {credits?.totalPurchased?.toLocaleString() || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary" mt={1}>
                Créditos adquiridos desde o início
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Alertas */}
      {calculateUsagePercentage() >= 90 && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <strong>Atenção!</strong> Você está próximo do limite mensal de créditos.
          Solicite mais créditos para evitar interrupções no serviço.
        </Alert>
      )}

      {calculateUsagePercentage() >= 70 && calculateUsagePercentage() < 90 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Você utilizou {calculateUsagePercentage().toFixed(1)}% dos seus créditos mensais.
          Considere solicitar mais créditos em breve.
        </Alert>
      )}

      {/* Gráfico de Uso */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Histórico de Uso (Últimos 6 meses)
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={usage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="used" fill="#1976d2" name="Créditos Usados" />
              <Bar dataKey="purchased" fill="#2e7d32" name="Créditos Adquiridos" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Histórico de Transações */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Histórico de Transações
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Descrição</TableCell>
                  <TableCell align="right">Quantidade</TableCell>
                  <TableCell align="right">Saldo Após</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="textSecondary" py={3}>
                        Nenhuma transação registrada ainda.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {transaction.createdAt
                          ? format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getTransactionTypeLabel(transaction.type)}
                          color={getTransactionTypeColor(transaction.type)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{transaction.description || '-'}</TableCell>
                      <TableCell align="right">
                        <Typography
                          color={
                            transaction.type === 'usage'
                              ? 'error.main'
                              : 'success.main'
                          }
                          fontWeight="bold"
                        >
                          {transaction.type === 'usage' ? '-' : '+'}
                          {transaction.amount?.toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {transaction.balanceAfter?.toLocaleString() || 0}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Dialog para solicitar créditos */}
      <Dialog open={openRequestDialog} onClose={() => setOpenRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Solicitar Créditos Adicionais</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 2 }}>
            Sua solicitação será analisada pela equipe. Você receberá uma resposta em breve.
          </Alert>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Quantidade de Créditos"
                type="number"
                value={requestAmount}
                onChange={(e) => setRequestAmount(e.target.value)}
                required
                helperText="Quantidade de créditos que você deseja solicitar"
                InputProps={{ inputProps: { min: 1 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Motivo da Solicitação"
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                multiline
                rows={4}
                helperText="Descreva o motivo da solicitação (opcional)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequestDialog(false)}>Cancelar</Button>
          <Button onClick={handleRequestCredits} variant="contained">
            Enviar Solicitação
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
