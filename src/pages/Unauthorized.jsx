import React from 'react';
import { Container, Paper, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Unauthorized = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const handleGoBack = () => {
    if (isAdmin()) {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, width: '100%', textAlign: 'center' }}>
          <Typography variant="h4" color="error" gutterBottom>
            Acesso Negado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Você não tem permissão para acessar esta página.
          </Typography>
          <Button variant="contained" onClick={handleGoBack}>
            Voltar ao Dashboard
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Unauthorized;
