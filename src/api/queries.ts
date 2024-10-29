import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './axios/axios';
import {
  IProduct,
  ApiResponse,
  ProductsResponse,
  CategoriesResponse,
  ICategory,
  LoginResponse,
  UserResponse
} from '../models/models';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

export const useProducts = (page: number, limit: number, searchTerm?: string, categoryId?: number) => {
  const offset = (page - 1) * limit;

  return useQuery({
    queryKey: ['products', page, limit, searchTerm, categoryId],
    queryFn: async () => {
      try {
        const queryParams = new URLSearchParams({
          offset: offset.toString(),
          limit: limit.toString(),
        });

        if (searchTerm) {
          queryParams.append('search', searchTerm);
        }

        if (categoryId) {
          queryParams.append('category', categoryId.toString());
        }

        const response = await api.get<ApiResponse<ProductsResponse>>(
          `/products?${queryParams.toString()}`
        );

        console.log('API Request URL:', `/products?${queryParams.toString()}`);
        console.log('Category ID:', categoryId);
        console.log('Response:', response.data);

        return {
          items: response.data.data.items,
          totalPages: Math.ceil(response.data.data.totalItems / limit),
        };
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<CategoriesResponse>>('/categories');
      return response.data.data.categories;
    },
  });
};

export const useCategory = (categoryId: number) => {
  return useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      if (categoryId === 0) return null;
      const response = await api.get<ApiResponse<ICategory>>(`/categories/${categoryId}`);
      return response.data.data;
    },
    enabled: categoryId > 0,
  });
};

interface ProductResponse {
  items: IProduct;
}

export const useProduct = (productId: number) => {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      try {
        const response = await api.get<ApiResponse<ProductResponse>>(`/products/${productId}`);
        console.log('API response:', response);
        if (response.data.success) {
          return response.data.data.items;
        } else {
          throw new Error(response.data.errMessage || 'Failed to fetch product');
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
      }
    },
    enabled: !!productId,
  });
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['Content-Type'] = 'application/json';
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      try {
        const response = await api.post('/token/refresh', { refresh: refreshToken });
        const { access } = response.data.data.token;
        localStorage.setItem('token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: { phone: string; password: string }) => {
      const response = await api.post('/token', credentials);
      return response.data;
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (userData: {
      first_name: string;
      last_name: string;
      password: string;
      phone: string;
      date_of_birth: string;
      gender: 'male' | 'female' | 'other';
    }) => {
      const response = await api.post('/users', userData);
      return response.data;
    },
  });
};

export const useVerifyUser = () => {
  return useMutation({
    mutationFn: async ({ phone, code }: { phone: string; code: string }) => {
      console.log('Verification payload:', { phone, code });
      try {
        // Send both phone and otp in the request
        const response = await api.post('/users/verify', {
          phone: phone,
          otp: code
        });
        
        console.log('Verification response:', response.data);
        
        if (!response.data.success) {
          throw new Error(response.data.errMessage || 'Verification failed');
        }
        
        return response.data;
      } catch (error: any) {
        if (error.response?.status === 404) {
          throw new Error('User not found. Please try registering again.');
        }
        
        if (error.response?.data?.errMessage === "Неверный код") {
          throw new Error('Invalid verification code. Please try again.');
        }
        
        console.error('Server error response:', error.response?.data);
        throw new Error(error.response?.data?.errMessage || 'Verification failed');
      }
    },
  });
};


export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await api.get('/users/me');
      return response.data.data.user;
    },
    retry: false,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ['currentUser'] });
    },
  });
};

export const useResendCode = () => {
  return useMutation({
    mutationFn: async ({ phone }: { phone: string }) => {
      const response = await api.post('/users/otp', { phone });
      return response.data;
    },
  });
};

interface CartItem {
  id: number;
  product: {
    id: number;
    code: string;
    name: string;
    description: string;
    discounts: null | any; 
    price: number;
    discount_price: number | null;
    is_new: boolean;
    amount: number;
    category: number;
    images: Array<{ id: number; image: string }>;
  };
  quantity: number;
  cart_items: number;
}

