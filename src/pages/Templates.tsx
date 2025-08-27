import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
  Skeleton,
  Alert,
  CircularProgress,
  InputAdornment,
  Badge,
  Tooltip,
  Fade,
  Zoom,
} from '@mui/material';
import {
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ContentCopy as CopyIcon,
  Sort as SortIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  TrendingUp as TrendingIcon,
  AccessTime as TimeIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { Template } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { useToast } from '../contexts/ToastContext';

const categories = [
  'All',
  'SEO',
  'Content Writing',
  'Social Media',
  'Email Marketing',
  'Product Descriptions',
  'Creative Writing',
  'Technical Writing',
  'Academic',
  'Other'
];

const sortOptions = [
  { value: 'newest', label: 'Newest First', icon: <TimeIcon /> },
  { value: 'oldest', label: 'Oldest First', icon: <TimeIcon /> },
  { value: 'popular', label: 'Most Popular', icon: <TrendingIcon /> },
  { value: 'name', label: 'Name A-Z', icon: <SortIcon /> },
];

export const Templates: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Infinite query for templates
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['templates', debouncedSearch, selectedCategory, sortBy],
    queryFn: ({ pageParam = 1 }) =>
      apiService.getTemplates({
        page: pageParam,
        limit: 12,
        search: debouncedSearch || undefined,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
      }),
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: (templateId: string) => apiService.toggleFavorite(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
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

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSortBy('newest');
  };

  const hasActiveFilters = searchQuery || selectedCategory !== 'All' || sortBy !== 'newest';

  // Auto-load more when scrolling near bottom
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 1000
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  const allTemplates = data?.pages.flatMap(page => page.data) || [];
  const totalTemplates = data?.pages[0]?.total || 0;

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Templates
        </Typography>
        <Alert 
          severity="error" 
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          Failed to load templates. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header with Stats */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Templates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {totalTemplates} templates available • {allTemplates.length} loaded
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => setShowFilters(!showFilters)}
          color={hasActiveFilters ? 'primary' : 'inherit'}
        >
          Filters {hasActiveFilters && <Badge badgeContent="!" color="primary" />}
        </Button>
      </Box>

      {/* Enhanced Filters */}
      <Fade in={showFilters}>
        <Paper sx={{ p: 3, mb: 3, border: hasActiveFilters ? '2px solid' : '1px solid', borderColor: hasActiveFilters ? 'primary.main' : 'divider' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Search & Filters</Typography>
            {hasActiveFilters && (
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={clearFilters}
                sx={{ ml: 'auto' }}
              >
                Clear All
              </Button>
            )}
          </Box>
          
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search templates by title, description, or content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchQuery && (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={() => setSearchQuery('')}>
                        <ClearIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  label="Category"
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  {sortOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {option.icon}
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Paper>
      </Fade>

      {/* Templates Grid */}
      {isLoading ? (
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
      ) : allTemplates.length === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery || selectedCategory !== 'All'
              ? 'No templates match your criteria'
              : 'No templates found'}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {searchQuery || selectedCategory !== 'All'
              ? 'Try adjusting your search or filter criteria.'
              : 'Templates will appear here once they are added to the system.'}
          </Typography>
          {(searchQuery || selectedCategory !== 'All') && (
            <Button
              variant="outlined"
              onClick={clearFilters}
              startIcon={<ClearIcon />}
              sx={{ mr: 2 }}
            >
              Clear Filters
            </Button>
          )}
          <Button
            variant="contained"
            onClick={() => refetch()}
            startIcon={<SearchIcon />}
          >
            Refresh
          </Button>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {allTemplates.map((template, index) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Zoom in={true} style={{ transitionDelay: `${index * 100}ms` }}>
                  <Card 
                    sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      cursor: 'pointer',
                      position: 'relative',
                      '&:hover': {
                        boxShadow: 8,
                        transform: 'translateY(-4px)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      }
                    }}
                    onClick={() => handleTemplateClick(template.id)}
                  >
                    {/* Favorite Badge */}
                    {template.is_favorite && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          zIndex: 1,
                        }}
                      >
                        <Tooltip title="Favorite">
                          <StarIcon color="warning" />
                        </Tooltip>
                      </Box>
                    )}

                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {template.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {template.description}
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Chip 
                          label={template.category} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </Box>
                      {template.variables && template.variables.length > 0 && (
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" color="text.secondary">
                            Variables: {template.variables.join(', ')}
                          </Typography>
                        </Box>
                      )}
                    </CardContent>
                    <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                      <Box>
                        <Tooltip title={template.is_favorite ? 'Remove from favorites' : 'Add to favorites'}>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(template.id);
                            }}
                            color={template.is_favorite ? 'error' : 'default'}
                          >
                            {template.is_favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Copy template">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyTemplate(template);
                            }}
                          >
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTemplateClick(template.id);
                        }}
                      >
                        Use Template
                      </Button>
                    </CardActions>
                  </Card>
                </Zoom>
              </Grid>
            ))}
          </Grid>

          {/* Load More Button */}
          {hasNextPage && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                variant="outlined"
                size="large"
                onClick={loadMore}
                disabled={isFetchingNextPage}
                startIcon={isFetchingNextPage ? <CircularProgress size={20} /> : null}
              >
                {isFetchingNextPage ? 'Loading...' : 'Load More Templates'}
              </Button>
            </Box>
          )}

          {/* End of Results */}
          {!hasNextPage && allTemplates.length > 0 && (
            <Box sx={{ textAlign: 'center', mt: 4, py: 2 }}>
              <Typography variant="body2" color="text.secondary">
                🎉 You've reached the end! {allTemplates.length} templates loaded.
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};
