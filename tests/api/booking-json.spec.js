import { test, expect } from '../../fixture/fixture.js';
import bookingData from '../../data/json/booking.json';
import { env } from '../../config/env.js';

test.describe.serial('Booking flow - data from JSON file', () => {
  /** @type {string} */
  let token;
  /** @type {number} */
  let bookingId;

  test.beforeAll('POST /auth - generate token', async ({ request }) => {
    const response = await request.post('/auth', {
      data: { username: env.apiAdminUsername, password: env.apiAdminPassword },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();

    token = body.token;
  });

  test('POST /booking - creates booking with payload from JSON file', async ({ bookingApi }) => {
    const response = await bookingApi.createBooking(bookingData);

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.booking).toEqual(bookingData);

    bookingId = body.bookingid;
  });

  test('PUT /booking/:id - updates booking firstname', async ({ bookingApi }) => {
    const updatedPayload = { ...bookingData, firstname: 'James' };

    const response = await bookingApi.updateBooking(bookingId, updatedPayload, token);

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body).toEqual(updatedPayload);
  });

  test('DELETE /booking/:id - deletes booking using token', async ({ bookingApi }) => {
    const response = await bookingApi.deleteBooking(bookingId, token);

    expect(response.status()).toBe(201);
  });
});
