export default function MetroButton({
  children,
  onClick,
  disabled = false,
  type = 'button',
  variant = 'primary', // 'primary', 'secondary', 'success', 'danger', 'warning'
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
  ...props
}) {
  const baseClasses = 'font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-[var(--color-marinho-itau)] text-white hover:opacity-80 transition-opacity',
    secondary: 'bg-white border-2 border-[var(--color-laranja-itau)] text-[var(--color-laranja-itau)] hover:opacity-80 transition-opacity dark:border-[var(--color-laranja-itau)]',
    success: 'bg-green-600 text-white hover:opacity-80 transition-opacity',
    danger: 'bg-red-600 text-white hover:opacity-80 transition-opacity',
    warning: 'bg-[var(--color-laranja-itau)] text-white hover:opacity-80 transition-opacity',
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
