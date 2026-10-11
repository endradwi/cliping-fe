<script lang="ts">
  import { settingsStore } from '../stores/settings.svelte';
  import { saveByokSettings, API_BASE } from '../services/api.client';
  import Button from '../components/ui/Button.svelte';
  import { X, Check, KeyRound, Cookie } from 'lucide-svelte';

  let savedNotice = $state(false);
  let cookiesInput = $state('');
  let cookiesSaved = $state(false);

  async function handleSave() {
    await saveByokSettings({
      aiBaseUrl: settingsStore.aiBaseUrl,
      aiApiKey: settingsStore.aiApiKey,
      aiModel: settingsStore.aiModel,
      groqApiKey: settingsStore.groqApiKey
    });
    savedNotice = true;
    setTimeout(() => {
      savedNotice = false;
      settingsStore.isOpen = false;
    }, 1200);
  }

  async function handleSaveCookies() {
    if (!cookiesInput.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/api/v1/cookies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cookies: cookiesInput })
      });
      if (res.ok) {
        cookiesSaved = true;
        setTimeout(() => cookiesSaved = false, 2000);
      }
    } catch {}
  }
</script>

{#if settingsStore.isOpen}
  <div class="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
    <div class="w-full max-w-lg bg-[#2D0000] border border-[#757D6F]/40 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-4 border-b border-[#757D6F]/30">
        <div class="flex items-center gap-2">
          <KeyRound size={20} class="text-[#EEEAD7]" />
          <h3 class="font-bold text-base text-[#EEEAD7]">Clipping Settings</h3>
        </div>
        <button type="button" onclick={() => settingsStore.isOpen = false} class="text-[#757D6F] hover:text-[#EEEAD7]">
          <X size={18} />
        </button>
      </div>

      <div class="space-y-4 my-5 text-xs">
        <!-- Anti-Bot Cookies -->
        <div class="p-3 bg-[#150000] border border-[#757D6F]/40 rounded-xl">
          <div class="flex items-center gap-2 mb-1.5 text-[#EEEAD7] font-semibold">
            <Cookie size={16} class="text-amber-400" />
            <span>YouTube Cookies (Anti-Bot Bypass)</span>
          </div>
          <p class="text-[11px] text-[#A9B3A1] mb-2 leading-relaxed">
            If YouTube blocks datacenter server IPs with "Sign in to confirm you're not a bot", paste your exported Netscape <code>cookies.txt</code> below:
          </p>
          <textarea
            bind:value={cookiesInput}
            rows={3}
            placeholder="# Netscape HTTP Cookie File&#10;.youtube.com TRUE / TRUE 1799999999 ..."
            class="w-full bg-[#2D0000] border border-[#757D6F]/40 rounded-lg p-2 text-[11px] text-[#EEEAD7] font-mono focus:border-[#6D0808] focus:outline-none mb-2"
          ></textarea>
          <Button variant="secondary" size="sm" onclick={handleSaveCookies}>
            {#if cookiesSaved}
              <Check size={14} />
              <span>Cookies Saved!</span>
            {:else}
              <span>Save Cookies</span>
            {/if}
          </Button>
        </div>

        <div>
          <label for="ai-base-url" class="block text-[#A9B3A1] font-mono mb-1">AI Router Base URL</label>
          <input
            id="ai-base-url"
            type="text"
            bind:value={settingsStore.aiBaseUrl}
            class="w-full bg-[#150000] border border-[#757D6F]/40 rounded-lg px-3 py-2 text-[#EEEAD7] font-mono focus:border-[#6D0808] focus:outline-none"
          />
        </div>

        <div>
          <label for="ai-api-key" class="block text-[#A9B3A1] font-mono mb-1">AI Router API Key</label>
          <input
            id="ai-api-key"
            type="password"
            bind:value={settingsStore.aiApiKey}
            class="w-full bg-[#150000] border border-[#757D6F]/40 rounded-lg px-3 py-2 text-[#EEEAD7] font-mono focus:border-[#6D0808] focus:outline-none"
          />
        </div>

        <div>
          <label for="ai-chat-model" class="block text-[#A9B3A1] font-mono mb-1">Primary Chat Model</label>
          <input
            id="ai-chat-model"
            type="text"
            bind:value={settingsStore.aiModel}
            class="w-full bg-[#150000] border border-[#757D6F]/40 rounded-lg px-3 py-2 text-[#EEEAD7] font-mono focus:border-[#6D0808] focus:outline-none"
          />
        </div>

        <div>
          <label for="groq-api-key" class="block text-[#A9B3A1] font-mono mb-1">Groq Whisper API Key (LPU Fallback)</label>
          <input
            id="groq-api-key"
            type="password"
            bind:value={settingsStore.groqApiKey}
            placeholder="gsk_..."
            class="w-full bg-[#150000] border border-[#757D6F]/40 rounded-lg px-3 py-2 text-[#EEEAD7] font-mono focus:border-[#6D0808] focus:outline-none"
          />
        </div>

        <p class="text-[11px] text-[#A9B3A1] font-sans">
          🔒 Credential saved into secure, encrypted <code>HttpOnly</code> cookie.
        </p>
      </div>

      <div class="flex items-center justify-end gap-3 pt-3 border-t border-[#757D6F]/30">
        <Button variant="ghost" onclick={() => settingsStore.isOpen = false}>Cancel</Button>
        <Button variant="primary" onclick={handleSave}>
          {#if savedNotice}
            <Check size={16} />
            <span>Saved!</span>
          {:else}
            <span>Save Credentials</span>
          {/if}
        </Button>
      </div>
    </div>
  </div>
{/if}
