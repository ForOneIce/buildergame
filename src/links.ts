import { safeUrl } from './model.mjs';
import type { Project } from './types';

// Future ENS resolution belongs behind this boundary; the basic town uses HTTPS.
export function projectDestination(project: Project): string {
  return safeUrl(project.homepage) ?? project.repository;
}
