import { BookOpen, Brain, LayoutDashboard, MessageSquare, Settings } from "lucide-react";
import type { User } from "@/types";

export const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "words", label: "Words", icon: BookOpen },
  { id: "chat", label: "AI Chat", icon: MessageSquare },
  { id: "quiz", label: "Letters", icon: Brain },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

export type View = (typeof navItems)[number]["id"];

export type UserFormState = {
  native_language: string;
  target_language: string;
  level: User["level"];
  daily_word_count: number;
  reminder_enabled: boolean;
  interests: string;
};

export const initialUserForm: UserFormState = {
  native_language: "ar",
  target_language: "en",
  level: "beginner",
  daily_word_count: 5,
  reminder_enabled: true,
  interests: "travel, work, daily conversation",
};
