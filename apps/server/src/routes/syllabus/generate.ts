#!/usr/bin/env bun
import fs from "fs";
import path from "node:path";
import matter from "gray-matter";

const universitiesDir = path.join(process.cwd(), "universities");

async function readSyllabusData() {
  const data: any = {};

  try {
    if (!fs.existsSync(universitiesDir)) {
      throw new Error(
        "University data directory not found. Please ensure the `universities` folder exists at the root of your project."
      );
    }

    const moduleRegex =
      /^#{0,6}\s*\*{0,2}\s*(Module|Weeks?|MODULE|WEEKS?)\s*(?:[-–—]?\s*)?((?:\d+(?:\s*-\s*\d+)?)|(?:I{1,4}V?|V(?:I{1,3})?|IX|X))\s*\*{0,2}\s*(?:[-–—:()]\s*(.*?))?\s*\*{0,2}$/i;

    const universities = await fs.promises.readdir(universitiesDir);

    for (const universityId of universities) {
      const universityPath = path.join(universitiesDir, universityId);
      if (!(await fs.promises.lstat(universityPath)).isDirectory()) continue;
      const programDirs = await fs.promises.readdir(universityPath);

      data[universityId] = {};

      for (const programId of programDirs) {
        const programPath = path.join(universityPath, programId);
        if (!(await fs.promises.lstat(programPath)).isDirectory()) continue;
        const schemeDirs = await fs.promises.readdir(programPath);

        data[universityId][programId] = {};

        for (const schemeId of schemeDirs) {
          const schemePath = path.join(programPath, schemeId);
          if (!(await fs.promises.lstat(schemePath)).isDirectory()) continue;
          const semesterDirs = await fs.promises.readdir(schemePath);

          data[universityId][programId][schemeId] = {};

          for (const semesterId of semesterDirs) {
            const semesterPath = path.join(schemePath, semesterId);
            if (!(await fs.promises.lstat(semesterPath)).isDirectory())
              continue;
            const subjectFiles = await fs.promises.readdir(semesterPath);

            data[universityId][programId][schemeId][semesterId] = {
              subjects: [],
            };

            for (const subjectFile of subjectFiles) {
              if (subjectFile.endsWith(".md")) {
                const subjectFilePath = path.join(semesterPath, subjectFile);
                const fileContent = await fs.promises.readFile(
                  subjectFilePath,
                  "utf-8"
                );
                const { data: frontmatter, content } = matter(fileContent);

                const moduleItems: { title: string; content: string }[] = [];
                const lines = content.split("\n");
                let currentModule: { title: string; content: string[] } | null =
                  null;

                for (const line of lines) {
                  const moduleMatch = line.match(moduleRegex);

                  if (moduleMatch) {
                    if (currentModule) {
                      moduleItems.push({
                        title: currentModule.title,
                        content: currentModule.content.join("\n").trim(),
                      });
                    }

                    const typeLabelRaw = moduleMatch[1];
                    const numberOrRange = moduleMatch[2];
                    let titleText = moduleMatch[3] || "";

                    if (titleText) {
                      titleText = titleText
                        .replace(/^\*{0,2}/, "")
                        .replace(/\*{0,2}$/, "")
                        .trim();

                      titleText = titleText.replace(/^[-–—:]\s*/, "");
                      titleText = titleText.replace(/\s*[-–—:]\s*$/, "");

                      if (
                        titleText.startsWith("(") &&
                        titleText.endsWith(")")
                      ) {
                        const inner = titleText.slice(1, -1);
                        if (!inner.includes("(") && !inner.includes(")")) {
                          titleText = inner.trim();
                        }
                      } else if (
                        titleText.startsWith("(") &&
                        !titleText.endsWith(")")
                      ) {
                        titleText = titleText.slice(1).trim();
                      } else if (
                        !titleText.startsWith("(") &&
                        titleText.endsWith(")")
                      ) {
                        const abbreviationPattern = /\s+\([A-Z]{2,5}\)$/;
                        if (!abbreviationPattern.test(titleText)) {
                          titleText = titleText.slice(0, -1).trim();
                        }
                      }

                      titleText = titleText.trim();
                    }

                    const normalizedType = /^week/i.test(typeLabelRaw)
                      ? /-/.test(numberOrRange)
                        ? "Weeks"
                        : "Week"
                      : "Module";

                    const finalTitle =
                      titleText || `${normalizedType} ${numberOrRange}`;

                    currentModule = {
                      title: finalTitle,
                      content: [],
                    };
                  } else if (currentModule && line.trim()) {
                    currentModule.content.push(line.replace(/^- /, "• "));
                  }
                }

                if (currentModule) {
                  moduleItems.push({
                    title: currentModule.title,
                    content: currentModule.content.join("\n").trim(),
                  });
                }

                const subjectData = {
                  id: subjectFile.replace(".md", ""),
                  code: frontmatter.course_code || "N/A",
                  name: frontmatter.course_title || "N/A",
                  fullSyllabus: content.trim(),
                  modules: moduleItems,
                  university: frontmatter.university || "N/A",
                  program: frontmatter.branch || "N/A",
                  scheme: frontmatter.version || "N/A",
                  semester: frontmatter.semester || "N/A",
                };
                data[universityId][programId][schemeId][
                  semesterId
                ].subjects.push(subjectData);
              }
            }
          }
        }
      }
    }

    const outputPath = path.join(
      process.cwd(),
      "src/routes/syllabus/university.json"
    );

    await Bun.write(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Syllabus data generated at ${outputPath}`);
  } catch (error) {
    console.error("❌ Error generating syllabus data:", error);
    process.exit(1);
  }
}

(async () => {
  console.log("🔹 Generating syllabus data...");
  await readSyllabusData();
  console.log("🔹 Done!");
})();
