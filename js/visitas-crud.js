function limparTextoVisita(valor) {
  return String(valor || "").trim();
}

function limparValorNulo(valor) {
  const texto = limparTextoVisita(valor);
  return texto || null;
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

async function listarVisitas() {
  const { data, error } = await cjSupabase
    .from("visitas_tecnicas")
    .select("*")
    .order("data_visita", { ascending: true })
    .order("horario", { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

async function buscarVisitaPorId(id) {
  const { data, error } = await cjSupabase
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

  const { data, error } = await cjSupabase
    .from("visitas_tecnicas")
    .insert(visita)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function alterarVisita(id, dados) {
  const visita = montarVisita(dados);
  verificarVisita(visita);

  const { data, error } = await cjSupabase
    .from("visitas_tecnicas")
    .update(visita)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function excluirVisita(id) {
  const { error } = await cjSupabase
    .from("visitas_tecnicas")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

window.CJVisitas = {
  listar: listarVisitas,
  buscarPorId: buscarVisitaPorId,
  cadastrar: cadastrarVisita,
  alterar: alterarVisita,
  excluir: excluirVisita
};
