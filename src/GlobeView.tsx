import type { User } from "firebase/auth";
import MapView from "./MapView";

type GlobeViewProps = {
  user: User | null;
  language: "en" | "ru";
  onRequestAuth: () => void;
};

export default function GlobeView({
  user,
  language,
  onRequestAuth,
}: GlobeViewProps) {
  return (
    <MapView
      mode="globe"
      readOnly
      user={user}
      places={user ? undefined : []}
      language={language}
      onRequestAuth={onRequestAuth}
    />
  );
}
