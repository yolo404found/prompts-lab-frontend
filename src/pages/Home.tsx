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
} from '@mui/material';
import {
  Article as TemplateIcon,
  Favorite as FavoriteIcon,
  TrendingUp as TrendingIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Settings as NotionIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

export const Home: React.FC = () => {
  const navigate = useNavigate();

  // Fetch recent templates and stats
  const { data: recentTemplates, error: templatesError } = useQuery({
    queryKey: ['recent-templates'],
    queryFn: () => {
      console.log('getTemplates query function called');
      return apiService.getTemplates({ limit: 6 });
    },
    retry: false,
    enabled: !!sessionStorage.getItem('auth_token'),
  });

  const { data: favorites, error: favoritesError } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => {
      console.log('getFavorites query function called');
      return apiService.getFavorites();
    },
    retry: false,
    enabled: !!sessionStorage.getItem('auth_token'),
  });

  const { data: notionStatus, error: notionError } = useQuery({
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
    },
    {
      title: 'My Favorites',
      description: 'Access your saved templates',
      icon: <FavoriteIcon />,
      action: () => navigate('/favorites'),
      color: 'secondary',
    },
    {
      title: 'Settings',
      description: 'Configure integrations and preferences',
      icon: <NotionIcon />,
      action: () => navigate('/settings'),
      color: 'success',
    },
  ];

  return (
    <Box>
      {/* Welcome Section */}
      <Paper sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
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
      </Paper>

      {/* Quick Actions */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {quickActions.map((action, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  transition: 'all 0.3s ease-in-out',
                }
              }}
              onClick={action.action}
            >
              <CardContent sx={{ textAlign: 'center', p: 3 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'center', 
                  mb: 2,
                  '& .MuiSvgIcon-root': {
                    fontSize: '3rem',
                    color: `${action.color}.main`,
                  }
                }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" component="h3" gutterBottom>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </CardContent>
            </Card>
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
            
            {templatesError ? (
              <Typography variant="body2" color="error" sx={{ textAlign: 'center', py: 4 }}>
                Failed to load templates. Please try again.
              </Typography>
            ) : recentTemplatesList.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No templates available yet
              </Typography>
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
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="primary" gutterBottom>
                                         {templatesError ? '?' : (recentTemplatesList || []).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Templates
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={6}>
                <Card variant="outlined" sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="h4" color="secondary" gutterBottom>
                    {favoritesError ? '?' : favoritesList.length}
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
                <NotionIcon color={notionStatus?.is_connected ? 'success' : 'disabled'} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2">
                    Notion
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {notionStatus?.is_connected 
                      ? `Connected to ${notionStatus.workspace_name}`
                      : 'Not connected'
                    }
                  </Typography>
                </Box>
                <Chip 
                  label={notionStatus?.is_connected ? 'Connected' : 'Disconnected'} 
                  size="small"
                  color={notionStatus?.is_connected ? 'success' : 'default'}
                  variant="outlined"
                />
              </Box>

              {!notionStatus?.is_connected && (
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
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
