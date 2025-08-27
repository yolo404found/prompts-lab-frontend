import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  IconButton,
  Alert,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Code as CodeIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import type { Template } from '../types';
import { useToast } from '../contexts/ToastContext';

const categories = [
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

interface TemplateFormData {
  title: string;
  description: string;
  category: string;
  content: string;
}

interface ParsedVariable {
  key: string;
  type: string;
  required: boolean;
}

export const AdminTemplates: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    title: '',
    description: '',
    category: '',
    content: '',
  });
  const [contentError, setContentError] = useState<string | null>(null);

  // Fetch templates for admin
  const {
    data: templates,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-templates'],
    queryFn: () => apiService.getTemplates({ limit: 100 }),
  });

  // Create template mutation
  const createTemplateMutation = useMutation({
    mutationFn: (data: TemplateFormData) => apiService.createTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowFormDialog(false);
      resetForm();
      showToast('Template created successfully!', 'success');
    },
    onError: () => {
      showToast('Failed to create template. Please try again.', 'error');
    },
  });

  // Update template mutation
  const updateTemplateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TemplateFormData> }) =>
      apiService.updateTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowFormDialog(false);
      resetForm();
      showToast('Template updated successfully!', 'success');
    },
    onError: () => {
      showToast('Failed to update template. Please try again.', 'error');
    },
  });

  // Delete template mutation
  const deleteTemplateMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-templates'] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      showToast('Template deleted successfully!', 'success');
    },
    onError: () => {
      showToast('Failed to delete template. Please try again.', 'error');
    },
  });

  // Parse variables from content JSON
  const parsedVariables = useMemo(() => {
    if (!formData.content) return [];

    try {
      const content = JSON.parse(formData.content);
      const variables: ParsedVariable[] = [];
      const variableSet = new Set<string>();

      const extractVariables = (obj: any) => {
        if (typeof obj === 'string') {
          const matches = obj.match(/\{([a-zA-Z0-9_]+)\}/g);
          if (matches) {
            matches.forEach(match => {
              const key = match.slice(1, -1);
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
      return [];
    }
  }, [formData.content]);

  // Parse variables from content
  const parseVariables = (content: string): string[] => {
    try {
      const parsed = JSON.parse(content);
      const variables: string[] = [];
      const variableSet = new Set<string>();

      const extractVariables = (obj: any) => {
        if (typeof obj === 'string') {
          const matches = obj.match(/\{([a-zA-Z0-9_]+)\}/g);
          if (matches) {
            matches.forEach(match => {
              const key = match.slice(1, -1); // Remove { and }
              if (!variableSet.has(key)) {
                variableSet.add(key);
                variables.push(key);
              }
            });
          }
        } else if (Array.isArray(obj)) {
          obj.forEach(extractVariables);
        } else if (typeof obj === 'object' && obj !== null) {
          Object.values(obj).forEach(extractVariables);
        }
      };

      extractVariables(parsed);
      return variables;
    } catch (error) {
      return [];
    }
  };

  // Validate JSON content
  const validateContent = (content: string) => {
    try {
      JSON.parse(content);
      setContentError(null);
      return true;
    } catch (error) {
      setContentError('Invalid JSON format');
      return false;
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      content: '',
    });
    setContentError(null);
    setEditingTemplate(null);
  };

  const handleOpenForm = (template?: Template) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        title: template.title,
        description: template.description,
        category: template.category,
        content: typeof template.content === 'string' ? template.content : JSON.stringify(template.content, null, 2),
      });
    } else {
      resetForm();
    }
    setShowFormDialog(true);
  };

  const handleSubmit = () => {
    if (!validateContent(formData.content)) return;

    // Transform content to match backend schema
    const transformedData = {
      ...formData,
      content: {
        prompt: formData.content,
        variables: parseVariables(formData.content)
      }
    };

    if (editingTemplate) {
      updateTemplateMutation.mutate({
        id: editingTemplate.id,
        data: transformedData,
      });
    } else {
      createTemplateMutation.mutate(transformedData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplateMutation.mutate(id);
    }
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
    if (content) {
      validateContent(content);
    } else {
      setContentError(null);
    }
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Templates
        </Typography>
        <Grid container spacing={3}>
          {Array.from({ length: 6 }).map((_, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardContent>
                  <Skeleton variant="text" height={32} width="80%" />
                  <Skeleton variant="text" height={20} width="60%" />
                  <Skeleton variant="text" height={20} width="40%" />
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
          Admin Templates
        </Typography>
        <Alert severity="error">
          Failed to load templates. Please try again later.
        </Alert>
      </Box>
    );
  }

  const allTemplates = templates?.templates || [];

  console.log('all templates =>',allTemplates)

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Admin Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenForm()}
        >
          Create Template
        </Button>
      </Box>

      <Grid container spacing={3}>
        {allTemplates.map((template) => (
          <Grid item xs={12} sm={6} md={4} key={template.id}>
            <Card>
              <CardContent>
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
                  <Typography variant="caption" color="text.secondary">
                    Variables: {template.variables.join(', ')}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <IconButton
                  size="small"
                  onClick={() => handleOpenForm(template)}
                >
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => handleDelete(template.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create/Edit Template Dialog */}
      <Dialog open={showFormDialog} onClose={() => setShowFormDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingTemplate ? 'Edit Template' : 'Create Template'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={formData.category}
                    label="Category"
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  >
                    {categories.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              fullWidth
              required
              multiline
              rows={3}
            />

            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <CodeIcon sx={{ mr: 1 }} />
                <Typography variant="h6">Content (JSON)</Typography>
              </Box>
              <TextField
                label="Content"
                value={formData.content}
                onChange={(e) => handleContentChange(e.target.value)}
                fullWidth
                required
                multiline
                rows={8}
                error={!!contentError}
                helperText={contentError || 'Enter valid JSON content with placeholders like {variable_name}'}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: 'monospace',
                    fontSize: '0.875rem',
                  }
                }}
              />
            </Box>

            {/* Variables Preview */}
            {parsedVariables.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Detected Variables
                </Typography>
                <List dense>
                  {parsedVariables.map((variable) => (
                    <ListItem key={variable.key}>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" />
                      </ListItemIcon>
                      <ListItemText
                        primary={variable.key}
                        secondary={`Type: ${variable.type}, Required: ${variable.required}`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFormDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={
              !formData.title ||
              !formData.description ||
              !formData.category ||
              !formData.content ||
              !!contentError ||
              createTemplateMutation.isPending ||
              updateTemplateMutation.isPending
            }
            startIcon={
              createTemplateMutation.isPending || updateTemplateMutation.isPending ? (
                <CircularProgress size={20} />
              ) : (
                <SaveIcon />
              )
            }
          >
            {createTemplateMutation.isPending || updateTemplateMutation.isPending
              ? 'Saving...'
              : editingTemplate
              ? 'Update'
              : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
