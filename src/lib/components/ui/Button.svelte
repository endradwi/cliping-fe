<script lang="ts">
  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    type = 'button',
    onclick,
    children,
    class: customClass = ''
  }: {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onclick?: () => void;
    children?: any;
    class?: string;
  } = $props();

  const variantClasses = {
    primary: 'bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-lg shadow-rose-950/40',
    secondary: 'bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 border border-indigo-800/40',
    ghost: 'hover:bg-slate-800/60 text-slate-300',
    outline: 'border border-slate-700/80 hover:bg-slate-800 text-slate-200',
    danger: 'bg-red-600 hover:bg-red-500 text-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-md',
    md: 'px-4 py-2 text-sm rounded-lg',
    lg: 'px-6 py-3 text-base rounded-xl font-semibold'
  };
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="inline-flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed {variantClasses[variant]} {sizeClasses[size]} {customClass}"
>
  {@render children?.()}
</button>
