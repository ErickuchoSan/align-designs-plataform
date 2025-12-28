import api from '../lib/api';
import { User } from '../types';

export class UsersService {
    private static readonly BASE_URL = '/users';

    /**
     * Get all users with role EMPLOYEE
     */
    static async getEmployees(): Promise<User[]> {
        const response = await api.get<User[]>(`${this.BASE_URL}?role=EMPLOYEE`);
        return response.data;
    }

    static async getClients(): Promise<User[]> {
        // Assuming backend supports /users?role=CLIENT or we need to add a specific endpoint
        // Start with generic /users if filter is supported, or /users/clients
        const response = await api.get<User[]>(`${this.BASE_URL}?role=CLIENT`);
        return response.data;
    }

    static async getById(id: string): Promise<User> {
        const response = await api.get<User>(`${this.BASE_URL}/${id}`);
        return response.data;
    }
}

