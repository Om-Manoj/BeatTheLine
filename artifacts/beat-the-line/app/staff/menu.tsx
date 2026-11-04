import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetMenuQueryKey,
  getGetStaffMenuQueryKey,
  useCreateMenuItem,
  useGetMenu,
  useGetRestaurants,
  useGetStaffMenu,
  useUpdateMenuItem,
} from '@workspace/api-client-react';
import type { MenuItem, MenuItemInput, MenuItemUpdate } from '@workspace/api-client-react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';

type MenuDraft = {
  name: string;
  description: string;
  category: string;
  price: string;
  vegetarian: boolean;
  available: boolean;
};

const blankDraft: MenuDraft = {
  name: '',
  description: '',
  category: '',
  price: '',
  vegetarian: false,
  available: true,
};
const demoHeaders = { 'X-Prototype-Staff-Access': 'demo' };
const money = (price: number | null) => (price === null ? 'Price not set' : `AED ${price.toFixed(2)}`);
const updateBody = (item: MenuItem, available = item.available): MenuItemUpdate => ({
  name: item.name,
  description: item.description,
  category: item.category,
  price: item.price,
  vegetarian: item.vegetarian,
  available,
});
const getErrorText = (error: unknown) =>
  error instanceof Error ? error.message : 'The menu could not be saved. Please try again.';

