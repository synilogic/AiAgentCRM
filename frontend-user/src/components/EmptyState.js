import React from 'react';
import { Box, Typography, Button, Paper, Card, CardContent } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import {
  Inbox as InboxIcon,
  SearchOff as SearchOffIcon,
  CloudOff as CloudOffIcon,
  ErrorOutline as ErrorOutlineIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Stars as StarsIcon,
  Lightbulb as LightbulbIcon,
  Celebration as CelebrationIcon,
} from '@mui/icons-material';

const EmptyStateContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  textAlign: 'center',
  minHeight: '300px',
  borderRadius: 12,
  backgroundColor: alpha(theme.palette.grey[50], 0.5),
  border: `1px dashed ${alpha(theme.palette.grey[300], 0.7)}`,
  position: 'relative',
  overflow: 'hidden',
}));

const IconContainer = styled(Box)(({ theme, iconColor }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 80,
  height: 80,
  borderRadius: '50%',
  backgroundColor: alpha(iconColor || theme.palette.grey[400], 0.1),
  marginBottom: theme.spacing(3),
  '& svg': {
    fontSize: 40,
    color: iconColor || theme.palette.grey[400],
  },
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: 8,
  textTransform: 'none',
  fontWeight: 600,
  padding: theme.spacing(1.5, 3),
  marginTop: theme.spacing(2),
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
}));

const IllustrationContainer = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: 0.03,
  zIndex: 0,
  '& svg': {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  position: 'relative',
  zIndex: 1,
  maxWidth: 400,
}));

const getEmptyStateConfig = (type) => {
  const configs = {
    no_data: {
      icon: <InboxIcon />,
      title: 'No Data Available',
      description: 'There is no data to display at the moment.',
      color: '#9E9E9E',
    },
    no_search_results: {
      icon: <SearchOffIcon />,
      title: 'No Results Found',
      description: 'Try adjusting your search terms or filters.',
      color: '#FF9800',
    },
    no_leads: {
      icon: <PeopleIcon />,
      title: 'No Leads Yet',
      description: 'Start generating leads to see them here.',
      color: '#4CAF50',
    },
    no_messages: {
      icon: <MessageIcon />,
      title: 'No Messages',
      description: 'All caught up! No messages to display.',
      color: '#2196F3',
    },
    no_notifications: {
      icon: <NotificationsIcon />,
      title: 'No Notifications',
      description: 'You\'re all caught up! No new notifications.',
      color: '#9C27B0',
    },
    no_tasks: {
      icon: <AssignmentIcon />,
      title: 'No Tasks',
      description: 'Great job! No pending tasks to complete.',
      color: '#FF5722',
    },
    no_analytics: {
      icon: <AnalyticsIcon />,
      title: 'No Analytics Data',
      description: 'Analytics will appear here once you have data.',
      color: '#607D8B',
    },
    error: {
      icon: <ErrorOutlineIcon />,
      title: 'Something Went Wrong',
      description: 'We encountered an error while loading data.',
      color: '#F44336',
    },
    offline: {
      icon: <CloudOffIcon />,
      title: 'You\'re Offline',
      description: 'Please check your internet connection.',
      color: '#795548',
    },
    success: {
      icon: <CelebrationIcon />,
      title: 'All Done!',
      description: 'You\'ve completed all your tasks.',
      color: '#4CAF50',
    },
    getting_started: {
      icon: <StarsIcon />,
      title: 'Welcome to CRM!',
      description: 'Let\'s get you started with your first lead.',
      color: '#3F51B5',
    },
    tips: {
      icon: <LightbulbIcon />,
      title: 'Pro Tip',
      description: 'Use filters to organize your data better.',
      color: '#FFC107',
    },
  };

  return configs[type] || configs.no_data;
};

const EmptyState = ({
  type = 'no_data',
  icon,
  title,
  description,
  action,
  actionText,
  onActionClick,
  showIllustration = true,
  size = 'medium',
  customColor,
  children,
  variant = 'default',
  ...props
}) => {
  const config = getEmptyStateConfig(type);
  const displayIcon = icon || config.icon;
  const displayTitle = title || config.title;
  const displayDescription = description || config.description;
  const displayColor = customColor || config.color;

  const containerHeight = {
    small: '200px',
    medium: '300px',
    large: '400px',
  }[size];

  const animations = {
    container: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.5 },
    },
    icon: {
      initial: { scale: 0 },
      animate: { scale: 1 },
      transition: { delay: 0.2, type: 'spring', stiffness: 200 },
    },
    content: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: 0.3, duration: 0.4 },
    },
    action: {
      initial: { opacity: 0, y: 10 },
      animate: { opacity: 1, y: 0 },
      transition: { delay: 0.5, duration: 0.3 },
    },
  };

  const EmptyStateContent = (
    <EmptyStateContainer
      sx={{ minHeight: containerHeight }}
      {...props}
    >
      {showIllustration && (
        <IllustrationContainer>
          {displayIcon}
        </IllustrationContainer>
      )}
      
      <ContentContainer>
        <motion.div {...animations.icon}>
          <IconContainer iconColor={displayColor}>
            {displayIcon}
          </IconContainer>
        </motion.div>

        <motion.div {...animations.content}>
          <Typography
            variant="h6"
            fontWeight="bold"
            color="text.primary"
            gutterBottom
          >
            {displayTitle}
          </Typography>
          
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, lineHeight: 1.6 }}
          >
            {displayDescription}
          </Typography>

          {children}
        </motion.div>

        {(action || actionText) && (
          <motion.div {...animations.action}>
            {action || (
              <ActionButton
                variant="contained"
                color="primary"
                onClick={onActionClick}
                startIcon={type === 'error' ? <RefreshIcon /> : <AddIcon />}
              >
                {actionText}
              </ActionButton>
            )}
          </motion.div>
        )}
      </ContentContainer>
    </EmptyStateContainer>
  );

  if (variant === 'card') {
    return (
      <motion.div {...animations.container}>
        <Card sx={{ border: 'none', boxShadow: 'none' }}>
          <CardContent sx={{ p: 0 }}>
            {EmptyStateContent}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div {...animations.container}>
      {EmptyStateContent}
    </motion.div>
  );
};

export default EmptyState; 