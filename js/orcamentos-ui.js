(function () {
  const estado = {
    orcamentos: [],
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

  function hojeISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function codigoOrcamento(orcamento) {
    const id = String(orcamento.id || "").replaceAll("-", "").slice(0, 6).toUpperCase();
    return id ? `#OR-${id}` : "#OR";
  }

  function formatarData(data) {
    if (!data) {
      return "Sem data";
    }

    const [ano, mes, dia] = String(data).split("-");

    if (!ano || !mes || !dia) {
      return data;
    }

    return `${dia}/${mes}/${ano}`;
  }

  function formatarMoeda(valor) {
    const numero = Number(valor || 0);
    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function valorInput(valor) {
    const numero = Number(valor || 0);
    return Number.isFinite(numero) && numero > 0 ? numero.toFixed(2) : "";
  }

  function classeStatus(status) {
    const normalizado = String(status || "").toLowerCase();

    if (normalizado.includes("aprov")) {
      return "completed";
    }

    if (normalizado.includes("revis") || normalizado.includes("rascunho")) {
      return "in-progress";
    }

    return "pending";
  }

  function obterElementos() {
    const tela = document.querySelector("#orcamentos");

    if (!tela) {
      return null;
    }

    return {
      tela,
      botaoNovo: tela.querySelector(".topbar .primary-action"),
      tabela: tela.querySelector(".budget-table"),
      corpoTabela: tela.querySelector(".budget-table tbody"),
      linhaCabecalho: tela.querySelector(".budget-table thead tr"),
      busca: tela.querySelector(".search-field input"),
      filtroStatus: tela.querySelector(".client-tools select"),
      ferramentas: tela.querySelector(".client-tools"),
      cardsResumo: tela.querySelectorAll(".budget-summary-grid .summary-card strong"),
      funil: tela.querySelector(".proposal-stages"),
      pendencias: tela.querySelector(".note-list")
    };
  }

  function garantirModal() {
    const modalExistente = document.querySelector("[data-budget-modal]");

    if (modalExistente) {
      return modalExistente;
    }

    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="client-modal budget-modal" data-budget-modal hidden>
        <div class="client-modal-backdrop" data-budget-close></div>
        <section class="client-modal-panel" role="dialog" aria-modal="true" aria-labelledby="budget-modal-title">
          <form class="client-form" data-budget-form>
            <div class="client-modal-header">
              <div>
                <p class="eyebrow">Comercial</p>
                <h2 id="budget-modal-title">Novo orcamento</h2>
              </div>
              <button class="icon-action" type="button" data-budget-close aria-label="Fechar">x</button>
            </div>

            <input type="hidden" name="id">

            <div class="client-form-grid">
              <label class="field-box">
                <span>Cliente</span>
                <input type="text" name="cliente_nome" placeholder="Nome do cliente" required>
              </label>

              <label class="field-box">
                <span>Servico</span>
                <input type="text" name="servico" placeholder="Ex: Ampliacao de carga" required>
              </label>

              <label class="field-box">
                <span>Emissao</span>
                <input type="date" name="data_emissao">
              </label>

              <label class="field-box">
                <span>Validade</span>
                <input type="date" name="validade">
              </label>

              <label class="field-box">
                <span>Status</span>
                <select name="status">
                  <option>Rascunho</option>
                  <option>Enviado</option>
                  <option>Aguardando</option>
                  <option>Em revisao</option>
                  <option>Aprovado</option>
                  <option>Recusado</option>
                </select>
              </label>

              <label class="field-box">
                <span>Forma de pagamento</span>
                <input type="text" name="forma_pagamento" placeholder="Pix, boleto, cartao">
              </label>

              <label class="field-box">
                <span>Valor total</span>
                <input type="text" name="valor_total" inputmode="decimal" placeholder="0,00">
              </label>

              <label class="field-box">
                <span>Entrada</span>
                <input type="text" name="entrada" inputmode="decimal" placeholder="0,00">
              </label>

              <label class="field-box client-form-wide">
                <span>Descricao do servico</span>
                <textarea name="descricao" rows="3" placeholder="Materiais, mao de obra e escopo"></textarea>
              </label>

              <label class="field-box client-form-wide">
                <span>Observacoes</span>
                <textarea name="observacoes" rows="3" placeholder="Observacoes comerciais"></textarea>
              </label>
            </div>

            <p class="client-feedback" data-budget-feedback></p>

            <div class="client-modal-actions">
              <button class="secondary-action" type="button" data-budget-close>Cancelar</button>
              <button class="primary-action budget-save-action" type="submit">Salvar orcamento</button>
            </div>
          </form>
        </section>
      </div>
      `
    );

    return document.querySelector("[data-budget-modal]");
  }

  function setMensagem(mensagem, tipo) {
    const feedback = document.querySelector("[data-budget-feedback]");

    if (!feedback) {
      return;
    }

    feedback.textContent = mensagem || "";
    feedback.dataset.type = tipo || "";
  }

  function abrirModal(orcamento) {
    const modal = garantirModal();
    const form = modal.querySelector("[data-budget-form]");
    const titulo = modal.querySelector("#budget-modal-title");

    form.reset();
    setMensagem("", "");

    form.elements.id.value = orcamento?.id || "";
    form.elements.cliente_nome.value = orcamento?.cliente_nome || "";
    form.elements.servico.value = orcamento?.servico || "";
    form.elements.data_emissao.value = orcamento?.data_emissao || hojeISO();
    form.elements.validade.value = orcamento?.validade || "";
    form.elements.status.value = orcamento?.status || "Aguardando";
    form.elements.forma_pagamento.value = orcamento?.forma_pagamento || "";
    form.elements.valor_total.value = valorInput(orcamento?.valor_total);
    form.elements.entrada.value = valorInput(orcamento?.entrada);
    form.elements.descricao.value = orcamento?.descricao || "";
    form.elements.observacoes.value = orcamento?.observacoes || "";
    titulo.textContent = orcamento?.id ? "Editar orcamento" : "Novo orcamento";

    modal.hidden = false;
    document.body.classList.add("client-modal-open");
    form.elements.cliente_nome.focus();
  }

  function fecharModal() {
    const modal = document.querySelector("[data-budget-modal]");

    if (!modal) {
      return;
    }

    modal.hidden = true;
    document.body.classList.remove("client-modal-open");
  }

  function dadosDoFormulario(form) {
    const dados = new FormData(form);

    return {
      cliente_nome: dados.get("cliente_nome"),
      servico: dados.get("servico"),
      descricao: dados.get("descricao"),
      data_emissao: dados.get("data_emissao"),
      validade: dados.get("validade"),
      status: dados.get("status"),
      valor_total: dados.get("valor_total"),
      entrada: dados.get("entrada"),
      forma_pagamento: dados.get("forma_pagamento"),
      observacoes: dados.get("observacoes")
    };
  }

  function orcamentosFiltrados() {
    const busca = estado.busca.toLowerCase();

    return estado.orcamentos.filter((orcamento) => {
      const texto = [
        orcamento.cliente_nome,
        orcamento.servico,
        orcamento.descricao,
        orcamento.data_emissao,
        orcamento.status,
        orcamento.valor_total,
        orcamento.forma_pagamento
      ].join(" ").toLowerCase();

      const bateBusca = !busca || texto.includes(busca);
      const bateStatus = estado.status === "Todos" || orcamento.status === estado.status;

      return bateBusca && bateStatus;
    });
  }

  function atualizarCards(elementos) {
    const abertos = estado.orcamentos.filter((orcamento) => !String(orcamento.status || "").toLowerCase().includes("aprov")).length;
    const aprovados = estado.orcamentos.filter((orcamento) => String(orcamento.status || "").toLowerCase().includes("aprov")).length;
    const aguardando = estado.orcamentos.filter((orcamento) => String(orcamento.status || "").toLowerCase().includes("aguard")).length;
    const total = estado.orcamentos.reduce((soma, orcamento) => soma + Number(orcamento.valor_total || 0), 0);
    const ticket = estado.orcamentos.length ? total / estado.orcamentos.length : 0;

    if (elementos.cardsResumo[0]) {
      elementos.cardsResumo[0].textContent = abertos;
    }

    if (elementos.cardsResumo[1]) {
      elementos.cardsResumo[1].textContent = aprovados;
    }

    if (elementos.cardsResumo[2]) {
      elementos.cardsResumo[2].textContent = aguardando;
    }

    if (elementos.cardsResumo[3]) {
      elementos.cardsResumo[3].textContent = formatarMoeda(ticket);
    }
  }

  function renderizarTabela(elementos, mensagem) {
    const orcamentos = orcamentosFiltrados();

    if (!elementos.corpoTabela) {
      return;
    }

    if (mensagem) {
      elementos.corpoTabela.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="table-message">${textoSeguro(mensagem)}</div>
          </td>
        </tr>
      `;
      return;
    }

    if (!orcamentos.length) {
      elementos.corpoTabela.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="table-message">Nenhum orcamento cadastrado ainda.</div>
          </td>
        </tr>
      `;
      return;
    }

    elementos.corpoTabela.innerHTML = orcamentos.map((orcamento) => `
      <tr>
        <td>
          <strong>${textoSeguro(codigoOrcamento(orcamento))}</strong>
          <small>${textoSeguro(orcamento.forma_pagamento || "Sem forma")}</small>
        </td>
        <td>
          <div class="client-cell">
            <span class="client-avatar">${textoSeguro(String(orcamento.cliente_nome || "CJ").slice(0, 2).toUpperCase())}</span>
            <div>
              <strong>${textoSeguro(orcamento.cliente_nome)}</strong>
              <small>${textoSeguro(orcamento.descricao || "Sem descricao")}</small>
            </div>
          </div>
        </td>
        <td>${textoSeguro(orcamento.servico || "Servico tecnico")}</td>
        <td>${textoSeguro(formatarData(orcamento.data_emissao))}</td>
        <td><span class="status ${classeStatus(orcamento.status)}">${textoSeguro(orcamento.status || "Aguardando")}</span></td>
        <td>
          <strong>${textoSeguro(formatarMoeda(orcamento.valor_total))}</strong>
          <small>Entrada: ${textoSeguro(formatarMoeda(orcamento.entrada))}</small>
        </td>
        <td>
          <div class="table-actions">
            <button class="table-action" type="button" data-budget-edit="${textoSeguro(orcamento.id)}">Editar</button>
            <button class="table-action danger" type="button" data-budget-delete="${textoSeguro(orcamento.id)}">Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  function renderizarFunil(elementos) {
    if (!elementos.funil) {
      return;
    }

    const etapas = ["Rascunho", "Enviado", "Aguardando", "Em revisao", "Aprovado"];
    const maior = Math.max(...etapas.map((status) => estado.orcamentos.filter((orcamento) => orcamento.status === status).length), 1);

    elementos.funil.innerHTML = etapas.map((status) => {
      const total = estado.orcamentos.filter((orcamento) => orcamento.status === status).length;
      const largura = Math.max(8, Math.round((total / maior) * 100));

      return `
        <div class="stage-row">
          <span>${textoSeguro(status)}</span>
          <div><i style="width: ${largura}%"></i></div>
          <strong>${total}</strong>
        </div>
      `;
    }).join("");
  }

  function renderizarPendencias(elementos) {
    if (!elementos.pendencias) {
      return;
    }

    const pendentes = estado.orcamentos
      .filter((orcamento) => !String(orcamento.status || "").toLowerCase().includes("aprov"))
      .slice(0, 3);

    if (!pendentes.length) {
      elementos.pendencias.innerHTML = `
        <div class="note-item">
          <strong>Nenhuma pendencia</strong>
          <span>Cadastre um novo orcamento.</span>
        </div>
      `;
      return;
    }

    elementos.pendencias.innerHTML = pendentes.map((orcamento) => `
      <div class="note-item">
        <strong>${textoSeguro(orcamento.status || "Aguardando")}</strong>
        <span>${textoSeguro(`${orcamento.cliente_nome} - ${orcamento.servico}`)}</span>
      </div>
    `).join("");
  }

  async function carregarOrcamentos(elementos) {
    if (!window.CJOrcamentos) {
      renderizarTabela(elementos, "Arquivos do Supabase ainda nao carregaram.");
      return;
    }

    renderizarTabela(elementos, "Carregando orcamentos...");

    try {
      estado.orcamentos = await window.CJOrcamentos.listar();
      atualizarCards(elementos);
      renderizarTabela(elementos);
      renderizarFunil(elementos);
      renderizarPendencias(elementos);
    } catch (error) {
      renderizarTabela(elementos, `Erro ao carregar orcamentos: ${error.message}`);
    }
  }

  async function salvarOrcamento(event, elementos) {
    event.preventDefault();

    if (estado.salvando || !window.CJOrcamentos) {
      return;
    }

    const form = event.currentTarget;
    const id = form.elements.id.value;
    const botaoSalvar = form.querySelector(".budget-save-action");

    estado.salvando = true;
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";
    setMensagem("Salvando orcamento...", "info");

    try {
      if (id) {
        await window.CJOrcamentos.alterar(id, dadosDoFormulario(form));
      } else {
        await window.CJOrcamentos.cadastrar(dadosDoFormulario(form));
      }

      await carregarOrcamentos(elementos);
      fecharModal();
    } catch (error) {
      setMensagem(error.message, "error");
    } finally {
      estado.salvando = false;
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = "Salvar orcamento";
    }
  }

  async function excluirOrcamento(id, elementos) {
    const orcamento = estado.orcamentos.find((item) => item.id === id);
    const cliente = orcamento?.cliente_nome || "este orcamento";
    const confirmar = window.confirm(`Excluir orcamento de ${cliente}?`);

    if (!confirmar) {
      return;
    }

    try {
      await window.CJOrcamentos.excluir(id);
      await carregarOrcamentos(elementos);
    } catch (error) {
      window.alert(`Erro ao excluir orcamento: ${error.message}`);
    }
  }

  function configurarTelaOrcamentos() {
    const elementos = obterElementos();

    if (!elementos || elementos.tela.dataset.orcamentosUi === "true") {
      return;
    }

    elementos.tela.dataset.orcamentosUi = "true";
    garantirModal();

    if (elementos.linhaCabecalho) {
      elementos.linhaCabecalho.innerHTML = `
        <th>Orcamento</th>
        <th>Cliente</th>
        <th>Servico</th>
        <th>Emissao</th>
        <th>Status</th>
        <th>Valor</th>
        <th>Acoes</th>
      `;
    }

    if (elementos.filtroStatus) {
      elementos.filtroStatus.innerHTML = `
        <option>Todos</option>
        <option>Rascunho</option>
        <option>Enviado</option>
        <option>Aguardando</option>
        <option>Em revisao</option>
        <option>Aprovado</option>
        <option>Recusado</option>
      `;
    }

    if (elementos.ferramentas && !elementos.ferramentas.querySelector("[data-budget-refresh]")) {
      const botaoAtualizar = document.createElement("button");
      botaoAtualizar.className = "secondary-action budget-refresh-action";
      botaoAtualizar.type = "button";
      botaoAtualizar.dataset.budgetRefresh = "true";
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
      if (event.target.closest("[data-budget-close]")) {
        fecharModal();
        return;
      }

      const atualizar = event.target.closest("[data-budget-refresh]");

      if (atualizar) {
        carregarOrcamentos(elementos);
        return;
      }

      const editar = event.target.closest("[data-budget-edit]");

      if (editar) {
        const orcamento = estado.orcamentos.find((item) => item.id === editar.dataset.budgetEdit);
        abrirModal(orcamento);
        return;
      }

      const excluir = event.target.closest("[data-budget-delete]");

      if (excluir) {
        excluirOrcamento(excluir.dataset.budgetDelete, elementos);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        fecharModal();
      }
    });

    document.querySelector("[data-budget-form]")?.addEventListener("submit", (event) => {
      salvarOrcamento(event, elementos);
    });

    carregarOrcamentos(elementos);
  }

  aoCarregar(configurarTelaOrcamentos);
})();
