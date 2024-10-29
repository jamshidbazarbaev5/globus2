import axios from 'axios';
import { UserRegistrationData, UserRegistrationResponse } from './types/auth';
interface User {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    password: string;
    cashback_balance: number;
    date_of_birth: string;
    gender: 'male' | 'female';
    is_active: boolean;
  }
  
  interface ApiResponse<T> {
    success: boolean;
    errMessage: string | null;
    errorCode: string | null;
    data: T;
  }
  
  interface TokenResponse {
    token: {
      access: string;
      refresh: string;
    };
  }
  
const BASE_URL = 'https://globus-nukus.uz/api';

export const submitPhoneNumber = async (phone: string) => {
  const response = await axios.post(`${BASE_URL}/users/otp`, { phone });
  return response.data;
};

export const verifyOTP = async (phone: string, otp: string) => {
  const response = await axios.post(`${BASE_URL}/users/verify`, { phone, otp });
  return response.data;
};

export const registerUser = async (userData: Omit<UserRegistrationData, 'password_confirm'>): Promise<UserRegistrationResponse> => {
  const response = await axios.post<UserRegistrationResponse>(`${BASE_URL}/users`, userData);
  return response.data;
};