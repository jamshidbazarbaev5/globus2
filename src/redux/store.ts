import { configureStore } from '@reduxjs/toolkit';
import searchReducer from './searchSlice';
import categoryReducer from './categorySlice';

export const store = configureStore({
  reducer: {
    search: searchReducer,
    category: categoryReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;