import type { Client } from '@agile-exec/api-client'

// ========== CLIENT VALIDATION COMPOSABLE (HOW) ==========
// Handles validation logic for client data

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export const useClientValidation = () => {
  
  const validateClient = (client: Partial<Client>): ValidationResult => {
    const errors: string[] = []

    // Required field validations
    if (!client.first_name?.trim()) {
      errors.push('First name is required')
    }

    if (!client.last_name?.trim()) {
      errors.push('Last name is required')
    }

    // Email validation
    if (client.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(client.email)) {
        errors.push('Please enter a valid email address')
      }
    }

    // Phone validation (basic)
    if (client.phone && client.phone.trim()) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/
      if (!phoneRegex.test(client.phone)) {
        errors.push('Please enter a valid phone number')
      }
    }

    // Date of birth validation
    if (client.date_of_birth) {
      const birthDate = new Date(client.date_of_birth)
      const today = new Date()
      
      if (birthDate > today) {
        errors.push('Date of birth cannot be in the future')
      }
      
      const age = today.getFullYear() - birthDate.getFullYear()
      if (age > 120) {
        errors.push('Please enter a valid date of birth')
      }
    }

    // Status validation
    if (client.status && !['active', 'waiting', 'archived'].includes(client.status)) {
      errors.push('Invalid client status')
    }

    // Gender validation
    if (client.gender && !['male', 'female', 'other', 'prefer_not_to_say'].includes(client.gender)) {
      errors.push('Invalid gender selection')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const validateField = (fieldName: keyof Client, value: any): ValidationResult => {
    const tempClient: Partial<Client> = {}
    tempClient[fieldName] = value
    
    const result = validateClient(tempClient)
    
    // Filter errors to only those related to this field
    const fieldErrors = result.errors.filter(error => {
      const lowerError = error.toLowerCase()
      const lowerFieldName = fieldName.toLowerCase()
      return lowerError.includes(lowerFieldName) || 
             (fieldName === 'first_name' && lowerError.includes('first name')) ||
             (fieldName === 'last_name' && lowerError.includes('last name')) ||
             (fieldName === 'date_of_birth' && lowerError.includes('date of birth')) ||
             (fieldName === 'email' && lowerError.includes('email')) ||
             (fieldName === 'phone' && lowerError.includes('phone'))
    })

    return {
      isValid: fieldErrors.length === 0,
      errors: fieldErrors
    }
  }

  const sanitizeClientData = (client: Partial<Client>): Partial<Client> => {
    const sanitized = { ...client }

    // Trim string fields
    if (sanitized.first_name) sanitized.first_name = sanitized.first_name.trim()
    if (sanitized.last_name) sanitized.last_name = sanitized.last_name.trim()
    if (sanitized.email) sanitized.email = sanitized.email.trim().toLowerCase()
    if (sanitized.phone) sanitized.phone = sanitized.phone.trim()
    if (sanitized.street_address) sanitized.street_address = sanitized.street_address.trim()
    if (sanitized.city) sanitized.city = sanitized.city.trim()
    if (sanitized.zip) sanitized.zip = sanitized.zip.trim()
    if (sanitized.primary_language) sanitized.primary_language = sanitized.primary_language.trim()

    // Remove empty strings (convert to undefined so they're removed in API calls)
    Object.keys(sanitized).forEach(key => {
      if (sanitized[key as keyof Client] === '') {
        delete sanitized[key as keyof Client]
      }
    })

    return sanitized
  }

  return {
    validateClient,
    validateField,
    sanitizeClientData
  }
}