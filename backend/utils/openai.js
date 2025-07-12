const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Generate AI response for customer messages
  async generateResponse(message, context = {}, userSettings = {}) {
    try {
      const systemPrompt = this.buildSystemPrompt(context, userSettings);
      
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return {
        success: true,
        response: completion.choices[0].message.content,
        usage: completion.usage
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return {
        success: false,
        error: error.message,
        fallback: this.getFallbackResponse(message)
      };
    }
  }

  // Build system prompt based on context and user settings
  buildSystemPrompt(context, userSettings) {
    let prompt = `You are a professional customer service representative for ${context.businessName || 'our business'}. `;
    
    if (context.businessType) {
      prompt += `We are in the ${context.businessType} industry. `;
    }
    
    if (userSettings.tone) {
      prompt += `Maintain a ${userSettings.tone} tone in your responses. `;
    }
    
    if (context.productInfo) {
      prompt += `Product information: ${context.productInfo}. `;
    }
    
    if (context.pricing) {
      prompt += `Pricing information: ${context.pricing}. `;
    }
    
    prompt += `
    Guidelines:
    - Be helpful, professional, and friendly
    - Keep responses concise but informative
    - Ask clarifying questions when needed
    - Provide relevant information about our products/services
    - If you don't know something, offer to connect them with a human representative
    - Always end with a call to action or next step
    `;

    return prompt;
  }

  // Analyze lead quality and score
  async analyzeLead(message, contactInfo = {}) {
    try {
      const analysisPrompt = `
        Analyze this customer message and contact information to determine lead quality and score.
        
        Message: "${message}"
        Contact Info: ${JSON.stringify(contactInfo)}
        
        Provide analysis in JSON format with the following fields:
        - score (1-100): Overall lead quality score
        - intent (string): Customer's primary intent (inquiry, complaint, purchase, etc.)
        - urgency (high/medium/low): How urgent is their need
        - budget (high/medium/low): Likely budget level
        - timeline (immediate/soon/later): When they might make a decision
        - keywords (array): Key terms that indicate their needs
        - sentiment (positive/neutral/negative): Overall sentiment
        - recommended_action (string): What action should be taken
        - followup_priority (high/medium/low): How quickly to follow up
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a lead analysis expert. Provide analysis in valid JSON format only."
          },
          {
            role: "user",
            content: analysisPrompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      const analysis = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        analysis,
        usage: completion.usage
      };
    } catch (error) {
      console.error('Lead analysis error:', error);
      return {
        success: false,
        error: error.message,
        analysis: this.getDefaultAnalysis()
      };
    }
  }

  // Generate follow-up message suggestions
  async generateFollowupSuggestions(leadData, previousMessages = []) {
    try {
      const context = `
        Lead Information:
        - Score: ${leadData.score}/100
        - Intent: ${leadData.intent}
        - Urgency: ${leadData.urgency}
        - Previous messages: ${previousMessages.map(m => m.body).join(' | ')}
        
        Generate 3 different follow-up message suggestions:
        1. A gentle reminder/check-in
        2. A value-add message with relevant information
        3. A direct call-to-action message
        
        Provide in JSON format with "type" and "message" for each suggestion.
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a follow-up message expert. Provide suggestions in valid JSON format."
          },
          {
            role: "user",
            content: context
          }
        ],
        max_tokens: 600,
        temperature: 0.7
      });

      const suggestions = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        suggestions,
        usage: completion.usage
      };
    } catch (error) {
      console.error('Follow-up suggestions error:', error);
      return {
        success: false,
        error: error.message,
        suggestions: this.getDefaultFollowupSuggestions()
      };
    }
  }

  // Extract contact information from messages
  async extractContactInfo(message) {
    try {
      const extractionPrompt = `
        Extract contact information from this message:
        "${message}"
        
        Look for:
        - Phone numbers
        - Email addresses
        - Names
        - Company names
        - Addresses
        
        Return in JSON format with fields: phone, email, name, company, address
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a contact information extraction expert. Return only valid JSON."
          },
          {
            role: "user",
            content: extractionPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.1
      });

      const contactInfo = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        contactInfo,
        usage: completion.usage
      };
    } catch (error) {
      console.error('Contact extraction error:', error);
      return {
        success: false,
        error: error.message,
        contactInfo: {}
      };
    }
  }

  // Generate email subject lines
  async generateEmailSubject(content, tone = 'professional') {
    try {
      const subjectPrompt = `
        Generate 5 email subject lines for this content:
        "${content}"
        
        Tone: ${tone}
        Make them engaging, clear, and relevant.
        
        Return as JSON array of strings.
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an email subject line expert. Return only valid JSON array."
          },
          {
            role: "user",
            content: subjectPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8
      });

      const subjects = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        subjects,
        usage: completion.usage
      };
    } catch (error) {
      console.error('Subject generation error:', error);
      return {
        success: false,
        error: error.message,
        subjects: ['Follow up on your inquiry', 'Important information for you']
      };
    }
  }

  // Analyze conversation sentiment
  async analyzeSentiment(messages) {
    try {
      const sentimentPrompt = `
        Analyze the sentiment of this conversation:
        ${messages.map(m => `${m.sender}: ${m.body}`).join('\n')}
        
        Provide analysis in JSON format:
        - overall_sentiment (positive/neutral/negative)
        - confidence (0-1)
        - key_emotions (array)
        - sentiment_trend (improving/stable/declining)
        - recommendations (array of suggestions)
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a sentiment analysis expert. Return only valid JSON."
          },
          {
            role: "user",
            content: sentimentPrompt
          }
        ],
        max_tokens: 400,
        temperature: 0.3
      });

      const sentiment = JSON.parse(completion.choices[0].message.content);
      
      return {
        success: true,
        sentiment,
        usage: completion.usage
      };
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        success: false,
        error: error.message,
        sentiment: {
          overall_sentiment: 'neutral',
          confidence: 0.5,
          key_emotions: [],
          sentiment_trend: 'stable',
          recommendations: []
        }
      };
    }
  }

  // Get fallback response when API fails
  getFallbackResponse(message) {
    const fallbacks = [
      "Thank you for your message. We'll get back to you shortly.",
      "Thanks for reaching out! Our team will respond soon.",
      "We've received your message and will reply as soon as possible.",
      "Thank you for contacting us. We'll be in touch shortly."
    ];
    
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  // Get default lead analysis
  getDefaultAnalysis() {
    return {
      score: 50,
      intent: 'inquiry',
      urgency: 'medium',
      budget: 'medium',
      timeline: 'later',
      keywords: [],
      sentiment: 'neutral',
      recommended_action: 'Follow up within 24 hours',
      followup_priority: 'medium'
    };
  }

  // Get default follow-up suggestions
  getDefaultFollowupSuggestions() {
    return [
      {
        type: 'reminder',
        message: 'Hi! Just following up on your inquiry. How can we help you today?'
      },
      {
        type: 'value_add',
        message: 'I thought you might find this information helpful regarding your inquiry...'
      },
      {
        type: 'call_to_action',
        message: 'Would you like to schedule a call to discuss this further?'
      }
    ];
  }

  // Check API key validity
  async validateAPIKey() {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 5
      });
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Get usage statistics
  async getUsageStats() {
    try {
      // Note: OpenAI doesn't provide usage stats via API
      // This would need to be tracked manually
      return {
        success: true,
        message: 'Usage tracking not available via OpenAI API'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new OpenAIService(); 