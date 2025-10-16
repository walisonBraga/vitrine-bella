export interface Slide {
  id?: string;
  titulo: string;
  subtitulo: string;
  img: string;
  alt: string;
  ativo: boolean;
  ordem: number;
  dataCriacao?: Date;
  dataAtualizacao?: Date;
}
