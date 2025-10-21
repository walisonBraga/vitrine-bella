import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface FreteRequest {
  cepOrigem: string;
  cepDestino: string;
  peso: number; // em gramas
  comprimento: number; // em cm
  largura: number; // em cm
  altura: number; // em cm
  valor: number; // valor da mercadoria
}

export interface FreteOption {
  transportadora: string;
  servico: string;
  prazo: number; // dias
  preco: number;
  erro?: string;
}

export interface FreteResponse {
  cepOrigem: string;
  cepDestino: string;
  opcoes: FreteOption[];
}

@Injectable({
  providedIn: 'root'
})
export class FreteService {
  private readonly CORREIOS_API = 'https://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx';
  private readonly MELHOR_ENVIO_API = 'https://melhorenvio.com.br/api/v2/me/shipment/calculate';

  constructor(private http: HttpClient) {}

  // Calcular frete usando múltiplas APIs
  calcularFrete(request: FreteRequest): Observable<FreteResponse> {
    return forkJoin({
      correios: this.calcularFreteCorreios(request).pipe(
        catchError(error => {
          console.error('Erro Correios:', error);
          return of({ opcoes: [] });
        })
      ),
      melhorEnvio: this.calcularFreteMelhorEnvio(request).pipe(
        catchError(error => {
          console.error('Erro Melhor Envio:', error);
          return of({ opcoes: [] });
        })
      )
    }).pipe(
      map(result => ({
        cepOrigem: request.cepOrigem,
        cepDestino: request.cepDestino,
        opcoes: [
          ...result.correios.opcoes,
          ...result.melhorEnvio.opcoes
        ].sort((a, b) => a.preco - b.preco) // Ordenar por preço
      }))
    );
  }

  // Calcular frete usando API dos Correios
  private calcularFreteCorreios(request: FreteRequest): Observable<FreteResponse> {
    const params = new URLSearchParams({
      nCdEmpresa: '',
      sDsSenha: '',
      nCdServico: '04014,04510,04782', // PAC, SEDEX, SEDEX 10
      sCepOrigem: request.cepOrigem,
      sCepDestino: request.cepDestino,
      nVlPeso: (request.peso / 1000).toString(), // µg para kg
      nCdFormato: '1',
      nVlComprimento: request.comprimento.toString(),
      nVlAltura: request.altura.toString(),
      nVlLargura: request.largura.toString(),
      nVlDiametro: '0',
      sCdMaoPropria: 'N',
      nVlValorDeclarado: request.valor.toString(),
      sCdAvisoRecebimento: 'N',
      StrRetorno: 'xml'
    });

    return this.http.get(`${this.CORREIOS_API}?${params}`, { responseType: 'text' }).pipe(
      map(xmlResponse => this.parseCorreiosResponse(xmlResponse, request))
    );
  }

  // Calcular frete usando Melhor Envio (simulado)
  private calcularFreteMelhorEnvio(request: FreteRequest): Observable<FreteResponse> {
    // Simulação da API Melhor Envio
    const opcoes: FreteOption[] = [
      {
        transportadora: 'Melhor Envio',
        servico: 'Economia',
        prazo: 7,
        preco: this.calcularPrecoBase(request) * 0.8
      },
      {
        transportadora: 'Melhor Envio',
        servico: 'Expresso',
        prazo: 3,
        preco: this.calcularPrecoBase(request) * 1.2
      }
    ];

    return of({
      cepOrigem: request.cepOrigem,
      cepDestino: request.cepDestino,
      opcoes
    });
  }

  // Calcular preço base baseado em distância e peso
  private calcularPrecoBase(request: FreteRequest): number {
    const pesoKg = request.peso / 1000;
    const volume = (request.comprimento * request.largura * request.altura) / 1000000; // m³
    
    // Preço base por kg + taxa por volume
    return (pesoKg * 8) + (volume * 15);
  }

  // Parsear resposta XML dos Correios
  private parseCorreiosResponse(xmlResponse: string, request: FreteRequest): FreteResponse {
    const opcoes: FreteOption[] = [];
    
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlResponse, 'text/xml');
      const servicos = xmlDoc.getElementsByTagName('cServico');

      for (let i = 0; i < servicos.length; i++) {
        const servico = servicos[i];
        const codigo = servico.getElementsByTagName('Codigo')[0]?.textContent || '';
        const nome = this.getNomeServico(codigo);
        const prazo = parseInt(servico.getElementsByTagName('PrazoEntrega')[0]?.textContent || '0');
        const preco = parseFloat(servico.getElementsByTagName('Valor')[0]?.textContent?.replace(',', '.') || '0');
        const erro = servico.getElementsByTagName('Erro')[0]?.textContent;

        if (!erro && preco > 0) {
          opcoes.push({
            transportadora: 'Correios',
            servico: nome,
            prazo,
            preco
          });
        }
      }
    } catch (error) {
      console.error('Erro ao parsear resposta dos Correios:', error);
    }

    return {
      cepOrigem: request.cepOrigem,
      cepDestino: request.cepDestino,
      opcoes
    };
  }

  // Mapear códigos dos serviços dos Correios
  private getNomeServico(codigo: string): string {
    const servicos: { [key: string]: string } = {
      '04014': 'SEDEX',
      '04510': 'PAC',
      '04782': 'SEDEX 10',
      '04790': 'SEDEX 12',
      '04804': 'SEDEX Hoje'
    };
    return servicos[codigo] || `Serviço ${codigo}`;
  }

  // Buscar CEP para obter coordenadas (para cálculo de distância)
  buscarCep(cep: string): Observable<any> {
    const cepLimpo = cep.replace(/\D/g, '');
    return this.http.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
  }

  // Calcular distância entre CEPs (simulado)
  calcularDistancia(cepOrigem: string, cepDestino: string): Observable<number> {
    // Simulação - em produção usar API de geolocalização
    const distancia = Math.floor(Math.random() * 2000) + 100; // 100-2100 km
    return of(distancia);
  }

  // Gerar opções de frete baseadas em regras de negócio
  gerarOpcoesFrete(request: FreteRequest): FreteOption[] {
    const basePrice = this.calcularPrecoBase(request);
    
    return [
      {
        transportadora: 'Vitrine Bella',
        servico: 'Entrega Econômica',
        prazo: 7,
        preco: basePrice * 0.7
      },
      {
        transportadora: 'Vitrine Bella',
        servico: 'Entrega Padrão',
        prazo: 5,
        preco: basePrice * 1.0
      },
      {
        transportadora: 'Vitrine Bella',
        servico: 'Entrega Expressa',
        prazo: 2,
        preco: basePrice * 1.5
      }
    ];
  }
}
