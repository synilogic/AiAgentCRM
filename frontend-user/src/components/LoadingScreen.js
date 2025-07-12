import React from 'react';
import { Box, CircularProgress, Typography, Paper, LinearProgress } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { motion } from 'framer-motion';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const LoadingContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '60vh',
  padding: theme.spacing(4),
  position: 'relative',
}));

const LoadingCircle = styled(CircularProgress)(({ theme }) => ({
  animation: `${pulse} 2s ease-in-out infinite`,
  color: theme.palette.primary.main,
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: theme.spacing(3),
  '& img': {
    width: 64,
    height: 64,
    animation: `${pulse} 1.5s ease-in-out infinite`,
  },
}));

const LoadingText = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  marginTop: theme.spacing(2),
  textAlign: 'center',
  fontWeight: 500,
}));

const ProgressContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  maxWidth: 400,
  marginTop: theme.spacing(3),
}));

const SkeletonItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  borderRadius: 8,
  background: `linear-gradient(90deg, ${theme.palette.grey[200]} 25%, ${theme.palette.grey[100]} 50%, ${theme.palette.grey[200]} 75%)`,
  backgroundSize: '200% 100%',
  animation: 'shimmer 1.5s infinite',
  '@keyframes shimmer': {
    '0%': {
      backgroundPosition: '-200% 0',
    },
    '100%': {
      backgroundPosition: '200% 0',
    },
  },
}));

const LoadingScreen = ({ 
  message = 'Loading...', 
  type = 'spinner', 
  progress = null,
  showProgress = false,
  showSkeleton = false,
  fullScreen = false,
  size = 60,
  color = 'primary'
}) => {
  const containerProps = fullScreen ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 9999,
    minHeight: '100vh',
  } : {};

  if (showSkeleton) {
    return (
      <LoadingContainer sx={containerProps}>
        <Box sx={{ width: '100%', maxWidth: 800 }}>
          {Array.from({ length: 6 }, (_, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <SkeletonItem 
                elevation={0}
                sx={{ 
                  height: Math.random() * 60 + 40,
                  animationDelay: `${index * 0.1}s`
                }}
              />
            </motion.div>
          ))}
        </Box>
      </LoadingContainer>
    );
  }

  return (
    <LoadingContainer sx={containerProps}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <LogoContainer>
          {/* You can replace this with your app logo */}
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #3B82F6, #8B5CF6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem',
              fontWeight: 'bold',
            }}
          >
            CRM
          </Box>
        </LogoContainer>

        {type === 'spinner' && (
          <LoadingCircle
            size={size}
            color={color}
            thickness={4}
          />
        )}

        {type === 'dots' && (
          <Box sx={{ display: 'flex', gap: 1 }}>
            {Array.from({ length: 3 }, (_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.2,
                }}
              >
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: 'primary.main',
                  }}
                />
              </motion.div>
            ))}
          </Box>
        )}

        {type === 'pulse' && (
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Box
              sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
              }}
            >
              ⚡
            </Box>
          </motion.div>
        )}

        <LoadingText variant="body1">
          {message}
        </LoadingText>

        {(showProgress || progress !== null) && (
          <ProgressContainer>
            <LinearProgress
              variant={progress !== null ? 'determinate' : 'indeterminate'}
              value={progress || 0}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: 'grey.200',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                },
              }}
            />
            {progress !== null && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', mt: 1 }}
              >
                {Math.round(progress)}% Complete
              </Typography>
            )}
          </ProgressContainer>
        )}
      </motion.div>
    </LoadingContainer>
  );
};

export default LoadingScreen; 