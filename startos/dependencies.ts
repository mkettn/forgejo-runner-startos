import { sdk } from './sdk'

// The runner connects to whatever Forgejo instance the user enters in
// Configure, so it depends on no other package.
export const setDependencies = sdk.setupDependencies(async () => ({}))
