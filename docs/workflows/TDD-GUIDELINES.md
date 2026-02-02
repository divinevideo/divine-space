# Workflows: Test-Driven Development Guidelines

> **Principle**: Write tests first, implement second, refactor third.

## TDD Cycle

```
┌─────────────────┐
│   1. RED        │  Write a failing test
│   (Test First)  │  that defines expected behavior
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   2. GREEN      │  Write minimal code
│   (Make Pass)   │  to make the test pass
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   3. REFACTOR   │  Clean up the code
│   (Improve)     │  while keeping tests green
└────────┬────────┘
         │
         └──────────► Repeat
```

---

## When to Use TDD

### Always Use TDD For:
- New hooks (useTop8Friends, useMoodStatus, etc.)
- Parsing/serialization functions
- Business logic
- Data transformations
- Utility functions

### Consider TDD For:
- Complex component logic
- State management
- API integrations

### Skip TDD For:
- Simple UI components (test after)
- Styling changes
- Configuration changes
- Documentation

---

## Test Structure

### File Organization

```
src/
├── hooks/
│   ├── useTop8Friends.ts
│   └── useTop8Friends.test.ts    # Co-located test
├── lib/
│   ├── parseTop8.ts
│   └── parseTop8.test.ts
└── components/
    ├── Top8Widget/
    │   ├── Top8Widget.tsx
    │   └── Top8Widget.test.tsx
```

### Test File Template

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import { useTop8Friends } from './useTop8Friends';

// Mock nostr
vi.mock('@nostrify/react', () => ({
  useNostr: () => ({
    nostr: {
      query: vi.fn(),
    },
  }),
}));

describe('useTop8Friends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('querying', () => {
    it('should query Kind 30000 with correct filter', async () => {
      // Arrange
      const pubkey = 'test-pubkey';

      // Act
      const { result } = renderHook(
        () => useTop8Friends(pubkey),
        { wrapper: TestApp }
      );

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should return empty array when no Top 8 exists', async () => {
      // Test implementation
    });

    it('should fall back to Kind 16793 for legacy profiles', async () => {
      // Test implementation
    });
  });

  describe('parsing', () => {
    it('should parse p tags into TopFriend objects', () => {
      // Test implementation
    });

    it('should respect position order', () => {
      // Test implementation
    });
  });

  describe('mutations', () => {
    it('should publish Kind 30000 event when adding friend', async () => {
      // Test implementation
    });
  });
});
```

---

## Testing Patterns

### 1. Arrange-Act-Assert (AAA)

```typescript
it('should parse Top 8 from Kind 30000 event', () => {
  // Arrange - set up test data
  const event: NostrEvent = {
    kind: 30000,
    tags: [
      ['d', 'top8'],
      ['p', 'pubkey1', '', 'Alice'],
      ['p', 'pubkey2', '', 'Bob'],
    ],
    // ... other fields
  };

  // Act - call the function
  const result = parseTop8FromEvent(event);

  // Assert - verify behavior
  expect(result).toHaveLength(2);
  expect(result[0]).toEqual({
    pubkey: 'pubkey1',
    petname: 'Alice',
    position: 1,
  });
});
```

### 2. Given-When-Then (BDD Style)

```typescript
describe('when user has no Top 8', () => {
  it('then should return empty array', async () => {
    // Given
    const pubkey = 'user-with-no-top8';
    mockNostrQuery([]);

    // When
    const { result } = renderHook(() => useTop8Friends(pubkey));

    // Then
    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });
});
```

### 3. Table-Driven Tests

```typescript
describe('parseStatusType', () => {
  const testCases = [
    { input: 'general', expected: 'mood' },
    { input: 'music', expected: 'nowPlaying' },
    { input: 'profile_song', expected: 'profileSong' },
    { input: 'unknown', expected: null },
  ];

  testCases.forEach(({ input, expected }) => {
    it(`should return ${expected} for d-tag "${input}"`, () => {
      expect(parseStatusType(input)).toBe(expected);
    });
  });
});
```

---

## Mocking Strategies

### Mock Nostr Queries

```typescript
import { vi } from 'vitest';

const mockQuery = vi.fn();

vi.mock('@nostrify/react', () => ({
  useNostr: () => ({
    nostr: {
      query: mockQuery,
    },
  }),
}));

