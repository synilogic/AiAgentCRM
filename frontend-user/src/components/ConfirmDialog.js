import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  Paper,
  Slide,
  Avatar,
  Divider,
  Alert,
  TextField,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Delete as DeleteIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Help as HelpIcon,
  Security as SecurityIcon,
  CloudDownload as CloudDownloadIcon,
  Send as SendIcon,
  Logout as LogoutIcon,
  RestartAlt as RestartAltIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import { styled, alpha } from '@mui/material/styles';
import { motion, AnimatePresence } from 'framer-motion';

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
    border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    minWidth: 400,
    maxWidth: 500,
  },
}));

const DialogHeader = styled(Box)(({ theme, severity }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(3, 3, 2, 3),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  backgroundColor: alpha(getSeverityColor(severity), 0.05),
}));

const IconContainer = styled(Avatar)(({ theme, severity }) => ({
  width: 56,
  height: 56,
  marginRight: theme.spacing(2),
  backgroundColor: alpha(getSeverityColor(severity), 0.1),
  color: getSeverityColor(severity),
  '& svg': {
    fontSize: 28,
  },
}));

const DialogBodyContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
  '& .MuiDialogContent-root': {
    padding: 0,
  },
}));

const ActionButton = styled(Button)(({ theme, variant = 'contained' }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  minWidth: 100,
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function getSeverityColor(severity) {
  const colors = {
    error: '#F44336',
    warning: '#FF9800',
    info: '#2196F3',
    success: '#4CAF50',
    default: '#9E9E9E',
  };
  return colors[severity] || colors.default;
}

function getSeverityIcon(severity, type) {
  if (type === 'delete') return <DeleteIcon />;
  if (type === 'logout') return <LogoutIcon />;
  if (type === 'download') return <CloudDownloadIcon />;
  if (type === 'send') return <SendIcon />;
  if (type === 'block') return <BlockIcon />;
  if (type === 'restart') return <RestartAltIcon />;
  if (type === 'security') return <SecurityIcon />;

  const icons = {
    error: <ErrorIcon />,
    warning: <WarningIcon />,
    info: <InfoIcon />,
    success: <CheckCircleIcon />,
    default: <HelpIcon />,
  };
  return icons[severity] || icons.default;
}

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  severity = 'default',
  type = 'default',
  loading = false,
  disabled = false,
  requireConfirmation = false,
  confirmationText = '',
  showCheckbox = false,
  checkboxLabel = 'I understand the consequences',
  customIcon,
  children,
  maxWidth = 'sm',
  fullWidth = false,
  disableEscapeKeyDown = false,
  disableBackdropClick = false,
  showCloseButton = true,
  actionColor = 'primary',
  ...props
}) => {
  const [confirmationValue, setConfirmationValue] = React.useState('');
  const [checkboxChecked, setCheckboxChecked] = React.useState(false);

  const handleClose = () => {
    if (loading) return;
    setConfirmationValue('');
    setCheckboxChecked(false);
    onClose();
  };

  const handleConfirm = () => {
    if (loading) return;
    onConfirm();
  };

  const isConfirmDisabled = 
    disabled || 
    loading || 
    (requireConfirmation && confirmationValue !== confirmationText) ||
    (showCheckbox && !checkboxChecked);

  const displayIcon = customIcon || getSeverityIcon(severity, type);

  return (
    <StyledDialog
      open={open}
      onClose={disableBackdropClick ? undefined : handleClose}
      TransitionComponent={Transition}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      disableEscapeKeyDown={disableEscapeKeyDown || loading}
      {...props}
    >
      <DialogHeader severity={severity}>
        <IconContainer severity={severity}>
          {displayIcon}
        </IconContainer>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {title}
          </Typography>
          {message && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {message}
            </Typography>
          )}
        </Box>
        {showCloseButton && (
          <IconButton
            onClick={handleClose}
            size="small"
            disabled={loading}
            sx={{ ml: 1 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogHeader>

      <DialogBodyContent>
        <AnimatePresence mode="wait">
          <motion.div
            key={open ? 'open' : 'closed'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                {description}
              </Typography>
            )}

            {severity === 'error' && (
              <Alert severity="error" sx={{ mb: 2 }}>
                This action cannot be undone. Please proceed with caution.
              </Alert>
            )}

            {severity === 'warning' && type === 'delete' && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Are you sure you want to delete this item? This action is permanent.
              </Alert>
            )}

            {requireConfirmation && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Type <strong>{confirmationText}</strong> to confirm:
                </Typography>
                <TextField
                  fullWidth
                  variant="outlined"
                  value={confirmationValue}
                  onChange={(e) => setConfirmationValue(e.target.value)}
                  placeholder={confirmationText}
                  disabled={loading}
                  error={confirmationValue && confirmationValue !== confirmationText}
                  helperText={
                    confirmationValue && confirmationValue !== confirmationText
                      ? 'Text does not match'
                      : ''
                  }
                />
              </Box>
            )}

            {showCheckbox && (
              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={checkboxChecked}
                      onChange={(e) => setCheckboxChecked(e.target.checked)}
                      disabled={loading}
                    />
                  }
                  label={checkboxLabel}
                />
              </Box>
            )}

            {children}
          </motion.div>
        </AnimatePresence>
      </DialogBodyContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <ActionButton
          variant="outlined"
          onClick={handleClose}
          disabled={loading}
          color="inherit"
        >
          {cancelText}
        </ActionButton>
        <ActionButton
          variant="contained"
          onClick={handleConfirm}
          disabled={isConfirmDisabled}
          color={
            severity === 'error' ? 'error' :
            severity === 'warning' ? 'warning' :
            severity === 'success' ? 'success' :
            actionColor
          }
          startIcon={loading ? null : displayIcon}
        >
          {loading ? 'Processing...' : confirmText}
        </ActionButton>
      </DialogActions>
    </StyledDialog>
  );
};

// Pre-configured dialog variants
export const DeleteConfirmDialog = (props) => (
  <ConfirmDialog
    severity="error"
    type="delete"
    title="Delete Item"
    message="Are you sure you want to delete this item?"
    confirmText="Delete"
    actionColor="error"
    {...props}
  />
);

export const LogoutConfirmDialog = (props) => (
  <ConfirmDialog
    severity="warning"
    type="logout"
    title="Logout"
    message="Are you sure you want to logout?"
    confirmText="Logout"
    actionColor="warning"
    {...props}
  />
);

export const UnsavedChangesDialog = (props) => (
  <ConfirmDialog
    severity="warning"
    type="warning"
    title="Unsaved Changes"
    message="You have unsaved changes. Are you sure you want to leave?"
    confirmText="Leave"
    cancelText="Stay"
    actionColor="warning"
    {...props}
  />
);

export const BulkDeleteDialog = (props) => (
  <ConfirmDialog
    severity="error"
    type="delete"
    title="Delete Multiple Items"
    message={`Are you sure you want to delete ${props.count || 0} items?`}
    description="This action cannot be undone and will permanently delete all selected items."
    confirmText="Delete All"
    actionColor="error"
    showCheckbox
    checkboxLabel="I understand this action cannot be undone"
    {...props}
  />
);

export const DestructiveActionDialog = (props) => (
  <ConfirmDialog
    severity="error"
    requireConfirmation
    confirmationText="DELETE"
    showCheckbox
    checkboxLabel="I understand the consequences of this action"
    {...props}
  />
);

export default ConfirmDialog; 