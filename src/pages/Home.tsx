import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Skeleton,
  Alert,
  LinearProgress,
  Tooltip,
  Fade,
  Zoom,
  IconButton,
} from '@mui/material';
import {
  Article as TemplateIcon,
  Favorite as FavoriteIcon,
  TrendingUp as TrendingIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Settings as NotionIcon,
  ArrowForward as ArrowForwardIcon,
  Person as UserIcon,
  Speed as SpeedIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  // Fetch recent templates and stats
  const { data: recentTemplates, error: templatesError, isLoading: templatesLoading } = useQuery({
    queryKey: ['recent-templates'],
    queryFn: () => {
      console.log('getTemplates query function called');
      return apiService.getTemplates({ limit: 6 });
    },
    retry: false,
    enabled: !!sessionStorage.getItem('auth_token'),
  });

  const { data: favorites, error: favoritesError, isLoading: favoritesLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => {
      console.log('getFavorites query function called');
      return apiService.getFavorites();
    },
    retry: false,
    enabled: !!sessionStorage.getItem('auth_token'),
  });

  const { data: notionStatus, error: notionError, isLoading: notionLoading } = useQuery({
    queryKey: ['notion-status'],
    queryFn: () => {
      console.log('getNotionStatus query function called');
      return apiService.getNotionStatus();
    },
    retry: false,
    enabled: !!sessionStorage.getItem('auth_token'),
  });

  console.log('recentTemplates:', recentTemplates);
  console.log('recentTemplates?.data:', recentTemplates?.data);
  console.log('Array.isArray(recentTemplates?.data):', Array.isArray(recentTemplates?.data));
  
  const recentTemplatesList = Array.isArray(recentTemplates?.data) ? recentTemplates.data : [];
  const favoritesList = Array.isArray(favorites) ? favorites : [];
  
  console.log('final recentTemplatesList:', recentTemplatesList);
  console.log('final favoritesList:', favoritesList);

  const quickActions = [
    {
      title: 'Browse Templates',
      description: 'Explore our collection of prompt templates',
      icon: <SearchIcon />,
      action: () => navigate('/templates'),
      color: 'primary',
      count: recentTemplates?.total || 0,
    },
    {
      title: 'My Favorites',
      description: 'Access your saved templates',
      icon: <FavoriteIcon />,
      action: () => navigate('/favorites'),
      color: 'secondary',
      count: favoritesList.length,
    },
    {
      title: 'Settings',
      description: 'Configure integrations and preferences',
      icon: <NotionIcon />,
      action: () => navigate('/settings'),
      color: 'success',
      count: notionStatus?.connected ? 1 : 0,
    },
  ];

  const getStatusColor = (status: any) => {
    if (status?.connected) return 'success';
    if (status?.connected === false) return 'error';
    return 'warning';
  };

  const getStatusText = (status: any) => {
    if (status?.connected) return 'Connected';
    if (status?.connected === false) return 'Disconnected';
    return 'Checking...';
  };

  return (
    <Box>
      {/* Welcome Section */}
      <Paper sx={{ 
        p: 4, 
        mb: 4, 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="h3" component="h1" gutterBottom>
            Welcome to Prompt Formatter
          </Typography>
          <Typography variant="h6" paragraph>
            Create, customize, and export AI prompt templates with ease
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/templates')}
              startIcon={<SearchIcon />}
              sx={{ mr: 2, mb: 1 }}
            >
              Start Browsing
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/settings')}
              startIcon={<NotionIcon />}
              sx={{ mb: 1 }}
              color="inherit"
            >
              Connect Notion
            </Button>
          </Box>
        </Box>
        
        {/* Decorative background elements */}
        <Box sx={{
          position: 'absolute',
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          zIndex: 0,
        }} />
        <Box sx={{
          position: 'absolute',
          bottom: -30,
          left: -30,
          width: 150,
          height: 150,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          zIndex: 0,
        }} />
      </Paper>

      {/* Quick Actions */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
              <Card 
                sx={{ 
                  height: '100%',
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 8,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  }
                }}
                onClick={action.action}
              >
                <CardContent sx={{ textAlign: 'center', p: 3 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    mb: 2,
                    position: 'relative',
                    '& .MuiSvgIcon-root': {
                      fontSize: '3rem',
                      color: `${action.color}.main`,
                    }
                  }}>
                    {action.icon}
                    {action.count > 0 && (
                      <Chip
                        label={action.count}
                        size="small"
                        color={action.color}
                        sx={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          minWidth: '20px',
                          height: '20px',
                          fontSize: '0.75rem',
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {action.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {action.description}
                  </Typography>
                </CardContent>
              </Card>
            </Zoom>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* Recent Templates */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h3">
                Recent Templates
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/templates')}
                startIcon={<ArrowForwardIcon />}
              >
                View All
              </Button>
            </Box>
            
            {templatesLoading ? (
              <Box sx={{ py: 2 }}>
                {Array.from({ length: 3 }).map((_, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Skeleton variant="text" height={20} width="60%" />
                    <Skeleton variant="text" height={16} width="40%" />
                  </Box>
                ))}
              </Box>
            ) : templatesError ? (
              <Alert severity="error" sx={{ textAlign: 'center', py: 4 }}>
                Failed to load templates. Please try again.
              </Alert>
            ) : recentTemplatesList.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <TemplateIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  No templates available yet
                </Typography>
              </Box>
            ) : (
              <List>
                {(recentTemplatesList || []).slice(0, 5).map((template, index) => (
                  <React.Fragment key={template.id}>
                    <ListItem 
                      button 
                      onClick={() => navigate(`/templates/${template.id}`)}
                      sx={{ px: 0 }}
                    >
                      <ListItemIcon>
                        <TemplateIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={template.title}
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                            <Chip 
                              label={template.category} 
                              size="small" 
                              variant="outlined"
                            />
                            {template.variables && template.variables.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                {template.variables.length} variables
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < Math.min(4, (recentTemplatesList || []).length - 1) && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Stats & Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" component="h3" gutterBottom>
              Dashboard Overview
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" gutterBottom>
                    {templatesLoading ? '...' : (recentTemplatesList || []).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Templates
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary" gutterBottom>
                    {favoritesLoading ? '...' : favoritesList.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    My Favorites
                  </Typography>
                </Card>
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Notion Integration Status */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Integrations
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <NotionIcon color={getStatusColor(notionStatus)} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2">
                    Notion
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notionStatus?.connected 
                      ? `Connected to ${notionStatus.workspace?.name || 'Unknown'}`
                      : 'Not connected'
                    }
                  </Typography>
                </Box>
                <Chip 
                  label={getStatusText(notionStatus)} 
                  size="small"
                  color={getStatusColor(notionStatus)}
                  variant="outlined"
                />
              </Box>

              {!notionStatus?.connected && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate('/settings')}
                  startIcon={<AddIcon />}
                >
                  Connect Notion
                </Button>
              )}
            </Box>

            {/* System Status */}
            <Divider sx={{ my: 3 }} />
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                System Status
              </Typography>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="body2">Backend API</Typography>
                <Chip label="Online" size="small" color="success" variant="outlined" />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <CheckCircleIcon color="success" />
                <Typography variant="body2">Database</Typography>
                <Chip label="Connected" size="small" color="success" variant="outlined" />
              </Box>
              
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {notionStatus?.connected ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <WarningIcon color="warning" />
                )}
                <Typography variant="body2">Notion API</Typography>
                <Chip 
                  label={notionStatus?.connected ? 'Connected' : 'Disconnected'} 
                  size="small" 
                  color={notionStatus?.connected ? 'success' : 'warning'} 
                  variant="outlined" 
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Tips Section */}
      <Paper sx={{ p: 3, mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          💡 Quick Tips
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <InfoIcon color="info" />
              <Typography variant="body2">
                Use variables like {'{variable_name}'} in your templates for dynamic content
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SpeedIcon color="primary" />
              <Typography variant="body2">
                Connect Notion to export templates directly to your workspace
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FavoriteIcon color="secondary" />
              <Typography variant="body2">
                Favorite templates you use frequently for quick access
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};
