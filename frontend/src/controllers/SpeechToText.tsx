export const speakAntrian = (nomor: string, nama: string, tujuan: string) => {
  const kalimat = `Nomor antrian ${nomor}, atas nama ${nama}, silahkan menuju ${tujuan}`;
  const utterance = new SpeechSynthesisUtterance(kalimat);

  // Optional: Setting voice dan rate
  utterance.lang = 'id-ID';
  utterance.rate = 1; // 1 = normal speed
  utterance.pitch = 1;
  
  // Jalankan suara
  window.speechSynthesis.cancel(); // Stop yang sedang jalan
  window.speechSynthesis.speak(utterance);
};
