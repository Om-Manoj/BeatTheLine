import React, { useEffect, useState } from 'react';
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
import { useAuth, useSignIn } from '@clerk/expo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export default function StaffSignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();
  const { signIn, fetchStatus } = useSignIn();
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [formError, setFormError] = useState('');
  const isVerifying =
    signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor';
  const busy = fetchStatus === 'fetching';

  useEffect(() => {
    if (isLoaded && isSignedIn) router.replace('/staff');
  }, [isLoaded, isSignedIn]);

  const finishSignIn = async () => {
    await signIn.finalize({
      navigate: async ({ session, decorateUrl }) => {
        if (session?.currentTask) {
          setFormError('Complete the requested account step before opening staff orders.');
          return;
        }
        router.replace(decorateUrl('/staff') as Href);
      },
    });
  };

  const handleSignIn = async () => {
    setFormError('');
    if (__DEV__) {
      if (!emailAddress.trim() || !password) {
        setFormError('Enter any email and password to use development demo access.');
        return;
      }
      setPassword('');
      router.replace('/staff?demo=true' as Href);
      return;
    }
    const { error } = await signIn.password({ emailAddress: emailAddress.trim(), password });
    if (error) {
      setFormError('That email or password could not be verified.');
      return;
    }
    if (signIn.status === 'complete') {
      await finishSignIn();
    } else if (signIn.status === 'needs_client_trust' || signIn.status === 'needs_second_factor') {
      const emailCodeFactor = signIn.supportedSecondFactors?.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      } else {
        setFormError('This account needs a verification method that is not available here.');
      }
    } else {
      setFormError('Sign-in needs an additional account step. Contact your dining administrator.');
    }
  };

  const handleVerify = async () => {
    setFormError('');
    const { error } = await signIn.mfa.verifyEmailCode({ code: verificationCode.trim() });
    if (error) {
      setFormError('That verification code could not be verified.');
      return;
    }
    if (signIn.status === 'complete') await finishSignIn();
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
          <Text style={[styles.backText, { color: colors.primary }]}>Choose another role</Text>
        </Pressable>
        <Text style={[styles.eyebrow, { color: colors.primary }]}>BEATTHELINE · STAFF</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {isVerifying ? 'Verify it’s you' : 'Staff sign in'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Sign in to see the prototype live pickup queue.
        </Text>

        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {isVerifying ? (
            <>
              <Text style={[styles.label, { color: colors.foreground }]}>Email verification code</Text>
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
              <Pressable disabled={busy} onPress={() => signIn.mfa.sendEmailCode()} style={styles.resend}>
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
                accessibilityLabel="Password"
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, { color: colors.foreground, borderColor: colors.border }]}
              />
            </>
          )}
          {formError ? <Text accessibilityRole="alert" style={styles.error}>{formError}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={busy || (isVerifying ? !verificationCode.trim() : !emailAddress.trim() || !password)}
            onPress={isVerifying ? handleVerify : handleSignIn}
            style={({ pressed }) => [
              styles.primaryButton,
              (busy || (isVerifying ? !verificationCode.trim() : !emailAddress.trim() || !password)) &&
                styles.disabled,
              pressed && styles.pressed,
            ]}
          >
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>
              {isVerifying ? 'Verify and continue' : __DEV__ ? 'Demo sign in' : 'Sign in'}
            </Text>}
          </Pressable>
          {!isVerifying ? (
            <Pressable onPress={() => router.push('/staff/sign-up')} style={styles.signupLink}>
              <Text style={[styles.signupText, { color: colors.mutedForeground }]}>
                New staff account? <Text style={{ color: colors.primary, fontWeight: '700' }}>Create one</Text>
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.notice}>
          <Feather name="lock" size={15} color={colors.primary} />
          <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>
            {__DEV__
              ? 'Development demo only: any non-empty values continue. Credentials are not checked or sent. Anyone with this preview can access orders.'
              : 'Any signed-in account can view prototype order names and pickup details.'}
          </Text>
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
  signupLink: { minHeight: 43, justifyContent: 'center', alignItems: 'center', marginTop: 5 },
  signupText: { fontSize: 12 },
  notice: { flexDirection: 'row', alignItems: 'flex-start', gap: 9, marginTop: 18, paddingHorizontal: 4 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 16 },
});
