// titleCase() is the single gate between WikiSyllabus folder names and
// every visible label in the app (M1 of the UX rework). If it regresses,
// ALL CAPS universities and raw slugs come back.
import { describe, expect, it } from "vitest";
import { titleCase } from "./utils";

describe("titleCase", () => {
  it("turns slugs into human titles with minor words lowercased", () => {
    expect(titleCase("artificial-intelligence-and-data-science")).toBe(
      "Artificial Intelligence and Data Science"
    );
    expect(titleCase("economics-for-engineers")).toBe(
      "Economics for Engineers"
    );
    expect(titleCase("mathematics-for-computer-and-information-science-3")).toBe(
      "Mathematics for Computer and Information Science 3"
    );
  });

  it("keeps a minor word capitalized when it leads the title", () => {
    expect(titleCase("the-purple-movement")).toBe("The Purple Movement");
  });

  it("uppercases known acronyms anywhere", () => {
    expect(titleCase("ai-and-ml-fundamentals")).toBe("AI and ML Fundamentals");
    expect(titleCase("iot-systems")).toBe("IOT Systems");
  });

  it("tames ALL CAPS input", () => {
    expect(titleCase("CALICUT UNIVERSITY")).toBe("Calicut University");
  });

  it("is safe on empty and undefined", () => {
    expect(titleCase("")).toBe("");
    expect(titleCase(undefined)).toBe("");
  });
});
