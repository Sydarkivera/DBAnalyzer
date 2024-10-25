import { createElectronRouter } from 'electron-router-dom'

export const { Router, registerRoute } = createElectronRouter({
  port: 400,

  types: {
    ids: ['main'],
  },
})
