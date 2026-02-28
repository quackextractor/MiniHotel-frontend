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

  if (response.status === 401) {
    // If we receive a 401 Unauthorized, and it's not a login attempt,
    // it means the token is invalid/expired. Log out the user.
    if (typeof window !== "undefined" && !endpoint.includes("/auth/login")) {
      localStorage.removeItem("token")
      localStorage.removeItem("username")
      localStorage.removeItem("userId")
      window.location.href = "/login?error=Session expired"
      throw new Error("Session expired")
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API Error: ${response.statusText}`)
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
  deleteGuest: (id: number) => fetchAPI(`/guests/${id}`, { method: "DELETE" }),


  // Bookings
  getBookings: async (params?: Record<string, string>) => {
    const queryString = params ? "?" + new URLSearchParams(params).toString() : ""
    const response = await fetchAPI(`/bookings${queryString}`)
    // Backend returns paginated response: { items: [], total, pages, current_page }
    // Extract items array for compatibility with existing frontend code
    return Array.isArray(response) ? response : response.items || []
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
  updateRoomGroup: (id: number, data: any) => fetchAPI(`/room-groups/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRoomGroup: (id: number) => fetchAPI(`/room-groups/${id}`, { method: "DELETE" }),

  // Seasonal Rates
  getSeasonalRates: () => fetchAPI("/seasonal-rates"),
  createSeasonalRate: (data: any) => fetchAPI("/seasonal-rates", { method: "POST", body: JSON.stringify(data) }),
  updateSeasonalRate: (id: number, data: any) => fetchAPI(`/seasonal-rates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSeasonalRate: (id: number) => fetchAPI(`/seasonal-rates/${id}`, { method: "DELETE" }),

  // services
  getServices: () => fetchAPI("/services"),
  createService: (data: any) => fetchAPI("/services", { method: "POST", body: JSON.stringify(data) }),
  updateService: (id: number, data: any) => fetchAPI(`/services/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteService: (id: number) => fetchAPI(`/services/${id}`, { method: "DELETE" }),


  // Auth & System
  getAuditLogs: () => fetchAPI("/audit-logs"),
  updateUserPassword: (passwordData: any) => fetchAPI("/auth/change-password", { method: "POST", body: JSON.stringify(passwordData) }),
}
