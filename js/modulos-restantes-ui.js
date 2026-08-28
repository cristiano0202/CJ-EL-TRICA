(function () {
  const estado = {};

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

  function codigo(prefixo, registro) {
    const id = String(registro.id || "").replaceAll("-", "").slice(0, 6).toUpperCase();
    return id ? `#${prefixo}-${id}` : `#${prefixo}`;
  }

  function formatarData(data) {
    if (!data) {
      return "Sem data";
    }

    const [ano, mes, dia] = String(data).split("-");
    return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
  }

  function formatarHora(hora) {
    return hora ? String(hora).slice(0, 5) : "Sem hora";
  }

  function valorHoraInput(hora) {
    return hora ? String(hora).slice(0, 5) : "";
  }

  function moeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
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

    if (normalizado.includes("concl") || normalizado.includes("aprov") || normalizado.includes("receb") || normalizado.includes("pago") || normalizado.includes("normal") || normalizado.includes("em dia")) {
      return "completed";
    }

    if (normalizado.includes("andamento") || normalizado.includes("exec") || normalizado.includes("rota") || normalizado.includes("reserv") || normalizado.includes("hoje")) {
      return "in-progress";
    }

    return "pending";
  }

  function classePrioridade(prioridade) {
    const normalizado = String(prioridade || "").toLowerCase();

    if (normalizado.includes("alta") || normalizado.includes("urgent")) {
      return "high";
    }

    if (normalizado.includes("media") || normalizado.includes("média")) {
      return "medium";
    }

    return "normal";
  }

  function campoHtml(campo) {
    const opcoes = (campo.options || []).map((opcao) => `<option>${textoSeguro(opcao)}</option>`).join("");
    const required = campo.required ? " required" : "";
    const wide = campo.wide ? " client-form-wide" : "";
    const placeholder = campo.placeholder ? ` placeholder="${textoSeguro(campo.placeholder)}"` : "";

    if (campo.type === "textarea") {
      return `
        <label class="field-box${wide}">
          <span>${textoSeguro(campo.label)}</span>
          <textarea name="${textoSeguro(campo.name)}" rows="3"${placeholder}${required}></textarea>
        </label>
      `;
    }

    if (campo.type === "select") {
      return `
        <label class="field-box${wide}">
          <span>${textoSeguro(campo.label)}</span>
          <select name="${textoSeguro(campo.name)}"${required}>${opcoes}</select>
        </label>
      `;
    }

    return `
      <label class="field-box${wide}">
        <span>${textoSeguro(campo.label)}</span>
        <input type="${textoSeguro(campo.type || "text")}" name="${textoSeguro(campo.name)}"${placeholder}${required}>
      </label>
    `;
  }

  function garantirModal() {
    let modal = document.querySelector("[data-module-modal]");

    if (!modal) {
      document.body.insertAdjacentHTML("beforeend", '<div class="client-modal module-modal" data-module-modal hidden></div>');
      modal = document.querySelector("[data-module-modal]");
    }

    return modal;
  }

  function setMensagem(mensagem, tipo) {
    const feedback = document.querySelector("[data-module-feedback]");

    if (!feedback) {
      return;
    }

    feedback.textContent = mensagem || "";
    feedback.dataset.type = tipo || "";
  }

  function abrirModal(config, elementos, registro) {
    const modal = garantirModal();

    modal.innerHTML = `
      <div class="client-modal-backdrop" data-module-close></div>
      <section class="client-modal-panel" role="dialog" aria-modal="true" aria-labelledby="module-modal-title">
        <form class="client-form" data-module-form>
          <div class="client-modal-header">
            <div>
              <p class="eyebrow">${textoSeguro(config.eyebrow)}</p>
              <h2 id="module-modal-title">${textoSeguro(registro?.id ? config.editTitle : config.newTitle)}</h2>
            </div>
            <button class="icon-action" type="button" data-module-close aria-label="Fechar">x</button>
          </div>

          <input type="hidden" name="id">

          <div class="client-form-grid">
            ${config.fields.map(campoHtml).join("")}
          </div>

          <p class="client-feedback" data-module-feedback></p>

          <div class="client-modal-actions">
            <button class="secondary-action" type="button" data-module-close>Cancelar</button>
            <button class="primary-action module-save-action" type="submit">${textoSeguro(config.saveText)}</button>
          </div>
        </form>
      </section>
    `;

    const form = modal.querySelector("[data-module-form]");
    form.elements.id.value = registro?.id || "";

    config.fields.forEach((campo) => {
      if (!form.elements[campo.name]) {
        return;
      }

      const valor = registro?.[campo.name];

      if (campo.type === "time") {
        form.elements[campo.name].value = valorHoraInput(valor);
      } else if (campo.currency) {
        form.elements[campo.name].value = valorInput(valor);
      } else {
        form.elements[campo.name].value = valor ?? campo.defaultValue ?? "";
      }
    });

    form.addEventListener("submit", (event) => salvarRegistro(event, config, elementos));
    modal.hidden = false;
    document.body.classList.add("client-modal-open");

    const primeiroCampo = form.querySelector("input:not([type='hidden']), select, textarea");
    primeiroCampo?.focus();
  }

  function fecharModal() {
    const modal = document.querySelector("[data-module-modal]");

    if (!modal) {
      return;
    }

    modal.hidden = true;
    document.body.classList.remove("client-modal-open");
  }

  function dadosFormulario(form, config) {
    const dados = new FormData(form);
    const saida = {};

    config.fields.forEach((campo) => {
      saida[campo.name] = dados.get(campo.name);
    });

    return saida;
  }

  function obterElementos(config) {
    const tela = document.querySelector(config.screen);

    if (!tela) {
      return null;
    }

    return {
      tela,
      botaoNovo: tela.querySelector(".topbar .primary-action"),
      ferramentas: tela.querySelector(".client-tools"),
      tabela: tela.querySelector(config.tableSelector),
      corpoTabela: tela.querySelector(`${config.tableSelector} tbody`),
      linhaCabecalho: tela.querySelector(`${config.tableSelector} thead tr`),
      cardsResumo: tela.querySelectorAll(`${config.summarySelector} .summary-card strong`)
    };
  }

  function prepararFerramentas(config, elementos) {
    if (!elementos.ferramentas) {
      return;
    }

    elementos.ferramentas.innerHTML = `
      <label class="search-field">
        <span aria-hidden="true">⌕</span>
        <input type="search" placeholder="${textoSeguro(config.searchPlaceholder)}" aria-label="${textoSeguro(config.searchPlaceholder)}">
      </label>
      <select aria-label="Filtrar">
        ${config.filterOptions.map((opcao) => `<option>${textoSeguro(opcao)}</option>`).join("")}
      </select>
      <button class="secondary-action module-refresh-action" type="button" data-record-refresh>Atualizar</button>
    `;

    elementos.busca = elementos.ferramentas.querySelector("input");
    elementos.filtro = elementos.ferramentas.querySelector("select");
  }

  function registrosFiltrados(config) {
    const dados = estado[config.key];
    const busca = dados.busca.toLowerCase();

    return dados.registros.filter((registro) => {
      const texto = config.searchFields.map((campo) => registro[campo]).join(" ").toLowerCase();
      const bateBusca = !busca || texto.includes(busca);
      const bateFiltro = dados.filtro === config.filterOptions[0] || config.matchesFilter(registro, dados.filtro);

      return bateBusca && bateFiltro;
    });
  }

  function renderizarTabela(config, elementos, mensagem) {
    if (!elementos.corpoTabela) {
      return;
    }

    if (mensagem) {
      elementos.corpoTabela.innerHTML = `
        <tr>
          <td colspan="${config.colspan}">
            <div class="table-message">${textoSeguro(mensagem)}</div>
          </td>
        </tr>
      `;
      return;
    }

    const registros = registrosFiltrados(config);

    if (!registros.length) {
      elementos.corpoTabela.innerHTML = `
        <tr>
          <td colspan="${config.colspan}">
            <div class="table-message">${textoSeguro(config.emptyText)}</div>
          </td>
        </tr>
      `;
      return;
    }

    elementos.corpoTabela.innerHTML = registros.map((registro) => config.row(registro)).join("");
  }

  function atualizarCards(config, elementos) {
    const valores = config.summary(estado[config.key].registros);

    valores.forEach((valor, indice) => {
      if (elementos.cardsResumo[indice]) {
        elementos.cardsResumo[indice].textContent = valor;
      }
    });
  }

  async function carregarRegistros(config, elementos) {
    const servico = window[config.crudName];

    if (!servico) {
      renderizarTabela(config, elementos, "Arquivo do Supabase ainda nao carregou.");
      return;
    }

    renderizarTabela(config, elementos, `Carregando ${config.plural}...`);

    try {
      estado[config.key].registros = await servico.listar();
      atualizarCards(config, elementos);
      renderizarTabela(config, elementos);
      config.afterRender?.(estado[config.key].registros, elementos);
    } catch (error) {
      renderizarTabela(config, elementos, `Erro ao carregar ${config.plural}: ${error.message}`);
    }
  }

  async function salvarRegistro(event, config, elementos) {
    event.preventDefault();

    const dados = estado[config.key];
    const servico = window[config.crudName];

    if (dados.salvando || !servico) {
      return;
    }

    const form = event.currentTarget;
    const id = form.elements.id.value;
    const botaoSalvar = form.querySelector(".module-save-action");

    dados.salvando = true;
    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";
    setMensagem("Salvando...", "info");

    try {
      if (id) {
        await servico.alterar(id, dadosFormulario(form, config));
      } else {
        await servico.cadastrar(dadosFormulario(form, config));
      }

      await carregarRegistros(config, elementos);
      fecharModal();
    } catch (error) {
      setMensagem(error.message, "error");
    } finally {
      dados.salvando = false;
      botaoSalvar.disabled = false;
      botaoSalvar.textContent = config.saveText;
    }
  }

  async function excluirRegistro(config, elementos, id) {
    const registro = estado[config.key].registros.find((item) => item.id === id);
    const nome = config.deleteName(registro);

    if (!window.confirm(`Excluir ${nome}?`)) {
      return;
    }

    try {
      await window[config.crudName].excluir(id);
      await carregarRegistros(config, elementos);
    } catch (error) {
      window.alert(`Erro ao excluir: ${error.message}`);
    }
  }

  function iniciarModulo(config) {
    const elementos = obterElementos(config);

    if (!elementos || elementos.tela.dataset.moduleReady === "true") {
      return;
    }

    elementos.tela.dataset.moduleReady = "true";
    estado[config.key] = {
      registros: [],
      busca: "",
      filtro: config.filterOptions[0],
      salvando: false
    };

    if (elementos.linhaCabecalho) {
      elementos.linhaCabecalho.innerHTML = config.headers;
    }

    prepararFerramentas(config, elementos);

    elementos.botaoNovo?.addEventListener("click", () => abrirModal(config, elementos));

    elementos.busca?.addEventListener("input", (event) => {
      estado[config.key].busca = event.target.value;
      renderizarTabela(config, elementos);
    });

    elementos.filtro?.addEventListener("change", (event) => {
      estado[config.key].filtro = event.target.value;
      renderizarTabela(config, elementos);
    });

    elementos.tela.addEventListener("click", (event) => {
      const atualizar = event.target.closest("[data-record-refresh]");
      const editar = event.target.closest("[data-record-edit]");
      const excluir = event.target.closest("[data-record-delete]");

      if (atualizar) {
        carregarRegistros(config, elementos);
      }

      if (editar) {
        const registro = estado[config.key].registros.find((item) => item.id === editar.dataset.recordEdit);
        abrirModal(config, elementos, registro);
      }

      if (excluir) {
        excluirRegistro(config, elementos, excluir.dataset.recordDelete);
      }
    });

    carregarRegistros(config, elementos);
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-module-close]")) {
      fecharModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      fecharModal();
    }
  });

  const configs = [
    {
      key: "ordens",
      crudName: "CJOrdens",
      screen: "#ordens",
      tableSelector: ".order-table",
      summarySelector: ".order-summary-grid",
      prefix: "OS",
      plural: "ordens",
      eyebrow: "Execucao",
      newTitle: "Nova ordem de servico",
      editTitle: "Editar ordem de servico",
      saveText: "Salvar OS",
      searchPlaceholder: "Buscar OS",
      emptyText: "Nenhuma ordem de servico cadastrada.",
      filterOptions: ["Todas", "Em andamento", "Concluida", "Aguardando material", "Agendada"],
      searchFields: ["cliente_nome", "servico", "tecnico", "status", "prioridade"],
      matchesFilter: (registro, filtro) => registro.status === filtro,
      deleteName: (registro) => `OS de ${registro?.cliente_nome || "cliente"}`,
      fields: [
        { name: "cliente_nome", label: "Cliente", required: true },
        { name: "servico", label: "Servico", required: true },
        { name: "tecnico", label: "Tecnico" },
        { name: "prazo", label: "Prazo", type: "date", defaultValue: hojeISO() },
        { name: "status", label: "Status", type: "select", options: ["Em andamento", "Em execucao", "Agendada", "Aguardando material", "Concluida", "Cancelada"] },
        { name: "prioridade", label: "Prioridade", type: "select", options: ["Normal", "Media", "Alta", "Urgente"] },
        { name: "valor_total", label: "Valor", currency: true, placeholder: "0,00" },
        { name: "descricao", label: "Descricao", type: "textarea", wide: true },
        { name: "observacoes", label: "Observacoes", type: "textarea", wide: true }
      ],
      headers: "<th>OS</th><th>Cliente</th><th>Servico</th><th>Tecnico</th><th>Prazo</th><th>Status</th><th>Valor</th><th>Acoes</th>",
      colspan: 8,
      row: (registro) => `
        <tr>
          <td><strong>${textoSeguro(codigo("OS", registro))}</strong><small>${textoSeguro(registro.prioridade || "Normal")}</small></td>
          <td>${textoSeguro(registro.cliente_nome)}</td>
          <td>${textoSeguro(registro.servico)}</td>
          <td>${textoSeguro(registro.tecnico || "Sem tecnico")}</td>
          <td>${textoSeguro(formatarData(registro.prazo))}</td>
          <td><span class="status ${classeStatus(registro.status)}">${textoSeguro(registro.status || "Em andamento")}</span></td>
          <td><strong>${textoSeguro(moeda(registro.valor_total))}</strong></td>
          <td><div class="table-actions"><button class="table-action" type="button" data-record-edit="${textoSeguro(registro.id)}">Editar</button><button class="table-action danger" type="button" data-record-delete="${textoSeguro(registro.id)}">Excluir</button></div></td>
        </tr>
      `,
      summary: (registros) => {
        const andamento = registros.filter((item) => String(item.status || "").toLowerCase().includes("andamento") || String(item.status || "").toLowerCase().includes("exec")).length;
        const concluidas = registros.filter((item) => String(item.status || "").toLowerCase().includes("concl")).length;
        const material = registros.filter((item) => String(item.status || "").toLowerCase().includes("material")).length;
        const valor = registros.filter((item) => !String(item.status || "").toLowerCase().includes("concl")).reduce((soma, item) => soma + Number(item.valor_total || 0), 0);
        return [andamento, concluidas, material, moeda(valor)];
      },
      afterRender: (registros, elementos) => renderizarListaInspecao(elementos.tela, registros, "ordens")
    },
    {
      key: "materiais",
      crudName: "CJMateriais",
      screen: "#materiais",
      tableSelector: ".material-table",
      summarySelector: ".material-summary-grid",
      plural: "materiais",
      eyebrow: "Estoque",
      newTitle: "Novo material",
      editTitle: "Editar material",
      saveText: "Salvar material",
      searchPlaceholder: "Buscar material",
      emptyText: "Nenhum material cadastrado.",
      filterOptions: ["Todos", "Estoque baixo", "Normal", "Reservado"],
      searchFields: ["codigo", "nome", "categoria", "status", "fornecedor"],
      matchesFilter: (registro, filtro) => filtro === "Estoque baixo" ? Number(registro.estoque || 0) <= Number(registro.estoque_minimo || 0) : registro.status === filtro,
      deleteName: (registro) => registro?.nome || "material",
      fields: [
        { name: "codigo", label: "Codigo", placeholder: "MAT-001" },
        { name: "nome", label: "Material", required: true },
        { name: "categoria", label: "Categoria", type: "select", options: ["Cabos", "Disjuntores", "Infraestrutura", "Acabamento", "Quadros", "Geral"] },
        { name: "estoque", label: "Estoque", type: "number" },
        { name: "unidade", label: "Unidade", type: "select", options: ["un", "m", "cx", "kg", "rolo"] },
        { name: "estoque_minimo", label: "Minimo", type: "number" },
        { name: "valor_unitario", label: "Valor unitario", currency: true, placeholder: "0,00" },
        { name: "status", label: "Status", type: "select", options: ["Normal", "Baixo", "Reservado", "Indisponivel"] },
        { name: "fornecedor", label: "Fornecedor", wide: true },
        { name: "observacoes", label: "Observacoes", type: "textarea", wide: true }
      ],
      headers: "<th>Codigo</th><th>Material</th><th>Categoria</th><th>Estoque</th><th>Minimo</th><th>Status</th><th>Valor unit.</th><th>Acoes</th>",
      colspan: 8,
      row: (registro) => {
        const baixo = Number(registro.estoque || 0) <= Number(registro.estoque_minimo || 0);
        const status = baixo ? "Baixo" : (registro.status || "Normal");
        return `
          <tr>
            <td>${textoSeguro(registro.codigo || codigo("MAT", registro))}</td>
            <td><strong>${textoSeguro(registro.nome)}</strong><small>${textoSeguro(registro.fornecedor || "Sem fornecedor")}</small></td>
            <td>${textoSeguro(registro.categoria || "Geral")}</td>
            <td>${textoSeguro(`${registro.estoque || 0} ${registro.unidade || "un"}`)}</td>
            <td>${textoSeguro(`${registro.estoque_minimo || 0} ${registro.unidade || "un"}`)}</td>
            <td><span class="status ${classeStatus(status)}">${textoSeguro(status)}</span></td>
            <td>${textoSeguro(moeda(registro.valor_unitario))}</td>
            <td><div class="table-actions"><button class="table-action" type="button" data-record-edit="${textoSeguro(registro.id)}">Editar</button><button class="table-action danger" type="button" data-record-delete="${textoSeguro(registro.id)}">Excluir</button></div></td>
          </tr>
        `;
      },
      summary: (registros) => {
        const baixo = registros.filter((item) => Number(item.estoque || 0) <= Number(item.estoque_minimo || 0)).length;
        const valor = registros.reduce((soma, item) => soma + Number(item.estoque || 0) * Number(item.valor_unitario || 0), 0);
        return [registros.length, baixo, 0, moeda(valor)];
      },
      afterRender: (registros, elementos) => renderizarMateriaisCriticos(elementos.tela, registros)
    },
    {
      key: "financeiro",
      crudName: "CJFinanceiro",
      screen: "#financeiro",
      tableSelector: ".finance-table",
      summarySelector: ".finance-summary-grid",
      plural: "lancamentos",
      eyebrow: "Financeiro",
      newTitle: "Novo lancamento",
      editTitle: "Editar lancamento",
      saveText: "Salvar lancamento",
      searchPlaceholder: "Buscar lancamento",
      emptyText: "Nenhum lancamento cadastrado.",
      filterOptions: ["Todos", "Receita", "Despesa", "A receber", "A pagar", "Vencido"],
      searchFields: ["documento", "descricao", "tipo", "status", "cliente_nome"],
      matchesFilter: (registro, filtro) => registro.tipo === filtro || registro.status === filtro,
      deleteName: (registro) => registro?.descricao || "lancamento",
      fields: [
        { name: "documento", label: "Documento", placeholder: "REC-001" },
        { name: "descricao", label: "Descricao", required: true },
        { name: "tipo", label: "Tipo", type: "select", options: ["Receita", "Despesa"] },
        { name: "vencimento", label: "Vencimento", type: "date", defaultValue: hojeISO() },
        { name: "status", label: "Status", type: "select", options: ["A receber", "A pagar", "Recebido", "Pago", "Vencido"] },
        { name: "valor", label: "Valor", currency: true, placeholder: "0,00" },
        { name: "cliente_nome", label: "Cliente/Fornecedor", wide: true },
        { name: "forma_pagamento", label: "Forma de pagamento", wide: true },
        { name: "observacoes", label: "Observacoes", type: "textarea", wide: true }
      ],
      headers: "<th>Documento</th><th>Descricao</th><th>Tipo</th><th>Vencimento</th><th>Status</th><th>Valor</th><th>Acoes</th>",
      colspan: 7,
      row: (registro) => `
        <tr>
          <td>${textoSeguro(registro.documento || codigo(registro.tipo === "Despesa" ? "PAG" : "REC", registro))}</td>
          <td><strong>${textoSeguro(registro.descricao)}</strong><small>${textoSeguro(registro.cliente_nome || "Sem cliente")}</small></td>
          <td>${textoSeguro(registro.tipo || "Receita")}</td>
          <td>${textoSeguro(formatarData(registro.vencimento))}</td>
          <td><span class="status ${classeStatus(registro.status)}">${textoSeguro(registro.status || "A receber")}</span></td>
          <td><strong>${textoSeguro(moeda(registro.valor))}</strong></td>
          <td><div class="table-actions"><button class="table-action" type="button" data-record-edit="${textoSeguro(registro.id)}">Editar</button><button class="table-action danger" type="button" data-record-delete="${textoSeguro(registro.id)}">Excluir</button></div></td>
        </tr>
      `,
      summary: (registros) => {
        const receber = registros.filter((item) => item.tipo === "Receita" && !String(item.status || "").toLowerCase().includes("receb")).reduce((soma, item) => soma + Number(item.valor || 0), 0);
        const receita = registros.filter((item) => item.tipo === "Receita").reduce((soma, item) => soma + Number(item.valor || 0), 0);
        const despesa = registros.filter((item) => item.tipo === "Despesa").reduce((soma, item) => soma + Number(item.valor || 0), 0);
        return [moeda(receber), moeda(receita), moeda(despesa), moeda(receita - despesa)];
      }
    },
    {
      key: "manutencoes",
      crudName: "CJManutencoes",
      screen: "#manutencoes",
      tableSelector: ".maintenance-table",
      summarySelector: ".maintenance-summary-grid",
      plural: "manutencoes",
      eyebrow: "Manutencao",
      newTitle: "Nova manutencao",
      editTitle: "Editar manutencao",
      saveText: "Salvar manutencao",
      searchPlaceholder: "Buscar manutencao",
      emptyText: "Nenhuma manutencao cadastrada.",
      filterOptions: ["Todas", "Preventiva", "Corretiva", "Agendada", "Concluida", "Vencendo"],
      searchFields: ["cliente_nome", "tipo", "periodicidade", "status", "tecnico"],
      matchesFilter: (registro, filtro) => registro.tipo === filtro || registro.status === filtro,
      deleteName: (registro) => `manutencao de ${registro?.cliente_nome || "cliente"}`,
      fields: [
        { name: "cliente_nome", label: "Cliente", required: true },
        { name: "tipo", label: "Tipo", type: "select", options: ["Preventiva", "Corretiva"] },
        { name: "periodicidade", label: "Periodicidade", type: "select", options: ["Avulsa", "Semanal", "Quinzenal", "Mensal", "Bimestral", "Trimestral"] },
        { name: "proxima_visita", label: "Proxima visita", type: "date", defaultValue: hojeISO() },
        { name: "status", label: "Status", type: "select", options: ["Agendada", "Em execucao", "Em dia", "Vencendo", "Concluida", "Cancelada"] },
        { name: "valor", label: "Valor", currency: true, placeholder: "0,00" },
        { name: "tecnico", label: "Tecnico", wide: true },
        { name: "observacoes", label: "Observacoes", type: "textarea", wide: true }
      ],
      headers: "<th>Codigo</th><th>Cliente</th><th>Tipo</th><th>Periodicidade</th><th>Proxima visita</th><th>Status</th><th>Valor</th><th>Acoes</th>",
      colspan: 8,
      row: (registro) => `
        <tr>
          <td>${textoSeguro(codigo("MN", registro))}</td>
          <td><strong>${textoSeguro(registro.cliente_nome)}</strong><small>${textoSeguro(registro.tecnico || "Sem tecnico")}</small></td>
          <td>${textoSeguro(registro.tipo || "Preventiva")}</td>
          <td>${textoSeguro(registro.periodicidade || "Avulsa")}</td>
          <td>${textoSeguro(formatarData(registro.proxima_visita))}</td>
          <td><span class="status ${classeStatus(registro.status)}">${textoSeguro(registro.status || "Agendada")}</span></td>
          <td>${textoSeguro(moeda(registro.valor))}</td>
          <td><div class="table-actions"><button class="table-action" type="button" data-record-edit="${textoSeguro(registro.id)}">Editar</button><button class="table-action danger" type="button" data-record-delete="${textoSeguro(registro.id)}">Excluir</button></div></td>
        </tr>
      `,
      summary: (registros) => {
        const ativos = registros.filter((item) => !String(item.status || "").toLowerCase().includes("cancel")).length;
        const preventivas = registros.filter((item) => item.tipo === "Preventiva" && !String(item.status || "").toLowerCase().includes("concl")).length;
        const concluidas = registros.filter((item) => String(item.status || "").toLowerCase().includes("concl")).length;
        const receita = registros.reduce((soma, item) => soma + Number(item.valor || 0), 0);
        return [ativos, preventivas, concluidas, moeda(receita)];
      },
      afterRender: (registros, elementos) => renderizarListaInspecao(elementos.tela, registros, "manutencoes")
    },
    {
      key: "agenda",
      crudName: "CJAgenda",
      screen: "#agenda",
      tableSelector: ".agenda-table",
      summarySelector: ".agenda-summary-grid",
      plural: "agendamentos",
      eyebrow: "Agenda",
      newTitle: "Novo agendamento",
      editTitle: "Editar agendamento",
      saveText: "Salvar agendamento",
      searchPlaceholder: "Buscar agenda",
      emptyText: "Nenhum agendamento cadastrado.",
      filterOptions: ["Todos", "Visita tecnica", "Manutencao", "Instalacao", "Agendado", "Confirmado", "Concluido"],
      searchFields: ["cliente_nome", "servico", "tecnico", "tipo", "status"],
      matchesFilter: (registro, filtro) => registro.tipo === filtro || registro.status === filtro,
      deleteName: (registro) => `agendamento de ${registro?.cliente_nome || "cliente"}`,
      fields: [
        { name: "cliente_nome", label: "Cliente", required: true },
        { name: "servico", label: "Servico", required: true },
        { name: "tecnico", label: "Tecnico" },
        { name: "data_agendamento", label: "Data", type: "date", required: true, defaultValue: hojeISO() },
        { name: "horario", label: "Horario", type: "time" },
        { name: "tipo", label: "Tipo", type: "select", options: ["Visita tecnica", "Manutencao", "Instalacao", "Orcamento", "Servico"] },
        { name: "status", label: "Status", type: "select", options: ["Agendado", "Confirmado", "Em andamento", "Concluido", "Cancelado"] },
        { name: "prioridade", label: "Prioridade", type: "select", options: ["Normal", "Media", "Alta", "Urgente"] },
        { name: "observacoes", label: "Observacoes", type: "textarea", wide: true }
      ],
      headers: "<th>Data</th><th>Horario</th><th>Cliente</th><th>Servico</th><th>Tecnico</th><th>Status</th><th>Acoes</th>",
      colspan: 7,
      row: (registro) => `
        <tr>
          <td>${textoSeguro(formatarData(registro.data_agendamento))}</td>
          <td>${textoSeguro(formatarHora(registro.horario))}</td>
          <td><strong>${textoSeguro(registro.cliente_nome)}</strong><small>${textoSeguro(registro.tipo || "Servico")}</small></td>
          <td>${textoSeguro(registro.servico)}</td>
          <td>${textoSeguro(registro.tecnico || "Sem tecnico")}</td>
          <td><span class="status ${classeStatus(registro.status)}">${textoSeguro(registro.status || "Agendado")}</span></td>
          <td><div class="table-actions"><button class="table-action" type="button" data-record-edit="${textoSeguro(registro.id)}">Editar</button><button class="table-action danger" type="button" data-record-delete="${textoSeguro(registro.id)}">Excluir</button></div></td>
        </tr>
      `,
      summary: (registros) => {
        const hoje = hojeISO();
        const hojeTotal = registros.filter((item) => item.data_agendamento === hoje).length;
        const concluidos = registros.filter((item) => item.data_agendamento === hoje && String(item.status || "").toLowerCase().includes("concl")).length;
        const orcamentos = registros.filter((item) => String(item.tipo || "").toLowerCase().includes("orc")).length;
        const tecnicos = new Set(registros.map((item) => item.tecnico).filter(Boolean)).size;
        return [hojeTotal, concluidos, orcamentos, tecnicos];
      },
      afterRender: renderizarAgendaHoje
    }
  ];

  function renderizarListaInspecao(tela, registros, tipo) {
    const lista = tela.querySelector(".inspection-list");

    if (!lista) {
      return;
    }

    const proximos = registros.slice(0, 3);

    if (!proximos.length) {
      lista.innerHTML = '<div class="inspection-item normal"><time>--</time><div><strong>Nenhum item</strong><span>Cadastre um novo registro.</span></div></div>';
      return;
    }

    lista.innerHTML = proximos.map((item) => {
      const data = tipo === "manutencoes" ? item.proxima_visita : item.prazo;
      return `
        <div class="inspection-item ${classePrioridade(item.prioridade)}">
          <time>${textoSeguro(formatarData(data).slice(0, 5))}</time>
          <div>
            <strong>${textoSeguro(item.cliente_nome)}</strong>
            <span>${textoSeguro(item.servico || item.tipo || "Servico tecnico")}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderizarMateriaisCriticos(tela, registros) {
    const lista = tela.querySelector(".material-alert-list");

    if (!lista) {
      return;
    }

    const criticos = registros
      .filter((item) => Number(item.estoque || 0) <= Number(item.estoque_minimo || 0))
      .slice(0, 3);

    if (!criticos.length) {
      lista.innerHTML = '<div class="material-alert normal"><strong>Estoque em dia</strong><span>Nenhum material abaixo do minimo.</span></div>';
      return;
    }

    lista.innerHTML = criticos.map((item) => `
      <div class="material-alert high">
        <strong>${textoSeguro(item.nome)}</strong>
        <span>${textoSeguro(`${item.estoque || 0} ${item.unidade || "un"} disponiveis - minimo ${item.estoque_minimo || 0}`)}</span>
      </div>
    `).join("");
  }

  function renderizarAgendaHoje(registros, elementos) {
    const lista = elementos.tela.querySelector(".timeline-list");

    if (!lista) {
      return;
    }

    const hoje = hojeISO();
    const itens = registros.filter((item) => item.data_agendamento === hoje).slice(0, 4);

    if (!itens.length) {
      lista.innerHTML = '<div class="timeline-item normal"><time>--:--</time><div><strong>Nenhum agendamento hoje</strong><span>Cadastre um novo agendamento.</span></div><span class="priority normal">Livre</span></div>';
      return;
    }

    lista.innerHTML = itens.map((item) => `
      <div class="timeline-item ${classePrioridade(item.prioridade)}">
        <time>${textoSeguro(formatarHora(item.horario))}</time>
        <div>
          <strong>${textoSeguro(item.servico)}</strong>
          <span>${textoSeguro(`${item.cliente_nome} - ${item.tecnico || "Sem tecnico"}`)}</span>
        </div>
        <span class="priority ${classePrioridade(item.prioridade)}">${textoSeguro(item.prioridade || "Normal")}</span>
      </div>
    `).join("");
  }

  function iniciarRelatorios() {
    const tela = document.querySelector("#relatorios");

    if (!tela || tela.dataset.relatoriosUi === "true") {
      return;
    }

    tela.dataset.relatoriosUi = "true";
    const botao = tela.querySelector(".topbar .primary-action");

    botao?.addEventListener("click", () => {
      const linhas = Array.from(tela.querySelectorAll(".report-table tr")).map((linha) =>
        Array.from(linha.children).map((celula) => `"${celula.textContent.trim().replaceAll('"', '""')}"`).join(";")
      );
      const arquivo = new Blob([linhas.join("\n")], { type: "text/csv;charset=utf-8" });
      const link = document.createElement("a");

      link.href = URL.createObjectURL(arquivo);
      link.download = "relatorio-cj-eletrica.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    });
  }

  function iniciarConfiguracoes() {
    const tela = document.querySelector("#configuracoes");

    if (!tela || tela.dataset.configuracoesUi === "true") {
      return;
    }

    tela.dataset.configuracoesUi = "true";
    const botaoSalvar = tela.querySelector(".topbar .primary-action");
    const campos = tela.querySelectorAll(".settings-form-grid input");
    const nomes = ["empresa_nome", "cnpj", "telefone", "email"];

    campos.forEach((campo, indice) => {
      campo.name = nomes[indice] || "";
    });

    tela.querySelectorAll(".language-option").forEach((botao) => {
      botao.addEventListener("click", () => {
        tela.querySelectorAll(".language-option").forEach((item) => item.classList.remove("active"));
        botao.classList.add("active");
      });
    });

    tela.querySelectorAll(".toggle-row").forEach((linha) => {
      linha.addEventListener("click", () => {
        linha.querySelector(".fake-toggle")?.classList.toggle("active");
      });
    });

    async function carregar() {
      try {
        const salvoLocal = JSON.parse(localStorage.getItem("cj-configuracoes") || "{}");
        const salvoBanco = window.CJConfiguracoes ? await window.CJConfiguracoes.carregar() : null;
        const dados = salvoBanco || salvoLocal;

        campos[0].value = dados.empresa_nome || "CJ Eletrica";
        campos[1].value = dados.cnpj || "";
        campos[2].value = dados.telefone || "";
        campos[3].value = dados.email || "";
      } catch (error) {
        campos[0].value = "CJ Eletrica";
      }
    }

    botaoSalvar?.addEventListener("click", async () => {
      const idiomaAtivo = tela.querySelector(".language-option.active strong")?.textContent || "Portugues (Brasil)";
      const toggles = tela.querySelectorAll(".fake-toggle");
      const dados = {
        empresa_nome: campos[0]?.value,
        cnpj: campos[1]?.value,
        telefone: campos[2]?.value,
        email: campos[3]?.value,
        idioma: idiomaAtivo,
        notificar_visitas: toggles[0]?.classList.contains("active"),
        controle_estoque: toggles[1]?.classList.contains("active"),
        financeiro_simplificado: toggles[2]?.classList.contains("active")
      };

      localStorage.setItem("cj-configuracoes", JSON.stringify(dados));
      botaoSalvar.disabled = true;
      botaoSalvar.textContent = "Salvando...";

      try {
        if (window.CJConfiguracoes) {
          await window.CJConfiguracoes.salvar(dados);
        }

        botaoSalvar.textContent = "Salvo";
        window.setTimeout(() => {
          botaoSalvar.innerHTML = '<span aria-hidden="true">✓</span> Salvar visual';
          botaoSalvar.disabled = false;
        }, 1400);
      } catch (error) {
        botaoSalvar.textContent = "Erro ao salvar";
        window.setTimeout(() => {
          botaoSalvar.innerHTML = '<span aria-hidden="true">✓</span> Salvar visual';
          botaoSalvar.disabled = false;
        }, 1800);
      }
    });

    carregar();
  }

  aoCarregar(() => {
    configs.forEach(iniciarModulo);
    iniciarRelatorios();
    iniciarConfiguracoes();
  });
})();
