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
    text: '#321B40',
    tint: '#57068C',

    // Core surfaces
    background: '#F8F4FA',
    foreground: '#321B40',

    // Cards / elevated surfaces
    card: '#FFFCF8',
    cardForeground: '#321B40',

    // Primary action color (buttons, links, active states)
    primary: '#57068C',
    primaryForeground: '#FFFFFF',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#EEE6F4',
    secondaryForeground: '#321B40',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#F0EBF2',
    mutedForeground: '#786D80',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#F6E9C9',
    accentForeground: '#70521B',

    // Positive status / availability
    success: '#52745D',
    successForeground: '#3D6049',
    successSurface: '#E8F0E8',

    // Destructive actions (delete, error states)
    destructive: '#C74A3B',
    destructiveForeground: '#FFFFFF',

    // Borders and input outlines
    border: '#E6DDEB',
    input: '#D8CDDF',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 16,
};

export default colors;
