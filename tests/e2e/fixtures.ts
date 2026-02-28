import { test as mailpitTest } from '../../src/fixtures';

// The mailpitUrl and mailpitDeleteAllOnStart options are configured in
// playwright.config.ts `use` block. This file just re-exports the test.
export const test = mailpitTest;

export { expect } from '@playwright/test';
