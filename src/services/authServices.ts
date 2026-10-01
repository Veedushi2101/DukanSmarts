import { 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth";
import { auth, db } from "../firebase/config";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

// 1. Initialize invisible reCAPTCHA
export const setupRecaptcha = (containerId: string = "recaptcha-container") => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: "invisible",
      callback: () => {
        // reCAPTCHA solved
      }
    });
  }
  return window.recaptchaVerifier;
};

// 2. Send SMS OTP via Firebase Auth
export const sendPhoneOtp = async (phoneNumber: string) => {
  const verifier = setupRecaptcha();
  const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
  window.confirmationResult = confirmationResult;
  return confirmationResult;
};

// 3. Verify SMS OTP and synchronize user in Firestore
export const verifyPhoneOtpAndLogin = async (otp: string, storeData?: any) => {
  if (!window.confirmationResult) {
    throw new Error("No active OTP request found. Please request an OTP first.");
  }
  const userCredential = await window.confirmationResult.confirm(otp);
  const user = userCredential.user;

  // Sync with Firestore store document
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists() && storeData) {
    await setDoc(userRef, {
      uid: user.uid,
      phone: user.phoneNumber,
      name: storeData.name || "Store Owner",
      storeName: storeData.storeName || "My Store",
      billHeaderName: storeData.storeName || "My Store",
      address: storeData.address || "",
      role: "OWNER",
      createdAt: new Date().toISOString()
    });
  }

  return user;
};

// 4. Send Email Login Link / Verification Code
export const sendEmailVerificationLink = async (email: string) => {
  const actionCodeSettings = {
    url: window.location.origin + "/finishSignUp",
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem("emailForSignIn", email);
};

// 5. Simulated notification dispatcher (can be hooked to a Cloud Function / Twilio / SendGrid)
export const sendChangeNotificationAlert = async (
  recipient: { phone?: string; email?: string; name: string },
  changedFields: string[]
) => {
  const message = `Security Alert: Settings updated successfully for ${recipient.name}. Modified fields: ${changedFields.join(", ")}. If you did not make this change, please contact support immediately.`;
  
  // Real implementation: call your backend API/Cloud Function
  console.log(`[DISPATCH] Sent alert to ${recipient.phone || recipient.email}:`, message);
  return { success: true, message };
};