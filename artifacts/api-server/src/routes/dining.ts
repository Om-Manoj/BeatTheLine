import { Router, type IRouter } from "express";
import { and, count, eq, sql } from "drizzle-orm";
import { CreateOrderBody } from "@workspace/api-zod";
import { db } from "@workspace/db";
import { orderItems, orders } from "@workspace/db/schema";
import { logger } from "../lib/logger";

const router: IRouter = Router();
const SLOT_CAPACITY = 5;

const menu = [
  {
    id: "burger",
    name: "Campus Smash Burger",
    description: "Griddled beef, cheddar, lettuce & house sauce",
    price: 8.49,
    vegetarian: false,
    imageKey: "grill",
  },
  {
    id: "wrap",
    name: "Chicken Caesar Wrap",
    description: "Grilled chicken, crisp romaine & parmesan",
    price: 7.25,
    vegetarian: false,
    imageKey: "grill",
  },
  {
    id: "bowl",
    name: "Harvest Veggie Bowl",
    description: "Roasted vegetables, grains & lemon tahini",
    price: 8.25,
    vegetarian: true,
    imageKey: "fresh",
  },
  {
    id: "pasta",
    name: "Creamy Pesto Pasta",
    description: "Basil pesto, parmesan & toasted seeds",
    price: 7.75,
    vegetarian: true,
    imageKey: "fresh",
  },
  {
    id: "salad",
    name: "Garden Salad",
    description: "Seasonal greens, cucumber & house vinaigrette",
    price: 6.5,
    vegetarian: true,
    imageKey: "fresh",
  },
  {
    id: "fries",
    name: "Crispy Fries",
    description: "Golden fries with a pinch of sea salt",
    price: 3.25,
    vegetarian: true,
    imageKey: "treats",
  },
  {
    id: "cookie",
    name: "Chocolate Chip Cookie",
    description: "Soft-baked, loaded with chocolate chips",
    price: 2.25,
    vegetarian: true,
    imageKey: "treats",
  },
  {
    id: "drink",
    name: "Iced Citrus Lemonade",
    description: "Fresh-squeezed lemons, served over ice",
    price: 2.5,
    vegetarian: true,
    imageKey: "treats",
  },
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

router.get("/menu", (_req, res) => {
  res.json(menu);
});

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
  const selectedItems = [...requested.entries()].map(([itemId, quantity]) => {
    const item = menu.find((menuItem) => menuItem.id === itemId);
    return item ? { itemId, quantity, name: item.name, price: item.price } : null;
  });
  if (selectedItems.some((item) => item === null)) {
    return res.status(400).json({ error: "One or more menu items are no longer available." });
  }
  const validItems = selectedItems.filter((item) => item !== null);
  const total = Math.round(
    validItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100,
  ) / 100;

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
          total,
        })
        .returning({ id: orders.id });
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
      return { id: createdOrder.id, pickupCode };
    });

    return res.status(201).json({
      id: created.id,
      pickupCode: created.pickupCode,
      studentName,
      pickupDate,
      pickupTime,
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

router.get("/orders/:orderId", async (req, res) => {
  const id = Number(req.params.orderId);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(404).json({ error: "Order not found." });
  }
  try {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return res.status(404).json({ error: "Order not found." });
    const items = await db
      .select({
        itemId: orderItems.itemId,
        name: orderItems.name,
        price: orderItems.price,
        quantity: orderItems.quantity,
      })
      .from(orderItems)
      .where(eq(orderItems.orderId, id));
    return res.json({
      id: order.id,
      pickupCode: order.pickupCode,
      studentName: order.studentName,
      pickupDate: order.pickupDate,
      pickupTime: order.pickupTime,
      total: order.total,
      items,
    });
  } catch (error) {
    logger.error({ err: error }, "Failed to load dining order");
    return res.status(500).json({ error: "We couldn’t load that order." });
  }
});

export default router;
