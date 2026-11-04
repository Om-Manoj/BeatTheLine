import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth, useClerk } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetStaffOrdersQueryKey,
  useGetStaffOrders,
  useUpdateStaffOrderStatus,
} from '@workspace/api-client-react';
import type {
  OrderStatus,
  StaffOrder,
  StaffOrderStatusUpdateStatus,
} from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

const nextStatus: Partial<
  Record<OrderStatus, { status: StaffOrderStatusUpdateStatus; label: string }>
> = {
  new: { status: 'preparing', label: 'Start preparing' },
  preparing: { status: 'ready', label: 'Mark ready' },
  ready: { status: 'collected', label: 'Mark picked up' },
};
const statusLabel: Record<OrderStatus, string> = {
  new: 'New order',
  preparing: 'Preparing',
  ready: 'Ready for pickup',
  collected: 'Picked up',
};
const formatTime = (time: string) => {
  const [hourText, minute] = time.split(':');
  const hour = Number(hourText);
  return `${hour > 12 ? hour - 12 : hour}:${minute} ${hour >= 12 ? 'PM' : 'AM'}`;
};
const minutesOfDay = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
};
const groupOrdersByPickupTime = (orders: StaffOrder[]) => {
  const groups = new Map<string, StaffOrder[]>();
  orders.forEach((order) => {
    const slotOrders = groups.get(order.pickupTime) ?? [];
    slotOrders.push(order);
    groups.set(order.pickupTime, slotOrders);
  });

  return Array.from(groups, ([pickupTime, slotOrders]) => ({ pickupTime, orders: slotOrders }))
    .sort((a, b) => minutesOfDay(a.pickupTime) - minutesOfDay(b.pickupTime));
};
const errorStatus = (error: unknown) =>
  typeof error === 'object' && error !== null && 'status' in error
    ? Number(error.status)
    : undefined;
const prototypeStaffHeaders = { 'X-Prototype-Staff-Access': 'demo' };

