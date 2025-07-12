const openaiService = require('./openai');

class LeadScoringService {
  constructor() {
    this.scoringFactors = {
      engagement: {
        weight: 0.25,
        factors: {
          messageFrequency: { weight: 0.4, maxScore: 20 },
          responseTime: { weight: 0.3, maxScore: 15 },
          messageLength: { weight: 0.2, maxScore: 10 },
          interactionQuality: { weight: 0.1, maxScore: 5 }
        }
      },
      intent: {
        weight: 0.30,
        factors: {
          purchaseIntent: { weight: 0.5, maxScore: 30 },
          urgency: { weight: 0.3, maxScore: 18 },
          budget: { weight: 0.2, maxScore: 12 }
        }
      },
      profile: {
        weight: 0.20,
        factors: {
          companySize: { weight: 0.4, maxScore: 16 },
          industry: { weight: 0.3, maxScore: 12 },
          location: { weight: 0.2, maxScore: 8 },
          contactInfo: { weight: 0.1, maxScore: 4 }
        }
      },
      behavior: {
        weight: 0.15,
        factors: {
          websiteVisits: { weight: 0.4, maxScore: 12 },
          emailOpens: { weight: 0.3, maxScore: 9 },
          linkClicks: { weight: 0.2, maxScore: 6 },
          timeSpent: { weight: 0.1, maxScore: 3 }
        }
      },
      social: {
        weight: 0.10,
        factors: {
          socialPresence: { weight: 0.5, maxScore: 10 },
          influence: { weight: 0.3, maxScore: 6 },
          networkSize: { weight: 0.2, maxScore: 4 }
        }
      }
    };
  }

  // Calculate comprehensive lead score
  async calculateLeadScore(leadData) {
    try {
      const scores = {
        engagement: await this.calculateEngagementScore(leadData),
        intent: await this.calculateIntentScore(leadData),
        profile: await this.calculateProfileScore(leadData),
        behavior: await this.calculateBehaviorScore(leadData),
        social: await this.calculateSocialScore(leadData)
      };

      // Calculate weighted total score
      let totalScore = 0;
      let totalWeight = 0;

      for (const [category, score] of Object.entries(scores)) {
        const weight = this.scoringFactors[category].weight;
        totalScore += score * weight;
        totalWeight += weight;
      }

      const finalScore = Math.round(totalScore / totalWeight);

      // Determine lead grade
      const grade = this.getLeadGrade(finalScore);

      // Generate AI insights
      const insights = await this.generateAIInsights(leadData, scores, finalScore);

      return {
        success: true,
        score: finalScore,
        grade: grade,
        breakdown: scores,
        insights: insights,
        recommendations: this.getRecommendations(grade, scores)
      };
    } catch (error) {
      console.error('Lead scoring error:', error);
      return {
        success: false,
        error: error.message,
        score: 50,
        grade: 'C'
      };
    }
  }

  // Calculate engagement score
  async calculateEngagementScore(leadData) {
    const factors = this.scoringFactors.engagement.factors;
    let score = 0;

    // Message frequency score
    const messageCount = leadData.messages?.length || 0;
    const messageFrequencyScore = Math.min(messageCount * 2, factors.messageFrequency.maxScore);
    score += messageFrequencyScore * factors.messageFrequency.weight;

    // Response time score
    const avgResponseTime = leadData.avgResponseTime || 24; // hours
    const responseTimeScore = Math.max(0, factors.responseTime.maxScore - (avgResponseTime / 2));
    score += responseTimeScore * factors.responseTime.weight;

    // Message length score
    const avgMessageLength = leadData.avgMessageLength || 50; // characters
    const messageLengthScore = Math.min(avgMessageLength / 10, factors.messageLength.maxScore);
    score += messageLengthScore * factors.messageLength.weight;

    // Interaction quality score
    const qualityScore = leadData.interactionQuality || 3; // 1-5 scale
    const interactionScore = (qualityScore / 5) * factors.interactionQuality.maxScore;
    score += interactionScore * factors.interactionQuality.weight;

    return Math.round(score);
  }

