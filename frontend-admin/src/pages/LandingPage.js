import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, Avatar, Chip, IconButton } from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import '../styles/LandingPage.css';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import AutomationIcon from '@mui/icons-material/Autorenew';
import SecurityIcon from '@mui/icons-material/Security';
import SpeedIcon from '@mui/icons-material/Speed';
import GroupIcon from '@mui/icons-material/Group';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Animations
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const gradient = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

// Styled Components
const HeroContainer = styled(Box)(({ theme }) => ({
  background: `linear-gradient(-45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main}, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
  backgroundSize: '400% 400%',
  animation: `${gradient} 15s ease infinite`,
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  color: 'white',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.3)',
    zIndex: 1,
  },
}));

const HeroContent = styled(Container)(({ theme }) => ({
  position: 'relative',
  zIndex: 2,
  textAlign: 'center',
  animation: `${fadeInUp} 1s ease-out`,
}));

const FeatureCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
  },
  animation: `${float} 6s ease-in-out infinite`,
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: 'white',
  textAlign: 'center',
  padding: theme.spacing(3),
  height: '100%',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const TestimonialCard = styled(Card)(({ theme }) => ({
  padding: theme.spacing(3),
  height: '100%',
  background: 'rgba(255,255,255,0.05)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255,255,255,0.1)',
}));

const PricingCard = styled(Card)(({ theme, featured }) => ({
  height: '100%',
  padding: theme.spacing(3),
  textAlign: 'center',
  position: 'relative',
  background: featured 
    ? `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`
    : 'rgba(255,255,255,0.05)',
  color: featured ? 'white' : 'inherit',
  border: featured ? 'none' : '1px solid rgba(255,255,255,0.1)',
  transform: featured ? 'scale(1.05)' : 'scale(1)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: featured ? 'scale(1.08)' : 'scale(1.03)',
  },
}));

const GlowingButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  color: 'white',
  padding: '12px 30px',
  fontSize: '1.1rem',
  fontWeight: 600,
  borderRadius: '50px',
  textTransform: 'none',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
  },
}));

const LandingPage = () => {
  const [animatedStats, setAnimatedStats] = useState({
    leads: 0,
    conversion: 0,
    automation: 0,
    satisfaction: 0,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedStats({
        leads: 50000,
        conversion: 95,
        automation: 80,
        satisfaction: 99,
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      icon: <AutoAwesomeIcon fontSize="large" />,
      title: "AI Lead Qualification",
      description: "Automatically qualify and score leads using advanced AI algorithms to focus on high-converting prospects.",
    },
    {
      icon: <TrendingUpIcon fontSize="large" />,
      title: "Automated Lead Nurturing",
      description: "Set up intelligent workflows that nurture leads through personalized communication sequences.",
    },
    {
      icon: <WhatsAppIcon fontSize="large" />,
      title: "WhatsApp CRM Integration",
      description: "Seamlessly manage customer conversations and automate responses through WhatsApp Business API.",
    },
    {
      icon: <AnalyticsIcon fontSize="large" />,
      title: "Advanced Analytics",
      description: "Get deep insights into your sales funnel with AI-powered analytics and predictive forecasting.",
    },
    {
      icon: <AutomationIcon fontSize="large" />,
      title: "Workflow Automation",
      description: "Create sophisticated automation workflows that handle repetitive tasks and optimize conversions.",
    },
    {
      icon: <SecurityIcon fontSize="large" />,
      title: "Enterprise Security",
      description: "Bank-grade security with end-to-end encryption and compliance with global data protection standards.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      company: "TechStart Inc.",
      rating: 5,
      text: "AIAgentCRM transformed our sales process. We've seen a 300% increase in qualified leads and our conversion rates have never been better.",
      avatar: "/api/placeholder/60/60",
    },
    {
      name: "Michael Chen",
      company: "Growth Labs",
      rating: 5,
      text: "The AI automation features saved us 20 hours per week. Our team can now focus on closing deals instead of manual lead management.",
      avatar: "/api/placeholder/60/60",
    },
    {
      name: "Emily Rodriguez",
      company: "Scale Ventures",
      rating: 5,
      text: "Best CRM investment we've made. The WhatsApp integration alone has improved our customer engagement by 400%.",
      avatar: "/api/placeholder/60/60",
    },
  ];

  const plans = [
    {
      name: "Starter",
      price: "₹499",
      period: "/month",
      features: ["Up to 1,000 leads", "Basic AI qualification", "Email automation", "Standard support"],
      featured: false,
    },
    {
      name: "Professional",
      price: "₹999",
      period: "/month",
      features: ["Up to 10,000 leads", "Advanced AI features", "WhatsApp integration", "Workflow automation", "Priority support"],
      featured: true,
    },
    {
      name: "Enterprise",
      price: "₹2,499",
      period: "/month",
      features: ["Unlimited leads", "Custom AI models", "Full API access", "Dedicated account manager", "24/7 support"],
      featured: false,
    },
  ];

  return (
    <Box>
      {/* Hero Section */}
      <HeroContainer>
        <HeroContent maxWidth="lg">
          <Typography variant="h1" component="h1" gutterBottom sx={{ mb: 3, fontWeight: 700, fontSize: { xs: '2.5rem', md: '4rem' } }}>
            The AI-Powered CRM Revolution
          </Typography>
          <Typography variant="h5" component="p" gutterBottom sx={{ mb: 4, opacity: 0.9, maxWidth: '800px', margin: '0 auto 2rem' }}>
            Transform your sales process with intelligent automation, AI-driven lead qualification, and seamless WhatsApp integration that converts more prospects into customers.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <GlowingButton size="large" endIcon={<ArrowForwardIcon />}>
              Start Free Trial
            </GlowingButton>
            <Button 
              variant="outlined" 
              size="large" 
              sx={{ 
                color: 'white', 
                borderColor: 'white', 
                '&:hover': { 
                  borderColor: 'white', 
                  backgroundColor: 'rgba(255,255,255,0.1)' 
                } 
              }}
            >
              Watch Demo
            </Button>
          </Box>
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap' }}>
            <Chip icon={<CheckCircleIcon />} label="14-day free trial" sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <Chip icon={<CheckCircleIcon />} label="No credit card required" sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <Chip icon={<CheckCircleIcon />} label="Setup in 5 minutes" sx={{ color: 'white', backgroundColor: 'rgba(255,255,255,0.2)' }} />
          </Box>
        </HeroContent>
      </HeroContainer>

      {/* Stats Section */}
      <Box sx={{ py: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                  {animatedStats.leads.toLocaleString()}+
                </Typography>
                <Typography variant="h6">Leads Managed</Typography>
              </StatsCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                  {animatedStats.conversion}%
                </Typography>
                <Typography variant="h6">Conversion Rate</Typography>
              </StatsCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                  {animatedStats.automation}%
                </Typography>
                <Typography variant="h6">Time Saved</Typography>
              </StatsCard>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatsCard>
                <Typography variant="h3" component="div" sx={{ fontWeight: 700, mb: 1 }}>
                  {animatedStats.satisfaction}%
                </Typography>
                <Typography variant="h6">Customer Satisfaction</Typography>
              </StatsCard>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 8, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h2" gutterBottom align="center" sx={{ mb: 6, color: 'white', fontWeight: 700 }}>
            Powerful AI Features for Modern Sales Teams
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <FeatureCard>
                  <CardContent sx={{ p: 3, color: 'white' }}>
                    <Box sx={{ mb: 2, color: 'white' }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600, color: 'white' }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </FeatureCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Testimonials Section */}
      <Box sx={{ py: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h2" gutterBottom align="center" sx={{ mb: 6, color: 'white', fontWeight: 700 }}>
            Trusted by Growing Companies
          </Typography>
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <TestimonialCard>
                  <Box sx={{ display: 'flex', mb: 2 }}>
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} sx={{ color: '#ffd700' }} />
                    ))}
                  </Box>
                  <Typography variant="body1" gutterBottom sx={{ mb: 3, color: 'white', fontStyle: 'italic' }}>
                    "{testimonial.text}"
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar src={testimonial.avatar} sx={{ mr: 2 }} />
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'white' }}>
                        {testimonial.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {testimonial.company}
                      </Typography>
                    </Box>
                  </Box>
                </TestimonialCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Pricing Section */}
      <Box sx={{ py: 8, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h2" gutterBottom align="center" sx={{ mb: 6, color: 'white', fontWeight: 700 }}>
            Choose Your Plan
          </Typography>
          <Grid container spacing={4}>
            {plans.map((plan, index) => (
              <Grid item xs={12} md={4} key={index}>
                <PricingCard featured={plan.featured}>
                  {plan.featured && (
                    <Chip 
                      label="Most Popular" 
                      sx={{ 
                        position: 'absolute', 
                        top: -10, 
                        left: '50%', 
                        transform: 'translateX(-50%)',
                        backgroundColor: '#ffd700',
                        color: '#000',
                        fontWeight: 600
                      }} 
                    />
                  )}
                  <Typography variant="h4" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
                    {plan.name}
                  </Typography>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h3" component="span" sx={{ fontWeight: 700 }}>
                      {plan.price}
                    </Typography>
                    <Typography variant="h6" component="span">
                      {plan.period}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 4 }}>
                    {plan.features.map((feature, featureIndex) => (
                      <Box key={featureIndex} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <CheckCircleIcon sx={{ mr: 1, fontSize: '1rem' }} />
                        <Typography variant="body2">{feature}</Typography>
                      </Box>
                    ))}
                  </Box>
                  <Button 
                    variant={plan.featured ? "outlined" : "contained"} 
                    fullWidth 
                    size="large"
                    sx={{ 
                      mt: 'auto',
                      borderColor: plan.featured ? 'white' : 'primary.main',
                      color: plan.featured ? 'white' : 'primary.main',
                      '&:hover': {
                        backgroundColor: plan.featured ? 'rgba(255,255,255,0.1)' : 'primary.dark'
                      }
                    }}
                  >
                    Get Started
                  </Button>
                </PricingCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box sx={{ py: 8, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h2" component="h2" gutterBottom sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
            Ready to Transform Your Sales Process?
          </Typography>
          <Typography variant="h5" component="p" gutterBottom sx={{ color: 'rgba(255,255,255,0.9)', mb: 4 }}>
            Join thousands of sales teams who are already using AI to close more deals faster.
          </Typography>
          <GlowingButton size="large" endIcon={<ArrowForwardIcon />}>
            Start Your Free Trial Now
          </GlowingButton>
        </Container>
      </Box>
    </Box>
  );
};

export default LandingPage; 