function OrderCard({ order, isDemoAccess }: { order: StaffOrder; isDemoAccess: boolean }) {
  const colors = useColors();
  const queryClient = useQueryClient();
  const statusMutation = useUpdateStaffOrderStatus({
    request: isDemoAccess ? { headers: prototypeStaffHeaders } : undefined,
    mutation: {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetStaffOrdersQueryKey() }),
    },
  });
  const action = nextStatus[order.status];

  return (
    <View style={[styles.orderCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.orderTop}>
        <View style={styles.orderIdentity}>
          <Text style={[styles.studentName, { color: colors.foreground }]}>{order.studentName}</Text>
          <Text style={[styles.orderNumber, { color: colors.mutedForeground }]}>
            Order #{String(order.id).padStart(4, '0')}
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: order.status === 'ready' ? '#E8EFD9' : colors.accent },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: order.status === 'ready' ? '#287A54' : colors.accentForeground },
            ]}
          >
            {statusLabel[order.status]}
          </Text>
        </View>
      </View>
      <View style={[styles.pickupBy, { backgroundColor: colors.secondary }]}>
        <Feather name="clock" size={15} color={colors.primary} />
        <Text style={[styles.pickupByText, { color: colors.foreground }]}>
          Ready by {formatTime(order.pickupTime)}
        </Text>
        <Text style={[styles.pickupCode, { color: colors.primary }]}>{order.pickupCode}</Text>
      </View>
      <View style={styles.items}>
        {order.items.map((item) => (
          <Text key={item.itemId} style={[styles.itemText, { color: colors.foreground }]}>
            {item.quantity} × {item.name}
          </Text>
        ))}
      </View>
      {action ? (
        <Pressable
          accessibilityRole="button"
          disabled={statusMutation.isPending}
          onPress={() =>
            statusMutation.mutate({ orderId: order.id, data: { status: action.status } })
          }
          style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
        >
          {statusMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.actionText}>{action.label}</Text>
              <Feather name="arrow-right" size={16} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

export default function StaffQueueScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const isDemoAccess = __DEV__ && demo === 'true';
  const { data: orders = [], isLoading, isError, error, refetch, isRefetching } = useGetStaffOrders({
    query: {
      queryKey: [...getGetStaffOrdersQueryKey(), isDemoAccess ? 'demo' : 'clerk'],
      enabled: isLoaded && (Boolean(isSignedIn) || isDemoAccess),
      refetchInterval: 15000,
    },
    request: isDemoAccess ? { headers: prototypeStaffHeaders } : undefined,
  });

  useEffect(() => {
    if (isLoaded && !isSignedIn && !isDemoAccess) router.replace('/staff/sign-in');
  }, [isLoaded, isSignedIn, isDemoAccess]);

  const signOutOfStaff = async () => {
    if (!isDemoAccess) await signOut();
    router.replace('/');
  };
  const pickupSlots = groupOrdersByPickupTime(orders);
  const status = errorStatus(error);
  const topInset = Math.max(insets.top, 24);

  if (!isLoaded || (!isSignedIn && !isDemoAccess)) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingTop: topInset }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>Checking staff access…</Text>
      </View>
    );
  }

  return (
    <View style={[styles.page, { backgroundColor: colors.background, paddingTop: topInset }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>DINING HALL</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Order queue</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={signOutOfStaff} style={styles.signOut}>
          <Feather name="log-out" size={16} color={colors.primary} />
          <Text style={[styles.signOutText, { color: colors.primary }]}>Sign out</Text>
        </Pressable>
      </View>
      <View style={[styles.liveBanner, { backgroundColor: colors.secondary }]}>
        <View style={styles.liveDot} />
        <Text style={[styles.liveText, { color: colors.foreground }]}>
          {isDemoAccess
            ? 'Development demo · credentials not checked · preview access is open'
            : 'Prototype queue · any signed-in account can view · refreshes every 15 seconds'}
        </Text>
      </View>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>Loading orders…</Text>
        </View>
      ) : isError ? (
        <View style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="lock" size={22} color={colors.primary} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>
            {status === 401 ? 'Please sign in again' : 'Order queue unavailable'}
          </Text>
          <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>
            {status === 401
              ? 'Your session has expired. Sign in again to view the queue.'
              : 'The order queue could not load. Try again in a moment.'}
          </Text>
          <Pressable accessibilityRole="button" onPress={() => refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => {
                void refetch();
              }}
              tintColor={colors.primary}
            />
          }
        >
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {orders.length} active {orders.length === 1 ? 'order' : 'orders'}
          </Text>
          {orders.length ? (
            pickupSlots.map((slot) => (
              <View key={slot.pickupTime} style={styles.slotSection}>
                <View style={styles.slotHeader}>
                  <View style={styles.slotTitleGroup}>
                    <Feather name="clock" size={16} color={colors.primary} />
                    <Text style={[styles.slotTitle, { color: colors.foreground }]}>
                      {formatTime(slot.pickupTime)}
                    </Text>
                  </View>
                  <View style={[styles.slotCountBadge, { backgroundColor: colors.secondary }]}>
                    <Text style={[styles.slotCountText, { color: colors.foreground }]}>
                      {slot.orders.length} {slot.orders.length === 1 ? 'order' : 'orders'}
                    </Text>
                  </View>
                </View>
                {slot.orders.map((order) => (
                  <OrderCard key={order.id} order={order} isDemoAccess={isDemoAccess} />
                ))}
              </View>
            ))
          ) : (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="check-circle" size={26} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>You’re all caught up</Text>
              <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>
                New student orders will appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 18 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 15 },
  eyebrow: { fontSize: 10, letterSpacing: 1.3, fontWeight: '700' },
  title: { fontSize: 27, fontWeight: '700', letterSpacing: -0.7, marginTop: 3 },
  signOut: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 42, paddingHorizontal: 8 },
  signOutText: { fontSize: 12, fontWeight: '700' },
  liveBanner: { minHeight: 38, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, marginBottom: 13 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4F9A62' },
  liveText: { fontSize: 11, fontWeight: '600' },
  list: { paddingBottom: 24 },
  count: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  slotSection: { marginBottom: 7 },
  slotHeader: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 2 },
  slotTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  slotTitle: { fontSize: 17, fontWeight: '800' },
  slotCountBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  slotCountText: { fontSize: 11, fontWeight: '700' },
  orderCard: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 11 },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  orderIdentity: { flex: 1 },
  studentName: { fontSize: 16, fontWeight: '700' },
  orderNumber: { fontSize: 10, marginTop: 4 },
  statusPill: { borderRadius: 20, paddingHorizontal: 9, paddingVertical: 6 },
  statusText: { fontSize: 10, fontWeight: '700' },
  pickupBy: { minHeight: 39, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 10, marginTop: 12 },
  pickupByText: { flex: 1, fontSize: 12, fontWeight: '700' },
  pickupCode: { fontSize: 15, fontWeight: '800', letterSpacing: 1 },
  items: { gap: 6, paddingVertical: 12 },
  itemText: { fontSize: 12, lineHeight: 17 },
  actionButton: { minHeight: 43, borderRadius: 12, backgroundColor: '#287A54', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  actionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  pressed: { opacity: 0.82 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9 },
  mutedText: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  errorCard: { alignItems: 'center', gap: 10, padding: 22, borderWidth: 1, borderRadius: 17, marginTop: 28 },
  errorTitle: { fontSize: 16, fontWeight: '700' },
  retryButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 18 },
  retryText: { color: '#287A54', fontSize: 12, fontWeight: '700' },
  emptyCard: { alignItems: 'center', gap: 8, padding: 25, borderWidth: 1, borderRadius: 17, marginTop: 12 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
});
