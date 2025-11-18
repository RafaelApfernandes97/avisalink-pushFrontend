import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  TablePagination,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    resource_type: '',
    severity: '',
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadLogs();
  }, [page, rowsPerPage, filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        ...filters,
      };

      const response = await api.get('/admin/audit-logs', { params });
      console.log('Audit Logs API Response:', response.data);

      // A API retorna { success: true, data: [logs], pagination: {...} }
      const logsData = response.data.data || [];
      const paginationData = response.data.pagination || {};

      setLogs(Array.isArray(logsData) ? logsData : []);
      setTotal(paginationData.total || 0);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          'Erro ao carregar logs de auditoria';
      enqueueSnackbar(errorMessage, { variant: 'error' });
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const getActionColor = (action) => {
    const colors = {
      user_created: 'success',
      user_updated: 'info',
      user_deleted: 'error',
      tenant_created: 'success',
      tenant_updated: 'info',
      tenant_deleted: 'error',
      notification_sent: 'primary',
      login_success: 'success',
      login_failed: 'error',
    };
    return colors[action] || 'default';
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'error',
      error: 'error',
      warning: 'warning',
      info: 'info',
      debug: 'default',
    };
    return colors[severity] || 'default';
  };

  if (loading && logs.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Logs de Auditoria
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Ação</InputLabel>
              <Select
                value={filters.action}
                onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                label="Ação"
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="user_created">Usuário Criado</MenuItem>
                <MenuItem value="user_updated">Usuário Atualizado</MenuItem>
                <MenuItem value="user_deleted">Usuário Excluído</MenuItem>
                <MenuItem value="tenant_created">Tenant Criado</MenuItem>
                <MenuItem value="tenant_updated">Tenant Atualizado</MenuItem>
                <MenuItem value="tenant_deleted">Tenant Excluído</MenuItem>
                <MenuItem value="notification_sent">Notificação Enviada</MenuItem>
                <MenuItem value="login_success">Login Bem-sucedido</MenuItem>
                <MenuItem value="login_failed">Login Falhou</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Recurso</InputLabel>
              <Select
                value={filters.resource_type}
                onChange={(e) => setFilters({ ...filters, resource_type: e.target.value })}
                label="Tipo de Recurso"
              >
                <MenuItem value="">Todos</MenuItem>
                <MenuItem value="tenant">Tenant</MenuItem>
                <MenuItem value="user">Usuário</MenuItem>
                <MenuItem value="customer">Cliente</MenuItem>
                <MenuItem value="notification">Notificação</MenuItem>
                <MenuItem value="opt_in_link">Link de Opt-In</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Severidade</InputLabel>
              <Select
                value={filters.severity}
                onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                label="Severidade"
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="critical">Crítico</MenuItem>
                <MenuItem value="error">Erro</MenuItem>
                <MenuItem value="warning">Aviso</MenuItem>
                <MenuItem value="info">Info</MenuItem>
                <MenuItem value="debug">Debug</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Data/Hora</TableCell>
              <TableCell>Usuário</TableCell>
              <TableCell>Ação</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Severidade</TableCell>
              <TableCell>Detalhes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.length > 0 ? (
              logs.map((log) => (
                <TableRow key={log._id}>
                  <TableCell>
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    {log.user_id?.email || log.user_id?.first_name || 'Sistema'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={log.action}
                      color={getActionColor(log.action)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{log.resource_type || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={log.severity}
                      color={getSeverityColor(log.severity)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {log.details && (
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.75rem',
                          maxWidth: '300px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {JSON.stringify(log.details)}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary" sx={{ py: 3 }}>
                    Nenhum log de auditoria encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Linhas por página:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} de ${count !== -1 ? count : `mais de ${to}`}`
          }
        />
      </TableContainer>
    </Box>
  );
};

export default AuditLogs;
