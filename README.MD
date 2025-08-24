# language-app

A small app written in React Native allowing us to read texts in a foreign language.

## Initial Setup

```
nvm use 20

npx create-expo-app@latest language-app -t blank-typescript

npx expo install react-native-screens react-native-safe-area-context
npx expo install @react-native-async-storage/async-storage
npm install @react-navigation/native @react-navigation/bottom-tabs
npx expo install @react-navigation/native-stack @react-navigation/native react-native-screens react-native-safe-area-context react-native-gesture-handler

yarn add xlsx
yarn add jszip
yarn add -D @types/jszip
yarn add @react-navigation/native-stack react-native-gesture-handler

- cd language-app
- npm run android
- npm run ios
- npm run web
```

## Text Sources

- <https://lingua.com/ru/russkiy/chteniye/moj-drug/>