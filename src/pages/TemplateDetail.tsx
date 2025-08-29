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
  Preview as PreviewIcon,
  Info as InfoIcon,
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

  console.log('form valid')

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
      let content: any;
      
      // Handle both string and object content
      if (typeof template.content === 'string') {
        try {
          // Try to parse as JSON first
          content = JSON.parse(template.content);
        } catch {
          // If not JSON, treat as plain string
          content = template.content;
        }
      } else {
        // Content is already an object
        content = template.content;
      }

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
                
                // Check if it's a number variable (more precise matching)
                if (key.toLowerCase() === 'count' || 
                    key.toLowerCase() === 'number' || 
                    key.toLowerCase() === 'age' ||
                    key.toLowerCase().endsWith('_count') ||
                    key.toLowerCase().endsWith('_number') ||
                    key.toLowerCase().endsWith('_age') ||
                    key.toLowerCase().startsWith('count_') ||
                    key.toLowerCase().startsWith('number_') ||
                    key.toLowerCase().startsWith('age_')) {
                  type = 'number';
                }
                
                // Check if it's a select variable
                if (key.toLowerCase().includes('tone') || key.toLowerCase().includes('style') || key.toLowerCase().includes('format')) {
                  type = 'select';
                }
                
                // Override: Certain fields should always be strings regardless of name
                if (key.toLowerCase() === 'language' || 
                    key.toLowerCase() === 'name' || 
                    key.toLowerCase() === 'title' || 
                    key.toLowerCase() === 'description' ||
                    key.toLowerCase() === 'code' ||
                    key.toLowerCase() === 'framework') {
                  type = 'string';
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
    if (!template?.content) {
      return '';
    }

    try {
      // Handle both string and object content
      let contentString: string;
      if (typeof template.content === 'string') {
        contentString = template.content;
      } else {
        // If content is an object, convert it to a readable format
        contentString = JSON.stringify(template.content, null, 2);
      }

      // If no variables to replace, return the content as is
      if (parsedVariables.length === 0) {
        return contentString;
      }

      // Replace variables with form values
      let preview = contentString;
      parsedVariables.forEach(variable => {
        const regex = new RegExp(`\\{${variable.key}\\}`, 'g');
        const value = formData[variable.key] || `{${variable.key}}`;
        preview = preview.replace(regex, value);
      });

      return preview;
    } catch (error) {
      console.error('Error generating preview:', error);
      // Always return a string, never an object
      return typeof template.content === 'string' ? template.content : JSON.stringify(template.content, null, 2);
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
    console.log('targetId',targetId)
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

  const isFormValid = parsedVariables.every(variable => {
    if (!variable.required) return true;
    
    const value = formData[variable.key];
    if (!value) return false;
    
    // Handle different variable types
    if (variable.type === 'number') {
      // For numbers, check if it's a valid number and not empty
      return value !== '' && !isNaN(Number(value));
    } else {
      // For strings and selects, check if it's not empty after trimming
      return typeof value === 'string' && value.trim() !== '';
    }
  });

  // Debug logging to help troubleshoot validation issues
  console.log('=== Form Validation Debug ===');
  console.log('parsedVariables:', parsedVariables);
  console.log('formData:', formData);
  console.log('isFormValid:', isFormValid);
  
  // Log validation details for each variable
  parsedVariables.forEach(variable => {
    const value = formData[variable.key];
    const isValid = !variable.required || (value && (
      variable.type === 'number' 
        ? (value !== '' && !isNaN(Number(value)))
        : (typeof value === 'string' && value.trim() !== '')
    ));
    console.log(`${variable.key} (${variable.type}, required: ${variable.required}): value="${value}", valid: ${isValid}`);
  });
  console.log('===========================');

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
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'grey.50',
      pb: 4
    }}>
      {/* Modern Header with Gradient Background */}
      <Box sx={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: 4,
        px: 3,
        mb: 4,
        borderRadius: '0 0 24px 24px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background Pattern */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100%',
          height: '100%',
          opacity: 0.1,
          background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        }} />
        
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {/* Back Button and Title */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <IconButton 
              onClick={() => navigate(-1)} 
              sx={{ 
                mr: 2, 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                {template.title}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                {template.description}
              </Typography>
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center', mr: 'auto' }}>
              <Chip 
                label={template.category} 
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white', 
                  fontWeight: 600,
                  '& .MuiChip-label': { px: 2 }
                }} 
              />
              {template.variables && template.variables.length > 0 && (
                <Chip 
                  label={`${template.variables.length} variables`} 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.15)', 
                    color: 'white',
                    fontWeight: 500
                  }}
                  icon={<CodeIcon />}
                />
              )}
              <Chip 
                label={template.is_public ? 'Public' : 'Private'} 
                sx={{ 
                  bgcolor: template.is_public ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.15)',
                  color: template.is_public ? '#4caf50' : 'white',
                  fontWeight: 500
                }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Tooltip title={template.is_favorite ? 'Remove from favorites' : 'Add to favorites'}>
                <IconButton
                  onClick={handleToggleFavorite}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: template.is_favorite ? '#ff6b6b' : 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
                  }}
                >
                  {template.is_favorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                </IconButton>
              </Tooltip>
              
              <Button
                variant="outlined"
                startIcon={<CopyIcon />}
                onClick={handleCopyToClipboard}
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': { 
                    borderColor: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                Copy
              </Button>
              
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={handleExportToNotion}
                disabled={isLoadingNotion}
                sx={{
                  bgcolor: 'white',
                  color: 'primary.main',
                  fontWeight: 600,
                  px: 3,
                  py: 1.5,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  '&:hover': {
                    bgcolor: 'grey.100',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
                    transform: 'translateY(-1px)'
                  },
                  '&:disabled': {
                    bgcolor: 'rgba(255,255,255,0.5)',
                    color: 'rgba(0,0,0,0.3)'
                  }
                }}
              >
                Export to Notion
              </Button>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Main Content */}
      <Box sx={{ px: 3 }}>
        <Grid container spacing={4}>
          {/* Variables Form - Enhanced Card Design */}
          <Grid item xs={12} lg={6}>
            <Card sx={{
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'visible'
            }}>
              <Box sx={{
                bgcolor: 'primary.main',
                color: 'white',
                py: 2,
                px: 3,
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <CodeIcon />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Template Variables
                </Typography>
              </Box>
              
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    Customize your template by filling in the variables below
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
                      sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                    />
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={clearFormData}
                      disabled={Object.keys(formData).length === 0}
                      sx={{ borderRadius: 2 }}
                    >
                      Clear
                    </Button>
                  </Box>
                </Box>
                
                {parsedVariables.length === 0 ? (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    bgcolor: 'grey.50',
                    borderRadius: 2
                  }}>
                    <CodeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      This template has no variables to fill in
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {parsedVariables.map((variable, index) => (
                      <Box key={variable.key} sx={{ position: 'relative' }}>
                        {/* Variable Number Badge */}
                        <Box sx={{
                          position: 'absolute',
                          top: -8,
                          left: -8,
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          zIndex: 1
                        }}>
                          {index + 1}
                        </Box>
                        
                        <Box sx={{ pl: 2 }}>
                          {variable.type === 'select' ? (
                            <FormControl fullWidth required={variable.required}>
                              <InputLabel>{variable.description || variable.key.replace(/_/g, ' ')}</InputLabel>
                              <Select
                                value={formData[variable.key] || ''}
                                label={variable.description || variable.key.replace(/_/g, ' ')}
                                onChange={(e) => handleFormChange(variable.key, e.target.value)}
                                sx={{ borderRadius: 2 }}
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
                              sx={{ 
                                '& .MuiOutlinedInput-root': { borderRadius: 2 },
                                '& .MuiInputLabel-root': { fontWeight: 500 }
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                )}

                {/* Enhanced Form Validation Status */}
                {parsedVariables.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        bgcolor: isFormValid ? 'success.50' : 'warning.50',
                        borderColor: isFormValid ? 'success.200' : 'warning.200',
                        borderRadius: 2
                      }}
                    >
                      <CardContent sx={{ py: 2, px: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {isFormValid ? (
                            <CheckCircleIcon color="success" />
                          ) : (
                            <WarningIcon color="warning" />
                          )}
                          <Typography variant="body2" color={isFormValid ? 'success.main' : 'warning.main'}>
                            {isFormValid 
                              ? 'All required variables are filled! Ready to use.' 
                              : 'Please fill in all required variables to use this template.'
                            }
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Live Preview - Enhanced Card Design */}
          <Grid item xs={12} lg={6}>
            <Card sx={{
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'visible'
            }}>
              <Box sx={{
                bgcolor: 'secondary.main',
                color: 'white',
                py: 2,
                px: 3,
                borderRadius: '12px 12px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <PreviewIcon />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Live Preview
                </Typography>
              </Box>
              
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    See how your template will look with the variables filled in
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
                    sx={{ '& .MuiFormControlLabel-label': { fontSize: '0.875rem' } }}
                  />
                </Box>
                
                {showPreview ? (
                  <Card 
                    variant="outlined" 
                    sx={{ 
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                      border: '2px dashed',
                      borderColor: 'divider'
                    }}
                  >
                    <CardContent sx={{ p: 2 }}>
                      <Typography
                        component="pre"
                        variant="body2"
                        sx={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                          lineHeight: 1.6,
                          maxHeight: '400px',
                          overflow: 'auto',
                          color: 'text.primary',
                          bgcolor: 'background.paper',
                          p: 2,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        {livePreview}
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Box sx={{ 
                    textAlign: 'center', 
                    py: 4,
                    bgcolor: 'grey.50',
                    borderRadius: 2
                  }}>
                    <PreviewIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      Preview is hidden. Toggle the switch above to see the live preview.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Template Content Details - Enhanced Design */}
      <Box sx={{ px: 3, mt: 4 }}>
        <Card sx={{
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'visible'
        }}>
          <Box sx={{
            bgcolor: 'grey.800',
            color: 'white',
            py: 2,
            px: 3,
            borderRadius: '12px 12px 0 0',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <CodeIcon />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Template Content Details
            </Typography>
          </Box>
          
          <CardContent sx={{ p: 0 }}>
            <Accordion sx={{ boxShadow: 'none' }}>
              <AccordionSummary 
                expandIcon={<ExpandMoreIcon sx={{ color: 'primary.main' }} />}
                sx={{ 
                  px: 3, 
                  py: 2,
                  '&:hover': { bgcolor: 'grey.50' },
                  '&.Mui-expanded': { minHeight: '48px' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    View Template Structure & Variables
                  </Typography>
                </Box>
              </AccordionSummary>
              
              <AccordionDetails sx={{ px: 3, pb: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Raw Content Structure
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        The underlying JSON structure of your template
                      </Typography>
                    </Box>
                    <Card 
                      variant="outlined" 
                      sx={{ 
                        bgcolor: 'grey.50', 
                        p: 2,
                        borderRadius: 2,
                        border: '2px dashed',
                        borderColor: 'divider'
                      }}
                    >
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
                          color: 'text.primary',
                          bgcolor: 'background.paper',
                          p: 2,
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        {typeof template.content === 'string' ? template.content : JSON.stringify(template.content, null, 2)}
                      </Typography>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                        Detected Variables
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Variables automatically extracted from your template
                      </Typography>
                    </Box>
                    <Card variant="outlined" sx={{ borderRadius: 2 }}>
                      <List sx={{ p: 0 }}>
                        {parsedVariables.map((variable, index) => (
                          <ListItem 
                            key={variable.key}
                            sx={{ 
                              borderBottom: index < parsedVariables.length - 1 ? '1px solid' : 'none',
                              borderColor: 'divider',
                              '&:last-child': { borderBottom: 'none' }
                            }}
                          >
                            <ListItemIcon>
                              <Box sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                bgcolor: 'primary.main',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 600
                              }}>
                                {index + 1}
                              </Box>
                            </ListItemIcon>
                            <ListItemText
                              primary={
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {variable.key}
                                </Typography>
                              }
                              secondary={
                                <Box sx={{ mt: 0.5 }}>
                                  <Chip 
                                    label={variable.type} 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined"
                                    sx={{ mr: 1, mb: 0.5 }}
                                  />
                                  <Chip 
                                    label={variable.required ? 'Required' : 'Optional'} 
                                    size="small" 
                                    color={variable.required ? 'error' : 'default'} 
                                    variant="outlined"
                                    sx={{ mb: 0.5 }}
                                  />
                                  {variable.description && (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                      {variable.description}
                                    </Typography>
                                  )}
                                </Box>
                              }
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Card>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </CardContent>
        </Card>
      </Box>

      {/* Export Dialog */}
      <Dialog 
        open={showExportDialog} 
        onClose={() => setShowExportDialog(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          borderBottom: '1px solid',
          borderColor: 'divider',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <SendIcon color="primary" />
          <Typography variant="h6">Export to Notion</Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Export Mode Selection */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
                Export Mode
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Card 
                  variant={exportMode === 'page' ? 'elevation' : 'outlined'}
                  sx={{ 
                    flex: 1, 
                    cursor: 'pointer',
                    border: exportMode === 'page' ? '2px solid' : '1px solid',
                    borderColor: exportMode === 'page' ? 'primary.main' : 'divider',
                    bgcolor: exportMode === 'page' ? 'primary.50' : 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: exportMode === 'page' ? 'primary.100' : 'grey.50',
                    }
                  }}
                  onClick={() => setExportMode('page')}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h6" color={exportMode === 'page' ? 'primary.main' : 'text.primary'}>
                      📄 New Page
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Create a new page under an existing page
                    </Typography>
                  </CardContent>
                </Card>
                
                <Card 
                  variant={exportMode === 'database' ? 'elevation' : 'outlined'}
                  sx={{ 
                    flex: 1, 
                    cursor: 'pointer',
                    border: exportMode === 'database' ? '2px solid' : '1px solid',
                    borderColor: exportMode === 'database' ? 'primary.main' : 'divider',
                    bgcolor: exportMode === 'database' ? 'primary.50' : 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: exportMode === 'database' ? 'primary.100' : 'grey.50',
                    }
                  }}
                  onClick={() => setExportMode('database')}
                >
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="h6" color={exportMode === 'database' ? 'primary.main' : 'text.primary'}>
                      🗄️ Database Entry
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Add a new record to an existing database
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* Target ID Input */}
            <Box>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 1, fontWeight: 600 }}>
                {exportMode === 'page' ? 'Parent Page ID' : 'Database ID'}
              </Typography>
              <TextField
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                fullWidth
                required
                placeholder={exportMode === 'page' ? 'Enter parent page ID' : 'Enter database ID'}
                helperText={
                  exportMode === 'page'
                    ? 'The ID of the parent page where the new page will be created'
                    : 'The ID of the database where the record will be added'
                }
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: 'text.secondary' }}>
                      🔗
                    </Box>
                  ),
                }}
              />
            </Box>

            {/* ID Help Section */}
            <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
              <CardContent sx={{ py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                  <InfoIcon color="info" sx={{ mt: 0.5 }} />
                  <Box>
                    <Typography variant="subtitle2" color="info.main" gutterBottom>
                      How to find the ID
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Open your {exportMode === 'page' ? 'parent page' : 'database'} in Notion and copy the ID from the URL.
                    </Typography>
                    <Box sx={{ 
                      bgcolor: 'background.paper', 
                      p: 2, 
                      borderRadius: 1, 
                      border: '1px solid',
                      borderColor: 'divider',
                      fontFamily: 'monospace',
                      fontSize: '0.875rem'
                    }}>
                      <Typography variant="body2" component="div">
                        <strong>Example URL:</strong><br />
                        https://notion.so/workspace/page-name-<span style={{ color: 'primary.main', fontWeight: 'bold' }}>25dcccc1179080f08262fed53f9d7c41</span>
                      </Typography>
                      <Typography variant="body2" component="div" sx={{ mt: 1, color: 'primary.main', fontWeight: 'bold' }}>
                        Copy only: 25dcccc1179080f08262fed53f9d7c41
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Variable Summary */}
            {parsedVariables.length > 0 && (
              <Card variant="outlined" sx={{ bgcolor: 'success.50', borderColor: 'success.200' }}>
                <CardContent sx={{ py: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <CheckCircleIcon color="success" sx={{ mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" color="success.main" gutterBottom>
                        Variables to be exported
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                        {parsedVariables.map(v => (
                          <Chip
                            key={v.key}
                            label={`${v.key}: "${formData[v.key] || 'empty'}"`}
                            size="small"
                            variant="outlined"
                            color={formData[v.key] ? 'success' : 'warning'}
                            icon={formData[v.key] ? <CheckCircleIcon /> : <WarningIcon />}
                          />
                        ))}
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Export Preview */}
            <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
              <CardContent sx={{ py: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Export Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  This will create a {exportMode === 'page' ? 'new page' : 'new database entry'} with:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2">Title: {template?.title}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon color="success" fontSize="small" />
                    <Typography variant="body2">Content: Template with {parsedVariables.length} variables filled in</Typography>
                  </Box>
                  {template?.category && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CheckCircleIcon color="success" fontSize="small" />
                      <Typography variant="body2">Category: {template.category}</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button 
            onClick={() => setShowExportDialog(false)}
            variant="outlined"
            disabled={exportMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            variant="contained"
            disabled={!targetId.trim() || exportMutation.isPending || !isFormValid}
            startIcon={exportMutation.isPending ? <CircularProgress size={20} /> : <SendIcon />}
            sx={{ 
              minWidth: 120,
              '&:disabled': {
                bgcolor: 'action.disabledBackground',
                color: 'action.disabled',
              }
            }}
          >
            {exportMutation.isPending ? 'Exporting...' : 'Export to Notion'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
