import React, { RefObject, useEffect, useState } from "react";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { Routes } from "@/app/Routes";
import { ThemedText } from "@/components/ThemedText";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableWithoutFeedback, View } from "react-native";
import { AuthFields } from "@/features/auth/AuthFields";
import { AuthType } from "@/features/auth/AuthType";
import { GeneralButton } from "@/components/GeneralButton";
import { TextField } from "@/components/TextField";
import { Spacing, Type } from "@/constants/Theme";
import { useUser } from "@/contexts/UserContext";
import { AuthError } from "@/features/auth/AuthError";
import { AuthService } from "@/features/auth/AuthService";


interface Field<T> {
    field: keyof T;
    text: string;
    value: string | undefined;
    ref: RefObject<TextInput | null>;
}

export default function LoginScreen() {
    const { auth } = useAuth();
    const { addToast } = useToast();
    const { routeTo, routeReplace } = useRouteTo();
    const { userRef } = useUser();
    const { accessToken } = useAuth();
    const [formFields, setFormFields] = useState<AuthFields>({
        username: "",
        password: "",
        confirmPassword: undefined,
        email: undefined,
        firstName: undefined,
        lastName: undefined,
        promoCode: undefined
    });
    const [promoCodeAvailability, setPromoCodeAvailability] = useState<boolean>(false);
    const [type, setType] = useState<AuthType>(AuthType.Login);
    const [processing, setProcessing] = useState<Boolean>(false);

    const usernameRef = React.createRef<TextInput>();
    const passwordRef = React.createRef<TextInput>();
    const confirmPasswordRef = React.createRef<TextInput>();
    const emailRef = React.createRef<TextInput>();
    const firstNameRef = React.createRef<TextInput>();
    const lastNameRef = React.createRef<TextInput>();
    const promoCodeRef = React.createRef<TextInput>();

    useEffect(() => {
        if (userRef.current && accessToken) {
            routeReplace(Routes.Home);
        }
    }, [userRef.current, accessToken]);

    useEffect(() => {
        const checkPromoCodeAvailability = async () => {
            try {
                const availability = await AuthService.getPromoCodeAvailability();
                setPromoCodeAvailability(availability);
            } catch (error) {
                setPromoCodeAvailability(false);
            }
        }

        checkPromoCodeAvailability();
    }, [])

    const focusNextField = (nextField: React.RefObject<TextInput | null>) => {
        nextField.current?.focus();
    };

    const updateFormField = (fieldName: keyof AuthFields, value: string) => {
        setFormFields((prevFields) => ({
            ...prevFields,
            [fieldName]: value,
        }));
    };

    const loginFields: Field<AuthFields>[] = [
        { field: "username", text: "Username", value: formFields.username, ref: usernameRef },
        { field: "password", text: "Password", value: formFields.password, ref: passwordRef },
    ];

    const registerFields: Field<AuthFields>[] = [
        ...loginFields,
        { field: "confirmPassword", text: "Confirm Password", value: formFields.confirmPassword, ref: confirmPasswordRef },
        { field: "firstName", text: "First Name", value: formFields.firstName, ref: firstNameRef },
        { field: "lastName", text: "Last Name", value: formFields.lastName, ref: lastNameRef },
        { field: "email", text: "Email", value: formFields.email, ref: emailRef },
        { field: "promoCode", text: "Promo Code", value: formFields.promoCode, ref: promoCodeRef}
    ];

    const authUser = async () => {
        if (formFields.username.length === 0) {
            addToast("Username cannot be blank");
            return;
        }
        if (formFields.password.length === 0) {
            addToast("Password cannot be blank");
            return;
        }
        if (type === AuthType.Register && formFields.email !== undefined) {
            if (!validateEmail(formFields.email)) {
                addToast("Please use a valid email");
                return;
            }
        }
        if (formFields.confirmPassword !== undefined) {
            console.log(formFields.confirmPassword, formFields.password)
            if (type === AuthType.Register && (formFields.confirmPassword !== formFields.password)) {
                addToast("Passwords must match");
                return;
            }
        }
        
        setProcessing(true);
        try {
            const response = await auth(formFields, type);
            if (response) {
                routeReplace(Routes.Home);
            } else {
                addToast("Invalid username and password");
            }
        } catch (error) {
            let errorMessage: string;
            if (
                error === AuthError.UsernameTaken ||
                error === AuthError.EmailTaken ||
                error === AuthError.InvalidEmail ||
                error === AuthError.InvalidPromoCode
            ) {
                errorMessage = error;
            }
            else {
                errorMessage = error instanceof Error ? error.message : "Unknown error"
            }
            addToast(errorMessage);
        } finally {
            setProcessing(false);
        }
    };

    const switchType = () => {
        if (type === AuthType.Login) {
            setType(AuthType.Register);
        } else {
            setType(AuthType.Login);
        }
    }

    const validateEmail = (testEmail: string) => {
        const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (regex.test(testEmail)) {
            return true;
        } else {
            return false;
        }
    };

    const displayedFields: Field<AuthFields>[] = type === AuthType.Login ? loginFields : registerFields;
    const header: string = type === AuthType.Login ? "Login" : "Register"
    const bottomText: string = type === AuthType.Login ? "New User?" : "Already Have an Account?"
    const bottomButtom: string = type === AuthType.Login ? "Register Here" : "Login Here"

    return (
        <CustomHeaderView header={header} canGoBack={false} displayFunds={false}>
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
                >
                    <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} accessible={false}>
                        <View style={styles.authView}>
                            <View style={styles.brand}>
                                <ThemedText style={styles.brandName}>AlgoTracker</ThemedText>
                                <ThemedText type="muted" style={styles.brandTagline}>
                                    Build, back-test and follow trading strategies
                                </ThemedText>
                            </View>

                            <View style={styles.formView}>
                                {displayedFields.map((field, index) => {
                                    const isLastField = index === displayedFields.length - 1;
                                    if (field.field !== "promoCode" || promoCodeAvailability) {
                                        return (
                                            <TextField
                                                key={field.field}
                                                label={field.text}
                                                inputRef={field.ref}
                                                value={field.value}
                                                onChangeText={(value) => updateFormField(field.field, value)}
                                                secureTextEntry={field.field.toLowerCase().includes("password")}
                                                autoCapitalize={field.field === "firstName" || field.field === "lastName" ? "words" : "none"}
                                                autoCorrect={false}
                                                textContentType={"oneTimeCode"}
                                                keyboardType={field.field === "email" ? "email-address" : "default"}
                                                returnKeyType={isLastField ? 'done' : 'next'}
                                                onSubmitEditing={() => {
                                                    if (isLastField) {
                                                        Keyboard.dismiss();
                                                    } else {
                                                        const nextField = displayedFields[index + 1].ref;
                                                        focusNextField(nextField);
                                                    }
                                                }}
                                            />
                                        );
                                    }
                                    return null;
                                })}

                                <View style={styles.submit}>
                                    <GeneralButton
                                        title={header}
                                        onPress={authUser}
                                        loading={!!processing}
                                        autoWidth={false}
                                    />
                                </View>
                            </View>

                            <View style={styles.links}>
                                <View style={styles.switchView}>
                                    <ThemedText type="muted">{bottomText}</ThemedText>
                                    <GeneralButton title={bottomButtom} variant="ghost" compact onPress={switchType} />
                                </View>

                                {type === AuthType.Login &&
                                    <GeneralButton
                                        title="Forgot password?"
                                        variant="ghost"
                                        compact
                                        onPress={() => routeTo(Routes.ForgotPassword)}
                                    />
                                }
                            </View>
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
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: Spacing.xxl,
        gap: Spacing.xl,
    },

    brand: {
        alignItems: 'center',
        gap: Spacing.xs,
    },

    brandName: {
        ...Type.display,
    },

    brandTagline: {
        textAlign: 'center',
    },

    formView: {
        gap: Spacing.lg,
    },

    submit: {
        marginTop: Spacing.sm,
    },

    links: {
        alignItems: 'center',
    },

    switchView: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
})
