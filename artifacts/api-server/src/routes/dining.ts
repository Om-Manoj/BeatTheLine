import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { CreateMenuItemBody, CreateOrderBody, UpdateMenuItemBody } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { menuItems, orderItems, orders } from "@workspace/db/schema";
import { logger } from "../lib/logger";
import { requireSignedIn } from "../middlewares/staffAccess";

const router: IRouter = Router();
const SLOT_CAPACITY = 5;
const MEAL_SWIPE_VALUE = 33.6;
const orderStatuses = ["new", "preparing", "ready", "collected"] as const;
type OrderStatus = (typeof orderStatuses)[number];
const staffNextStatuses: Record<OrderStatus, readonly OrderStatus[]> = {
  new: ["preparing"],
  preparing: ["ready"],
  ready: ["collected"],
  collected: [],
};

const restaurants = [
  { id: "switch", name: "Switch" },
  { id: "currylicious", name: "Currylicious" },
  { id: "flavours", name: "Flavours" },
  { id: "just-baked", name: "Just Baked" },
  { id: "alabrasa", name: "Alabrasa" },
  { id: "subjects", name: "Subjects" },
] as const;

const menu = [
  { id: "switch-soup", restaurantId: "switch", restaurant: "Switch", category: "Today's menu", name: "Soup of the day", description: "Ask the counter for today's soup.", price: 8.5, vegetarian: false, imageKey: "fresh", available: true },
  { id: "switch-protein-main", restaurantId: "switch", restaurant: "Switch", category: "Today's menu", name: "Main dish · Protein", description: "Ask the counter for today's protein selection.", price: 15.25, vegetarian: false, imageKey: "grill", available: true },
  { id: "switch-vegetarian-main", restaurantId: "switch", restaurant: "Switch", category: "Today's menu", name: "Main dish · Vegetarian", description: "Ask the counter for today's vegetarian selection.", price: 15.25, vegetarian: true, imageKey: "fresh", available: true },
  { id: "switch-rice", restaurantId: "switch", restaurant: "Switch", category: "Sides", name: "Rice", description: "Rice side.", price: 8.5, vegetarian: true, imageKey: "fresh", available: true },
  { id: "switch-potatoes", restaurantId: "switch", restaurant: "Switch", category: "Sides", name: "Potatoes", description: "Potato side.", price: 8.5, vegetarian: true, imageKey: "fresh", available: true },
  { id: "switch-buckwheat", restaurantId: "switch", restaurant: "Switch", category: "Sides", name: "Buckwheat", description: "Buckwheat side.", price: 8.5, vegetarian: true, imageKey: "fresh", available: true },
  { id: "switch-sauteed-vegetables", restaurantId: "switch", restaurant: "Switch", category: "Sides", name: "Sautéed vegetables", description: "Sautéed vegetable side.", price: 8.5, vegetarian: true, imageKey: "fresh", available: true },
  { id: "switch-dal", restaurantId: "switch", restaurant: "Switch", category: "Sides", name: "Dal", description: "Dal of the day.", price: 9.5, vegetarian: true, imageKey: "fresh", available: true },
  { id: "curry-rotisserie-whole", restaurantId: "currylicious", restaurant: "Currylicious", category: "Rotisserie chicken", name: "Rotisserie chicken · Whole", description: "Classic herb, honey mustard or spicy peri-peri. Served with Arabic bread and one sauce: spicy peri-peri, green peppercorn or chicken jus.", price: 45, vegetarian: false, imageKey: "grill", available: true },
  { id: "curry-rotisserie-half", restaurantId: "currylicious", restaurant: "Currylicious", category: "Rotisserie chicken", name: "Rotisserie chicken · Half", description: "Classic herb, honey mustard or spicy peri-peri. Served with Arabic bread and one sauce: spicy peri-peri, green peppercorn or chicken jus.", price: 33, vegetarian: false, imageKey: "grill", available: true },
  { id: "curry-lemon-potatoes", restaurantId: "currylicious", restaurant: "Currylicious", category: "Sides", name: "Lemon roasted potatoes", description: "Roasted potatoes with lemon.", price: 9, vegetarian: true, imageKey: "fresh", available: true },
  { id: "curry-garlic-potatoes", restaurantId: "currylicious", restaurant: "Currylicious", category: "Sides", name: "Garlic & herb roasted potatoes", description: "Roasted potatoes with garlic and herbs.", price: 9, vegetarian: true, imageKey: "fresh", available: true },
  { id: "curry-wedges", restaurantId: "currylicious", restaurant: "Currylicious", category: "Sides", name: "Fried potato wedges", description: "Crisp fried potato wedges.", price: 9, vegetarian: true, imageKey: "treats", available: true },
  { id: "curry-protein-main", restaurantId: "currylicious", restaurant: "Currylicious", category: "Curries & stir fry", name: "Main dish · Protein", description: "Ask the counter for today's protein selection.", price: 15.25, vegetarian: false, imageKey: "grill", available: true },
  { id: "curry-vegetarian-main", restaurantId: "currylicious", restaurant: "Currylicious", category: "Curries & stir fry", name: "Main dish · Vegetarian", description: "Ask the counter for today's vegetarian selection.", price: 15.25, vegetarian: true, imageKey: "fresh", available: true },
  { id: "curry-biryani", restaurantId: "currylicious", restaurant: "Currylicious", category: "Curries & stir fry", name: "Biryani", description: "Biryani of the day.", price: 15.25, vegetarian: false, imageKey: "fresh", available: true },
  { id: "curry-rice", restaurantId: "currylicious", restaurant: "Currylicious", category: "Curries & stir fry", name: "Rice", description: "Rice side.", price: 8.5, vegetarian: true, imageKey: "fresh", available: true },
  { id: "curry-dal", restaurantId: "currylicious", restaurant: "Currylicious", category: "Curries & stir fry", name: "Dal", description: "Dal of the day.", price: 9.5, vegetarian: true, imageKey: "fresh", available: true },
  { id: "flavours-soup", restaurantId: "flavours", restaurant: "Flavours", category: "Today's menu", name: "Soup of the day", description: "Ask the counter for today's soup.", price: 8.5, vegetarian: false, imageKey: "fresh", available: true },
  { id: "flavours-protein-main", restaurantId: "flavours", restaurant: "Flavours", category: "Today's menu", name: "Main dish · Protein", description: "Ask the counter for today's protein selection.", price: 15.25, vegetarian: false, imageKey: "grill", available: true },
  { id: "flavours-vegetarian-main", restaurantId: "flavours", restaurant: "Flavours", category: "Today's menu", name: "Main dish · Vegetarian", description: "Ask the counter for today's vegetarian selection.", price: 15.25, vegetarian: true, imageKey: "fresh", available: true },
  { id: "flavours-rice", restaurantId: "flavours", restaurant: "Flavours", category: "Sides", name: "Rice", description: "Rice side.", price: 8.5, vegetarian: true, imageKey: "fresh", available: true },
  { id: "flavours-potatoes", restaurantId: "flavours", restaurant: "Flavours", category: "Sides", name: "Potatoes", description: "Potato side.", price: 8.5, vegetarian: true, imageKey: "fresh", available: true },
  { id: "flavours-vegetables", restaurantId: "flavours", restaurant: "Flavours", category: "Sides", name: "Sautéed vegetables", description: "Sautéed vegetable side.", price: 8.5, vegetarian: true, imageKey: "fresh", available: true },
  { id: "baked-switch-chicken", restaurantId: "just-baked", restaurant: "Just Baked", category: "Chef's selection", name: "Switch TM Chicken Delight", description: "Plant-based chicken, button mushroom, green pepper, onion, parsley, vegan cheese and signature sauce.", price: 43, vegetarian: true, imageKey: "fresh", available: true },
  { id: "baked-mediterranean-veggie", restaurantId: "just-baked", restaurant: "Just Baked", category: "Chef's selection", name: "Mediterranean Veggie Delight", description: "Artichoke, red pepper, zucchini, cherry tomato, onion, black olives, basil, oregano, feta, mozzarella and signature sauce.", price: 36, vegetarian: true, imageKey: "fresh", available: true },
  { id: "baked-burrata-margherita", restaurantId: "just-baked", restaurant: "Just Baked", category: "Chef's selection", name: "Burrata Margherita", description: "Fresh burrata, cherry tomato, fresh basil, black pepper, parmesan, mozzarella and signature sauce.", price: 45, vegetarian: true, imageKey: "fresh", available: true },
  { id: "baked-truffle-mushroom", restaurantId: "just-baked", restaurant: "Just Baked", category: "Chef's selection", name: "Truffle Wild Mushroom", description: "Oyster, button and white shimeji mushrooms, onion, truffle oil, parmesan, mozzarella and truffle cream sauce.", price: 45, vegetarian: true, imageKey: "fresh", available: true },
  { id: "baked-chicken-tikka", restaurantId: "just-baked", restaurant: "Just Baked", category: "Chef's selection", name: "Chicken Tikka", description: "Tikka chicken, red and green pepper, onion, green chutney, mozzarella and signature sauce.", price: 36, vegetarian: false, imageKey: "grill", available: true },
  { id: "baked-chicken-alfredo", restaurantId: "just-baked", restaurant: "Just Baked", category: "Chef's selection", name: "Chicken Alfredo", description: "Alfredo chicken, green pepper, black olives, parsley, mozzarella and alfredo sauce.", price: 36, vegetarian: false, imageKey: "grill", available: true },
  { id: "baked-dynamite-chicken", restaurantId: "just-baked", restaurant: "Just Baked", category: "Chef's selection", name: "Dynamite Chicken", description: "Chicken, green pepper, onion, parsley, dynamite sauce, mozzarella and signature sauce.", price: 39, vegetarian: false, imageKey: "grill", available: true },
  { id: "baked-peri-peri-chicken", restaurantId: "just-baked", restaurant: "Just Baked", category: "Chef's selection", name: "Peri Peri Chicken Fiesta", description: "Peri-peri chicken, red and green pepper, onion, sweet corn, black olives, jalapeño, cilantro, cheddar, mozzarella and signature sauce.", price: 39, vegetarian: false, imageKey: "grill", available: true },
  { id: "baked-tropical-chicken", restaurantId: "just-baked", restaurant: "Just Baked", category: "Chef's selection", name: "Tropical Sunset Chicken", description: "Smoked turkey, chicken strips, pineapple, red pepper, onion, cilantro, jalapeño, cheddar, mozzarella and BBQ sauce.", price: 43, vegetarian: false, imageKey: "grill", available: true },
  { id: "baked-salmon-avocado", restaurantId: "just-baked", restaurant: "Just Baked", category: "Chef's selection", name: "Smoked Salmon Avocado", description: "Smoked salmon and avocado.", price: 49, vegetarian: false, imageKey: "fresh", available: true },
  { id: "baked-bbq-chicken", restaurantId: "just-baked", restaurant: "Just Baked", category: "Classic", name: "BBQ Chicken", description: "BBQ chicken, green pepper, onion, parsley, BBQ sauce, mozzarella and signature sauce.", price: 39, vegetarian: false, imageKey: "grill", available: true },
  { id: "baked-pepperoni", restaurantId: "just-baked", restaurant: "Just Baked", category: "Classic", name: "Pepperoni", description: "Beef pepperoni, mozzarella and signature sauce.", price: 43, vegetarian: false, imageKey: "grill", available: true },
  { id: "baked-beef-supreme", restaurantId: "just-baked", restaurant: "Just Baked", category: "Classic", name: "Beef Supreme", description: "Roasted beef, beef pepperoni, green pepper, onion, mushroom, parsley, mozzarella and signature sauce.", price: 47, vegetarian: false, imageKey: "grill", available: true },
  { id: "baked-margherita", restaurantId: "just-baked", restaurant: "Just Baked", category: "Classic", name: "Margherita", description: "Mozzarella and signature sauce.", price: 31, vegetarian: true, imageKey: "fresh", available: true },
  { id: "baked-gluten-friendly-margherita", restaurantId: "just-baked", restaurant: "Just Baked", category: "Classic", name: "Gluten-Friendly Margherita", description: "Gluten-friendly pizza base, mozzarella and signature sauce.", price: 48, vegetarian: true, imageKey: "fresh", available: true },
  { id: "baked-pizza-slice", restaurantId: "just-baked", restaurant: "Just Baked", category: "Portioned options", name: "Slice of pizza", description: "A slice of today's pizza.", price: 6, vegetarian: false, imageKey: "grill", available: true },
  { id: "baked-pasta-day", restaurantId: "just-baked", restaurant: "Just Baked", category: "Portioned options", name: "Pasta of the day", description: "Ask the counter for today's pasta.", price: 15.25, vegetarian: false, imageKey: "fresh", available: true },
  { id: "alabrasa-halloumi", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "House grills", name: "BBQ Halloumi & Veggies", description: "BBQ halloumi and vegetables.", price: 31, vegetarian: true, imageKey: "fresh", available: true },
  { id: "alabrasa-chicken", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "House grills", name: "Chicken Breast", description: "Grilled chicken breast.", price: 26, vegetarian: false, imageKey: "grill", available: true },
  { id: "alabrasa-cracked-pepper-honey", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "House grills", name: "Cracked Pepper Honey", description: "House grill.", price: 29, vegetarian: false, imageKey: "grill", available: true },
  { id: "alabrasa-angry-chicken", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "House grills", name: "Angry Chicken", description: "House grill.", price: 31, vegetarian: false, imageKey: "grill", available: true },
  { id: "alabrasa-salmon", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "House grills", name: "Salmon Steak", description: "Grilled salmon steak.", price: 46, vegetarian: false, imageKey: "grill", available: true },
  { id: "alabrasa-sirloin", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "House grills", name: "Sirloin Steak", description: "Grilled sirloin steak.", price: 45, vegetarian: false, imageKey: "grill", available: true },
  { id: "alabrasa-steamed-veg", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "Sides", name: "Steamed Vegetables", description: "Side dish.", price: 9, vegetarian: true, imageKey: "fresh", available: true },
  { id: "alabrasa-grilled-veg", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "Sides", name: "Grilled Vegetables", description: "Side dish.", price: 9, vegetarian: true, imageKey: "fresh", available: true },
  { id: "alabrasa-fries", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "Sides", name: "French Fries", description: "Side dish.", price: 9, vegetarian: true, imageKey: "treats", available: true },
  { id: "alabrasa-wedges", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "Sides", name: "Potato Wedges", description: "Side dish.", price: 9, vegetarian: true, imageKey: "treats", available: true },
  { id: "alabrasa-mashed-potatoes", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "Sides", name: "Mashed Potatoes", description: "Side dish.", price: 9, vegetarian: true, imageKey: "fresh", available: true },
  { id: "alabrasa-onion-rings", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "Sides", name: "Breaded Onion Rings", description: "Side dish.", price: 11, vegetarian: true, imageKey: "treats", available: true },
  { id: "alabrasa-sweet-potato-mash", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "Sides", name: "Mashed Sweet Potatoes", description: "Side dish.", price: 11, vegetarian: true, imageKey: "fresh", available: true },
  { id: "alabrasa-sweet-potato-fries", restaurantId: "alabrasa", restaurant: "Alabrasa", category: "Sides", name: "Sweet Potato Fries", description: "Side dish.", price: 11, vegetarian: true, imageKey: "treats", available: true },
  ...["BBQ", "Béarnaise", "Lime Tahini", "Sweet Chilli", "Green Peppercorn", "Lemon Garlic Butter", "Sherry Honey", "Honey Mustard", "Sherry Mustard", "Vegan Mushroom", "Mango Chilli Sauce"].map((name) => ({
    id: `alabrasa-sauce-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    restaurantId: "alabrasa",
    restaurant: "Alabrasa",
    category: "Sauces",
    name,
    description: "Sauce. Price not provided.",
    price: null,
    vegetarian: name === "Lime Tahini" || name === "Vegan Mushroom" || name === "Mango Chilli Sauce",
    imageKey: "fresh",
    available: false,
  })),
  { id: "subjects-switch-hit-up", restaurantId: "subjects", restaurant: "Subjects", category: "Signature subs", name: "Switch Hit Up", description: "Ciabatta, Switch plant-based breaded chicken, guacamole, lettuce, tomato and lime tahini sauce.", price: 30, vegetarian: true, imageKey: "fresh", available: true },
  { id: "subjects-cordon-bleu", restaurantId: "subjects", restaurant: "Subjects", category: "Signature subs", name: "Chicken Cordon Bleu", description: "Jumbo croissant, breaded chicken, turkey ham, onion, tomato, lettuce, cucumber, Emmental cheese and mayonnaise.", price: 29, vegetarian: false, imageKey: "grill", available: true },
  { id: "subjects-california-cobb", restaurantId: "subjects", restaurant: "Subjects", category: "Signature subs", name: "California Chicken Cobb", description: "Panini, breaded chicken, turkey ham, guacamole, lettuce, tomato, cream cheese and mayonnaise.", price: 30, vegetarian: false, imageKey: "grill", available: true },
  { id: "subjects-coronation-chicken", restaurantId: "subjects", restaurant: "Subjects", category: "Signature subs", name: "Coronation Chicken", description: "Panini, coronation chicken, onion, tomato, lettuce, cucumber and creamy mint mayo.", price: 30, vegetarian: false, imageKey: "grill", available: true },
  { id: "subjects-chipotle-chicken", restaurantId: "subjects", restaurant: "Subjects", category: "Signature subs", name: "Chipotle Chicken", description: "Ciabatta with chipotle chicken and cheddar.", price: 30, vegetarian: false, imageKey: "grill", available: true },
  { id: "subjects-falafel-wrap", restaurantId: "subjects", restaurant: "Subjects", category: "Signature wraps", name: "Crispy Vegan Falafel", description: "Falafel, onion, tomato, cucumber, lettuce, hummus, lime tahini sauce and tortilla.", price: 24, vegetarian: true, imageKey: "fresh", available: true },
  { id: "subjects-tofu-wrap", restaurantId: "subjects", restaurant: "Subjects", category: "Signature wraps", name: "Spiced Crunchy Tofu", description: "Spiced tofu, tomato, lettuce, red cabbage, cucumber, carrot, creamy mint mayo and tortilla.", price: 25, vegetarian: true, imageKey: "fresh", available: true },
  { id: "subjects-teriyaki-wrap", restaurantId: "subjects", restaurant: "Subjects", category: "Signature wraps", name: "Chicken Teriyaki", description: "Grilled chicken teriyaki, cheddar, lettuce, onion, carrot, cucumber, spring onion, teriyaki sauce and tortilla.", price: 29, vegetarian: false, imageKey: "grill", available: true },
  { id: "subjects-crunchy-chicken-wrap", restaurantId: "subjects", restaurant: "Subjects", category: "Signature wraps", name: "Crunchy Chicken", description: "Breaded chicken, cheddar, lettuce, tomato, cucumber, mayonnaise, smoky chipotle sauce and tortilla.", price: 29, vegetarian: false, imageKey: "grill", available: true },
  { id: "subjects-tikka-wrap", restaurantId: "subjects", restaurant: "Subjects", category: "Signature wraps", name: "Chicken Tikka", description: "Tikka chicken, onion, tomato, cucumber, green pepper, mint chutney and tortilla.", price: 30, vegetarian: false, imageKey: "grill", available: true },
] as const;

const slotTimes = (): string[] => {
  const times: string[] = [];
  for (let minute = 11 * 60 + 30; minute <= 13 * 60 + 30; minute += 10) {
    times.push(
      `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`,
    );
  }
  return times;
};

const isValidDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

class SlotFullError extends Error {}

const makePickupCode = (id: number) => {
  const letter = String.fromCharCode(65 + Math.floor(id / 100) % 26);
  return `${letter}${String(id % 100).padStart(2, "0")}`;
};

let menuSeedPromise: Promise<void> | undefined;
const ensureMenuSeeded = () => {
  if (!menuSeedPromise) {
    menuSeedPromise = (async () => {
      const [existing] = await db.select({ id: menuItems.id }).from(menuItems).limit(1);
      if (!existing) {
        await db
          .insert(menuItems)
          .values(menu.map((item, sortOrder) => ({ ...item, sortOrder })))
          .onConflictDoNothing();
      }
    })().catch((error: unknown) => {
      menuSeedPromise = undefined;
      throw error;
    });
  }
  return menuSeedPromise;
};

const itemResponse = (item: typeof menuItems.$inferSelect) => ({
  id: item.id,
  name: item.name,
  description: item.description,
  price: item.price,
  vegetarian: item.vegetarian,
  imageKey: item.imageKey,
  restaurantId: item.restaurantId,
  restaurant: item.restaurant,
  category: item.category,
  available: item.available,
});

router.get("/menu", async (_req, res): Promise<void> => {
  try {
    await ensureMenuSeeded();
    const storedMenu = await db.select().from(menuItems).orderBy(menuItems.sortOrder);
    res.set("Cache-Control", "no-store");
    res.json(storedMenu.map(itemResponse));
  } catch (error) {
    logger.error({ err: error }, "Failed to load dining menu");
    res.status(500).json({ error: "The dining menu is temporarily unavailable." });
  }
});

router.get("/restaurants", (_req, res) => {
  res.json(restaurants);
});

router.get("/staff/menu", requireSignedIn, async (_req, res): Promise<void> => {
  try {
    await ensureMenuSeeded();
    const storedMenu = await db
      .select()
      .from(menuItems)
      .orderBy(menuItems.restaurantId, menuItems.sortOrder);
    res.set("Cache-Control", "no-store");
    res.json(storedMenu.map(itemResponse));
  } catch (error) {
    logger.error({ err: error }, "Failed to load staff dining menu");
    res.status(500).json({ error: "The dining menu is temporarily unavailable." });
  }
});

router.patch("/staff/menu/:itemId", requireSignedIn, async (req, res): Promise<void> => {
  const itemId = Array.isArray(req.params.itemId) ? req.params.itemId[0] : req.params.itemId;
  const parsed = UpdateMenuItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Check the menu item details and try again." });
    return;
  }
  const input = parsed.data;
  if (!input.name.trim() || !input.category.trim() || (input.available && input.price === null)) {
    res.status(400).json({ error: "Available items need a name, category, and price." });
    return;
  }

  try {
    await ensureMenuSeeded();
    const [updated] = await db
      .update(menuItems)
      .set({
        name: input.name.trim(),
        description: input.description.trim(),
        category: input.category.trim(),
        price: input.price === null ? null : Math.round(input.price * 100) / 100,
        vegetarian: input.vegetarian,
        available: input.available,
      })
      .where(eq(menuItems.id, itemId))
      .returning();
    if (!updated) {
      res.status(404).json({ error: "Menu item not found." });
      return;
    }
    res.json(itemResponse(updated));
  } catch (error) {
    logger.error({ err: error, itemId }, "Failed to update dining menu item");
    res.status(500).json({ error: "The menu item could not be updated." });
  }
});

router.post(
  "/staff/restaurants/:restaurantId/menu",
  requireSignedIn,
  async (req, res): Promise<void> => {
    const restaurantId = Array.isArray(req.params.restaurantId)
      ? req.params.restaurantId[0]
      : req.params.restaurantId;
    const parsed = CreateMenuItemBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Check the new menu item details and try again." });
      return;
    }
    const restaurant = restaurants.find((entry) => entry.id === restaurantId);
    if (!restaurant) {
      res.status(404).json({ error: "Restaurant not found." });
      return;
    }
    const input = parsed.data;
    if (!input.name.trim() || !input.category.trim()) {
      res.status(400).json({ error: "Add a name and category for the menu item." });
      return;
    }

    try {
      await ensureMenuSeeded();
      const restaurantItems = await db
        .select({ sortOrder: menuItems.sortOrder })
        .from(menuItems)
        .where(eq(menuItems.restaurantId, restaurantId));
      const sortOrder =
        restaurantItems.reduce((highest, item) => Math.max(highest, item.sortOrder), -1) + 1;
      const [created] = await db
        .insert(menuItems)
        .values({
          id: `${restaurantId}-${randomUUID()}`,
          restaurantId,
          restaurant: restaurant.name,
          category: input.category.trim(),
          name: input.name.trim(),
          description: input.description.trim(),
          price: input.price === null ? null : Math.round(input.price * 100) / 100,
          vegetarian: input.vegetarian,
          imageKey: "fresh",
          available: input.price !== null,
          sortOrder,
        })
        .returning();
      if (!created) {
        res.status(500).json({ error: "The new menu item could not be saved." });
        return;
      }
      res.status(201).json(itemResponse(created));
    } catch (error) {
      logger.error({ err: error, restaurantId }, "Failed to create dining menu item");
      res.status(500).json({ error: "The new menu item could not be saved." });
    }
  },
);

router.get("/pickup-slots", async (req, res) => {
  const date = typeof req.query.date === "string" ? req.query.date : "";
  if (!isValidDate(date)) {
    return res.status(400).json({ error: "A valid date is required." });
  }

  try {
    const counts = await db
      .select({ time: orders.pickupTime, total: count() })
      .from(orders)
      .where(eq(orders.pickupDate, date))
      .groupBy(orders.pickupTime);
    const ordersByTime = new Map(counts.map((entry) => [entry.time, Number(entry.total)]));
    return res.json(
      slotTimes().map((time) => {
        const remaining = Math.max(0, SLOT_CAPACITY - (ordersByTime.get(time) ?? 0));
        return { time, remaining, available: remaining > 0 };
      }),
    );
  } catch (error) {
    logger.error({ err: error }, "Failed to load dining pickup slots");
    return res.status(500).json({ error: "Pickup times are temporarily unavailable." });
  }
});

router.post("/orders", async (req, res) => {
  const parsed = CreateOrderBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.studentName.trim()) {
    return res.status(400).json({ error: "Enter your name and check your order details." });
  }

  const input = parsed.data;
  const pickupDate = input.pickupDate.toISOString().slice(0, 10);
  const pickupTime = input.pickupTime;
  if (!slotTimes().includes(pickupTime)) {
    return res.status(400).json({ error: "Choose a listed pickup time." });
  }
  const studentName = input.studentName.trim();
  const requested = new Map<string, number>();
  for (const line of input.items) {
    requested.set(line.itemId, (requested.get(line.itemId) ?? 0) + line.quantity);
  }
  let currentMenu: typeof menuItems.$inferSelect[];
  try {
    await ensureMenuSeeded();
    currentMenu = await db
      .select()
      .from(menuItems)
      .where(inArray(menuItems.id, [...requested.keys()]));
  } catch (error) {
    logger.error({ err: error }, "Failed to validate dining order menu items");
    return res.status(500).json({ error: "The menu is temporarily unavailable. Please try again." });
  }
  const currentMenuById = new Map(currentMenu.map((item) => [item.id, item]));
  const selectedItems = [...requested.entries()].map(([itemId, quantity]) => {
    const item = currentMenuById.get(itemId);
    return item?.available && item.price !== null
      ? { itemId, quantity, name: item.name, price: item.price }
      : null;
  });
  if (selectedItems.some((item) => item === null)) {
    return res.status(400).json({ error: "One or more menu items are no longer available." });
  }
  const validItems = selectedItems.filter((item) => item !== null);
  const total = Math.round(
    validItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
  ) / 100;
  const mealSwipesUsed = input.mealSwipeCount;
  if (mealSwipesUsed > Math.ceil(total / MEAL_SWIPE_VALUE)) {
    return res.status(400).json({ error: "Choose no more meal swipes than the order needs." });
  }
  const dirhamAmount =
    Math.round(Math.max(0, total - mealSwipesUsed * MEAL_SWIPE_VALUE) * 100) / 100;
  const paymentMethod =
    mealSwipesUsed === 0
      ? input.balanceAccount
      : dirhamAmount > 0
        ? input.balanceAccount === "flex_dirhams"
          ? "meal_swipe_plus_flex"
          : "meal_swipe_plus_campus"
        : "meal_swipe";

  try {
    const created = await db.transaction(async (tx) => {
      // Serialize submissions for a specific date/time to keep the five-order cap exact.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`${pickupDate}:${pickupTime}`}))`);
      const [slotCount] = await tx
        .select({ total: count() })
        .from(orders)
        .where(and(eq(orders.pickupDate, pickupDate), eq(orders.pickupTime, pickupTime)));
      if (Number(slotCount?.total ?? 0) >= SLOT_CAPACITY) throw new SlotFullError();

      const [createdOrder] = await tx
        .insert(orders)
        .values({
          pickupCode: "pending",
          studentName,
          pickupDate,
          pickupTime,
          paymentMethod,
          mealSwipesUsed,
          dirhamAmount,
          total,
        })
        .returning({ id: orders.id, confirmationToken: orders.confirmationToken });
      if (!createdOrder) throw new Error("Order insert did not return an ID.");
      const pickupCode = makePickupCode(createdOrder.id);
      await tx.update(orders).set({ pickupCode }).where(eq(orders.id, createdOrder.id));
      await tx.insert(orderItems).values(
        validItems.map((item) => ({
          orderId: createdOrder.id,
          itemId: item.itemId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      );
      return {
        id: createdOrder.id,
        confirmationToken: createdOrder.confirmationToken,
        pickupCode,
      };
    });

    return res.status(201).json({
      id: created.id,
      confirmationToken: created.confirmationToken,
      pickupCode: created.pickupCode,
      studentName,
      pickupDate,
      pickupTime,
      paymentMethod,
      mealSwipesUsed,
      dirhamAmount,
      total,
      items: validItems.map(({ itemId, name, price, quantity }) => ({
        itemId,
        name,
        price,
        quantity,
      })),
    });
  } catch (error) {
    if (error instanceof SlotFullError) {
      return res.status(409).json({ error: "That pickup time is full. Please choose another slot." });
    }
    logger.error({ err: error }, "Failed to create dining order");
    return res.status(500).json({ error: "We couldn’t place your order. Please try again." });
  }
});

router.get("/orders/:confirmationToken", async (req, res) => {
  const confirmationToken = req.params.confirmationToken;
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      confirmationToken,
    )
  ) {
    return res.status(404).json({ error: "Order not found." });
  }
  try {
    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.confirmationToken, confirmationToken))
      .limit(1);
    if (!order) return res.status(404).json({ error: "Order not found." });
    const items = await db
      .select({
        itemId: orderItems.itemId,
        name: orderItems.name,
        price: orderItems.price,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, order.id));
    return res.json({
      id: order.id,
      confirmationToken: order.confirmationToken,
      pickupCode: order.pickupCode,
      studentName: order.studentName,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      paymentMethod: order.paymentMethod,
      mealSwipesUsed: order.mealSwipesUsed,
      dirhamAmount: order.dirhamAmount,
      total: order.total,
      items,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to load dining order");
    return res.status(500).json({ error: "We couldn’t load that order." });
  }
});

