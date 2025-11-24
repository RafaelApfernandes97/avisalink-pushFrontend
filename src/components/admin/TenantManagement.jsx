import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Chip,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Edit, Delete, Add, Block, CheckCircle } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

const TenantManagement = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    slug: '',
    monthly_limit: 10000,
    rollover_enabled: true,
    status: 'active',
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/tenants');
      console.log('API Response:', response.data);
      // A API retorna { success: true, data: [tenants], pagination: {...} }
      const tenantsData = response.data.data || [];
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
      enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar tenants', {
        variant: 'error'
      });
      setTenants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (tenant = null) => {
    if (tenant) {
      setEditingTenant(tenant);
      setFormData({
        name: tenant.name,
        email: tenant.email,
        slug: tenant.slug,
        monthly_limit: tenant.credits?.monthly_limit || 10000,
        rollover_enabled: tenant.credits?.rollover_enabled ?? true,
        status: tenant.status || 'active',
      });
    } else {
      setEditingTenant(null);
      setFormData({
        name: '',
        email: '',
        slug: '',
        monthly_limit: 10000,
        rollover_enabled: true,
        status: 'active',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingTenant(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        slug: formData.slug,
        credits: {
          monthly_limit: parseInt(formData.monthly_limit),
          rollover_enabled: formData.rollover_enabled,
        },
      };

      // Apenas incluir status ao editar
      if (editingTenant) {
        payload.status = formData.status;
      }

      console.log('Enviando payload:', payload);

      if (editingTenant) {
        await api.put(`/admin/tenants/${editingTenant._id}`, payload);
        enqueueSnackbar('Tenant atualizado com sucesso', { variant: 'success' });
      } else {
        await api.post('/admin/tenants', payload);
        enqueueSnackbar('Tenant criado com sucesso', { variant: 'success' });
      }

      handleClose();
      loadTenants();
    } catch (error) {
      console.error('Erro ao salvar tenant:', error);
      console.error('Detalhes do erro:', error.response?.data);

      // Extrair mensagem de erro mais específica
      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          'Erro ao salvar tenant';

      enqueueSnackbar(errorMessage, {
        variant: 'error',
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este tenant?')) return;

    try {
      await api.delete(`/admin/tenants/${id}`);
      enqueueSnackbar('Tenant excluído com sucesso', { variant: 'success' });
      loadTenants();
    } catch (error) {
      console.error('Erro ao excluir tenant:', error);
      enqueueSnackbar(error.response?.data?.error || 'Erro ao excluir tenant', {
        variant: 'error'
      });
    }
  };

  const handleToggleStatus = async (tenant) => {
    try {
      const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
      await api.put(`/admin/tenants/${tenant._id}`, {
        status: newStatus,
      });
      enqueueSnackbar('Status atualizado com sucesso', { variant: 'success' });
      loadTenants();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      enqueueSnackbar(error.response?.data?.error || 'Erro ao atualizar status', {
        variant: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Carregando...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Gerenciamento de Tenants</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpen()}
        >
          Novo Tenant
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Slug</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Créditos Mensais</TableCell>
              <TableCell>Créditos Disponíveis</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tenants.length > 0 ? (
              tenants.map((tenant) => (
                <TableRow key={tenant._id}>
                  <TableCell>{tenant.name}</TableCell>
                  <TableCell>{tenant.slug}</TableCell>
                  <TableCell>{tenant.email}</TableCell>
                  <TableCell>
                    {tenant.credits?.monthly_limit?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>
                    {tenant.credits?.current_balance?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        tenant.status === 'active'
                          ? 'Ativo'
                          : tenant.status === 'suspended'
                          ? 'Suspenso'
                          : 'Inativo'
                      }
                      color={tenant.status === 'active' ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => handleToggleStatus(tenant)}
                      color={tenant.status === 'active' ? 'error' : 'success'}
                      title={tenant.status === 'active' ? 'Suspender' : 'Ativar'}
                    >
                      {tenant.status === 'active' ? <Block /> : <CheckCircle />}
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(tenant)}
                      title="Editar"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(tenant._id)}
                      title="Excluir"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary" sx={{ py: 3 }}>
                    Nenhum tenant encontrado. Clique em "Novo Tenant" para criar um.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTenant ? 'Editar Tenant' : 'Novo Tenant'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome"
            fullWidth
            required
            value={formData.name}
            onChange={(e) => {
              const newName = e.target.value;
              const updates = { name: newName };

              // Auto-gerar slug se estiver criando novo tenant e slug estiver vazio
              if (!editingTenant && !formData.slug) {
                updates.slug = newName
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '');
              }

              setFormData({ ...formData, ...updates });
            }}
          />
          <TextField
            margin="dense"
            label="Slug"
            fullWidth
            required
            helperText="Apenas letras minúsculas, números e hífens (ex: minha-empresa)"
            value={formData.slug}
            onChange={(e) => {
              // Remove caracteres inválidos e converte para minúsculas
              const cleanSlug = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/--+/g, '-')
                .replace(/^-+|-+$/g, '');
              setFormData({ ...formData, slug: cleanSlug });
            }}
            disabled={editingTenant !== null}
            error={Boolean(formData.slug && !/^[a-z0-9-]+$/.test(formData.slug))}
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Limite Mensal de Créditos"
            type="number"
            fullWidth
            required
            value={formData.monthly_limit}
            onChange={(e) =>
              setFormData({ ...formData, monthly_limit: e.target.value })
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.rollover_enabled}
                onChange={(e) =>
                  setFormData({ ...formData, rollover_enabled: e.target.checked })
                }
              />
            }
            label="Permitir Acúmulo de Créditos"
            sx={{ mt: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.status === 'active'}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    status: e.target.checked ? 'active' : 'suspended'
                  })
                }
              />
            }
            label="Ativo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.name ||
              !formData.email ||
              !formData.slug ||
              !/^[a-z0-9-]+$/.test(formData.slug) ||
              !formData.monthly_limit
            }
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TenantManagement;
