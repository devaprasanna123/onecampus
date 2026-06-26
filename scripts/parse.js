const fs = require('fs');
const path = require('path');
const vm = require('vm');

const baseDir = path.resolve(__dirname, '../../');
const outputFilePath = path.join(__dirname, '../parsed_questions.json');

const files = [
    { unit: 1, path: '22CH203_Unit1_AnswerKey.html', name: 'Atomic Structure & Electrochemistry I', type: 'html' },
    { unit: 2, path: '22CH203_Unit2_Answer_Key.html', name: 'Electrochemical Cells & Batteries', type: 'js' },
    { unit: 3, path: '22CH203_Unit3_Corrosion_AnswerKey.html', name: 'Corrosion Science', type: 'js' },
    { unit: 4, path: 'unit4_answer_key.html', name: 'Catalysis & Energy Profiles', type: 'html' },
    { unit: 5, path: 'unit5_answer_key.html', name: 'Nuclear Chemistry & Isotopes', type: 'js' }
];

const results = [];

function cleanText(text) {
    if (!text) return '';
    return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractJSArray(content) {
    const startIdx = content.search(/questions\s*=\s*\[/);
    if (startIdx === -1) {
        return null;
    }
    const arrayStart = content.indexOf('[', startIdx);
    let openBrackets = 0;
    let inString = null;
    let i = arrayStart;
    
    while (i < content.length) {
        const char = content[i];
        
        if (inString) {
            // Handle escape characters inside strings
            if (char === inString && content[i - 1] !== '\\') {
                inString = null;
            }
        } else if (char === "'" || char === '"' || char === '`') {
            inString = char;
        } else if (char === '[') {
            openBrackets++;
        } else if (char === ']') {
            openBrackets--;
            if (openBrackets === 0) {
                return content.substring(arrayStart, i + 1);
            }
        }
        i++;
    }
    return null;
}

function parseHTMLUnit(filePath, unitNum) {
    const content = fs.readFileSync(filePath, 'utf8');
    const questions = [];

    if (unitNum === 1) {
        const parts = content.split('<div class="q-card"');
        for (let i = 1; i < parts.length; i++) {
            const cardContent = parts[i];
            const numMatch = cardContent.match(/id="q(\d+)"/);
            if (!numMatch) continue;
            const qNum = parseInt(numMatch[1], 10);
            
            let title = '';
            const titleMatch = cardContent.match(/<div class="q-title">([\s\S]*?)<\/div>/);
            if (titleMatch) title = cleanText(titleMatch[1]);

            let answerHtml = '';
            const ansMatch = cardContent.match(/<div class="ans-text">([\s\S]*?)<\/div>\s*<\/div>/);
            if (ansMatch) {
                answerHtml = ansMatch[1].trim();
            }

            const keyPoints = [];
            const kpMatch = cardContent.match(/<div class="key-points">([\s\S]*?)<\/div>\s*<\/div>/);
            if (kpMatch) {
                const lis = kpMatch[1].match(/<li>([\s\S]*?)<\/li>/g);
                if (lis) {
                    lis.forEach(li => keyPoints.push(cleanText(li)));
                }
            }

            let summary = '';
            const sumMatch = cardContent.match(/<div class="summary-text">([\s\S]*?)<\/div>/);
            if (sumMatch) {
                summary = cleanText(sumMatch[1]);
            }

            let marks = '8 Marks';
            const marksMatch = cardContent.match(/<span class="q-marks">([\s\S]*?)<\/span>/);
            if (marksMatch) marks = cleanText(marksMatch[1]);

            const keywords = [...new Set(title.toLowerCase().match(/\b[a-z]{4,15}\b/g) || [])]
                .filter(w => !['what', 'explain', 'describe', 'analyze', 'determine', 'compare', 'contrast', 'justify', 'between', 'influence'].includes(w));

            questions.push({
                question_number: qNum,
                question_title: title.substring(0, 80) + '...',
                question_text: title,
                answer_html: `<div>
                    <div class="marks-badge">${marks}</div>
                    <div class="answer-content">${answerHtml}</div>
                    ${keyPoints.length ? `<div class="keypoints-section"><h3>Key Points</h3><ul>${keyPoints.map(k => `<li>${k}</li>`).join('')}</ul></div>` : ''}
                    ${summary ? `<div class="summary-section"><h3>Summary</h3><p>${summary}</p></div>` : ''}
                </div>`,
                keywords: keywords.slice(0, 6)
            });
        }
    } else if (unitNum === 4) {
        const parts = content.split('<div class="q-card"');
        for (let i = 1; i < parts.length; i++) {
            const cardContent = parts[i];
            const numMatch = cardContent.match(/id="q(\d+)"/);
            if (!numMatch) continue;
            const qNum = parseInt(numMatch[1], 10);

            let title = '';
            const titleMatch = cardContent.match(/<div class="q-text">([\s\S]*?)<\/div>/);
            if (titleMatch) title = cleanText(titleMatch[1]);

            let keyPoints = [];
            const kpMatch = cardContent.match(/<ul class="key-points">([\s\S]*?)<\/ul>/);
            if (kpMatch) {
                const lis = kpMatch[1].match(/<li>([\s\S]*?)<\/li>/g);
                if (lis) {
                    lis.forEach(li => keyPoints.push(cleanText(li)));
                }
            }

            let summary = '';
            const sumMatch = cardContent.match(/<div class="summary-box">([\s\S]*?)<\/div>/);
            if (sumMatch) {
                summary = cleanText(sumMatch[1]);
            }

            let answers = [];
            const ansTexts = cardContent.match(/<div class="answer-text">([\s\S]*?)<\/div>/g) || [];
            ansTexts.forEach(ans => {
                answers.push(ans.trim());
            });

            const formulaMatch = cardContent.match(/<div class="formula-block">([\s\S]*?)<\/div>/);
            const formula = formulaMatch ? formulaMatch[1].trim() : '';

            const keywords = [];
            const tagsMatch = cardContent.match(/<div class="q-tags">([\s\S]*?)<\/div>/);
            if (tagsMatch) {
                const tagList = tagsMatch[1].match(/<span class="tag">([\s\S]*?)<\/span>/g);
                if (tagList) {
                    tagList.forEach(t => keywords.push(cleanText(t).toLowerCase()));
                }
            }

            questions.push({
                question_number: qNum,
                question_title: title.substring(0, 80) + '...',
                question_text: title,
                answer_html: `<div>
                    ${answers.join('<br>')}
                    ${formula ? `<pre class="formula-block">${formula}</pre>` : ''}
                    ${keyPoints.length ? `<div class="keypoints-section"><h3>Key Points</h3><ul>${keyPoints.map(k => `<li>${k}</li>`).join('')}</ul></div>` : ''}
                    ${summary ? `<div class="summary-section"><h3>Summary</h3><p>${summary}</p></div>` : ''}
                </div>`,
                keywords: keywords.length ? keywords : ['catalysis', 'energy profiles']
            });
        }
    }
    return questions;
}

function parseJSUnit(filePath, unitNum) {
    const content = fs.readFileSync(filePath, 'utf8');
    const arrayStr = extractJSArray(content);
    if (!arrayStr) {
        throw new Error(`Could not statically extract questions array from ${filePath}`);
    }

    const scriptToRun = `const q = ${arrayStr}; q;`;
    const sandbox = {};
    vm.createContext(sandbox);
    const questions = vm.runInContext(scriptToRun, sandbox);

    if (!Array.isArray(questions)) {
        throw new Error(`Extracted result is not an array for ${filePath}`);
    }

    return questions.map(q => {
        let title = '';
        let text = '';
        let answerHtml = '';
        let keywords = [];

        if (unitNum === 2) {
            title = q.ask ? q.ask.substring(0, 80) + '...' : `Question ${q.n}`;
            text = `${q.scenario || ''} ${q.ask || ''}`.trim();
            const formulas = q.answer.formulas || [];
            const keyPoints = q.answer.keyPoints || [];
            
            answerHtml = `<div>
                <p>${q.answer.explanation || ''}</p>
                ${formulas.map(f => `<div class="formula-box"><span class="label">${f.label}</span><pre>${f.code}</pre></div>`).join('')}
                ${keyPoints.length ? `<div class="keypoints-section"><h3>Key Points</h3><ul>${keyPoints.map(kp => `<li>${kp}</li>`).join('')}</ul></div>` : ''}
                ${q.answer.summary ? `<div class="summary-section"><h3>Summary</h3><p>${q.answer.summary}</p></div>` : ''}
            </div>`;
            keywords = ['electrochemistry', 'cells', 'batteries'];
        } else if (unitNum === 3) {
            title = q.title || `Question ${q.n}`;
            text = `${q.scenario || ''} ${q.ask || ''}`.trim();
            answerHtml = q.body || '';
            keywords = q.tags || ['corrosion'];
        } else if (unitNum === 5) {
            title = q.task ? q.task.substring(0, 80) + '...' : `Question ${q.id}`;
            text = `${q.scenario || ''} ${q.task || ''}`.trim();
            
            const keyPoints = q.keypoints || [];
            
            answerHtml = `<div>
                ${q.answer || ''}
                ${q.formula ? `<pre class="formula-box">${q.formula}</pre>` : ''}
                ${keyPoints.length ? `<div class="keypoints-section"><h3>Key Points</h3><ul>${keyPoints.map(kp => `<li>${kp}</li>`).join('')}</ul></div>` : ''}
                ${q.summary ? `<div class="summary-section"><h3>Summary</h3><p>${q.summary}</p></div>` : ''}
            </div>`;
            keywords = q.keywords || ['nuclear', 'isotopes'];
        }

        return {
            question_number: q.n || q.id,
            question_title: cleanText(title),
            question_text: cleanText(text),
            answer_html: answerHtml,
            keywords: keywords.map(k => k.toLowerCase())
        };
    });
}

// Execute parsing
files.forEach(f => {
    const fullPath = path.join(baseDir, f.path);
    console.log(`Parsing Unit ${f.unit}: ${f.name} (${f.path})...`);
    let questions = [];
    try {
        if (f.type === 'html') {
            questions = parseHTMLUnit(fullPath, f.unit);
        } else {
            questions = parseJSUnit(fullPath, f.unit);
        }
        console.log(`Parsed ${questions.length} questions for Unit ${f.unit}.`);
        results.push({
            unit_number: f.unit,
            unit_name: f.name,
            questions: questions
        });
    } catch (e) {
        console.error(`Error parsing ${f.path}:`, e.message);
    }
});

fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2));
console.log(`Successfully wrote all parsed units to ${outputFilePath}`);
