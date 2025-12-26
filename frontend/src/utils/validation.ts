export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export function validateProject(project: Partial<any>): ValidationResult {
  const errors: ValidationError[] = []

  // Required fields
  if (!project.name || project.name.trim() === '') {
    errors.push({ field: 'name', message: 'Project name is required' })
  }

  if (!project.type || !['software', 'hardware', 'mixed'].includes(project.type)) {
    errors.push({ field: 'type', message: 'Valid project type is required' })
  }

  if (!project.deadline) {
    errors.push({ field: 'deadline', message: 'Deadline is required' })
  } else {
    const deadline = new Date(project.deadline)
    if (isNaN(deadline.getTime())) {
      errors.push({ field: 'deadline', message: 'Invalid deadline date' })
    }
  }

  if (!project.totalAmount || project.totalAmount <= 0) {
    errors.push({ field: 'totalAmount', message: 'Total amount must be greater than 0' })
  }

  // Financial validation
  if (project.advanceReceived && project.advanceReceived < 0) {
    errors.push({ field: 'advanceReceived', message: 'Advance received cannot be negative' })
  }

  if (project.totalReceived && project.totalReceived < 0) {
    errors.push({ field: 'totalReceived', message: 'Total received cannot be negative' })
  }

  if (project.totalReceived && project.totalAmount && project.totalReceived > project.totalAmount) {
    errors.push({ field: 'totalReceived', message: 'Total received cannot exceed total amount' })
  }

  // URL validation
  const urlFields = ['repoLink', 'liveLink', 'completionVideoLink']
  urlFields.forEach((field) => {
    if (project[field] && project[field].trim() !== '') {
      try {
        new URL(project[field])
      } catch {
        errors.push({ field, message: `Invalid URL format for ${field}` })
      }
    }
  })

  // JSON validation for techStack and deliverables




  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function validateURL(url: string): boolean {
  if (!url || url.trim() === '') return true // Empty is valid (optional field)
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}



export function validateAmount(amount: number | string): boolean {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return !isNaN(num) && num >= 0
}

export function getFieldError(errors: ValidationError[], field: string): string | undefined {
  return errors.find((e) => e.field === field)?.message
}


