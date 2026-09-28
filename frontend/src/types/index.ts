export interface Usuario {
  id: string;
  login: string;
  email?: string;
  nomeCompleto: string;
  nomeGuerra: string;
  posto?: string;
  unidade?: string;
  permissao: string;
}

export interface Equipamento {
  id: string;
  numSerie: string;
  idRadio?: string;
  rp?: string;
  marca?: string;
  modelo?: string;
  status: string;
  tipo: string;
  unidadeId?: string;
  pae?: string;
  problema?: string;
  solicitante?: string;
  analiseTecnica?: string;
  laudoTecnico?: string;
  tecnicoResp?: string;
  dataEntradaLaudo?: string | Date;
  dataSaidaLaudo?: string | Date;
}

export interface Manutencao {
  id: string;
  numeroSequencial?: number;
  equipamentoId: string;
  problema: string;
  dataEntrada: string | Date;
  dataChegadaDitel?: string | Date;
  dataSaidaEmpresa?: string | Date;
  previsaoRetorno?: string | Date;
  dataEnvioUnidade?: string | Date;
  dataConclusao?: string | Date;
  status: string;
  tipoManutencao: string;
  documentoOrigem?: string;
  documentoSaidaEmpresa?: string;
  documentoEntregaUnidade?: string;
  pae?: string;
  equipamento?: Equipamento;
}

export interface Cautela {
  id: string;
  numeroSequencial?: number;
  dataRetirada: string | Date;
  dataPrevista?: string | Date;
  dataDevolucao?: string | Date;
  recebedorNome?: string;
  recebedorGuerra?: string;
  recebedorPosto?: string;
  recebedorRgPM?: string;
  recebedorContato?: string;
  recebedorUnidade?: string;
  observacao?: string;
  status: string;
  tipoCautela: string;
  equipamentos?: Equipamento[];
}

export interface Unidade {
  id: string;
  nome: string;
  sigla?: string;
  coint?: string;
}

export interface Transferencia {
  id: string;
  unidadeOrigemId?: string;
  unidadeDestinoId: string;
  dataTransferencia: string | Date;
  observacoes?: string;
  qtdRadios: number;
  status: string;
  equipamentos?: Equipamento[];
  unidadeOrigem?: Unidade;
  unidadeDestino?: Unidade;
}

export interface Extravio {
  id: string;
  equipamentoId: string;
  militarId?: string;
  dataExtravio: string | Date;
  boNumero?: string;
  local?: string;
  descricao: string;
  status: string;
  militarResponsavelNome?: string;
  militarResponsavelGuerra?: string;
  militarResponsavelRg?: string;
  militarResponsavelPatente?: string;
  militarResponsavelContato?: string;
  unidadeId?: string;
  equipamento?: Equipamento;
  unidade?: Unidade;
}

export interface Vtr {
  id: string;
  osNumero?: number;
  pae?: string;
  dataServico: string | Date;
  unidadeId?: string;
  solicitante?: string;
  tecnico?: string;
  placaVrt?: string;
  prefixo?: string;
  kmVrt?: number;
  modeloRadio?: string;
  numSerieRadio?: string;
  defeitoReclamado?: string;
  defeitoConstatado?: string;
  solucao?: string;
  status: string;
  servicos?: string[];
  unidade?: Unidade;
}

export interface AxiosErrorResponse {
  response?: {
    data?: {
      error?: string;
    };
  };
}
