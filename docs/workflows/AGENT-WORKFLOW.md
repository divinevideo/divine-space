# Workflows: Agent-Based Development

> **Principle**: Use specialized agents for planning, implementation, review, and acceptance.

## Overview

Development follows a multi-agent workflow where different AI agents handle different stages of the development lifecycle. This ensures:
- Separation of concerns
- Quality checkpoints
- Consistent code standards
- Comprehensive testing

---

## Agent Roles

### 1. Planning Agent (Explore/Plan)

**Purpose**: Research, design, and plan implementation before writing code.

**Capabilities**:
- Codebase exploration (Glob, Grep, Read)
- Research (WebSearch, WebFetch)
- Documentation reading
- Architecture design

**Triggers**:
- New feature requests
- Complex bug investigations
- Architecture decisions

**Output**:
- Implementation plan with tasks
- Technical decisions documented
- File list to modify
- Test strategy

**Example Prompt**:
```
Explore the codebase to understand how Top 8 Friends is currently implemented.
Research NIP-51 Kind 30000 specifications.
Design a migration plan from Kind 16793 to Kind 30000.
Output a step-by-step implementation plan.
```

---

### 2. Implementation Agent (general-purpose)

**Purpose**: Write code following the plan.

**Capabilities**:
- All tools (Read, Write, Edit, Bash, etc.)
- Code generation
- Test writing
- Documentation updates

**Triggers**:
- Approved implementation plan
- Bug fix with known solution
- Refactoring tasks

**Input**:
- Implementation plan from Planning Agent
- Specific task to complete

**Output**:
- Working code
- Unit tests
- Updated documentation

**Guidelines**:
- Follow TDD (write test first when appropriate)
- Use clean code principles
- Follow existing patterns in codebase
- Run tests after changes

**Example Prompt**:
```
Implement the following from the approved plan:
1. Create useTop8Friends hook using Kind 30000
2. Add migration utility for existing data
3. Write tests for all functions
4. Update NIP.md documentation

Follow TDD - write tests first, then implementation.
Run the test suite after each major change.
```

---

### 3. Review Agent (Plan or general-purpose)

**Purpose**: Review code changes for quality, correctness, and standards compliance.

**Capabilities**:
- Code reading
- Test execution
- Standards checking
- Documentation review

**Triggers**:
- Implementation complete
- Before PR creation
- After significant changes

**Checklist**:
- [ ] Code follows TypeScript best practices
- [ ] No `any` types used
- [ ] Tests cover new functionality
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No security issues
- [ ] Follows NIP specifications correctly
- [ ] Backward compatible
- [ ] Performance acceptable

**Output**:
- Review comments
- Required changes list
- Approval or rejection

**Example Prompt**:
```
Review the implementation of useTop8Friends hook.

Check:
1. Does it correctly implement NIP-51 Kind 30000?
2. Are all edge cases handled?
3. Do tests cover the main scenarios?
4. Is backward compatibility maintained?
5. Is documentation accurate?

Provide specific feedback for any issues found.
```

---

### 4. Revision Agent (general-purpose)

**Purpose**: Address review feedback and fix issues.

**Capabilities**:
- Same as Implementation Agent

**Triggers**:
- Review feedback received
- Test failures
- Bug reports

**Input**:
- Review comments
- Specific issues to fix

**Output**:
- Fixed code
- Updated tests
- Response to review comments

**Example Prompt**:
```
Address the following review feedback:
1. Add error handling for relay connection failures
2. Fix test that fails on empty Top 8
3. Update JSDoc comments for accuracy

Run tests after each fix to verify.
```

---

### 5. Acceptance Agent (Plan or Explore)

**Purpose**: Final verification before merge/deploy.

**Capabilities**:
- Full codebase access
- Test execution
- Integration testing
- Documentation review

**Triggers**:
- All reviews addressed
- Before merge to main
- Before release

**Checklist**:
- [ ] All tests pass
- [ ] Build succeeds
- [ ] No lint errors
- [ ] Documentation complete
- [ ] Interop tests pass (if applicable)
- [ ] Performance acceptable
- [ ] Security review complete

**Output**:
- Acceptance decision
- Final approval or blocking issues
- Release notes

**Example Prompt**:
```
Perform final acceptance testing for the Top 8 migration:

1. Run full test suite
2. Verify Kind 30000 events are correctly formatted
3. Test interop with Listr (if possible)
4. Verify backward compat with Kind 16793
5. Review all documentation changes
6. Confirm migration utility works

Provide final acceptance decision.
```