router.get("/staff/orders", requireSignedIn, async (_req, res) => {
  try {
    const activeOrders = await db
      .select()
      .from(orders)
      .where(sql`${orders.status} <> 'collected'`)
      .orderBy(orders.pickupDate, orders.pickupTime)
      .limit(100);
    if (activeOrders.length === 0) return res.json([]);

    const lines = await db
      .select({
        orderId: orderItems.orderId,
        itemId: orderItems.itemId,
        name: orderItems.name,
        price: orderItems.price,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(inArray(orderItems.orderId, activeOrders.map((order) => order.id)));
    const itemsByOrder = new Map<number, typeof lines>();
    for (const line of lines) {
      const orderLines = itemsByOrder.get(line.orderId) ?? [];
      orderLines.push(line);
      itemsByOrder.set(line.orderId, orderLines);
    }

    return res.json(
      activeOrders.map((order) => ({
        id: order.id,
        pickupCode: order.pickupCode,
        studentName: order.studentName,
        pickupDate: order.pickupDate,
        pickupTime: order.pickupTime,
        status: order.status,
        items: (itemsByOrder.get(order.id) ?? []).map(({ orderId: _orderId, ...item }) => item),
      })),
    );
  } catch (error) {
    logger.error({ err: error }, "Failed to load staff dining queue");
    return res.status(500).json({ error: "The staff order queue is temporarily unavailable." });
  }
});

router.patch("/staff/orders/:orderId/status", requireSignedIn, async (req, res) => {
  const id = Number(req.params.orderId);
  const nextStatus = req.body?.status;
  if (
    !Number.isInteger(id) ||
    id <= 0 ||
    !orderStatuses.includes(nextStatus as OrderStatus) ||
    nextStatus === "new"
  ) {
    return res.status(400).json({ error: "Choose a valid next order status." });
  }

  try {
    const [existing] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!existing) return res.status(404).json({ error: "Order not found." });
    const currentStatus = existing.status as OrderStatus;
    if (!staffNextStatuses[currentStatus]?.includes(nextStatus as OrderStatus)) {
      return res.status(409).json({ error: "This order has already moved to another stage." });
    }

    const [updated] = await db
      .update(orders)
      .set({ status: nextStatus as OrderStatus })
      .where(and(eq(orders.id, id), eq(orders.status, currentStatus)))
      .returning();
    if (!updated) {
      return res.status(409).json({ error: "This order was updated by another staff member." });
    }
    return res.json({
      id: updated.id,
      pickupCode: updated.pickupCode,
      studentName: updated.studentName,
      pickupDate: updated.pickupDate,
      pickupTime: updated.pickupTime,
      status: updated.status,
      items: await db
        .select({
          itemId: orderItems.itemId,
          name: orderItems.name,
          price: orderItems.price,
          quantity: orderItems.quantity,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, updated.id)),
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to update staff order status");
    return res.status(500).json({ error: "The order status could not be updated." });
  }
});

export default router;
