'use client';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = ({
  label,
  error,
  fullWidth = false,
  className = '',
  id,
  ...props
}: InputProps) => {
  const inputId = id || Math.random().toString(36).substring(2, 9);
  
  const baseInputStyles = 'rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary/30 focus:ring-opacity-50';
  const errorInputStyles = error ? 'border-danger focus:border-danger focus:ring-danger/30' : '';
  const widthStyle = fullWidth ? 'w-full' : '';

  return (
    <div className={`${widthStyle} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`${baseInputStyles} ${errorInputStyles} ${widthStyle}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
};
