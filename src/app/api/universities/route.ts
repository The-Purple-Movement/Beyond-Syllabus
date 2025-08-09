import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const universitiesDir = path.join(process.cwd(), 'universities');

function capitalizeWords(str: string): string {
    if (!str) return '';
    return str.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function formatSemesterName(semesterId: string): string {
    if (!semesterId) return '';
    return `Semester ${semesterId.replace('s', '').replace(/^0+/, '')}`;
}

async function readSyllabusData() {
    const data: any = {};

    try {
        if (!fs.existsSync(universitiesDir)) {
             console.error(`Directory not found: ${universitiesDir}`);
             return { error: 'University data directory not found. Please ensure the `universities` folder exists at the root of your project.' };
        }
        
    // Pre-compile regex for better performance
    // Supports patterns like:
    //  - ### Module 1: Title
    //  - **Module 2**: Title
    //  - Module III - Title
    //  - **Weeks 1-2**: Logic and Proofs
    //  - Weeks 3-4 – Probability
    // Capture groups:
    //  1: Type label (Module|Week|Weeks)
    //  2: Module number OR week number/range (e.g., 1 or 1-2 or Roman numerals)
    //  3: Optional trailing title text
    const moduleRegex = /^#{0,6}\s*\*{0,2}\s*(Module|Weeks?|MODULE|WEEKS?)\s*(?:[-–—]?\s*)?((?:\d+(?:\s*-\s*\d+)?)|(?:I{1,4}V?|V(?:I{1,3})?|IX|X))\s*\*{0,2}\s*(?:[-–—:()]\s*(.*?))?\s*\*{0,2}$/i;
        
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
                          if (!(await fs.promises.lstat(semesterPath)).isDirectory()) continue;
                         const subjectFiles = await fs.promises.readdir(semesterPath);

                         data[universityId][programId][schemeId][semesterId] = { subjects: [] };

                        for (const subjectFile of subjectFiles) {
                            if (subjectFile.endsWith('.md')) {
                                const subjectFilePath = path.join(semesterPath, subjectFile);
                                const fileContent = await fs.promises.readFile(subjectFilePath, 'utf-8');
                                const { data: frontmatter, content } = matter(fileContent);

                                const moduleItems: { title: string; content: string }[] = [];
                                const lines = content.split('\n');
                                let currentModule: { title: string; content: string[] } | null = null;
                            
                                for (const line of lines) {
                                    const moduleMatch = line.match(moduleRegex);
                                    
                                    if (moduleMatch) {
                                        if (currentModule) {
                                            moduleItems.push({
                                                title: currentModule.title,
                                                content: currentModule.content.join('\n').trim(),
                                            });
                                        }
                                        
                                        // Extract type (Module/Week/Weeks), number/range and title from the regex groups
                                        const typeLabelRaw = moduleMatch[1];
                                        const numberOrRange = moduleMatch[2];
                                        let titleText = moduleMatch[3] || '';
                                        
                                        // Clean up the title more carefully
                                        if (titleText) {
                                            // Remove bold markers first
                                            titleText = titleText
                                                .replace(/^\*{0,2}/, '') // Remove leading bold markers
                                                .replace(/\*{0,2}$/, '') // Remove trailing bold markers
                                                .trim();
                                            
                                            // Remove leading separators (dash, em-dash, colon)
                                            titleText = titleText.replace(/^[-–—:]\s*/, '');
                                            
                                            // Remove trailing separators
                                            titleText = titleText.replace(/\s*[-–—:]\s*$/, '');
                                            
                                            // Handle parentheses intelligently
                                            // Case 1: Complete wrapper parentheses (remove them if no inner parentheses)
                                            if (titleText.startsWith('(') && titleText.endsWith(')')) {
                                                const inner = titleText.slice(1, -1);
                                                // Only remove if there are no other parentheses inside
                                                if (!inner.includes('(') && !inner.includes(')')) {
                                                    titleText = inner.trim();
                                                }
                                            }
                                            // Case 2: Only opening parenthesis (remove it)
                                            else if (titleText.startsWith('(') && !titleText.endsWith(')')) {
                                                titleText = titleText.slice(1).trim();
                                            }
                                            // Case 3: Only closing parenthesis - BUT check if it's a valid abbreviation
                                            else if (!titleText.startsWith('(') && titleText.endsWith(')')) {
                                                // Check if it looks like an abbreviation pattern: "Word (ABC)" 
                                                const abbreviationPattern = /\s+\([A-Z]{2,5}\)$/;
                                                if (!abbreviationPattern.test(titleText)) {
                                                    // Not an abbreviation, remove orphaned closing parenthesis
                                                    titleText = titleText.slice(0, -1).trim();
                                                }
                                            }
                                            
                                            titleText = titleText.trim();
                                        }
                                        
                                        // Normalize type label to singular 'Module' or 'Weeks'
                                        const normalizedType = /^week/i.test(typeLabelRaw) ? (/-/.test(numberOrRange) ? 'Weeks' : 'Week') : 'Module';
                                        // Use default title if empty
                                        const finalTitle = titleText || `${normalizedType} ${numberOrRange}`;
                                        
                                        currentModule = {
                                            title: finalTitle,
                                            content: [],
                                        };
                                    } else if (currentModule && line.trim()) {
                                        currentModule.content.push(line.replace(/^- /, '• '));
                                    }
                                }
                            
                                if (currentModule) {
                                    moduleItems.push({
                                        title: currentModule.title,
                                        content: currentModule.content.join('\n').trim(),
                                    });
                                }

                                const subjectData = {
                                    id: subjectFile.replace('.md', ''),
                                    code: frontmatter.course_code || 'N/A',
                                    name: frontmatter.course_title || 'N/A',
                                    fullSyllabus: content.trim(),
                                    modules: moduleItems,
                                    university: frontmatter.university || 'N/A',
                                    program: frontmatter.branch || 'N/A',
                                    scheme: frontmatter.version || 'N/A',
                                    semester: frontmatter.semester || 'N/A',
                                };
                                data[universityId][programId][schemeId][semesterId].subjects.push(subjectData);
                            }
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error reading syllabus data:", error);
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
             return { error: 'University data directory not found. Please ensure the `universities` folder exists at the root of your project.' };
        }
        return { error: 'An unexpected error occurred while reading syllabus data.' };
    }

    return data;
}


export async function GET() {
    const syllabusData = await readSyllabusData();

    if (!syllabusData) {
        return NextResponse.json({ error: 'Failed to load syllabus data' }, { status: 500 });
    }
     if (syllabusData.error) {
        return NextResponse.json({ error: syllabusData.error }, { status: 500 });
    }

    return NextResponse.json(syllabusData);
}
