# WeLove (Showcase / Lite Version)

Welcome to the **WeLove** showcase repository. This is a curated, non-sensitive "lite" version of the production codebase, prepared specifically to showcase architectural design, coding standards, native module integrations, and technical expertise in **React Native** and **Expo**.

> [!NOTE]
> This repository is a code showcase containing selected screens, components, and architectural files. Sensitive build credentials, API keys, and environment variables have been excluded, and the project is not meant to be run directly out-of-the-box.

---

## 🚀 Key Highlights & Tech Stack

This project represents modern React Native development practices on the **New Architecture**, leveraging high-performance libraries and native customizations:

- **Core Framework**: React Native (v0.86.0) & Expo SDK 57 (using file-based routing with `expo-router`).
- **State Management & Caching**: 
  - **Zustand**: Fast and lightweight global state management (located in `/stores`).
  - **TanStack Query (React Query) v5**: Managed server state with offline-first persistence using **React Native MMKV** (configured in `/services/client.ts`).
- **UI & Animations**:
  - **HeroUI Native**: High-quality component library styled using **Uniwind** / Tailwind v4.
  - **React Native Reanimated (v4)**: High-performance, worklet-driven animations.
  - **React Native Gesture Handler**: Fluid, native-feeling gestures and bottom sheets via `@lodev09/react-native-true-sheet`.
- **Custom Native Modules**: 
  - Contains a custom Expo Module (`/modules/variable-header-blur`) with custom Swift (iOS) and Kotlin (Android) implementations.
- **Expo Config Plugins**: 
  - Custom build hooks and plugins such as `withAndroidOrientationFix.js`, `withAndroidSvgFix.js`, and `withGeminiNano.js`.
- **Internationalization (i18n)**: Fully localized using `i18next` and `react-i18next`.

---

## 📂 Repository Structure

Below is an overview of the key directories designed for readability and maintainability:

```text
├── app/                      # Expo Router structure (Routes and Layouts)
│   ├── (tabs)/               # Main Tab-based navigation
│   └── _screens/             # Screen implementations (MVVM View layer)
├── components/               # Reusable UI components (HeroUI, custom animations)
├── modules/                  # Custom Expo Native Modules (Swift / Kotlin)
├── services/                 # API client (Nitro Fetch wrappers, Supabase adapters)
├── stores/                   # Zustand store definitions (app state, themes, caching)
├── viewmodels/               # Screen-specific ViewModels containing business logic
├── types/                    # TypeScript interfaces and entity types
├── patches/                  # NPM package patches (using patch-package / bun patches)
└── utils/                    # Shared helper and computation functions
```

---

## 🛠️ Notable Code Patterns to Review

If you are a recruiter or technical interviewer, here are the recommended paths to evaluate:

1. **Custom Native Module**:
   - Check out [/modules/variable-header-blur](file:///modules/variable-header-blur) for Kotlin and Swift integration under Expo's Modules API.
2. **ViewModel Layer (MVVM)**:
   - Check out [/viewmodels/HomeViewModel.ts](file:///viewmodels/HomeViewModel.ts) and [/viewmodels/PostItemViewModel.ts](file:///viewmodels/PostItemViewModel.ts) to see how logic is decoupled from React UI components.
3. **Rich Components & Custom Animations**:
   - See [/components/post/PostItem.tsx](file:///components/post/PostItem.tsx) or [/components/PostMediaCarousel.tsx](file:///components/PostMediaCarousel.tsx) for complex UI styling, video integrations, and carousel states.
4. **Offline-first API Client**:
   - Inspect [/services/client.ts](file:///services/client.ts) to review the fetch wrapper (Nitro Fetch) and TanStack Query persistence layer setup.

---

*Thank you for reviewing my code! If you have any questions about the implementation details or architectural decisions, feel free to reach out.*
