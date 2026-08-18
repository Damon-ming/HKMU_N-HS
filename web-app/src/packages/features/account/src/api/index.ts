import type { AccountProfile } from '../types'
export const accountStore = { current(): AccountProfile { return { id: 'murphy', name: 'Murphy', avatarText: 'M' } } }
