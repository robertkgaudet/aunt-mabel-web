/**
 * Homer theme configuration.
 *
 * In the original Homer template, the "sidebar-dark", "sidebar-gray",
 * "topbar-dark", and "topbar-gray" demo pages were just the same layout
 * with different data-* attributes hardcoded on the <html> element.
 *
 * Here they collapse into one config object. Change a value below and the
 * whole template re-themes. Homer's config.js still reads these attributes
 * at runtime and the customizer can override them per-session.
 *
 * Valid values (from Homer's customizer):
 *   theme:          "light" | "dark"
 *   skin:           "default" | "ubold" | ...  (see customizer)
 *   sidenavColor:   "light" | "dark" | "gray" | "brand" | "gradient"
 *   sidenavSize:    "default" | "compact" | "condensed" | "offcanvas" | "fullscreen" | "sm-hover"
 *   topbarColor:    "light" | "dark" | "gray"
 *   layoutPosition: "fixed" | "scrollable"
 */
export interface HomerTheme {
  skin: string;
  theme: 'light' | 'dark';
  sidenavColor: string;
  sidenavSize: string;
  sidenavUser: boolean;
  topbarColor: string;
  layoutPosition: 'fixed' | 'scrollable';
}

export const themeConfig: HomerTheme = {
  skin: 'default',
  theme: 'light',
  sidenavColor: 'light',
  sidenavSize: 'default',
  sidenavUser: true,
  topbarColor: 'light',
  layoutPosition: 'fixed',
};

/** Build the data-* attribute map applied to <html>. */
export function htmlThemeAttrs(cfg: HomerTheme = themeConfig): Record<string, string> {
  const attrs: Record<string, string> = {
    'data-skin': cfg.skin,
    'data-bs-theme': cfg.theme,
    'data-sidenav-color': cfg.sidenavColor,
    'data-sidenav-size': cfg.sidenavSize,
    'data-topbar-color': cfg.topbarColor,
    'data-layout-position': cfg.layoutPosition,
  };
  if (cfg.sidenavUser) attrs['data-sidenav-user'] = 'true';
  return attrs;
}
