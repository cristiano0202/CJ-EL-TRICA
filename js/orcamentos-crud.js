function limparTextoOrcamento(valor) {
  return String(valor || "").trim();
}

function limparNuloOrcamento(valor) {
  const texto = limparTextoOrcamento(valor);
  return texto || null;
}

function numeroOrcamento(valor) {
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

function montarOrcamento(dados) {
  return {
    cliente_nome: limparTextoOrcamento(dados.cliente_nome),
    servico: limparTextoOrcamento(dados.servico),
    descricao: limparNuloOrcamento(dados.descricao),
    data_emissao: limparNuloOrcamento(dados.data_emissao),
    validade: limparNuloOrcamento(dados.validade),
    status: limparTextoOrcamento(dados.status) || "Aguardando",
    valor_total: numeroOrcamento(dados.valor_total),
    entrada: numeroOrcamento(dados.entrada),
    forma_pagamento: limparNuloOrcamento(dados.forma_pagamento),
    observacoes: limparNuloOrcamento(dados.observacoes)
  };
}

function verificarOrcamento(orcamento) {
  if (!orcamento.cliente_nome) {
    throw new Error("Informe o nome do cliente.");
  }

  if (!orcamento.servico) {
    throw new Error("Informe o servico do orcamento.");
  }
}

async function listarOrcamentos() {
  const { data, error } = await cjSupabase
    .from("orcamentos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

async function buscarOrcamentoPorId(id) {
  const { data, error } = await cjSupabase
    .from("orcamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function cadastrarOrcamento(dados) {
  const orcamento = montarOrcamento(dados);
  verificarOrcamento(orcamento);

  const { data, error } = await cjSupabase
    .from("orcamentos")
    .insert(orcamento)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function alterarOrcamento(id, dados) {
  const orcamento = montarOrcamento(dados);
  verificarOrcamento(orcamento);

  const { data, error } = await cjSupabase
    .from("orcamentos")
    .update(orcamento)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function excluirOrcamento(id) {
  const { error } = await cjSupabase
    .from("orcamentos")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

window.CJOrcamentos = {
  listar: listarOrcamentos,
  buscarPorId: buscarOrcamentoPorId,
  cadastrar: cadastrarOrcamento,
  alterar: alterarOrcamento,
  excluir: excluirOrcamento
};
