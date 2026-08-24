# WeLove

Welcome to the **WeLove** repository. This is the official codebase built with **React Native** and **Expo**.

## 🎨 Demo Gallery

A visual preview of the mobile app experience and screen concepts included in the demo assets:

![Demo mockup 1](demo/1%20%281%29.png)
![Demo mockup 2](demo/1%20%282%29.png)
![Demo mockup 3](demo/1%20%283%29.png)
![Demo mockup 4](demo/1%20%284%29.png)
![Demo mockup 5](demo/1%20%285%29.png)
![Demo mockup 6](demo/1%20%286%29.jpg)
![Demo mockup 7](demo/1%20%287%29.jpg)
![Demo mockup 8](demo/1%20%288%29.jpg)
![Demo mockup 9](demo/1%20%289%29.jpg)
![Demo mockup 10](demo/1%20%2810%29.jpg)

---

## 🚀 Key Highlights & Tech Stack

This project is built using modern React Native development practices on the **New Architecture**, leveraging high-performance libraries and native customizations:

- **Core Framework**: React Native (v0.86.0) & Expo SDK 57 (using file-based routing with `expo-router`).
- **State Management & Caching**: 
  - **Zustand**: Fast and lightweight global state management (located in `/stores`).
  - **TanStack Query (React Query) v5**: Managed server state with offline-first persistence using **React Native MMKV** (configured in `/services/client.ts`).
- **UI & Animations**:
  - **HeroUI Native**: High-quality component library styled using **Uniwind** / Tailwind v4.
  - **React Native Reanimated (v4)**: High-performance, worklet-driven animations.
  - **React Native Gesture Handler**: Fluid, native-feeling gestures and bottom sheets via `@lodev09/react-native-true-sheet`.
- **Custom Native Modules**: 
  - Custom Expo Module (`/modules/variable-header-blur`) with custom Swift (iOS) and Kotlin (Android) implementations.
- **Expo Config Plugins**: 
  - Custom build hooks and plugins such as `withAndroidOrientationFix.js`, `withAndroidSvgFix.js`, and `withGeminiNano.js`.
- **Internationalization (i18n)**: Fully localized using `i18next` and `react-i18next`.

---

## 📂 Repository Structure

Below is an overview of the key project directories:

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

## 🛠️ Key Architectural Patterns

1. **Custom Native Module**:
   - See [/modules/variable-header-blur](file:///modules/variable-header-blur) for Kotlin and Swift integration under Expo's Modules API.
2. **ViewModel Layer (MVVM)**:
   - See [/viewmodels/HomeViewModel.ts](file:///viewmodels/HomeViewModel.ts) and [/viewmodels/PostItemViewModel.ts](file:///viewmodels/PostItemViewModel.ts) for decoupled UI and business logic.
3. **Components & Animations**:
   - See [/components/post/PostItem.tsx](file:///components/post/PostItem.tsx) and [/components/PostMediaCarousel.tsx](file:///components/PostMediaCarousel.tsx) for UI styling, video integrations, and carousel states.
4. **Offline-First API Client**:
   - See [/services/client.ts](file:///services/client.ts) for the fetch wrapper (Nitro Fetch) and TanStack Query persistence layer configuration.
