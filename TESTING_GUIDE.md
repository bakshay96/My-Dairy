# Testing Guide - Milkify Application

## Table of Contents
1. [Unit Testing](#unit-testing)
2. [Integration Testing](#integration-testing)
3. [API Testing](#api-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Performance Testing](#performance-testing)
6. [Security Testing](#security-testing)

---

## Unit Testing

### Setup Testing Environment

```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom supertest
```

### Backend Unit Tests

**Test Admin Service:**
```javascript
// Backend/src/Admin/admin.service.test.js
const adminService = require('./admin.service');

describe('AdminService', () => {
  describe('registerAdmin', () => {
    it('should register a new admin', async () => {
      const adminData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'SecurePassword123',
        mobileNumber: '9999999999',
      };

      const result = await adminService.registerAdmin(adminData);
      
      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
      expect(result.data.email).toBe(adminData.email);
    });

    it('should not allow duplicate emails', async () => {
      const adminData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'existing@example.com',
        password: 'SecurePassword123',
        mobileNumber: '8888888888',
      };

      // First registration
      await adminService.registerAdmin(adminData);

      // Second registration with same email should fail
      await expect(adminService.registerAdmin(adminData)).rejects.toThrow();
    });
  });

  describe('loginAdmin', () => {
    it('should login with valid credentials', async () => {
      const result = await adminService.loginAdmin(
        'john@example.com',
        'SecurePassword123'
      );

      expect(result.success).toBe(true);
      expect(result.data.token).toBeDefined();
    });

    it('should fail with invalid password', async () => {
      await expect(
        adminService.loginAdmin('john@example.com', 'wrongPassword')
      ).rejects.toThrow();
    });
  });
});
```

### Frontend Unit Tests

**Test Component:**
```javascript
// Frontend/src/Components/Header/Header.test.jsx
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import Header from './Header';
import store from '../../Redux/store';

describe('Header Component', () => {
  it('renders navigation links', () => {
    render(
      <Provider store={store}>
        <Header />
      </Provider>
    );

    expect(screen.getByText(/home/i)).toBeInTheDocument();
    expect(screen.getByText(/about/i)).toBeInTheDocument();
  });

  it('displays login button when not authenticated', () => {
    render(
      <Provider store={store}>
        <Header />
      </Provider>
    );

    expect(screen.getByText(/login/i)).toBeInTheDocument();
  });
});
```

---

## Integration Testing

### Database Integration Tests

```javascript
// Backend/tests/integration/farmer.integration.test.js
const mongoose = require('mongoose');
const farmerService = require('../../src/Farmer/farmer.service');
const { FarmerModel } = require('../../src/Farmer/farmer.model');

describe('Farmer Service Integration', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.TEST_MONGO_URL);
  });

  afterAll(async () => {
    // Clean up and disconnect
    await FarmerModel.deleteMany({});
    await mongoose.disconnect();
  });

  it('should create and retrieve farmer', async () => {
    const farmerData = {
      firstName: 'Raj',
      lastName: 'Kumar',
      email: 'raj@example.com',
      mobileNumber: '9876543210',
      gender: 'Male',
      villageName: 'Sample Village',
    };

    const created = await farmerService.registerFarmer(farmerData);
    const retrieved = await farmerService.getFarmerById(created.data._id);

    expect(retrieved.firstName).toBe(farmerData.firstName);
    expect(retrieved.email).toBe(farmerData.email);
  });
});
```

---

## API Testing

### Using Postman/Insomnia

**Test Admin Registration:**
```
POST /api/admin/register
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@test.com",
  "password": "AdminPassword123",
  "mobileNumber": "9999999999"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Admin registered successfully",
  "data": {
    "id": "...",
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@test.com",
    "mobileNumber": "9999999999",
    "token": "..."
  }
}
```

### Test All Endpoints

**Test Farmer Registration:**
```
POST /api/farmer/register
Authorization: Bearer {token}

{
  "firstName": "Farmer",
  "lastName": "Name",
  "email": "farmer@test.com",
  "mobileNumber": "8888888888",
  "gender": "Male",
  "villageName": "Test Village"
}
```

**Test Milk Submission:**
```
POST /api/milk/submit
Authorization: Bearer {token}

{
  "farmerId": "...",
  "category": "Cow",
  "liter": 10,
  "fat": 4.2,
  "snf": 8.5,
  "water": 0,
  "degree": 25
}
```

**Test Payment:**
```
POST /api/payment/create-order
Authorization: Bearer {token}

{
  "amount": 1000,
  "currency": "INR",
  "farmerId": "...",
  "description": "Milk Payment"
}
```

---

## End-to-End Testing

### Complete User Flow Test

```javascript
// Frontend/tests/e2e/userFlow.test.js
describe('Complete User Flow', () => {
  it('should register, login, add farmer, submit milk, and make payment', async () => {
    // 1. Admin Registration
    // 2. Admin Login
    // 3. Add Farmer
    // 4. Submit Milk
    // 5. Create Payment Order
    // 6. Verify Payment
    // 7. View Reports
  });
});
```

---

## Performance Testing

### Load Testing

```bash
# Install Apache Bench
apt-get install apache2-utils

# Test API performance
ab -n 100 -c 10 http://localhost:3030/api/milk
# This makes 100 requests with 10 concurrent connections
```

### Expected Performance Metrics
- **API Response Time**: < 500ms
- **Page Load Time**: < 3 seconds
- **Memory Usage**: < 200MB
- **CPU Usage**: < 50%

---

## Security Testing

### Test Cases

1. **SQL/NoSQL Injection**
   ```
   Test: POST /api/farmer with injection payload
   Expected: Injection attempt blocked
   ```

2. **Cross-Site Scripting (XSS)**
   ```
   Test: Submit script tags in form fields
   Expected: Scripts sanitized/escaped
   ```

3. **Authentication**
   ```
   Test: Access protected endpoints without token
   Expected: 401 Unauthorized
   ```

4. **Authorization**
   ```
   Test: Farmer tries to access admin endpoints
   Expected: 403 Forbidden
   ```

5. **Rate Limiting**
   ```
   Test: Make 6 login attempts in 15 minutes
   Expected: 5th attempt succeeds, 6th blocked
   ```

---

## Test Checklist

### Backend Tests
- [ ] All service methods have unit tests
- [ ] Database operations tested with real DB
- [ ] Error handling tested
- [ ] Validation works correctly
- [ ] Authentication middleware works
- [ ] Rate limiting blocks excessive requests
- [ ] All API endpoints return correct responses
- [ ] Cross-origin requests handled properly

### Frontend Tests
- [ ] Components render correctly
- [ ] User interactions work (clicks, forms)
- [ ] Redux state management works
- [ ] API calls made successfully
- [ ] Error messages displayed
- [ ] Responsive design works on mobile
- [ ] Payment flow completes

### Integration Tests
- [ ] User can register and login
- [ ] Admin can add farmers
- [ ] Farmers can submit milk
- [ ] Payment processing works
- [ ] Reports generate correctly
- [ ] Email notifications sent

### Security Tests
- [ ] SQL Injection prevented
- [ ] XSS attacks prevented
- [ ] CSRF protection enabled
- [ ] Passwords hashed properly
- [ ] Tokens validated correctly
- [ ] Rate limiting enforced

---

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- farmer.service.test.js

# Run tests matching pattern
npm test -- --testNamePattern="login"
```

---

## Continuous Integration

Set up GitHub Actions or similar CI/CD pipeline to run tests automatically on every commit:

```yaml
# .github/workflows/test.yml
name: Run Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm test
```

---

## Test Coverage Goals

| Area | Target Coverage | Current |
|------|-----------------|---------|
| Backend | 80%+ | TBD |
| Frontend | 70%+ | TBD |
| API Routes | 90%+ | TBD |
| Services | 85%+ | TBD |
| Utils | 90%+ | TBD |

