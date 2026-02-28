-- Fix RLS policies for custos_fixos table
-- This migration removes the strict user_id requirement and allows inserts without authentication

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own fixed costs" ON public.custos_fixos;
DROP POLICY IF EXISTS "Users can insert their own fixed costs" ON public.custos_fixos;
DROP POLICY IF EXISTS "Users can update their own fixed costs" ON public.custos_fixos;
DROP POLICY IF EXISTS "Users can delete their own fixed costs" ON public.custos_fixos;

-- Make user_id nullable since we don't have authentication yet
ALTER TABLE public.custos_fixos ALTER COLUMN user_id DROP NOT NULL;

-- Create new permissive policies that allow access without authentication
CREATE POLICY "Allow all to view fixed costs"
    ON public.custos_fixos FOR SELECT
    USING (true);

CREATE POLICY "Allow all to insert fixed costs"
    ON public.custos_fixos FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow all to update fixed costs"
    ON public.custos_fixos FOR UPDATE
    USING (true);

CREATE POLICY "Allow all to delete fixed costs"
    ON public.custos_fixos FOR DELETE
    USING (true);
