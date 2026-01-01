import api from '../lib/api';
import { User } from '../types';

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

export class UsersService {
    private static readonly BASE_URL = '/users';

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
        // Assuming backend supports /users?role=CLIENT or we need to add a specific endpoint
        // Start with generic /users if filter is supported, or /users/clients
        const response = await api.get<PaginatedResult<User>>(`${this.BASE_URL}?role=CLIENT`);
        return response.data.data;
    }

    static async getById(id: string): Promise<User> {
        const response = await api.get<User>(`${this.BASE_URL}/${id}`);
        return response.data;
    }
}

