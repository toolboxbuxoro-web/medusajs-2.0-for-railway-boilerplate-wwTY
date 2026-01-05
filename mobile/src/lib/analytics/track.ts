/**
 * Centralized analytics tracking helper.
 * Designed to be fire-and-forget and non-blocking for the UI.
 * Easy to replace with Amplitude, Firebase, or other vendors later.
 */

import { getActiveExperiments } from './experiments';

export type AnalyticsEvent = 
  | 'section_impression' 
  | 'section_click' 
  | 'product_click'
  | 'add_to_cart'
  | 'checkout_start'
  | 'auth_request_otp'
  | 'auth_verify_success'
  | 'auth_verify_failed'
  | 'auth_logout';

export interface AnalyticsPayload {
  section_id?: string;
  section_type?: string;
  position?: number;
  product_id?: string;
  position_in_rail?: number;
  experiment_context?: Array<{ name: string; variant: string }>;
  [key: string]: any;
}

export function track(eventName: AnalyticsEvent, payload: AnalyticsPayload) {
  // Merge global experiment context for performance evaluation (A/B testing)
  const fullPayload = {
    ...payload,
    experiment_context: [
      ...(payload.experiment_context || []),
      ...getActiveExperiments()
    ].filter((v, i, a) => a.findIndex(t => t.name === v.name) === i) // Deduplicate
  };

  // Fire-and-forget: wrap in an async context or just execute
  if (__DEV__) {
    console.log(`[Analytics] ${eventName}:`, JSON.stringify(fullPayload, null, 2));
  }

  // Placeholder for future vendor implementation:
  // try {
  //   Amplitude.track(eventName, fullPayload);
  // } catch (e) {
  //   // Silent ignore on failure
  // }
}
