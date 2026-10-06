class SettingsStore {
  isOpen = $state<boolean>(false);
  aiBaseUrl = $state<string>('https://router.endra.web.id/v1');
  aiApiKey = $state<string>('sk-9router');
  aiModel = $state<string>('gemini/gemini-3.7-flash');
  groqApiKey = $state<string>('');

  toggle() {
    this.isOpen = !this.isOpen;
  }
}

export const settingsStore = new SettingsStore();
