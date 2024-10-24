export interface UserRegistrationData {
    first_name: string;
    last_name: string;
    phone: string;
    date_of_birth: string;
    gender: 'male' | 'female';
    password: string;
    password_confirm: string;
}

export interface UserRegistrationResponse {
    id: number;
    first_name: string;
    last_name: string;
    phone: string;
    date_of_birth: string;
    gender: 'male' | 'female';
    cashback_balance: number;
    is_active: boolean;
}