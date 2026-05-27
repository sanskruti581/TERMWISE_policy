# TermsWise Components Quick Reference

## Fast Import Guide

### Utilities
```javascript
// Score naming (adaptive labels)
import { getAdaptiveScoreLabel } from '../utils/scoreLabelMapping.js';

// Percentage to qualitative conversion
import { 
  getSignalStrength,
  getConfidenceLevel,
  getEvidenceStrength
} from '../utils/signalStrength.js';

// Group clauses by semantic category
import { groupClausesByCategory } from '../utils/clauseGrouping.js';
```

### Components
```jsx
import AdaptiveScoreCard from '../components/AdaptiveScoreCard.jsx';
import CollapsibleSection from '../components/CollapsibleSection.jsx';
import SignalIndicator from '../components/SignalIndicator.jsx';
import ClassificationReasoningPanel from '../components/ClassificationReasoningPanel.jsx';
import ClauseGrouping from '../components/ClauseGrouping.jsx';
import EvidencePanel from '../components/EvidencePanel.jsx';
import EvidenceLinkedRecommendation from '../components/EvidenceLinkedRecommendation.jsx';
import ExportDropdown from '../components/ExportDropdown.jsx';
```

---

## Component API Reference

### AdaptiveScoreCard
**Replaces:** RiskScore component
**Purpose:** Context-aware score display

```jsx
<AdaptiveScoreCard
  score={75}                    // 0-100
  documentType="Loan Agreement" // Auto-generates label
  grade="B+"
  riskLevel="Medium"
/>
```

**Props:**
- `score` (number) - Score from 0-100
- `documentType` (string) - Document classification
- `grade` (string) - Grade letter (A-F)
- `riskLevel` (string) - Risk level text

---

### SignalIndicator
**Replaces:** ConfidenceBar component
**Purpose:** Qualitative strength visualization

```jsx
<SignalIndicator
  value={0.87}              // decimal 0-1 OR percent 0-100
  scale="decimal"           // "decimal" or "percent"
  label="Detection Strength"
  showExactPercent={false}  // Show exact % alongside label
  size="md"                 // "sm" | "md" | "lg"
/>
```

**Output:** "Strong signal" with colored bar

**Props:**
- `value` (number) - Value to visualize
- `scale` (string) - Whether value is decimal or percent
- `label` (string) - Optional label above bar
- `showExactPercent` (bool) - Show percentage text
- `size` (string) - Bar height size

---

### CollapsibleSection
**Purpose:** Progressive disclosure accordion

```jsx
<CollapsibleSection
  title="Advanced Analysis"
  defaultOpen={true}
  icon={FileSearch}  // Optional lucide icon
  borderColor="border-emerald-200 dark:border-emerald-900"
>
  <div>Section content here</div>
</CollapsibleSection>
```

**Props:**
- `title` (string) - Section heading
- `defaultOpen` (bool) - Initial state
- `icon` (component) - Optional lucide icon
- `borderColor` (string) - Tailwind border classes
- `titleClassName` (string) - Title custom styling
- `contentClassName` (string) - Content custom styling

---

### ClassificationReasoningPanel
**Purpose:** Explain document classification

```jsx
<ClassificationReasoningPanel
  documentType="Privacy Policy"
  strongSignals={[
    {
      label: "Data collection language",
      occurrences: 47,
      confidence: 0.98,
      dominance: 0.85
    }
  ]}
  rejectedAlternatives={[
    {
      type: "Terms of Service",
      reason: "Minimal personal data collection",
      score: 42
    }
  ]}
  dominantContext="Detected institutional language..."
  semanticRationale="High frequency of privacy-related terms..."
/>
```

---

### ClauseGrouping
**Purpose:** Group clauses by semantic category

```jsx
<ClauseGrouping
  groups={groupClausesByCategory(highlights)}
/>
```

**Automatic groups created:**
1. Penalties & Enforcement (rose)
2. Compliance & Obligations (amber)
3. Data & Privacy Rights (sky)
4. Financial & Payment Terms (purple)
5. Termination & Rights (emerald)
6. Limitation of Liability (slate)

---

### EvidencePanel
**Purpose:** Show evidence for a finding

```jsx
<EvidencePanel
  clause="penalty will be imposed on contractor"
  location="Section 4.2 - Enforcement"
  severity="HIGH"
  relevance={94}
  evidence={[
    "8 similar penalty clauses detected",
    "Average severity: HIGH",
    "Pattern: Enforcement Risk"
  ]}
  matchCount={8}
  actionable={true}
/>
```

---

### EvidenceLinkedRecommendation
**Purpose:** Recommendation with source evidence

```jsx
<EvidenceLinkedRecommendation
  recommendation="Review penalty clauses for enforceability"
  triggeringClause="penalty will be imposed on contractor"
  location="Section 4.2"
  severity="HIGH"
  relevance={94}
  evidence={['8 similar clauses', 'Avg severity: HIGH']}
  category="Enforcement Risk"
  actionable={true}
/>
```

---

### ExportDropdown
**Purpose:** Unified export menu

```jsx
<ExportDropdown analysis={analysis} />
```

**Options provided:**
- 📄 Export PDF Report
- 📋 Export JSON
- 📑 Download Evidence Report
- 📌 Copy Summary
- 🔗 Copy Shareable Link

---

## Utility Functions

### scoreLabelMapping.js

```javascript
// Get adaptive label for document type
import { getAdaptiveScoreLabel } from '../utils/scoreLabelMapping.js';

const config = getAdaptiveScoreLabel('Loan Agreement');
console.log(config.label);        // "Borrower Exposure Score"
console.log(config.description);  // "Measures borrower obligations..."
console.log(config.riskFramework); // "financial"

// Check if type has custom label
import { hasCustomScoreLabel } from '../utils/scoreLabelMapping.js';
if (hasCustomScoreLabel('Privacy Policy')) { ... }

// Get framework type
import { getRiskFramework } from '../utils/scoreLabelMapping.js';
const framework = getRiskFramework('Privacy Policy'); // "privacy-focused"
```