// In test
it('should query with correct filter', async () => {
  mockQuery.mockResolvedValueOnce([mockEvent]);

  renderHook(() => useTop8Friends('pubkey'));

  expect(mockQuery).toHaveBeenCalledWith([{
    kinds: [30000],
    authors: ['pubkey'],
    '#d': ['top8'],
    limit: 1,
  }]);
});
```

### Mock Event Publishing

```typescript
const mockPublish = vi.fn();

vi.mock('@/hooks/useNostrPublish', () => ({
  useNostrPublish: () => ({
    mutate: mockPublish,
    mutateAsync: mockPublish,
  }),
}));

it('should publish Kind 30000 when saving', async () => {
  const { result } = renderHook(() => useTop8Friends('pubkey'));

  await result.current.addFriend('new-pubkey');

  expect(mockPublish).toHaveBeenCalledWith(
    expect.objectContaining({
      kind: 30000,
    })
  );
});
```

---

## Test Categories

### Unit Tests

Test individual functions in isolation:

```typescript
// lib/parseTop8.test.ts
describe('parseTop8FromEvent', () => {
  it('should extract friends from p tags', () => {
    const event = createMockEvent({ /* ... */ });
    const result = parseTop8FromEvent(event);
    expect(result).toMatchSnapshot();
  });
});
```

### Integration Tests

Test hooks with mocked dependencies:

```typescript
// hooks/useTop8Friends.test.ts
describe('useTop8Friends integration', () => {
  it('should load and display Top 8', async () => {
    mockQuery.mockResolvedValueOnce([mockTop8Event]);

    const { result } = renderHook(
      () => useTop8Friends('pubkey'),
      { wrapper: TestApp }
    );

    await waitFor(() => {
      expect(result.current.data).toHaveLength(8);
    });
  });
});
```

### Component Tests

Test React components with Testing Library:

```typescript
// components/Top8Widget.test.tsx
describe('Top8Widget', () => {
  it('should render all 8 friends', () => {
    render(
      <TestApp>
        <Top8Widget friends={mockFriends} />
      </TestApp>
    );

    mockFriends.forEach(friend => {
      expect(screen.getByText(friend.petname)).toBeInTheDocument();
    });
  });
});
```

---

## Test Coverage Requirements

| Category | Minimum Coverage | Target Coverage |
|----------|-----------------|-----------------|
| Hooks | 80% | 90% |
| Utilities | 90% | 95% |
| Components | 70% | 80% |
| Overall | 80% | 85% |

### Coverage Commands

```bash
# Run tests with coverage
npm run test -- --coverage

# View coverage report
open coverage/index.html
```

---

## Common Testing Mistakes

### 1. Testing Implementation, Not Behavior

```typescript
// ❌ Bad - tests implementation details
it('should call setState with new value', () => {
  const setState = vi.fn();
  // ...
  expect(setState).toHaveBeenCalledWith('new-value');
});

// ✅ Good - tests behavior
it('should display new value after update', async () => {
  render(<Component />);
  await userEvent.click(screen.getByRole('button'));
  expect(screen.getByText('new-value')).toBeInTheDocument();
});
```

### 2. Not Testing Edge Cases

```typescript
// ✅ Good - tests edge cases
describe('parseTop8', () => {
  it('should return empty array for event with no p tags', () => {});
  it('should handle malformed p tags gracefully', () => {});
  it('should limit to 8 friends even if more exist', () => {});
  it('should handle missing petnames', () => {});
});
```

### 3. Flaky Async Tests

```typescript
// ❌ Bad - may be flaky
it('should load data', async () => {
  render(<Component />);
  await new Promise(r => setTimeout(r, 100)); // Don't do this
  expect(screen.getByText('loaded')).toBeInTheDocument();
});

// ✅ Good - uses waitFor
it('should load data', async () => {
  render(<Component />);
  await waitFor(() => {
    expect(screen.getByText('loaded')).toBeInTheDocument();
  });
});
```

---

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- useTop8Friends

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test by name
npm test -- -t "should parse Top 8"
```

---

## Test Checklist

Before marking implementation complete:

- [ ] All new functions have tests
- [ ] Edge cases covered
- [ ] Error cases covered
- [ ] Tests pass locally
- [ ] Coverage meets minimum requirements
- [ ] No flaky tests
- [ ] Test names are descriptive
- [ ] AAA pattern followed
