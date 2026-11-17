import {
  registerDecorator,
  type ValidationOptions,
} from 'class-validator';

const FORMATO_DOCUMENTO = /^[\d.\-/\s]*$/;

function validarCpf(digitos: string): boolean {
  if (digitos.length !== 11 || /^(\d)\1{10}$/.test(digitos)) return false;

  const calcularDigito = (posicao: number) => {
    let soma = 0;
    for (let i = 0; i < posicao; i += 1) {
      soma += Number(digitos[i]) * (posicao + 1 - i);
    }
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return (
    calcularDigito(9) === Number(digitos[9]) &&
    calcularDigito(10) === Number(digitos[10])
  );
}

function validarCnpj(digitos: string): boolean {
  if (digitos.length !== 14 || /^(\d)\1{13}$/.test(digitos)) return false;

  const calcularDigito = (pesos: number[]) => {
    const soma = pesos.reduce(
      (total, peso, i) => total + Number(digitos[i]) * peso,
      0,
    );
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  return (
    calcularDigito([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) ===
      Number(digitos[12]) &&
    calcularDigito([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) ===
      Number(digitos[13])
  );
}

export function validarCpfCnpj(texto: string): boolean {
  if (!FORMATO_DOCUMENTO.test(texto)) return false;
  const digitos = texto.replace(/\D/g, '');
  if (digitos.length === 11) return validarCpf(digitos);
  if (digitos.length === 14) return validarCnpj(digitos);
  return false;
}

export function IsDocumentoValido(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isDocumentoValido',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value === undefined || value === null) return true;
          if (typeof value !== 'string') return false;
          if (value.trim() === '') return true;
          return validarCpfCnpj(value);
        },
        defaultMessage() {
          return 'CPF/CNPJ inválido.';
        },
      },
    });
  };
}