---

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Feature Request                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                  1. PLANNING AGENT                           │
│  - Research existing code                                    │
│  - Research NIPs/standards                                   │
│  - Design solution                                           │
│  - Create implementation plan                                │
│  - Define test strategy                                      │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
                    [Plan Review]
                          │
                    ┌─────┴─────┐
                    │ Approved? │
                    └─────┬─────┘
                   No │   │ Yes
                      │   │
            ┌─────────┘   └─────────┐
            ▼                       ▼
      [Revise Plan]   ┌─────────────────────────────────────┐
            │         │         2. IMPLEMENTATION AGENT      │
            │         │  - Write tests (TDD)                 │
            └────────►│  - Implement features                │
                      │  - Update documentation              │
                      │  - Run tests                         │
                      └─────────────────┬───────────────────┘
                                        │
                                        ▼
                      ┌─────────────────────────────────────┐
                      │           3. REVIEW AGENT            │
                      │  - Code quality check                │
                      │  - Test coverage check               │
                      │  - Standards compliance              │
                      │  - Security review                   │
                      └─────────────────┬───────────────────┘
                                        │
                                  ┌─────┴─────┐
                                  │ Approved? │
                                  └─────┬─────┘
                               No │     │ Yes
                                  │     │
                        ┌─────────┘     └─────────┐
                        ▼                         ▼
┌─────────────────────────────────┐   ┌─────────────────────────┐
│       4. REVISION AGENT         │   │   5. ACCEPTANCE AGENT   │
│  - Fix review issues            │   │  - Final testing        │
│  - Update tests                 │   │  - Integration tests    │
│  - Re-run tests                 │   │  - Documentation check  │
└───────────────┬─────────────────┘   │  - Approval decision    │
                │                     └───────────┬─────────────┘
                │                                 │
                └────────────►[Back to Review]    │
                                                  ▼
                                        ┌─────────────────┐
                                        │    COMPLETE     │
                                        │  - Merge PR     │
                                        │  - Deploy       │
                                        │  - Release      │
                                        └─────────────────┘
```

---

## Task Tracking with TaskCreate/TaskUpdate

### Creating Tasks

When starting a new feature, create tasks for tracking:

```typescript
// Planning phase
TaskCreate({
  subject: "Research NIP-51 Kind 30000 for Top 8",
  description: "Understand the NIP-51 specification for Follow Sets",
  activeForm: "Researching NIP-51"
});

TaskCreate({
  subject: "Design migration from Kind 16793 to Kind 30000",
  description: "Create migration plan with backward compatibility",
  activeForm: "Designing migration"
});

// Implementation phase
TaskCreate({
  subject: "Implement useTop8Friends hook",
  description: "Create React hook for managing Top 8 using Kind 30000",
  activeForm: "Implementing useTop8Friends"
});
```

### Updating Task Status

```typescript
// Starting work
TaskUpdate({ taskId: "1", status: "in_progress" });

// Completed
TaskUpdate({ taskId: "1", status: "completed" });

// Add dependency
TaskUpdate({ taskId: "2", addBlockedBy: ["1"] });
```

---

## Parallel Agent Execution

For independent tasks, agents can run in parallel:

```typescript
// Launch multiple agents for independent research
Task({
  subagent_type: "Explore",
  prompt: "Research how Nostree implements Kind 30003"
});

Task({
  subagent_type: "Explore",
  prompt: "Research how npub.pro implements Kind 30512"
});

// Wait for both, then synthesize
```

---

## Agent Communication

Agents communicate through:
1. **Task descriptions** - Clear prompts with context
2. **File artifacts** - Code, tests, documentation
3. **Task status** - Blocked, in progress, completed
4. **Git commits** - Versioned changes with messages

---

## Quality Gates

### Gate 1: Plan Approval
- [ ] Research complete
- [ ] Design documented
- [ ] Tasks created
- [ ] Test strategy defined

### Gate 2: Implementation Complete
- [ ] Code written
- [ ] Tests written
- [ ] Tests pass
- [ ] Documentation updated

### Gate 3: Review Passed
- [ ] Code quality acceptable
- [ ] No security issues
- [ ] Standards compliant
- [ ] Performance acceptable

### Gate 4: Acceptance
- [ ] All tests pass
- [ ] Build succeeds
- [ ] Integration works
- [ ] Ready for merge

---

## Error Handling

### When Tests Fail
1. Implementation Agent investigates
2. Creates fix or documents issue
3. Re-runs tests
4. Returns to Review if needed

### When Review Rejects
1. Review comments documented
2. Revision Agent addresses issues
3. Re-submits for Review
4. Cycle continues until approved

### When Acceptance Fails
1. Blocking issues documented
2. Returns to appropriate stage
3. May need Planning if design flawed
