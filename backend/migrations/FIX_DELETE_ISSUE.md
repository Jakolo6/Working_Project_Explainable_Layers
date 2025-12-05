# Fix: Session Deletion 500 Error

## Problem
Admin endpoint `/api/v1/admin/sessions/{session_id}` returns 500 error when trying to delete sessions.

## Root Cause
**Row Level Security (RLS) is enabled** on all tables, but **DELETE policies are missing**.

The schema (`FINAL_CLEAN_SCHEMA.sql`) defines policies for:
- ✅ INSERT
- ✅ SELECT  
- ✅ UPDATE
- ❌ DELETE (MISSING!)

Without a DELETE policy, Supabase RLS blocks all DELETE operations, even from the backend.

## Solution

### Option 1: Add DELETE Policies (Recommended for Development)
Run the SQL migration: `ADD_DELETE_POLICIES.sql`

```sql
CREATE POLICY "sessions_delete" ON sessions FOR DELETE USING (true);
CREATE POLICY "predictions_delete" ON predictions FOR DELETE USING (true);
CREATE POLICY "layer_ratings_delete" ON layer_ratings FOR DELETE USING (true);
CREATE POLICY "post_questionnaires_delete" ON post_questionnaires FOR DELETE USING (true);
```

**How to apply:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste the contents of `ADD_DELETE_POLICIES.sql`
3. Run the query
4. Test deletion in admin page

### Option 2: Use Service Role Key (Production)
For production, you might want to:
1. Keep RLS strict (no public DELETE policy)
2. Use Supabase **service role key** (bypasses RLS) for admin operations
3. Update backend to use service role key for admin endpoints

**In `app/config.py`:**
```python
class Settings(BaseSettings):
    supabase_url: str
    supabase_key: str  # anon key for public
    supabase_service_role_key: str  # service role for admin (optional)
```

**In admin endpoints:**
```python
# Use service role key for admin operations
from supabase import create_client
supabase = create_client(
    config.supabase_url, 
    config.supabase_service_role_key  # Bypasses RLS
)
```

## Verification

After applying the fix, test:
```bash
curl -X DELETE http://localhost:8000/api/v1/admin/sessions/{session_id}
```

Should return:
```json
{
  "success": true,
  "message": "Session deleted successfully",
  "deleted_counts": {
    "ratings": 12,
    "predictions": 3,
    "questionnaires": 3,
    "session": 1
  }
}
```

## Files Modified
- `ADD_DELETE_POLICIES.sql` - SQL migration to add DELETE policies
- `admin.py` - Added comment about RLS requirement

## Related Schema
See `FINAL_CLEAN_SCHEMA.sql` lines 165-183 for current RLS policies.
