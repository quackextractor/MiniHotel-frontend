# Changelog - Frontend

All notable changes to the MiniHotel frontend are documented here.
Versioning follows [Semantic Versioning 2.0.0](https://semver.org/).

---

## [0.8.0] - 2026-03-05

### Added
- Favicon updated to `bed.ico`; icons metadata added to app layout.
- Capacity warning displayed in booking form when room is near capacity.
- New i18n translation keys for capacity warnings and rate form validation.

### Changed
- Rate dialog form refactored with improved date validation logic.
- Applied missing translations across rates, booking-form, and rooms pages.

---

## [0.7.0] - 2026-02-28

### Added
- `BookingForm` component introduced to replace inline booking dialogs.
- Clients page added to the dashboard for guest management.
- Currency tracking and formatting improvements throughout the UI.
- i18n: added validation messages, loader fallback strings, and sync script.

### Changed
- Bookings UI refactored to use the new `BookingForm` component.
- Auth proxy improved for API request handling.
- Form validation tightened across multiple dashboard pages.

---

## [0.6.0] - 2026-02-25

### Added
- Full Room and Room Group management UI (create, edit, delete).
- User manuals in English and Czech (`manual/` directory).
- Edit and delete support for seasonal rates with i18n strings.

### Removed
- Amenities selection and display removed from Room management UI.

### Changed
- Room management page restructured to align with backend CRUD changes.

---

## [0.5.0] - 2026-02-12

### Added
- Additional language support (German, French, Spanish, and others).

### Changed
- Improved translation coverage across all dashboard pages.
- Fixed localization inconsistencies in date and currency formatting.

---

## [0.4.0] - 2026-01-19

### Changed
- General UI/UX overhaul pass improving layout consistency and dark mode reliability.
- `AuthContext` updated for more robust session management.

---

## [0.3.0] - 2026-01-15

### Added
- Full internationalization (i18n) support using `next-intl`.
- Locale-based routing restructured under `app/[locale]/`.
- Custom date formatting and currency conversion utilities.
- Guest search dropdown for booking forms.
- `MILESTONES.md` created to track project phases.

---

## [0.2.0] - 2026-01-03

### Added
- Authentication and profile management UI (login, register, profile page).
- Authorization header support for all API requests.
- Auto-logout feature on session expiry.
- Password change feature in user settings.
- Enter key navigation for forms via custom hook.
- Toast notification system replacing browser `alert()` dialogs.
- Sample data import feature in the Settings page.
- Services management UI (breakfast, parking, etc.).
- Seasonal rates management UI.

### Removed
- Events feature removed from dashboard navigation and pages.

### Fixed
- Currency formatting in the Reports screen now respects user locale settings.
- Type safety issues resolved in `dashboard/page.tsx` using explicit `Booking` type.

---

## [0.1.0] - 2025-11-06

### Added
- Initial migration of frontend codebase from the legacy `MiniHotel` repository.
- Next.js application structure with TypeScript.
- Core dashboard pages: Bookings, Rooms, Guests, Reports.
- Basic authentication flow.
