import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Settings as NotionIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { NotionIntegration, GlobalVariable } from '../types';
import { useToast } from '../contexts/ToastContext';

export const Settings: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const [showAddVariableDialog, setShowAddVariableDialog] = useState(false);
  const [editingVariable, setEditingVariable] = useState<GlobalVariable | null>(null);
  const [newVariableKey, setNewVariableKey] = useState('');
  const [newVariableValue, setNewVariableValue] = useState('');

  // Fetch Notion integration status
  const {
    data: notionStatus,
    isLoading: isLoadingNotion,
    refetch: refetchNotion,
  } = useQuery({
    queryKey: ['notion-status'],
    queryFn: () => apiService.getNotionStatus(),
  });

  // Get global variables from localStorage
  const [globalVariables, setGlobalVariables] = useState<GlobalVariable[]>(() => {
    const stored = localStorage.getItem('globalVariables');
    return stored ? JSON.parse(stored) : [];
  });

  // Start Notion OAuth mutation
  const startOAuthMutation = useMutation({
    mutationFn: () => apiService.startNotionOAuth(),
    onSuccess: (data) => {
      // Show info message
      showToast('Redirecting to Notion for authorization...', 'info');
      
      // Redirect to Notion OAuth URL in the same tab
      window.location.href = data.authUrl;
    },
  });

  // Save global variables to localStorage
  useEffect(() => {
    localStorage.setItem('globalVariables', JSON.stringify(globalVariables));
  }, [globalVariables]);

  // Check for OAuth callback parameters when component mounts
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    
    if (connected === 'notion') {
      showToast('Notion connected successfully!', 'success');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refetch Notion status
      refetchNotion();
    } else if (error) {
      const message = urlParams.get('message') || 'OAuth failed';
      showToast(`Notion connection failed: ${message}`, 'error');
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [refetchNotion, showToast]);

  const handleAddVariable = () => {
    if (newVariableKey.trim() && newVariableValue.trim()) {
      const newVariable: GlobalVariable = {
        key: newVariableKey.trim(),
        value: newVariableValue.trim(),
      };
      
      setGlobalVariables(prev => [...prev, newVariable]);
      setNewVariableKey('');
      setNewVariableValue('');
      setShowAddVariableDialog(false);
      showToast('Global variable added successfully!', 'success');
    }
  };

  const handleEditVariable = (variable: GlobalVariable) => {
    setEditingVariable(variable);
    setNewVariableKey(variable.key);
    setNewVariableValue(variable.value);
    setShowAddVariableDialog(true);
  };

  const handleUpdateVariable = () => {
    if (editingVariable && newVariableKey.trim() && newVariableValue.trim()) {
      setGlobalVariables(prev => 
        prev.map(v => 
          v.key === editingVariable.key 
            ? { key: newVariableKey.trim(), value: newVariableValue.trim() }
            : v
        )
      );
      setEditingVariable(null);
      setNewVariableKey('');
      setNewVariableValue('');
      setShowAddVariableDialog(false);
      showToast('Global variable updated successfully!', 'success');
    }
  };

  const handleDeleteVariable = (key: string) => {
    setGlobalVariables(prev => prev.filter(v => v.key !== key));
    showToast('Global variable deleted successfully!', 'success');
  };

  const handleStartNotionOAuth = () => {
    startOAuthMutation.mutate();
  };

  const handleDisconnectNotion = () => {
    // This would typically call an API to disconnect
    // For now, we'll just show a message
    alert('Notion disconnection would be implemented here');
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>

      <Grid container spacing={3}>
        {/* Notion Integration */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <NotionIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Notion Integration</Typography>
            </Box>
            
            {isLoadingNotion ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : notionStatus?.is_connected ? (
              <Box>
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleIcon sx={{ mr: 1 }} />
                    Connected to Notion
                  </Box>
                </Alert>
                
                <Card variant="outlined" sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Workspace
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {notionStatus.workspace_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {notionStatus.workspace_id}
                    </Typography>
                  </CardContent>
                </Card>

                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDisconnectNotion}
                  fullWidth
                >
                  Disconnect Notion
                </Button>
              </Box>
            ) : (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  Connect your Notion workspace to export templates directly.
                </Alert>
                
                <Button
                  variant="contained"
                  onClick={handleStartNotionOAuth}
                  disabled={startOAuthMutation.isPending}
                  startIcon={
                    startOAuthMutation.isPending ? (
                      <CircularProgress size={20} />
                    ) : (
                      <NotionIcon />
                    )
                  }
                  fullWidth
                >
                  {startOAuthMutation.isPending ? 'Connecting...' : 'Connect Notion'}
                </Button>
                
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  You'll be redirected to Notion to authorize the connection.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Global Variables */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Global Variables</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setShowAddVariableDialog(true)}
              >
                Add Variable
              </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              Define default values for commonly used variables. These will be pre-filled in template forms.
            </Typography>

            {globalVariables.length === 0 ? (
              <Alert severity="info">
                No global variables defined yet. Add some to speed up your template usage.
              </Alert>
            ) : (
              <List>
                {globalVariables.map((variable) => (
                  <ListItem key={variable.key} divider>
                    <ListItemText
                      primary={variable.key}
                      secondary={variable.value}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        size="small"
                        onClick={() => handleEditVariable(variable)}
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteVariable(variable.key)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Additional Settings */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Preferences
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Auto-save form data"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch />}
                  label="Show variable hints"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch defaultChecked />}
                  label="Enable keyboard shortcuts"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={<Switch />}
                  label="Dark mode by default"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit Variable Dialog */}
      <Dialog open={showAddVariableDialog} onClose={() => setShowAddVariableDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingVariable ? 'Edit Global Variable' : 'Add Global Variable'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Variable Key"
              value={newVariableKey}
              onChange={(e) => setNewVariableKey(e.target.value)}
              fullWidth
              required
              placeholder="e.g., brand_name, tone, audience"
              helperText="Use lowercase with underscores (e.g., brand_name)"
            />
            <TextField
              label="Default Value"
              value={newVariableValue}
              onChange={(e) => setNewVariableValue(e.target.value)}
              fullWidth
              required
              placeholder="e.g., Acme Corp, professional, developers"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAddVariableDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={editingVariable ? handleUpdateVariable : handleAddVariable}
            variant="contained"
            disabled={!newVariableKey.trim() || !newVariableValue.trim()}
          >
            {editingVariable ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
