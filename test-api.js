// Test API Script
// Chạy: node test-api.js

const http = require('http');

// Config
const API_URL = 'http://localhost:3000';
const TEST_CASES = [
  {
    name: 'Test 1: Valid submission - Team A',
    method: 'POST',
    path: '/submit',
    body: 'name=Nguyen Van A&team=team_a'
  },
  {
    name: 'Test 2: Valid submission - Team B',
    method: 'POST',
    path: '/submit',
    body: 'name=Tran Thi B&team=team_b'
  },
  {
    name: 'Test 3: Valid submission - Team C',
    method: 'POST',
    path: '/submit',
    body: 'name=Le Van C&team=team_c'
  },
  {
    name: 'Test 4: Empty name',
    method: 'POST',
    path: '/submit',
    body: 'name=&team=team_a',
    expectError: true
  },
  {
    name: 'Test 5: Invalid team',
    method: 'POST',
    path: '/submit',
    body: 'name=Test User&team=invalid_team',
    expectError: true
  },
  {
    name: 'Test 6: Get all selections',
    method: 'GET',
    path: '/api/selections'
  }
];

// Helper to make HTTP request
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(body);
    }
    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🧪 Selecteam API Tests\n');
  console.log(`🔗 API URL: ${API_URL}\n`);

  for (let i = 0; i < TEST_CASES.length; i++) {
    const testCase = TEST_CASES[i];
    console.log(`\n${testCase.name}`);
    console.log(`${testCase.method} ${testCase.path}`);

    if (testCase.body) {
      console.log(`Body: ${testCase.body}`);
    }

    try {
      const response = await makeRequest(testCase.method, testCase.path, testCase.body);
      console.log(`Status: ${response.statusCode}`);

      // Try to parse JSON
      try {
        const json = JSON.parse(response.body);
        console.log('Response: ' + JSON.stringify(json, null, 2).substring(0, 200) + '...');
      } catch {
        // Not JSON, just show first part
        console.log('Response: ' + response.body.substring(0, 100) + '...');
      }

      // Check expectations
      if (testCase.expectError) {
        if (response.statusCode >= 400) {
          console.log('✅ Test passed (error expected)');
        } else {
          console.log('❌ Test failed (expected error)');
        }
      } else {
        if (response.statusCode === 200) {
          console.log('✅ Test passed');
        } else {
          console.log(`⚠️  Unexpected status: ${response.statusCode}`);
        }
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n\n✅ Tests completed!');
}

// Run tests if server is running
console.log('Chờ server...');
setTimeout(runTests, 1000);
