import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock fetchAPI function
const mockFetchAPI = vi.fn();

// Mock the api module
vi.mock('@/lib/api', () => {
    return {
        fetchAPI: mockFetchAPI
    };
});

describe('api.getBookings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should extract items array from paginated response', async () => {
        const mockPaginatedResponse = {
            items: [
                { id: 1, guest_id: 1, room_id: 101, status: 'confirmed' },
                { id: 2, guest_id: 2, room_id: 102, status: 'pending' }
            ],
            total: 2,
            pages: 1,
            current_page: 1
        };

        mockFetchAPI.mockResolvedValue(mockPaginatedResponse);

        // Import the function after mocking
        const { api } = await import('@/lib/api');
        const result = await api.getBookings();

        expect(result).toEqual(mockPaginatedResponse.items);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(2);
    });

    it('should return array directly if response is already an array', async () => {
        const mockArrayResponse = [
            { id: 1, guest_id: 1, room_id: 101, status: 'confirmed' },
            { id: 2, guest_id: 2, room_id: 102, status: 'pending' }
        ];

        mockFetchAPI.mockResolvedValue(mockArrayResponse);

        const { api } = await import('@/lib/api');
        const result = await api.getBookings();

        expect(result).toEqual(mockArrayResponse);
        expect(Array.isArray(result)).toBe(true);
    });

    it('should return empty array if response has no items property', async () => {
        const mockEmptyResponse = {
            total: 0,
            pages: 0,
            current_page: 1
        };

        mockFetchAPI.mockResolvedValue(mockEmptyResponse);

        const { api } = await import('@/lib/api');
        const result = await api.getBookings();

        expect(result).toEqual([]);
        expect(Array.isArray(result)).toBe(true);
    });

    it('should pass query parameters correctly', async () => {
        const mockResponse = { items: [], total: 0, pages: 0, current_page: 1 };
        mockFetchAPI.mockResolvedValue(mockResponse);

        const { api } = await import('@/lib/api');
        await api.getBookings({ status: 'confirmed', room_id: '101' });

        expect(mockFetchAPI).toHaveBeenCalledWith('/bookings?status=confirmed&room_id=101');
    });
});
