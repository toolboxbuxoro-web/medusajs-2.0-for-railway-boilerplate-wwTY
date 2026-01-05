/**
 * Simple store for active A/B experiments encountered during the session.
 * Helps attach experiment context to global events like add_to_cart.
 */

export interface ExperimentContext {
  name: string;
  variant: string;
}

// Memory-only store for the current session
const activeExperiments = new Map<string, string>();

export function registerExperiment(name: string, variant: string) {
  if (!name || !variant) return;
  activeExperiments.set(name, variant);
}

export function getActiveExperiments(): ExperimentContext[] {
  return Array.from(activeExperiments.entries()).map(([name, variant]) => ({
    name,
    variant,
  }));
}

export function clearExperiments() {
  activeExperiments.clear();
}
