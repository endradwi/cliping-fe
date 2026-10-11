<script lang="ts">
  let {
    variant = 'default',
    children
  }: {
    variant?: 'default' | 'success' | 'hot' | 'outline';
    children?: any;
  } = $props();

  const variants = {
    default: 'bg-[#0d1c42] text-[#8fa2cb] border-[#22396f]/40',
    success: 'bg-[#22396f]/25 text-[#fcf1d0] border-[#22396f]/60',
    hot: 'bg-[#22396f]/40 text-[#fcf1d0] border-[#22396f] animate-pulse',
    outline: 'border-[#22396f]/50 text-[#8fa2cb]'
  };
</script>

<span class="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium border {variants[variant]}">
  {@render children?.()}
</span>
