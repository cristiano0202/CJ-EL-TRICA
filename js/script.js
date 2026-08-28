const body = document.body;
const menuToggles = document.querySelectorAll(".menu-toggle");
const closeTargets = document.querySelectorAll("[data-close-menu], .sidebar .nav-item");
const loginStorageKey = "cj-eletrica-login-visual";

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
  return localStorage.getItem(loginStorageKey) === "true" || sessionStorage.getItem(loginStorageKey) === "true";
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

function configurarLoginVisual() {
  const form = document.querySelector("[data-login-form]");
  const demo = document.querySelector("[data-demo-login]");
  const feedback = document.querySelector("[data-login-feedback]");
  const logoutButtons = document.querySelectorAll("[data-logout]");

  if (!form) {
    return;
  }

  if (usuarioLogadoVisualmente()) {
    mostrarSistema();
  } else {
    mostrarLogin();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = form.elements.email.value.trim();
    const senha = form.elements.senha.value.trim();
    const lembrar = form.elements.lembrar.checked;

    if (!email || !senha) {
      feedback.textContent = "Informe e-mail e senha para continuar.";
      return;
    }

    feedback.textContent = "";

    if (lembrar) {
      localStorage.setItem(loginStorageKey, "true");
    } else {
      sessionStorage.setItem(loginStorageKey, "true");
    }

    mostrarSistema();
  });

  demo?.addEventListener("click", () => {
    sessionStorage.setItem(loginStorageKey, "true");
    mostrarSistema();
  });

  logoutButtons.forEach((button) => {
    button.addEventListener("click", () => {
      localStorage.removeItem(loginStorageKey);
      sessionStorage.removeItem(loginStorageKey);
      mostrarLogin();
    });
  });
}

configurarLoginVisual();
