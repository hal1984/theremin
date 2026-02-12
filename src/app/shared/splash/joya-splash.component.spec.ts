import { Injector, runInInjectionContext } from '@angular/core';
import { describe, expect, it } from 'vitest';

import { JoyaSplashComponent } from './joya-splash.component';

describe('JoyaSplashComponent (class tests)', () => {
  const createComponent = (): JoyaSplashComponent => {
    const injector = Injector.create({ providers: [] });
    return runInInjectionContext(injector, () => new JoyaSplashComponent());
  };

  it('creates component instance', () => {
    const component = createComponent();
    expect(component).toBeTruthy();
  });

  it('defaults active input to false', () => {
    const component = createComponent();
    expect(component.active()).toBe(false);
  });
});
