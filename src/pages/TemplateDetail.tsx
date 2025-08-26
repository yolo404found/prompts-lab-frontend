import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  Alert,
  Skeleton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { Template, NotionIntegration } from '../types';
import { useToast } from '../contexts/ToastContext';

interface ParsedVariable {
  key: string;
  type: 'string' | 'number' | 'select';
  options?: string[];
  required: boolean;
}

interface VariableFormData {
  [key: string]: string;
}

export const TemplateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [formData, setFormData] = useState<VariableFormData>({});
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportMode, setExportMode] = useState<'page' | 'database'>('page');
  const [targetId, setTargetId] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Fetch template data
  const {
    data: template,
    isLoading: isLoadingTemplate,
    error: templateError,
  } = useQuery({
    queryKey: ['template', id],
    queryFn: () => apiService.getTemplate(id!),
    enabled: !!id,
  });

  // Fetch Notion integration status
  const {
    data: notionStatus,
    isLoading: isLoadingNotion,
  } = useQuery({
    queryKey: ['notion-status'],
    queryFn: () => apiService.getNotionStatus(),
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: (templateId: string) => apiService.toggleFavorite(templateId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', id] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  // Export template mutation
  const exportMutation = useMutation({
    mutationFn: (exportData: any) => apiService.exportTemplate(id!, exportData),
    onSuccess: () => {
      showToast('Template exported to Notion successfully!', 'success');
      setShowExportDialog(false);
    },
    onError: () => {
      showToast('Failed to export template. Please try again.', 'error');
    },
  });

  // Parse variables from template content
  const parsedVariables = useMemo(() => {
    if (!template?.content) return [];

    try {
      const content = typeof template.content === 'string' 
        ? JSON.parse(template.content) 
        : template.content;

      const variables: ParsedVariable[] = [];
      const variableSet = new Set<string>();

      // Extract variables from content blocks
      const extractVariables = (obj: any) => {
        if (typeof obj === 'string') {
          const matches = obj.match(/\{([a-zA-Z0-9_]+)\}/g);
          if (matches) {
            matches.forEach(match => {
              const key = match.slice(1, -1); // Remove { and }
              if (!variableSet.has(key)) {
                variableSet.add(key);
                variables.push({
                  key,
                  type: 'string',
                  required: true,
                });
              }
            });
          }
        } else if (Array.isArray(obj)) {
          obj.forEach(extractVariables);
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach(extractVariables);
        }
      };

      extractVariables(content);
      return variables;
    } catch (error) {
      console.error('Error parsing template content:', error);
      return [];
    }
  }, [template?.content]);

  // Initialize form data with parsed variables
  useEffect(() => {
    if (parsedVariables.length > 0) {
      const initialData: VariableFormData = {};
      parsedVariables.forEach(variable => {
        initialData[variable.key] = '';
      });
      setFormData(initialData);
    }
  }, [parsedVariables]);

  // Generate live preview
  const livePreview = useMemo(() => {
    if (!template?.content || parsedVariables.length === 0) {
      return template?.content || '';
    }

    try {
      let preview = JSON.stringify(template.content, null, 2);
      
      // Replace variables with form values
      parsedVariables.forEach(variable => {
        const regex = new RegExp(`\\{${variable.key}\\}`, 'g');
        const value = formData[variable.key] || `{${variable.key}}`;
        preview = preview.replace(regex, value);
      });

      return preview;
    } catch (error) {
      console.error('Error generating preview:', error);
      return template.content;
    }
  }, [template?.content, parsedVariables, formData]);

  const handleToggleFavorite = () => {
    if (template) {
      toggleFavoriteMutation.mutate(template.id);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(livePreview);
    showToast('Template copied to clipboard!', 'success');
  };

  const handleExportToNotion = () => {
    if (!notionStatus?.is_connected) {
      // Redirect to settings to connect Notion
      navigate('/settings');
      return;
    }
    setShowExportDialog(true);
  };

  const handleExport = () => {
    if (!targetId.trim()) return;

    const exportData = {
      mode: exportMode,
      targetId: targetId.trim(),
      variables: formData,
    };

    exportMutation.mutate(exportData);
  };

  const handleFormChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (isLoadingTemplate) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Skeleton variant="text" width={300} height={40} />
        </Box>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={400} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (templateError || !template) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4">Template Not Found</Typography>
        </Box>
        <Alert severity="error">
          The template you're looking for doesn't exist or there was an error loading it.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {template.title}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip label={template.category} color="primary" variant="outlined" />
            {template.variables && template.variables.length > 0 && (
              <Typography variant="body2" color="text.secondary">
                {template.variables.length} variables
              </Typography>
            )}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton
            onClick={handleToggleFavorite}
            color={template.is_favorite ? 'error' : 'default'}
          >
            {template.is_favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
          </IconButton>
          <Button
            variant="outlined"
            startIcon={<CopyIcon />}
            onClick={handleCopyToClipboard}
          >
            Copy
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleExportToNotion}
            disabled={isLoadingNotion}
          >
            Export to Notion
          </Button>
        </Box>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        {template.description}
      </Typography>

      <Grid container spacing={3}>
        {/* Variables Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Fill in Variables
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Customize the template by filling in the required variables below.
            </Typography>
            
            {parsedVariables.length === 0 ? (
              <Alert severity="info">
                This template has no variables to fill in.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {parsedVariables.map((variable) => (
                  <TextField
                    key={variable.key}
                    label={variable.key.replace(/_/g, ' ')}
                    value={formData[variable.key] || ''}
                    onChange={(e) => handleFormChange(variable.key, e.target.value)}
                    fullWidth
                    required={variable.required}
                    placeholder={`Enter ${variable.key.replace(/_/g, ' ')}`}
                  />
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Live Preview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Live Preview
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              See how your template will look with the variables filled in.
            </Typography>
            
            <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography
                  component="pre"
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                    lineHeight: 1.5,
                  }}
                >
                  {livePreview}
                </Typography>
              </CardContent>
            </Card>
          </Paper>
        </Grid>
      </Grid>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onClose={() => setShowExportDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Export to Notion</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Export Mode</InputLabel>
              <Select
                value={exportMode}
                label="Export Mode"
                onChange={(e) => setExportMode(e.target.value as 'page' | 'database')}
              >
                <MenuItem value="page">Create New Page</MenuItem>
                <MenuItem value="database">Add to Database</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={exportMode === 'page' ? 'Parent Page ID' : 'Database ID'}
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              fullWidth
              required
              helperText={
                exportMode === 'page'
                  ? 'The ID of the parent page where the new page will be created'
                  : 'The ID of the database where the record will be added'
              }
            />

            <Alert severity="info">
              <Typography variant="body2">
                To find the ID, open the page/database in Notion and copy the ID from the URL.
                <br />
                Example: https://notion.so/workspace/page-id → page-id
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={!targetId.trim() || exportMutation.isPending}
            startIcon={exportMutation.isPending ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {exportMutation.isPending ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>


    </Box>
  );
};
