# Cognitive Load Scale Inversion Migration

## ⚠️ IMPORTANT: Database Migration Required

This migration **MUST** be run on the production database to invert existing cognitive load ratings.

---

## 📋 What This Does

Inverts the cognitive load scale in the database so that **5 = easy/positive** (instead of 5 = hard/negative).

### Formula
```sql
new_value = 6 - old_value
```

### Transformation
- Old 1 (easy) → New 5 (easy) ✅
- Old 2 → New 4
- Old 3 → New 3 (neutral stays neutral)
- Old 4 → New 2
- Old 5 (hard) → New 1 (hard) ✅

---

## 🚀 How to Run

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `INVERT_COGNITIVE_LOAD_SCALE.sql`
5. Paste into the editor
6. Click **Run**
7. Verify the output shows successful update

### Option 2: Using psql Command Line

```bash
# Connect to your Supabase database
psql "postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Run the migration
\i backend/migrations/INVERT_COGNITIVE_LOAD_SCALE.sql
```

### Option 3: Using Environment Variable

```bash
# If you have DATABASE_URL set
psql $DATABASE_URL -f backend/migrations/INVERT_COGNITIVE_LOAD_SCALE.sql
```

---

## ✅ Verification

After running the migration, you should see:

```
UPDATE [N]
```
Where `[N]` is the number of rows updated.

Then you'll see verification output:
```
 table_name    | total_rows | min_rating | max_rating | avg_rating 
---------------+------------+------------+------------+------------
 layer_ratings |     [N]    |     1      |     5      |   [X.XX]
```

And distribution:
```
 rating_value | count | percentage 
--------------+-------+------------
      1       |  [N]  |   [X.X]
      2       |  [N]  |   [X.X]
      3       |  [N]  |   [X.X]
      4       |  [N]  |   [X.X]
      5       |  [N]  |   [X.X]
```

---

## 🔄 Rollback (If Needed)

If you need to rollback this migration, run the **exact same formula**:

```sql
UPDATE layer_ratings
SET cognitive_load_rating = 6 - cognitive_load_rating
WHERE cognitive_load_rating IS NOT NULL;
```

The formula is **self-inverting** (applying it twice returns to original values).

---

## 📊 Impact

- **Existing survey responses**: All cognitive load ratings will be inverted
- **New survey responses**: Will use the new positive framing ("easy to process")
- **Data analysis**: All scales now aligned (5 = positive/good)
- **Results page**: Will display correct interpretation

---

## ⏰ When to Run

**Run this migration IMMEDIATELY** after deploying the frontend changes.

This ensures:
1. Old responses are correctly inverted
2. New responses use the new scale
3. All data is consistent for analysis

---

## 🔍 What Changed

### Before (Inverted Scale)
```
Question: "I found this explanation mentally demanding"
1 = Strongly disagree (easy/low load) 
5 = Strongly agree (hard/high load)
```

### After (Aligned Scale)
```
Question: "I found this explanation easy to process mentally"
1 = Strongly disagree (hard/high load)
5 = Strongly agree (easy/low load)
```

---

## 📝 Notes

- The migration includes data integrity checks
- All values will remain in valid range (1-5)
- A comment is added to the column documenting the change
- The migration is **idempotent** (safe to run multiple times with same result)

---

## ❓ Questions?

If you encounter any issues:
1. Check the verification output
2. Ensure all values are still 1-5
3. Compare before/after averages (they should be inverted around 3.0)
4. Contact the development team if needed
