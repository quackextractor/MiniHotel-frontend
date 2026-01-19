export interface Booking {
    id: number
    guest_id: number
    room_id: number
    check_in: string
    check_out: string
    number_of_guests: number
    status: string
    payment_status?: string
    total_amount?: number
    notes?: string
    guest?: {
        first_name: string
        last_name: string
        email?: string
        phone?: string
    }
    room?: {
        room_number: string
        room_type: string
        base_rate: number
        capacity: number
    }
}
