const API_BASE_URL = "/api"

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return response.json()
}

export const api = {
  // Rooms
  getRooms: () => fetchAPI("/rooms"),
  getRoom: (id: number) => fetchAPI(`/rooms/${id}`),
  createRoom: (data: any) => fetchAPI("/rooms", { method: "POST", body: JSON.stringify(data) }),
  updateRoom: (id: number, data: any) => fetchAPI(`/rooms/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRoom: (id: number) => fetchAPI(`/rooms/${id}`, { method: "DELETE" }),

  // Guests
  getGuests: () => fetchAPI("/guests"),
  getGuest: (id: number) => fetchAPI(`/guests/${id}`),
  searchGuests: (query: string) => fetchAPI(`/guests/search?q=${encodeURIComponent(query)}`),
  createGuest: (data: any) => fetchAPI("/guests", { method: "POST", body: JSON.stringify(data) }),
  updateGuest: (id: number, data: any) => fetchAPI(`/guests/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Bookings
  getBookings: (params?: Record<string, string>) => {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return fetchAPI(`/bookings${queryString}`)
  },
  getBooking: (id: number) => fetchAPI(`/bookings/${id}`),
  createBooking: (data: any) => fetchAPI("/bookings", { method: "POST", body: JSON.stringify(data) }),
  updateBooking: (id: number, data: any) => fetchAPI(`/bookings/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateBookingStatus: (id: number, data: { status: string; payment_status?: string }) =>
    fetchAPI(`/bookings/${id}/status`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteBooking: (id: number) => fetchAPI(`/bookings/${id}`, { method: "DELETE" }),
  calculateRate: (data: any) => fetchAPI("/bookings/calculate-rate", { method: "POST", body: JSON.stringify(data) }),

  // Calendar
  getWeeklyCalendar: (params?: Record<string, string>) => {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return fetchAPI(`/calendar/weekly${queryString}`)
  },
  getMonthlyCalendar: (params?: Record<string, string>) => {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    return fetchAPI(`/calendar/monthly${queryString}`)
  },
  getAvailability: (startDate: string, endDate: string) =>
    fetchAPI(`/availability?start_date=${startDate}&end_date=${endDate}`),

  // Import Data
  importData: () => fetchAPI("/import-data", { method: "POST" }),

  // Housekeeping
  getHousekeeping: () => fetchAPI("/housekeeping"),
  createHousekeeping: (data: any) => fetchAPI("/housekeeping", { method: "POST", body: JSON.stringify(data) }),
  updateHousekeeping: (id: number, data: any) =>
    fetchAPI(`/housekeeping/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Maintenance
  getMaintenance: () => fetchAPI("/maintenance"),
  createMaintenance: (data: any) => fetchAPI("/maintenance", { method: "POST", body: JSON.stringify(data) }),
  updateMaintenance: (id: number, data: any) =>
    fetchAPI(`/maintenance/${id}`, { method: "PUT", body: JSON.stringify(data) }),

  // Contacts
  getContacts: () => fetchAPI("/contacts"),
  createContact: (data: any) => fetchAPI("/contacts", { method: "POST", body: JSON.stringify(data) }),

  // Statistics
  getOccupancyStats: () => fetchAPI("/statistics/occupancy"),
  getYearlySummary: (year?: number) => {
    const queryString = year ? `?year=${year}` : ""
    return fetchAPI(`/statistics/yearly-summary${queryString}`)
  },

  // Room Groups
  getRoomGroups: () => fetchAPI("/room-groups"),
  createRoomGroup: (data: any) => fetchAPI("/room-groups", { method: "POST", body: JSON.stringify(data) }),

  // Seasonal Rates
  getSeasonalRates: () => fetchAPI("/seasonal-rates"),
  createSeasonalRate: (data: any) => fetchAPI("/seasonal-rates", { method: "POST", body: JSON.stringify(data) }),

  // services
  getServices: () => fetchAPI("/services"),
  createService: (data: any) => fetchAPI("/services", { method: "POST", body: JSON.stringify(data) }),

  // Auth & System
  getAuditLogs: () => fetchAPI("/audit-logs"),
  updateUserPassword: (passwordData: any) => fetchAPI("/auth/change-password", { method: "POST", body: JSON.stringify(passwordData) }),
}
