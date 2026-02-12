import type { EnvironmentProviders } from '@angular/core';
import { PLATFORM_ID, inject, makeEnvironmentProviders } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import { CLOCK, CONFIRMATION, OBJECT_URL, UUID } from './tokens/platform.token';
import { BrowserClockService } from '../../infrastructure/platform/browser-clock.service';
import {
  BrowserConfirmationService,
  NoopConfirmationService,
} from '../../infrastructure/platform/browser-confirmation.service';
import {
  BrowserObjectUrlService,
  NoopObjectUrlService,
} from '../../infrastructure/platform/browser-object-url.service';
import {
  BrowserUuidService,
  NoopUuidService,
} from '../../infrastructure/platform/browser-uuid.service';

const createConfirmation = () =>
    isPlatformBrowser(inject(PLATFORM_ID))
      ? new BrowserConfirmationService()
      : new NoopConfirmationService(),
  createObjectUrl = () =>
    isPlatformBrowser(inject(PLATFORM_ID))
      ? new BrowserObjectUrlService()
      : new NoopObjectUrlService(),
  createUuid = () =>
    isPlatformBrowser(inject(PLATFORM_ID)) ? new BrowserUuidService() : new NoopUuidService();

export const providePlatformPorts = (): EnvironmentProviders =>
  makeEnvironmentProviders([
    {
      provide: CONFIRMATION,
      useFactory: createConfirmation,
    },
    {
      provide: CLOCK,
      useClass: BrowserClockService,
    },
    {
      provide: UUID,
      useFactory: createUuid,
    },
    {
      provide: OBJECT_URL,
      useFactory: createObjectUrl,
    },
  ]);