  // Calculate intent score
  async calculateIntentScore(leadData) {
    const factors = this.scoringFactors.intent.factors;
    let score = 0;

    // Purchase intent score
    const intentKeywords = ['buy', 'purchase', 'price', 'cost', 'quote', 'order'];
    const messageContent = (leadData.messages || []).map(m => m.body).join(' ').toLowerCase();
    const intentMatches = intentKeywords.filter(keyword => messageContent.includes(keyword)).length;
    const purchaseIntentScore = Math.min(intentMatches * 6, factors.purchaseIntent.maxScore);
    score += purchaseIntentScore * factors.purchaseIntent.weight;

    // Urgency score
    const urgencyKeywords = ['urgent', 'asap', 'immediately', 'today', 'now'];
    const urgencyMatches = urgencyKeywords.filter(keyword => messageContent.includes(keyword)).length;
    const urgencyScore = Math.min(urgencyMatches * 6, factors.urgency.maxScore);
    score += urgencyScore * factors.urgency.weight;

    // Budget score
    const budgetIndicators = leadData.budget || 'medium';
    const budgetScores = { high: 12, medium: 8, low: 4 };
    const budgetScore = budgetScores[budgetIndicators] || 8;
    score += budgetScore * factors.budget.weight;

    return Math.round(score);
  }

  // Calculate profile score
  async calculateProfileScore(leadData) {
    const factors = this.scoringFactors.profile.factors;
    let score = 0;

    // Company size score
    const companySize = leadData.companySize || 'small';
    const sizeScores = { enterprise: 16, large: 12, medium: 8, small: 4 };
    const companySizeScore = sizeScores[companySize] || 4;
    score += companySizeScore * factors.companySize.weight;

    // Industry score
    const industry = leadData.industry || 'other';
    const industryScores = { technology: 12, finance: 10, healthcare: 10, retail: 8, manufacturing: 8, other: 4 };
    const industryScore = industryScores[industry] || 4;
    score += industryScore * factors.industry.weight;

    // Location score
    const location = leadData.location || 'unknown';
    const locationScores = { tier1: 8, tier2: 6, tier3: 4, international: 6, unknown: 2 };
    const locationScore = locationScores[location] || 2;
    score += locationScore * factors.location.weight;

    // Contact info score
    const contactInfo = leadData.contactInfo || {};
    const hasEmail = contactInfo.email ? 2 : 0;
    const hasPhone = contactInfo.phone ? 2 : 0;
    const contactScore = hasEmail + hasPhone;
    score += contactScore * factors.contactInfo.weight;

    return Math.round(score);
  }

  // Calculate behavior score
  async calculateBehaviorScore(leadData) {
    const factors = this.scoringFactors.behavior.factors;
    let score = 0;

    // Website visits score
    const websiteVisits = leadData.websiteVisits || 0;
    const visitsScore = Math.min(websiteVisits * 2, factors.websiteVisits.maxScore);
    score += visitsScore * factors.websiteVisits.weight;

    // Email opens score
    const emailOpens = leadData.emailOpens || 0;
    const opensScore = Math.min(emailOpens * 1.5, factors.emailOpens.maxScore);
    score += opensScore * factors.emailOpens.weight;

    // Link clicks score
    const linkClicks = leadData.linkClicks || 0;
    const clicksScore = Math.min(linkClicks * 2, factors.linkClicks.maxScore);
    score += clicksScore * factors.linkClicks.weight;

    // Time spent score
    const timeSpent = leadData.timeSpent || 0; // minutes
    const timeScore = Math.min(timeSpent / 5, factors.timeSpent.maxScore);
    score += timeScore * factors.timeSpent.weight;

    return Math.round(score);
  }

  // Calculate social score
  async calculateSocialScore(leadData) {
    const factors = this.scoringFactors.social.factors;
    let score = 0;

    // Social presence score
    const socialProfiles = leadData.socialProfiles || [];
    const presenceScore = Math.min(socialProfiles.length * 2, factors.socialPresence.maxScore);
    score += presenceScore * factors.socialPresence.weight;

    // Influence score
    const influence = leadData.influence || 'low';
    const influenceScores = { high: 6, medium: 4, low: 2 };
    const influenceScore = influenceScores[influence] || 2;
    score += influenceScore * factors.influence.weight;

    // Network size score
    const networkSize = leadData.networkSize || 0;
    const networkScore = Math.min(networkSize / 100, factors.networkSize.maxScore);
    score += networkScore * factors.networkSize.weight;

    return Math.round(score);
  }

