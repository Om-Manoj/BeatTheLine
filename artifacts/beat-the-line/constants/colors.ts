/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#183A2C',
    tint: '#287A54',

    // Core surfaces
    background: '#F8F8F1',
    foreground: '#183A2C',

    // Cards / elevated surfaces
    card: '#FFFFFF',
    cardForeground: '#183A2C',

    // Primary action color (buttons, links, active states)
    primary: '#287A54',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#E8F0E8',
    secondaryForeground: '#183A2C',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#EEF0E8',
    mutedForeground: '#68766A',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#FFF0D7',
    accentForeground: '#6B4A1F',

    // Destructive actions (delete, error states)
    destructive: '#C74A3B',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#E2E7DC',
    input: '#D7DED4',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 16,
};

export default colors;
