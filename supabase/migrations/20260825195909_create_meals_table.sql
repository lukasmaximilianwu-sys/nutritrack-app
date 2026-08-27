/*
# Create meals table (single-tenant, no auth)

1. New Tables
- `meals`
  - `id` (uuid, primary key)
  - `food_text` (text, the user's typed meal description)
  - `calories` (numeric, kcal)
  - `protein` (numeric, grams)
  - `carbs` (numeric, grams)
  - `fat` (numeric, grams)
  - `magnesium_mg` (numeric, mg)
  - `zink_mg` (numeric, mg)
  - `kalium_mg` (numeric, mg)
  - `vitamin_c_mg` (numeric, mg)
  - `vitamin_b12_mcg` (numeric, mcg)
  - `eisen_mg` (numeric, mg)
  - `meal_date` (date, the day this meal belongs to, defaults to today)
  - `created_at` (timestamptz)
2. Security
- Enable RLS on `meals`.
- Allow anon + authenticated full CRUD (single-tenant, intentionally shared data).
3. Notes
- All nutrient columns default to 0 so missing values never break the dashboard sums.
*/

CREATE TABLE IF NOT EXISTS meals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_text text NOT NULL,
  calories numeric NOT NULL DEFAULT 0,
  protein numeric NOT NULL DEFAULT 0,
  carbs numeric NOT NULL DEFAULT 0,
  fat numeric NOT NULL DEFAULT 0,
  magnesium_mg numeric NOT NULL DEFAULT 0,
  zink_mg numeric NOT NULL DEFAULT 0,
  kalium_mg numeric NOT NULL DEFAULT 0,
  vitamin_c_mg numeric NOT NULL DEFAULT 0,
  vitamin_b12_mcg numeric NOT NULL DEFAULT 0,
  eisen_mg numeric NOT NULL DEFAULT 0,
  meal_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_meals" ON meals;
CREATE POLICY "anon_select_meals" ON meals FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_meals" ON meals;
CREATE POLICY "anon_insert_meals" ON meals FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_meals" ON meals;
CREATE POLICY "anon_update_meals" ON meals FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_meals" ON meals;
CREATE POLICY "anon_delete_meals" ON meals FOR DELETE
  TO anon, authenticated USING (true);
