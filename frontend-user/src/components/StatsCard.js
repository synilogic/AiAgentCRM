import React from 'react';
import { Card, CardContent, Typography, Box, IconButton, LinearProgress, Chip } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Timeline } from '@mui/icons-material';

const StyledCard = styled(Card)(({ theme, gradient }) => ({
  background: gradient || theme.palette.background.paper,
  borderRadius: 16,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    background: gradient || theme.palette.primary.main,
    borderRadius: '16px 16px 0 0',
  },
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
  width: 56,
  height: 56,
  borderRadius: 14,
  background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.7)})`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'white',
  boxShadow: `0 4px 12px ${alpha(color, 0.3)}`,
  '& svg': {
    fontSize: 28,
  },
}));

const MetricValue = styled(Typography)(({ theme }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  fontFamily: "'Inter', sans-serif",
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  lineHeight: 1,
  marginBottom: theme.spacing(0.5),
}));

const TrendChip = styled(Chip)(({ theme, trend }) => ({
  fontWeight: 600,
  fontSize: '0.75rem',
  height: 24,
  borderRadius: 12,
  backgroundColor: trend === 'up' ? alpha(theme.palette.success.main, 0.1) :
                   trend === 'down' ? alpha(theme.palette.error.main, 0.1) :
                   alpha(theme.palette.info.main, 0.1),
  color: trend === 'up' ? theme.palette.success.main :
         trend === 'down' ? theme.palette.error.main :
         theme.palette.info.main,
  '& .MuiChip-icon': {
    fontSize: 16,
  },
}));

const ProgressBar = styled(LinearProgress)(({ theme, color }) => ({
  height: 6,
  borderRadius: 3,
  marginTop: theme.spacing(2),
  backgroundColor: alpha(color, 0.1),
  '& .MuiLinearProgress-bar': {
    backgroundColor: color,
    borderRadius: 3,
  },
}));

const StatsCard = ({ 
  title, 
  value, 
  icon, 
  color = '#3B82F6',
  trend,
  trendValue,
  subtitle,
  progress,
  progressMax = 100,
  gradient,
  loading = false,
  onClick,
  ...props 
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp />;
      case 'down':
        return <TrendingDown />;
      default:
        return <Timeline />;
    }
  };

  const formatValue = (val) => {
    if (typeof val === 'number') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
      return val.toLocaleString();
    }
    return val;
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <StyledCard gradient={gradient} onClick={onClick} sx={{ cursor: onClick ? 'pointer' : 'default' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                {title}
              </Typography>
              
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 80, height: 32, backgroundColor: 'grey.200', borderRadius: 1 }} />
                  <Box sx={{ width: 40, height: 20, backgroundColor: 'grey.200', borderRadius: 1 }} />
                </Box>
              ) : (
                <Box>
                  <MetricValue variant="h4">
                    {formatValue(value)}
                  </MetricValue>
                  
                  {subtitle && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      {subtitle}
                    </Typography>
                  )}
                  
                  {trend && trendValue && (
                    <TrendChip
                      icon={getTrendIcon()}
                      label={`${trendValue > 0 ? '+' : ''}${trendValue}%`}
                      trend={trend}
                      size="small"
                    />
                  )}
                </Box>
              )}
            </Box>
            
            <IconWrapper color={color}>
              {icon}
            </IconWrapper>
          </Box>
          
          {progress !== undefined && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Progress
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.round((progress / progressMax) * 100)}%
                </Typography>
              </Box>
              <ProgressBar
                variant="determinate"
                value={(progress / progressMax) * 100}
                color={color}
              />
            </Box>
          )}
        </CardContent>
      </StyledCard>
    </motion.div>
  );
};

export default StatsCard; 