// ⚙️ إعدادات مشروع Firebase بتاعك
const firebaseConfig = {
  apiKey: "AIzaSyDc28-82Jw7CzamseiQV2MLDMfZvecA5VA",
  authDomain: "elhkm-26866.firebaseapp.com",
  projectId: "elhkm-26866",
  storageBucket: "elhkm-26866.firebasestorage.app",
  messagingSenderId: "927567644994",
  appId: "1:927567644994:web:932550a6427910789360db",
  measurementId: "G-5HCCDCRB7K"
};

// 🔔 إشعارات تليجرام لما حد يوقّع في سجل الزوار (اختياري)
// 1) اعمل بوت جديد من @BotFather وانسخ الـ Token
// 2) ابعت أي رسالة للبوت بتاعك من حسابك
// 3) افتح الرابط ده (بدّل TOKEN بالتوكن بتاعك):
//    https://api.telegram.org/botTOKEN/getUpdates
//    وهتلاقي جوه الرد "chat":{"id":123456789} — ده الـ Chat ID
const TELEGRAM_CONFIG = {
  botToken: "",
  chatId: ""
};