  // Get lead grade based on score
  getLeadGrade(score) {
    if (score >= 85) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 75) return 'A-';
    if (score >= 70) return 'B+';
    if (score >= 65) return 'B';
    if (score >= 60) return 'B-';
    if (score >= 55) return 'C+';
    if (score >= 50) return 'C';
    if (score >= 45) return 'C-';
    if (score >= 40) return 'D+';
    if (score >= 35) return 'D';
    return 'F';
  }

  // Generate AI insights for the lead
  async generateAIInsights(leadData, scores, totalScore) {
    try {
      const context = `
        Lead Analysis:
        - Total Score: ${totalScore}/100
        - Engagement Score: ${scores.engagement}/50
        - Intent Score: ${scores.intent}/60
        - Profile Score: ${scores.profile}/40
        - Behavior Score: ${scores.behavior}/30
        - Social Score: ${scores.social}/20
        
        Lead Data:
        - Messages: ${leadData.messages?.length || 0}
        - Company: ${leadData.company || 'Unknown'}
        - Industry: ${leadData.industry || 'Unknown'}
        - Location: ${leadData.location || 'Unknown'}
        
        Provide insights in JSON format:
        - strengths (array): Key strengths of this lead
        - weaknesses (array): Areas of concern
        - opportunities (array): Potential opportunities
        - threats (array): Potential risks
        - next_steps (array): Recommended next actions
      `;

      const result = await openaiService.generateResponse(context, {}, { tone: 'analytical' });
      
      if (result.success) {
        try {
          return JSON.parse(result.response);
        } catch (parseError) {
          return this.getDefaultInsights(totalScore);
        }
      } else {
        return this.getDefaultInsights(totalScore);
      }
    } catch (error) {
      console.error('AI insights generation error:', error);
      return this.getDefaultInsights(totalScore);
    }
  }

  // Get default insights
  getDefaultInsights(score) {
    if (score >= 80) {
      return {
        strengths: ['High engagement level', 'Strong purchase intent', 'Good company profile'],
        weaknesses: [],
        opportunities: ['High conversion potential', 'Quick sales cycle'],
        threats: ['Competition from other vendors'],
        next_steps: ['Immediate follow-up', 'Proposal preparation', 'Schedule demo']
      };
    } else if (score >= 60) {
      return {
        strengths: ['Moderate engagement', 'Some purchase intent'],
        weaknesses: ['Limited contact information', 'Unclear timeline'],
        opportunities: ['Nurturing potential', 'Relationship building'],
        threats: ['Long sales cycle', 'Price sensitivity'],
        next_steps: ['Regular follow-up', 'Value proposition', 'Educational content']
      };
    } else {
      return {
        strengths: ['Initial interest shown'],
        weaknesses: ['Low engagement', 'Unclear intent', 'Limited profile'],
        opportunities: ['Lead nurturing', 'Education'],
        threats: ['High churn risk', 'Low conversion'],
        next_steps: ['Gentle nurturing', 'Educational content', 'Long-term relationship']
      };
    }
  }

  // Get recommendations based on score and breakdown
  getRecommendations(grade, scores) {
    const recommendations = [];

    if (grade === 'A' || grade === 'A+') {
      recommendations.push(
        'Immediate high-priority follow-up',
        'Prepare detailed proposal',
        'Schedule executive demo',
        'Involve senior sales team'
      );
    } else if (grade === 'B') {
      recommendations.push(
        'Regular follow-up schedule',
        'Provide case studies',
        'Offer free trial or demo',
        'Build relationship'
      );
    } else if (grade === 'C') {
      recommendations.push(
        'Nurturing campaign',
        'Educational content',
        'Regular check-ins',
        'Value proposition focus'
      );
    } else {
      recommendations.push(
        'Long-term nurturing',
        'Educational content',
        'Minimal resource allocation',
        'Monitor for improvement'
      );
    }

    // Add specific recommendations based on low scores
    if (scores.engagement < 25) {
      recommendations.push('Increase engagement through personalized content');
    }
    if (scores.intent < 30) {
      recommendations.push('Clarify purchase intent through discovery calls');
    }
    if (scores.profile < 20) {
      recommendations.push('Gather more profile information');
    }

    return recommendations;
  }

  // Update lead score based on new activity
  async updateLeadScore(leadId, newActivity) {
    try {
      // This would typically fetch current lead data and update it
      // For now, return a placeholder
      return {
        success: true,
        message: 'Lead score updated',
        newScore: 75
      };
    } catch (error) {
      console.error('Lead score update error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get scoring statistics
  getScoringStats(leads) {
    const scores = leads.map(lead => lead.score || 0);
    const grades = leads.map(lead => lead.grade || 'C');

    return {
      averageScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      scoreDistribution: {
        'A+': grades.filter(g => g === 'A+').length,
        'A': grades.filter(g => g === 'A').length,
        'B': grades.filter(g => g.startsWith('B')).length,
        'C': grades.filter(g => g.startsWith('C')).length,
        'D': grades.filter(g => g.startsWith('D')).length,
        'F': grades.filter(g => g === 'F').length
      },
      topScorers: leads.filter(lead => (lead.score || 0) >= 80).length,
      conversionRate: this.calculateConversionRate(leads)
    };
  }

  // Calculate conversion rate
  calculateConversionRate(leads) {
    const converted = leads.filter(lead => lead.status === 'converted').length;
    const total = leads.length;
    return total > 0 ? Math.round((converted / total) * 100) : 0;
  }
}

module.exports = new LeadScoringService(); 