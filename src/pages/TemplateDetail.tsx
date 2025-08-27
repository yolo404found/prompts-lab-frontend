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
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  Send as SendIcon,
  ArrowBack as ArrowBackIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ExpandMore as ExpandMoreIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { Template } from '../types';
import { useToast } from '../contexts/ToastContext';

interface ParsedVariable {
  key: string;
  type: 'string' | 'number' | 'select';
  options?: string[];
  required: boolean;
  description?: string;
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
  const [autoSave, setAutoSave] = useState(true);
  const [showPreview, setShowPreview] = useState(true);

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

  // Generate options for select variables
  const generateOptions = (variableName: string): string[] => {
    const optionMap: Record<string, string[]> = {
      tone: ['Professional', 'Casual', 'Friendly', 'Formal', 'Creative', 'Technical'],
      style: ['Concise', 'Detailed', 'Bullet points', 'Narrative', 'Step-by-step'],
      format: ['Email', 'Report', 'Blog post', 'Social media', 'Documentation'],
      audience: ['Beginners', 'Intermediate', 'Advanced', 'General', 'Technical'],
    };
    
    for (const [key, options] of Object.entries(optionMap)) {
      if (variableName.toLowerCase().includes(key)) {
        return options;
      }
    }
    
    return ['Option 1', 'Option 2', 'Option 3'];
  };

