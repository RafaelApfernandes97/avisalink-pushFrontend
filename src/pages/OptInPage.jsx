import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import api from '../services/api';

const OptInPage = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [linkData, setLinkData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  useEffect(() => {
    loadOptInLink();
  }, [token]);

  const loadOptInLink = async () => {
    try {
      const response = await api.get(`/opt-in/${token}`);
      console.log('Opt-in link data:', response.data.data);
      console.log('Logo URL:', response.data.data?.customization?.logo_url);
      setLinkData(response.data.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Link inválido ou expirado');
      setLoading(false);
    }
  };

  // Detectar iOS/Safari
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
           (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  };

  const isSafari = () => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  };

  const handleSubscribe = async () => {
    // Validação dos campos obrigatórios
    if (linkData?.form_fields?.require_name && !formData.name) {
      setError('Por favor, informe seu nome');
      return;
    }
    if (linkData?.form_fields?.require_email && !formData.email) {
      setError('Por favor, informe seu email');
      return;
    }
    if (linkData?.form_fields?.require_phone && !formData.phone) {
      setError('Por favor, informe seu telefone');
      return;
    }

    setSubscribing(true);
    setError('');

    try {
      // Verificar suporte a notificações
      if (!('Notification' in window)) {
        console.error('Este navegador não suporta notificações');
        setError('Seu navegador não suporta notificações push. Por favor, use Chrome, Firefox ou Safari atualizado.');
        setSubscribing(false);
        return;
      }

      const isIOSDevice = isIOS();
      const isSafariBrowser = isSafari();

      console.log('Device detection:', { isIOSDevice, isSafariBrowser });

      // Request notification permission
      let permission = Notification.permission;

      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }

      console.log('Notification permission:', permission);

      if (permission !== 'granted') {
        setError('Você precisa permitir notificações para continuar');
        setSubscribing(false);
        return;
      }

      let subscription = null;

      // Try to get service worker and subscription
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          console.log('Registering service worker...');

          // Always register/update service worker to ensure latest version
          let registration = await navigator.serviceWorker.register('/sw.js', {
            updateViaCache: 'none', // Disable caching to always get latest version
            scope: '/'
          });

          console.log('Service worker registered:', registration);

          // Wait for service worker to be ready
          await navigator.serviceWorker.ready;
          console.log('Service worker ready');

          // Force update check (não suportado em todos browsers)
          if (registration.update) {
            try {
              await registration.update();
              console.log('Service worker updated');
            } catch (updateError) {
              console.warn('Service worker update not supported:', updateError);
            }
          }

          // Get VAPID public key
          console.log('Fetching VAPID key...');
          const vapidResponse = await api.get('/public/vapid');
          const vapidPublicKey = vapidResponse.data.data.vapid_public_key;
          console.log('VAPID key received');

          // Check if already subscribed
          const existingSubscription = await registration.pushManager.getSubscription();

          if (existingSubscription) {
            console.log('Found existing subscription, unsubscribing first...');
            await existingSubscription.unsubscribe();
          }

          // Subscribe to push notifications
          console.log('Subscribing to push...');
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
          });

          console.log('Push subscription successful:', subscription);
        } catch (swError) {
          console.error('Service Worker error:', swError);
          console.error('Error name:', swError.name);
          console.error('Error message:', swError.message);

          // Mensagens específicas por tipo de erro
          if (swError.name === 'NotAllowedError') {
            setError('Permissão de notificação negada. Por favor, habilite nas configurações do navegador.');
            setSubscribing(false);
            return;
          } else if (swError.name === 'NotSupportedError') {
            console.warn('Push not supported, continuing without push subscription');
            // Continue para registrar mesmo sem push
          } else if (isIOSDevice && swError.message.includes('subscription')) {
            // Erro específico do iOS - pode ser limitação do Safari
            console.warn('iOS Push API limitation:', swError);
            setError('Erro ao criar inscrição no iOS. Certifique-se de estar usando Safari no iOS 16.4+. Se o problema persistir, tente limpar o cache ou adicionar este site à tela inicial.');
            setSubscribing(false);
            return;
          } else {
            // Outros erros - continuar sem push subscription
            console.warn('Push subscription failed, continuing without it:', swError);
          }
        }
      } else {
        console.warn('Service Worker or Push Manager not available');

        if (isIOSDevice) {
          setError('Seu navegador iOS não suporta notificações push. Use Safari no iOS 16.4 ou superior. Se já estiver usando Safari, verifique se o iOS está atualizado.');
          setSubscribing(false);
          return;
        }
      }

      // Send subscription to backend
      const payload = {
        name: formData.name || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        custom_data: {},
        subscription: subscription ? subscription.toJSON() : null,
        platform: isIOSDevice ? 'ios' : 'other',
        browser: isSafariBrowser ? 'safari' : 'other'
      };

      console.log('Sending opt-in data:', payload);

      const response = await api.post(`/opt-in/${token}`, payload);

      console.log('Opt-in response:', response.data);

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '' });
    } catch (err) {
      console.error('Subscription error:', err);
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || err.response?.data?.message || 'Erro ao se inscrever. Por favor, tente novamente.');
    } finally {
      setSubscribing(false);
    }
  };

  const urlBase64ToUint8Array = (base64String) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  // Estilos personalizados baseados na customização
  const customStyles = linkData?.customization ? {
    backgroundColor: linkData.customization.background_color || '#ffffff',
    color: linkData.customization.text_color || '#000000',
  } : {};

  const buttonStyles = linkData?.customization ? {
    backgroundColor: linkData.customization.primary_color || '#1976d2',
    color: linkData.customization.button_text_color || '#ffffff',
    '&:hover': {
      backgroundColor: linkData.customization.secondary_color || '#424242',
    },
  } : {};

  // Detectar se precisa mostrar aviso iOS
  const showIOSWarning = () => {
    const isIOSDevice = isIOS();
    const isSafariBrowser = isSafari();

    // Mostrar aviso se for iOS mas não Safari, ou iOS antigo
    if (isIOSDevice && !isSafariBrowser) {
      return true;
    }

    // Verificar versão do iOS (simplificado)
    const match = navigator.userAgent.match(/OS (\d+)_/);
    if (match && parseInt(match[1]) < 16) {
      return true;
    }

    return false;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={customStyles}>
        <CircularProgress />
      </Box>
    );
  }

  if (error && !linkData) {
    return (
      <Container component="main" maxWidth="sm">
        <Box sx={{ marginTop: 8 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', ...customStyles, py: 4 }}>
      <Container component="main" maxWidth="sm">
        <Box
          sx={{
            marginTop: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Paper elevation={3} sx={{ p: 4, width: '100%', ...customStyles }}>
            

            {/* Logo da empresa */}
            {linkData?.customization?.logo_url && linkData.customization.logo_url.trim() !== '' && (
              <Box display="flex" justifyContent="center" mb={3}>
                <img
                  src={linkData.customization.logo_url}
                  alt={linkData.customization.company_name || 'Logo'}
                  style={{ maxWidth: '200px', maxHeight: '80px', objectFit: 'contain' }}
                  onLoad={() => console.log('Logo carregada com sucesso:', linkData.customization.logo_url)}
                  onError={(e) => {
                    console.error('Erro ao carregar logo:', linkData.customization.logo_url);
                    e.target.style.display = 'none';
                  }}
                />
              </Box>
            )}

            {/* Nome da empresa (se não houver logo) */}
            {linkData?.customization?.company_name &&
             (!linkData?.customization?.logo_url || linkData?.customization?.logo_url.trim() === '') && (
              <Typography
                variant="h4"
                align="center"
                gutterBottom
                sx={{ color: linkData.customization.primary_color || '#1976d2', fontWeight: 'bold' }}
              >
                {linkData.customization.company_name}
              </Typography>
            )}

            {/* Ícone de notificação */}
            

            {/* Título */}
            <Typography
              component="h1"
              variant="h5"
              align="center"
              gutterBottom
              sx={{ color: customStyles.color }}
            >
              {linkData?.customization?.page_title || 'Receba Notificações'}
            </Typography>

            {/* Descrição */}
            <Typography
              variant="body1"
              align="center"
              sx={{ mb: 3, color: customStyles.color, opacity: 0.8 }}
            >
              {linkData?.customization?.page_description || 'Inscreva-se para receber notificações importantes'}
            </Typography>

            {success ? (
              <Alert
                severity="success"
                sx={{
                  backgroundColor: `${linkData?.customization?.primary_color}20` || undefined,
                  color: customStyles.color
                }}
              >
                {linkData?.customization?.success_message || 'Inscrição realizada com sucesso! Você começará a receber notificações em breve.'}
              </Alert>
            ) : (
              <>
                {/* Aviso específico para iOS */}
                {showIOSWarning() && (
                  <Alert severity="info" sx={{ mb: 2 }}>
                    📱 <strong>Usuários iOS:</strong> Use o Safari e certifique-se de ter iOS 16.4 ou superior.
                    Se encontrar problemas, tente adicionar este site à tela inicial para melhor experiência.
                  </Alert>
                )}

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                {/* Campo Nome */}
                {linkData?.form_fields?.require_name && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Nome"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={subscribing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: linkData?.customization?.primary_color || undefined,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: linkData?.customization?.primary_color || undefined,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: linkData?.customization?.primary_color || undefined,
                      },
                    }}
                  />
                )}

                {/* Campo Email */}
                {linkData?.form_fields?.require_email && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={subscribing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: linkData?.customization?.primary_color || undefined,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: linkData?.customization?.primary_color || undefined,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: linkData?.customization?.primary_color || undefined,
                      },
                    }}
                  />
                )}

                {/* Campo Telefone */}
                {linkData?.form_fields?.require_phone && (
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    label="Telefone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={subscribing}
                    placeholder="(00) 00000-0000"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '&:hover fieldset': {
                          borderColor: linkData?.customization?.primary_color || undefined,
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: linkData?.customization?.primary_color || undefined,
                        },
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: linkData?.customization?.primary_color || undefined,
                      },
                    }}
                  />
                )}

                <Button
                  fullWidth
                  variant="contained"
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  sx={{ mt: 3, mb: 2, ...buttonStyles }}
                  size="large"
                >
                  {subscribing ? (
                    <CircularProgress size={24} sx={{ color: linkData?.customization?.button_text_color || '#fff' }} />
                  ) : (
                    linkData?.customization?.button_text || 'Permitir Notificações'
                  )}
                </Button>

                {/* Informações adicionais */}
                <Typography
                  variant="caption"
                  align="center"
                  display="block"
                  sx={{ mt: 2, color: customStyles.color, opacity: 0.6 }}
                >
                  Ao se inscrever, você concorda em receber notificações push.
                  Você pode cancelar a inscrição a qualquer momento.
                </Typography>
              </>
            )}
          </Paper>

          {/* Powered by (opcional) */}
          {linkData?.customization?.company_name && (
            <Typography
              variant="caption"
              align="center"
              sx={{ mt: 3, color: customStyles.color, opacity: 0.5 }}
            >
              Powered by {linkData.customization.company_name}
            </Typography>
          )}
        </Box>
      </Container>
    </Box>
  );
};

export default OptInPage;
