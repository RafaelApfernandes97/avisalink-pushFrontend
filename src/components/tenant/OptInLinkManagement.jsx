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
  TextField,
  Typography,
  Chip,
  Grid,
  CircularProgress,
  Alert,
  Tooltip,
  Switch,
  FormControlLabel,
  Tabs,
  Tab,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormGroup,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Link as LinkIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  FileCopy as CloneIcon,
  Palette as PaletteIcon,
  Upload as UploadIcon,
  Preview as PreviewIcon,
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import api from '../../services/api';
import { format } from 'date-fns';

export default function OptInLinkManagement() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // Customização
    customization: {
      company_name: '',
      page_title: 'Receba Notificações',
      page_description: 'Fique por dentro das novidades e atualizações',
      button_text: 'Permitir Notificações',
      success_message: 'Obrigado por se inscrever!',
      logo_url: '',
      primary_color: '#1976d2',
      secondary_color: '#424242',
      background_color: '#ffffff',
      text_color: '#000000',
      button_text_color: '#ffffff',
    },
    // Campos do formulário
    form_fields: {
      require_name: true,
      require_email: true,
      require_phone: false,
    },
    status: 'active',
  });
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tenant/opt-in-links');
      const linksData = response.data.data || [];
      setLinks(Array.isArray(linksData) ? linksData : []);
    } catch (error) {
      console.error('Erro ao buscar links:', error);
      enqueueSnackbar(error.response?.data?.error || 'Erro ao carregar links de opt-in', { variant: 'error' });
      setLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (link = null) => {
    if (link) {
      setEditingLink(link);
      setFormData({
        name: link.name || '',
        description: link.description || '',
        customization: {
          company_name: link.customization?.company_name || '',
          page_title: link.customization?.page_title || 'Receba Notificações',
          page_description: link.customization?.page_description || 'Fique por dentro das novidades e atualizações',
          button_text: link.customization?.button_text || 'Permitir Notificações',
          success_message: link.customization?.success_message || 'Obrigado por se inscrever!',
          logo_url: link.customization?.logo_url || '',
          primary_color: link.customization?.primary_color || '#1976d2',
          secondary_color: link.customization?.secondary_color || '#424242',
          background_color: link.customization?.background_color || '#ffffff',
          text_color: link.customization?.text_color || '#000000',
          button_text_color: link.customization?.button_text_color || '#ffffff',
        },
        form_fields: {
          require_name: link.form_fields?.require_name ?? true,
          require_email: link.form_fields?.require_email ?? true,
          require_phone: link.form_fields?.require_phone ?? false,
        },
        status: link.status || 'active',
      });
    } else {
      setEditingLink(null);
      setFormData({
        name: '',
        description: '',
        customization: {
          company_name: '',
          page_title: 'Receba Notificações',
          page_description: 'Fique por dentro das novidades e atualizações',
          button_text: 'Permitir Notificações',
          success_message: 'Obrigado por se inscrever!',
          logo_url: '',
          primary_color: '#1976d2',
          secondary_color: '#424242',
          background_color: '#ffffff',
          text_color: '#000000',
          button_text_color: '#ffffff',
        },
        form_fields: {
          require_name: true,
          require_email: true,
          require_phone: false,
        },
        status: 'active',
      });
    }
    setTabValue(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLink(null);
    setTabValue(0);
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name) {
        enqueueSnackbar('Nome é obrigatório', { variant: 'warning' });
        return;
      }

      const payload = {
        name: formData.name,
        description: formData.description,
        customization: formData.customization,
        form_fields: formData.form_fields,
        status: formData.status,
      };

      if (editingLink) {
        await api.put(`/tenant/opt-in-links/${editingLink._id}`, payload);
        enqueueSnackbar('Link atualizado com sucesso', { variant: 'success' });
      } else {
        await api.post('/tenant/opt-in-links', payload);
        enqueueSnackbar('Link criado com sucesso', { variant: 'success' });
      }

      handleCloseDialog();
      fetchLinks();
    } catch (error) {
      console.error('Erro ao salvar link:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Erro ao salvar link';
      enqueueSnackbar(errorMessage, { variant: 'error' });
    }
  };

  const handleDelete = async (linkId) => {
    if (!window.confirm('Deseja realmente excluir este link de opt-in?')) {
      return;
    }

    try {
      await api.delete(`/tenant/opt-in-links/${linkId}`);
      enqueueSnackbar('Link excluído com sucesso', { variant: 'success' });
      fetchLinks();
    } catch (error) {
      console.error('Erro ao excluir link:', error);
      enqueueSnackbar(error.response?.data?.message || 'Erro ao excluir link', { variant: 'error' });
    }
  };

  const handleToggleActive = async (linkId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      await api.put(`/tenant/opt-in-links/${linkId}`, { status: newStatus });
      enqueueSnackbar(`Link ${newStatus === 'active' ? 'ativado' : 'desativado'} com sucesso`, { variant: 'success' });
      fetchLinks();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      enqueueSnackbar(error.response?.data?.error || 'Erro ao alterar status do link', { variant: 'error' });
    }
  };

  const handleCopyLink = (token) => {
    const url = `${window.location.origin}/opt-in/${token}`;
    navigator.clipboard.writeText(url);
    enqueueSnackbar('Link copiado para a área de transferência', { variant: 'success' });
  };

  const getFullUrl = (token) => {
    return `${window.location.origin}/opt-in/${token}`;
  };

  const getStatusChip = (link) => {
    if (link.status === 'active') {
      return <Chip label="Ativo" color="success" size="small" />;
    } else if (link.status === 'inactive') {
      return <Chip label="Inativo" color="default" size="small" />;
    } else if (link.status === 'expired') {
      return <Chip label="Expirado" color="error" size="small" />;
    }
    return <Chip label="Desconhecido" color="default" size="small" />;
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
          Gerenciar Links de Opt-In
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Criar Novo Link
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Crie links personalizados para que seus clientes se inscrevam nas notificações push.
        Customize a aparência e os campos do formulário de acordo com sua marca.
      </Alert>

      <Grid container spacing={3}>
        {links.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <LinkIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Nenhum link de opt-in criado ainda
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Crie seu primeiro link para começar a coletar inscrições de clientes.
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
                Criar Primeiro Link
              </Button>
            </Paper>
          </Grid>
        ) : (
          links.map((link) => (
            <Grid item xs={12} md={6} lg={4} key={link._id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Typography variant="h6" component="div">
                      {link.name}
                    </Typography>
                    {getStatusChip(link)}
                  </Box>

                  {link.description && (
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {link.description}
                    </Typography>
                  )}

                  {link.customization?.company_name && (
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="caption" color="textSecondary">
                        Empresa:
                      </Typography>
                      <Typography variant="body2" fontWeight="medium">
                        {link.customization.company_name}
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ bgcolor: 'grey.100', p: 1.5, borderRadius: 1, mb: 2 }}>
                    <Typography variant="caption" color="textSecondary" display="block" gutterBottom>
                      URL do Link:
                    </Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
                      {getFullUrl(link.token)}
                    </Typography>
                  </Box>

                  <Grid container spacing={1} mb={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Inscrições
                      </Typography>
                      <Typography variant="h6">
                        {link.stats?.total_subscriptions || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Taxa de conversão
                      </Typography>
                      <Typography variant="h6">
                        {link.stats?.conversion_rate?.toFixed(1) || 0}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Visualizações
                      </Typography>
                      <Typography variant="body2">
                        {link.stats?.total_views || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="textSecondary">
                        Criado em
                      </Typography>
                      <Typography variant="body2">
                        {link.created_at ? format(new Date(link.created_at), 'dd/MM/yyyy') : '-'}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box display="flex" gap={1} flexWrap="wrap">
                    <Tooltip title="Copiar Link">
                      <IconButton size="small" color="primary" onClick={() => handleCopyLink(link.token)}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                      <IconButton size="small" onClick={() => handleOpenDialog(link)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={link.status === 'active' ? 'Desativar' : 'Ativar'}>
                      <IconButton
                        size="small"
                        color={link.status === 'active' ? 'warning' : 'success'}
                        onClick={() => handleToggleActive(link._id, link.status)}
                      >
                        {link.status === 'active' ? (
                          <VisibilityOffIcon fontSize="small" />
                        ) : (
                          <VisibilityIcon fontSize="small" />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                      <IconButton size="small" color="error" onClick={() => handleDelete(link._id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {/* Dialog para criar/editar link */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingLink ? 'Editar Link de Opt-In' : 'Criar Novo Link de Opt-In'}
        </DialogTitle>
        <DialogContent>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tab label="Informações Básicas" />
            <Tab label="Personalização" icon={<PaletteIcon />} iconPosition="start" />
            <Tab label="Campos do Formulário" />
          </Tabs>

          {/* Tab 0: Informações Básicas */}
          {tabValue === 0 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Nome do Link"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  helperText="Nome interno para identificar este link (obrigatório)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  multiline
                  rows={2}
                  helperText="Descrição interna deste link (opcional)"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.status === 'active'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })}
                    />
                  }
                  label="Link ativo"
                />
                <Typography variant="caption" color="textSecondary" display="block">
                  Links inativos não aceitam novas inscrições
                </Typography>
              </Grid>
            </Grid>
          )}

          {/* Tab 1: Personalização */}
          {tabValue === 1 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Identidade da Marca
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Nome da Empresa"
                  value={formData.customization.company_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customization: { ...formData.customization, company_name: e.target.value },
                    })
                  }
                  helperText="Nome da sua empresa exibido na página"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="URL do Logo"
                  value={formData.customization.logo_url}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customization: { ...formData.customization, logo_url: e.target.value },
                    })
                  }
                  placeholder="https://seusite.com/logo.png"
                  helperText="URL completa do logo da empresa"
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Textos da Página
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Título da Página"
                  value={formData.customization.page_title}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customization: { ...formData.customization, page_title: e.target.value },
                    })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descrição da Página"
                  value={formData.customization.page_description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customization: { ...formData.customization, page_description: e.target.value },
                    })
                  }
                  multiline
                  rows={2}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Texto do Botão"
                  value={formData.customization.button_text}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customization: { ...formData.customization, button_text: e.target.value },
                    })
                  }
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mensagem de Sucesso"
                  value={formData.customization.success_message}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customization: { ...formData.customization, success_message: e.target.value },
                    })
                  }
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Cores da Marca
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Cor Primária
                  </Typography>
                  <Box display="flex" gap={2} alignItems="center">
                    <input
                      type="color"
                      value={formData.customization.primary_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customization: { ...formData.customization, primary_color: e.target.value },
                        })
                      }
                      style={{ width: 60, height: 40, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    />
                    <TextField
                      size="small"
                      value={formData.customization.primary_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customization: { ...formData.customization, primary_color: e.target.value },
                        })
                      }
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Cor Secundária
                  </Typography>
                  <Box display="flex" gap={2} alignItems="center">
                    <input
                      type="color"
                      value={formData.customization.secondary_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customization: { ...formData.customization, secondary_color: e.target.value },
                        })
                      }
                      style={{ width: 60, height: 40, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    />
                    <TextField
                      size="small"
                      value={formData.customization.secondary_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customization: { ...formData.customization, secondary_color: e.target.value },
                        })
                      }
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Cor de Fundo
                  </Typography>
                  <Box display="flex" gap={2} alignItems="center">
                    <input
                      type="color"
                      value={formData.customization.background_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customization: { ...formData.customization, background_color: e.target.value },
                        })
                      }
                      style={{ width: 60, height: 40, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    />
                    <TextField
                      size="small"
                      value={formData.customization.background_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customization: { ...formData.customization, background_color: e.target.value },
                        })
                      }
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Cor do Texto
                  </Typography>
                  <Box display="flex" gap={2} alignItems="center">
                    <input
                      type="color"
                      value={formData.customization.text_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customization: { ...formData.customization, text_color: e.target.value },
                        })
                      }
                      style={{ width: 60, height: 40, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    />
                    <TextField
                      size="small"
                      value={formData.customization.text_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customization: { ...formData.customization, text_color: e.target.value },
                        })
                      }
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} md={6}>
                <Box>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Cor do Texto do Botão
                  </Typography>
                  <Box display="flex" gap={2} alignItems="center">
                    <input
                      type="color"
                      value={formData.customization.button_text_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customization: { ...formData.customization, button_text_color: e.target.value },
                        })
                      }
                      style={{ width: 60, height: 40, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                    />
                    <TextField
                      size="small"
                      value={formData.customization.button_text_color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customization: { ...formData.customization, button_text_color: e.target.value },
                        })
                      }
                    />
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info" icon={<PreviewIcon />}>
                  As cores serão aplicadas na página de opt-in personalizada do cliente
                </Alert>
              </Grid>
            </Grid>
          )}

          {/* Tab 2: Campos do Formulário */}
          {tabValue === 2 && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Campos Obrigatórios
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Selecione quais campos serão solicitados no formulário de opt-in
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.form_fields.require_name}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            form_fields: { ...formData.form_fields, require_name: e.target.checked },
                          })
                        }
                      />
                    }
                    label="Solicitar Nome"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.form_fields.require_email}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            form_fields: { ...formData.form_fields, require_email: e.target.checked },
                          })
                        }
                      />
                    }
                    label="Solicitar Email"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.form_fields.require_phone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            form_fields: { ...formData.form_fields, require_phone: e.target.checked },
                          })
                        }
                      />
                    }
                    label="Solicitar Telefone"
                  />
                </FormGroup>
              </Grid>

              <Grid item xs={12}>
                <Alert severity="warning">
                  Pelo menos um campo deve ser selecionado para identificar o cliente
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingLink ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
