import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Button,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  ContentCopy as CopyIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Template } from '../types';
import { useToast } from '../contexts/ToastContext';

export const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Fetch user's favorites
  const {
    data: favorites,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiService.getFavorites(),
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: (templateId: string) => apiService.toggleFavorite(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
    },
  });

  const handleToggleFavorite = (templateId: string) => {
    toggleFavoriteMutation.mutate(templateId);
  };

  const handleCopyTemplate = (template: Template) => {
    const textToCopy = `${template.title}\n\n${template.description}`;
    navigator.clipboard.writeText(textToCopy);
    showToast('Template copied to clipboard!', 'success');
  };

  const handleTemplateClick = (templateId: string) => {
    navigate(`/templates/${templateId}`);
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          My Favorites
        </Typography>
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" height={32} width="80%" />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Skeleton variant="text" height={20} width="40%" />
                  <Box sx={{ mt: 2 }}>
                    <Skeleton variant="rectangular" height={24} width="100%" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          My Favorites
        </Typography>
        <Alert severity="error">
          Failed to load favorites. Please try again later.
        </Alert>
      </Box>
    );
  }

  const favoriteTemplates = favorites || [];
  
  // Debug logging
  console.log('🔍 Favorites data:', favorites);
  console.log('🔍 Favorite templates:', favoriteTemplates);
  console.log('🔍 Is array:', Array.isArray(favoriteTemplates));
  console.log('🔍 Type of favorites:', typeof favorites);
  console.log('🔍 Favorites length:', favorites?.length);
  console.log('🔍 Raw API response structure:', favorites);

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        My Favorites
      </Typography>

      {!Array.isArray(favoriteTemplates) || favoriteTemplates.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No favorites yet
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Start exploring templates and add your favorites to see them here.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/templates')}
            startIcon={<ArrowForwardIcon />}
          >
            Browse Templates
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {Array.isArray(favoriteTemplates) && favoriteTemplates.map((favorite) => (
            <Grid item xs={12} sm={6} md={4} key={favorite.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  cursor: 'pointer',
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out',
                  }
                }}
                onClick={() => handleTemplateClick(favorite.template_id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {favorite.template?.title || 'Template Title'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {favorite.template?.description || 'Template description'}
                  </Typography>
                  {favorite.template?.category && (
                    <Box sx={{ mb: 2 }}>
                      <Chip 
                        label={favorite.template.category} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </Box>
                  )}
                  {favorite.template?.variables && favorite.template.variables.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Variables: {favorite.template.variables.join(', ')}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
                <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(favorite.template_id);
                      }}
                      color="error"
                    >
                      <FavoriteIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (favorite.template) {
                          handleCopyTemplate(favorite.template);
                        }
                      }}
                    >
                      <CopyIcon />
                    </IconButton>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTemplateClick(favorite.template_id);
                    }}
                  >
                    Use Template
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
