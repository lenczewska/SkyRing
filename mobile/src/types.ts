import type { User } from "firebase/auth";
import type { VisitedPlace } from "./MapView";

export type AuthMode = "login" | "register";
export type TabPage = "home" | "map" | "posts" | "profile";
export type AuthUser = User | null;

export type PlaceDetails = {
  story?: string;
  date?: string;
  transport?: string;
  photos?: string[];
};

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  location: string;
  date: string;
  story: string;
  transport?: string;
  photos?: string[];
  likes: number;
  likedBy?: string[];
  comments: {
    id: string;
    authorName: string;
    text: string;
    date: string;
  }[];
};
