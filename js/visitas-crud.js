const CJ_VISITAS_STORAGE_KEY = "cj-eletrica-visitas-tecnicas";

function limparTextoVisita(valor) {
  return String(valor || "").trim();
}

function limparValorNulo(valor) {
  const texto = limparTextoVisita(valor);
  return texto || null;
}

function hojeVisitaISO() {
  return new Date().toISOString().slice(0, 10);
}

function gerarIdVisita() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function obterSupabaseVisitas() {
  const cliente = window.cjSupabase;

  if (!cliente || typeof cliente.from !== "function") {
    return null;
  }

  return cliente;
}

function montarVisita(dados) {
  return {
    cliente_nome: limparTextoVisita(dados.cliente_nome),
    tipo: limparTextoVisita(dados.tipo) || "Avaliacao tecnica",
    tecnico: limparValorNulo(dados.tecnico),
    data_visita: limparValorNulo(dados.data_visita),
    horario: limparValorNulo(dados.horario),
    status: limparTextoVisita(dados.status) || "Agendada",
    prioridade: limparTextoVisita(dados.prioridade) || "Normal",
    endereco: limparValorNulo(dados.endereco),
    telefone: limparValorNulo(dados.telefone),
    observacoes: limparValorNulo(dados.observacoes)
  };
}

function verificarVisita(visita) {
  if (!visita.cliente_nome) {
    throw new Error("Informe o nome do cliente.");
  }

  if (!visita.data_visita) {
    throw new Error("Informe a data da visita.");
  }
}

function visitasIniciaisLocais() {
  const hoje = hojeVisitaISO();

  return [
    {
      id: "local-vt-312",
      cliente_nome: "Loja Prime Center",
      tipo: "Levantamento para orçamento",
      tecnico: "Elaine",
      data_visita: hoje,
      horario: "10:00",
      status: "Em rota",
      prioridade: "Alta",
      endereco: "Endereco para preencher depois",
      telefone: null,
      observacoes: "Verificar carga instalada e pontos novos"
    },
    {
      id: "local-vt-311",
      cliente_nome: "Residencial Vila Clara",
      tipo: "Avaliacao de disjuntores",
      tecnico: "Marcos",
      data_visita: hoje,
      horario: "16:00",
      status: "Agendada",
      prioridade: "Media",
      endereco: "Endereco para preencher depois",
      telefone: null,
      observacoes: "Avaliar troca de disjuntores"
    },
    {
      id: "local-vt-310",
      cliente_nome: "Oficina Delta",
      tipo: "Inspecao de painel",
      tecnico: "Roberto",
      data_visita: hoje,
      horario: "09:00",
      status: "Concluida",
      prioridade: "Normal",
      endereco: "Endereco para preencher depois",
      telefone: null,
      observacoes: "Registrar detalhes para historico tecnico"
    },
    {
      id: "local-vt-309",
      cliente_nome: "Clinica Sao Bento",
      tipo: "Manutencao preventiva",
      tecnico: "Diego",
      data_visita: hoje,
      horario: "13:30",
      status: "Aguardando orçamento",
      prioridade: "Normal",
      endereco: "Endereco para preencher depois",
      telefone: null,
      observacoes: "Conferir quadro e aterramento"
    }
  ];
}

function ordenarVisitas(visitas) {
  return [...visitas].sort((a, b) => {
    const dataA = `${a.data_visita || ""} ${a.horario || ""}`;
    const dataB = `${b.data_visita || ""} ${b.horario || ""}`;
    return dataA.localeCompare(dataB);
  });
}

function lerVisitasLocais() {
  try {
    const salvo = window.localStorage.getItem(CJ_VISITAS_STORAGE_KEY);

    if (!salvo) {
      const iniciais = visitasIniciaisLocais();
      salvarVisitasLocais(iniciais);
      return iniciais;
    }

    const visitas = JSON.parse(salvo);
    return Array.isArray(visitas) ? visitas : visitasIniciaisLocais();
  } catch (error) {
    return visitasIniciaisLocais();
  }
}

function salvarVisitasLocais(visitas) {
  window.localStorage.setItem(CJ_VISITAS_STORAGE_KEY, JSON.stringify(visitas));
}

function avisarFalhaBancoVisitas(operacao, error) {
  console.warn(`CJ Eletrica: usando visitas locais porque o banco falhou ao ${operacao}.`, error);
}

function cadastrarVisitaLocal(visita) {
  const visitas = lerVisitasLocais();
  const novaVisita = {
    id: gerarIdVisita(),
    ...visita,
    created_at: new Date().toISOString()
  };

  salvarVisitasLocais([...visitas, novaVisita]);
  return novaVisita;
}

function alterarVisitaLocal(id, visita) {
  const visitas = lerVisitasLocais();
  const atualizadas = visitas.map((item) => {
    if (item.id !== id) {
      return item;
    }

    return {
      ...item,
      ...visita,
      updated_at: new Date().toISOString()
    };
  });

  salvarVisitasLocais(atualizadas);
  return atualizadas.find((item) => item.id === id) || null;
}

function excluirVisitaLocal(id) {
  const visitas = lerVisitasLocais().filter((visita) => visita.id !== id);
  salvarVisitasLocais(visitas);
  return true;
}

async function listarVisitas() {
  const banco = obterSupabaseVisitas();

  if (!banco) {
    return ordenarVisitas(lerVisitasLocais());
  }

  try {
    const { data, error } = await banco
      .from("visitas_tecnicas")
      .select("*")
      .order("data_visita", { ascending: true })
      .order("horario", { ascending: true });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    avisarFalhaBancoVisitas("listar", error);
    return ordenarVisitas(lerVisitasLocais());
  }
}

async function buscarVisitaPorId(id) {
  const banco = obterSupabaseVisitas();

  if (!banco) {
    return lerVisitasLocais().find((visita) => visita.id === id) || null;
  }

  const { data, error } = await banco
    .from("visitas_tecnicas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function cadastrarVisita(dados) {
  const visita = montarVisita(dados);
  verificarVisita(visita);

  const banco = obterSupabaseVisitas();

  if (!banco) {
    return cadastrarVisitaLocal(visita);
  }

  try {
    const { data, error } = await banco
      .from("visitas_tecnicas")
      .insert(visita)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    avisarFalhaBancoVisitas("cadastrar", error);
    return cadastrarVisitaLocal(visita);
  }
}

async function alterarVisita(id, dados) {
  const visita = montarVisita(dados);
  verificarVisita(visita);

  const banco = obterSupabaseVisitas();

  if (!banco) {
    return alterarVisitaLocal(id, visita);
  }

  try {
    const { data, error } = await banco
      .from("visitas_tecnicas")
      .update(visita)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    avisarFalhaBancoVisitas("alterar", error);
    return alterarVisitaLocal(id, visita);
  }
}

async function excluirVisita(id) {
  const banco = obterSupabaseVisitas();

  if (!banco) {
    return excluirVisitaLocal(id);
  }

  try {
    const { error } = await banco
      .from("visitas_tecnicas")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    avisarFalhaBancoVisitas("excluir", error);
    return excluirVisitaLocal(id);
  }
}

window.CJVisitas = {
  listar: listarVisitas,
  buscarPorId: buscarVisitaPorId,
  cadastrar: cadastrarVisita,
  alterar: alterarVisita,
  excluir: excluirVisita,
  usaBanco: Boolean(obterSupabaseVisitas())
};
