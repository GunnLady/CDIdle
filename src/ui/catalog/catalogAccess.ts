export function shouldRenderUiCatalog(isDevelopment: boolean, search: string) {
  return isDevelopment && new URLSearchParams(search).get("ui-catalog") === "1";
}
