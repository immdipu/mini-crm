'use client';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = ({
  label,
  error,
  fullWidth = false,
  className = '',
  id,
  ...props
}: TextareaProps) => {
  const textareaId = id || Math.random().toString(36).substring(2, 9);
  
  const baseTextareaStyles = 'rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/30 focus:ring-opacity-50';
  const errorTextareaStyles = error ? 'border-danger focus:border-danger focus:ring-danger/30' : '';
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthStyle} ${className}`}>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={`${baseTextareaStyles} ${errorTextareaStyles} ${widthStyle}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};
