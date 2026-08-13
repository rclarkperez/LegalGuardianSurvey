export function getDisplayLabel(text: string, individualName?: string | null, fieldId?: string): string {
  const trimmedName = typeof individualName === 'string' ? individualName.trim() : ''

  if (!trimmedName || fieldId === 'individualName') {
    return text
  }

  const apostrophe = text.includes('’') ? '’' : "'"

  return text
    .replace(/\bthe (?:individual|protected person)\b/gi, trimmedName)
    .replace(/\b(?:individual|protected person)(?:’|')s\b/gi, `${trimmedName}${apostrophe}s`)
    .replace(/\b(?:individual|protected person)\b/gi, trimmedName)
}
