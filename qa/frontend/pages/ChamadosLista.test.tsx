import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type {
  Categoria,
  Chamado,
  Status,
  Usuario,
} from "../../../frontend/src/types";
import type { FiltrosChamados } from "../../../frontend/src/api/chamados";
import { ChamadosLista } from "../../../frontend/src/pages/ChamadosLista";

const estado = vi.hoisted(() => ({
  usuario: null as Usuario | null,
  chamados: [] as Chamado[],
}));

vi.mock("../../../frontend/src/context/AuthContext", () => ({
  useAuth: () => ({ usuario: estado.usuario }),
}));

vi.mock("../../../frontend/src/hooks/useChamados", () => ({
  useChamados: (filtros: FiltrosChamados = {}) => {
    const filtrados = estado.chamados
      .filter((c) => !filtros.status || c.status === filtros.status)
      .filter((c) => !filtros.categoria || c.categoria === filtros.categoria)
      .filter((c) => {
        if (!filtros.q) return true;
        const termo = filtros.q.toLowerCase();
        return (
          c.titulo.toLowerCase().includes(termo) ||
          c.descricao.toLowerCase().includes(termo)
        );
      })
      .slice()
      .sort((a, b) => {
        const diff =
          new Date(a.criadoEm).getTime() - new Date(b.criadoEm).getTime();
        return filtros.ordem === "desc" ? -diff : diff;
      });
    const limite = filtros.limite ?? 6;
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / limite));
    const pagina = Math.min(Math.max(1, filtros.pagina ?? 1), totalPaginas);
    const inicio = (pagina - 1) * limite;
    return {
      data: {
        chamados: filtrados.slice(inicio, inicio + limite),
        paginacao: {
          pagina,
          limite,
          total: filtrados.length,
          totalPaginas,
        },
      },
      isPending: false,
      error: null,
    };
  },
}));

vi.mock("../../../frontend/src/hooks/useUsuarios", () => ({
  useDiretorio: () => ({
    usuarios: [],
    nomeUsuario: (id: number) => `Usuário ${id}`,
  }),
}));

function criarChamado(
  id: number,
  status: Status = "EM_ANDAMENTO",
  categoria: Categoria = "ELETRICA",
): Chamado {
  const data = new Date(Date.UTC(2026, 0, 1, 0, id)).toISOString();
  return {
    id,
    titulo: `Chamado ${id}`,
    descricao: `Descrição ${id}`,
    categoria,
    local: { predio: "Bloco A" },
    status,
    prioridade: "MEDIA",
    criadoPorId: 1,
    prestadorId: null,
    criadoEm: data,
    atualizadoEm: data,
    historico: [],
  };
}

const sindico: Usuario = {
  id: 5,
  nome: "Ricardo",
  email: "ricardo@predial.com",
  role: "SINDICO",
  ativo: true,
};

function renderLista(url = "/chamados") {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <ChamadosLista />
    </MemoryRouter>,
  );
}

const titulos = () =>
  screen
    .getAllByRole("link", { name: /Chamado \d+/ })
    .map((l) => within(l).getByText(/^Chamado \d+$/).textContent);

// Node 25+ expõe globalThis.localStorage indefinido sem --localstorage-file,
// impedindo o jsdom de sobrescrevê-lo automaticamente no Vitest 3.
if (typeof globalThis.localStorage?.clear !== "function") {
  const dados = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return dados.size;
    },
    clear: () => dados.clear(),
    getItem: (chave) => dados.get(chave) ?? null,
    key: (indice) => [...dados.keys()][indice] ?? null,
    removeItem: (chave) => {
      dados.delete(chave);
    },
    setItem: (chave, valor) => {
      dados.set(chave, String(valor));
    },
  };
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: storage,
  });
}

beforeEach(() => {
  estado.usuario = sindico;
  estado.chamados = [];
  localStorage.clear();
});

describe("ChamadosLista — paginação", () => {
  it("mostra 6 chamados por página e navega entre as páginas", async () => {
    const usuario = userEvent.setup();
    estado.chamados = Array.from({ length: 10 }, (_, i) => criarChamado(i + 1));
    renderLista();

    expect(titulos()).toHaveLength(6);
    expect(titulos()[0]).toBe("Chamado 10");
    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Anterior/ })).toBeDisabled();

    await usuario.click(screen.getByRole("button", { name: /Próxima/ }));

    expect(titulos()).toEqual([
      "Chamado 4",
      "Chamado 3",
      "Chamado 2",
      "Chamado 1",
    ]);
    expect(screen.getByText(/Página 2 de 2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Próxima/ })).toBeDisabled();
  });

  it("volta para a primeira página ao filtrar", async () => {
    const usuario = userEvent.setup();
    estado.chamados = Array.from({ length: 10 }, (_, i) => criarChamado(i + 1));
    renderLista();

    await usuario.click(screen.getByRole("button", { name: /Próxima/ }));
    expect(screen.getByText(/Página 2 de 2/)).toBeInTheDocument();

    // A busca casa com todos: continua havendo 2 páginas, mas volta para a 1ª
    await usuario.type(screen.getByPlaceholderText(/Buscar/), "Descrição");

    expect(screen.getByText(/Página 1 de 2/)).toBeInTheDocument();
    expect(titulos()[0]).toBe("Chamado 10");
  });

  it("esconde a paginação quando tudo cabe em uma página", () => {
    // 6 é o limite exato de uma página: ainda não pagina
    estado.chamados = Array.from({ length: 6 }, (_, i) => criarChamado(i + 1));
    renderLista();
    expect(
      screen.queryByRole("button", { name: /Próxima/ }),
    ).not.toBeInTheDocument();
  });
});

