import React from 'react';
import { Button, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material';

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}) => {
  return (
    <Button
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <CircularProgress
          size={20}
          sx={{ mr: 1 }}
          color="inherit"
        />
      )}
      {loading && loadingText ? loadingText : children}
    </Button>
  );
};
