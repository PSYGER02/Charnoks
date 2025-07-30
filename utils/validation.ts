/**
 * Comprehensive Validation System
 * Provides consistent validation across frontend and backend
 */

import type { Product, Sale, Expense, Note } from '../types';
import { ValidationError } from './errorHandler';

/**
 * Validation rule interface
 */
export interface ValidationRule<T> {
  field: keyof T;
  rules: Array<(value: any, data?: Partial<T>) => string | null>;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Generic validator class
 */
export class Validator<T> {
  constructor(private rules: ValidationRule<T>[]) {}

  /**
   * Validate entire object
   */
  validate(data: Partial<T>): ValidationResult {
    const errors: ValidationError[] = [];

    for (const rule of this.rules) {
      const fieldValue = data[rule.field];
      
      for (const validationRule of rule.rules) {
        const error = validationRule(fieldValue, data);
        if (error) {
          errors.push({
            field: String(rule.field),
            message: error,
            code: 'validation-error'
          });
          break; // Stop at first error for this field
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate single field
   */
  validateField(field: keyof T, value: any, data?: Partial<T>): string | null {
    const rule = this.rules.find(r => r.field === field);
    if (!rule) return null;

    for (const validationRule of rule.rules) {
      const error = validationRule(value, data);
      if (error) return error;
    }

    return null;
  }
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: (message = 'This field is required') => (value: any) => {
    if (value === null || value === undefined || value === '') {
      return message;
    }
    return null;
  },

  minLength: (min: number, message?: string) => (value: any) => {
    if (typeof value === 'string' && value.length < min) {
      return message || `Must be at least ${min} characters long`;
    }
    return null;
  },

  maxLength: (max: number, message?: string) => (value: any) => {
    if (typeof value === 'string' && value.length > max) {
      return message || `Must be no more than ${max} characters long`;
    }
    return null;
  },

  email: (message = 'Please enter a valid email address') => (value: any) => {
    if (typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return message;
      }
    }
    return null;
  },

  number: (message = 'Must be a valid number') => (value: any) => {
    if (value !== null && value !== undefined && isNaN(Number(value))) {
      return message;
    }
    return null;
  },

  positiveNumber: (message = 'Must be a positive number') => (value: any) => {
    const num = Number(value);
    if (!isNaN(num) && num <= 0) {
      return message;
    }
    return null;
  },

  nonNegativeNumber: (message = 'Must be zero or positive') => (value: any) => {
    const num = Number(value);
    if (!isNaN(num) && num < 0) {
      return message;
    }
    return null;
  },

  integer: (message = 'Must be a whole number') => (value: any) => {
    const num = Number(value);
    if (!isNaN(num) && !Number.isInteger(num)) {
      return message;
    }
    return null;
  },

  minValue: (min: number, message?: string) => (value: any) => {
    const num = Number(value);
    if (!isNaN(num) && num < min) {
      return message || `Must be at least ${min}`;
    }
    return null;
  },

  maxValue: (max: number, message?: string) => (value: any) => {
    const num = Number(value);
    if (!isNaN(num) && num > max) {
      return message || `Must be no more than ${max}`;
    }
    return null;
  },

  url: (message = 'Must be a valid URL') => (value: any) => {
    if (typeof value === 'string' && value.trim() !== '') {
      try {
        new URL(value);
      } catch {
        return message;
      }
    }
    return null;
  },

  oneOf: <T>(options: T[], message?: string) => (value: any) => {
    if (!options.includes(value)) {
      return message || `Must be one of: ${options.join(', ')}`;
    }
    return null;
  },

  custom: (fn: (value: any, data?: any) => boolean, message: string) => (value: any, data?: any) => {
    if (!fn(value, data)) {
      return message;
    }
    return null;
  }
};

/**
 * Product validator
 */
export const productValidator = new Validator<Product>([
  {
    field: 'name',
    rules: [
      ValidationRules.required('Product name is required'),
      ValidationRules.minLength(2, 'Product name must be at least 2 characters'),
      ValidationRules.maxLength(100, 'Product name must be no more than 100 characters')
    ]
  },
  {
    field: 'price',
    rules: [
      ValidationRules.required('Price is required'),
      ValidationRules.number('Price must be a valid number'),
      ValidationRules.positiveNumber('Price must be greater than 0'),
      ValidationRules.maxValue(999999, 'Price cannot exceed 999,999')
    ]
  },
  {
    field: 'stock',
    rules: [
      ValidationRules.required('Stock quantity is required'),
      ValidationRules.number('Stock must be a valid number'),
      ValidationRules.integer('Stock must be a whole number'),
      ValidationRules.nonNegativeNumber('Stock cannot be negative'),
      ValidationRules.maxValue(999999, 'Stock cannot exceed 999,999')
    ]
  },
  {
    field: 'category',
    rules: [
      ValidationRules.required('Category is required'),
      ValidationRules.minLength(2, 'Category must be at least 2 characters'),
      ValidationRules.maxLength(50, 'Category must be no more than 50 characters')
    ]
  },
  {
    field: 'imageUrl',
    rules: [
      ValidationRules.url('Image URL must be a valid URL')
    ]
  }
]);

/**
 * Sale data validator
 */
export interface SaleData {
  items: { productId: string; quantity: number }[];
  payment: number;
}

export const saleValidator = new Validator<SaleData>([
  {
    field: 'items',
    rules: [
      ValidationRules.required('Sale items are required'),
      ValidationRules.custom(
        (items: any[]) => Array.isArray(items) && items.length > 0,
        'At least one item is required'
      ),
      ValidationRules.custom(
        (items: any[]) => {
          if (!Array.isArray(items)) return false;
          return items.every(item => 
            item.productId && 
            typeof item.productId === 'string' &&
            item.quantity &&
            typeof item.quantity === 'number' &&
            item.quantity > 0 &&
            Number.isInteger(item.quantity)
          );
        },
        'All items must have valid product ID and positive quantity'
      )
    ]
  },
  {
    field: 'payment',
    rules: [
      ValidationRules.required('Payment amount is required'),
      ValidationRules.number('Payment must be a valid number'),
      ValidationRules.nonNegativeNumber('Payment cannot be negative'),
      ValidationRules.maxValue(999999, 'Payment amount is too large')
    ]
  }
]);

/**
 * Expense data validator
 */
export interface ExpenseData {
  amount: number;
  description: string;
}

export const expenseValidator = new Validator<ExpenseData>([
  {
    field: 'amount',
    rules: [
      ValidationRules.required('Amount is required'),
      ValidationRules.number('Amount must be a valid number'),
      ValidationRules.positiveNumber('Amount must be greater than 0'),
      ValidationRules.maxValue(999999, 'Amount cannot exceed 999,999')
    ]
  },
  {
    field: 'description',
    rules: [
      ValidationRules.required('Description is required'),
      ValidationRules.minLength(3, 'Description must be at least 3 characters'),
      ValidationRules.maxLength(500, 'Description must be no more than 500 characters')
    ]
  }
]);

/**
 * Note validator
 */
export const noteValidator = new Validator<Note>([
  {
    field: 'title',
    rules: [
      ValidationRules.required('Title is required'),
      ValidationRules.minLength(2, 'Title must be at least 2 characters'),
      ValidationRules.maxLength(100, 'Title must be no more than 100 characters')
    ]
  },
  {
    field: 'description',
    rules: [
      ValidationRules.required('Description is required'),
      ValidationRules.minLength(5, 'Description must be at least 5 characters'),
      ValidationRules.maxLength(1000, 'Description must be no more than 1000 characters')
    ]
  },
  {
    field: 'category',
    rules: [
      ValidationRules.required('Category is required'),
      ValidationRules.oneOf(
        ['Delivery Note', 'Reminder', 'Supply Cost', 'Internal Expense', 'Other'],
        'Invalid category selected'
      )
    ]
  },
  {
    field: 'amount',
    rules: [
      ValidationRules.number('Amount must be a valid number'),
      ValidationRules.nonNegativeNumber('Amount cannot be negative'),
      ValidationRules.maxValue(999999, 'Amount cannot exceed 999,999')
    ]
  }
]);

/**
 * User data validator
 */
export interface UserData {
  email: string;
  displayName: string;
  role: 'owner' | 'worker';
}

export const userValidator = new Validator<UserData>([
  {
    field: 'email',
    rules: [
      ValidationRules.required('Email is required'),
      ValidationRules.email('Please enter a valid email address')
    ]
  },
  {
    field: 'displayName',
    rules: [
      ValidationRules.required('Name is required'),
      ValidationRules.minLength(2, 'Name must be at least 2 characters'),
      ValidationRules.maxLength(50, 'Name must be no more than 50 characters')
    ]
  },
  {
    field: 'role',
    rules: [
      ValidationRules.required('Role is required'),
      ValidationRules.oneOf(['owner', 'worker'], 'Role must be either owner or worker')
    ]
  }
]);

/**
 * Password validator
 */
export interface PasswordData {
  password: string;
  confirmPassword?: string;
}

export const passwordValidator = new Validator<PasswordData>([
  {
    field: 'password',
    rules: [
      ValidationRules.required('Password is required'),
      ValidationRules.minLength(6, 'Password must be at least 6 characters'),
      ValidationRules.custom(
        (password: string) => /[A-Za-z]/.test(password) && /[0-9]/.test(password),
        'Password must contain both letters and numbers'
      )
    ]
  },
  {
    field: 'confirmPassword',
    rules: [
      ValidationRules.custom(
        (confirmPassword: string, data?: PasswordData) => {
          if (data?.password && confirmPassword !== data.password) {
            return false;
          }
          return true;
        },
        'Passwords do not match'
      )
    ]
  }
]);

/**
 * Utility functions for validation
 */
export const ValidationUtils = {
  /**
   * Validate multiple objects with different validators
   */
  validateMultiple: (validations: Array<{ validator: Validator<any>; data: any }>) => {
    const allErrors: ValidationError[] = [];
    let isValid = true;

    for (const { validator, data } of validations) {
      const result = validator.validate(data);
      if (!result.isValid) {
        isValid = false;
        allErrors.push(...result.errors);
      }
    }

    return { isValid, errors: allErrors };
  },

  /**
   * Format validation errors for display
   */
  formatErrors: (errors: ValidationError[]): Record<string, string> => {
    const formatted: Record<string, string> = {};
    for (const error of errors) {
      if (!formatted[error.field]) {
        formatted[error.field] = error.message;
      }
    }
    return formatted;
  },

  /**
   * Get first error message for a field
   */
  getFieldError: (errors: ValidationError[], field: string): string | null => {
    const error = errors.find(e => e.field === field);
    return error ? error.message : null;
  },

  /**
   * Check if a specific field has errors
   */
  hasFieldError: (errors: ValidationError[], field: string): boolean => {
    return errors.some(e => e.field === field);
  },

  /**
   * Sanitize string input
   */
  sanitizeString: (input: string): string => {
    return input.trim().replace(/\s+/g, ' ');
  },

  /**
   * Sanitize number input
   */
  sanitizeNumber: (input: any): number | null => {
    const num = Number(input);
    return isNaN(num) ? null : num;
  },

  /**
   * Validate file upload
   */
  validateFile: (file: File, options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}): string | null => {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = ['image/jpeg', 'image/png', 'image/gif'] } = options;

    if (file.size > maxSize) {
      return `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`;
    }

    if (!allowedTypes.includes(file.type)) {
      return `File type must be one of: ${allowedTypes.join(', ')}`;
    }

    return null;
  }
};

/**
 * React hook for form validation
 */
export function useFormValidation<T>(validator: Validator<T>) {
  const [errors, setErrors] = React.useState<ValidationError[]>([]);
  const [isValid, setIsValid] = React.useState(true);

  const validate = (data: Partial<T>) => {
    const result = validator.validate(data);
    setErrors(result.errors);
    setIsValid(result.isValid);
    return result;
  };

  const validateField = (field: keyof T, value: any, data?: Partial<T>) => {
    const error = validator.validateField(field, value, data);
    
    // Update errors array
    setErrors(prev => {
      const filtered = prev.filter(e => e.field !== String(field));
      if (error) {
        filtered.push({
          field: String(field),
          message: error,
          code: 'validation-error'
        });
      }
      return filtered;
    });

    return error;
  };

  const clearErrors = () => {
    setErrors([]);
    setIsValid(true);
  };

  const getFieldError = (field: keyof T) => {
    return ValidationUtils.getFieldError(errors, String(field));
  };

  const hasFieldError = (field: keyof T) => {
    return ValidationUtils.hasFieldError(errors, String(field));
  };

  return {
    errors,
    isValid,
    validate,
    validateField,
    clearErrors,
    getFieldError,
    hasFieldError,
    formattedErrors: ValidationUtils.formatErrors(errors)
  };
}

// Import React for the hook
import React from 'react';