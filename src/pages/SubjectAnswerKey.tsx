import React from 'react';
import { useParams } from 'react-router-dom';

// Assuming PDF files are placed in the public folder under /pdfs/<subjectId>.pdf
// For Engineering Chemistry (subject-chem) we expect a file public/pdfs/subject-chem.pdf

export const SubjectAnswerKey: React.FC = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const pdfUrl = `/pdfs/${subjectId}.pdf`;

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <h1 className="text-2xl font-bold mb-4 text-primary-600 dark:text-primary-400">
        {subjectId?.replace('-', ' ')} Answer Key
      </h1>
      <iframe
        src={pdfUrl}
        title="Answer Key PDF"
        className="w-full h-[80vh] border rounded-premium shadow-md"
      />
    </div>
  );
};
