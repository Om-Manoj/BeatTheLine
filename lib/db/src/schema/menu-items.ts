import {
  boolean,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const menuItems = pgTable("dining_menu_items", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id").notNull(),
  restaurant: text("restaurant").notNull(),
  category: text("category").notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2, mode: "number" }),
  vegetarian: boolean("vegetarian").notNull().default(false),
  imageKey: text("image_key").notNull().default("fresh"),
  available: boolean("available").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type MenuItemRecord = typeof menuItems.$inferSelect;
export type NewMenuItemRecord = typeof menuItems.$inferInsert;
