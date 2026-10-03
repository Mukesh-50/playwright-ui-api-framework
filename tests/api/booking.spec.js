// @ts-check
import { test, expect } from '../../fixture/fixture.js';
import { buildBookingPayload } from '../../api/data/booking.data.js';
import { env } from '../../config/env.js';

test.describe.serial('Booking flow - data from JS file', () => {
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

  test('POST /booking - creates booking with default payload', async ({ bookingApi }) => {
    const payload = buildBookingPayload();

    const response = await bookingApi.createBooking(payload);

    expect(response.status()).toBe(200);

    const body = await response.json();
    
    expect(body.booking).toEqual(payload);

    bookingId = body.bookingid;
  });

  test('PUT /booking/:id - updates booking firstname', async ({ bookingApi }) => {
    const updatedPayload = { ...buildBookingPayload(), firstname: 'James' };

    const response = await bookingApi.updateBooking(bookingId, updatedPayload, token);

    expect(response.status()).toBe(200);

    const body = await response.json();
    
    expect(body).toEqual(updatedPayload);
  });

  test('DELETE /booking/:id - deletes booking using token', async ({ bookingApi }) => 
  {
    const response = await bookingApi.deleteBooking(bookingId, token);

    expect(response.status()).toBe(201);
  });
});
