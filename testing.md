# Booking Flow Test Scenarios

## Scenario 1: Bookings List Validation
1. Go to `http://localhost:3000/en/dashboard/bookings`
2. Wait for the bookings table to load.
3. Verify that there are bookings in the list (if there are seeded bookings).
4. Extract the IDs or names of the first 2 bookings to verify they exist.

## Scenario 2: Calendar Booking Edit & Currency
1. Go to `http://localhost:3000/en/dashboard/calendar`
2. Wait for the calendar to load its events.
3. Click on any existing booking event in the calendar to open the "Detail rezervace" (Booking Details) modal.
4. Verify the currency shows correctly (e.g. `150.00 USD` or `150.00 EUR` depending on setting) instead of a hardcoded `$150.00`
5. Click the "Edit" button at the bottom of the modal.
6. Verify that the form changes from text to input fields (Room select, Guests input, Dates inputs).
7. Change the Number of Guests to a different number (e.g., from 1 to 2, or 2 to 3).
8. Click "Save".
9. Verify a success toast appears.
10. Click the same booking event again.
11. Verify the Number of Guests text shows the newly updated number.
