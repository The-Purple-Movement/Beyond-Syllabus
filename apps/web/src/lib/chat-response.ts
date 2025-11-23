export const responseHelper = (markdown: string): string => {
  if (!markdown) return markdown;

  let fixed: string = markdown;

  fixed = fixed.replace(
    /\\\(([\s\S]*?)\\\)/g,
    (_: string, mathContent: string): string => {
      return `$${mathContent}$`;
    }
  );

  fixed = fixed.replace(
    /\\\[([\s\S]*?)\\\]/g,
    (_: string, mathContent: string): string => {
      return `$$${mathContent}$$`;
    }
  );

  fixed = fixed.replace(
    /\$\$([\s\S]*?)\$\$/g,
    (_: string, mathContent: string): string => {
      const placeholder = "___KA_TEX_NEWLINE___";
      let processed = mathContent.replace(/\\\\/g, placeholder);
      processed = processed.trim();
      processed = processed.replace(/\n/g, "");
      processed = processed.replace(new RegExp(placeholder, "g"), "\\\\");
      return `$$\n${processed}\n$$`;
    }
  );

  return fixed;
};
