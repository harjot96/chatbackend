// Test script for User Management API
// Run with: node test-api.js

const API_URL = 'http://localhost:3001';

// Helper function to make API requests
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error('API request failed:', error);
    return { error: error.message };
  }
}

// Main test function
async function runTests() {
  console.log('🧪 Testing Chat Backend User Management API\n');
  console.log('=' .repeat(50));

  // Test 1: Server Status
  console.log('\n📊 Test 1: Server Status');
  const status = await apiRequest('/');
  console.log(JSON.stringify(status.data, null, 2));

  // Test 2: Register User
  console.log('\n👤 Test 2: Register New User');
  const registerData = {
    username: 'testuser' + Date.now(),
    email: `test${Date.now()}@example.com`,
    password: 'password123',
    displayName: 'Test User'
  };
  const register = await apiRequest('/api/auth/register', 'POST', registerData);
  console.log('Status:', register.status);
  console.log('Response:', JSON.stringify(register.data, null, 2));
  
  const userId = register.data.user?.userId;
  const token = register.data.token;

  // Test 3: Login User
  console.log('\n🔐 Test 3: Login User');
  const loginData = {
    username: registerData.username,
    password: registerData.password
  };
  const login = await apiRequest('/api/auth/login', 'POST', loginData);
  console.log('Status:', login.status);
  console.log('Response:', JSON.stringify(login.data, null, 2));

  // Test 4: Get User Profile
  if (userId) {
    console.log('\n👁️  Test 4: Get User Profile');
    const profile = await apiRequest(`/api/users/${userId}`);
    console.log('Status:', profile.status);
    console.log('Response:', JSON.stringify(profile.data, null, 2));

    // Test 5: Update Profile
    console.log('\n✏️  Test 5: Update User Profile');
    const updateData = {
      displayName: 'Updated Test User',
      bio: 'This is a test user account'
    };
    const update = await apiRequest(`/api/users/${userId}`, 'PUT', updateData);
    console.log('Status:', update.status);
    console.log('Response:', JSON.stringify(update.data, null, 2));
  }

  // Test 6: Get All Users
  console.log('\n📋 Test 6: Get All Users');
  const allUsers = await apiRequest('/api/users');
  console.log('Status:', allUsers.status);
  console.log('Total Users:', allUsers.data.total);
  console.log('Users:', JSON.stringify(allUsers.data.users, null, 2));

  // Test 7: Search Users
  console.log('\n🔍 Test 7: Search Users');
  const search = await apiRequest('/api/users/search/test');
  console.log('Status:', search.status);
  console.log('Results:', JSON.stringify(search.data, null, 2));

  console.log('\n' + '='.repeat(50));
  console.log('✅ All tests completed!\n');
}

// Run tests
runTests().catch(console.error);
