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
  getGetMenuQueryKey,
  getGetPickupSlotsQueryKey,
  useCreateOrder,
  useGetMenu,
  useGetPickupSlots,
} from '@workspace/api-client-react';
import type { PaymentMethod, PickupSlot } from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '@/context/cart-context';
import { useColors } from '@/hooks/useColors';

const formatDate = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
const money = (value: number) => `AED ${value.toFixed(2)}`;
const SWIPE_VALUE = 33.6;
type BalanceAccount = 'flex_dirhams' | 'campus_dirhams';
const balanceAccounts: { id: BalanceAccount; name: string; detail: string; icon: 'dollar-sign' | 'book-open' }[] = [
  { id: 'flex_dirhams', name: 'Flex dirhams', detail: 'Use Flex for all or part of the remainder', icon: 'dollar-sign' },
  { id: 'campus_dirhams', name: 'Campus dirhams', detail: 'Use Campus for all or part of the remainder', icon: 'book-open' },
];
const paymentName = (method: PaymentMethod) => ({
  meal_swipe: 'Meal swipes',
  flex_dirhams: 'Flex dirhams',
  campus_dirhams: 'Campus dirhams',
  meal_swipe_plus_flex: 'Meal swipes + Flex dirhams',
  meal_swipe_plus_campus: 'Meal swipes + Campus dirhams',
  pay_at_pickup: 'Pay at pickup',
})[method];
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
      <Text style={[styles.slotTime, { color: selected ? colors.primaryForeground : colors.foreground }]}>
        {prettyTime(slot.time)}
      </Text>
      <Text style={[styles.slotCapacity, { color: selected ? colors.primaryForeground : colors.mutedForeground }]}>
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
  const { data: menu = [] } = useGetMenu({
    query: { queryKey: getGetMenuQueryKey(), refetchInterval: 15000 },
  });
  const { data: slots = [], isLoading: slotsLoading, isError: slotsError, refetch } =
    useGetPickupSlots({ date: pickupDate });
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [mealSwipeCount, setMealSwipeCount] = useState(0);
  const [balanceAccount, setBalanceAccount] = useState<BalanceAccount>('flex_dirhams');
  const [showNetIdPreview, setShowNetIdPreview] = useState(false);
  const [deliveryPreviewSelected, setDeliveryPreviewSelected] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [formError, setFormError] = useState('');
  const orderMutation = useCreateOrder();
  const orderItems = menu.filter(
    (item) => item.available && item.price !== null && (quantities[item.id] ?? 0) > 0,
  );
  const total = orderItems.reduce((sum, item) => sum + (item.price ?? 0) * quantities[item.id], 0);
  const maxMealSwipes = Math.min(20, Math.ceil(total / SWIPE_VALUE));
  const safeMealSwipeCount = Math.min(mealSwipeCount, maxMealSwipes);
  const swipeValue = Math.round(safeMealSwipeCount * SWIPE_VALUE * 100) / 100;
  const dirhamRemainder = Math.max(0, Math.round((total - swipeValue) * 100) / 100);
  const unappliedSwipeValue = Math.max(0, Math.round((swipeValue - total) * 100) / 100);
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
          mealSwipeCount: safeMealSwipeCount,
          balanceAccount,
          items: orderItems.map((item) => ({ itemId: item.id, quantity: quantities[item.id] })),
        },
      });
      clearCart();
      await queryClient.invalidateQueries({
        queryKey: getGetPickupSlotsQueryKey({ date: pickupDate }),
      });
      router.replace(`/order/${order.confirmationToken}`);
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
              <View style={[styles.stepNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.stepNumberText, { color: colors.primary }]}>1</Text></View>
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
              <View style={[styles.stepNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.stepNumberText, { color: colors.primary }]}>2</Text></View>
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
            <View style={[styles.deliveryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.deliveryHeader}>
                <View style={[styles.deliveryIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="truck" size={18} color={colors.primary} />
                </View>
                <View style={styles.deliveryCopy}>
                  <Text style={[styles.deliveryTitle, { color: colors.foreground }]}>Student delivery</Text>
                  <Text style={[styles.deliveryDetail, { color: colors.mutedForeground }]}>
                    Another student could bring your order for a small fee.
                  </Text>
                </View>
                <View style={[styles.deliveryBadge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.deliveryBadgeText, { color: colors.accentForeground }]}>FUTURE IDEA</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: deliveryPreviewSelected }}
                accessibilityLabel="Preview the student delivery option"
                testID="student-delivery-preview"
                onPress={() => setDeliveryPreviewSelected((selected) => !selected)}
                style={[
                  styles.deliveryPreviewButton,
                  {
                    backgroundColor: deliveryPreviewSelected ? colors.secondary : colors.background,
                    borderColor: deliveryPreviewSelected ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name={deliveryPreviewSelected ? 'check-circle' : 'circle'}
                  size={18}
                  color={colors.primary}
                />
                <Text style={[styles.deliveryPreviewText, { color: colors.foreground }]}>
                  {deliveryPreviewSelected ? 'Concept preview selected' : 'Preview this option'}
                </Text>
                <Text style={[styles.deliveryFeeLabel, { color: colors.primary }]}>Small fee</Text>
              </Pressable>
              <Text style={[styles.deliveryDisclaimer, { color: colors.mutedForeground }]}>
                Future extension only. Orders still use dining hall pickup; this preview adds no fee and sends no delivery request.
              </Text>
            </View>
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
                    {money((item.price ?? 0) * quantities[item.id])}
                  </Text>
                </View>
              ))}
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.summaryRow}>
                <Text style={[styles.totalLabel, { color: colors.foreground }]}>Total</Text>
                <Text style={[styles.totalValue, { color: colors.foreground }]}>{money(total)}</Text>
              </View>
            </View>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.stepNumber, { backgroundColor: colors.secondary }]}><Text style={[styles.stepNumberText, { color: colors.primary }]}>3</Text></View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Split your payment</Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Demo only · no balance is charged</Text>
              </View>
            </View>
            <View style={[styles.swipeSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.swipeSelectorCopy}>
                <Text style={[styles.swipeSelectorTitle, { color: colors.foreground }]}>Meal swipes</Text>
                <Text style={[styles.swipeSelectorDetail, { color: colors.mutedForeground }]}>
                  AED 33.60 each · whole swipes only
                </Text>
              </View>
              <View style={[styles.swipeCounter, { backgroundColor: colors.secondary }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Use one fewer meal swipe"
                  testID="meal-swipe-minus"
                  disabled={safeMealSwipeCount === 0}
                  onPress={() => setMealSwipeCount((count) => Math.max(0, count - 1))}
                  style={styles.swipeCounterButton}
                >
                  <Feather name="minus" size={16} color={safeMealSwipeCount === 0 ? colors.mutedForeground : colors.primary} />
                </Pressable>
                <Text style={[styles.swipeCount, { color: colors.foreground }]}>{safeMealSwipeCount}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Use one more meal swipe"
                  testID="meal-swipe-plus"
                  disabled={safeMealSwipeCount >= maxMealSwipes}
                  onPress={() => setMealSwipeCount((count) => Math.min(maxMealSwipes, count + 1))}
                  style={styles.swipeCounterButton}
                >
                  <Feather name="plus" size={16} color={safeMealSwipeCount >= maxMealSwipes ? colors.mutedForeground : colors.primary} />
                </Pressable>
              </View>
            </View>
            <Text style={[styles.swipeSummary, { color: colors.mutedForeground }]}>
              {safeMealSwipeCount} × {money(SWIPE_VALUE)} meal swipes
              {dirhamRemainder > 0 ? ` · ${money(dirhamRemainder)} remains` : ''}
            </Text>
            <View style={styles.paymentOptions}>
              {balanceAccounts.map((method) => {
                const selected = balanceAccount === method.id;
                return (
                  <Pressable
                    key={method.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    testID={`payment-${method.id}`}
                    onPress={() => setBalanceAccount(method.id)}
                    style={[
                      styles.paymentOption,
                      {
                        backgroundColor: selected ? colors.secondary : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <View style={[styles.paymentIcon, { backgroundColor: selected ? colors.card : colors.muted }]}>
                      <Feather name={method.icon} size={18} color={colors.primary} />
                    </View>
                    <View style={styles.paymentCopy}>
                      <Text style={[styles.paymentName, { color: colors.foreground }]}>{method.name}</Text>
                      <Text style={[styles.paymentDetail, { color: colors.mutedForeground }]}>{method.detail}</Text>
                    </View>
                    <View style={[styles.radioOuter, { borderColor: selected ? colors.primary : colors.border }]}>
                      {selected && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            {safeMealSwipeCount > 0 && (
              <View style={[styles.swipeEstimate, { backgroundColor: colors.accent }]}>
                <Text style={[styles.swipeEstimateTitle, { color: colors.accentForeground }]}>
                  {safeMealSwipeCount} whole {safeMealSwipeCount === 1 ? 'swipe' : 'swipes'} · {money(swipeValue)}
                </Text>
                {unappliedSwipeValue > 0 ? (
                  <Text style={[styles.swipeEstimateText, { color: colors.accentForeground }]}>
                    {money(unappliedSwipeValue)} is unused and discarded. Meal swipes can’t be split or saved as change.
                  </Text>
                ) : (
                  <Text style={[styles.swipeEstimateText, { color: colors.accentForeground }]}>
                    {dirhamRemainder > 0 ? `${money(dirhamRemainder)} will be covered by ${balanceAccount === 'flex_dirhams' ? 'Flex' : 'Campus'} dirhams.` : 'No dirham balance is needed for this order.'}
                  </Text>
                )}
              </View>
            )}
            {safeMealSwipeCount === 0 && (
              <View style={[styles.swipeEstimate, { backgroundColor: colors.accent }]}>
                <Text style={[styles.swipeEstimateTitle, { color: colors.accentForeground }]}>
                  {money(total)} from {balanceAccount === 'flex_dirhams' ? 'Flex' : 'Campus'} dirhams
                </Text>
                <Text style={[styles.swipeEstimateText, { color: colors.accentForeground }]}>
                  This demo assumes an unlimited balance. No balance check or charge is made.
                </Text>
              </View>
            )}
            {safeMealSwipeCount > 0 && dirhamRemainder > 0 && (
              <View style={[styles.swipeEstimate, { backgroundColor: colors.accent }]}>
                <Text style={[styles.swipeEstimateTitle, { color: colors.accentForeground }]}>
                  {money(dirhamRemainder)} from {balanceAccount === 'flex_dirhams' ? 'Flex' : 'Campus'} dirhams
                </Text>
                <Text style={[styles.swipeEstimateText, { color: colors.accentForeground }]}>
                  This demo assumes an unlimited balance. No balance check or charge is made.
                </Text>
              </View>
            )}
            <View style={[styles.netIdCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.netIdHeading}>
                <View style={[styles.netIdIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="shield" size={17} color={colors.primary} />
                </View>
                <View style={styles.netIdCopy}>
                  <Text style={[styles.netIdTitle, { color: colors.foreground }]}>University NetID</Text>
                  <Text style={[styles.netIdSub, { color: colors.mutedForeground }]}>Link to access campus balances</Text>
                </View>
                <View style={[styles.notLinkedPill, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.notLinkedText, { color: colors.mutedForeground }]}>NOT LINKED</Text>
                </View>
              </View>
              <Pressable
                accessibilityRole="button"
                testID="preview-netid-link"
                onPress={() => setShowNetIdPreview((shown) => !shown)}
                style={({ pressed }) => [
                  styles.netIdButton,
                  { borderColor: colors.border, backgroundColor: colors.background },
                  pressed && styles.pressed,
                ]}
              >
                <Feather name={showNetIdPreview ? 'check' : 'external-link'} size={15} color={colors.primary} />
                <Text style={[styles.netIdButtonText, { color: colors.primary }]}>
                  {showNetIdPreview ? 'Hide sign-in preview' : 'Preview NetID sign-in'}
                </Text>
              </Pressable>
              {showNetIdPreview && (
                <View style={[styles.netIdPreview, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.netIdPreviewTitle, { color: colors.foreground }]}>University sign-in</Text>
                  <Text style={[styles.netIdPreviewText, { color: colors.mutedForeground }]}>
                    In the live app, you’d continue to your university’s secure NetID login. This preview doesn’t collect credentials or link an account.
                  </Text>
                </View>
              )}
            </View>
            <View style={[styles.payNote, { backgroundColor: colors.secondary }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.payNoteText, { color: colors.foreground }]}>Preview only</Text>
              <Text style={[styles.payNoteSub, { color: colors.mutedForeground }]}>No charge</Text>
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
            { backgroundColor: colors.primary },
            (orderMutation.isPending || itemCount === 0 || slotsLoading || slotsError) && styles.disabledButton,
            pressed && styles.pressed,
          ]}
        >
          {orderMutation.isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <>
              <Text style={[styles.placeText, { color: colors.primaryForeground }]}>Place order</Text>
              <Text style={[styles.placeTotal, { color: colors.primaryForeground }]}>{money(total)}</Text>
              <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
            </>
          )}
        </Pressable>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Payment selection only · no real account connected</Text>
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
  stepNumber: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNumberText: { fontSize: 13, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionSub: { fontSize: 11, marginTop: 3 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginBottom: 19 },
  slot: { width: '31.5%', minHeight: 59, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  slotTime: { fontSize: 12, fontWeight: '700' },
  slotCapacity: { fontSize: 10, marginTop: 4 },
  loading: { height: 80, justifyContent: 'center' },
  errorCard: { borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 },
  input: { height: 51, borderRadius: 13, borderWidth: 1, paddingHorizontal: 14, fontSize: 14, marginBottom: 18 },
  deliveryCard: { borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 18 },
  deliveryHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  deliveryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  deliveryCopy: { flex: 1 },
  deliveryTitle: { fontSize: 13, fontWeight: '700' },
  deliveryDetail: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  deliveryBadge: { borderRadius: 9, paddingHorizontal: 7, paddingVertical: 5 },
  deliveryBadgeText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.3 },
  deliveryPreviewButton: { minHeight: 42, borderRadius: 11, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, marginTop: 12 },
  deliveryPreviewText: { flex: 1, fontSize: 11, fontWeight: '600' },
  deliveryFeeLabel: { fontSize: 10, fontWeight: '700' },
  deliveryDisclaimer: { fontSize: 10, lineHeight: 14, marginTop: 9 },
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
  paymentOptions: { gap: 9, marginBottom: 9 },
  swipeSelector: { minHeight: 68, borderRadius: 14, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  swipeSelectorCopy: { flex: 1 },
  swipeSelectorTitle: { fontSize: 13, fontWeight: '700' },
  swipeSelectorDetail: { fontSize: 10, marginTop: 4 },
  swipeCounter: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, minHeight: 38 },
  swipeCounterButton: { width: 36, height: 38, alignItems: 'center', justifyContent: 'center' },
  swipeCount: { minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: '700' },
  swipeSummary: { fontSize: 10, marginTop: 7, marginBottom: 11 },
  paymentOption: { minHeight: 68, borderRadius: 14, borderWidth: 1, paddingHorizontal: 11, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  paymentIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  paymentCopy: { flex: 1 },
  paymentName: { fontSize: 13, fontWeight: '700' },
  paymentDetail: { fontSize: 10, marginTop: 4 },
  radioOuter: { height: 20, width: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioInner: { height: 10, width: 10, borderRadius: 5 },
  swipeEstimate: { borderRadius: 12, padding: 12, marginBottom: 13 },
  swipeEstimateTitle: { fontSize: 12, fontWeight: '700' },
  swipeEstimateText: { fontSize: 10, lineHeight: 15, marginTop: 4 },
  netIdCard: { borderWidth: 1, borderRadius: 15, padding: 12, marginTop: 4 },
  netIdHeading: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  netIdIcon: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  netIdCopy: { flex: 1 },
  netIdTitle: { fontSize: 12, fontWeight: '700' },
  netIdSub: { fontSize: 10, marginTop: 3 },
  notLinkedPill: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 5 },
  notLinkedText: { fontSize: 8, fontWeight: '700', letterSpacing: 0.4 },
  netIdButton: { minHeight: 39, borderWidth: 1, borderRadius: 11, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', marginTop: 11 },
  netIdButtonText: { fontSize: 11, fontWeight: '600' },
  netIdPreview: { borderRadius: 10, padding: 10, marginTop: 10 },
  netIdPreviewTitle: { fontSize: 11, fontWeight: '700' },
  netIdPreviewText: { fontSize: 10, lineHeight: 15, marginTop: 4 },
  formError: { marginTop: 10, fontSize: 12, fontWeight: '600' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 18, paddingTop: 12, backgroundColor: 'rgba(248,244,250,0.98)' },
  placeButton: { minHeight: 55, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 17 },
  placeText: { fontSize: 14, fontWeight: '700' },
  placeTotal: { fontSize: 14, fontWeight: '700', marginLeft: 'auto', marginRight: 12 },
  disabledButton: { opacity: 0.5 },
  footerText: { fontSize: 10, textAlign: 'center', paddingTop: 8, paddingBottom: 4 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
});
