import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export * from "./menu-items";

export const orders = pgTable("dining_orders", {
  id: serial("id").primaryKey(),
  confirmationToken: uuid("confirmation_token").defaultRandom().notNull(),
  pickupCode: text("pickup_code").notNull(),
  studentName: text("student_name").notNull(),
  pickupDate: text("pickup_date").notNull(),
  pickupTime: text("pickup_time").notNull(),
  paymentMethod: text("payment_method").notNull().default("pay_at_pickup"),
  mealSwipesUsed: integer("meal_swipes_used").notNull().default(0),
  dirhamAmount: numeric("dirham_amount", { precision: 10, scale: 2, mode: "number" }).notNull().default(0),
  status: text("status").notNull().default("new"),
  total: numeric("total", { precision: 10, scale: 2, mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const orderItems = pgTable("dining_order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull(),
  name: text("name").notNull(),
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }).notNull(),
  quantity: integer("quantity").notNull(),
});