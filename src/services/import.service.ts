import { supabase } from '../lib/supabase';

export interface ImportResult {
  success: boolean;
  subjectName: string;
  subjectCode: string;
  totalUnits: number;
  totalQuestions: number;
  error?: string;
}

class ImportService {
  async importSubjectHTML(fileName: string, htmlContent: string): Promise<ImportResult> {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // 1. Detect Subject details from Title or Headers
      let titleText = doc.querySelector('title')?.textContent || '';
      let subjectCode = 'UNKNOWN';
      let subjectName = 'Imported Subject';
      let semester = 'S2';

      // Match patterns like "22CH203 – Engineering Chemistry II"
      const codeMatch = titleText.match(/([0-9]{2}[A-Z]{2}[0-9]{3})/);
      if (codeMatch) {
        subjectCode = codeMatch[1];
        const nameParts = titleText.split(/[-–|]/);
        if (nameParts.length > 1) {
          subjectName = nameParts[1].trim().replace(/\s+Answer\s+Key|\s+Unit\s+[0-9]+/gi, '');
        }
      }

      // Check for subject details in fallback elements
      const mainHeader = doc.querySelector('h1, h2')?.textContent || '';
      if (subjectCode === 'UNKNOWN' && mainHeader) {
        const headerCodeMatch = mainHeader.match(/([0-9]{2}[A-Z]{2}[0-9]{3})/);
        if (headerCodeMatch) {
          subjectCode = headerCodeMatch[1];
          subjectName = mainHeader.replace(subjectCode, '').replace(/[-–|]/g, '').trim();
        }
      }

      // 2. Insert or find Subject in Supabase
      const { data: existingSubject } = await supabase
        .from('subjects')
        .select('id')
        .eq('subject_code', subjectCode)
        .single();

      let subjectId = existingSubject?.id;

      if (!subjectId) {
        const { error: _subErr } = await supabase
          .from('subjects')
          .insert({
            subject_code: subjectCode,
            subject_name: subjectName,
            semester: semester,
            question_count: 0,
            unit_count: 0
          });
        // We select it back to support local mock insert-return behaviors
        const { data: freshSub } = await supabase.from('subjects').select('id').eq('subject_code', subjectCode).single();
        subjectId = freshSub?.id;
      }

      if (!subjectId) throw new Error('Failed to retrieve or create Subject ID');

      // 3. Extract Units
      // Check for Unit details, e.g. "Unit 1"
      let unitNum = 1;
      const unitNumMatch = titleText.match(/Unit\s+(\d+)/i) || mainHeader.match(/Unit\s+(\d+)/i);
      if (unitNumMatch) {
        unitNum = parseInt(unitNumMatch[1], 10);
      }

      const unitName = doc.querySelector('.unit-badge, h2, .sidebar-header')?.textContent?.trim() || `Unit ${unitNum}`;

      // Insert Unit
      const { data: existingUnit } = await supabase
        .from('units')
        .select('id')
        .eq('subject_id', subjectId)
        .eq('unit_number', unitNum)
        .single();

      let unitId = existingUnit?.id;

      if (!unitId) {
        await supabase.from('units').insert({
          subject_id: subjectId,
          unit_name: unitName.substring(0, 100),
          unit_number: unitNum,
          description: `Imported from ${fileName}`,
          question_count: 0,
          estimated_hours: 3
        });
        const { data: freshUnit } = await supabase.from('units').select('id').eq('subject_id', subjectId).eq('unit_number', unitNum).single();
        unitId = freshUnit?.id;
      }

      if (!unitId) throw new Error('Failed to retrieve or create Unit ID');

      // 4. Extract Questions & Answers
      const questions: any[] = [];
      const cards = doc.querySelectorAll('.q-card, .qcard');

      cards.forEach((card, index) => {
        const qNumText = card.querySelector('.q-badge, .q-num, .qnum')?.textContent?.replace(/Q/gi, '').trim() || String(index + 1);
        const qNum = parseInt(qNumText, 10) || (index + 1);
        
        const qTitleText = card.querySelector('.q-title, .q-text, .qcard-head .qscenario')?.textContent?.trim() || '';
        const scenario = card.querySelector('.qscenario, .q-text')?.innerHTML || '';
        const task = card.querySelector('.qask, .q-task')?.innerHTML || '';

        const fullQuestionText = qTitleText || `${scenario} ${task}`.replace(/<[^>]*>/g, '').trim() || 'Imported Question';

        // Extract answers body
        const ansBody = card.querySelector('.q-body, .qcard-body, .q-answer');
        const answerHtml = ansBody ? ansBody.innerHTML.trim() : 'No answer content extracted.';

        // Extract keywords
        const keywords: string[] = [];
        card.querySelectorAll('.tag, .kterm, mark').forEach(tag => {
          const t = tag.textContent?.trim().toLowerCase();
          if (t && t.length > 2 && t.length < 20 && !keywords.includes(t)) {
            keywords.push(t);
          }
        });

        questions.push({
          subject_id: subjectId,
          unit_id: unitId,
          question_number: qNum,
          question_title: fullQuestionText.substring(0, 80) + '...',
          question_text: fullQuestionText,
          answer_html: answerHtml,
          keywords: keywords.slice(0, 6)
        });
      });

      if (questions.length > 0) {
        // Upload questions to Supabase
        await supabase.from('questions').upsert(questions);

        // Update counts
        await supabase.from('units').update({
          question_count: questions.length
        }).eq('id', unitId);

        // Update subject unit count and question count
        const { data: allUnits } = await supabase.from('units').select('question_count').eq('subject_id', subjectId);
        const totalQs = (allUnits || []).reduce((acc: number, curr: any) => acc + (curr.question_count || 0), 0);
        
        await supabase.from('subjects').update({
          unit_count: (allUnits || []).length,
          question_count: totalQs
        }).eq('id', subjectId);

        // Log import log
        await supabase.from('subject_imports').insert({
          subject_name: subjectName,
          file_name: fileName,
          import_status: 'success',
          total_units: 1,
          total_questions: questions.length
        });
      }

      return {
        success: true,
        subjectName,
        subjectCode,
        totalUnits: 1,
        totalQuestions: questions.length
      };
    } catch (e: any) {
      console.error('HTML Import Pipeline failed:', e);
      return {
        success: false,
        subjectName: 'Failed Import',
        subjectCode: 'ERR',
        totalUnits: 0,
        totalQuestions: 0,
        error: e.message || 'Unknown parsing error'
      };
    }
  }
}

export const importService = new ImportService();
