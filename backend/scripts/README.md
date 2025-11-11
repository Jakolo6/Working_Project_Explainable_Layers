# Backend Scripts (Deprecated)

⚠️ **This directory is deprecated. All scripts have been moved to the root directory as local-first scripts.**

## New Local-First Approach

Use these scripts instead (in project root):
- `eda_local.py` - Generate EDA locally
- `train_models_local.py` - Train models locally

See `LOCAL_SCRIPTS_README.md` for usage instructions.

## Manual Upload Workflow

1. Run local scripts to generate files
2. Manually upload to R2 bucket:
   - `data/eda/*` → R2 `eda/` folder
   - `data/models/*` → R2 `models/` folder

This approach is more transparent, reproducible, and professor-friendly.