  // Parse variables from template content with enhanced detection
  const parsedVariables = useMemo(() => {
    if (!template?.content) return [];

    try {
      const content = typeof template.content === 'string' 
        ? JSON.parse(template.content) 
        : template.content;

      const variables: ParsedVariable[] = [];
      const variableSet = new Set<string>();

      // Enhanced variable extraction with context
      const extractVariables = (obj: any, path: string = '') => {
        if (typeof obj === 'string') {
          const matches = obj.match(/\{([a-zA-Z0-9_]+)\}/g);
          if (matches) {
            matches.forEach(match => {
              const key = match.slice(1, -1); // Remove { and }
              if (!variableSet.has(key)) {
                variableSet.add(key);
                
                // Try to infer variable type and description from context
                let type: 'string' | 'number' | 'select' = 'string';
                let description = '';
                
                // Check if it's a number variable
                if (key.toLowerCase().includes('count') || key.toLowerCase().includes('number') || key.toLowerCase().includes('age')) {
                  type = 'number';
                }
                
                // Check if it's a select variable
                if (key.toLowerCase().includes('tone') || key.toLowerCase().includes('style') || key.toLowerCase().includes('format')) {
                  type = 'select';
                }
                
                // Generate description based on variable name
                description = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                
                variables.push({
                  key,
                  type,
                  required: true,
                  description,
                  options: type === 'select' ? generateOptions(key) : undefined,
                });
              }
            });
          }
        } else if (Array.isArray(obj)) {
          obj.forEach((item, index) => extractVariables(item, `${path}[${index}]`));
        } else if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj).forEach(([k, v]) => extractVariables(v, `${path}.${k}`));
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

  // Auto-save form data to localStorage
  useEffect(() => {
    if (autoSave && Object.keys(formData).length > 0) {
      localStorage.setItem(`template_${id}_formData`, JSON.stringify(formData));
    }
  }, [formData, autoSave, id]);

  // Load saved form data from localStorage
  useEffect(() => {
    if (autoSave && id) {
      const saved = localStorage.getItem(`template_${id}_formData`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setFormData(prev => ({ ...prev, ...parsed }));
        } catch (error) {
          console.error('Error loading saved form data:', error);
        }
      }
    }
  }, [id, autoSave]);

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
    if (!notionStatus?.connected) {
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

  const clearFormData = () => {
    setFormData({});
    localStorage.removeItem(`template_${id}_formData`);
    showToast('Form data cleared!', 'info');
  };

  const isFormValid = parsedVariables.every(variable => 
    !variable.required || (formData[variable.key] && formData[variable.key].trim() !== '')
  );

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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Chip label={template.category} color="primary" variant="outlined" />
            {template.variables && template.variables.length > 0 && (
              <Chip 
                label={`${template.variables.length} variables`} 
                color="secondary" 
                variant="outlined"
                icon={<CodeIcon />}
              />
            )}
            <Chip 
              label={template.is_public ? 'Public' : 'Private'} 
              color={template.is_public ? 'success' : 'default'} 
              variant="outlined"
            />
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Tooltip title={template.is_favorite ? 'Remove from favorites' : 'Add to favorites'}>
            <IconButton
              onClick={handleToggleFavorite}
              color={template.is_favorite ? 'error' : 'default'}
            >
              {template.is_favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Copy template to clipboard">
            <Button
              variant="outlined"
              startIcon={<CopyIcon />}
              onClick={handleCopyToClipboard}
            >
              Copy
            </Button>
          </Tooltip>
          <Tooltip title="Export to Notion">
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={handleExportToNotion}
              disabled={isLoadingNotion}
            >
              Export to Notion
            </Button>
          </Tooltip>
        </Box>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        {template.description}
      </Typography>

      <Grid container spacing={3}>
        {/* Variables Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Fill in Variables
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoSave}
                      onChange={(e) => setAutoSave(e.target.checked)}
                      size="small"
                    />
                  }
                  label="Auto-save"
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={clearFormData}
                  disabled={Object.keys(formData).length === 0}
                >
                  Clear
                </Button>
              </Box>
            </Box>
            
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
                  <Box key={variable.key}>
                    {variable.type === 'select' ? (
                      <FormControl fullWidth required={variable.required}>
                        <InputLabel>{variable.description || variable.key.replace(/_/g, ' ')}</InputLabel>
                        <Select
                          value={formData[variable.key] || ''}
                          label={variable.description || variable.key.replace(/_/g, ' ')}
                          onChange={(e) => handleFormChange(variable.key, e.target.value)}
                        >
                          {variable.options?.map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    ) : (
                      <TextField
                        label={variable.description || variable.key.replace(/_/g, ' ')}
                        value={formData[variable.key] || ''}
                        onChange={(e) => handleFormChange(variable.key, e.target.value)}
                        fullWidth
                        required={variable.required}
                        placeholder={`Enter ${variable.description || variable.key.replace(/_/g, ' ')}`}
                        type={variable.type === 'number' ? 'number' : 'text'}
                        helperText={variable.required ? 'Required field' : 'Optional field'}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            )}

            {/* Form Validation Status */}
            {parsedVariables.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Alert 
                  severity={isFormValid ? 'success' : 'warning'}
                  icon={isFormValid ? <CheckCircleIcon /> : <WarningIcon />}
                >
                  {isFormValid 
                    ? 'All required variables are filled! Ready to use.' 
                    : 'Please fill in all required variables to use this template.'
                  }
                </Alert>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Live Preview */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Live Preview
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={showPreview}
                    onChange={(e) => setShowPreview(e.target.checked)}
                    size="small"
                  />
                }
                label="Show preview"
              />
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              See how your template will look with the variables filled in.
            </Typography>
            
            {showPreview ? (
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
                      maxHeight: '400px',
                      overflow: 'auto',
                    }}
                  >
                    {livePreview}
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">
                Preview is hidden. Toggle the switch above to see the live preview.
              </Alert>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Template Content Details */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CodeIcon />
              <Typography variant="h6">Template Content Details</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Raw Content:</Typography>
                <Card variant="outlined" sx={{ bgcolor: 'grey.50', p: 2 }}>
                  <Typography
                    component="pre"
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      maxHeight: '200px',
                      overflow: 'auto',
                    }}
                  >
                    {typeof template.content === 'string' ? template.content : JSON.stringify(template.content, null, 2)}
                  </Typography>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Detected Variables:</Typography>
                <List dense>
                  {parsedVariables.map((variable) => (
                    <ListItem key={variable.key}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={variable.key}
                        secondary={`Type: ${variable.type}, Required: ${variable.required ? 'Yes' : 'No'}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      </Paper>

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

            {/* Variable Summary */}
            {parsedVariables.length > 0 && (
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Variables to be exported:</strong>
                  <br />
                  {parsedVariables.map(v => `${v.key}: "${formData[v.key] || 'empty'}"`).join(', ')}
                </Typography>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowExportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={!targetId.trim() || exportMutation.isPending || !isFormValid}
            startIcon={exportMutation.isPending ? <CircularProgress size={20} /> : <SendIcon />}
          >
            {exportMutation.isPending ? 'Exporting...' : 'Export'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
