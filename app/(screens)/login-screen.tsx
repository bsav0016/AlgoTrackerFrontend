import React, { RefObject, useEffect, useState } from "react";
import { CustomHeaderView } from "@/components/CustomHeaderView";
import { ThemedView } from "@/components/ThemedView";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useRouteTo } from "@/contexts/RouteContext";
import { Routes } from "@/app/Routes";
import { ThemedText } from "@/components/ThemedText";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, TouchableOpacity, TouchableWithoutFeedback } from "react-native";
import { AuthFields } from "@/features/auth/AuthFields";
import { AuthType } from "@/features/auth/AuthType";
import { GeneralButton } from "@/components/GeneralButton";
import { Colors } from "@/constants/Colors";
import { useThemeColor } from "@/hooks/useThemeColor";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useUser } from "@/contexts/UserContext";
import { AuthError } from "@/features/auth/AuthError";
import { AuthService } from "@/features/auth/AuthService";


interface Field<T> {
    field: keyof T;
    text: string;
    value: string | undefined;
    ref: RefObject<TextInput>;
}

export default function LoginScreen() {
    const { auth } = useAuth();
    const { addToast } = useToast();
    const { routeTo, routeReplace } = useRouteTo();
    const { userRef } = useUser();
    const { accessToken } = useAuth();
    const color = useThemeColor({}, 'text');
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

    const focusNextField = (nextField: React.RefObject<TextInput>) => {
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
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">

            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
                    <ThemedView style={styles.authView}>
                        <ThemedView style={styles.formView}>
                            {displayedFields.map((field, index) => {
                                const isLastField = index === displayedFields.length - 1;
                                if (field.field !== "promoCode" || promoCodeAvailability) {
                                    return (
                                        <ThemedView key={field.field} style={styles.fieldView}>
                                            <ThemedView style={styles.textView}>
                                                <ThemedText>{`${field.text}: `}</ThemedText>
                                            </ThemedView>
                                            <TextInput
                                                ref={field.ref}
                                                value={field.value}
                                                onChangeText={(value) => updateFormField(field.field, value)}
                                                secureTextEntry={field.field.toLowerCase().includes("password")}
                                                style={[
                                                    styles.textInput,
                                                    { color: color, borderColor: color }
                                                ]}
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
                                        </ThemedView>
                                    );
                                }
                                else {
                                    return null;
                                }
                            })}
                            { processing ? 
                            <LoadingSpinner />
                            :
                            <GeneralButton title={header} onPress={authUser} />
                            }
                            
                        </ThemedView>

                        <ThemedView style={styles.switchView}>
                            <ThemedText>{bottomText}</ThemedText>
                            <TouchableOpacity onPress={switchType}>
                                <ThemedText style={[styles.switchButton, { color: Colors.button.background }]}>
                                    {bottomButtom}
                                </ThemedText>
                            </TouchableOpacity>
                        </ThemedView>

                        {type === AuthType.Login &&
                            <ThemedView style={styles.switchView}>
                                <TouchableOpacity onPress={() => routeTo(Routes.ForgotPassword)}>
                                    <ThemedText style={[styles.switchButton, { color: Colors.button.background }]}>
                                        Forgot Password?
                                    </ThemedText>
                                </TouchableOpacity>
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
        flex: 1.75,
        borderWidth: 1,
        borderRadius: 3,
        padding: 3,
        fontSize: 20,
        height: 30,
        width: '30%',
    },

    switchView: {
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 5,
        marginTop: 20
    },

    switchButton: {
        textDecorationLine: 'underline'
    },
})