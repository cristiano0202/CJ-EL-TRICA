(function () {
  const estado = {
    visitas: [],
    busca: "",
    status: "Todas",
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

  function codigoVisita(visita) {
    const id = String(visita.id || "").replaceAll("-", "").slice(0, 6).toUpperCase();
    return id ? `#VT-${id}` : "#VT";
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

  function formatarHorario(horario) {
    if (!horario) {
      return "Sem hora";
    }

    return String(horario).slice(0, 5);
  }

  function valorHorarioInput(horario) {
    if (!horario) {
      return "";
    }

    return String(horario).slice(0, 5);
  }

  function classeStatus(status) {
    const normalizado = String(status || "").toLowerCase();

    if (normalizado.includes("concl")) {
      return "completed";
    }

    if (normalizado.includes("rota") || normalizado.includes("andamento")) {
      return "in-progress";
    }

    return "pending";
  }

  function classePrioridade(prioridade) {
    const normalizado = String(prioridade || "").toLowerCase();

    if (normalizado.includes("alta") || normalizado.includes("urgente")) {
      return "high";
    }

    if (normalizado.includes("media") || normalizado.includes("média")) {
      return "medium";
    }

    return "normal";
  }

  function obterElementos() {
    const tela = document.querySelector("#visitas");

    if (!tela) {
      return null;
    }

    return {
      tela,
      botaoNovo: tela.querySelector(".topbar .primary-action"),
      tabela: tela.querySelector(".visit-table"),
      corpoTabela: tela.querySelector(".visit-table tbody"),
      linhaCabecalho: tela.querySelector(".visit-table thead tr"),
      busca: tela.querySelector(".search-field input"),
      filtroStatus: tela.querySelector(".client-tools select"),
      ferramentas: tela.querySelector(".client-tools"),
      cardsResumo: tela.querySelectorAll(".visit-summary-grid .summary-card strong"),
      proximasVisitas: tela.querySelector(".inspection-list")
    };
  }

  function garantirModal() {
    const modalExistente = document.querySelector("[data-visit-modal]");

    if (modalExistente) {
      return modalExistente;
    }

    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="client-modal visit-modal" data-visit-modal hidden>
        <div class="client-modal-backdrop" data-visit-close></div>
        <section class="client-modal-panel" role="dialog" aria-modal="true" aria-labelledby="visit-modal-title">
          <form class="client-form" data-visit-form>
            <div class="client-modal-header">
              <div>
                <p class="eyebrow">Campo</p>
                <h2 id="visit-modal-title">Nova visita</h2>
              </div>
              <button class="icon-action" type="button" data-visit-close aria-label="Fechar">x</button>
            </div>

            <input type="hidden" name="id">

            <div class="client-form-grid">
              <label class="field-box">
                <span>Cliente</span>
                <input type="text" name="cliente_nome" placeholder="Nome do cliente" required>
              </label>

              <label class="field-box">
                <span>Tipo de servico</span>
                <input type="text" name="tipo" placeholder="Ex: Avaliacao de disjuntores">
              </label>

              <label class="field-box">
                <span>Tecnico</span>
                <input type="text" name="tecnico" placeholder="Nome do tecnico">
              </label>

              <label class="field-box">
                <span>Telefone</span>
                <input type="text" name="telefone" placeholder="(00) 00000-0000">
              </label>

              <label class="field-box">
                <span>Data</span>
                <input type="date" name="data_visita" required>
              </label>

              <label class="field-box">
                <span>Horario</span>
                <input type="time" name="horario">
              </label>

              <label class="field-box">
                <span>Status</span>
                <select name="status">
                  <option>Agendada</option>
                  <option>Em rota</option>
                  <option>Aguardando orçamento</option>
                  <option>Concluida</option>
                  <option>Cancelada</option>
                </select>
              </label>

              <label class="field-box">
                <span>Prioridade</span>
                <select name="prioridade">
                  <option>Normal</option>
                  <option>Media</option>
                  <option>Alta</option>
                  <option>Urgente</option>
                </select>
              </label>

              <label class="field-box client-form-wide">
                <span>Endereco</span>
                <input type="text" name="endereco" placeholder="Rua, numero, bairro e cidade">
              </label>

              <label class="field-box client-form-wide">
                <span>Observacoes</span>
                <textarea name="observacoes" rows="3" placeholder="Detalhes da visita tecnica"></textarea>
              </label>
            </div>

            <p class="client-feedback" data-visit-feedback></p>

            <div class="client-modal-actions">
              <button class="secondary-action" type="button" data-visit-close>Cancelar</button>
              <button class="primary-action visit-save-action" type="submit">Salvar visita</button>
            </div>
          </form>
        </section>
      </div>
      `
    );

    return document.querySelector("[data-visit-modal]");
  }

  function setMensagem(mensagem, tipo) {
    const feedback = document.querySelector("[data-visit-feedback]");

    if (!feedback) {
      return;
    }

    feedback.textContent = mensagem || "";
    feedback.dataset.type = tipo || "";
  }

  function abrirModal(visita) {
    const modal = garantirModal();
    const form = modal.querySelector("[data-visit-form]");
    const titulo = modal.querySelector("#visit-modal-title");

    form.reset();
    setMensagem("", "");

    form.elements.id.value = visita?.id || "";
    form.elements.cliente_nome.value = visita?.cliente_nome || "";
    form.elements.tipo.value = visita?.tipo || "";
    form.elements.tecnico.value = visita?.tecnico || "";
    form.elements.telefone.value = visita?.telefone || "";
    form.elements.data_visita.value = visita?.data_visita || hojeISO();
    form.elements.horario.value = valorHorarioInput(visita?.horario);
    form.elements.status.value = visita?.status || "Agendada";
    form.elements.prioridade.value = visita?.prioridade || "Normal";
    form.elements.endereco.value = visita?.endereco || "";
    form.elements.observacoes.value = visita?.observacoes || "";
    titulo.textContent = visita?.id ? "Editar visita" : "Nova visita";

    modal.hidden = false;
    document.body.classList.add("client-modal-open");
    form.elements.cliente_nome.focus();
  }

  function fecharModal() {
    const modal = document.querySelector("[data-visit-modal]");

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
      tipo: dados.get("tipo"),
      tecnico: dados.get("tecnico"),
      data_visita: dados.get("data_visita"),
      horario: dados.get("horario"),
      status: dados.get("status"),
      prioridade: dados.get("prioridade"),
      endereco: dados.get("endereco"),
      telefone: dados.get("telefone"),
      observacoes: dados.get("observacoes")
    };
  }

  function visitasFiltradas() {
    const busca = estado.busca.toLowerCase();

    return estado.visitas.filter((visita) => {
      const texto = [
        visita.cliente_nome,
        visita.tipo,
        visita.tecnico,
        visita.data_visita,
        visita.horario,
        visita.status,
        visita.prioridade,
        visita.endereco,
        visita.telefone
      ].join(" ").toLowerCase();

      const bateBusca = !busca || texto.includes(busca);
      const bateStatus = estado.status === "Todas" || visita.status === estado.status;

      return bateBusca && bateStatus;
    });
  }

  function atualizarCards(elementos) {
    const hoje = hojeISO();
    const visitasHoje = estado.visitas.filter((visita) => visita.data_visita === hoje).length;
    const aguardando = estado.visitas.filter((visita) => String(visita.status || "").toLowerCase().includes("orcamento") || String(visita.status || "").toLowerCase().includes("orçamento")).length;
    const concluidas = estado.visitas.filter((visita) => String(visita.status || "").toLowerCase().includes("concl")).length;
    const tecnicos = new Set(estado.visitas.map((visita) => visita.tecnico).filter(Boolean)).size;

    if (elementos.cardsResumo[0]) {
      elementos.cardsResumo[0].textContent = visitasHoje;
    }

    if (elementos.cardsResumo[1]) {
      elementos.cardsResumo[1].textContent = aguardando;
    }

    if (elementos.cardsResumo[2]) {
      elementos.cardsResumo[2].textContent = concluidas;
    }

    if (elementos.cardsResumo[3]) {
      elementos.cardsResumo[3].textContent = tecnicos;
    }
  }

  function renderizarTabela(elementos, mensagem) {
    const visitas = visitasFiltradas();

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

    if (!visitas.length) {
      elementos.corpoTabela.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="table-message">Nenhuma visita cadastrada ainda.</div>
          </td>
        </tr>
      `;
      return;
    }

    elementos.corpoTabela.innerHTML = visitas.map((visita) => `
      <tr data-visit-row="${textoSeguro(visita.id)}" title="Clique para editar">
        <td>
          <strong>${textoSeguro(codigoVisita(visita))}</strong>
          <small>${textoSeguro(visita.prioridade || "Normal")}</small>
        </td>
        <td>
          <div class="client-cell">
            <span class="client-avatar">${textoSeguro(String(visita.cliente_nome || "CJ").slice(0, 2).toUpperCase())}</span>
            <div>
              <strong>${textoSeguro(visita.cliente_nome)}</strong>
              <small>${textoSeguro(visita.endereco || "Sem endereco")}</small>
            </div>
          </div>
        </td>
        <td>${textoSeguro(visita.tipo || "Avaliacao tecnica")}</td>
        <td>${textoSeguro(visita.tecnico || "Sem tecnico")}</td>
        <td>
          <strong>${textoSeguro(formatarData(visita.data_visita))}</strong>
          <small>${textoSeguro(formatarHorario(visita.horario))}</small>
        </td>
        <td><span class="status ${classeStatus(visita.status)}">${textoSeguro(visita.status || "Agendada")}</span></td>
        <td>
          <div class="table-actions">
            <button class="table-action" type="button" data-visit-edit="${textoSeguro(visita.id)}">Editar</button>
            <button class="table-action danger" type="button" data-visit-delete="${textoSeguro(visita.id)}">Excluir</button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  function renderizarProximasVisitas(elementos) {
    if (!elementos.proximasVisitas) {
      return;
    }

    const hoje = hojeISO();
    const proximas = estado.visitas
      .filter((visita) => visita.data_visita >= hoje && !String(visita.status || "").toLowerCase().includes("concl"))
      .slice(0, 4);

    if (!proximas.length) {
      elementos.proximasVisitas.innerHTML = `
        <div class="inspection-item normal">
          <time>--:--</time>
          <div>
            <strong>Nenhuma visita proxima</strong>
            <span>Cadastre uma nova visita tecnica.</span>
          </div>
        </div>
      `;
      return;
    }

    elementos.proximasVisitas.innerHTML = proximas.map((visita) => `
      <div class="inspection-item ${classePrioridade(visita.prioridade)}">
        <time>${textoSeguro(formatarHorario(visita.horario))}</time>
        <div>
          <strong>${textoSeguro(visita.cliente_nome)}</strong>
          <span>${textoSeguro(`${formatarData(visita.data_visita)} - ${visita.tipo || "Avaliacao tecnica"}`)}</span>
        </div>
      </div>
    `).join("");
  }

  async function carregarVisitas(elementos) {
    if (!window.CJVisitas) {
      renderizarTabela(elementos, "Arquivos do Supabase ainda nao carregaram.");
      return;
    }

    renderizarTabela(elementos, "Carregando visitas...");

    try {
      estado.visitas = await window.CJVisitas.listar();
      atualizarCards(elementos);
      renderizarTabela(elementos);
      renderizarProximasVisitas(elementos);
    } catch (error) {
      renderizarTabela(elementos, `Erro ao carregar visitas: ${error.message}`);
    }
  }

  async function salvarVisita(event, elementos) {
    event.preventDefault();

    if (estado.salvando || !window.CJVisitas) {
      return;
    }

    const form = event.currentTarget;
    const id = form.elements.id.value;
    const botaoSalvar = form.querySelector(".visit-save-action");

    estado.salvando = true;
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";
    setMensagem("Salvando visita...", "info");

    try {
      if (id) {
        await window.CJVisitas.alterar(id, dadosDoFormulario(form));
      } else {
        await window.CJVisitas.cadastrar(dadosDoFormulario(form));
      }

      await carregarVisitas(elementos);
      fecharModal();
    } catch (error) {
      setMensagem(error.message, "error");
    } finally {
      estado.salvando = false;
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = "Salvar visita";
    }
  }

  async function excluirVisita(id, elementos) {
    const visita = estado.visitas.find((item) => item.id === id);
    const cliente = visita?.cliente_nome || "esta visita";
    const confirmar = window.confirm(`Excluir visita de ${cliente}?`);

    if (!confirmar) {
      return;
    }

    try {
      await window.CJVisitas.excluir(id);
      await carregarVisitas(elementos);
    } catch (error) {
      window.alert(`Erro ao excluir visita: ${error.message}`);
    }
  }

  function configurarTelaVisitas() {
    const elementos = obterElementos();

    if (!elementos || elementos.tela.dataset.visitasUi === "true") {
      return;
    }

    elementos.tela.dataset.visitasUi = "true";
    garantirModal();

    if (elementos.linhaCabecalho) {
      elementos.linhaCabecalho.innerHTML = `
        <th>Visita</th>
        <th>Cliente</th>
        <th>Tipo</th>
        <th>Tecnico</th>
        <th>Data/Hora</th>
        <th>Status</th>
        <th>Acoes</th>
      `;
    }

    if (elementos.filtroStatus) {
      elementos.filtroStatus.innerHTML = `
        <option>Todas</option>
        <option>Agendada</option>
        <option>Em rota</option>
        <option>Aguardando orçamento</option>
        <option>Concluida</option>
        <option>Cancelada</option>
      `;
    }

    if (elementos.ferramentas && !elementos.ferramentas.querySelector("[data-visit-refresh]")) {
      const botaoAtualizar = document.createElement("button");
      botaoAtualizar.className = "secondary-action visit-refresh-action";
      botaoAtualizar.type = "button";
      botaoAtualizar.dataset.visitRefresh = "true";
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
      if (event.target.closest("[data-visit-close]")) {
        fecharModal();
        return;
      }

      const atualizar = event.target.closest("[data-visit-refresh]");

      if (atualizar) {
        carregarVisitas(elementos);
        return;
      }

      const editar = event.target.closest("[data-visit-edit]");

      if (editar) {
        const visita = estado.visitas.find((item) => item.id === editar.dataset.visitEdit);
        abrirModal(visita);
        return;
      }

      const excluir = event.target.closest("[data-visit-delete]");

      if (excluir) {
        excluirVisita(excluir.dataset.visitDelete, elementos);
        return;
      }

      const linha = event.target.closest("[data-visit-row]");

      if (linha && elementos.tela.contains(linha)) {
        const visita = estado.visitas.find((item) => item.id === linha.dataset.visitRow);
        abrirModal(visita);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        fecharModal();
      }
    });

    document.querySelector("[data-visit-form]")?.addEventListener("submit", (event) => {
      salvarVisita(event, elementos);
    });

    carregarVisitas(elementos);
  }

  aoCarregar(configurarTelaVisitas);
})();
