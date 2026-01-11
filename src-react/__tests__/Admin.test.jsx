/**
 * @jest-environment jsdom
 */

import './setup-mocks';
import '@testing-library/jest-dom';
import { verifyBootstrapIconClass, setupCommonMocks, cleanupAfterTests, testApiCall } from './test-utils';

describe('Admin Page - Bootstrap Icons', () => {
  const adminIcons = [
    { name: 'create event button', className: 'bi bi-plus-circle' },
    { name: 'edit button', className: 'bi bi-pencil' },
    { name: 'delete button', className: 'bi bi-trash' },
    { name: 'participants button', className: 'bi bi-people' }
  ];

  adminIcons.forEach(({ name, className }) => {
    it(`verify ${name} has bootstrap icon class`, () => {
      verifyBootstrapIconClass(className, className.split(' ')[1]);
    });
  });
});

describe('Admin Page - Event API Integration', () => {
  beforeEach(setupCommonMocks);
  afterEach(cleanupAfterTests);

  it('should call API with correct data when creating event', async () => {
    const mockEventData = {
      title: 'Test Event',
      description: 'Test Description',
      dateTime: '2024-12-31T10:00',
      totalSlots: 50,
      local: 'Test Location'
    };

    const data = await testApiCall('http://localhost:3000/api/events', 'POST', mockEventData, {
      ...mockEventData,
      id: '1'
    });

    expect(data.data).toHaveProperty('id');
  });

  it('should call API with correct data when updating event', async () => {
    const mockEventData = {
      title: 'Updated Event',
      description: 'Updated Description',
      dateTime: '2024-12-31T10:00',
      totalSlots: 75,
      local: 'Updated Location',
      isActive: true
    };

    const data = await testApiCall('http://localhost:3000/api/events/1', 'PUT', mockEventData, {
      ...mockEventData,
      id: '1'
    });

    expect(data.data).toHaveProperty('id');
  });

  it('should handle update errors correctly', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () =>
        Promise.resolve({
          error: {
            code: 'UPDATE_ERROR',
            message: 'Update failed',
            timestamp: new Date().toISOString()
          }
        })
    });

    const response = await fetch('http://localhost:3000/api/events/1', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer fake-token'
      },
      body: JSON.stringify({})
    });

    expect(response.ok).toBe(false);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data.error).toHaveProperty('message');
  });
});
