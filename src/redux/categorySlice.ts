import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CategoryState {
  selectedCategory: number;
}

const initialState: CategoryState = {
  selectedCategory: 0,
};

const categorySlice = createSlice({
  name: 'category',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<number>) => {
      state.selectedCategory = action.payload;
    },
  },
});

export const { setSelectedCategory } = categorySlice.actions;
export default categorySlice.reducer