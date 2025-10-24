import React from 'react';

interface ExampleComponentProps {
  title: string;
  description?: string;
}

const ExampleComponent: React.FC<ExampleComponentProps> = ({ title, description }) => {
  return (
    <div className="p-4 border rounded shadow">
      <h2 className="text-xl font-bold">{title}</h2>
      {description && <p className="mt-2 text-gray-600">{description}</p>}
    </div>
  );
};

export default ExampleComponent;