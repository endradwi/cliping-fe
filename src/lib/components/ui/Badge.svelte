<script lang="ts">
  let {
    variant = 'default',
    children
  }: {
    variant?: 'default' | 'success' | 'hot' | 'outline';
    children?: any;
  } = $props();

  const variants = {
    default: 'bg-[#2D0000] text-[#A9B3A1] border-[#757D6F]/40',
    success: 'bg-[#757D6F]/25 text-[#EEEAD7] border-[#757D6F]/60',
    hot: 'bg-[#6D0808]/40 text-[#EEEAD7] border-[#6D0808] animate-pulse',
    outline: 'border-[#757D6F]/50 text-[#A9B3A1]'
  };
</script>

<span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border {variants[variant]}">
  {@render children?.()}
</span>
