export const responseHelper = (markdown: string): string => {
  if (!markdown) return markdown;

  let fixed: string = markdown;

  fixed = fixed.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_: string, mathContent: string) => `$${mathContent}$`
  );

  fixed = fixed.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_: string, mathContent: string) => `$$${mathContent}$$`
  );

  fixed = fixed.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (_: string, mathContent: string) => {
      const placeholder = "___KA_TEX_NEWLINE___";
      let processed = mathContent.replace(/\\\\/g, placeholder);
      processed = processed.trim().replace(/\n+/g, "");
      processed = processed.replace(new RegExp(placeholder, "g"), "\\\\");
      return `$$\n${processed}\n$$`;
    }
  );

  fixed = fixed.replace(
    /(?<!\$)\$([^\$]+?)\$(?!\$)/g,
    (_: string, mathContent: string) => `$${mathContent.trim()}$`
  );

  return fixed;
};
