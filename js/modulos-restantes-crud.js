function limparTextoModulo(valor) {
  return String(valor || "").trim();
}

function limparNuloModulo(valor) {
  const texto = limparTextoModulo(valor);
  return texto || null;
}

function numeroModulo(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return 0;
  }

  const texto = String(valor).replace(/[^\d,.-]/g, "");
  const normalizado = texto.includes(",")
    ? texto.replaceAll(".", "").replace(",", ".")
    : texto;
  const numero = Number(normalizado);

  return Number.isFinite(numero) ? numero : 0;
}

function criarCrudModulo(nomeGlobal, tabela, montar, validar, ordem) {
  async function listar() {
    let consulta = cjSupabase.from(tabela).select("*");

    (ordem || [["created_at", false]]).forEach(([coluna, crescente]) => {
      consulta = consulta.order(coluna, { ascending: crescente });
    });

    const { data, error } = await consulta;

    if (error) {
      throw error;
    }

    return data || [];
  }

  async function buscarPorId(id) {
    const { data, error } = await cjSupabase
      .from(tabela)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async function cadastrar(dados) {
    const registro = montar(dados);
    validar(registro);

    const { data, error } = await cjSupabase
      .from(tabela)
      .insert(registro)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async function alterar(id, dados) {
    const registro = montar(dados);
    validar(registro);

    const { data, error } = await cjSupabase
      .from(tabela)
      .update(registro)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async function excluir(id) {
    const { error } = await cjSupabase
      .from(tabela)
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return true;
  }

  window[nomeGlobal] = {
    listar,
    buscarPorId,
    cadastrar,
    alterar,
    excluir
  };
}

criarCrudModulo(
  "CJOrdens",
  "ordens_servico",
  (dados) => ({
    cliente_nome: limparTextoModulo(dados.cliente_nome),
    servico: limparTextoModulo(dados.servico),
    tecnico: limparNuloModulo(dados.tecnico),
    prazo: limparNuloModulo(dados.prazo),
    status: limparTextoModulo(dados.status) || "Em andamento",
    prioridade: limparTextoModulo(dados.prioridade) || "Normal",
    valor_total: numeroModulo(dados.valor_total),
    descricao: limparNuloModulo(dados.descricao),
    observacoes: limparNuloModulo(dados.observacoes)
  }),
  (ordem) => {
    if (!ordem.cliente_nome) {
      throw new Error("Informe o nome do cliente.");
    }

    if (!ordem.servico) {
      throw new Error("Informe o servico.");
    }
  },
  [["created_at", false]]
);

criarCrudModulo(
  "CJMateriais",
  "materiais",
  (dados) => ({
    codigo: limparNuloModulo(dados.codigo),
    nome: limparTextoModulo(dados.nome),
    categoria: limparTextoModulo(dados.categoria) || "Geral",
    estoque: numeroModulo(dados.estoque),
    unidade: limparTextoModulo(dados.unidade) || "un",
    estoque_minimo: numeroModulo(dados.estoque_minimo),
    valor_unitario: numeroModulo(dados.valor_unitario),
    status: limparTextoModulo(dados.status) || "Normal",
    fornecedor: limparNuloModulo(dados.fornecedor),
    observacoes: limparNuloModulo(dados.observacoes)
  }),
  (material) => {
    if (!material.nome) {
      throw new Error("Informe o nome do material.");
    }
  },
  [["created_at", false]]
);

criarCrudModulo(
  "CJFinanceiro",
  "financeiro",
  (dados) => ({
    documento: limparNuloModulo(dados.documento),
    descricao: limparTextoModulo(dados.descricao),
    tipo: limparTextoModulo(dados.tipo) || "Receita",
    vencimento: limparNuloModulo(dados.vencimento),
    status: limparTextoModulo(dados.status) || "A receber",
    valor: numeroModulo(dados.valor),
    cliente_nome: limparNuloModulo(dados.cliente_nome),
    forma_pagamento: limparNuloModulo(dados.forma_pagamento),
    observacoes: limparNuloModulo(dados.observacoes)
  }),
  (lancamento) => {
    if (!lancamento.descricao) {
      throw new Error("Informe a descricao do lancamento.");
    }
  },
  [["created_at", false]]
);

criarCrudModulo(
  "CJManutencoes",
  "manutencoes",
  (dados) => ({
    cliente_nome: limparTextoModulo(dados.cliente_nome),
    tipo: limparTextoModulo(dados.tipo) || "Preventiva",
    periodicidade: limparNuloModulo(dados.periodicidade),
    proxima_visita: limparNuloModulo(dados.proxima_visita),
    status: limparTextoModulo(dados.status) || "Agendada",
    valor: numeroModulo(dados.valor),
    tecnico: limparNuloModulo(dados.tecnico),
    observacoes: limparNuloModulo(dados.observacoes)
  }),
  (manutencao) => {
    if (!manutencao.cliente_nome) {
      throw new Error("Informe o nome do cliente.");
    }
  },
  [["proxima_visita", true], ["created_at", false]]
);

criarCrudModulo(
  "CJAgenda",
  "agenda",
  (dados) => ({
    cliente_nome: limparTextoModulo(dados.cliente_nome),
    servico: limparTextoModulo(dados.servico),
    tecnico: limparNuloModulo(dados.tecnico),
    data_agendamento: limparNuloModulo(dados.data_agendamento),
    horario: limparNuloModulo(dados.horario),
    tipo: limparTextoModulo(dados.tipo) || "Servico",
    status: limparTextoModulo(dados.status) || "Agendado",
    prioridade: limparTextoModulo(dados.prioridade) || "Normal",
    observacoes: limparNuloModulo(dados.observacoes)
  }),
  (agenda) => {
    if (!agenda.cliente_nome) {
      throw new Error("Informe o nome do cliente.");
    }

    if (!agenda.servico) {
      throw new Error("Informe o servico.");
    }

    if (!agenda.data_agendamento) {
      throw new Error("Informe a data.");
    }
  },
  [["data_agendamento", true], ["horario", true]]
);

window.CJConfiguracoes = {
  async carregar() {
    const { data, error } = await cjSupabase
      .from("configuracoes")
      .select("*")
      .eq("id", "principal")
      .maybeSingle();

    if (error) {
      throw error;
    }

    return data;
  },

  async salvar(dados) {
    const registro = {
      id: "principal",
      empresa_nome: limparTextoModulo(dados.empresa_nome) || "CJ Eletrica",
      cnpj: limparNuloModulo(dados.cnpj),
      telefone: limparNuloModulo(dados.telefone),
      email: limparNuloModulo(dados.email),
      idioma: limparTextoModulo(dados.idioma) || "pt-BR",
      notificar_visitas: Boolean(dados.notificar_visitas),
      controle_estoque: Boolean(dados.controle_estoque),
      financeiro_simplificado: Boolean(dados.financeiro_simplificado),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await cjSupabase
      .from("configuracoes")
      .upsert(registro, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }
};
