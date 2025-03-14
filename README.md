# RakshaSetu

**RakshaSetu** is a comprehensive women's safety mobile application designed to provide emergency assistance, location tracking, financial literacy, real-time alerts, and a **community platform** for sharing experiences and support. Built with **React Native (Expo)** and powered by **Firebase**, this app ensures quick and reliable communication during emergencies.

## 🚀 Key Features

### 🆘 Emergency & Safety Features
- **🚨 Emergency SOS Alert**: Sends an instant distress signal with real-time location details and **street view images** to predefined emergency contacts.
- **📳 Shake Detection for SOS**: Activate the SOS alert by simply shaking the phone for an immediate emergency response.
- **📍 Live Location Tracking**: Share real-time location updates with trusted contacts to enhance safety.
- **📞 One-Tap Help**: Quickly call emergency services like police, ambulance, or nearby support with a single tap.
- **🛤️ Safe Route Navigation**: Suggests the safest path based on crowd-sourced data and AI risk assessment.
- **📲 Fake Call Feature**: Simulate an incoming call to escape uncomfortable situations.
- **📝 AI-Generated First Incident Report (FIR)**: Helps users automatically generate a **legally structured** FIR using AI.
- **🛡️ Safety Assessment Modal**: In the **'Track Me'** screen, provides detailed **safety information** about the destination location.

### 🌍 Community & Social Features
- **📝 Community Forum**: A dedicated space where users can **post stories, safety tips, alerts, and experiences**.
- **👍 Likes & Comments**: Engage with other users by liking and commenting on posts.
- **📌 Location-Based Safety Discussions**: Users can **discuss safety concerns** related to specific locations and cities.

### 💬 Communication & Assistance
- **💬 In-App Chat (RakshaSetu Chat)**: Secure in-app chat for real-time communication and emergency coordination.
- **📢 Community Alerts**: Allows users to **notify others** about potential dangers in their area.
- **🤖 AI Chatbot Assistance**: Provides self-defense tips, emergency response guidance, and **mental health support** during distress situations.
- **⚖️ Legal Assistant AI**: Offers AI-driven **legal guidance** and support for women's safety-related issues, including harassment laws and complaint filing.
- **🗣️ Multilingual Support**: Available in **multiple languages**, ensuring accessibility for diverse users.
- **📌 Trusted Contact System**: Allows users to **assign trusted contacts** for location tracking and emergency notifications.

### 💰 Financial & Personal Security
- **📚 Financial Skill Hub**: Includes **finance lectures**, budgeting tools, and expense management for women's financial independence.
- **🔒 Secure Data Storage**: **End-to-end encrypted** Firebase authentication ensures **user data privacy and safety**.

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Firebase (Firestore, Auth, Storage)
- **Environment Variables**: `.env` file to securely store API keys and sensitive data
- **Location & Maps**: Google Maps API 
- **Chat & Communication**: Firestore real-time chat
- **AI Integrations**: Gemini AI, OPEN AI
- **Community Features**: Firebase Firestore for **social posts, comments, and real-time engagement**.

## 📂 Directory Structure
```
RakshaSetu/
│── .expo/               # Expo-related configurations
│── assets/              # Images, icons, and other static files
│── config/              # Configuration files (API endpoints, themes, etc.)
│── node_modules/        # Dependencies
│── src/
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context API state management
│   ├── data/            # Static data, mock files, or JSON resources
│   ├── hooks/           # Custom hooks for API calls, state management, etc.
│   ├── locales/         # Internationalization (i18n) and language files
│   ├── screens/         # App screens (Home, SOS, Profile, Finance Hub, Community, etc.)
│   ├── services/        # Firebase and API services
│   ├── utils/           # Helper functions and utilities
│── .env                 # Environment variables (DO NOT SHARE PUBLICLY)
│── .gitignore           # Ignore unnecessary files in Git
│── App.js               # Main entry point of the app
│── app.json             # Expo configuration
│── babel.config.js      # Babel configuration
│── eas.json             # Expo Application Services (EAS) configuration
│── index.js             # App bootstrap file
│── package.json         # Dependencies & scripts
│── package-lock.json    # Auto-generated dependency lock file
│── README.md            # Project documentation
```

## 🔧 Installation & Setup

1. **Clone the repository**
   ```sh
   git clone https://github.com/yourusername/RakshaSetu.git
   cd RakshaSetu
   ```

2. **Install dependencies**
   ```sh
   npm install  # or yarn install
   ```

3. **Setup Environment Variables**
   - Create a `.env` file in the root directory and add your API keys securely:
   ```sh
   OPENAI_API_KEY=your-openai-api-key
   GEMINI_API_KEY=your-gemini-api-key
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   YOUTUBE_API_KEY=your-youtube-api-key
   
   EXPO_CLIENT_ID=your-expo-client-id
   IOS_CLIENT_ID=your-ios-client-id
   ANDROID_CLIENT_ID=your-android-client-id
   WEB_CLIENT_ID=your-web-client-id
   
   FIREBASE_API_KEY=your-firebase-api-key
   FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
   FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
   FIREBASE_APP_ID=your-firebase-app-id
   FIREBASE_MEASUREMENT_ID=your-firebase-measurement-id
   ```
   - **DO NOT** commit this file to GitHub. Add it to `.gitignore`.

4. **Setup Firebase**
   - Create a Firebase project and enable Firestore, Auth, and FCM.

5. **Run the app**
   ```sh
   npm start
   ```

## 📲 Screenshots
(Add screenshots here to showcase the UI)

## 🤝 Contributing
We welcome contributions! 🚀 If you’d like to contribute, please:
- Open an issue to report a bug or suggest an enhancement
- Fork the repository and submit a pull request
- Contact us for collaboration opportunities

## 📜 License
MIT License © 2025 RakshaSetu Team
