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
    primary: 'bg-[#6D0808] hover:bg-[#870E0E] text-[#EEEAD7] font-semibold shadow-lg shadow-black/60 border border-[#870E0E]/40',
    secondary: 'bg-[#757D6F]/20 hover:bg-[#757D6F]/35 text-[#EEEAD7] border border-[#757D6F]/40',
    ghost: 'hover:bg-[#2D0000] text-[#A9B3A1]',
    outline: 'border border-[#757D6F]/50 hover:bg-[#2D0000] text-[#EEEAD7]',
    danger: 'bg-red-700 hover:bg-red-600 text-[#EEEAD7]'
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
