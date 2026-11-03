import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { dataLocalIso } from '../helpers';
import { FormularioDespesa } from './FormularioDespesa';

const semNbsp = (s: string) => s.replace(/\u00a0/g, ' ');

const onSalvar = vi.fn();

function renderFormulario() {
  render(<FormularioDespesa salvando={false} onSalvar={onSalvar} />);
  return {
    usuario: userEvent.setup(),
    campo: (rotulo: string | RegExp) =>
      screen.getByLabelText<HTMLInputElement>(rotulo),
    salvar: () => screen.getByRole('button', { name: /Salvar despesa/ }),
  };
}

beforeEach(() => {
  onSalvar.mockReset();
});

describe('FormularioDespesa — campos', () => {
  it('formata o valor em R$ enquanto digita', async () => {
    const { usuario, campo } = renderFormulario();
    await usuario.type(campo('Valor (R$)'), '15000');
    expect(semNbsp(campo('Valor (R$)').value)).toBe('R$ 150,00');
    expect(campo('Valor (R$)')).toHaveAttribute('inputmode', 'numeric');
  });

  it('nº da nota e série aceitam só dígitos, com teclado numérico', async () => {
    const { usuario, campo } = renderFormulario();
    await usuario.type(campo('Nº da nota'), '12a3-4');
    await usuario.type(campo('Série'), '12345');
    expect(campo('Nº da nota').value).toBe('1234');
    expect(campo('Série').value).toBe('123');
    expect(campo('Nº da nota')).toHaveAttribute('inputmode', 'numeric');
  });

  it('aplica a máscara de CPF ou CNPJ conforme a quantidade de dígitos', async () => {
    const { usuario, campo } = renderFormulario();
    await usuario.type(campo('CPF/CNPJ do fornecedor'), '12345678901');
    expect(campo('CPF/CNPJ do fornecedor').value).toBe('123.456.789-01');
    await usuario.type(campo('CPF/CNPJ do fornecedor'), '234');
    expect(campo('CPF/CNPJ do fornecedor').value).toBe('12.345.678/9012-34');
  });

  it('não permite data de emissão futura', () => {
    const { campo } = renderFormulario();
    expect(campo('Data de emissão')).toHaveAttribute('max', dataLocalIso());
  });

  it('todo campo de texto tem placeholder', () => {
    renderFormulario();
    const campos = [
      ...document.querySelectorAll(
        'input:not([type="file"]):not([type="date"]), textarea',
      ),
    ];
    expect(campos.length).toBeGreaterThan(0);
    for (const c of campos) expect(c).toHaveAttribute('placeholder');
  });

  it('mostra a chave de acesso só para NF-e e NFC-e', async () => {
    const { usuario, campo } = renderFormulario();
    expect(screen.queryByLabelText(/Chave de acesso/)).not.toBeInTheDocument();

    await usuario.selectOptions(
      campo('Tipo de documento fiscal (opcional)'),
      'NFE',
    );
    await usuario.type(campo(/Chave de acesso/), '12345678');
    expect(campo(/Chave de acesso/).value).toBe('1234 5678');

    await usuario.selectOptions(
      campo('Tipo de documento fiscal (opcional)'),
      'RECIBO',
    );
    expect(screen.queryByLabelText(/Chave de acesso/)).not.toBeInTheDocument();
  });
});

