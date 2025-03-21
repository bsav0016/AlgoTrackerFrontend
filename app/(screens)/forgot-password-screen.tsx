import React, { useState } from "react";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { useToast } from "@/contexts/ToastContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { Routes } from "@/app/Routes";
import { ThemedText } from "@/components/ThemedText";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableWithoutFeedback } from "react-native";
import { GeneralButton } from "@/components/GeneralButton";
import { useThemeColor } from "@/hooks/useThemeColor";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AuthService } from "@/features/auth/AuthService";


export default function ForgotPassword() {
    const { addToast } = useToast();
    const { routeTo } = useRouteTo();

    const color = useThemeColor({}, 'text');
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
        <CustomHeaderView header={"Forgot Password"}>
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <ThemedView style={styles.authView}>
                        { sentEmail ?
                        <ThemedView style={styles.formView}>
                            {(resetFields.map((field, i) => (
                                <ThemedView style={styles.fieldView} key={i}>
                                    <ThemedView style={styles.textView}>
                                        <ThemedText>{field.text}: </ThemedText>
                                    </ThemedView>
                                    <TextInput
                                        value={field.value}
                                        onChangeText={(newText) => field.setValue(newText)}
                                        style={[
                                            styles.textInput,
                                            { color: color, borderColor: color }
                                        ]}
                                        textContentType={"oneTimeCode"}
                                        keyboardType={field.textKeyboard ? "default" : "email-address"}
                                        returnKeyType={i === resetFields.length - 1 ? 'done' : 'next'}
                                        secureTextEntry={i >= 2}
                                        onSubmitEditing={() => Keyboard.dismiss()}
                                    />
                                </ThemedView>
                            )))}

                            { processing ? 
                            <LoadingSpinner />
                            :
                            <GeneralButton title={"Reset Password"} onPress={confirmReset} />
                            }  
                        </ThemedView>

                        :

                        <ThemedView style={styles.formView}>
                            <ThemedView style={styles.fieldView}>
                                <ThemedView style={styles.textView}>
                                    <ThemedText>Email: </ThemedText>
                                </ThemedView>
                                <TextInput
                                    value={email}
                                    onChangeText={(newText) => setEmail(newText)}
                                    style={[
                                        styles.textInput,
                                        { color: color, borderColor: color }
                                    ]}
                                    textContentType={"oneTimeCode"}
                                    keyboardType={"email-address"}
                                    returnKeyType={'done'}
                                    onSubmitEditing={() => Keyboard.dismiss()}
                                />
                            </ThemedView>

                            { processing ? 
                            <LoadingSpinner />
                            : 
                            <GeneralButton title={"Request Reset"} onPress={sendResetEmail} />
                            }  
                        </ThemedView>
                        }
                    </ThemedView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
            </ScrollView>
        </CustomHeaderView>
    );    
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    authView: {
        flex: 1,
        justifyContent: 'center',
        marginBottom: 60
    },

    formView: {
        alignItems: 'center',
        paddingHorizontal: 30,
        gap: 10,
    },

    fieldView: {
        flexDirection: 'row',
        alignItems: 'flex-end'
    },

    textView: {
        flex: 1,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        textAlign:'right'
    },

    textInput: {
        flex: 2,
        borderWidth: 1,
        borderRadius: 3,
        padding: 3,
        fontSize: 20,
        height: 30,
        width: '30%',
    }
})