// Tempos (em ms) das animações e "processamentos" do app.
// Ajuste aqui para deixar o fluxo mais lento ou mais rápido.
export const TIMING = {
  // Tela "Verificando..." exibida entre uma seção e a próxima do cadastro.
  stepTransition: 5000,
  // Tela 7: "Enviando seus dados..." até o cadastro ser aprovado.
  processingData: 13000,
  // Pausa na tela "Cadastro aprovado" antes de liberar o botão.
  approvedReveal: 2500,
  // Tela "Vamos abrir a sua conta agora..." depois dos documentos.
  accountOpening: 12000,
  // Análise de legibilidade de cada foto do documento.
  documentAnalysis: 6000,
  // Intervalo entre mensagens ao gerar a chave Pix (5 mensagens ≈ 10s).
  pixKeyMessage: 2000,
  // Intervalo entre mensagens ao processar o levantamento.
  withdrawMessage: 2200,
  // Pausa final antes de mostrar o recibo/chave criada.
  successHold: 1200,
} as const
