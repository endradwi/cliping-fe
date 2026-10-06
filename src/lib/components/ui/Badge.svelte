<script lang="ts">
  let {
    variant = 'default',
    children
  }: {
    variant?: 'default' | 'success' | 'hot' | 'outline';
    children?: any;
  } = $props();

  const variants = {
    default: 'bg-slate-800/80 text-slate-300 border-slate-700/50',
    success: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
    hot: 'bg-rose-950/80 text-rose-300 border-rose-800/60 animate-pulse',
    outline: 'border-slate-800 text-slate-400'
  };
</script>

<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border {variants[variant]}">
  {@render children?.()}
</span>
