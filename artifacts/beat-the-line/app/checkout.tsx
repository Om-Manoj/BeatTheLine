import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetPickupSlotsQueryKey,
  useCreateOrder,
  useGetMenu,
  useGetPickupSlots,
} from '@workspace/api-client-react';
import type { PickupSlot } from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/cart-context';
import { useColors } from '@/hooks/useColors';

const formatDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const money = (value: number) => `$${value.toFixed(2)}`;
const prettyTime = (time: string) => {
  const [hourText, minute] = time.split(':');
  const hour = Number(hourText);
  return `${hour > 12 ? hour - 12 : hour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
};

function SlotButton({
  slot,
  selected,
  onPress,
}: {
  slot: PickupSlot;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: !slot.available }}
      testID={`pickup-${slot.time.replace(':', '')}`}
      disabled={!slot.available}
      onPress={onPress}
      style={[
        styles.slot,
        {
          backgroundColor: selected ? colors.primary : slot.available ? colors.card : colors.muted,
          borderColor: selected ? colors.primary : colors.border,
          opacity: slot.available ? 1 : 0.55,
        },
      ]}
    >
      <Text style={[styles.slotTime, { color: selected ? '#FFFFFF' : colors.foreground }]}>
        {prettyTime(slot.time)}
      </Text>
      <Text style={[styles.slotCapacity, { color: selected ? '#E6F4E9' : colors.mutedForeground }]}>
        {slot.available ? `${slot.remaining} spots` : 'Full'}
      </Text>
    </Pressable>
  );
}

export default function CheckoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const pickupDate = useMemo(formatDate, []);
  const { quantities, clearCart, itemCount } = useCart();
  const { data: menu = [] } = useGetMenu();
  const { data: slots = [], isLoading: slotsLoading, isError: slotsError, refetch } =
    useGetPickupSlots({ date: pickupDate });
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [studentName, setStudentName] = useState('');
  const [formError, setFormError] = useState('');
  const orderMutation = useCreateOrder();
  const orderItems = menu.filter((item) => (quantities[item.id] ?? 0) > 0);
  const total = orderItems.reduce((sum, item) => sum + item.price * quantities[item.id], 0);
  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 0);

  const placeOrder = async () => {
    if (!studentName.trim()) {
      setFormError('Add your name so we know who to hand it to.');
      return;
    }
    if (!selectedTime) {
      setFormError('Choose a pickup time to continue.');
      return;
    }
    setFormError('');
    Keyboard.dismiss();
    try {
      const order = await orderMutation.mutateAsync({
        data: {
          studentName: studentName.trim(),
          pickupDate,
          pickupTime: selectedTime,
          items: orderItems.map((item) => ({ itemId: item.id, quantity: quantities[item.id] })),
        },
      });
      clearCart();
      await queryClient.invalidateQueries({
        queryKey: getGetPickupSlotsQueryKey({ date: pickupDate }),
      });
      router.replace(`/order/${order.id}`);
    } catch (error) {
      await queryClient.invalidateQueries({
        queryKey: getGetPickupSlotsQueryKey({ date: pickupDate }),
      });
      const message =
        error && typeof error === 'object' && 'status' in error && error.status === 409
          ? 'That pickup time just filled up. Choose another open slot.'
          : 'We couldn’t place the order. Check your connection and try again.';
      setFormError(message);
      refetch();
    }
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to menu"
          testID="back-to-menu"
          onPress={() => router.back()}
          style={[styles.backButton, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={[styles.headerHeading, { color: colors.foreground }]}>Your pickup</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>A couple quick details</Text>
        </View>
        <View style={[styles.stepPill, { backgroundColor: colors.accent }]}>
          <Text style={[styles.stepText, { color: colors.accentForeground }]}>CHECKOUT</Text>
        </View>
      </View>
      <FlatList
        data={[]}
        keyExtractor={() => 'checkout'}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: 165 + bottomInset }]}
        ListHeaderComponent={
          <>
            <View style={styles.sectionTitleRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Choose a pickup time</Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Today · 11:30 AM – 1:30 PM</Text>
              </View>
            </View>
            {slotsLoading ? (
              <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
            ) : slotsError ? (
              <Pressable onPress={() => refetch()} style={[styles.errorCard, { borderColor: colors.border }]}>
                <Text style={{ color: colors.destructive, fontSize: 13 }}>Pickup times didn’t load. Tap to retry.</Text>
              </Pressable>
            ) : (
              <View style={styles.slotGrid}>
                {slots.map((slot) => (
                  <SlotButton
                    key={slot.time}
                    slot={slot}
                    selected={selectedTime === slot.time}
                    onPress={() => {
                      setSelectedTime(slot.time);
                      setFormError('');
                    }}
                  />
                ))}
              </View>
            )}
            <View style={styles.sectionTitleRow}>
              <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Who’s picking it up?</Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>We’ll call this name when it’s ready</Text>
              </View>
            </View>
            <TextInput
              accessibilityLabel="Student name"
              testID="student-name"
              autoCapitalize="words"
              autoComplete="name"
              returnKeyType="done"
              onSubmitEditing={Keyboard.dismiss}
              value={studentName}
              onChangeText={(value) => {
                setStudentName(value);
                if (formError) setFormError('');
              }}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.input, { backgroundColor: colors.card, borderColor: colors.input, color: colors.foreground }]}
            />
            <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.summaryTop}>
                <Text style={[styles.summaryTitle, { color: colors.foreground }]}>Order summary</Text>
                <Text style={[styles.summaryCount, { color: colors.mutedForeground }]}>{itemCount} items</Text>
              </View>
              {orderItems.map((item) => (
                <View key={item.id} style={styles.summaryRow}>
                  <Text style={[styles.summaryItem, { color: colors.foreground }]}>
                    {quantities[item.id]} × {item.name}
                  </Text>
                  <Text style={[styles.summaryPrice, { color: colors.foreground }]}>
                    {money(item.price * quantities[item.id])}
                  </Text>
                </View>
              ))}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.foreground }]}>{money(total)}</Text>
              </View>
            </View>
            <View style={[styles.payNote, { backgroundColor: colors.secondary }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.payNoteText, { color: colors.foreground }]}>Pay at pickup</Text>
              <Text style={[styles.payNoteSub, { color: colors.mutedForeground }]}>No payment needed now</Text>
            </View>
            {formError ? <Text accessibilityRole="alert" style={[styles.formError, { color: colors.destructive }]}>{formError}</Text> : null}
          </>
        }
        renderItem={() => null}
      />
      <View style={[styles.bottomBar, { paddingBottom: bottomInset }]}>
        <Pressable
          accessibilityRole="button"
          testID="place-order"
          disabled={orderMutation.isPending || itemCount === 0 || slotsLoading || slotsError}
          onPress={placeOrder}
          style={({ pressed }) => [
            styles.placeButton,
            (orderMutation.isPending || itemCount === 0 || slotsLoading || slotsError) && styles.disabledButton,
            pressed && styles.pressed,
          ]}
        >
          {orderMutation.isPending ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.placeText}>Place order</Text>
              <Text style={styles.placeTotal}>{money(total)}</Text>
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </>
          )}
        </Pressable>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Pay at pickup · No card needed</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 14 },
  backButton: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1 },
  headerHeading: { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  headerSub: { marginTop: 2, fontSize: 11 },
  stepPill: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
  stepText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.8 },
  content: { paddingHorizontal: 18, paddingTop: 5 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginTop: 10, marginBottom: 13 },
  stepNumber: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#DDEBDD', alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { color: '#287A54', fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionSub: { fontSize: 11, marginTop: 3 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 19 },
  slot: { width: '31.5%', minHeight: 59, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  slotTime: { fontSize: 12, fontWeight: '700' },
  slotCapacity: { fontSize: 10, marginTop: 4 },
  loading: { height: 80, justifyContent: 'center' },
  errorCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  input: { height: 51, borderRadius: 13, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, marginBottom: 18 },
  summary: { borderWidth: 1, borderRadius: 16, padding: 15 },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 11 },
  summaryTitle: { fontSize: 14, fontWeight: '700' },
  summaryCount: { fontSize: 11 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  summaryItem: { fontSize: 12, flex: 1, paddingRight: 10 },
  summaryPrice: { fontSize: 12, fontWeight: '500' },
  divider: { height: 1, marginTop: 8, marginBottom: 5 },
  totalLabel: { fontSize: 13, fontWeight: '700' },
  totalValue: { fontSize: 15, fontWeight: '700' },
  payNote: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, marginTop: 12 },
  payNoteText: { fontSize: 12, fontWeight: '700' },
  payNoteSub: { fontSize: 11, marginLeft: 'auto' },
  formError: { marginTop: 10, fontSize: 12, fontWeight: '600' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 18, paddingTop: 12, backgroundColor: 'rgba(248,248,241,0.98)' },
  placeButton: { minHeight: 55, borderRadius: 16, backgroundColor: '#287A54', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17 },
  placeText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  placeTotal: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 'auto', marginRight: 12 },
  disabledButton: { opacity: 0.5 },
  footerText: { fontSize: 10, textAlign: 'center', paddingTop: 8, paddingBottom: 4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
