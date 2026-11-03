import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const orders = pgTable("dining_orders", {
  id: serial("id").primaryKey(),
  pickupCode: text("pickup_code").notNull(),
  studentName: text("student_name").notNull(),
  pickupDate: text("pickup_date").notNull(),
  pickupTime: text("pickup_time").notNull(),
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