// Ödüllü reklam katmanı. Şimdilik SAHTE (mock): reklam göstermeden ödül verir.
// Gerçek entegrasyon: @capacitor-community/admob → showRewarded() burada değişecek, oyun kodu değişmeyecek.

export const Ads = {
  isMock: true,
  async showRewarded(): Promise<boolean> {
    console.info('[Ads] mock rewarded ad -> ödül verildi');
    await new Promise((r) => setTimeout(r, 500));
    return true;
  }
};
