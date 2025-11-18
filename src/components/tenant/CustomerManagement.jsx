import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Tooltip,
  InputAdornment,
  Menu,
  MenuItem,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon,
  GetApp as ExportIcon,
  Upload as ImportIcon,
  Block as BlockIcon,
  CheckCircle as ActiveIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { format } from 'date-fns';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    phone: '',
    tags: '',
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenant/customers');
      console.log('Customers API Response:', response.data);
      const customersData = response.data.data || [];
      console.log('customersData type:', typeof customersData);
      console.log('customersData is array?:', Array.isArray(customersData));
      console.log('customersData length:', customersData.length);
      console.log('First customer:', customersData[0]);
      setCustomers(Array.isArray(customersData) ? customersData : []);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar clientes', { variant: 'error' });
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        email: customer.email || '',
        name: customer.name || '',
        phone: customer.phone || '',
        tags: customer.tags?.join(', ') || '',
      });
    } else {
      setEditingCustomer(null);
      setFormData({
        email: '',
        name: '',
        phone: '',
        tags: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCustomer(null);
    setFormData({
      email: '',
      name: '',
      phone: '',
      tags: '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.email) {
        enqueueSnackbar('Email é obrigatório', { variant: 'warning' });
        return;
      }

      const payload = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
      };

      if (editingCustomer) {
        await api.put(`/tenant/customers/${editingCustomer.id}`, payload);
        enqueueSnackbar('Cliente atualizado com sucesso', { variant: 'success' });
      } else {
        await api.post('/tenant/customers', payload);
        enqueueSnackbar('Cliente adicionado com sucesso', { variant: 'success' });
      }

      handleCloseDialog();
      fetchCustomers();
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      enqueueSnackbar(error.response?.data?.message || 'Erro ao salvar cliente', {
        variant: 'error'
      });
    }
  };

  const handleDelete = async (customerId) => {
    if (!window.confirm('Deseja realmente excluir este cliente? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await api.delete(`/tenant/customers/${customerId}`);
      enqueueSnackbar('Cliente excluído com sucesso', { variant: 'success' });
      fetchCustomers();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      enqueueSnackbar(error.response?.data?.message || 'Erro ao excluir cliente', {
        variant: 'error'
      });
    }
  };

  const handleToggleActive = async (customerId, currentStatus) => {
    try {
      await api.patch(`/customers/${customerId}/status`, {
        active: !currentStatus
      });
      enqueueSnackbar(
        `Cliente ${!currentStatus ? 'ativado' : 'desativado'} com sucesso`,
        { variant: 'success' }
      );
      fetchCustomers();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      enqueueSnackbar('Erro ao alterar status do cliente', { variant: 'error' });
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/tenant/customers/export', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `clientes-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      enqueueSnackbar('Clientes exportados com sucesso', { variant: 'success' });
    } catch (error) {
      console.error('Erro ao exportar clientes:', error);
      enqueueSnackbar('Erro ao exportar clientes', { variant: 'error' });
    }
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    api.post('/tenant/customers/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
      .then(() => {
        enqueueSnackbar('Clientes importados com sucesso', { variant: 'success' });
        fetchCustomers();
      })
      .catch((error) => {
        console.error('Erro ao importar clientes:', error);
        enqueueSnackbar(error.response?.data?.message || 'Erro ao importar clientes', {
          variant: 'error'
        });
      });
  };

  const getFilteredCustomers = () => {
    let filtered = customers;

    // Filtrar por busca
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        customer.customer_identifier?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por status
    if (filterStatus === 'active') {
      filtered = filtered.filter(c => c.opt_in_status === 'active');
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(c => c.opt_in_status !== 'active');
    }

    // Filtrar por tab (subscritos ou não)
    if (tabValue === 1) {
      filtered = filtered.filter(c => c.opt_in_status === 'active');
    } else if (tabValue === 2) {
      filtered = filtered.filter(c => c.opt_in_status === 'unsubscribed');
    }

    return filtered;
  };

  const getStatusChip = (customer) => {
    if (customer.opt_in_status === 'active') {
      return <Chip label="Ativo" color="success" size="small" />;
    } else if (customer.opt_in_status === 'unsubscribed') {
      return <Chip label="Cancelado" color="error" size="small" />;
    } else if (customer.opt_in_status === 'pending') {
      return <Chip label="Pendente" color="warning" size="small" />;
    } else if (customer.opt_in_status === 'expired') {
      return <Chip label="Expirado" color="default" size="small" />;
    } else {
      return <Chip label="Desconhecido" color="default" size="small" />;
    }
  };

  const filteredCustomers = getFilteredCustomers();

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
          Gerenciar Clientes
        </Typography>
        <Box display="flex" gap={1}>
          <input
            accept=".csv"
            style={{ display: 'none' }}
            id="import-csv-file"
            type="file"
            onChange={handleImportCSV}
          />
          <label htmlFor="import-csv-file">
            <Button variant="outlined" component="span" startIcon={<ImportIcon />}>
              Importar CSV
            </Button>
          </label>
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={handleExportCSV}
          >
            Exportar CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Adicionar Cliente
          </Button>
        </Box>
      </Box>

      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            placeholder="Buscar por email, nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={(e) => setAnchorEl(e.currentTarget)}
            fullWidth
            sx={{ height: '56px' }}
          >
            Filtrar: {filterStatus === 'all' ? 'Todos' : filterStatus === 'active' ? 'Ativos' : 'Inativos'}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => { setFilterStatus('all'); setAnchorEl(null); }}>
              Todos
            </MenuItem>
            <MenuItem onClick={() => { setFilterStatus('active'); setAnchorEl(null); }}>
              Apenas Ativos
            </MenuItem>
            <MenuItem onClick={() => { setFilterStatus('inactive'); setAnchorEl(null); }}>
              Apenas Inativos
            </MenuItem>
          </Menu>
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label={`Todos (${customers.length})`} />
          <Tab label={`Inscritos (${customers.filter(c => c.subscribed).length})`} />
          <Tab label={`Não Inscritos (${customers.filter(c => !c.subscribed).length})`} />
        </Tabs>
      </Card>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Nome</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Tags</TableCell>
              <TableCell>Inscrito em</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCustomers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="textSecondary" py={3}>
                    {searchTerm || filterStatus !== 'all'
                      ? 'Nenhum cliente encontrado com os filtros aplicados.'
                      : 'Nenhum cliente cadastrado ainda. Adicione um cliente ou importe uma lista.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCustomers.map((customer) => (
                <TableRow key={customer._id}>
                  <TableCell>{customer.email || customer.customer_identifier || '-'}</TableCell>
                  <TableCell>{customer.name || '-'}</TableCell>
                  <TableCell>{customer.phone || '-'}</TableCell>
                  <TableCell>{getStatusChip(customer)}</TableCell>
                  <TableCell>
                    {customer.tags?.map((tag, idx) => (
                      <Chip key={idx} label={tag} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </TableCell>
                  <TableCell>
                    {customer.opt_in_date
                      ? format(new Date(customer.opt_in_date), 'dd/MM/yyyy')
                      : '-'
                    }
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar">
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(customer)}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={customer.opt_in_status === 'active' ? 'Desativar' : 'Ativar'}>
                      <IconButton
                        size="small"
                        color={customer.opt_in_status === 'active' ? 'warning' : 'success'}
                        onClick={() => handleToggleActive(customer._id, customer.opt_in_status)}
                      >
                        {customer.opt_in_status === 'active' ? (
                          <BlockIcon fontSize="small" />
                        ) : (
                          <ActiveIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(customer._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para adicionar/editar cliente */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingCustomer ? 'Editar Cliente' : 'Adicionar Cliente'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                helperText="Email do cliente (obrigatório)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                helperText="Nome completo do cliente (opcional)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Telefone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                helperText="Telefone do cliente (opcional)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                helperText="Tags separadas por vírgula (ex: vip, newsletter, promo)"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCustomer ? 'Atualizar' : 'Adicionar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
