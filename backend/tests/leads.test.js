const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const { setupTestDB, clearTestDB, createTestUser, createTestLead, generateAuthToken } = require('./testUtils');

describe('Lead Management Endpoints', () => {
  let token;
  let user;

  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(async () => {
    await clearTestDB();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    user = await createTestUser();
    token = await generateAuthToken(user);
  });

  describe('POST /api/leads', () => {
    it('should create a new lead', async () => {
      const leadData = {
        name: 'John Doe',
        phone: '+919876543210',
        email: 'john@example.com',
        source: 'WhatsApp',
        status: 'New',
        tags: ['hot', 'interested'],
        notes: 'Interested in premium plan'
      };

      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send(leadData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.lead).toHaveProperty('_id');
      expect(response.body.lead.name).toBe(leadData.name);
      expect(response.body.lead.phone).toBe(leadData.phone);
      expect(response.body.lead.user).toBe(user._id.toString());
      expect(response.body.lead.score).toBeDefined();
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should validate phone number format', async () => {
      const leadData = {
        name: 'John Doe',
        phone: 'invalid-phone',
        email: 'john@example.com'
      };

      const response = await request(app)
        .post('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .send(leadData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should not create lead without authentication', async () => {
      const leadData = {
        name: 'John Doe',
        phone: '+919876543210',
        email: 'john@example.com'
      };

      const response = await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/leads', () => {
    beforeEach(async () => {
      // Create multiple test leads
      await createTestLead({ name: 'Lead 1', status: 'New' }, user._id);
      await createTestLead({ name: 'Lead 2', status: 'Contacted' }, user._id);
      await createTestLead({ name: 'Lead 3', status: 'Qualified' }, user._id);
    });

    it('should get all leads for user', async () => {
      const response = await request(app)
        .get('/api/leads')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.leads).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter leads by status', async () => {
      const response = await request(app)
        .get('/api/leads?status=New')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.leads).toHaveLength(1);
      expect(response.body.leads[0].status).toBe('New');
    });

    it('should filter leads by source', async () => {
      const response = await request(app)
        .get('/api/leads?source=WhatsApp')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.leads.length).toBeGreaterThan(0);
    });

    it('should search leads by name', async () => {
      const response = await request(app)
        .get('/api/leads?search=Lead 1')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.leads).toHaveLength(1);
      expect(response.body.leads[0].name).toBe('Lead 1');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/leads?page=1&limit=2')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.leads).toHaveLength(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(2);
    });

    it('should sort leads by score', async () => {
      const response = await request(app)
        .get('/api/leads?sortBy=score&sortOrder=desc')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.leads.length).toBeGreaterThan(1);
    });
  });

  describe('GET /api/leads/:id', () => {
    let lead;

    beforeEach(async () => {
      lead = await createTestLead({}, user._id);
    });

    it('should get lead by id', async () => {
      const response = await request(app)
        .get(`/api/leads/${lead._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.lead._id).toBe(lead._id.toString());
      expect(response.body.lead.name).toBe(lead.name);
    });

    it('should not get lead from different user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const otherLead = await createTestLead({}, otherUser._id);

      const response = await request(app)
        .get(`/api/leads/${otherLead._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent lead', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/leads/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/leads/:id', () => {
    let lead;

    beforeEach(async () => {
      lead = await createTestLead({}, user._id);
    });

    it('should update lead', async () => {
      const updateData = {
        name: 'Updated Name',
        status: 'Qualified',
        tags: ['updated', 'hot'],
        notes: 'Updated notes'
      };

      const response = await request(app)
        .put(`/api/leads/${lead._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.lead.name).toBe(updateData.name);
      expect(response.body.lead.status).toBe(updateData.status);
      expect(response.body.lead.tags).toEqual(updateData.tags);
      expect(response.body.lead.notes).toBe(updateData.notes);
    });

    it('should not update lead from different user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const otherLead = await createTestLead({}, otherUser._id);

      const response = await request(app)
        .put(`/api/leads/${otherLead._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/leads/${lead._id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: 'invalid-phone' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('DELETE /api/leads/:id', () => {
    let lead;

    beforeEach(async () => {
      lead = await createTestLead({}, user._id);
    });

    it('should delete lead', async () => {
      const response = await request(app)
        .delete(`/api/leads/${lead._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Lead deleted successfully');
    });

    it('should not delete lead from different user', async () => {
      const otherUser = await createTestUser({ email: 'other@example.com' });
      const otherLead = await createTestLead({}, otherUser._id);

      const response = await request(app)
        .delete(`/api/leads/${otherLead._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/leads/:id/score', () => {
    let lead;

    beforeEach(async () => {
      lead = await createTestLead({}, user._id);
    });

    it('should update lead score', async () => {
      const scoreData = {
        score: 85,
        factors: {
          engagement: 20,
          budget: 25,
          timeline: 20,
          authority: 20
        }
      };

      const response = await request(app)
        .post(`/api/leads/${lead._id}/score`)
        .set('Authorization', `Bearer ${token}`)
        .send(scoreData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.lead.score).toBe(scoreData.score);
      expect(response.body.lead.scoreFactors).toEqual(scoreData.factors);
    });

    it('should validate score range', async () => {
      const response = await request(app)
        .post(`/api/leads/${lead._id}/score`)
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 150 })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('POST /api/leads/analyze', () => {
    it('should analyze lead conversation', async () => {
      const analysisData = {
        conversation: [
          { role: 'user', content: 'Hi, I need help with your services' },
          { role: 'assistant', content: 'Hello! I\'d be happy to help. What specific services are you interested in?' },
          { role: 'user', content: 'I\'m looking for a CRM solution for my business' }
        ]
      };

      const response = await request(app)
        .post('/api/leads/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send(analysisData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analysis).toBeDefined();
      expect(response.body.analysis.intent).toBeDefined();
      expect(response.body.analysis.sentiment).toBeDefined();
      expect(response.body.analysis.entities).toBeDefined();
    });

    it('should validate conversation format', async () => {
      const response = await request(app)
        .post('/api/leads/analyze')
        .set('Authorization', `Bearer ${token}`)
        .send({ conversation: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('GET /api/leads/analytics', () => {
    beforeEach(async () => {
      // Create leads with different statuses and sources
      await createTestLead({ status: 'New', source: 'WhatsApp' }, user._id);
      await createTestLead({ status: 'Contacted', source: 'WhatsApp' }, user._id);
      await createTestLead({ status: 'Qualified', source: 'Facebook' }, user._id);
      await createTestLead({ status: 'Converted', source: 'Google Sheets' }, user._id);
    });

    it('should get lead analytics', async () => {
      const response = await request(app)
        .get('/api/leads/analytics')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
      expect(response.body.analytics.totalLeads).toBe(4);
      expect(response.body.analytics.byStatus).toBeDefined();
      expect(response.body.analytics.bySource).toBeDefined();
      expect(response.body.analytics.conversionRate).toBeDefined();
    });

    it('should filter analytics by date range', async () => {
      const response = await request(app)
        .get('/api/leads/analytics?startDate=2024-01-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.analytics).toBeDefined();
    });
  });

  describe('POST /api/leads/bulk', () => {
    it('should create multiple leads', async () => {
      const leadsData = [
        {
          name: 'Lead 1',
          phone: '+919876543211',
          email: 'lead1@example.com',
          source: 'Facebook'
        },
        {
          name: 'Lead 2',
          phone: '+919876543212',
          email: 'lead2@example.com',
          source: 'Google Sheets'
        }
      ];

      const response = await request(app)
        .post('/api/leads/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({ leads: leadsData })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.leads).toHaveLength(2);
      expect(response.body.created).toBe(2);
      expect(response.body.errors).toHaveLength(0);
    });

    it('should handle partial failures', async () => {
      const leadsData = [
        {
          name: 'Valid Lead',
          phone: '+919876543211',
          email: 'valid@example.com'
        },
        {
          name: 'Invalid Lead',
          phone: 'invalid-phone',
          email: 'invalid@example.com'
        }
      ];

      const response = await request(app)
        .post('/api/leads/bulk')
        .set('Authorization', `Bearer ${token}`)
        .send({ leads: leadsData })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.created).toBe(1);
      expect(response.body.errors).toHaveLength(1);
    });
  });
}); 