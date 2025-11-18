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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Schedule as ScheduleIcon,
  ContentCopy as ContentCopyIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { format } from 'date-fns';

export default function NotificationManagement() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingNotification, setEditingNotification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    url: '',
    icon: '',
    targetAudience: 'all',
    scheduleDate: '',
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchNotifications();

    // Polling a cada 15 segundos (reduzido de 10s para economizar requisições)
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 15000);

    return () => clearInterval(interval);
  }, []); // Sem dependências para evitar loop infinito

  const fetchNotifications = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const response = await api.get('/tenant/notifications');
      const notificationsData = response.data.data || [];
      setNotifications(Array.isArray(notificationsData) ? notificationsData : []);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      // Não mostra erro de rate limit no snackbar, apenas no console
      if (showLoading && error?.response?.status !== 429) {
        enqueueSnackbar('Erro ao carregar notificações', { variant: 'error' });
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleOpenDialog = (notification = null) => {
    if (notification) {
      setEditingNotification(notification);
      setFormData({
        title: notification.title || '',
        message: notification.message || '',
        url: notification.action_url || '',
        icon: notification.icon_url || '',
        targetAudience: notification.targeting?.send_to_all ? 'all' : 'segmented',
        scheduleDate: notification.schedule?.scheduled_for
          ? new Date(notification.schedule.scheduled_for).toISOString().slice(0, 16)
          : '',
      });
    } else {
      setEditingNotification(null);
      setFormData({
        title: '',
        message: '',
        url: '',
        icon: '',
        targetAudience: 'all',
        scheduleDate: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingNotification(null);
    setFormData({
      title: '',
      message: '',
      url: '',
      icon: '',
      targetAudience: 'all',
      scheduleDate: '',
    });
  };

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.message) {
        enqueueSnackbar('Título e mensagem são obrigatórios', { variant: 'warning' });
        return;
      }

      // Prepare payload according to backend schema
      const payload = {
        title: formData.title,
        message: formData.message,
        action_url: formData.url || undefined,
        icon_url: formData.icon || undefined,
        targeting: {
          send_to_all: formData.targetAudience === 'all',
          customer_ids: formData.targetAudience === 'all' ? undefined : [],
          tags: []
        }
      };

      // Add schedule if provided
      if (formData.scheduleDate) {
        payload.schedule = {
          scheduled_for: new Date(formData.scheduleDate).toISOString()
        };
      }

      if (editingNotification) {
        await api.put(`/tenant/notifications/${editingNotification._id}`, payload);
        enqueueSnackbar('Notificação atualizada com sucesso', { variant: 'success' });
      } else {
        await api.post('/tenant/notifications', payload);
        enqueueSnackbar('Notificação criada com sucesso', { variant: 'success' });
      }

      handleCloseDialog();
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao salvar notificação:', error);
      enqueueSnackbar(error.response?.data?.message || error.response?.data?.error || 'Erro ao salvar notificação', {
        variant: 'error'
      });
    }
  };

  const handleSendNow = async (notificationId) => {
    if (!window.confirm('Deseja enviar esta notificação agora para todos os destinatários?')) {
      return;
    }

    try {
      await api.post(`/tenant/notifications/${notificationId}/send`);
      enqueueSnackbar('Notificação enviada com sucesso', { variant: 'success' });
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      enqueueSnackbar(error.response?.data?.message || 'Erro ao enviar notificação', {
        variant: 'error'
      });
    }
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm('Deseja realmente excluir esta notificação?')) {
      return;
    }

    try {
      await api.delete(`/tenant/notifications/${notificationId}`);
      enqueueSnackbar('Notificação excluída com sucesso', { variant: 'success' });
      fetchNotifications();
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      enqueueSnackbar(error.response?.data?.message || 'Erro ao excluir notificação', {
        variant: 'error'
      });
    }
  };

  const handleClone = (notification) => {
    setEditingNotification(null);
    setFormData({
      title: `${notification.title} (Cópia)`,
      message: notification.message,
      url: notification.action_url || '',
      icon: notification.icon_url || '',
      targetAudience: notification.targeting?.send_to_all ? 'all' : 'segmented',
      scheduleDate: '',
    });
    setOpenDialog(true);
  };

  const getStatusChip = (notification) => {
    if (notification.status === 'sent') {
      return <Chip label="Enviada" color="success" size="small" />;
    } else if (notification.status === 'scheduled') {
      return <Chip label="Agendada" color="info" size="small" />;
    } else if (notification.status === 'failed') {
      return <Chip label="Falhou" color="error" size="small" />;
    } else {
      return <Chip label="Rascunho" color="default" size="small" />;
    }
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
          Gerenciar Notificações
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Nova Notificação
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Crie, edite e envie notificações push para seus clientes. Você pode agendar envios ou enviar imediatamente.
      </Alert>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Título</TableCell>
              <TableCell>Mensagem</TableCell>
              <TableCell>Público</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Enviados</TableCell>
              <TableCell>Entregues</TableCell>
              <TableCell>Cliques</TableCell>
              <TableCell>Taxa de Clique</TableCell>
              <TableCell>Criada em</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center">
                  <Typography variant="body2" color="textSecondary" py={3}>
                    Nenhuma notificação criada ainda. Clique em "Nova Notificação" para começar.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              notifications.map((notification) => {
                const clickRate = notification.stats?.total_delivered > 0
                  ? ((notification.stats?.total_clicked / notification.stats?.total_delivered) * 100).toFixed(1)
                  : 0;

                return (
                  <TableRow key={notification._id}>
                    <TableCell>{notification.title}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {notification.message}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {notification.targeting?.send_to_all ? 'Todos' : 'Segmentado'}
                    </TableCell>
                    <TableCell>{getStatusChip(notification)}</TableCell>
                    <TableCell>{notification.stats?.total_sent || 0}</TableCell>
                    <TableCell>{notification.stats?.total_delivered || 0}</TableCell>
                    <TableCell>{notification.stats?.total_clicked || 0}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${clickRate}%`}
                        size="small"
                        color={clickRate > 5 ? 'success' : clickRate > 2 ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      {notification.created_at
                        ? format(new Date(notification.created_at), 'dd/MM/yyyy HH:mm')
                        : '-'
                      }
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Clonar Notificação">
                        <IconButton size="small" color="info" onClick={() => handleClone(notification)}>
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    <Tooltip title={notification.status === 'sent' ? 'Notificação já enviada' : 'Editar'}>
                      <span>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(notification)}
                          disabled={notification.status === 'sent'}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={notification.status === 'sent' ? 'Notificação já enviada' : 'Enviar Agora'}>
                      <span>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleSendNow(notification._id)}
                          disabled={notification.status === 'sent'}
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDelete(notification._id)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para criar/editar notificação */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingNotification ? 'Editar Notificação' : 'Nova Notificação'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Título"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                helperText="Título da notificação (obrigatório)"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Mensagem"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                multiline
                rows={4}
                helperText="Conteúdo da notificação (obrigatório)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="URL (opcional)"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                helperText="URL para abrir ao clicar na notificação"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Ícone (URL opcional)"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                helperText="URL do ícone da notificação"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Público-alvo</InputLabel>
                <Select
                  value={formData.targetAudience}
                  onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                  label="Público-alvo"
                >
                  <MenuItem value="all">Todos os clientes</MenuItem>
                  <MenuItem value="active">Apenas ativos</MenuItem>
                  <MenuItem value="inactive">Apenas inativos</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Agendar envio (opcional)"
                type="datetime-local"
                value={formData.scheduleDate}
                onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                helperText="Deixe vazio para envio manual"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingNotification ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
