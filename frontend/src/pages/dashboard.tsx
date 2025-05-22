import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  Box, 
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  CircularProgress
} from '@mui/material';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // This would be replaced with actual API calls
  useEffect(() => {
    if (isAuthenticated) {
      // Demo data - in a real app this would be from the API
      setAgentsLoading(true);
      setTimeout(() => {
        setAgents([
          { id: 'default', name: 'Default Agent', description: 'General-purpose agent for answering questions' },
          { id: 'knowledge', name: 'Knowledge Agent', description: 'Agent specialized in retrieving information from the knowledge base' },
          { id: 'sql', name: 'SQL Agent', description: 'Agent specialized in generating and executing SQL queries' }
        ]);
        setAgentsLoading(false);
      }, 1000);
    }
  }, [isAuthenticated]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Dashboard | AI Platform</title>
      </Head>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Welcome, {user?.name || user?.email || 'User'}
          </Typography>
          <Typography variant="body1">
            This is your AI Platform dashboard. From here, you can manage your agents, knowledge base, and more.
          </Typography>
        </Paper>
        
        <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
          Available Agents
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {agentsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {agents.map((agent: any) => (
              <Grid item xs={12} md={4} key={agent.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{agent.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {agent.description}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => router.push(`/agents/${agent.id}`)}>
                      Use Agent
                    </Button>
                    <Button size="small" onClick={() => router.push(`/agents/${agent.id}/details`)}>
                      Details
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        <Typography variant="h5" gutterBottom sx={{ mt: 6 }}>
          Knowledge Base
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Paper sx={{ p: 3 }}>
          <Typography variant="body1" gutterBottom>
            Manage your knowledge documents and data sources.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => router.push('/knowledge')}
            sx={{ mt: 2 }}
          >
            Access Knowledge Base
          </Button>
        </Paper>
      </Container>
    </Layout>
  );
} 