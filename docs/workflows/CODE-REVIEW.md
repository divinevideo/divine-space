# Workflows: Code Review Checklist

> **Purpose**: Ensure code quality and standards compliance before merge.

## Review Process

```
┌─────────────────┐
│  Code Submitted │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Automated Checks│ ← TypeScript, ESLint, Tests
└────────┬────────┘
         │
    ┌────┴────┐
    │ Pass?   │
    └────┬────┘
    No │ │ Yes
       │ │
       │ ▼
       │ ┌─────────────────┐
       │ │  Manual Review  │
       │ └────────┬────────┘
       │          │
       │     ┌────┴────┐
       │     │ Pass?   │
       │     └────┬────┘
       │    No │ │ Yes
       │       │ │
       ▼       ▼ ▼
┌─────────────────┐ ┌─────────────────┐
│ Request Changes │ │     Approve     │
└────────┬────────┘ └────────┬────────┘
         │                   │
         │                   ▼
         │          ┌─────────────────┐
         │          │      Merge      │
         │          └─────────────────┘
         │
         └──────► [Back to Code Submitted]
```

---

## Automated Checks

These must pass before manual review:

- [ ] **TypeScript**: `tsc --noEmit` passes
- [ ] **ESLint**: No errors (warnings acceptable)
- [ ] **Tests**: All tests pass
- [ ] **Build**: `npm run build` succeeds

---

## Manual Review Checklist

### 1. Code Quality

#### General
- [ ] Code is readable and self-documenting
- [ ] No commented-out code left behind
- [ ] No `console.log` statements (except intentional debugging)
- [ ] No hardcoded values that should be constants
- [ ] No magic numbers without explanation

#### TypeScript
- [ ] No `any` types used
- [ ] Interfaces/types properly defined
- [ ] Proper null/undefined handling
- [ ] Generic types used appropriately

#### React
- [ ] Components are appropriately sized (not too large)
- [ ] Props have proper types
- [ ] Hooks follow rules of hooks
- [ ] No unnecessary re-renders
- [ ] useCallback/useMemo used appropriately
- [ ] Keys provided for list items

### 2. Functionality

- [ ] Feature works as specified
- [ ] Edge cases handled
- [ ] Error states handled gracefully
- [ ] Loading states implemented
- [ ] Empty states implemented

### 3. Nostr Integration

#### Event Publishing
- [ ] Correct event kind used
- [ ] Tags follow NIP specification
- [ ] Required tags present
- [ ] NIP-31 `alt` tag for custom kinds
- [ ] Events signed properly

#### Event Querying
- [ ] Authors filter used for privileged operations
- [ ] Appropriate limits set
- [ ] Efficient query design (combined kinds)
- [ ] Proper error handling for relay failures

#### NIP Compliance
- [ ] Follows relevant NIP specifications
- [ ] Backward compatible with existing events
- [ ] Documented in NIP.md if custom

### 4. Security

- [ ] No XSS vulnerabilities (user input sanitized)
- [ ] No SQL injection (if applicable)
- [ ] CSS properly sanitized for custom styles
- [ ] No secrets in code
- [ ] Proper authentication checks
- [ ] Authors filter for admin operations

### 5. Performance

- [ ] No obvious performance issues
- [ ] Large lists virtualized
- [ ] Images optimized/lazy loaded
- [ ] Queries are efficient
- [ ] No unnecessary API calls

### 6. Testing

- [ ] New code has tests
- [ ] Tests cover main scenarios
- [ ] Tests cover edge cases
- [ ] Tests are readable and maintainable
- [ ] No flaky tests

### 7. Documentation

- [ ] Complex code has comments
- [ ] Public APIs have JSDoc
- [ ] NIP.md updated if custom events changed
- [ ] README updated if needed
- [ ] CHANGELOG updated if significant

### 8. Accessibility

- [ ] Semantic HTML used
- [ ] ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Focus states visible
- [ ] Color contrast sufficient

### 9. Mobile/Responsive

- [ ] Works on mobile screens
- [ ] Touch targets adequate (44x44 minimum)
- [ ] No horizontal scrolling
- [ ] Images scale appropriately

---

## Review Comments Guide

### Severity Levels

| Level | Meaning | Action |
|-------|---------|--------|
| 🔴 **Blocker** | Must fix before merge | Request changes |
| 🟠 **Major** | Should fix, but can discuss | Request changes |
| 🟡 **Minor** | Nice to fix, not required | Approve with comments |
| 🟢 **Nitpick** | Style preference | Approve with comments |
| 💡 **Suggestion** | Consider for future | Approve |

### Comment Templates

#### Blocker
```
🔴 **Blocker**: This query doesn't filter by authors, which is a security issue.
Anyone could publish events claiming to be admin actions.

```typescript
// Current (insecure)
nostr.query([{ kinds: [30078], '#d': ['admins'] }]);

// Should be
nostr.query([{ kinds: [30078], authors: ADMIN_PUBKEYS, '#d': ['admins'] }]);
```
```

#### Major
```
🟠 **Major**: Missing error handling for relay connection failures.
This could cause the app to crash if relays are unavailable.

Consider wrapping in try/catch and showing a user-friendly error.
```

#### Minor
```
🟡 **Minor**: This could be simplified using optional chaining.

```typescript
// Current
const name = user && user.metadata && user.metadata.name;

// Suggested
const name = user?.metadata?.name;
```
```

#### Nitpick
```
🟢 **Nitpick**: I prefer `const` over `let` here since it's not reassigned.
```

---

## Approval Criteria

### Must Have (Blockers)
- All automated checks pass
- No security vulnerabilities
- No breaking changes without migration
- Tests for new functionality

### Should Have (Majors)
- Error handling
- Loading states
- Documentation for complex code

### Nice to Have (Minors)
- Perfect code style
- Comprehensive edge case testing
- Performance optimizations

---

## Post-Merge Checklist

After merging:

- [ ] Verify deployment succeeds
- [ ] Smoke test in production/staging
- [ ] Monitor for errors
- [ ] Update related issues/tickets
- [ ] Notify stakeholders if user-facing

---

## Review Etiquette

### For Reviewers
- Be respectful and constructive
- Explain the "why" behind suggestions
- Acknowledge good code
- Be timely (< 24 hours ideal)
- Use severity levels appropriately

### For Authors
- Don't take feedback personally
- Respond to all comments
- Ask for clarification if needed
- Update code or explain reasoning
- Thank reviewers for their time
