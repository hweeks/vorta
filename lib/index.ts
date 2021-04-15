export const base = 'todo: build app'

if (process.env.NODE_ENV !== 'test') {
  console.warn('The project is not built yet! Please wait to use this until then!')
  process.exit(1)
}
