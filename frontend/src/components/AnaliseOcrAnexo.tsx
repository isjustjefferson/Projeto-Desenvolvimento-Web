import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { get, mensagemDeErro, post } from '../api/client';

const respostaOcr = z.object({
  habilitado: z.boolean(),
  trabalho: z.object({
    id: z.number(),
    estado: z.enum(['PENDENTE', 'PROCESSANDO', 'CONCLUIDO', 'FALHOU']),
    resultado: z.object({
      itens: z.array(z.object({
        descricao: z.string(),
        quantidade: z.string().nullish(),
        unitario: z.string().nullish(),
        valor: z.string().nullish(),
      })),
      texto: z.string(),
    }).nullable(),
  }).nullable(),
});

interface Props {
  chamadoId: number;
  despesaId: number;
  anexoId: number;
}

export function AnaliseOcrAnexo({ chamadoId, despesaId, anexoId }: Props) {
  const [aberto, setAberto] = useState(false);
  const client = useQueryClient();
  const caminho = `/chamados/${chamadoId}/despesas/${despesaId}/anexos/${anexoId}/ocr`;
  const queryKey = ['ocr-anexo', chamadoId, despesaId, anexoId];
  const consulta = useQuery({
    queryKey,
    enabled: aberto,
    queryFn: () => get(caminho, respostaOcr),
    refetchInterval: (query) => {
      const estado = query.state.data?.trabalho?.estado;
      return estado === 'PENDENTE' || estado === 'PROCESSANDO' ? 5000 : false;
    },
  });
  const solicitar = useMutation({
    mutationFn: () => post(caminho, undefined, respostaOcr),
    onSuccess: (resposta) => client.setQueryData(queryKey, resposta),
  });
  const trabalho = consulta.data?.trabalho;
  const itens = trabalho?.resultado?.itens ?? [];

  return (
    <div className="basis-full">
      <button
        type="button"
        className="font-medium text-brand-700 hover:underline"
        aria-expanded={aberto}
        onClick={() => setAberto((valor) => !valor)}
      >
        OCR no computador
      </button>
      {aberto && (
        <div className="mt-1 space-y-1">
          {consulta.isPending && <p role="status">Consultando análise…</p>}
          {consulta.isError && <p role="alert">{mensagemDeErro(consulta.error, 'Não foi possível consultar a análise.')}</p>}
          {consulta.data?.habilitado === false && <p>O worker de OCR ainda está desativado na API.</p>}
          {consulta.data?.habilitado && (!trabalho || trabalho.estado === 'FALHOU') && (
            <button
              type="button"
              className="font-medium text-brand-700 hover:underline"
              disabled={solicitar.isPending}
              onClick={() => solicitar.mutate()}
            >
              {trabalho ? 'Tentar OCR novamente' : 'Enviar imagem para análise'}
            </button>
          )}
          {solicitar.isError && <p role="alert">{mensagemDeErro(solicitar.error, 'Não foi possível solicitar o OCR.')}</p>}
          {trabalho?.estado === 'PENDENTE' && <p role="status">Aguardando o worker.</p>}
          {trabalho?.estado === 'PROCESSANDO' && <p role="status">Imagem em análise.</p>}
          {trabalho?.estado === 'FALHOU' && <p role="status">A análise falhou. Você pode tentar novamente ou continuar manualmente.</p>}
          {trabalho?.estado === 'CONCLUIDO' && (
            <div>
              {itens.length > 0 ? (
                <>
                  <p className="font-medium">Itens sugeridos para conferência</p>
                  <ul className="ml-4 list-disc">
                    {itens.map((item, indice) => (
                      <li key={indice}>
                        {item.descricao}
                        {item.quantidade && ` · Qtd. ${item.quantidade}`}
                        {item.unitario && ` · Unit. ${item.unitario}`}
                        {item.valor && ` · Valor ${item.valor}`}
                      </li>
                    ))}
                  </ul>
                </>
              ) : <p>A análise terminou sem identificar itens estruturados.</p>}
              {trabalho.resultado?.texto && (
                <details className="mt-1">
                  <summary>Texto reconhecido</summary>
                  <pre className="whitespace-pre-wrap break-words">{trabalho.resultado.texto}</pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
