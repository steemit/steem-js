/**
 * Type declarations for Api class
 * This file provides type definitions for dynamically generated methods
 */

import type { ApiMethodSignatures } from './types';

// Use declaration merging to add method signatures to Api class
declare module './index' {
  interface Api extends ApiMethodSignatures {
    // Methods are already defined in ApiMethodSignatures
    // This declaration merge adds them to the Api class
  }
}
