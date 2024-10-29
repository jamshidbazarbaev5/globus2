import React, { useState } from 'react';
import { Paper, NavLink, Stack, Skeleton, Box, Burger, Drawer, ScrollArea } from '@mantine/core';
import { useCategories } from '../api/queries';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedCategory } from '../redux/categorySlice';
import { RootState } from '../redux/store';
import { ICategory } from '../models/models';
import { useMediaQuery } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';

export const CategoryList: React.FC = () => {
  const { data: categories, isLoading } = useCategories();
  const dispatch = useDispatch();
  const selectedCategory = useSelector((state: RootState) => state.category.selectedCategory);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [opened, setOpened] = useState(false);
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId: number) => {
    console.log('Selected category:', categoryId);
    dispatch(setSelectedCategory(categoryId));
    setOpened(false);
    navigate(`/products?category=${categoryId}`);
  };

  if (isLoading) {
    return (
      <Paper>
        <Skeleton height={30} width="100%" />
      </Paper>
    );
  }

  const categoryList = (
    <ScrollArea style={{ height: isMobile ? 'calc(100vh - 60px)' : '1700px' }}>
      <Stack gap="xs">
        <NavLink 
          label="All Categories"
          active={selectedCategory === 0}
          onClick={() => handleCategoryClick(0)}
        />
        {categories?.map((category: ICategory) => (
          <NavLink 
            key={category.id}
            label={category.name}
            active={selectedCategory === category.id}
            onClick={() => handleCategoryClick(category.id)}
          />
        ))}
      </Stack>
    </ScrollArea>
  );

  return (
    <>
      {isMobile ? (
        <Box>
          <Burger opened={opened} onClick={() => setOpened((o) => !o)} />
          <Drawer
            opened={opened}
            onClose={() => setOpened(false)}
            size="100%"
            padding="md"
            title="Categories"
            closeButtonProps={{ size: 'lg' }}
          >
            {categoryList}
          </Drawer>
        </Box>
      ) : (
        <Paper p="xs" style={{ width: '250px' }}>{categoryList}</Paper>
      )}
    </>
  );
};