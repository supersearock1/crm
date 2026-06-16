# CRM Full System Test Checklist

Use this checklist to manually verify the complete app: auth, admin dashboard, and agent dashboard.

---

## 1) Test Data & Environment Setup

- [ ] App runs locally without build/runtime errors.
- [ ] Supabase keys and required env vars are present in `.env.local`.
- [ ] At least **1 primary admin** test account exists.
- [ ] At least **2 agent** test accounts exist (one active, one blocked if possible).
- [ ] Seeded leads exist across multiple statuses (`new`, `assigned`, `follow_up`, `interested`, `closed`, `lost`).
- [ ] Follow-up tasks exist for today, overdue, and completed states.
- [ ] Notifications exist for both admin and agent users.

---

## 2) Public/Auth Flows

### 2.1 Login Page (`/login`)
- [ ] Page loads with no console errors.
- [ ] Email/password fields validate required input.
- [ ] Submit button shows loading state while request is in progress.
- [ ] Wrong password shows inline error message.
- [ ] On repeated failed login attempts, URL does **not** keep growing with new error params.
- [ ] Correct admin credentials sign in successfully.
- [ ] Correct agent credentials sign in successfully.

### 2.2 Forgot Password (`/forgot-password`)
- [ ] Page loads and form submits.
- [ ] Submit button shows loading state while sending reset link.
- [ ] Success message appears inline.
- [ ] Invalid email format is blocked by client validation.
- [ ] Error state appears inline when backend returns an error.

### 2.3 Reset Password (`/reset-password`)
- [ ] Valid reset link opens reset page and allows password update.
- [ ] Update button shows loading state (`Updating...`).
- [ ] Success path redirects back to login.
- [ ] Expired/invalid token shows clear error.
- [ ] Password min length requirement is enforced.

### 2.4 Auth Route Guarding
- [ ] Logged-in user opening `/login` is redirected to dashboard automatically.
- [ ] Logged-in user opening `/forgot-password` is redirected.
- [ ] Logged-in user opening `/reset-password` is redirected.
- [ ] Logged-out user can access auth pages.

---

## 3) Session, Role & Access Control

- [ ] Logged-out access to `/admin/*` redirects to login.
- [ ] Logged-out access to `/dashboard/*` redirects to login.
- [ ] Agent cannot access admin pages.
- [ ] Admin cannot access agent-only route incorrectly (should route appropriately).
- [ ] Blocked user cannot proceed; receives proper blocked-account handling.
- [ ] Logout clears session and returns to login page.

---

## 4) Admin Dashboard & Modules

## 4.1 Admin Layout / Navigation
- [ ] Sidebar links open correct pages.
- [ ] Signed-in admin email shows correctly.
- [ ] Logout button works.
- [ ] Toast appears in **bottom-right**.

### 4.2 Admin Dashboard (`/admin/dashboard`)
- [ ] KPI/summary cards load with real data.
- [ ] Charts/analytics render correctly (no NaN/empty crashes).
- [ ] Realtime refresh behavior updates metrics when data changes.

### 4.3 Notifications (`/admin/notifications`)
- [ ] Notifications list loads.
- [ ] Read/unread behavior works.
- [ ] New notifications appear correctly.

### 4.4 Agents Management (`/admin/agents`)
- [ ] Agent list loads.
- [ ] Add/edit agent flow works.
- [ ] Block/unblock (or status change) works and persists.
- [ ] Role/status changes are reflected after refresh.

### 4.5 Leads (`/admin/leads`)
- [ ] Leads list loads with expected fields.
- [ ] Search/filter behavior works.
- [ ] Lead status updates save correctly.
- [ ] Assign/reassign lead to agents works.

### 4.6 Distribution (`/admin/distribution`)
- [ ] Distribution rules/settings load.
- [ ] Updating distribution config persists correctly.
- [ ] New lead assignment follows configured distribution behavior.

### 4.7 Follow-ups (`/admin/follow-ups`)
- [ ] Follow-up tasks list loads.
- [ ] Create/edit follow-up task works.
- [ ] Mark complete/pending works.
- [ ] Overdue and upcoming tasks display correctly.

### 4.8 Reports (`/admin/reports`)
- [ ] Report data loads for selected date ranges.
- [ ] Metrics align with known sample data.
- [ ] Empty-state handling works for no data.

### 4.9 Settings (`/admin/settings`)
- [ ] Settings form loads.
- [ ] Editable settings save successfully.
- [ ] Validation prevents invalid values.
- [ ] Saved settings persist after reload.

---

## 5) Agent Dashboard & Modules

### 5.1 Agent Dashboard (`/dashboard`)
- [ ] KPI cards render correctly for logged-in agent only.
- [ ] Analytics chart renders with valid values.
- [ ] Realtime refresh updates content when backend changes occur.

### 5.2 Agent Leads (`/dashboard/leads`)
- [ ] Only assigned leads are visible.
- [ ] Status changes / updates work where allowed.
- [ ] Lead details render without errors.

### 5.3 Agent Follow-ups (`/dashboard/follow-ups`)
- [ ] Pending follow-ups are listed.
- [ ] Complete action updates task state.
- [ ] Due/overdue grouping is accurate.

### 5.4 Agent Notifications (`/dashboard/notifications`)
- [ ] Notification feed loads for current agent.
- [ ] Mark-as-read behavior works.
- [ ] New notifications appear correctly.

---

## 6) UX, Error Handling & Performance

- [ ] All submit actions show loading states (no double-submit confusion).
- [ ] Error messages are human-readable.
- [ ] No broken links in auth/admin/agent navigation.
- [ ] No major layout breakage on mobile width.
- [ ] No major layout breakage on desktop width.
- [ ] Browser console stays free of critical errors.
- [ ] Slow network (Fast 3G simulation) still shows proper loaders and does not freeze.

---

## 7) Security & Data Integrity

- [ ] Unauthorized API/data access is blocked by RLS/policies.
- [ ] Admin-only actions fail for non-admin user.
- [ ] Agent can only read/update allowed records.
- [ ] Password reset token cannot be reused indefinitely.
- [ ] Session invalidation after logout is confirmed.

---

## 8) Final Regression Sign-off

- [ ] Auth flow fully passes (login, forgot, reset, guard behavior).
- [ ] Admin critical flows pass (agents, leads, distribution, follow-ups).
- [ ] Agent critical flows pass (dashboard, leads, follow-ups, notifications).
- [ ] No blocker bugs remain.
- [ ] Ready for production/staging demo.

---

## Optional: Bug Log Template

Use this format when you find issues during testing:

- **Module**:
- **Scenario**:
- **Steps to Reproduce**:
- **Expected Result**:
- **Actual Result**:
- **Severity**: (Blocker/High/Medium/Low)
- **Screenshot/Video**:

