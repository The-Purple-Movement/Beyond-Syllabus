#!/usr/bin/env bun
import fs from "fs";
import path from "node:path";
import matter from "gray-matter";

const universitiesDir = path.join(process.cwd(), "universities");

// Semesters where two files declare the same course code. Collected during
// the walk and reported at the end, so the list is not buried in the middle
// of the output. Never fatal: both records are kept and both stay reachable,
// because subjects are keyed on file name rather than course code.
const repeatedCodes: string[] = [];

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

            // Previous-year question papers: pyq/<subjectid>-<examyear>[-<session>].md
            const pyqsBySubject: Record<
              string,
              { examYear: string; session: string | null; content: string }[]
            > = {};
            const pyqDir = path.join(semesterPath, "pyq");
            if (
              fs.existsSync(pyqDir) &&
              (await fs.promises.lstat(pyqDir)).isDirectory()
            ) {
              const pyqFiles = await fs.promises.readdir(pyqDir);
              for (const pyqFile of pyqFiles) {
                const pyqMatch = pyqFile.match(
                  /^([a-z0-9_]+)-(\d{4})(?:-([a-z]+))?\.md$/i
                );
                if (!pyqMatch) continue;
                const [, subjectId, examYear, session] = pyqMatch;
                const pyqContent = await fs.promises.readFile(
                  path.join(pyqDir, pyqFile),
                  "utf-8"
                );
                const { content: pyqBody } = matter(pyqContent);
                (pyqsBySubject[subjectId] ??= []).push({
                  examYear,
                  session: session || null,
                  content: pyqBody.trim(),
                });
              }
              for (const list of Object.values(pyqsBySubject)) {
                list.sort((a, b) => b.examYear.localeCompare(a.examYear));
              }
            }

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
                  pyqs: pyqsBySubject[subjectFile.replace(".md", "")] || [],
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

            // A course code should identify one course within a semester.
            // When it does not, the semester list shows the same code on two
            // cards and any lookup by code is ambiguous. Both entries are
            // still emitted; this only surfaces the clash.
            const idsByCode = new Map<string, string[]>();
            for (const subject of data[universityId][programId][schemeId][
              semesterId
            ].subjects) {
              // "N/A" is the placeholder for a missing course_code, so it
              // would otherwise collide with every other incomplete file.
              if (!subject.code || subject.code === "N/A") continue;
              const key = String(subject.code).toLowerCase();
              const ids = idsByCode.get(key) ?? [];
              ids.push(subject.id);
              idsByCode.set(key, ids);
            }
            for (const [code, ids] of idsByCode) {
              if (ids.length > 1) {
                repeatedCodes.push(
                  `${universityId}/${programId}/${schemeId}/${semesterId}: ` +
                    `${code} on ${ids.sort().join(", ")}`
                );
              }
            }
          }
        }
      }
    }

    const outputPath = path.join(
      process.cwd(),
      "apps/server/src/routes/syllabus/syllabus.json"
    );

    await Bun.write(outputPath, JSON.stringify(data, null, 2));
    console.log(`✅ Syllabus data generated at ${outputPath}`);

    if (repeatedCodes.length > 0) {
      console.warn(
        `⚠️  ${repeatedCodes.length} semester(s) declare a course code twice:`
      );
      for (const line of repeatedCodes.sort()) console.warn(`   ${line}`);
      console.warn(
        "   Both courses are still generated and both remain reachable. " +
          "The codes need correcting in WikiSyllabus, where scripts/audit.py " +
          "reports the same clashes against the source."
      );
    }
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
