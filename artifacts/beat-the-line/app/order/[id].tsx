import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { getGetOrderQueryKey, useGetOrder } from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const money = (value: number) => `$${value.toFixed(2)}`;
const prettyTime = (time: string) => {
  const [hourText, minute] = time.split(':');
  const hour = Number(hourText);
  return `${hour > 12 ? hour - 12 : hour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
};

export default function OrderConfirmationScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = Number(id);
  const { data: order, isLoading, isError, refetch } = useGetOrder(orderId, {
    query: {
      enabled: Number.isInteger(orderId) && orderId > 0,
      queryKey: getGetOrderQueryKey(orderId),
    },
  });
  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 0);

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Getting your order…</Text>
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <View style={[styles.errorIcon, { backgroundColor: colors.secondary }]}>
          <Feather name="alert-circle" size={24} color={colors.primary} />
        </View>
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Order not found</Text>
        <Text style={[styles.errorCopy, { color: colors.mutedForeground }]}>We couldn’t load this confirmation.</Text>
        <Pressable onPress={() => refetch()} style={styles.retry}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 30 + bottomInset }]} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Text style={[styles.brand, { color: colors.foreground }]}>BeatTheLine</Text>
          <View style={[styles.confirmedPill, { backgroundColor: colors.secondary }]}>
            <View style={styles.confirmedDot} />
            <Text style={[styles.confirmedText, { color: colors.primary }]}>CONFIRMED</Text>
          </View>
        </View>
        <View style={styles.checkCircle}>
          <Feather name="check" size={38} color="#FFFFFF" />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>You’re all set, {order.studentName.split(' ')[0]}.</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Your lunch is being made fresh. See you soon!</Text>

        <View style={[styles.pickupCard, { backgroundColor: '#E8EFD9' }]}>
          <View style={styles.pickupLabelRow}>
            <Feather name="clock" size={15} color="#287A54" />
            <Text style={styles.pickupLabel}>PICKUP TIME</Text>
          </View>
          <Text style={styles.pickupTime}>{prettyTime(order.pickupTime)}</Text>
          <Text style={styles.pickupDate}>Today · Dining hall pickup counter</Text>
          <View style={styles.codeDivider} />
          <Text style={styles.codeLabel}>YOUR PICKUP CODE</Text>
          <Text accessibilityLabel={`Pickup code ${order.pickupCode}`} style={styles.pickupCode}>{order.pickupCode}</Text>
          <Text style={styles.codeHint}>Show this code at the counter</Text>
        </View>

        <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryTop}>
            <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Your order</Text>
            <Text style={[styles.summaryNumber, { color: colors.mutedForeground }]}>#{String(order.id).padStart(4, '0')}</Text>
          </View>
          {order.items.map((item) => (
            <View key={item.itemId} style={styles.summaryRow}>
              <Text style={[styles.itemText, { color: colors.foreground }]}>{item.quantity} × {item.name}</Text>
              <Text style={[styles.itemPrice, { color: colors.foreground }]}>{money(item.price * item.quantity)}</Text>
            </View>
          ))}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total · pay at pickup</Text>
            <Text style={[styles.totalValue, { color: colors.foreground }]}>{money(order.total)}</Text>
          </View>
        </View>
        <View style={styles.tip}>
          <Feather name="info" size={15} color={colors.primary} />
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>Head to the pickup counter at your selected time. Payment is due there.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          testID="back-to-menu"
          onPress={() => router.replace('/')}
          style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
        >
          <Feather name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.doneText}>Back to menu</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 22, paddingTop: 10, alignItems: 'center' },
  topBar: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 26 },
  brand: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3 },
  confirmedPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 18, paddingHorizontal: 9, paddingVertical: 6 },
  confirmedDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4F9A62' },
  confirmedText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.7 },
  checkCircle: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#287A54', alignItems: 'center', justifyContent: 'center', marginBottom: 17 },
  title: { fontSize: 23, lineHeight: 30, fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' },
  subtitle: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 7, marginBottom: 22 },
  pickupCard: { width: '100%', borderRadius: 21, padding: 19, alignItems: 'center', marginBottom: 16 },
  pickupLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pickupLabel: { fontSize: 10, color: '#287A54', fontWeight: '700', letterSpacing: 1 },
  pickupTime: { fontSize: 30, lineHeight: 36, color: '#214D34', fontWeight: '700', marginTop: 7 },
  pickupDate: { fontSize: 11, color: '#59715D', marginTop: 3, textAlign: 'center' },
  codeDivider: { height: 1, width: '100%', backgroundColor: 'rgba(40,122,84,0.18)', marginTop: 16, marginBottom: 13 },
  codeLabel: { color: '#58725E', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  pickupCode: { fontSize: 34, lineHeight: 42, color: '#214D34', fontWeight: '700', letterSpacing: 3, marginTop: 2 },
  codeHint: { fontSize: 10, color: '#59715D', marginTop: 2 },
  summary: { width: '100%', borderRadius: 17, borderWidth: 1, padding: 15 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  summaryTitle: { fontSize: 14, fontWeight: '700' },
  summaryNumber: { fontSize: 11 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  itemText: { flex: 1, paddingRight: 10, fontSize: 12 },
  itemPrice: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 12, fontWeight: '700' },
  totalValue: { fontSize: 14, fontWeight: '700' },
  tip: { width: '100%', flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 14, marginBottom: 16, paddingHorizontal: 2 },
  tipText: { flex: 1, fontSize: 11, lineHeight: 16 },
  doneButton: { width: '100%', height: 52, backgroundColor: '#287A54', borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  doneText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 },
  loadingText: { marginTop: 9, fontSize: 12 },
  errorIcon: { height: 52, width: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  errorTitle: { fontSize: 19, fontWeight: '700', marginTop: 14 },
  errorCopy: { fontSize: 12, marginTop: 5 },
  retry: { padding: 12, marginTop: 8 },
  retryText: { color: '#287A54', fontWeight: '700', fontSize: 13 },
});
