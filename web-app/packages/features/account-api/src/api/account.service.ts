import { accountStore } from '@ming/features-account'
export const getCurrentAccount = () => accountStore.current()
