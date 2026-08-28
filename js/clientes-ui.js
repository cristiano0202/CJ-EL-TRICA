(function () {
  const estado = {
    clientes: [],
    busca: "",
    status: "Todos",
    salvando: false
  };

  function aoCarregar(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }

    callback();
  }

  function textoSeguro(valor) {
    return String(valor || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function iniciais(nome) {
    const partes = String(nome || "CJ").trim().split(/\s+/).slice(0, 2);
    return partes.map((parte) => parte[0] || "").join("").toUpperCase() || "CJ";
  }

  function classeStatus(status) {
    const normalizado = String(status || "").toLowerCase();

    if (normalizado.includes("ativo") || normalizado.includes("dia")) {
      return "completed";
    }

    if (normalizado.includes("aguard")) {
      return "pending";
    }

    return "in-progress";
  }

  function formatarContato(cliente) {
    const telefone = cliente.telefone || "Sem telefone";
    const documento = cliente.documento || "Sem documento";
    return `${textoSeguro(telefone)}<small>${textoSeguro(documento)}</small>`;
  }

  function obterElementos() {
    const tela = document.querySelector("#clientes");

    if (!tela) {
      return null;
    }

    return {
      tela,
      botaoNovo: tela.querySelector(".topbar .primary-action"),
      tabela: tela.querySelector(".clients-table"),
      corpoTabela: tela.querySelector(".clients-table tbody"),
      linhaCabecalho: tela.querySelector(".clients-table thead tr"),
      busca: tela.querySelector(".search-field input"),
      filtroStatus: tela.querySelector(".client-tools select"),
      ferramentas: tela.querySelector(".client-tools"),
      cardsResumo: tela.querySelectorAll(".client-summary-grid .summary-card strong")
    };
  }

  function garantirModal() {
    const modalExistente = document.querySelector("[data-client-modal]");

    if (modalExistente) {
      return modalExistente;
    }

    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="client-modal" data-client-modal hidden>
        <div class="client-modal-backdrop" data-client-close></div>
        <section class="client-modal-panel" role="dialog" aria-modal="true" aria-labelledby="client-modal-title">
          <form class="client-form" data-client-form>
            <div class="client-modal-header">
              <div>
                <p class="eyebrow">Cadastro</p>
                <h2 id="client-modal-title">Novo cliente</h2>
              </div>
              <button class="icon-action" type="button" data-client-close aria-label="Fechar">x</button>
            </div>

            <input type="hidden" name="id">

            <div class="client-form-grid">
              <label class="field-box">
                <span>Nome</span>
                <input type="text" name="nome" placeholder="Nome do cliente" required>
              </label>

              <label class="field-box">
                <span>Tipo</span>
                <select name="tipo">
                  <option>Residencial</option>
                  <option>Comercial</option>
                  <option>Condominio</option>
                  <option>Industria</option>
                </select>
              </label>

              <label class="field-box">
                <span>Documento</span>
                <input type="text" name="documento" placeholder="CPF ou CNPJ">
              </label>

              <label class="field-box">
                <span>Telefone</span>
                <input type="text" name="telefone" placeholder="(00) 00000-0000">
              </label>

              <label class="field-box">
                <span>E-mail</span>
                <input type="email" name="email" placeholder="cliente@email.com">
              </label>

              <label class="field-box">
                <span>Status</span>
                <select name="status">
                  <option>Ativo</option>
                  <option>Aguardando</option>
                  <option>Inativo</option>
                </select>
              </label>

              <label class="field-box client-form-wide">
                <span>Endereco</span>
                <input type="text" name="endereco" placeholder="Rua, numero, bairro e cidade">
              </label>

              <label class="field-box client-form-wide">
                <span>Observacoes</span>
                <textarea name="observacoes" rows="3" placeholder="Observacoes do atendimento"></textarea>
              </label>
            </div>

            <p class="client-feedback" data-client-feedback></p>

            <div class="client-modal-actions">
              <button class="secondary-action" type="button" data-client-close>Cancelar</button>
              <button class="primary-action client-save-action" type="submit">Salvar cliente</button>
            </div>
          </form>
        </section>
      </div>
      `
    );

    return document.querySelector("[data-client-modal]");
  }

  function setMensagem(mensagem, tipo) {
    const feedback = document.querySelector("[data-client-feedback]");

    if (!feedback) {
      return;
    }

    feedback.textContent = mensagem || "";
    feedback.dataset.type = tipo || "";
  }

  function abrirModal(cliente) {
    const modal = garantirModal();
    const form = modal.querySelector("[data-client-form]");
    const titulo = modal.querySelector("#client-modal-title");

    form.reset();
    setMensagem("", "");

    form.elements.id.value = cliente?.id || "";
    form.elements.nome.value = cliente?.nome || "";
    form.elements.tipo.value = cliente?.tipo || "Residencial";
    form.elements.documento.value = cliente?.documento || "";
    form.elements.telefone.value = cliente?.telefone || "";
    form.elements.email.value = cliente?.email || "";
    form.elements.status.value = cliente?.status || "Ativo";
    form.elements.endereco.value = cliente?.endereco || "";
    form.elements.observacoes.value = cliente?.observacoes || "";
    titulo.textContent = cliente?.id ? "Editar cliente" : "Novo cliente";

    modal.hidden = false;
    document.body.classList.add("client-modal-open");
    form.elements.nome.focus();
  }

  function fecharModal() {
    const modal = document.querySelector("[data-client-modal]");

    if (!modal) {
      return;
    }

    modal.hidden = true;
    document.body.classList.remove("client-modal-open");
  }

  function dadosDoFormulario(form) {
    const dados = new FormData(form);

    return {
      nome: dados.get("nome"),
      tipo: dados.get("tipo"),
      documento: dados.get("documento"),
      telefone: dados.get("telefone"),
      email: dados.get("email"),
      endereco: dados.get("endereco"),
      status: dados.get("status"),
      observacoes: dados.get("observacoes")
    };
  }

  function clientesFiltrados() {
    const busca = estado.busca.toLowerCase();

    return estado.clientes.filter((cliente) => {
      const texto = [
        cliente.nome,
        cliente.tipo,
        cliente.documento,
        cliente.telefone,
        cliente.email,
        cliente.endereco,
        cliente.status
      ].join(" ").toLowerCase();

      const bateBusca = !busca || texto.includes(busca);
      const bateStatus = estado.status === "Todos" || cliente.status === estado.status;

      return bateBusca && bateStatus;
    });
  }

  function atualizarCards(elementos) {
    const total = estado.clientes.length;
    const ativos = estado.clientes.filter((cliente) => cliente.status === "Ativo").length;
    const aguardando = estado.clientes.filter((cliente) => cliente.status === "Aguardando").length;

    if (elementos.cardsResumo[0]) {
      elementos.cardsResumo[0].textContent = total;
    }

    if (elementos.cardsResumo[1]) {
      elementos.cardsResumo[1].textContent = ativos;
    }

    if (elementos.cardsResumo[2]) {
      elementos.cardsResumo[2].textContent = aguardando;
    }
  }

  function renderizarTabela(elementos, mensagem) {
    const clientes = clientesFiltrados();

    if (!elementos.corpoTabela) {
      return;
    }

    if (mensagem) {
      elementos.corpoTabela.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="table-message">${textoSeguro(mensagem)}</div>
          </td>
        </tr>
      `;
      return;
    }

    if (!clientes.length) {
      elementos.corpoTabela.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="table-message">Nenhum cliente cadastrado ainda.</div>
          </td>
        </tr>
      `;
      return;
    }

    elementos.corpoTabela.innerHTML = clientes.map((cliente) => `
      <tr>
        <td>
          <div class="client-cell">
            <span class="client-avatar">${textoSeguro(iniciais(cliente.nome))}</span>
            <div>
              <strong>${textoSeguro(cliente.nome)}</strong>
              <small>${textoSeguro(cliente.endereco || "Sem endereco")}</small>
            </div>
          </div>
        </td>
        <td>${formatarContato(cliente)}</td>
        <td>${textoSeguro(cliente.tipo || "Residencial")}</td>
        <td>${textoSeguro(cliente.email || "Sem e-mail")}</td>
        <td><span class="status ${classeStatus(cliente.status)}">${textoSeguro(cliente.status || "Ativo")}</span></td>
        <td>
          <div class="table-actions">
            <button class="table-action" type="button" data-client-edit="${textoSeguro(cliente.id)}">Editar</button>
            <button class="table-action danger" type="button" data-client-delete="${textoSeguro(cliente.id)}">Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  async function carregarClientes(elementos) {
    if (!window.CJClientes) {
      renderizarTabela(elementos, "Arquivos do Supabase ainda nao carregaram.");
      return;
    }

    renderizarTabela(elementos, "Carregando clientes...");

    try {
      estado.clientes = await window.CJClientes.listar();
      atualizarCards(elementos);
      renderizarTabela(elementos);
    } catch (error) {
      renderizarTabela(elementos, `Erro ao carregar clientes: ${error.message}`);
    }
  }

  async function salvarCliente(event, elementos) {
    event.preventDefault();

    if (estado.salvando || !window.CJClientes) {
      return;
    }

    const form = event.currentTarget;
    const id = form.elements.id.value;
    const botaoSalvar = form.querySelector(".client-save-action");

    estado.salvando = true;
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";
    setMensagem("Salvando cliente...", "info");

    try {
      if (id) {
        await window.CJClientes.alterar(id, dadosDoFormulario(form));
      } else {
        await window.CJClientes.cadastrar(dadosDoFormulario(form));
      }

      await carregarClientes(elementos);
      fecharModal();
    } catch (error) {
      setMensagem(error.message, "error");
    } finally {
      estado.salvando = false;
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = "Salvar cliente";
    }
  }

  async function excluirCliente(id, elementos) {
    const cliente = estado.clientes.find((item) => item.id === id);
    const nome = cliente?.nome || "este cliente";
    const confirmar = window.confirm(`Excluir ${nome}?`);

    if (!confirmar) {
      return;
    }

    try {
      await window.CJClientes.excluir(id);
      await carregarClientes(elementos);
    } catch (error) {
      window.alert(`Erro ao excluir cliente: ${error.message}`);
    }
  }

  function configurarTelaClientes() {
    const elementos = obterElementos();

    if (!elementos || elementos.tela.dataset.clientesUi === "true") {
      return;
    }

    elementos.tela.dataset.clientesUi = "true";
    garantirModal();

    if (elementos.linhaCabecalho) {
      elementos.linhaCabecalho.innerHTML = `
        <th>Cliente</th>
        <th>Contato</th>
        <th>Tipo</th>
        <th>E-mail</th>
        <th>Status</th>
        <th>Acoes</th>
      `;
    }

    if (elementos.filtroStatus) {
      elementos.filtroStatus.innerHTML = `
        <option>Todos</option>
        <option>Ativo</option>
        <option>Aguardando</option>
        <option>Inativo</option>
      `;
    }

    if (elementos.ferramentas && !elementos.ferramentas.querySelector("[data-client-refresh]")) {
      const botaoAtualizar = document.createElement("button");
      botaoAtualizar.className = "secondary-action client-refresh-action";
      botaoAtualizar.type = "button";
      botaoAtualizar.dataset.clientRefresh = "true";
      botaoAtualizar.textContent = "Atualizar";
      elementos.ferramentas.appendChild(botaoAtualizar);
    }

    elementos.botaoNovo?.addEventListener("click", () => abrirModal());

    elementos.busca?.addEventListener("input", (event) => {
      estado.busca = event.target.value;
      renderizarTabela(elementos);
    });

    elementos.filtroStatus?.addEventListener("change", (event) => {
      estado.status = event.target.value;
      renderizarTabela(elementos);
    });

    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-client-close]")) {
        fecharModal();
        return;
      }

      const atualizar = event.target.closest("[data-client-refresh]");

      if (atualizar) {
        carregarClientes(elementos);
        return;
      }

      const editar = event.target.closest("[data-client-edit]");

      if (editar) {
        const cliente = estado.clientes.find((item) => item.id === editar.dataset.clientEdit);
        abrirModal(cliente);
        return;
      }

      const excluir = event.target.closest("[data-client-delete]");

      if (excluir) {
        excluirCliente(excluir.dataset.clientDelete, elementos);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        fecharModal();
      }
    });

    document.querySelector("[data-client-form]")?.addEventListener("submit", (event) => {
      salvarCliente(event, elementos);
    });

    carregarClientes(elementos);
  }

  aoCarregar(configurarTelaClientes);
})();
