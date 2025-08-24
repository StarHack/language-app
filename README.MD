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

## Physical Device

```
npx expo run:ios --device
npx expo run:ios -d "KGB surveillance van"

# prod build
npx expo run:ios --device --configuration Release --no-bundler
```

## Simulator

When upgrading Xcode, the simulators are usually lost. Here's how we can install a newer simulator.

```
# xcodebuild -downloadPlatform iOS
Downloading iOS 18.3.1 Simulator (22D8075): 15.0% (1.31 GB of 8.72 GB) 

# xcrun simctl list runtimes

# xcrun simctl create "iPhone SE Simulator" com.apple.CoreSimulator.SimDeviceType.iPhone-SE-3rd-generation com.apple.CoreSimulator.SimRuntime.iOS-18-3

# npx react-native doctor

# ACCF0BD2-E69B-47CE-9592-9F0DB20792FC

# npx react-native run-ios --udid ACCF0BD2-E69B-47CE-9592-9F0DB20792FC

# cd ios/
# pod update
# pod install
```