describe("ChamadosLista — visualização", () => {
  it("alterna entre cards e lista compacta e lembra a escolha", async () => {
    const usuario = userEvent.setup();
    estado.chamados = [criarChamado(1)];
    const { unmount } = renderLista();

    const cards = screen.getByRole("button", { name: "Visualização em cards" });
    const lista = screen.getByRole("button", { name: "Visualização em lista" });
    expect(cards).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("Descrição 1")).toBeInTheDocument();

    await usuario.click(lista);

    expect(lista).toHaveAttribute("aria-pressed", "true");
    // A lista compacta não repete a descrição do chamado
    expect(screen.queryByText("Descrição 1")).not.toBeInTheDocument();
    expect(screen.getByText("Chamado 1")).toBeInTheDocument();

    unmount();
    renderLista();
    expect(
      screen.getByRole("button", { name: "Visualização em lista" }),
    ).toHaveAttribute("aria-pressed", "true");
  });
});

describe("ChamadosLista — filtro pela URL", () => {
  it("aplica o status vindo de ?status=", () => {
    estado.chamados = [
      criarChamado(1, "AGUARDANDO_APROVACAO"),
      criarChamado(2, "EM_ANDAMENTO"),
    ];
    renderLista("/chamados?status=AGUARDANDO_APROVACAO");

    expect(titulos()).toEqual(["Chamado 1"]);
    expect(
      screen.getByDisplayValue("Aguardando Aprovação"),
    ).toBeInTheDocument();
  });

  it("ignora status inválido ou não visível ao perfil", () => {
    estado.chamados = [criarChamado(1, "EM_ANDAMENTO")];
    renderLista("/chamados?status=QUALQUER");
    expect(titulos()).toEqual(["Chamado 1"]);
  });
});

describe("ChamadosLista — paginação dinâmica", () => {
  it("troca o limite para 12 e 24 itens por página e volta à página 1", async () => {
    const usuario = userEvent.setup();
    estado.chamados = Array.from({ length: 30 }, (_, i) => criarChamado(i + 1));
    renderLista();

    const seletorLimite = screen.getByLabelText("Itens por página");
    expect(seletorLimite).toHaveValue("6");
    expect(titulos()).toHaveLength(6);
    expect(screen.getByText(/Página 1 de 5 · 30 chamados/)).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: /Próxima/ }));
    expect(screen.getByText(/Página 2 de 5/)).toBeInTheDocument();

    await usuario.selectOptions(seletorLimite, "12");
    expect(titulos()).toHaveLength(12);
    expect(titulos()[0]).toBe("Chamado 30");
    expect(screen.getByText(/Página 1 de 3 · 30 chamados/)).toBeInTheDocument();

    await usuario.selectOptions(seletorLimite, "24");
    expect(titulos()).toHaveLength(24);
    expect(screen.getByText(/Página 1 de 2 · 30 chamados/)).toBeInTheDocument();

    await usuario.click(screen.getByRole("button", { name: /Próxima/ }));
    expect(titulos()).toHaveLength(6);
    expect(screen.getByText(/Página 2 de 2 · 30 chamados/)).toBeInTheDocument();
  });

  it("combina limites 12 e 24 com filtro de categoria e alternância lista/cards", async () => {
    const usuario = userEvent.setup();
    estado.chamados = [
      ...Array.from({ length: 15 }, (_, i) =>
        criarChamado(i + 1, "EM_ANDAMENTO", "HIDRAULICA"),
      ),
      ...Array.from({ length: 15 }, (_, i) =>
        criarChamado(i + 16, "EM_ANDAMENTO", "ELETRICA"),
      ),
    ];
    renderLista();

    const seletorLimite = screen.getByLabelText("Itens por página");
    const seletorCategoria = screen.getByDisplayValue("Categoria: todas");

    await usuario.selectOptions(seletorLimite, "12");
    await usuario.click(screen.getByRole("button", { name: /Próxima/ }));
    expect(screen.getByText(/Página 2 de 3 · 30 chamados/)).toBeInTheDocument();

    // Filtrar por Hidráulica reseta para a página 1 mantendo o limite de 12
    await usuario.selectOptions(seletorCategoria, "HIDRAULICA");
    expect(titulos()).toHaveLength(12);
    expect(titulos()[0]).toBe("Chamado 15");
    expect(screen.getByText(/Página 1 de 2 · 15 chamados/)).toBeInTheDocument();
    expect(screen.getByText("Descrição 15")).toBeInTheDocument();

    // Avança para a página 2 (3 itens restantes) e alterna entre lista e cards sem perder página/recorte
    await usuario.click(screen.getByRole("button", { name: /Próxima/ }));
    expect(titulos()).toEqual(["Chamado 3", "Chamado 2", "Chamado 1"]);
    expect(screen.getByText(/Página 2 de 2 · 15 chamados/)).toBeInTheDocument();

    await usuario.click(
      screen.getByRole("button", { name: "Visualização em lista" }),
    );
    expect(titulos()).toEqual(["Chamado 3", "Chamado 2", "Chamado 1"]);
    expect(screen.queryByText("Descrição 3")).not.toBeInTheDocument();
    expect(screen.getByText(/Página 2 de 2 · 15 chamados/)).toBeInTheDocument();

    // Trocar para 24 por página em modo lista comporta os 15 filtrados em 1 página e oculta paginação
    await usuario.selectOptions(seletorLimite, "24");
    expect(titulos()).toHaveLength(15);
    expect(screen.queryByText("Descrição 15")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Próxima/ }),
    ).not.toBeInTheDocument();

    // Voltar para cards restaura as descrições mantendo os 15 itens filtrados
    await usuario.click(
      screen.getByRole("button", { name: "Visualização em cards" }),
    );
    expect(titulos()).toHaveLength(15);
    expect(screen.getByText("Descrição 15")).toBeInTheDocument();
  });
});
