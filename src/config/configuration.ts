import { AppConfig } from './app-config'

export default (): AppConfig => ({
  jobs: {
    orders: {
      repeat: {
        every: 3000 * 30
      }
    },
    results: {
      repeat: {
        every: 3000 * 30
      }
    }
  }
})