---

### signalStrength.js

```javascript
import {
  getSignalStrength,
  getConfidenceLevel,
  getEvidenceStrength,
  getSignalColors,
  formatSignal,
  cleanJargon
} from '../utils/signalStrength.js';

// Convert to signal label
getSignalStrength(0.87)        // "Strong signal"
getSignalStrength(65, 'percent') // "Moderate signal"

// Confidence labels
getConfidenceLevel(0.92)       // "High confidence"

// Evidence labels
getEvidenceStrength(0.55)      // "Moderate evidence"

// Get Tailwind color classes
const colors = getSignalColors(0.87);
// { bg: '...', text: '...', border: '...', badge: '...' }

// Format with optional percentage
formatSignal(0.87, 'decimal', false)  // "Strong signal"
formatSignal(0.87, 'decimal', true)   // "Strong signal (87%)"

// Clean academic jargon
cleanJargon("semantic dominance score")
// "primary signal score"
```

---

### clauseGrouping.js

```javascript
import {
  groupClausesByCategory,
  getMergedExplanation,
  getCategoryStats,
  getDominantPatterns
} from '../utils/clauseGrouping.js';

// Group clauses
const groups = groupClausesByCategory(highlights);
// Returns: [{ name, description, color, clauses }, ...]

// Get merged explanation for a group
const explanation = getMergedExplanation(group.clauses);
// Returns combined explanation text

// Get statistics
const stats = getCategoryStats(groups);
// { totalClauses, categoryCount, highestSeverityPerGroup }

// Get dominant patterns
const patterns = getDominantPatterns(group.clauses);
// [{ pattern, count }, ...]
```

---

## Common Patterns

### Display Score with Label
```jsx
<AdaptiveScoreCard
  score={analysis.score}
  documentType={analysis.documentType}
  grade={analysis.grade}
  riskLevel={analysis.riskLevel}
/>
```

### Show Theme Strength
```jsx
{report.themeDominance.map((theme) => (
  <SignalIndicator
    key={theme.label}
    value={theme.confidence || theme.share}
    label={theme.label}
    size="md"
  />
))}
```

### Progressive Disclosure Section
```jsx
<CollapsibleSection
  title="Advanced Evidence"
  defaultOpen={false}
  icon={FileSearch}
>
  {/* Advanced content */}
</CollapsibleSection>
```

### Group and Display Clauses
```jsx
import { groupClausesByCategory } from '../utils/clauseGrouping.js';

const groups = groupClausesByCategory(report.highlights);
<ClauseGrouping groups={groups} />
```

### Link Recommendation to Evidence
```jsx
<EvidenceLinkedRecommendation
  recommendation={rec.text}
  triggeringClause={rec.triggeringClause}
  location={rec.location}
  severity={rec.severity}
  evidence={rec.evidence}
/>
```

---

## Dark Mode Support

All components fully support dark mode:

```jsx
// Automatic dark mode handling
<SignalIndicator />  // Works in light & dark

// Custom colors adjust automatically
<CollapsibleSection
  borderColor="border-emerald-200 dark:border-emerald-900"
/>
```

---

## Responsive Design

All components are mobile-first responsive:

```jsx
// Automatically responsive
<ClauseGrouping groups={groups} />

// Adapt to screen sizes:
// < 768px: Single column
// >= 768px: Multi-column grid
// >= 1024px: Optimized layout
```

---

## Tailwind Classes Used

```css
/* Spacing scale */
gap-2, gap-3, gap-4, gap-5, gap-6
px-3, px-4, px-5, px-6
py-2, py-3, py-4, py-6
p-3, p-4, p-5, p-6

/* Typography */
text-xs, text-sm, text-base, text-lg, text-xl, text-2xl
font-semibold, font-bold, font-black
tracking-wide

/* Colors (Dark mode included) */
bg-slate-50 dark:bg-slate-950/30
text-slate-900 dark:text-slate-50
border-slate-200 dark:border-slate-800

/* Layout */
rounded-lg, rounded-md, rounded-full
border, border-2, border-l-4

/* Responsive */
md:, lg:, sm:
grid-cols-2, grid-cols-3
```

---

## Accessibility Notes

✅ All components keyboard accessible
✅ ARIA labels on interactive elements
✅ Proper heading hierarchy
✅ Color-independent information
✅ Focus visible states

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

---

## Performance Tips

- Use `React.memo()` for components in lists
- Lazy load advanced sections with `CollapsibleSection`
- Group large clause lists with `ClauseGrouping`
- Memoize signal calculations

---

## Troubleshooting

**SignalIndicator not showing label?**
```jsx
// Add label prop
<SignalIndicator value={0.87} label="Strength" />
```

**CollapsibleSection not toggling?**
```jsx
// Ensure you're using CollapsibleSection (not custom accordion)
import CollapsibleSection from '../components/CollapsibleSection.jsx';
```

**Adaptive score showing generic label?**
```jsx
// Check documentType is passed and matches mapping
<AdaptiveScoreCard
  documentType="Privacy Policy"  // Must match exact map key
  score={score}
  grade={grade}
  riskLevel={riskLevel}
/>
```

---

## Documentation

- Full strategy: `UX_REFACTORING_STRATEGY.md`
- Implementation guide: `IMPLEMENTATION_COMPLETE.md`
- Component source code: `frontend/src/components/`
- Utility source code: `frontend/src/utils/`

---

Last Updated: 2026-05-27
