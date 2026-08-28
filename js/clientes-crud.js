function limparTexto(valor) {
  return String(valor || "").trim();
}

function montarCliente(dados) {
  return {
    nome: limparTexto(dados.nome),
    tipo: limparTexto(dados.tipo) || "Residencial",
    documento: limparTexto(dados.documento) || null,
    telefone: limparTexto(dados.telefone) || null,
    email: limparTexto(dados.email) || null,
    endereco: limparTexto(dados.endereco) || null,
    status: limparTexto(dados.status) || "Ativo",
    observacoes: limparTexto(dados.observacoes) || null
  };
}

function verificarCliente(cliente) {
  if (!cliente.nome) {
    throw new Error("Informe o nome do cliente.");
  }
}

async function listarClientes() {
  const { data, error } = await cjSupabase
    .from("clientes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}

async function buscarClientePorId(id) {
  const { data, error } = await cjSupabase
    .from("clientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function cadastrarCliente(dados) {
  const cliente = montarCliente(dados);
  verificarCliente(cliente);

  const { data, error } = await cjSupabase
    .from("clientes")
    .insert(cliente)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function alterarCliente(id, dados) {
  const cliente = montarCliente(dados);
  verificarCliente(cliente);

  const { data, error } = await cjSupabase
    .from("clientes")
    .update(cliente)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function excluirCliente(id) {
  const { error } = await cjSupabase
    .from("clientes")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }

  return true;
}

window.CJClientes = {
  listar: listarClientes,
  buscarPorId: buscarClientePorId,
  cadastrar: cadastrarCliente,
  alterar: alterarCliente,
  excluir: excluirCliente
};
