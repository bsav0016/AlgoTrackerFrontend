import React, { useState } from "react";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { useToast } from "@/contexts/ToastContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { Routes } from "@/app/Routes";
import { ThemedText } from "@/components/ThemedText";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import { GeneralButton } from "@/components/GeneralButton";
import { TextField } from "@/components/TextField";
import { Spacing } from "@/constants/Theme";
import { AuthService } from "@/features/auth/AuthService";


export default function ForgotPassword() {
    const { addToast } = useToast();
    const { routeTo } = useRouteTo();

    const [sentEmail, setSentEmail] = useState<boolean>(false);
    const [email, setEmail] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [otp, setOtp] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [processing, setProcessing] = useState<Boolean>(false);


    const sendResetEmail = async () => {
        if (!validateEmail()) {
            addToast("Please enter a valid email");
            return;
        }

        setProcessing(true);
        try {
            await AuthService.sendPasswordResetEmail(email);
            addToast("Reset Password email has been sent! If you do not see it, please check your spam folder.")
            setSentEmail(true);
        } catch (error: any) {
            console.error(error);
            if (error.status && error.status === 404) {
                addToast("Email not associated with an active account")
            } else {
                addToast("Server failed to send reset password email. Please try again later");
            }
        } finally {
            setProcessing(false);
        }
    };

    const confirmReset = async () => {
        if (username.length === 0) {
            addToast('Please enter your username');
            return;
        }
        const otpNumber = validateOTP();
        if (!otpNumber) {
            addToast('One-time password should be a 6-8 digit number');
            return;
        }
        if (!(confirmPassword === password)) {
            addToast('Passwords must match');
            return;
        }

        setProcessing(true);
        try {
            await AuthService.confirmResetPassword(username, otpNumber, password);
            addToast("Password reset successfully");
            routeTo(Routes.Login);
        } catch (error: any) {
            if (error.status && error.status === 404) {
                addToast("Username not recognized");
            }
            else if (error.status && error.status === 417) {
                addToast("One-time password invalid or expired");
            } else {
                addToast("Unexpected server error. Please try again later");
            }
        } finally {
            setProcessing(false);
        }
    }

    const validateEmail = () => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      
        if (regex.test(email)) {
          return true;
        } else {
          return false;
        }
    };

    const validateOTP = (): number | null => {
        let otpNumber = null;
        try {
            otpNumber = parseInt(otp, 10);
            if (isNaN(otpNumber)) {
                throw new Error("Invalid OTP");
            }
            return otpNumber;
        } catch {
            return null;
        }
    }

    const resetFields = [
        { text: "Username", value: username, setValue: setUsername, hidden: false, textKeyboard: true },
        { text: "One-Time Password", value: otp, setValue: setOtp, hidden: false, textKeyboard: false },
        { text: "Password", value: password, setValue: setPassword, hidden: true, textKeyboard: true },
        { text: "Confirm Password", value: confirmPassword, setValue: setConfirmPassword, hidden: true, textKeyboard: true },
    ]
      

    return (
        <CustomHeaderView header={"Forgot Password"} displayFunds={false}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                >
                    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
                        <View style={styles.authView}>
                            <ThemedText type="muted" style={styles.intro}>
                                {sentEmail
                                    ? "Enter the one-time password from your email and choose a new password."
                                    : "Enter your account email and we'll send you a one-time password."}
                            </ThemedText>

                            {sentEmail ?
                            <View style={styles.formView}>
                                {resetFields.map((field, i) => (
                                    <TextField
                                        key={i}
                                        label={field.text}
                                        value={field.value}
                                        onChangeText={(newText) => field.setValue(newText)}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        textContentType={"oneTimeCode"}
                                        keyboardType={field.textKeyboard ? "default" : "number-pad"}
                                        returnKeyType={i === resetFields.length - 1 ? 'done' : 'next'}
                                        secureTextEntry={field.hidden}
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                    />
                                ))}

                                <View style={styles.submit}>
                                    <GeneralButton
                                        title={"Reset Password"}
                                        onPress={confirmReset}
                                        loading={!!processing}
                                        autoWidth={false}
                                    />
                                </View>
                            </View>
                            :
                            <View style={styles.formView}>
                                <TextField
                                    label="Email"
                                    value={email}
                                    onChangeText={(newText) => setEmail(newText)}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    textContentType={"oneTimeCode"}
                                    keyboardType={"email-address"}
                                    returnKeyType={'done'}
                                    onSubmitEditing={() => Keyboard.dismiss()}
                                />

                                <View style={styles.submit}>
                                    <GeneralButton
                                        title={"Request Reset"}
                                        onPress={sendResetEmail}
                                        loading={!!processing}
                                        autoWidth={false}
                                    />
                                </View>
                            </View>
                            }
                        </View>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </ScrollView>
        </CustomHeaderView>
    );
}

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
    },

    container: {
        flex: 1,
    },

    authView: {
        flex: 1,
        padding: Spacing.xl,
        gap: Spacing.xl,
    },

    intro: {
        textAlign: 'center',
    },

    formView: {
        gap: Spacing.lg,
    },

    submit: {
        marginTop: Spacing.sm,
    },
})
