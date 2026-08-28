const body = document.body;
const menuToggles = document.querySelectorAll(".menu-toggle");
const closeTargets = document.querySelectorAll("[data-close-menu], .sidebar .nav-item");
const loginStorageKey = "cj-eletrica-login-visual";
const legacyLoginSessionKey = "cj-eletrica-sessao-login";
const loginSessionKey = "cj-eletrica-sessao-login-v2";
const loginUsersKey = "cj-eletrica-usuarios-login";

function setMenuState(isOpen) {
  body.classList.toggle("menu-open", isOpen);
  menuToggles.forEach((toggle) => {
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

function showScreen(screenName) {
  const nextScreen = document.querySelector(`[data-screen="${screenName}"]`);

  if (!nextScreen) {
    return false;
  }

  document.querySelectorAll("[data-screen]").forEach((screen) => {
    screen.classList.toggle("active", screen === nextScreen);
  });

  document.querySelectorAll("[data-screen-link]").forEach((link) => {
    const isActive = link.dataset.screenLink === screenName;
    link.classList.toggle("active", isActive);

    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  const titles = {
    dashboard: "CJ Elétrica | Dashboard",
    clientes: "CJ Elétrica | Clientes",
    visitas: "CJ Elétrica | Visitas Técnicas",
    orcamentos: "CJ Elétrica | Orçamentos",
    ordens: "CJ Elétrica | Ordens de Serviço",
    materiais: "CJ Elétrica | Materiais",
    financeiro: "CJ Elétrica | Financeiro",
    manutencoes: "CJ Elétrica | Manutenções",
    relatorios: "CJ Elétrica | Relatórios",
    configuracoes: "CJ Elétrica | Configurações",
    agenda: "CJ Elétrica | Agenda"
  };

  document.title = titles[screenName] || "CJ Elétrica";
  return true;
}

menuToggles.forEach((toggle) => {
  toggle.addEventListener("click", () => {
    setMenuState(!body.classList.contains("menu-open"));
  });
});

document.addEventListener("click", (event) => {
  const link = event.target.closest("[data-screen-link]");

  if (!link) {
    return;
  }

  event.preventDefault();
  const screenName = link.dataset.screenLink;

  if (showScreen(screenName) && window.location.hash !== `#${screenName}`) {
    window.location.hash = screenName;
  }
});

closeTargets.forEach((target) => {
  target.addEventListener("click", () => {
    if (window.matchMedia("(max-width: 820px)").matches) {
      setMenuState(false);
    }
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    setMenuState(false);
  }
});

window.addEventListener("resize", () => {
  if (!window.matchMedia("(max-width: 820px)").matches) {
    setMenuState(false);
  }
});

window.addEventListener("hashchange", () => {
  const screenName = window.location.hash.replace("#", "");
  showScreen(screenName || "dashboard");
});

const initialScreen = window.location.hash.replace("#", "") || "dashboard";
showScreen(initialScreen) || showScreen("dashboard");

function usuarioLogadoVisualmente() {
  return Boolean(
    localStorage.getItem(loginSessionKey) ||
    sessionStorage.getItem(loginSessionKey)
  );
}

function limparSessoesLogin() {
  localStorage.removeItem(loginStorageKey);
  sessionStorage.removeItem(loginStorageKey);
  localStorage.removeItem(legacyLoginSessionKey);
  sessionStorage.removeItem(legacyLoginSessionKey);
  localStorage.removeItem(loginSessionKey);
  sessionStorage.removeItem(loginSessionKey);
}

function emailNormalizado(email) {
  return String(email || "").trim().toLowerCase();
}

function lerUsuariosLogin() {
  try {
    const usuarios = JSON.parse(localStorage.getItem(loginUsersKey) || "[]");
    return Array.isArray(usuarios) ? usuarios : [];
  } catch (error) {
    return [];
  }
}

function salvarUsuariosLogin(usuarios) {
  localStorage.setItem(loginUsersKey, JSON.stringify(usuarios));
}

function criarSessaoLogin(usuario, lembrar) {
  const sessao = JSON.stringify({
    nome: usuario.nome,
    email: usuario.email,
    data: new Date().toISOString()
  });

  limparSessoesLogin();

  if (lembrar) {
    localStorage.setItem(loginSessionKey, sessao);
  } else {
    sessionStorage.setItem(loginSessionKey, sessao);
  }
}

function mostrarSistema() {
  body.classList.remove("login-locked");
  document.title = "CJ Elétrica | Dashboard";

  if (!window.location.hash) {
    window.location.hash = "dashboard";
  }

  showScreen(window.location.hash.replace("#", "") || "dashboard");
}

function mostrarLogin() {
  body.classList.add("login-locked");
  setMenuState(false);
  document.title = "CJ Elétrica | Login";

  const email = document.querySelector("[data-login-form] input[name='email']");
  window.setTimeout(() => email?.focus(), 80);
}

function alternarModoLogin(modo) {
  const formLogin = document.querySelector("[data-login-form]");
  const formCadastro = document.querySelector("[data-register-form]");
  const botaoCadastro = document.querySelector("[data-show-register]");
  const botaoLogin = document.querySelector("[data-show-login]");
  const titulo = document.querySelector("[data-login-title]");
  const subtitulo = document.querySelector("[data-login-subtitle]");
  const loginFeedback = document.querySelector("[data-login-feedback]");
  const cadastroFeedback = document.querySelector("[data-register-feedback]");
  const cadastroAtivo = modo === "cadastro";

  if (!formLogin || !formCadastro) {
    return;
  }

  formLogin.hidden = cadastroAtivo;
  formCadastro.hidden = !cadastroAtivo;
  botaoCadastro.hidden = cadastroAtivo;
  botaoLogin.hidden = !cadastroAtivo;
  titulo.textContent = cadastroAtivo ? "Criar usuário" : "Entrar";
  subtitulo.textContent = cadastroAtivo ? "Cadastre um acesso local" : "Área operacional da CJ Elétrica";
  loginFeedback.textContent = "";
  cadastroFeedback.textContent = "";

  const foco = cadastroAtivo ? formCadastro.elements.nome : formLogin.elements.email;
  window.setTimeout(() => foco?.focus(), 80);
}

function configurarLoginVisual() {
  const form = document.querySelector("[data-login-form]");
  const registerForm = document.querySelector("[data-register-form]");
  const feedback = document.querySelector("[data-login-feedback]");
  const registerFeedback = document.querySelector("[data-register-feedback]");
  const showRegister = document.querySelector("[data-show-register]");
  const showLogin = document.querySelector("[data-show-login]");
  const forgot = document.querySelector("[data-login-forgot]");
  const logoutButtons = document.querySelectorAll("[data-logout]");

  if (!form || !registerForm) {
    return;
  }

  if (usuarioLogadoVisualmente()) {
    mostrarSistema();
  } else {
    mostrarLogin();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = emailNormalizado(form.elements.email.value);
    const senha = form.elements.senha.value.trim();
    const lembrar = form.elements.lembrar.checked;

    if (!email || !senha) {
      feedback.textContent = "Informe e-mail e senha para continuar.";
      return;
    }

    const usuario = lerUsuariosLogin().find((item) => item.email === email);

    if (!usuario) {
      feedback.textContent = "Usuário não encontrado. Crie um usuário primeiro.";
      return;
    }

    if (usuario.senha !== senha) {
      feedback.textContent = "Senha incorreta.";
      return;
    }

    feedback.textContent = "";
    criarSessaoLogin(usuario, lembrar);
    mostrarSistema();
  });

  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nome = registerForm.elements.nome.value.trim();
    const email = emailNormalizado(registerForm.elements.email.value);
    const senha = registerForm.elements.senha.value.trim();
    const confirmarSenha = registerForm.elements.confirmarSenha.value.trim();
    const usuarios = lerUsuariosLogin();

    if (!nome || !email || !senha || !confirmarSenha) {
      registerFeedback.textContent = "Preencha todos os campos.";
      return;
    }

    if (senha.length < 4) {
      registerFeedback.textContent = "A senha precisa ter pelo menos 4 caracteres.";
      return;
    }

    if (senha !== confirmarSenha) {
      registerFeedback.textContent = "As senhas não conferem.";
      return;
    }

    if (usuarios.some((usuario) => usuario.email === email)) {
      registerFeedback.textContent = "Este e-mail já foi cadastrado.";
      return;
    }

    const novoUsuario = {
      id: `usuario-${Date.now()}`,
      nome,
      email,
      senha,
      criadoEm: new Date().toISOString()
    };

    salvarUsuariosLogin([...usuarios, novoUsuario]);
    registerFeedback.textContent = "";
    limparSessoesLogin();

    alternarModoLogin("login");
    form.elements.email.value = email;
    form.elements.senha.value = "";
    feedback.textContent = "Usuário criado. Digite a senha para entrar.";
  });

  showRegister?.addEventListener("click", () => alternarModoLogin("cadastro"));
  showLogin?.addEventListener("click", () => alternarModoLogin("login"));
  forgot?.addEventListener("click", () => {
    feedback.textContent = "Recuperação de senha será ligada ao banco depois.";
  });

  logoutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      limparSessoesLogin();
      mostrarLogin();
    });
  });
}

configurarLoginVisual();
