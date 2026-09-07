import type { User } from 'firebase/auth'
import MapView from './MapView'

type GlobeViewProps = {
  user: User | null
  onRequestAuth: () => void
}

export default function GlobeView({ user, onRequestAuth }: GlobeViewProps) {
  return <MapView mode="globe" user={user} onRequestAuth={onRequestAuth} />
}