describe('FormularioDespesa — salvar', () => {
  it('fica desabilitado sem descrição ou sem valor', async () => {
    const { usuario, campo, salvar } = renderFormulario();
    expect(salvar()).toBeDisabled();
    await usuario.type(campo('Descrição'), 'Compra de fios');
    expect(salvar()).toBeDisabled();
    await usuario.type(campo('Valor (R$)'), '1');
    expect(salvar()).toBeEnabled();
  });

  it('envia todos os campos preenchidos no formato da API', async () => {
    const { usuario, campo, salvar } = renderFormulario();
    await usuario.selectOptions(campo('Categoria'), 'MAO_DE_OBRA');
    await usuario.type(campo('Descrição'), '  Troca do disjuntor  ');
    await usuario.type(campo('Valor (R$)'), '25050');
    await usuario.type(campo('Fornecedor'), 'Casa das Ferragens');
    await usuario.type(campo('CPF/CNPJ do fornecedor'), '12345678000190');
    await usuario.type(campo('Nº da nota'), '4567');
    await usuario.type(campo('Série'), '1');
    fireEvent.change(campo('Data de emissão'), {
      target: { value: '2026-01-10' },
    });
    await usuario.selectOptions(campo('Forma de pagamento'), 'PIX');
    await usuario.selectOptions(campo('Pago por'), 'EMPRESA');
    await usuario.click(salvar());

    expect(onSalvar).toHaveBeenCalledWith({
      categoria: 'MAO_DE_OBRA',
      descricao: 'Troca do disjuntor',
      valorCentavos: 25050,
      fornecedor: 'Casa das Ferragens',
      cnpj: '12.345.678/0001-90',
      numeroNota: '4567',
      serie: '1',
      dataEmissao: '2026-01-10',
      formaPagamento: 'PIX',
      pagoPor: 'EMPRESA',
      anexos: [],
    });
  });

  it('omite os campos opcionais deixados em branco', async () => {
    const { usuario, campo, salvar } = renderFormulario();
    await usuario.type(campo('Descrição'), 'Parafusos');
    await usuario.type(campo('Valor (R$)'), '990');
    await usuario.click(salvar());

    expect(onSalvar).toHaveBeenCalledWith({
      categoria: 'MATERIAL',
      descricao: 'Parafusos',
      valorCentavos: 990,
      fornecedor: undefined,
      cnpj: undefined,
      numeroNota: undefined,
      serie: undefined,
      dataEmissao: undefined,
      formaPagamento: undefined,
      pagoPor: undefined,
      anexos: [],
    });
  });

  it('bloqueia CPF/CNPJ incompleto', async () => {
    const { usuario, campo, salvar } = renderFormulario();
    await usuario.type(campo('Descrição'), 'Tinta');
    await usuario.type(campo('Valor (R$)'), '5000');
    await usuario.type(campo('CPF/CNPJ do fornecedor'), '12345');
    await usuario.click(salvar());

    expect(screen.getByRole('alert')).toHaveTextContent(
      /CPF \(11 dígitos\) ou CNPJ \(14 dígitos\)/,
    );
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('bloqueia data de emissão futura digitada à mão', async () => {
    const { usuario, campo, salvar } = renderFormulario();
    await usuario.type(campo('Descrição'), 'Tinta');
    await usuario.type(campo('Valor (R$)'), '5000');
    fireEvent.change(campo('Data de emissão'), {
      target: { value: '2999-01-01' },
    });
    await usuario.click(salvar());

    expect(screen.getByRole('alert')).toHaveTextContent(
      /não pode ser no futuro/,
    );
    expect(onSalvar).not.toHaveBeenCalled();
  });

  it('exige chave com 44 dígitos e um anexo, e envia a chave no anexo', async () => {
    const { usuario, campo, salvar } = renderFormulario();
    await usuario.type(campo('Descrição'), 'Fios');
    await usuario.type(campo('Valor (R$)'), '5000');
    await usuario.selectOptions(
      campo('Tipo de documento fiscal (opcional)'),
      'NFE',
    );

    await usuario.type(campo(/Chave de acesso/), '1234');
    await usuario.click(salvar());
    expect(screen.getByRole('alert')).toHaveTextContent(/44 dígitos/);

    await usuario.clear(campo(/Chave de acesso/));
    await usuario.type(campo(/Chave de acesso/), '3'.repeat(44));
    await usuario.click(salvar());
    expect(screen.getByRole('alert')).toHaveTextContent(/Anexe a nota/);
    expect(onSalvar).not.toHaveBeenCalled();

    const pdf = new File(['%PDF'], 'nota.pdf', { type: 'application/pdf' });
    await usuario.upload(screen.getByLabelText(/Adicionar arquivo/), pdf);
    await screen.findByText('nota.pdf');
    await usuario.click(salvar());

    const enviado = onSalvar.mock.calls[0][0];
    expect(enviado.anexos).toHaveLength(1);
    expect(enviado.anexos[0]).toMatchObject({
      tipo: 'NOTA_FISCAL',
      tipoDocumentoFiscal: 'NFE',
      chaveNFe: '3'.repeat(44),
      nomeArquivo: 'nota.pdf',
      mimeType: 'application/pdf',
    });
  });
});
