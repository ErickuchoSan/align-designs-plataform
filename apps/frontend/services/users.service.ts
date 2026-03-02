import api from '../lib/api';
import { User, Role, CreateUserDto } from '../types';

interface PaginatedResult<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
}

export interface GetUsersParams {
    page?: number;
    limit?: number;
    role?: Role;
}

export class UsersService {
    private static readonly BASE_URL = '/users';

    /**
     * Get all users with pagination
     */
    static async getAll(params: GetUsersParams = {}): Promise<PaginatedResult<User>> {
        const response = await api.get<PaginatedResult<User>>(this.BASE_URL, { params });
        return response.data;
    }

    /**
     * Get all users with role EMPLOYEE
     */
    static async getEmployees(): Promise<User[]> {
        const response = await api.get<PaginatedResult<User>>(`${this.BASE_URL}?role=EMPLOYEE`);
        return response.data.data;
    }

    /**
     * Get available employees (not assigned to any ACTIVE project)
     * Use this when creating/editing projects to show only assignable employees
     */
    static async getAvailableEmployees(): Promise<User[]> {
        const response = await api.get<PaginatedResult<User>>(`${this.BASE_URL}/available-employees?limit=100`);
        return response.data.data;
    }

    static async getClients(): Promise<User[]> {
        const response = await api.get<PaginatedResult<User>>(`${this.BASE_URL}?role=CLIENT`);
        return response.data.data;
    }

    static async getById(id: string): Promise<User> {
        const response = await api.get<User>(`${this.BASE_URL}/${id}`);
        return response.data;
    }

    /**
     * Create a new user
     */
    static async create(data: CreateUserDto): Promise<User> {
        const response = await api.post<User>(this.BASE_URL, data);
        return response.data;
    }

    /**
     * Update a user by ID
     */
    static async update(id: string, data: Partial<User>): Promise<User> {
        const response = await api.put<User>(`${this.BASE_URL}/${id}`, data);
        return response.data;
    }

    /**
     * Update current user profile
     */
    static async updateProfile(data: { firstName: string; lastName: string; phone?: string }): Promise<User> {
        const response = await api.put<User>(`${this.BASE_URL}/profile`, data);
        return response.data;
    }

    /**
     * Toggle user active status
     */
    static async toggleStatus(id: string, isActive: boolean): Promise<void> {
        await api.patch(`${this.BASE_URL}/${id}/toggle-status`, { isActive });
    }

    /**
     * Delete a user (hard delete with optional force)
     */
    static async delete(id: string, options: { hard?: boolean; force?: boolean } = {}): Promise<void> {
        await api.delete(`${this.BASE_URL}/${id}`, { params: options });
    }

    /**
     * Resend welcome email to a user who hasn't set their password
     */
    static async resendWelcomeEmail(id: string): Promise<{ message: string }> {
        const response = await api.post<{ message: string }>(`${this.BASE_URL}/${id}/resend-welcome-email`);
        return response.data;
    }
}

