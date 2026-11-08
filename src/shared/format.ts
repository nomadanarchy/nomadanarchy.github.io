/**
 * Minecraft-style formatting: `%s` takes the next argument, `%1$s` takes a
 * specific one (so translators can reorder), `%%` is a literal percent sign.
 * Shared by the build and by the browser code.
 */
export function format(template: string, args: readonly string[] = []): string {
  let next = 0;
  return template.replace(/%(?:(\d+)\$)?([s%])/g, (_, position: string | undefined, conv: string) => {
    if (conv === "%") return "%";
    const index = position ? Number(position) - 1 : next++;
    return args[index] ?? "";
  });
}
