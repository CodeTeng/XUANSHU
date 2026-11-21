import { create } from 'zustand'

export type RouteKey = 'home' | 'bazi' | 'ziwei' | 'qimen' | 'tarot' | 'love' | 'fengshui'

interface UiState {
  route: RouteKey
  settingsOpen: boolean
  goto: (r: RouteKey) => void
  openSettings: () => void
  closeSettings: () => void
}

export const useUi = create<UiState>((set) => ({
  route: 'home',
  settingsOpen: false,
  goto: (r) => {
    set({ route: r })
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', r === 'home' ? '#/' : `#/${r}`)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
}))

export function routeFromHash(): RouteKey {
  const h = window.location.hash.replace(/^#\/?/, '').split('?')[0]
  const allowed: RouteKey[] = ['bazi', 'ziwei', 'qimen', 'tarot', 'love', 'fengshui']
  return (allowed.includes(h as RouteKey) ? h : 'home') as RouteKey
}
