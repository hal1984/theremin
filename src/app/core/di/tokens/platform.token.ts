import { InjectionToken } from '@angular/core';
import type { ClockPort } from '../../../application/ports/clock.port';
import type { ConfirmationPort } from '../../../application/ports/confirmation.port';
import type { ObjectUrlPort } from '../../../application/ports/object-url.port';
import type { UuidPort } from '../../../application/ports/uuid.port';

export const CONFIRMATION = new InjectionToken<ConfirmationPort>('CONFIRMATION');
export const CLOCK = new InjectionToken<ClockPort>('CLOCK');
export const UUID = new InjectionToken<UuidPort>('UUID');
export const OBJECT_URL = new InjectionToken<ObjectUrlPort>('OBJECT_URL');