export default function StaffMenuScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { isLoaded, isSignedIn } = useAuth();
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const isDemoAccess = __DEV__ && demo === 'true';
  const canAccess = Boolean(isSignedIn) || isDemoAccess;
  const request = isDemoAccess ? { headers: demoHeaders } : undefined;
  const { data: restaurants = [], isLoading: restaurantsLoading } = useGetRestaurants();
  const {
    data: menuItems = [],
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useGetStaffMenu({
    query: {
      queryKey: [...getGetStaffMenuQueryKey(), isDemoAccess ? 'demo' : 'clerk'],
      enabled: isLoaded && canAccess,
      refetchInterval: 15000,
    },
    request,
  });
  const [restaurantId, setRestaurantId] = useState('switch');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [draft, setDraft] = useState<MenuDraft>(blankDraft);
  const [formError, setFormError] = useState('');
  const [listError, setListError] = useState('');

  const invalidateMenus = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getGetStaffMenuQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetMenuQueryKey() }),
    ]);
  };
  const updateMutation = useUpdateMenuItem({
    request,
    mutation: { onSuccess: invalidateMenus },
  });
  const createMutation = useCreateMenuItem({
    request,
    mutation: { onSuccess: invalidateMenus },
  });
  const selectedRestaurant = restaurants.find((restaurant) => restaurant.id === restaurantId);
  const selectedItems = useMemo(
    () => menuItems.filter((item) => item.restaurantId === restaurantId),
    [menuItems, restaurantId],
  );
  const isSaving = updateMutation.isPending || createMutation.isPending;
  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 0);

  useEffect(() => {
    if (isLoaded && !canAccess) router.replace('/staff/sign-in');
  }, [isLoaded, canAccess]);

  const returnToQueue = () => {
    if (isDemoAccess) router.replace({ pathname: '/staff', params: { demo: 'true' } });
    else router.replace('/staff');
  };

  const openNewItem = () => {
    setEditingItem(null);
    setDraft(blankDraft);
    setFormError('');
    setIsEditorOpen(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setDraft({
      name: item.name,
      description: item.description,
      category: item.category,
      price: item.price === null ? '' : String(item.price),
      vegetarian: item.vegetarian,
      available: item.available,
    });
    setFormError('');
    setIsEditorOpen(true);
  };

  const closeEditor = () => {
    if (isSaving) return;
    setIsEditorOpen(false);
    setFormError('');
  };

  const saveItem = async () => {
    const name = draft.name.trim();
    const category = draft.category.trim();
    const priceText = draft.price.trim();
    const price = priceText === '' ? null : Number(priceText);
    if (!name || !category) {
      setFormError('Add an item name and category.');
      return;
    }
    if (price !== null && (!Number.isFinite(price) || price < 0)) {
      setFormError('Enter a valid price in dirhams.');
      return;
    }
    if (draft.available && price === null) {
      setFormError('Set a price before making an item available.');
      return;
    }

    setFormError('');
    const input = {
      name,
      description: draft.description.trim(),
      category,
      price: price === null ? null : Math.round(price * 100) / 100,
      vegetarian: draft.vegetarian,
      available: draft.available,
    };
    try {
      if (editingItem) {
        await updateMutation.mutateAsync({ itemId: editingItem.id, data: input });
      } else {
        const createInput: MenuItemInput = {
          name: input.name,
          description: input.description,
          category: input.category,
          price: input.price,
          vegetarian: input.vegetarian,
        };
        await createMutation.mutateAsync({ restaurantId, data: createInput });
      }
      setIsEditorOpen(false);
    } catch (error) {
      setFormError(getErrorText(error));
    }
  };

  const setAvailability = async (item: MenuItem, available: boolean) => {
    setListError('');
    try {
      await updateMutation.mutateAsync({
        itemId: item.id,
        data: updateBody(item, available),
      });
    } catch (error) {
      setListError(getErrorText(error));
    }
  };

  if (!isLoaded || !canAccess) {
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
        <Pressable accessibilityRole="button" accessibilityLabel="Back to order queue" onPress={returnToQueue} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color={colors.primary} />
        </Pressable>
        <View style={styles.headerTitle}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>DINING HALL</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Manage menus</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={returnToQueue} style={styles.queueButton}>
          <Feather name="clipboard" size={16} color={colors.primary} />
          <Text style={[styles.queueButtonText, { color: colors.primary }]}>Orders</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 24 }]}
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
        <View style={[styles.infoCard, { backgroundColor: colors.secondary }]}>
          <Feather name="refresh-cw" size={16} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.foreground }]}>
            Saved changes appear in the student menu. Items refresh every 15 seconds.
          </Text>
        </View>

        {restaurantsLoading ? (
          <View style={styles.loadingRow}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.restaurantList}>
            {restaurants.map((restaurant) => {
              const selected = restaurant.id === restaurantId;
              return (
                <Pressable
                  key={restaurant.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  testID={`staff-restaurant-${restaurant.id}`}
                  onPress={() => setRestaurantId(restaurant.id)}
                  style={[
                    styles.restaurantButton,
                    {
                      backgroundColor: selected ? colors.primary : colors.card,
                      borderColor: selected ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.restaurantText, { color: selected ? colors.primaryForeground : colors.foreground }]}>
                    {restaurant.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.sectionHeading}>
          <View style={styles.sectionCopy}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {selectedRestaurant?.name ?? 'Restaurant menu'}
            </Text>
            <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>
              {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'items'} · turn off items that are sold out
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            testID="add-menu-item"
            onPress={openNewItem}
            style={({ pressed }) => [
              styles.addButton,
              { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <Feather name="plus" size={17} color={colors.primaryForeground} />
            <Text style={[styles.addButtonText, { color: colors.primaryForeground }]}>Add</Text>
          </Pressable>
        </View>

        {listError ? <Text style={[styles.errorText, { color: colors.destructive }]}>{listError}</Text> : null}
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>Loading menus…</Text>
          </View>
        ) : isError ? (
          <Pressable onPress={() => refetch()} style={[styles.errorCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.errorText, { color: colors.destructive }]}>Couldn’t load the restaurant menus.</Text>
            <Text style={[styles.retryText, { color: colors.primary }]}>Tap to try again</Text>
          </Pressable>
        ) : selectedItems.length ? (
          selectedItems.map((item) => (
            <View key={item.id} style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.itemTextBlock}>
                <View style={styles.itemTitleRow}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                  {item.vegetarian ? (
                    <View style={[styles.vegBadge, { backgroundColor: colors.secondary }]}>
                      <Text style={[styles.vegBadgeText, { color: colors.primary }]}>Veg</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                  {item.category} · {money(item.price)}
                </Text>
                {item.description ? (
                  <Text numberOfLines={2} style={[styles.itemDescription, { color: colors.mutedForeground }]}>
                    {item.description}
                  </Text>
                ) : null}
                <View style={styles.itemActions}>
                  <View style={styles.availabilityControl}>
                    <Switch
                      accessibilityLabel={`${item.available ? 'Make' : 'Mark'} ${item.name} ${item.available ? 'unavailable' : 'available'}`}
                      testID={`availability-${item.id}`}
                      value={item.available}
                      disabled={isSaving || item.price === null}
                      onValueChange={(available) => void setAvailability(item, available)}
                      trackColor={{ false: colors.border, true: colors.primary }}
                    />
                    <Text style={[styles.availabilityText, { color: colors.mutedForeground }]}>
                      {item.available ? 'Available' : 'Unavailable'}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${item.name}`}
                    testID={`edit-menu-item-${item.id}`}
                    onPress={() => openEditItem(item)}
                    style={styles.editButton}
                  >
                    <Feather name="edit-2" size={14} color={colors.primary} />
                    <Text style={[styles.editText, { color: colors.primary }]}>Edit</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="coffee" size={24} color={colors.primary} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No menu items yet</Text>
            <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>
              Add the first item for {selectedRestaurant?.name ?? 'this restaurant'}.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal transparent animationType="slide" visible={isEditorOpen} onRequestClose={closeEditor}>
        <View style={[styles.modalBackdrop, { paddingTop: insets.top, paddingBottom: bottomInset }]}>
          <KeyboardAwareScrollViewCompat
            style={styles.modalScroll}
            contentContainerStyle={styles.modalScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.formCard, { backgroundColor: colors.background }]}>
              <View style={styles.formHeader}>
                <View>
                  <Text style={[styles.eyebrow, { color: colors.primary }]}>
                    {selectedRestaurant?.name ?? 'RESTAURANT'}
                  </Text>
                  <Text style={[styles.formTitle, { color: colors.foreground }]}>
                    {editingItem ? 'Edit menu item' : 'Add menu item'}
                  </Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="Close editor" onPress={closeEditor} style={styles.closeButton}>
                  <Feather name="x" size={22} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <Text style={[styles.label, { color: colors.foreground }]}>Item name</Text>
              <TextInput
                value={draft.name}
                onChangeText={(name) => setDraft((current) => ({ ...current, name }))}
                placeholder="e.g. Grilled chicken wrap"
                placeholderTextColor={colors.mutedForeground}
                maxLength={100}
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              />

              <Text style={[styles.label, { color: colors.foreground }]}>Category</Text>
              <TextInput
                value={draft.category}
                onChangeText={(category) => setDraft((current) => ({ ...current, category }))}
                placeholder="e.g. Main dishes"
                placeholderTextColor={colors.mutedForeground}
                maxLength={80}
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              />

              <Text style={[styles.label, { color: colors.foreground }]}>Description</Text>
              <TextInput
                value={draft.description}
                onChangeText={(description) => setDraft((current) => ({ ...current, description }))}
                placeholder="Short description for students"
                placeholderTextColor={colors.mutedForeground}
                maxLength={500}
                multiline
                style={[styles.input, styles.descriptionInput, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              />

              <Text style={[styles.label, { color: colors.foreground }]}>Price in dirhams</Text>
              <TextInput
                value={draft.price}
                onChangeText={(price) => setDraft((current) => ({ ...current, price }))}
                placeholder="0.00"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="decimal-pad"
                style={[styles.input, { backgroundColor: colors.card, color: colors.foreground, borderColor: colors.border }]}
              />

              {editingItem ? (
                <View style={styles.switchRow}>
                  <View style={styles.switchCopy}>
                    <Text style={[styles.label, { color: colors.foreground }]}>Orderable by students</Text>
                    <Text style={[styles.mutedText, { color: colors.mutedForeground }]}>
                      Unavailable items stay listed but can’t be added to an order.
                    </Text>
                  </View>
                  <Switch
                    value={draft.available}
                    onValueChange={(available) => setDraft((current) => ({ ...current, available }))}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>
              ) : null}
              <View style={styles.switchRow}>
                <Text style={[styles.label, { color: colors.foreground }]}>Vegetarian</Text>
                <Switch
                  value={draft.vegetarian}
                  onValueChange={(vegetarian) => setDraft((current) => ({ ...current, vegetarian }))}
                  trackColor={{ false: colors.border, true: colors.primary }}
                />
              </View>

              {formError ? <Text style={[styles.errorText, { color: colors.destructive }]}>{formError}</Text> : null}
              <Pressable
                accessibilityRole="button"
                testID="save-menu-item"
                disabled={isSaving}
                onPress={() => void saveItem()}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: colors.primary, opacity: isSaving ? 0.65 : pressed ? 0.85 : 1 },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
                    {editingItem ? 'Save changes' : 'Add to menu'}
                  </Text>
                )}
              </Pressable>
            </View>
          </KeyboardAwareScrollViewCompat>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13 },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1 },
  eyebrow: { fontSize: 10, letterSpacing: 1.2, fontWeight: '700' },
  title: { fontSize: 23, fontWeight: '700', letterSpacing: -0.5, marginTop: 2 },
  queueButton: { minHeight: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  queueButtonText: { fontSize: 12, fontWeight: '700' },
  content: { paddingBottom: 24 },
  infoCard: { minHeight: 45, borderRadius: 13, paddingHorizontal: 12, paddingVertical: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '500' },
  restaurantList: { gap: 8, paddingVertical: 13, paddingRight: 4 },
  restaurantButton: { minHeight: 39, borderRadius: 20, paddingHorizontal: 14, borderWidth: 1, justifyContent: 'center' },
  restaurantText: { fontSize: 12, fontWeight: '700' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  sectionCopy: { flex: 1 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  mutedText: { fontSize: 11, lineHeight: 16 },
  addButton: { minHeight: 39, borderRadius: 12, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  addButtonText: { fontSize: 12, fontWeight: '700' },
  menuCard: { borderWidth: 1, borderRadius: 15, padding: 13, marginBottom: 9 },
  itemTextBlock: { gap: 6 },
  itemTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { flex: 1, fontSize: 14, lineHeight: 19, fontWeight: '700' },
  itemMeta: { fontSize: 11, fontWeight: '600' },
  itemDescription: { fontSize: 11, lineHeight: 16 },
  vegBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  vegBadgeText: { fontSize: 10, fontWeight: '700' },
  itemActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 3 },
  availabilityControl: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  availabilityText: { fontSize: 11, fontWeight: '600' },
  editButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8 },
  editText: { fontSize: 12, fontWeight: '700' },
  loadingRow: { minHeight: 60, justifyContent: 'center' },
  loadingState: { minHeight: 140, alignItems: 'center', justifyContent: 'center', gap: 9 },
  errorText: { fontSize: 12, lineHeight: 17, fontWeight: '600', marginBottom: 8 },
  errorCard: { borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 12 },
  retryText: { fontSize: 11, marginTop: 6 },
  emptyCard: { alignItems: 'center', gap: 8, padding: 22, borderWidth: 1, borderRadius: 16, marginTop: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 9 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(20, 30, 22, 0.48)', justifyContent: 'center', paddingHorizontal: 14 },
  modalScroll: { flexGrow: 0, maxHeight: '100%' },
  modalScrollContent: { flexGrow: 1, justifyContent: 'center', paddingVertical: 12 },
  formCard: { width: '100%', maxWidth: 520, alignSelf: 'center', borderRadius: 20, padding: 18 },
  formHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  formTitle: { fontSize: 21, fontWeight: '700', marginTop: 3 },
  closeButton: { minWidth: 40, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
  input: { minHeight: 44, borderWidth: 1, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, marginBottom: 12 },
  descriptionInput: { minHeight: 76, textAlignVertical: 'top' },
  switchRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  switchCopy: { flex: 1 },
  saveButton: { minHeight: 48, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  saveText: { fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.84 },
});
