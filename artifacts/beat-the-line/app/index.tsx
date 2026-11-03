import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGetMenu } from '@workspace/api-client-react';
import type { MenuItem } from '@workspace/api-client-react';
import { useCart } from '@/context/cart-context';
import { useColors } from '@/hooks/useColors';
import { router } from 'expo-router';

const foodImages = {
  grill: require('../assets/images/food-grill.jpg'),
  fresh: require('../assets/images/food-fresh.jpg'),
  treats: require('../assets/images/food-treats.jpg'),
};

const imageForItem: Record<string, keyof typeof foodImages> = {
  burger: 'grill',
  wrap: 'grill',
  bowl: 'fresh',
  pasta: 'fresh',
  salad: 'fresh',
  fries: 'treats',
  cookie: 'treats',
  drink: 'treats',
};

const filters = ['All items', 'Vegetarian'] as const;
type Filter = (typeof filters)[number];
const money = (value: number) => `$${value.toFixed(2)}`;

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
  const image = foodImages[imageForItem[item.id] ?? 'fresh'];
  return (
    <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <ImageBackground source={image} style={styles.foodImage} imageStyle={styles.foodImageRadius}>
        {item.vegetarian && (
          <View style={styles.vegPill}>
            <View style={styles.vegDot} />
            <Text style={styles.vegText}>Veggie</Text>
          </View>
        )}
      </ImageBackground>
      <View style={styles.cardDetails}>
        <Text style={[styles.itemName, { color: colors.foreground }]} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.foreground }]}>{money(item.price)}</Text>
          {quantity === 0 ? (
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
          )}
        </View>
      </View>
    </View>
  );
}

export default function MenuScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { data: menu, isLoading, isError, refetch } = useGetMenu();
  const { quantities, itemCount, addItem, removeItem } = useCart();
  const [filter, setFilter] = useState<Filter>('All items');
  const items = useMemo(
    () => (filter === 'Vegetarian' ? (menu ?? []).filter((item) => item.vegetarian) : menu ?? []),
    [filter, menu],
  );
  const total = (menu ?? []).reduce(
    (sum, item) => sum + item.price * (quantities[item.id] ?? 0),
    0,
  );

  const webTop = Platform.OS === 'web' ? 67 : 0;
  const webBottom = Platform.OS === 'web' ? 34 : 0;

  return (
    <View style={[styles.page, { backgroundColor: colors.background, paddingTop: Math.max(insets.top, webTop) }]}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.menuRow}
        contentContainerStyle={[styles.listContent, { paddingBottom: 120 + webBottom }]}
        ListHeaderComponent={
          <View>
            <View style={styles.topLine}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>CAMPUS DINING</Text>
                <Text style={[styles.brand, { color: colors.foreground }]}>BeatTheLine</Text>
              </View>
              <View style={[styles.openPill, { backgroundColor: colors.secondary }]}>
                <View style={styles.openDot} />
                <Text style={[styles.openText, { color: colors.primary }]}>Open for lunch</Text>
              </View>
            </View>
            <View style={styles.hero}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroTitle}>Lunch, without the wait.</Text>
                <Text style={styles.heroSubtitle}>Order ahead. Pick up. Get on with your day.</Text>
              </View>
              <View style={styles.heroIcon}>
                <Feather name="zap" size={25} color="#74521E" />
              </View>
            </View>
            <View style={styles.sectionHeading}>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Today’s menu</Text>
                <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Made fresh at the dining hall</Text>
              </View>
              <Text style={[styles.itemCount, { color: colors.mutedForeground }]}>8 favorites</Text>
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
                        backgroundColor: selected ? colors.primary : colors.card,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    {option === 'Vegetarian' && (
                      <View style={[styles.filterDot, { backgroundColor: selected ? '#C8E4A5' : '#4E965C' }]} />
                    )}
                    <Text style={[styles.filterText, { color: selected ? '#FFFFFF' : colors.foreground }]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {isError && (
              <Pressable onPress={() => refetch()} style={[styles.errorBox, { borderColor: colors.border }]}>
                <Text style={[styles.errorText, { color: colors.destructive }]}>Couldn’t load today’s menu.</Text>
                <Text style={[styles.retryText, { color: colors.primary }]}>Tap to try again</Text>
              </Pressable>
            )}
            {isLoading && (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading the menu…</Text>
              </View>
            )}
          </View>
        }
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
  listContent: { paddingHorizontal: 18, paddingTop: 12 },
  topLine: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 17 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  brand: { fontSize: 25, fontWeight: '700', letterSpacing: -0.7, marginTop: 2 },
  openPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 20 },
  openDot: { width: 7, height: 7, backgroundColor: '#4F9A62', borderRadius: 4 },
  openText: { fontSize: 11, fontWeight: '600' },
  hero: { minHeight: 118, borderRadius: 20, backgroundColor: '#E8EFD9', padding: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden', marginBottom: 25 },
  heroCopy: { flex: 1, paddingRight: 12 },
  heroTitle: { color: '#244A35', fontSize: 22, fontWeight: '700', letterSpacing: -0.5, maxWidth: 240 },
  heroSubtitle: { color: '#56705C', fontSize: 12, lineHeight: 18, marginTop: 6, maxWidth: 230 },
  heroIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#F9D78B', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '8deg' }] },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 21, fontWeight: '700', letterSpacing: -0.4 },
  sectionSub: { fontSize: 12, marginTop: 4 },
  itemCount: { fontSize: 11, paddingBottom: 2 },
  filters: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 15 },
  filterButton: { minHeight: 36, borderRadius: 18, paddingHorizontal: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  filterText: { fontSize: 12, fontWeight: '600' },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  menuRow: { gap: 11, marginBottom: 12 },
  menuCard: { flex: 1, minWidth: 0, borderRadius: 17, overflow: 'hidden', borderWidth: 1 },
  foodImage: { height: 132, justifyContent: 'flex-start', alignItems: 'flex-start', padding: 9 },
  foodImageRadius: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  vegPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 20 },
  vegDot: { width: 6, height: 6, backgroundColor: '#4E965C', borderRadius: 4 },
  vegText: { fontSize: 10, color: '#305E39', fontWeight: '700' },
  cardDetails: { padding: 11 },
  itemName: { fontSize: 13, fontWeight: '700' },
  description: { fontSize: 10.5, lineHeight: 15, height: 30, marginTop: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  price: { fontSize: 14, fontWeight: '700' },
  addButton: { width: 34, height: 34, borderRadius: 12, backgroundColor: '#287A54', alignItems: 'center', justifyContent: 'center' },
  quantityControl: { height: 34, minWidth: 94, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-evenly' },
  quantity: { fontSize: 13, fontWeight: '700', minWidth: 16, textAlign: 'center' },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 18, paddingTop: 12, backgroundColor: 'rgba(248,248,241,0.97)' },
  continueButton: { minHeight: 56, backgroundColor: '#287A54', borderRadius: 17, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  cartLabel: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  countBubble: { minWidth: 25, height: 25, paddingHorizontal: 6, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  countBubbleText: { color: '#287A54', fontSize: 12, fontWeight: '700' },
  continueText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  continueTotal: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginLeft: 'auto', marginRight: 12 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  errorBox: { borderWidth: 1, borderRadius: 12, padding: 14, marginVertical: 10 },
  errorText: { fontWeight: '600', fontSize: 13 },
  retryText: { fontSize: 12, marginTop: 4 },
  loading: { minHeight: 140, alignItems: 'center', justifyContent: 'center', gap: 8 },
  loadingText: { fontSize: 12 },
});
