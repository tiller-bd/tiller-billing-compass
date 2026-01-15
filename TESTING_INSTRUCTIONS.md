# Testing Instructions

This document provides instructions on how to run, write, and maintain tests for this project.

## Overview

This project uses [Jest](https://jestjs.io/) as the testing framework and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for testing React components.

- **Jest:** A delightful JavaScript Testing Framework with a focus on simplicity.
- **React Testing Library:** A library for testing React components in a way that resembles how users interact with them.

## Running Tests

You can run tests using the `npm test` command.

### Running All Tests

To run all tests in the project, run the following command:

```bash
npm test
```

### Running Tests for a Specific File

To run tests for a specific file, you can pass the filename as an argument to the `npm test` command:

```bash
npm test -- src/app/__tests__/page.test.tsx
```

### Running Tests in Watch Mode

To run tests in watch mode, which automatically re-runs tests when you save a file, use the `--watch` flag:

```bash
npm test -- --watch
```

## Writing Tests

### File Naming and Location

Tests for a component or API route should be located in a `__tests__` directory within the same directory as the file being tested. The test file should have the same name as the file it's testing, but with a `.test.tsx` extension.

For example, the tests for `src/app/page.tsx` are in `src/app/__tests__/page.test.tsx`.

### Basic Test Structure

A test file typically has the following structure:

```javascript
describe('Component or API Route Name', () => {
  it('should do something', () => {
    // Test logic here
    expect(true).toBe(true);
  });
});
```

- `describe`: A block that groups together several related tests.
- `it` or `test`: A function that runs a single test.
- `expect`: A function that you use to make assertions.

### Frontend Component Tests

Here's an example of a simple component test:

```javascript
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders a heading', () => {
    render(<MyComponent />);

    const heading = screen.getByRole('heading', { name: /welcome/i });

    expect(heading).toBeInTheDocument();
  });
});
```

- **`render`:** Renders the component into a virtual DOM.
- **`screen`:** An object that has methods to query the virtual DOM (e.g., `getByRole`, `getByText`).

#### Simulating User Interactions

You can use `fireEvent` or `@testing-library/user-event` to simulate user interactions like clicks and input changes.

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

it('updates when the button is clicked', () => {
  render(<MyComponent />);

  const button = screen.getByRole('button', { name: /click me/i });
  fireEvent.click(button);

  // Assert that the component updated as expected
});
```

#### Mocking API Calls

When testing components that make API calls, you should mock the `fetch` function to avoid making real network requests. You can do this in your test file:

```javascript
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: 'mocked data' }),
  })
) as jest.Mock;
```

### Backend API Route Tests

Here's an example of a simple API route test:

```javascript
import { GET } from '../route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

jest.mock('@/lib/prisma', () => ({
  prisma: {
    // Mock prisma models and methods here
  },
}));

describe('My API Route', () => {
  it('should return a successful response', async () => {
    const request = new NextRequest('http://localhost/api/my-route');
    const response = await GET(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ message: 'Success' });
  });
});
```

## Maintaining Tests

### When to Update Tests

You should update tests whenever you:

-   **Change existing functionality:** If you change how a component or API route behaves, you should update the corresponding tests to reflect the new behavior.
-   **Fix a bug:** When you fix a bug, it's a good practice to write a test that would have failed before the fix and passes after.
-   **Refactor code:** After refactoring, run the tests to ensure that you haven't accidentally broken anything.

### What to Do When a Test Fails

When a test fails, Jest will provide a detailed error message telling you which test failed and why.

1.  **Read the error message carefully:** The error message will often tell you exactly what went wrong (e.g., "Unable to find an element with the text: ...").
2.  **Check your code:** Make sure that the component or API route is behaving as expected.
3.  **Check your test:** Make sure that your test is correctly asserting the expected behavior.
4.  **Debug:** You can use `console.log` statements in your test file to inspect variables and see what's going on.

By following these guidelines, you can ensure that your application remains robust and maintainable as it grows.
