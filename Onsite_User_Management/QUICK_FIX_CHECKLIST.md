# Quick Fix Checklist - TypeScript Migration

## 🔴 CRITICAL - DO BEFORE PRODUCTION (2-3 days)

### Security Fixes
- [ ] **Remove hardcoded credentials** in `backend/app/core/config.py`
  ```python
  # Change from:
  SECRET_KEY: str = "your-secret-key-change-in-production"
  # To:
  SECRET_KEY: str = os.getenv("SECRET_KEY")
  if not SECRET_KEY:
      raise ValueError("SECRET_KEY must be set in environment")
  ```

- [ ] **Move tokens from localStorage to httpOnly cookies**
  - Update `frontend/src/services/api.ts`
  - Update `frontend/src/pages/Login.tsx`
  - Implement CSRF protection

- [ ] **Add input sanitization**
  ```bash
  npm install dompurify @types/dompurify
  ```

- [ ] **Configure production environment variables**
  - Create `.env.production` (don't commit!)
  - Set strong `SECRET_KEY`
  - Set secure `DATABASE_URL`
  - Set `ADMIN_PASSWORD`

---

## 🟡 HIGH PRIORITY - Week 1

### Remove Type Duplicates (25+ instances)

#### 1. Centralize `CourseType` (7 duplicates)
```bash
# Files to update:
frontend/src/pages/Courses/utils/courseFilters.ts
frontend/src/pages/Dashboard/hooks/useDashboardData.ts
frontend/src/pages/Dashboard/index.tsx
frontend/src/components/UserDetailsDialog.tsx
frontend/src/App.tsx
```

**Action:**
- Keep only in `types/index.ts`
- Remove from all other files
- Update imports: `import type { CourseType } from '@types';`

#### 2. Centralize `TimePeriod` (6 duplicates)
```bash
# Files to update:
frontend/src/pages/Courses/utils/courseFilters.ts
frontend/src/pages/Dashboard/hooks/useDashboardData.ts
frontend/src/pages/Dashboard/index.tsx
frontend/src/pages/Dashboard/components/StatCard.tsx
frontend/src/components/common/TimePeriodFilter.tsx
frontend/src/utils/dateRangeUtils.ts
```

#### 3. Centralize `EditingMentor` (3 duplicates)
```bash
# Files to update:
frontend/src/pages/CourseDetail/components/EditMentorDialog.tsx
frontend/src/pages/CourseDetail/utils/mentorHandlers.ts
```

#### 4. Centralize `MentorCost` (3 duplicates)
```bash
# Files to update:
frontend/src/pages/CourseDetail/components/EditCostsDialog.tsx
frontend/src/pages/CourseDetail/utils/costHandlers.ts
```

#### 5. Centralize `DraftMentorWithDetails` (6 duplicates)
```bash
# Files to update:
frontend/src/pages/CourseDetail/components/MentorsCard.tsx
frontend/src/pages/CourseDetail/components/CostBreakdownCard.tsx
frontend/src/pages/CourseDetail/hooks/useCourseDetailData.ts
frontend/src/pages/CourseDetail/utils/costHandlers.ts
frontend/src/pages/CourseDetail/utils/costCalculators.ts
```

---

### Remove Unused Code (22 instances)

#### Unused Imports to Remove:
```typescript
// src/App.tsx:27
- import { CoursesProps } from ...

// src/components/UserDetailsDialog.tsx:24
- import { OnlineCourse } from ...

// src/pages/CourseDetail/components/EditMentorDialog.tsx:12
- import { CourseMentor } from ...

// src/pages/CourseDetail/components/MentorsCard.tsx:22
- import { CourseMentor } from ...

// src/pages/CourseDetail/index.tsx:5
- import { Typography } from ...

// src/pages/CourseDetail/index.tsx:43
- import { CourseMentor } from ...

// src/pages/Courses/index.tsx:38
- import { Message } from ...

// src/pages/Dashboard/utils/courseFilters.ts:2
- import { getCourseEndDate } from ...

// src/pages/Users/index.tsx:1
- import { useEffect } from ...

// src/pages/Users/index.tsx:30-31
- import { ExpandMore, ExpandLess } from ...

// src/utils/courseUtils.ts:5
- import { Course } from ...
```

#### Unused Variables to Remove:
```typescript
// src/pages/CourseDetail/hooks/useCourseDetailData.ts:125
const mentorIds = ... // Remove

// src/pages/CourseDetail/hooks/useEnrollments.ts:19
const message = ... // Remove

// src/pages/CourseDetail/index.tsx:92
const setCourseMessage = ... // Remove or use

// src/pages/CourseDetail/index.tsx:93
const setCourse = ... // Remove or use

// src/pages/CourseDetail/index.tsx:100
const setEnrollments = ... // Remove or use

// src/pages/CourseDetail/index.tsx:136
const assignMentorLoading = ... // Remove or use

// src/pages/Courses/index.tsx:75
const courses = ... // Remove

// src/pages/Courses/index.tsx:172
const handleApprove = ... // Remove or use

// src/pages/Courses/index.tsx:176
const handleGenerate = ... // Remove or use

// src/pages/Courses/index.tsx:190
const handleMentorRemove = ... // Remove or use
```

---

### Fix Code Style Issues

#### Add Parentheses for Operator Precedence
```typescript
// src/pages/CourseDetail/utils/enrollmentFilters.ts:27, 43

// Change from:
enrollment.approval_status === 'approved' && enrollment.attendance_status === 'present' || 
enrollment.attendance_status === 'absent'

// To:
(enrollment.approval_status === 'approved' && enrollment.attendance_status === 'present') || 
enrollment.attendance_status === 'absent'
```

#### Fix React Hook Dependencies
```typescript
// src/pages/Courses/utils/courseFilters.ts:92
// Remove 'selectedDepartment' from useMemo dependencies if not used
```

---

## 🟢 MEDIUM PRIORITY - Week 2

### Configure Path Aliases

**Update `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "baseUrl": "src",
    "paths": {
      "@types/*": ["types/*"],
      "@components/*": ["components/*"],
      "@pages/*": ["pages/*"],
      "@utils/*": ["utils/*"],
      "@services/*": ["services/*"],
      "@hooks/*": ["hooks/*"]
    }
  }
}
```

**Update imports across all files:**
```typescript
// Old:
import { Course } from '../../../types';

// New:
import type { Course } from '@types';
```

---

### Reorganize Type Definitions

**Create new structure:**
```
types/
├── index.ts          # Re-exports all
├── common.ts         # TimePeriod, CourseType, etc.
├── course.ts         # Course-related types
├── mentor.ts         # Mentor-related types
├── enrollment.ts     # Enrollment-related types
├── student.ts        # Student-related types
└── api.ts           # API request/response types
```

---

## 🔵 LOW PRIORITY - Ongoing

### Add Error Boundaries
```typescript
// components/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  // Implementation
}
```

### Consolidate Date Utilities
- Merge duplicate date formatting functions
- Create single source of truth in `utils/dateUtils.ts`

### Add Tests
- Unit tests for utilities
- Integration tests for API calls
- E2E tests for critical flows

---

## Quick Commands

### Check for unused code:
```bash
cd frontend
npx eslint src --ext .ts,.tsx --format=compact | grep "never used"
```

### Find duplicate type definitions:
```bash
grep -r "^export type CourseType" src/
grep -r "^export type TimePeriod" src/
grep -r "^interface EditingMentor" src/
```

### Run TypeScript compiler:
```bash
npm run build
```

### Check bundle size:
```bash
npm run build
ls -lh build/static/js/*.js
```

---

## Progress Tracking

### Critical (Must do before production)
- [ ] Security: Credentials
- [ ] Security: Token storage
- [ ] Security: Input sanitization
- [ ] Security: Environment variables

### High Priority (Week 1)
- [ ] Remove type duplicates (25+)
- [ ] Remove unused code (22)
- [ ] Fix code style (4)
- [ ] Fix React hooks (1)

### Medium Priority (Week 2)
- [ ] Configure path aliases
- [ ] Reorganize types
- [ ] Consolidate utilities
- [ ] Add error boundaries

### Low Priority (Ongoing)
- [ ] Add tests
- [ ] Performance optimization
- [ ] Documentation
- [ ] Monitoring

---

**Last Updated:** November 25, 2025  
**See Full Report:** `TYPESCRIPT_MIGRATION_AUDIT.md`

