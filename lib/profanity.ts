// Common profanity words list - expand as needed
const badWords = [
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'hell', 'crap',
  'bastard', 'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut',
  'piss', 'fag', 'nigger', 'nigga', 'retard', 'idiot', 'stupid',
  // Add more as needed
]

// Common character substitutions used to bypass filters
const substitutions: { [key: string]: string } = {
  '@': 'a',
  '4': 'a',
  '3': 'e',
  '1': 'i',
  '0': 'o',
  '5': 's',
  '7': 't',
  '$': 's',
  '!': 'i',
}

export function containsProfanity(text: string): boolean {
  const normalizedText = normalizeText(text)
  
  // Check for exact matches
  for (const badWord of badWords) {
    const pattern = new RegExp(`\\b${badWord}\\b`, 'i')
    if (pattern.test(normalizedText)) {
      return true
    }
  }

  // Check for partial matches (badword embedded in other words)
  for (const badWord of badWords) {
    if (normalizedText.toLowerCase().includes(badWord)) {
      return true
    }
  }

  return false
}

function normalizeText(text: string): string {
  let normalized = text.toLowerCase()
  
  // Replace common substitutions
  for (const [char, replacement] of Object.entries(substitutions)) {
    normalized = normalized.split(char).join(replacement)
  }

  // Remove spaces between letters (to catch "f u c k")
  normalized = normalized.replace(/\s+/g, '')
  
  return normalized
}

export function censorMessage(text: string): string {
  let censored = text
  
  for (const badWord of badWords) {
    const pattern = new RegExp(`\\b${badWord}\\b`, 'gi')
    censored = censored.replace(pattern, '*'.repeat(badWord.length))
  }
  
  return censored
}
