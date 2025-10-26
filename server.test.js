const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('./server'); // Export app from server.js
const User = require('./models/User');
const Complaint = require('./models/Complaint');

let adminToken;
const testAdmin = {
  email: 'test@admin.local',
  password: 'TestPass123!'
};

beforeAll(async () => {
  // Create test admin and get token
  const user = await User.createFromEmailPassword(testAdmin.email, testAdmin.password);
  adminToken = jwt.sign({ id: user._id, email: user.email, role: 'admin' }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await User.deleteMany({});
  await Complaint.deleteMany({});
  await mongoose.connection.close();
});

describe('Auth endpoints', () => {
  test('POST /api/auth/login - success', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testAdmin.email, password: testAdmin.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login - invalid creds', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testAdmin.email, password: 'wrong' });
    expect(res.statusCode).toBe(401);
  });
});

describe('Complaints endpoints', () => {
  test('POST /api/complaints - create new', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .send({
        description: 'Test complaint',
        email: 'user@test.local',
        lat: 12.34,
        lng: 56.78
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.description).toBe('Test complaint');
  });

  test('GET /api/complaints - admin only', async () => {
    const res = await request(app)
      .get('/api/complaints')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('GET /api/complaints - unauthorized', async () => {
    const res = await request(app)
      .get('/api/complaints');
    expect(res.statusCode).toBe(401);
  });

  test('PUT /api/complaints/:id/status - admin only', async () => {
    // Create complaint first
    const complaint = await Complaint.create({
      description: 'Status test',
      email: 'status@test.local'
    });

    const res = await request(app)
      .put(`/api/complaints/${complaint._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'In Progress' });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('In Progress');
  });
});

describe('Public endpoints', () => {
  test('GET /api/resolved - public access', async () => {
    const res = await request(app)
      .get('/api/resolved');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('POST /api/chatbot - status query', async () => {
    const complaint = await Complaint.create({
      description: 'Chatbot test',
      status: 'Pending'
    });

    const res = await request(app)
      .post('/api/chatbot')
      .send({ message: 'what is the status', id: complaint._id });
    expect(res.statusCode).toBe(200);
    expect(res.body.reply).toContain('Pending');
  });
});