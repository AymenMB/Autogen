-- Add category column to cars table
-- Run this migration in your Supabase SQL Editor

ALTER TABLE public.cars 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Add a comment to the column
COMMENT ON COLUMN public.cars.category IS 'Car category: Sport, Luxury, Classic, SUV, Supercar, Hypercar, Sedan, Coupe, Convertible, Truck, Electric';

-- Create an index for better filtering performance
CREATE INDEX IF NOT EXISTS idx_cars_category ON public.cars(category);

-- Optional: Add a check constraint to validate category values (uncomment if you want strict validation)
-- ALTER TABLE public.cars 
-- ADD CONSTRAINT cars_category_check 
-- CHECK (category IS NULL OR category IN ('Sport', 'Luxury', 'Classic', 'SUV', 'Supercar', 'Hypercar', 'Sedan', 'Coupe', 'Convertible', 'Truck', 'Electric'));
