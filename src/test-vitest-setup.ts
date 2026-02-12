import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';

try {
  getTestBed().initTestEnvironment(BrowserTestingModule, platformBrowserTesting());
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const isAlreadyInitialized = message.includes('Cannot set base providers');

  if (!isAlreadyInitialized) {
    throw error;
  }
}
