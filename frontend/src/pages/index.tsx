import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <>
      <Head>
        <title>AI Platform</title>
        <meta name="description" content="A comprehensive AI platform for multiple workloads" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Box
        component="main"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            AI Platform
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom>
            A comprehensive AI platform for multiple workloads
          </Typography>
          <Typography paragraph sx={{ mb: 4 }}>
            Access cutting-edge AI capabilities, manage knowledge, and orchestrate agent workflows in one centralized platform.
          </Typography>
          <Box sx={{ mt: 4 }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => router.push('/login')}
              sx={{ mr: 2 }}
            >
              Sign In
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              onClick={() => router.push('/about')}
            >
              Learn More
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
} 