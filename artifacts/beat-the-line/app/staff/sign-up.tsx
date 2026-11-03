import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSignUp } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export default function StaffSignUpScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signUp, fetchStatus } = useSignUp();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [formError, setFormError] = useState('');
  const busy = fetchStatus === 'fetching';
  const isVerifying =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  const finishSignUp = async () => {
    await signUp.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          setFormError('Complete the requested account step before opening staff orders.');
          return;
        }
        router.replace(decorateUrl('/staff') as Href);
      },
    });
  };

  const handleSignUp = async () => {
    setFormError('');
    const { error } = await signUp.password({
      emailAddress: emailAddress.trim(),
      password,
    });
    if (error) {
      setFormError('We could not start account setup. Check the email and password, then try again.');
      return;
    }
    const { error: codeError } = await signUp.verifications.sendEmailCode();
    if (codeError) setFormError('We could not send a verification code to that email.');
  };

  const handleVerify = async () => {
    setFormError('');
    const { error } = await signUp.verifications.verifyEmailCode({
      code: verificationCode.trim(),
    });
    if (error) {
      setFormError('That verification code could not be verified.');
      return;
    }
    if (signUp.status === 'complete') await finishSignUp();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.page, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 67 : 24) + 20, paddingBottom: Math.max(insets.bottom, 24) + 20 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backLink}>
          <Feather name="arrow-left" size={18} color={colors.primary} />
          <Text style={[styles.backText, { color: colors.primary }]}>Back to staff sign in</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>BEATTHELINE · STAFF</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isVerifying ? 'Verify your email' : 'Create staff account'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          This prototype gives every signed-in account access to the live order queue.
        </Text>
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {isVerifying ? (
            <>
              <Text style={[styles.label, { color: colors.foreground }]}>Verification code</Text>
              <TextInput
                accessibilityLabel="Email verification code"
                autoCapitalize="none"
                keyboardType="number-pad"
                value={verificationCode}
                onChangeText={setVerificationCode}
                placeholder="Enter the code from your email"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              />
              <Pressable disabled={busy} onPress={() => signUp.verifications.sendEmailCode()} style={styles.resend}>
                <Text style={[styles.resendText, { color: colors.primary }]}>Send a new code</Text>
              </Pressable>
            </>
          ) : (
            <>
              <Text style={[styles.label, { color: colors.foreground }]}>Work email</Text>
              <TextInput
                accessibilityLabel="Work email"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={emailAddress}
                onChangeText={setEmailAddress}
                placeholder="name@university.edu"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              />
              <Text style={[styles.label, { color: colors.foreground }]}>Password</Text>
              <TextInput
                accessibilityLabel="Create password"
                autoCapitalize="none"
                autoComplete="new-password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="Create a password"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              />
            </>
          )}
          {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={busy || (isVerifying ? !verificationCode.trim() : !emailAddress.trim() || password.length < 8)}
            onPress={isVerifying ? handleVerify : handleSignUp}
            style={({ pressed }) => [
              styles.primaryButton,
              (busy || (isVerifying ? !verificationCode.trim() : !emailAddress.trim() || password.length < 8)) &&
                styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>
              {isVerifying ? 'Verify and continue' : 'Create account'}
            </Text>}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22 },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 34, minHeight: 40 },
  backText: { fontSize: 13, fontWeight: '600' },
  eyebrow: { fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  title: { fontSize: 29, fontWeight: '700', letterSpacing: -0.7, marginTop: 7 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 22 },
  formCard: { borderWidth: 1, borderRadius: 18, padding: 17 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 7, marginTop: 10 },
  input: { minHeight: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 14 },
  resend: { minHeight: 37, justifyContent: 'center', alignSelf: 'flex-start' },
  resendText: { fontSize: 12, fontWeight: '700' },
  error: { color: '#B13D32', fontSize: 12, lineHeight: 17, marginTop: 12 },
  primaryButton: { minHeight: 50, borderRadius: 13, backgroundColor: '#287A54', justifyContent: 'center', alignItems: 'center', marginTop: 17 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.52 },
  pressed: { opacity: 0.82 },
});
