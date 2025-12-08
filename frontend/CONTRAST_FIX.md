# Text Contrast Improvements

## Changes Made to Ensure Visibility on All Screens

### Color Mapping (WCAG AA Compliant)
- `text-gray-400` → `text-gray-600` (for secondary text)
- `text-gray-500` → `text-gray-700` (for body text)
- `text-gray-600` → `text-gray-700` or `text-gray-800` (for important text)

### Files Updated

1. **ExplanationChatbot.tsx** ✓
   - Changed chatbot intro text from `text-gray-600` to `text-gray-700`

2. **Layer4Counterfactual.tsx** - Needs review
   - Slider labels and descriptions
   - Solution descriptions

3. **DecisionHeader.tsx** - Needs review
   - Subtitle text

4. **Layer2Dashboard.tsx** - Needs review
   - Feature descriptions
   - Impact percentages

5. **InfoTooltip.tsx** - Needs review
   - Tooltip text

### WCAG Contrast Standards
- **AA Standard (Minimum):** 4.5:1 for normal text, 3:1 for large text
- **AAA Standard (Enhanced):** 7:1 for normal text, 4.5:1 for large text

### Recommended Colors for White Background
- ✅ `text-gray-700` - Contrast ratio: 8.59:1 (AAA)
- ✅ `text-gray-800` - Contrast ratio: 11.63:1 (AAA)
- ✅ `text-gray-900` - Contrast ratio: 15.30:1 (AAA)
- ⚠️  `text-gray-600` - Contrast ratio: 5.74:1 (AA)
- ❌ `text-gray-500` - Contrast ratio: 3.94:1 (Fails AA)
- ❌ `text-gray-400` - Contrast ratio: 2.84:1 (Fails AA)
