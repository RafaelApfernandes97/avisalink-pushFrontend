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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Edit, Delete, Add, Lock, LockOpen } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'tenant_admin',
    tenant_id: '',
    status: 'active',
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    loadUsers();
    loadTenants();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      console.log('Users API Response:', response.data);
      const usersData = response.data.data || [];
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar usuários', {
        variant: 'error'
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTenants = async () => {
    try {
      const response = await api.get('/admin/tenants');
      console.log('Tenants API Response:', response.data);
      const tenantsData = response.data.data || [];
      setTenants(Array.isArray(tenantsData) ? tenantsData : []);
    } catch (error) {
      console.error('Erro ao carregar tenants:', error);
      enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar tenants', {
        variant: 'error'
      });
      setTenants([]);
    }
  };

  const handleOpen = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email,
        password: '',
        role: user.role,
        tenant_id: user.tenant_id?._id || user.tenant_id || '',
        status: user.status || 'active',
      });
    } else {
      setEditingUser(null);
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        role: 'tenant_admin',
        tenant_id: '',
        status: 'active',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async () => {
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        role: formData.role,
      };

      // tenant_id é obrigatório para roles que não são global_admin
      if (formData.role !== 'global_admin') {
        if (!formData.tenant_id) {
          enqueueSnackbar('Por favor, selecione um tenant', { variant: 'error' });
          return;
        }
        payload.tenant_id = formData.tenant_id;
      }

      if (editingUser) {
        payload.status = formData.status;
        if (formData.password) {
          payload.password = formData.password;
        }
      } else {
        // Senha é obrigatória ao criar novo usuário
        if (!formData.password) {
          enqueueSnackbar('Por favor, defina uma senha', { variant: 'error' });
          return;
        }
        payload.password = formData.password;
      }

      console.log('Enviando payload de usuário:', payload);

      if (editingUser) {
        await api.put(`/admin/users/${editingUser._id}`, payload);
        enqueueSnackbar('Usuário atualizado com sucesso', { variant: 'success' });
      } else {
        await api.post('/admin/users', payload);
        enqueueSnackbar('Usuário criado com sucesso', { variant: 'success' });
      }

      handleClose();
      loadUsers();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      console.error('Detalhes do erro:', error.response?.data);

      const errorMessage = error.response?.data?.error ||
                          error.response?.data?.message ||
                          error.message ||
                          'Erro ao salvar usuário';

      enqueueSnackbar(errorMessage, {
        variant: 'error',
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      await api.delete(`/admin/users/${id}`);
      enqueueSnackbar('Usuário excluído com sucesso', { variant: 'success' });
      loadUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
      enqueueSnackbar(error.response?.data?.error || 'Erro ao excluir usuário', {
        variant: 'error'
      });
    }
  };

  const handleToggleLock = async (user) => {
    try {
      await api.post(`/admin/users/${user._id}/unlock`);
      enqueueSnackbar('Status do usuário atualizado', { variant: 'success' });
      loadUsers();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      enqueueSnackbar(error.response?.data?.error || 'Erro ao atualizar status', {
        variant: 'error'
      });
    }
  };

  const getRoleLabel = (role) => {
    const roles = {
      global_admin: 'Admin Global',
      tenant_admin: 'Admin Tenant',
      operator: 'Operador',
    };
    return roles[role] || role;
  };

  const getTenantName = (tenantId) => {
    if (!tenantId) return '-';

    // Se tenantId for um objeto (populado)
    if (typeof tenantId === 'object' && tenantId.name) {
      return tenantId.name;
    }

    // Se tenantId for uma string (ID)
    const tenant = tenants.find((t) => t._id === tenantId);
    return tenant?.name || '-';
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
        <Typography variant="h5">Gerenciamento de Usuários</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
          Novo Usuário
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nome</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Tenant</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user._id}>
                  <TableCell>{`${user.first_name || ''} ${user.last_name || ''}`.trim() || '-'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={getRoleLabel(user.role)} size="small" />
                  </TableCell>
                  <TableCell>{getTenantName(user.tenant_id)}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.status === 'active' ? 'Ativo' : user.status === 'inactive' ? 'Inativo' : 'Suspenso'}
                      color={user.status === 'active' ? 'success' : 'error'}
                      size="small"
                    />
                    {user.account_status === 'locked' && (
                      <Chip label="Bloqueado" color="warning" size="small" sx={{ ml: 1 }} />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {user.account_status === 'locked' && (
                      <IconButton
                        size="small"
                        onClick={() => handleToggleLock(user)}
                        title="Desbloquear"
                      >
                        <LockOpen />
                      </IconButton>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => handleOpen(user)}
                      title="Editar"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(user._id)}
                      title="Excluir"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  <Typography color="textSecondary" sx={{ py: 3 }}>
                    Nenhum usuário encontrado. Clique em "Novo Usuário" para criar um.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Nome"
            fullWidth
            required
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          />
          <TextField
            margin="dense"
            label="Sobrenome"
            fullWidth
            required
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
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
            label={editingUser ? 'Nova Senha (deixe em branco para não alterar)' : 'Senha'}
            type="password"
            fullWidth
            required={!editingUser}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            helperText={!editingUser ? 'Mínimo 8 caracteres' : ''}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              label="Role"
            >
              <MenuItem value="global_admin">Admin Global</MenuItem>
              <MenuItem value="tenant_admin">Admin Tenant</MenuItem>
              <MenuItem value="operator">Operador</MenuItem>
            </Select>
          </FormControl>
          {formData.role !== 'global_admin' && (
            <FormControl fullWidth margin="dense" required>
              <InputLabel>Tenant</InputLabel>
              <Select
                value={formData.tenant_id}
                onChange={(e) => setFormData({ ...formData, tenant_id: e.target.value })}
                label="Tenant"
              >
                {tenants.map((tenant) => (
                  <MenuItem key={tenant._id} value={tenant._id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancelar</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.first_name ||
              !formData.last_name ||
              !formData.email ||
              (!editingUser && !formData.password) ||
              (formData.role !== 'global_admin' && !formData.tenant_id)
            }
          >
            Salvar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
