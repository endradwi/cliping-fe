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
    primary: 'bg-[#22396f] hover:bg-[#22396f] text-[#fcf1d0] font-semibold shadow-lg shadow-black/60 border border-[#22396f]/40',
    secondary: 'bg-[#22396f]/20 hover:bg-[#22396f]/35 text-[#fcf1d0] border border-[#22396f]/40',
    ghost: 'hover:bg-[#0d1c42] text-[#8fa2cb]',
    outline: 'border border-[#22396f]/50 hover:bg-[#0d1c42] text-[#fcf1d0]',
    danger: 'bg-red-700 hover:bg-red-600 text-[#fcf1d0]'
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
