import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetMenu, useGetRestaurants } from '@workspace/api-client-react';
import type { MenuItem } from '@workspace/api-client-react';
import { useCart } from '@/context/cart-context';
import { useColors } from '@/hooks/useColors';
import { router } from 'expo-router';

const foodImages = {
  grill: require('../assets/images/food-grill.jpg'),
  fresh: require('../assets/images/food-fresh.jpg'),
  treats: require('../assets/images/food-treats.jpg'),
};

const money = (value: number) => `AED ${value.toFixed(2)}`;
const filters = ['All items', 'Vegetarian'] as const;
type Filter = (typeof filters)[number];

function MenuCard({
  item,
  quantity,
  onAdd,
  onRemove,
}: {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}) {
  const colors = useColors();
  const image = foodImages[item.imageKey === 'grill' || item.imageKey === 'treats' ? item.imageKey : 'fresh'];

  return (
    <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image source={image} style={styles.foodImage} />
      <View style={styles.cardDetails}>
        <View style={styles.nameRow}>
          <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
          {item.vegetarian && (
            <View style={styles.vegPill}>
              <View style={styles.vegDot} />
              <Text style={styles.vegText}>Veg</Text>
            </View>
          )}
        </View>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>{item.description}</Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: item.available ? colors.foreground : colors.mutedForeground }]}>
            {item.price === null ? 'Price not listed' : money(item.price)}
          </Text>
          {item.available && item.price !== null ? (
            quantity === 0 ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Add ${item.name} to order`}
                testID={`add-${item.id}`}
                onPress={onAdd}
                style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}
              >
                <Feather name="plus" size={20} color="#FFFFFF" />
              </Pressable>
            ) : (
              <View style={[styles.quantityControl, { backgroundColor: colors.secondary }]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove one ${item.name}`}
                  testID={`remove-${item.id}`}
                  hitSlop={8}
                  onPress={onRemove}
                >
                  <Feather name="minus" size={17} color={colors.primary} />
                </Pressable>
                <Text style={[styles.quantity, { color: colors.foreground }]}>{quantity}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Add one ${item.name}`}
                  testID={`add-${item.id}`}
                  hitSlop={8}
                  onPress={onAdd}
                >
                  <Feather name="plus" size={17} color={colors.primary} />
                </Pressable>
              </View>
            )
          ) : (
            <Text style={[styles.unavailable, { color: colors.mutedForeground }]}>Not orderable</Text>
          )}
        </View>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [isCustomer, setIsCustomer] = useState(false);
  const topInset = Math.max(insets.top, Platform.OS === 'web' ? 67 : 0);
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 0);

  if (isCustomer) return <MenuContent />;

  return (
    <View style={[styles.page, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.roleContent,
          { paddingTop: topInset + 34, paddingBottom: bottomInset + 28 },
        ]}
      >
        <View style={styles.roleBrandMark}>
          <Feather name="clock" size={23} color="#FFFFFF" />
        </View>
        <Text style={[styles.roleEyebrow, { color: colors.primary }]}>CAMPUS DINING</Text>
        <Text style={[styles.roleTitle, { color: colors.foreground }]}>BeatTheLine</Text>
        <Text style={[styles.roleSubtitle, { color: colors.mutedForeground }]}>
          Order ahead, then pick up your food when it’s ready.
        </Text>
        <Text style={[styles.rolePrompt, { color: colors.foreground }]}>How are you using the app?</Text>
        <Pressable
          accessibilityRole="button"
          testID="choose-customer"
          onPress={() => setIsCustomer(true)}
          style={({ pressed }) => [
            styles.roleCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.roleIcon, { backgroundColor: '#E8EFD9' }]}>
            <Feather name="shopping-bag" size={21} color="#287A54" />
          </View>
          <View style={styles.roleCopy}>
            <Text style={[styles.roleCardTitle, { color: colors.foreground }]}>I’m ordering food</Text>
            <Text style={[styles.roleCardSub, { color: colors.mutedForeground }]}>
              Browse dining options and choose a pickup time.
            </Text>
          </View>
          <Feather name="arrow-right" size={19} color={colors.primary} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          testID="choose-staff"
          onPress={() => router.push('/staff/sign-in')}
          style={({ pressed }) => [
            styles.roleCard,
            { backgroundColor: colors.card, borderColor: colors.border },
            pressed && styles.pressed,
          ]}
        >
          <View style={[styles.roleIcon, { backgroundColor: '#FFF1D5' }]}>
            <Feather name="clipboard" size={21} color="#9C6812" />
          </View>
          <View style={styles.roleCopy}>
            <Text style={[styles.roleCardTitle, { color: colors.foreground }]}>I work in dining</Text>
            <Text style={[styles.roleCardSub, { color: colors.mutedForeground }]}>
              Sign in to view and prepare incoming orders.
            </Text>
          </View>
          <Feather name="arrow-right" size={19} color={colors.primary} />
        </Pressable>
        <Text style={[styles.roleFootnote, { color: colors.mutedForeground }]}>
          Prototype staff orders are visible to any signed-in account.
        </Text>
      </ScrollView>
    </View>
  );
}

function MenuContent() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: menu, isLoading, isError, refetch } = useGetMenu();
  const { data: restaurants = [], isLoading: restaurantsLoading, isError: restaurantsError } = useGetRestaurants();
  const { quantities, itemCount, addItem, removeItem } = useCart();
  const [restaurantId, setRestaurantId] = useState('currylicious');
  const [filter, setFilter] = useState<Filter>('All items');

  const selectedRestaurant = restaurants.find((restaurant) => restaurant.id === restaurantId);
  const sections = useMemo(() => {
    const selectedItems = (menu ?? []).filter(
      (item) =>
        item.restaurantId === restaurantId &&
        (filter === 'All items' || item.vegetarian),
    );
    const categories = [...new Set(selectedItems.map((item) => item.category))];
    return categories.map((category) => ({
      title: category,
      data: selectedItems.filter((item) => item.category === category),
    }));
  }, [filter, menu, restaurantId]);

  const total = (menu ?? []).reduce((sum, item) => {
    if (item.price === null) return sum;
    return sum + item.price * (quantities[item.id] ?? 0);
  }, 0);
  const webTop = Platform.OS === 'web' ? 67 : 0;
  const webBottom = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={[styles.page, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, webTop) }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: 120 + webBottom }]}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View>
            <View style={styles.topLine}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>CAMPUS DINING</Text>
                <Text style={[styles.brand, { color: colors.foreground }]}>BeatTheLine</Text>
              </View>
              <View style={[styles.openPill, { backgroundColor: colors.secondary }]}>
                <View style={styles.openDot} />
                <Text style={[styles.openText, { color: colors.primary }]}>Order ahead</Text>
              </View>
            </View>
            <View style={styles.hero}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Good food, no line.</Text>
                <Text style={styles.heroSubtitle}>Choose a campus spot, place your order, and pick it up.</Text>
              </View>
              <View style={styles.heroIcon}>
                <Feather name="zap" size={25} color="#74521E" />
              </View>
            </View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Where are you ordering from?</Text>
            {restaurantsLoading ? (
              <View style={styles.loading}><ActivityIndicator color={colors.primary} /></View>
            ) : restaurantsError ? (
              <Text style={[styles.errorText, { color: colors.destructive }]}>Restaurants couldn’t load.</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.restaurantList}
              >
                {restaurants.map((restaurant) => {
                  const selected = restaurant.id === restaurantId;
                  return (
                    <Pressable
                      key={restaurant.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      testID={`restaurant-${restaurant.id}`}
                      onPress={() => setRestaurantId(restaurant.id)}
                      style={[
                        styles.restaurantButton,
                        {
                          backgroundColor: selected ? colors.primary : colors.card,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.restaurantText, { color: selected ? '#FFFFFF' : colors.foreground }]}>
                        {restaurant.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
            <View style={styles.menuHeading}>
              <View style={styles.menuTitleBlock}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {selectedRestaurant?.name ?? 'Menu'}
                </Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
                  {selectedRestaurant ? 'Today’s menu' : 'Choose a restaurant'}
                </Text>
              </View>
              <View style={styles.filters}>
                {filters.map((option) => {
                  const selected = filter === option;
                  return (
                    <Pressable
                      key={option}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      testID={`filter-${option.toLowerCase().replace(' ', '-')}`}
                      onPress={() => setFilter(option)}
                      style={[
                        styles.filterButton,
                        {
                          backgroundColor: selected ? colors.secondary : colors.card,
                          borderColor: selected ? colors.primary : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.filterText, { color: selected ? colors.primary : colors.foreground }]}>
                        {option === 'All items' ? 'All' : 'Veg'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {isError && (
              <Pressable onPress={() => refetch()} style={[styles.errorBox, { borderColor: colors.border }]}>
                <Text style={[styles.errorText, { color: colors.destructive }]}>Couldn’t load this menu.</Text>
                <Text style={[styles.retryText, { color: colors.primary }]}>Tap to try again</Text>
              </Pressable>
            )}
            {isLoading && (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading menu…</Text>
              </View>
            )}
            {restaurantId === 'alabrasa' && !isLoading && (
              <View style={[styles.notice, { backgroundColor: colors.accent }]}>
                <Feather name="info" size={15} color={colors.accentForeground} />
                <Text style={[styles.noticeText, { color: colors.accentForeground }]}>
                  House grills and sides are available to order. Sauce prices weren’t included.
                </Text>
              </View>
            )}
            {filter === 'Vegetarian' && sections.length === 0 && restaurantId !== 'switch' && !isLoading && (
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No vegetarian items listed here.</Text>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text style={[styles.categoryTitle, { color: colors.foreground }]}>{section.title}</Text>
        )}
        renderItem={({ item }) => (
          <MenuCard
            item={item}
            quantity={quantities[item.id] ?? 0}
            onAdd={() => addItem(item.id)}
            onRemove={() => removeItem(item.id)}
          />
        )}
      />
      {itemCount > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, webBottom) }]}>
          <Pressable
            accessibilityRole="button"
            testID="continue-to-checkout"
            onPress={() => router.push('/checkout')}
            style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
          >
            <View style={styles.cartLabel}>
              <View style={styles.countBubble}><Text style={styles.countBubbleText}>{itemCount}</Text></View>
              <Text style={styles.continueText}>View your order</Text>
            </View>
            <Text style={styles.continueTotal}>{money(total)}</Text>
            <Feather name="arrow-right" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  roleContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22 },
  roleBrandMark: { width: 50, height: 50, borderRadius: 17, backgroundColor: '#287A54', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  roleEyebrow: { fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  roleTitle: { fontSize: 34, fontWeight: '700', letterSpacing: -1.2, marginTop: 4 },
  roleSubtitle: { fontSize: 14, lineHeight: 21, marginTop: 9, marginBottom: 28, maxWidth: 310 },
  rolePrompt: { fontSize: 17, fontWeight: '700', marginBottom: 12 },
  roleCard: { minHeight: 88, borderWidth: 1, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  roleIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  roleCopy: { flex: 1 },
  roleCardTitle: { fontSize: 14, fontWeight: '700' },
  roleCardSub: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  roleFootnote: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 7 },
  listContent: { paddingHorizontal: 18, paddingTop: 12 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  brand: { fontSize: 25, fontWeight: '700', letterSpacing: -0.7, marginTop: 2 },
  openPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 20 },
  openDot: { width: 7, height: 7, backgroundColor: '#4F9A62', borderRadius: 4 },
  openText: { fontSize: 11, fontWeight: '600' },
  hero: { minHeight: 112, borderRadius: 20, backgroundColor: '#E8EFD9', padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', marginBottom: 23 },
  heroCopy: { flex: 1, paddingRight: 12 },
  heroTitle: { color: '#244A35', fontSize: 22, fontWeight: '700', letterSpacing: -0.5, maxWidth: 240 },
  heroSubtitle: { color: '#56705C', fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: 245 },
  heroIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F9D78B', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  sectionTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  restaurantList: { gap: 8, paddingVertical: 12, paddingRight: 4 },
  restaurantButton: { minHeight: 40, borderRadius: 20, paddingHorizontal: 15, borderWidth: 1, justifyContent: 'center' },
  restaurantText: { fontSize: 12, fontWeight: '600' },
  menuHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, marginBottom: 10 },
  menuTitleBlock: { flex: 1 },
  sectionSub: { fontSize: 12, marginTop: 4 },
  filters: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  filterButton: { minHeight: 34, minWidth: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 17, paddingHorizontal: 10, borderWidth: 1 },
  filterText: { fontSize: 11, fontWeight: '700' },
  categoryTitle: { fontSize: 14, fontWeight: '700', marginTop: 13, marginBottom: 9 },
  menuCard: { flexDirection: 'row', borderRadius: 16, overflow: 'hidden', borderWidth: 1, marginBottom: 10, minHeight: 112 },
  foodImage: { width: 92, height: '100%', minHeight: 112 },
  cardDetails: { flex: 1, minWidth: 0, padding: 11, justifyContent: 'space-between' },
  nameRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 },
  itemName: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  description: { fontSize: 10.5, lineHeight: 15, marginTop: 4 },
  vegPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 4, backgroundColor: '#EEF6E7', borderRadius: 10 },
  vegDot: { width: 6, height: 6, backgroundColor: '#4E965C', borderRadius: 4 },
  vegText: { fontSize: 9, color: '#305E39', fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  price: { fontSize: 13, fontWeight: '700' },
  unavailable: { fontSize: 10, fontWeight: '600' },
  addButton: { width: 32, height: 32, borderRadius: 11, backgroundColor: '#287A54', alignItems: 'center', justifyContent: 'center' },
  quantityControl: { height: 32, minWidth: 88, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  quantity: { fontSize: 12, fontWeight: '700', minWidth: 16, textAlign: 'center' },
  notice: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: 12, marginBottom: 12 },
  noticeText: { flex: 1, fontSize: 11, lineHeight: 16, fontWeight: '500' },
  emptyState: { alignItems: 'center', padding: 22, borderRadius: 16, borderWidth: 1, marginTop: 10 },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  emptyText: { fontSize: 12, lineHeight: 17, marginTop: 5, textAlign: 'center' },
  errorBox: { borderWidth: 1, borderRadius: 14, padding: 13, marginBottom: 12 },
  errorText: { fontSize: 13, fontWeight: '600' },
  retryText: { fontSize: 11, marginTop: 4 },
  loading: { minHeight: 70, alignItems: 'center', justifyContent: 'center', gap: 7 },
  loadingText: { fontSize: 12 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 18, paddingTop: 12, backgroundColor: 'rgba(248,248,241,0.97)' },
  continueButton: { minHeight: 56, backgroundColor: '#287A54', borderRadius: 17, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cartLabel: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  countBubble: { minWidth: 25, height: 25, paddingHorizontal: 6, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  countBubbleText: { color: '#287A54', fontSize: 12, fontWeight: '700' },
  continueText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  continueTotal: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 'auto', marginRight: 12 },
  pressed: { opacity: 0.84 },
});