interface CartData {
  cart: CartItem[];
}

export const useCart = () => {
  return useQuery<CartData, Error>({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<CartData>>('/cart');
      return response.data.data;
    },
  });
};

export const useAddToCart = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, quantity }: { productId: number; quantity: number }) => {
      const response = await api.post<ApiResponse<CartItem>>('/cart', { product: productId, quantity });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};



export const useUpdateCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ cartItemId, quantity, productId }: { cartItemId: number; quantity: number; productId: number }) => {
      try {
        const response = await api.put<ApiResponse<CartItem>>(`/cart/${cartItemId}`, { quantity, product: productId });
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error updating cart item:', {
            message: error.message,
            status: error.response?.status,
            data: error.response?.data,
          });
          if (error.response?.status === 500) {
            throw new Error('An unexpected error occurred on the server. Please try again later.');
          }
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
    },
  });
};

export const useDeleteCartItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (cartItemId: number) => {
      await api.delete(`/cart/${cartItemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useDeleteAllCartItems = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete('/cart/delete-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
  });
};

export const useDelivery = () => {
  return useQuery({
    queryKey: ['delivery'],
    queryFn: async () => {
      const response = await api.get<ApiResponse<{ minimumSum: number }>>('/delivery');
      return response.data.data;
    },
  });
};
interface CardCreationResponse {
  success: boolean;
  errMessage: string | null;
  errorCode: string | null;
  data: {
    card: {
      number: string;
      expire: string;
      token: string;
      recurrent: boolean;
      verify: boolean;
      type: string;
    };
  };
}

interface CardCreationData {
  card_number: string;
  expire_date: string;
}

const formatExpiryDate = (date: string): string => {
  const [month, year] = date.split('/');
  return `${month.padStart(2, '0')}/${year.padStart(2, '0')}`;
};

export const useCreateCard = () => {
  return useMutation<CardCreationResponse, Error, CardCreationData>({
    mutationFn: async (cardData: CardCreationData) => {
      try {
        const formattedData = {
          ...cardData,
          expire: formatExpiryDate(cardData.expire_date)
        };
        console.log('Sending card creation request with data:', formattedData);
        const response = await api.post<CardCreationResponse>('/cards/create_card', formattedData);
        console.log('Received response:', response);

        if (response.data.success) {
          return response.data;
        } else {
          console.error('Card creation failed:', response.data);
          throw new Error(response.data.errMessage || 'Failed to create card');
        }
      } catch (error) {
        console.error('Error in card creation:', error);
        if (error instanceof Error) {
          throw error;
        } else {
          throw new Error('An unknown error occurred');
        }
      }
    },
  });
};

export const useGetVerificationCode = () => {
  return useMutation({
    mutationFn: async (token: string) => {
      const response = await api.post('/cards/get_verify_code', { token });
      return response.data;
    },
  });
};

export const usePayReceipt = () => {
  return useMutation({
    mutationFn: async ({ token, invoice_id }: { token: string; invoice_id: string }) => {
      const response = await api.post('/receipts/receipts_pay', { token, invoice_id });
      return response.data;
    },
  });
};

export const useCreateReceipt = () => {
  return useMutation({
    mutationFn: async ({ amount, order_id }: { amount: number; order_id:number }) => {
      const response = await api.post('/receipts/receipts_create', { amount, order_id });
      return response.data;
    },
    onError: (error) => {
      console.error("Receipt creation failed:", error);
      notifications.show({
        title: "Error",
        message: "Failed to create receipt. Please try again.",
        color: "red",
      });
    }
  });
};



export const useVerifyCard = ()=>{
  return useMutation({
    mutationFn: async ({ token, code }: { token: string; code: string }) => {
      const response = await api.post('/cards/verify_card', { token, code });
      return response.data;
    },
  });
}


export const useCheckCard   = ()=>{
  return useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      const response = await api.post('/cards/check_card', { token });
      return response.data;
    },
  });
}
