const STORAGE_KEY = "vem-presenca-studio-v2";
const AUTH_KEY = "vem-presenca-admin-auth-v1";
const API_ENDPOINT = "api.php";
const APP_VERSION = "1.0.0";
const APP_BUILD = "2026-07-08.9";
const GITHUB_REPO = "Lhsa050/cruzadamilagres";
const GITHUB_BRANCH = "main";
const THEME_OPTIONS = [
  { id: "light", label: "Claro", description: "Interface limpa e luminosa." },
  { id: "dark", label: "Escuro", description: "Mais contraste para uso noturno." },
  { id: "forest", label: "Amazônia", description: "Verde sofisticado e acolhedor." }
];
const BRAND_POSITION_OPTIONS = [
  { id: "left", label: "Canto esquerdo", description: "Mantém a marca no padrão atual.", icon: "align-left" },
  { id: "center", label: "Centro", description: "Centraliza a logo no cabeçalho.", icon: "align-center" }
];

const DEFAULT_COVER =
  "https://sgowpqlitfuoybtihojo.supabase.co/storage/v1/object/public/event-images/paul-enenche-brasil/capa-1776970008064.jpeg";
const DEFAULT_ORGANIZER =
  "https://sgowpqlitfuoybtihojo.supabase.co/storage/v1/object/public/event-images/paul-enenche-brasil/organizador-1776979586530.jpg";
const BLANK_COVER =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675" viewBox="0 0 1200 675">
    <rect width="1200" height="675" fill="#e7edf3"/>
    <rect x="64" y="64" width="1072" height="547" rx="18" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="18 18"/>
    <text x="600" y="330" text-anchor="middle" fill="#475467" font-family="Arial, sans-serif" font-size="42" font-weight="700">Imagem do evento</text>
    <text x="600" y="382" text-anchor="middle" fill="#667085" font-family="Arial, sans-serif" font-size="24">importe uma imagem ou cole uma URL</text>
  </svg>`);
const BLANK_AVATAR =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <rect width="256" height="256" rx="28" fill="#e7edf3"/>
    <circle cx="128" cy="96" r="42" fill="#94a3b8"/>
    <path d="M54 218c10-50 43-78 74-78s64 28 74 78" fill="#94a3b8"/>
  </svg>`);

const sampleDescription = [
  "CRUZADA FOGO & AVIVAMENTO 2026 + CONFERÊNCIA DE PASTORES",
  "Com Dr. Paul Enenche, pela primeira vez no Brasil.",
  "",
  "São Paulo receberá um dos eventos cristãos mais aguardados de 2026: a Cruzada Fogo & Avivamento, com um encontro de fé, cura, adoração e palavra.",
  "",
  "PROGRAMAÇÃO",
  "18 de junho (quinta-feira) - Cruzada de Milagres, 19h. Aberta ao público.",
  "19 de junho (sexta-feira) - Conferência exclusiva para pastores e líderes, 9h30.",
  "19 de junho (sexta-feira) - Cruzada de Milagres, 19h. Aberta ao público.",
  "",
  "ENTRADA GRATUITA - Inscrição obrigatória."
].join("\n");

let state = loadState();
let selectedEventId = state.events[0]?.id || null;
let adminFilters = { q: "", session: "all", status: "all" };
let adminSection = "dashboard";
let currentModal = null;
let activeRouteKey = "";
let remotePersistenceReady = false;
let remoteSaveTimer = null;
let authRevision = 0;
applyTheme();

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.events?.length) {
        parsed.files = Array.isArray(parsed.files) ? parsed.files : [];
        parsed.site = normalizeSiteSettings(parsed.site);
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Não foi possível ler os dados locais.", error);
  }
  const seeded = seedState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
  return seeded;
}

function normalizeStateShape(nextState) {
  const normalized = nextState && typeof nextState === "object" ? nextState : seedState();
  normalized.events = Array.isArray(normalized.events) ? normalized.events : [];
  normalized.participants = Array.isArray(normalized.participants) ? normalized.participants : [];
  normalized.files = Array.isArray(normalized.files) ? normalized.files : [];
  normalized.site = normalizeSiteSettings(normalized.site);
  return normalized;
}

function seedState() {
  const eventId = "evt_" + randomId(8);
  const event = {
    id: eventId,
    slug: "paul-enenche-brasil",
    title: "Paul Enenche Brasil - 18 e 19 de Junho em São Paulo",
    subtitle: "Cruzada de Milagres e Conferência de Pastores",
    coverUrl: DEFAULT_COVER,
    accent: "#4f7a28",
    dateLabel: "Quinta e sexta - 18 e 19 de junho",
    timeLabel: "19:00",
    gatesLabel: "17:00",
    locationName: "Renascer Arena",
    address: "Av. Marginal Tietê, 3712, São Paulo/SP",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Av+Marginal+Tiete+3712+Sao+Paulo",
    organizerName: "Pr. Pedro Medina",
    organizerPhone: "(47) 99122-2131",
    organizerImage: DEFAULT_ORGANIZER,
    rsvpButtonLabel: "Confirmar presença",
    allowGuests: false,
    whatsappGroupEnabled: false,
    whatsappGroupUrl: "",
    description: sampleDescription,
    createdAt: new Date().toISOString(),
    sessions: [
      { id: "18-noite", label: "18/Jun - Quinta - Cruzada de Milagres (19h)", capacity: 1200, private: false },
      { id: "19-noite", label: "19/Jun - Sexta - Cruzada de Milagres (19h)", capacity: 1200, private: false },
      { id: "19-manha", label: "19/Jun - Sexta manhã - Conferência de Pastores (9h30)", capacity: 350, private: true }
    ]
  };

  const participants = [
    makeParticipant(event, {
      name: "Ana Carolina Alves",
      email: "ana@example.com",
      phone: "(11) 94444-0198",
      city: "São Paulo/SP",
      sessionId: "18-noite"
    }),
    makeParticipant(event, {
      name: "Marcos Vinicius Lima",
      email: "marcos@example.com",
      phone: "(11) 97777-4455",
      city: "Guarulhos/SP",
      sessionId: "19-noite"
    }),
    makeParticipant(event, {
      name: "Pastora Helena Duarte",
      email: "helena@example.com",
      phone: "(21) 98888-7788",
      city: "Rio de Janeiro/RJ",
      sessionId: "19-manha"
    })
  ];

  participants[1].checkInAt = new Date(Date.now() - 1000 * 60 * 46).toISOString();
  return { events: [event], participants, files: [], site: defaultSiteSettings() };
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  applyTheme();
  scheduleRemoteSave();
}

function isAdminAuthenticated() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return false;
    const session = JSON.parse(raw);
    return Boolean(session?.authenticated);
  } catch {
    return false;
  }
}

function setAdminAuthenticated(authenticated) {
  authRevision++;
  if (authenticated) {
    localStorage.setItem(AUTH_KEY, JSON.stringify({ authenticated: true, at: new Date().toISOString() }));
    return;
  }
  localStorage.removeItem(AUTH_KEY);
}

function logoutAdmin() {
  setAdminAuthenticated(false);
  remoteLogout();
  toast("Sessão encerrada.");
  navigateToAdmin();
}

function canUseRemoteApi() {
  return location.protocol === "http:" || location.protocol === "https:";
}

function apiUrl(action) {
  return `${appBasePath()}${API_ENDPOINT}?action=${encodeURIComponent(action)}`;
}

async function apiFetch(action, options = {}) {
  const response = await fetch(apiUrl(action), {
    credentials: "same-origin",
    cache: "no-store",
    ...options
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.error || "Falha na API.");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

async function loadRemoteStateIfAvailable() {
  if (!canUseRemoteApi()) return;
  try {
    const payload = await apiFetch("state");
    if (!payload.state?.events) return;
    remotePersistenceReady = true;
    state = normalizeStateShape(payload.state);
    selectedEventId = eventById(selectedEventId) ? selectedEventId : state.events[0]?.id || null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    applyTheme();

    try {
      const sessionAuthRevision = authRevision;
      const session = await apiFetch("session");
      if (session.admin || sessionAuthRevision === authRevision) {
        setAdminAuthenticated(Boolean(session.admin));
      }
    } catch {
      // Session check is optional for local fallback.
    }
    render();
  } catch {
    remotePersistenceReady = false;
  }
}

function scheduleRemoteSave() {
  if (!remotePersistenceReady || !canUseRemoteApi() || !isAdminAuthenticated()) return;
  window.clearTimeout(remoteSaveTimer);
  remoteSaveTimer = window.setTimeout(() => {
    apiFetch("state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state })
    }).catch(() => toast("Não foi possível salvar no servidor. Verifique o login do admin.", true));
  }, 400);
}

async function remoteLogin(email, password) {
  if (!canUseRemoteApi()) return false;
  try {
    const response = await fetch(apiUrl("login"), {
      credentials: "same-origin",
      cache: "no-store",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const payload = await response.json().catch(() => null);
    if (response.status === 404 || !payload) return null;
    if (!response.ok || payload.ok === false) return false;
    remotePersistenceReady = true;
    return true;
  } catch {
    return null;
  }
}

function remoteLogout() {
  if (!remotePersistenceReady || !canUseRemoteApi()) return;
  apiFetch("logout", { method: "POST" }).catch(() => {});
}

function randomId(length = 12) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, length);
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function imageSrc(value, fallback = BLANK_COVER) {
  return String(value || "").trim() || fallback;
}

function defaultSiteSettings() {
  return {
    activeCssFileId: "",
    brandName: "Vem Presença",
    logoUrl: "",
    brandPosition: "left",
    homeMode: "login",
    homeEventId: "",
    theme: "light"
  };
}

function validThemeId(value) {
  return THEME_OPTIONS.some((theme) => theme.id === value) ? value : "light";
}

function validBrandPosition(value) {
  return BRAND_POSITION_OPTIONS.some((option) => option.id === value) ? value : "left";
}

function validHomeMode(value) {
  return ["login", "event"].includes(value) ? value : "login";
}

function normalizeSiteSettings(site) {
  const settings = { ...defaultSiteSettings(), ...(site && typeof site === "object" ? site : {}) };
  settings.theme = validThemeId(settings.theme);
  settings.brandPosition = validBrandPosition(settings.brandPosition);
  settings.homeMode = validHomeMode(settings.homeMode);
  settings.homeEventId = String(settings.homeEventId || "");
  return settings;
}

function siteSettings() {
  state.site = normalizeSiteSettings(state.site);
  return state.site;
}

function brandName() {
  return siteSettings().brandName.trim();
}

function logoUrl() {
  return siteSettings().logoUrl.trim();
}

function brandPosition() {
  return validBrandPosition(siteSettings().brandPosition);
}

function renderBrandIdentity() {
  const name = brandName();
  const logo = logoUrl();
  const fallbackName = "Vem Presença";
  return `
    ${logo
      ? `<img class="brand-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(name || fallbackName)}">`
      : `<span class="brand-mark"><i data-lucide="qr-code"></i></span>`}
    ${name ? `<span>${escapeHtml(name)}</span>` : (!logo ? `<span>${escapeHtml(fallbackName)}</span>` : "")}
  `;
}

function renderBrandLink(href) {
  return `<a class="brand ${logoUrl() ? "has-logo" : ""}" href="${href}" aria-label="${escapeHtml(brandName() || "Vem Presença")}">${renderBrandIdentity()}</a>`;
}

function renderBrandPositionOptions(selectedPosition) {
  return BRAND_POSITION_OPTIONS.map((option) => `
    <label class="position-option ${selectedPosition === option.id ? "active" : ""}">
      <input name="brandPosition" type="radio" value="${escapeHtml(option.id)}" ${selectedPosition === option.id ? "checked" : ""}>
      <i data-lucide="${escapeHtml(option.icon)}"></i>
      <span>
        <strong>${escapeHtml(option.label)}</strong>
        <small>${escapeHtml(option.description)}</small>
      </span>
    </label>
  `).join("");
}

function renderHomeModeOptions(selectedMode) {
  const options = [
    { id: "login", label: "Página de login", description: "O domínio abre a entrada do administrador.", icon: "log-in" },
    { id: "event", label: "Evento", description: "O domínio abre um evento público escolhido.", icon: "calendar-days" }
  ];
  return options.map((option) => `
    <label class="position-option ${selectedMode === option.id ? "active" : ""}">
      <input name="homeMode" type="radio" value="${escapeHtml(option.id)}" ${selectedMode === option.id ? "checked" : ""}>
      <i data-lucide="${escapeHtml(option.icon)}"></i>
      <span>
        <strong>${escapeHtml(option.label)}</strong>
        <small>${escapeHtml(option.description)}</small>
      </span>
    </label>
  `).join("");
}

function renderHomeEventOptions(selectedEventId) {
  const fallbackId = selectedEventId || state.events[0]?.id || "";
  return state.events.map((event) => `
    <option value="${escapeHtml(event.id)}" ${fallbackId === event.id ? "selected" : ""}>${escapeHtml(event.title || event.slug)}</option>
  `).join("");
}

function selectedHomeEvent(settings = siteSettings()) {
  return eventById(settings.homeEventId) || state.events[0] || null;
}

function defaultHomeRoute() {
  const settings = siteSettings();
  if (settings.homeMode === "event") {
    const event = selectedHomeEvent(settings);
    if (event) return { name: "event", slug: event.slug };
  }
  return { name: "admin" };
}

function appBasePath() {
  const path = location.pathname || "/";
  if (path.endsWith("/admin/")) return path.slice(0, -"admin/".length) || "/";
  if (path.endsWith("/admin")) return path.slice(0, -"admin".length) || "/";
  if (path.endsWith("/index.html")) return path.slice(0, -"index.html".length) || "/";
  if (path.endsWith("/")) return path;
  return path.replace(/\/[^/]*$/, "/") || "/";
}

function adminHref() {
  if (!canUseRemoteApi()) return "#/admin";
  return `${appBasePath()}admin`;
}

function eventHref(slug) {
  if (!canUseRemoteApi()) return `#/evento/${encodeURIComponent(slug || "")}`;
  return `${appBasePath()}#/evento/${encodeURIComponent(slug || "")}`;
}

function ticketHref(id) {
  if (!canUseRemoteApi()) return `#/ticket/${encodeURIComponent(id || "")}`;
  return `${appBasePath()}#/ticket/${encodeURIComponent(id || "")}`;
}

function defaultHomeHref() {
  const route = defaultHomeRoute();
  if (route.name === "event") return eventHref(route.slug);
  return adminHref();
}

function getPathRoute() {
  const base = appBasePath();
  const relativePath = location.pathname.slice(base.length).replace(/^\/+|\/+$/g, "");
  if (relativePath === "admin") return { name: "admin" };
  return null;
}

function navigateToAdmin() {
  if (canUseRemoteApi() && window.history?.pushState) {
    window.history.pushState(null, "", adminHref());
    render();
    return;
  }
  window.location.hash = "#/admin";
}

function redirectToAdmin() {
  if (canUseRemoteApi()) {
    window.location.assign(adminHref());
    return;
  }
  window.location.hash = "#/admin";
  render();
}

function applyTheme() {
  const theme = validThemeId(state?.site?.theme);
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme === "dark" ? "dark" : "light";
}

function renderThemeOptions(selectedTheme) {
  return THEME_OPTIONS.map((theme) => `
    <label class="theme-option ${selectedTheme === theme.id ? "active" : ""}">
      <input name="theme" type="radio" value="${escapeHtml(theme.id)}" ${selectedTheme === theme.id ? "checked" : ""}>
      <span class="theme-swatch ${escapeHtml(theme.id)}"></span>
      <span>
        <strong>${escapeHtml(theme.label)}</strong>
        <small>${escapeHtml(theme.description)}</small>
      </span>
    </label>
  `).join("");
}

function textToParagraphs(text) {
  return escapeHtml(text || "")
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function formatDateTime(iso) {
  if (!iso) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(iso));
}

function normalizeClockInput(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "";
  const compact = raw.replace(/\s+/g, "");
  const colon = compact.match(/(\d{1,2}):(\d{2})/);
  const hourText = compact.match(/(\d{1,2})h(?:(\d{1,2}))?/);
  const plain = compact.match(/^(\d{1,2})(\d{2})$/);
  const hourOnly = compact.match(/^(\d{1,2})$/);
  const match = colon || hourText || plain || hourOnly;
  if (!match) return raw;
  const hour = Number(match[1]);
  const minute = Number(match[2] || 0);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return "";
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function formatClockLabel(value) {
  const normalized = normalizeClockInput(value);
  if (!normalized) return String(value || "").trim();
  const [hour, minute] = normalized.split(":");
  return minute === "00" ? `${Number(hour)}h` : `${Number(hour)}h${minute}`;
}

function eventScheduleText(event) {
  const time = formatClockLabel(event.timeLabel);
  const gates = formatClockLabel(event.gatesLabel);
  return [
    gates ? `Abertura às ${gates}` : "",
    time ? `Evento às ${time}` : ""
  ].filter(Boolean).join(" · ");
}

function eventRsvpButtonLabel(event) {
  return String(event?.rsvpButtonLabel || "").trim() || "Confirmar presença";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizePhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
  return digits;
}

function makeParticipant(event, data) {
  const id = "part_" + randomId(14);
  const ticketCode = "VP-" + randomId(9).toUpperCase();
  return {
    id,
    eventId: event.id,
    ticketCode,
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    city: data.city?.trim() || "",
    guestName: data.guestName?.trim() || "",
    sessionId: data.sessionId,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    checkInAt: null
  };
}

function getRoute() {
  const hash = window.location.hash;
  if (!hash || hash === "#" || hash === "#/") return getPathRoute() || defaultHomeRoute();
  const parts = hash.replace(/^#\/?/, "").split("/").filter(Boolean);
  if (!parts.length) return getPathRoute() || defaultHomeRoute();
  if (parts[0] === "admin") return { name: "admin" };
  if (parts[0] === "evento") return { name: "event", slug: decodeURIComponent(parts[1] || "") };
  if (parts[0] === "ticket") return { name: "ticket", id: decodeURIComponent(parts[1] || "") };
  return isAdminAuthenticated() ? { name: "admin" } : defaultHomeRoute();
}

function eventById(id) {
  return state.events.find((event) => event.id === id);
}

function eventBySlug(slug) {
  return state.events.find((event) => event.slug === slug);
}

function participantsForEvent(eventId) {
  return state.participants.filter((participant) => participant.eventId === eventId);
}

function participantGuestCount(participant) {
  return String(participant?.guestName || "").trim() ? 1 : 0;
}

function participantHeadcount(participant) {
  return 1 + participantGuestCount(participant);
}

function participantsHeadcount(participants) {
  return participants.reduce((total, participant) => total + participantHeadcount(participant), 0);
}

function checkedHeadcount(participants) {
  return participants
    .filter((participant) => participant.checkInAt)
    .reduce((total, participant) => total + participantHeadcount(participant), 0);
}

function sessionHeadcount(event, sessionId) {
  return participantsForEvent(event.id)
    .filter((participant) => participant.sessionId === sessionId)
    .reduce((total, participant) => total + participantHeadcount(participant), 0);
}

function requestedHeadcount(data) {
  return String(data?.guestName || "").trim() ? 2 : 1;
}

function sessionById(event, sessionId) {
  return event.sessions.find((session) => session.id === sessionId);
}

function getEventCapacity(event) {
  return event.sessions.reduce((total, session) => total + Number(session.capacity || 0), 0);
}

function absoluteAppHref(href) {
  if (href.startsWith("#")) return `${location.href.replace(/#.*$/, "")}${href}`;
  return `${location.origin}${href}`;
}

function getPublicUrl(event) {
  return absoluteAppHref(eventHref(event.slug));
}

function getTicketUrl(participant) {
  return absoluteAppHref(ticketHref(participant.id));
}

function whatsappGroupUrl(event) {
  return String(event?.whatsappGroupUrl || "").trim();
}

function hasWhatsappGroup(event) {
  return Boolean(event?.whatsappGroupEnabled && whatsappGroupUrl(event));
}

function isValidHttpUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function render() {
  const route = getRoute();
  const routeKey = `${route.name}:${route.slug || route.id || ""}`;
  const shouldScrollTop = routeKey !== activeRouteKey;
  activeRouteKey = routeKey;
  closeModal(false);
  document.body.classList.remove("modal-open");

  if (route.name === "event") {
    const event = eventBySlug(route.slug);
    if (!event) return renderNotFound("Evento não encontrado");
    renderPublicEvent(event);
    scrollTopOnRouteChange(shouldScrollTop);
    return;
  }

  if (route.name === "ticket") {
    const participant = state.participants.find((item) => item.id === route.id);
    if (!participant) return renderNotFound("Confirmação não encontrada");
    renderTicket(participant);
    scrollTopOnRouteChange(shouldScrollTop);
    return;
  }

  if (route.name === "admin" && !isAdminAuthenticated()) {
    renderLogin();
    scrollTopOnRouteChange(shouldScrollTop);
    return;
  }

  renderAdmin();
  scrollTopOnRouteChange(shouldScrollTop);
}

function scrollTopOnRouteChange(shouldScrollTop) {
  if (shouldScrollTop) requestAnimationFrame(() => window.scrollTo(0, 0));
}

function renderShell(content) {
  const admin = isAdminAuthenticated();
  document.getElementById("app").innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="topbar-inner brand-${escapeHtml(brandPosition())}">
          ${renderBrandLink(admin ? adminHref() : defaultHomeHref())}
          <nav class="nav-actions" aria-label="Navegação">
            ${admin ? `<a class="btn ghost" href="${escapeHtml(adminHref())}"><i data-lucide="layout-dashboard"></i><span>Painel</span></a>` : ""}
            ${admin ? `<button class="btn ghost" type="button" data-action="logout-admin"><i data-lucide="log-out"></i><span>Sair</span></button>` : ""}
          </nav>
        </div>
      </header>
      ${content}
    </div>
  `;
  document.querySelector("[data-action='logout-admin']")?.addEventListener("click", logoutAdmin);
  refreshIcons();
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}

function renderLogin(message = "") {
  renderShell(`
    <main class="page auth-page">
      <section class="panel auth-panel">
        <div class="panel-header">
          <div class="panel-title">
            <p class="kicker">Administrador</p>
            <h1>Entrar no painel</h1>
            <p>Visitantes continuam vendo apenas a página pública do evento.</p>
          </div>
        </div>
        <div class="panel-body">
          <form id="admin-login-form" class="content-stack" novalidate>
            ${message ? `<div class="auth-message">${escapeHtml(message)}</div>` : ""}
            <label class="field">
              <span>E-mail</span>
              <input name="email" type="email" inputmode="email" autocomplete="username" required>
            </label>
            <label class="field">
              <span>Senha</span>
              <input name="password" type="password" autocomplete="current-password" required>
            </label>
            <div class="button-row">
              <button class="btn primary" type="submit"><i data-lucide="log-in"></i><span>Entrar</span></button>
              <a class="btn" href="${escapeHtml(eventHref(state.events[0]?.slug || ""))}"><i data-lucide="eye"></i><span>Ver como convidado</span></a>
            </div>
          </form>
        </div>
      </section>
    </main>
  `);

  document.getElementById("admin-login-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = normalizeEmail(formData.get("email"));
    const password = String(formData.get("password") || "");
    const remoteOk = await remoteLogin(email, password);
    if (remoteOk) {
      setAdminAuthenticated(true);
      toast("Bem-vindo ao painel.");
      redirectToAdmin();
      return;
    }
    setFieldError(form.querySelector("input[name='email']"), "Confira o e-mail.");
    setFieldError(form.querySelector("input[name='password']"), "Confira a senha.");
    toast("Login de administrador inválido.", true);
  });
  refreshIcons();
}

function renderAdmin() {
  if (!state.events.length) {
    createEvent();
    return;
  }
  if (!["dashboard", "settings", "updates"].includes(adminSection)) adminSection = "dashboard";
  if (!selectedEventId || !eventById(selectedEventId)) selectedEventId = state.events[0].id;
  const event = eventById(selectedEventId);
  const participants = participantsForEvent(event.id);
  const confirmedPeople = participantsHeadcount(participants);
  const checked = checkedHeadcount(participants);
  const capacity = getEventCapacity(event);
  const selectedSession = event.sessions[0]?.id || "";
  const adminName = brandName() || "Painel administrativo";

  renderShell(`
    <main class="page">
      <div class="admin-layout">
        <aside class="sidebar" aria-label="Eventos">
          <section class="admin-profile">
            <div class="admin-profile-mark">${logoUrl() ? `<img src="${escapeHtml(logoUrl())}" alt="${escapeHtml(adminName)}">` : `<i data-lucide="shield-check"></i>`}</div>
            <div>
              <strong>${escapeHtml(adminName)}</strong>
              <span>Administração</span>
            </div>
          </section>

          <section class="sidebar-section" ${adminSection !== "dashboard" ? "hidden" : ""}>
            <div class="sidebar-header">
              <h2 class="sidebar-title">Eventos</h2>
              <button class="btn icon small" type="button" data-action="new-event" title="Novo evento" aria-label="Novo evento">
                <i data-lucide="plus"></i>
              </button>
            </div>
            <div class="event-list">
              ${state.events.map((item) => `
                <button type="button" class="${item.id === event.id ? "active" : ""}" data-action="select-event" data-id="${item.id}">
                  <img class="event-thumb" src="${escapeHtml(imageSrc(item.coverUrl))}" alt="" onerror="this.style.visibility='hidden'">
                  <span>
                    <span class="event-list-title">${escapeHtml(item.title)}</span>
                    <span class="event-list-sub">${participantsHeadcount(participantsForEvent(item.id))} confirmados</span>
                  </span>
                </button>
              `).join("")}
            </div>
          </section>
          <section class="sidebar-section">
            <div class="sidebar-header">
              <h2 class="sidebar-title">Menu</h2>
            </div>
            <div class="admin-tabs">
              <button type="button" class="${adminSection === "dashboard" ? "active" : ""}" data-admin-section="dashboard">
                <i data-lucide="layout-dashboard"></i>
                <span>Painel</span>
              </button>
              <button type="button" class="${adminSection === "settings" ? "active" : ""}" data-admin-section="settings">
                <i data-lucide="settings"></i>
                <span>Configurações</span>
              </button>
              <button type="button" class="${adminSection === "updates" ? "active" : ""}" data-admin-section="updates">
                <i data-lucide="refresh-cw"></i>
                <span>Atualizar sistema</span>
              </button>
            </div>
          </section>
        </aside>

        <div class="content-stack">
          <div class="content-stack admin-tab-panel" data-admin-panel="dashboard" ${adminSection === "dashboard" ? "" : "hidden"}>
          <section class="page-heading">
            <div class="page-heading-main">
              <div>
                <p class="kicker">Painel de controle</p>
                <h1>${escapeHtml(event.title)}</h1>
              </div>
              <div class="row-actions">
                <button class="btn" type="button" data-action="copy-public"><i data-lucide="copy"></i><span>Copiar link</span></button>
                <a class="btn primary" href="#/evento/${encodeURIComponent(event.slug)}"><i data-lucide="eye"></i><span>Ver página</span></a>
              </div>
            </div>
            <div class="stat-grid">
              <div class="stat">
                <div class="stat-top">
                  <div class="stat-label">Confirmados</div>
                  <span class="stat-icon green"><i data-lucide="users"></i></span>
                </div>
                <div class="stat-value">${confirmedPeople}</div>
                <div class="stat-note">${participants.length} inscrições registradas</div>
              </div>
              <div class="stat">
                <div class="stat-top">
                  <div class="stat-label">Check-ins</div>
                  <span class="stat-icon blue"><i data-lucide="badge-check"></i></span>
                </div>
                <div class="stat-value">${checked}</div>
                <div class="stat-note">${confirmedPeople ? Math.round((checked / confirmedPeople) * 100) : 0}% presentes</div>
              </div>
              <div class="stat">
                <div class="stat-top">
                  <div class="stat-label">Capacidade</div>
                  <span class="stat-icon amber"><i data-lucide="armchair"></i></span>
                </div>
                <div class="stat-value">${capacity || "-"}</div>
                <div class="stat-note">vagas configuradas</div>
              </div>
              <div class="stat">
                <div class="stat-top">
                  <div class="stat-label">Sessões</div>
                  <span class="stat-icon violet"><i data-lucide="calendar-range"></i></span>
                </div>
                <div class="stat-value">${event.sessions.length}</div>
                <div class="stat-note">opções no formulário</div>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div class="panel-title">
                <h2>Modelo do evento</h2>
                <p>${escapeHtml(event.slug)}</p>
              </div>
              <div class="row-actions">
                <button class="btn" type="button" data-action="duplicate-event"><i data-lucide="copy-plus"></i><span>Duplicar</span></button>
                <button class="btn danger" type="button" data-action="delete-event"><i data-lucide="trash-2"></i><span>Excluir</span></button>
              </div>
            </div>
            <div class="panel-body">
              <form id="event-form" class="content-stack">
                <div class="preview-strip">
                  <img class="preview-cover" src="${escapeHtml(imageSrc(event.coverUrl))}" alt="">
                  <div class="preview-meta">
                    <p class="preview-title">${escapeHtml(event.subtitle || event.title)}</p>
                    <div class="badge-row">
                      <span class="badge"><i data-lucide="calendar-days"></i>${escapeHtml(event.dateLabel)}</span>
                      <span class="badge"><i data-lucide="map-pin"></i>${escapeHtml(event.locationName)}</span>
                    </div>
                  </div>
                </div>

                <div class="form-grid">
                  <label class="field full">
                    <span>Título</span>
                    <input name="title" value="${escapeHtml(event.title)}" required>
                  </label>
                  <label class="field">
                    <span>Subtítulo</span>
                    <input name="subtitle" value="${escapeHtml(event.subtitle)}">
                  </label>
                  <label class="field">
                    <span>Slug</span>
                    <input name="slug" value="${escapeHtml(event.slug)}" required>
                  </label>
                  <label class="field full">
                    <span>Imagem de capa</span>
                    <input name="coverUrl" value="${escapeHtml(event.coverUrl)}" placeholder="Cole uma URL ou importe uma imagem">
                    <input name="coverFile" type="file" accept="image/*">
                  </label>
                  <div class="field">
                    <span class="label">Cor de destaque</span>
                    <div class="split-fields">
                      <input name="accent" type="color" value="${escapeHtml(event.accent)}" aria-label="Cor de destaque">
                      <input name="accentText" value="${escapeHtml(event.accent)}" aria-label="Codigo da cor">
                    </div>
                  </div>
                  <label class="field">
                    <span>Data</span>
                    <input name="dateLabel" value="${escapeHtml(event.dateLabel)}">
                  </label>
                  <label class="field">
                    <span>Horário da abertura</span>
                    <input name="gatesLabel" type="time" step="300" value="${escapeHtml(normalizeClockInput(event.gatesLabel))}">
                  </label>
                  <label class="field">
                    <span>Horário do evento</span>
                    <input name="timeLabel" type="time" step="300" value="${escapeHtml(normalizeClockInput(event.timeLabel))}">
                  </label>
                  <label class="field">
                    <span>Local</span>
                    <input name="locationName" value="${escapeHtml(event.locationName)}">
                  </label>
                  <label class="field">
                    <span>Endereço</span>
                    <input name="address" value="${escapeHtml(event.address)}">
                  </label>
                  <label class="field full">
                    <span>Link do mapa</span>
                    <input name="mapsUrl" value="${escapeHtml(event.mapsUrl)}">
                  </label>
                  <label class="field">
                    <span>Organizador</span>
                    <input name="organizerName" value="${escapeHtml(event.organizerName)}">
                  </label>
                  <label class="field">
                    <span>Telefone</span>
                    <input name="organizerPhone" value="${escapeHtml(event.organizerPhone)}">
                  </label>
                  <label class="field full">
                    <span>Imagem do organizador</span>
                    <input name="organizerImage" value="${escapeHtml(event.organizerImage)}" placeholder="Cole uma URL ou importe uma imagem">
                    <input name="organizerFile" type="file" accept="image/*">
                  </label>
                  <label class="field full">
                    <span>Texto do botão de inscrição</span>
                    <input name="rsvpButtonLabel" value="${escapeHtml(eventRsvpButtonLabel(event))}" maxlength="40" placeholder="Ex.: Garantir minha vaga">
                  </label>
                  <label class="checkbox-label field full">
                    <input name="allowGuests" type="checkbox" ${event.allowGuests ? "checked" : ""}>
                    Permitir que o participante leve convidado
                  </label>
                  <label class="checkbox-label field full">
                    <input name="whatsappGroupEnabled" type="checkbox" ${event.whatsappGroupEnabled ? "checked" : ""}>
                    Mostrar botão para grupo de WhatsApp após a confirmação
                  </label>
                  <label class="field full">
                    <span>Grupo de WhatsApp</span>
                    <input name="whatsappGroupUrl" value="${escapeHtml(whatsappGroupUrl(event))}" placeholder="https://chat.whatsapp.com/...">
                    <p class="help-text">Se habilitado, o participante verá o botão Entrar no grupo de WhatsApp na tela do QR Code.</p>
                  </label>
                  <label class="field full">
                    <span>Descrição</span>
                    <textarea name="description">${escapeHtml(event.description)}</textarea>
                  </label>
                </div>

                <div class="field full">
                  <span class="label">Sessões</span>
                  <div class="session-editor" id="session-editor">
                    ${event.sessions.map((session) => renderSessionRow(session)).join("")}
                  </div>
                  <button class="btn small" type="button" data-action="add-session"><i data-lucide="plus"></i><span>Adicionar sessão</span></button>
                </div>

                <div class="button-row">
                  <button class="btn primary" type="submit"><i data-lucide="save"></i><span>Salvar evento</span></button>
                </div>
              </form>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <div class="panel-title">
                <h2>Participantes</h2>
                <p>Lista, exportação e validação de QR Code</p>
              </div>
              <div class="row-actions">
                <button class="btn" type="button" data-action="export-csv"><i data-lucide="download"></i><span>Exportar CSV</span></button>
                <button class="btn primary" type="button" data-action="open-add-participant"><i data-lucide="user-plus"></i><span>Adicionar</span></button>
              </div>
            </div>
            <div class="panel-body content-stack">
              <div class="filters">
                <input data-filter="q" placeholder="Buscar por nome, e-mail, telefone ou código" value="${escapeHtml(adminFilters.q)}">
                <select data-filter="session">
                  <option value="all">Todas as sessões</option>
                  ${event.sessions.map((session) => `<option value="${session.id}" ${adminFilters.session === session.id ? "selected" : ""}>${escapeHtml(session.label)}</option>`).join("")}
                </select>
                <select data-filter="status">
                  <option value="all" ${adminFilters.status === "all" ? "selected" : ""}>Todos</option>
                  <option value="confirmed" ${adminFilters.status === "confirmed" ? "selected" : ""}>Confirmados</option>
                  <option value="checked" ${adminFilters.status === "checked" ? "selected" : ""}>Check-in feito</option>
                </select>
              </div>
              <form id="validator-form" class="filters">
                <input name="code" placeholder="Código, ID ou link do QR">
                <button class="btn dark" type="submit"><i data-lucide="scan-line"></i><span>Validar QR</span></button>
                <span></span>
              </form>
              ${renderParticipantsTable(event)}
            </div>
          </section>

          </div>
          <div class="admin-tab-panel" data-admin-panel="settings" ${adminSection === "settings" ? "" : "hidden"}>
            ${renderSettingsPanel()}
          </div>
          <div class="admin-tab-panel" data-admin-panel="updates" ${adminSection === "updates" ? "" : "hidden"}>
            ${renderUpdateManager()}
          </div>
        </div>
      </div>
    </main>
  `);

  bindAdmin(event);
}

function renderSessionRow(session) {
  return `
    <div class="session-row" data-session-id="${escapeHtml(session.id)}">
      <input data-session-field="label" value="${escapeHtml(session.label)}" placeholder="Nome da sessão">
      <input data-session-field="capacity" type="number" min="0" value="${Number(session.capacity || 0)}" placeholder="Vagas">
      <label class="checkbox-label">
        <input data-session-field="private" type="checkbox" ${session.private ? "checked" : ""}>
        Reservada
      </label>
      <button class="btn icon danger" type="button" data-action="remove-session" title="Remover sessão" aria-label="Remover sessão"><i data-lucide="x"></i></button>
    </div>
  `;
}

function renderParticipantsTable(event) {
  const filtered = participantsForEvent(event.id).filter((participant) => {
    const q = adminFilters.q.trim().toLowerCase();
    const sessionMatch = adminFilters.session === "all" || participant.sessionId === adminFilters.session;
    const statusMatch =
      adminFilters.status === "all" ||
      (adminFilters.status === "checked" && participant.checkInAt) ||
      (adminFilters.status === "confirmed" && !participant.checkInAt);
    const text = [participant.name, participant.email, participant.phone, participant.city, participant.ticketCode]
      .join(" ")
      .toLowerCase();
    return sessionMatch && statusMatch && (!q || text.includes(q));
  });

  if (!filtered.length) {
    return `<div class="empty-state"><p>Nenhum participante encontrado.</p></div>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Participante</th>
            <th>Convidados</th>
            <th>Sessão</th>
            <th>Código</th>
            <th>Status</th>
            <th>Inscrição</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((participant) => {
            const session = sessionById(event, participant.sessionId);
            const guestCount = participantGuestCount(participant);
            const peopleCount = participantHeadcount(participant);
            return `
              <tr>
                <td>
                  <div class="participant-name">${escapeHtml(participant.name)}</div>
                  <div class="muted">${escapeHtml(participant.email)} · ${escapeHtml(participant.phone)}</div>
                  ${participant.guestName ? `<div class="muted">Convidado: ${escapeHtml(participant.guestName)}</div>` : ""}
                </td>
                <td>
                  <span class="badge ${guestCount ? "success" : ""}">${guestCount}</span>
                  <div class="muted">Total: ${peopleCount} pessoa${peopleCount > 1 ? "s" : ""}</div>
                </td>
                <td>${escapeHtml(session?.label || "Sessão removida")}</td>
                <td class="mono">${escapeHtml(participant.ticketCode)}</td>
                <td>${participant.checkInAt ? `<span class="badge success">Presente</span>` : `<span class="badge warn">Confirmado</span>`}</td>
                <td>${formatDateTime(participant.createdAt)}</td>
                <td>
                  <div class="inline-actions">
                    <a class="btn icon small" href="#/ticket/${encodeURIComponent(participant.id)}" title="Ver QR" aria-label="Ver QR"><i data-lucide="qr-code"></i></a>
                    <button class="btn icon small" type="button" data-action="copy-ticket" data-id="${participant.id}" title="Copiar ticket" aria-label="Copiar ticket"><i data-lucide="copy"></i></button>
                    <button class="btn icon small" type="button" data-action="toggle-checkin" data-id="${participant.id}" title="Alternar check-in" aria-label="Alternar check-in"><i data-lucide="${participant.checkInAt ? "undo-2" : "check"}"></i></button>
                    <button class="btn icon small danger" type="button" data-action="delete-participant" data-id="${participant.id}" title="Excluir participante" aria-label="Excluir participante"><i data-lucide="trash-2"></i></button>
                  </div>
                </td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderSettingsPanel() {
  const settings = siteSettings();
  return `
    <section class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <h2>Configurações</h2>
          <p>Personalize a marca exibida no cabeçalho do site.</p>
        </div>
      </div>
      <div class="panel-body content-stack">
        <form id="site-settings-form" class="settings-grid">
          <div class="settings-preview">
            <span class="label">Prévia da marca</span>
            <div class="brand-preview ${logoUrl() ? "has-logo" : ""} brand-${escapeHtml(settings.brandPosition)}" data-brand-preview>
              ${renderBrandIdentity()}
            </div>
            <div class="logo-preview" data-logo-preview>
              ${settings.logoUrl
                ? `<img src="${escapeHtml(settings.logoUrl)}" alt="${escapeHtml(brandName() || "Logo do cabeçalho")}">`
                : `<div class="logo-preview-empty"><i data-lucide="image"></i><span>Nenhuma logo importada</span></div>`}
            </div>
          </div>

          <div class="settings-fields">
            <label class="field">
              <span>Nome exibido</span>
              <input name="brandName" value="${escapeHtml(settings.brandName)}" placeholder="Nome da sua marca">
            </label>
            <label class="field">
              <span>Logo do cabeçalho</span>
              <input name="logoUrl" value="${escapeHtml(settings.logoUrl)}" placeholder="Cole uma URL ou importe uma imagem">
              <input name="logoFile" type="file" accept="image/*">
            </label>
            <div class="field">
              <span>Posição da marca no cabeçalho</span>
              <div class="position-options">
                ${renderBrandPositionOptions(settings.brandPosition)}
              </div>
            </div>
            <div class="field">
              <span>Tema do sistema</span>
              <div class="theme-options">
                ${renderThemeOptions(settings.theme)}
              </div>
            </div>
            <div class="field">
              <span>Página inicial do domínio</span>
              <div class="position-options home-options">
                ${renderHomeModeOptions(settings.homeMode)}
              </div>
            </div>
            <label class="field" data-home-event-field>
              <span>Evento inicial</span>
              <select name="homeEventId">
                ${renderHomeEventOptions(settings.homeEventId)}
              </select>
              <p class="help-text">Usado somente quando a página inicial estiver configurada como evento.</p>
            </label>
            <div class="button-row">
              <button class="btn primary" type="submit"><i data-lucide="save"></i><span>Salvar configurações</span></button>
              <button class="btn danger" type="button" data-action="clear-site-logo"><i data-lucide="eraser"></i><span>Remover logo</span></button>
            </div>
          </div>
        </form>
      </div>
    </section>
  `;
}

function renderUpdateManager() {
  const githubUrl = `https://github.com/${GITHUB_REPO}`;
  return `
    <section class="panel">
      <div class="panel-header">
        <div class="panel-title">
          <h2>Atualizacoes do sistema</h2>
          <p>Busca e instala arquivos direto do GitHub.</p>
        </div>
        <div class="row-actions">
          <a class="btn" href="${githubUrl}" target="_blank" rel="noreferrer"><i data-lucide="github"></i><span>Repositorio</span></a>
        </div>
      </div>
      <div class="panel-body content-stack">
        <div class="update-grid">
          <div class="file-tool">
            <h3>Versao instalada</h3>
            <p class="help-text">Build ${escapeHtml(APP_BUILD)} conectado em ${escapeHtml(GITHUB_REPO)} / ${escapeHtml(GITHUB_BRANCH)}.</p>
            <div class="badge-row">
              <span class="badge"><i data-lucide="tag"></i>${escapeHtml(APP_VERSION)}</span>
              <span class="badge"><i data-lucide="git-branch"></i>${escapeHtml(GITHUB_BRANCH)}</span>
            </div>
          </div>
          <div class="file-tool">
            <h3>Atualizar pela hospedagem</h3>
            <p class="help-text">Primeiro busque atualizacoes. Se existir uma versao nova no GitHub, clique em atualizar para substituir os arquivos do sistema sem mexer nos dados dos eventos.</p>
            <div class="button-row compact">
              <button class="btn" type="button" data-action="check-updates"><i data-lucide="refresh-cw"></i><span>Buscar atualizacoes</span></button>
              <button class="btn primary" type="button" data-action="run-update"><i data-lucide="download-cloud"></i><span>Atualizar</span></button>
            </div>
          </div>
        </div>
        <div id="update-status" class="update-status" aria-live="polite">
          <i data-lucide="info"></i>
          <span>Disponivel depois que o site estiver instalado na Hostinger com PHP.</span>
        </div>
      </div>
    </section>
  `;
}

function bindAdmin(event) {
  document.querySelectorAll("[data-admin-section]").forEach((button) => {
    button.addEventListener("click", () => {
      adminSection = button.dataset.adminSection || "dashboard";
      renderAdmin();
    });
  });

  document.querySelectorAll("[data-action='select-event']").forEach((button) => {
    button.addEventListener("click", () => {
      selectedEventId = button.dataset.id;
      renderAdmin();
    });
  });

  document.querySelector("[data-action='new-event']")?.addEventListener("click", createEvent);
  document.querySelector("[data-action='copy-public']")?.addEventListener("click", () => copyText(getPublicUrl(event), "Link público copiado."));
  document.querySelector("[data-action='duplicate-event']")?.addEventListener("click", () => duplicateEvent(event));
  document.querySelector("[data-action='delete-event']")?.addEventListener("click", () => deleteEvent(event));
  document.querySelector("[data-action='export-csv']")?.addEventListener("click", () => exportCsv(event));
  document.querySelector("[data-action='open-add-participant']")?.addEventListener("click", () => openParticipantModal(event));
  document.querySelector("[data-action='add-session']")?.addEventListener("click", () => addSession(event));

  bindSessionRemoveButtons();

  document.querySelectorAll("[data-filter]").forEach((input) => {
    input.addEventListener("input", () => {
      adminFilters[input.dataset.filter] = input.value;
      renderAdmin();
    });
  });

  document.getElementById("event-form")?.addEventListener("submit", (submitEvent) => {
    submitEvent.preventDefault();
    saveEventFromForm(event, submitEvent.currentTarget);
  });

  document.getElementById("validator-form")?.addEventListener("submit", (submitEvent) => {
    submitEvent.preventDefault();
    const value = new FormData(submitEvent.currentTarget).get("code");
    validateTicket(event, value);
  });

  document.querySelectorAll("[data-action='copy-ticket']").forEach((button) => {
    button.addEventListener("click", () => {
      const participant = state.participants.find((item) => item.id === button.dataset.id);
      if (participant) copyText(getTicketUrl(participant), "Link do QR copiado.");
    });
  });

  document.querySelectorAll("[data-action='toggle-checkin']").forEach((button) => {
    button.addEventListener("click", () => toggleCheckIn(button.dataset.id));
  });

  document.querySelectorAll("[data-action='delete-participant']").forEach((button) => {
    button.addEventListener("click", () => deleteParticipant(button.dataset.id));
  });

  const accent = document.querySelector("input[name='accent']");
  const accentText = document.querySelector("input[name='accentText']");
  accent?.addEventListener("input", () => {
    accentText.value = accent.value;
  });
  accentText?.addEventListener("input", () => {
    if (/^#[0-9a-fA-F]{6}$/.test(accentText.value)) accent.value = accentText.value;
  });

  const eventForm = document.getElementById("event-form");
  bindImageImporter(eventForm, "coverFile", "coverUrl", ".preview-cover");
  bindImageImporter(eventForm, "organizerFile", "organizerImage");
  bindWhatsappOption(eventForm);
  bindSettingsPanel();
  bindUpdateManager();

  refreshIcons();
}

function bindSettingsPanel() {
  const form = document.getElementById("site-settings-form");
  if (!form) return;

  form.addEventListener("submit", (submitEvent) => {
    submitEvent.preventDefault();
    const formData = new FormData(form);
    const settings = siteSettings();
    settings.brandName = String(formData.get("brandName") || "").trim();
    settings.logoUrl = String(formData.get("logoUrl") || "").trim();
    settings.brandPosition = validBrandPosition(String(formData.get("brandPosition") || "left"));
    settings.homeMode = validHomeMode(String(formData.get("homeMode") || "login"));
    settings.homeEventId = String(formData.get("homeEventId") || "").trim();
    if (settings.homeMode === "event" && !eventById(settings.homeEventId)) {
      settings.homeEventId = state.events[0]?.id || "";
    }
    settings.theme = validThemeId(String(formData.get("theme") || "light"));
    saveState();
    toast("Configurações salvas.");
    renderAdmin();
  });

  form.querySelector("input[name='logoUrl']")?.addEventListener("input", (event) => {
    updateLogoPreview(event.currentTarget.value);
  });

  form.querySelector("input[name='logoFile']")?.addEventListener("change", (event) => {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Escolha um arquivo de imagem.", true);
      event.currentTarget.value = "";
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const value = String(reader.result || "");
      form.querySelector("input[name='logoUrl']").value = value;
      updateLogoPreview(value);
    });
    reader.readAsDataURL(file);
  });

  form.querySelectorAll("input[name='theme']").forEach((input) => {
    input.addEventListener("change", () => {
      document.documentElement.dataset.theme = validThemeId(input.value);
      document.documentElement.style.colorScheme = input.value === "dark" ? "dark" : "light";
      form.querySelectorAll(".theme-option").forEach((option) => option.classList.remove("active"));
      input.closest(".theme-option")?.classList.add("active");
    });
  });

  form.querySelectorAll("input[name='brandPosition']").forEach((input) => {
    input.addEventListener("change", () => {
      const selectedPosition = validBrandPosition(input.value);
      form.querySelectorAll(".position-option").forEach((option) => option.classList.remove("active"));
      input.closest(".position-option")?.classList.add("active");
      document.querySelector("[data-brand-preview]")?.classList.remove("brand-left", "brand-center");
      document.querySelector("[data-brand-preview]")?.classList.add(`brand-${selectedPosition}`);
    });
  });

  form.querySelectorAll("input[name='homeMode']").forEach((input) => {
    input.addEventListener("change", () => {
      const selectedMode = validHomeMode(input.value);
      form.querySelectorAll("input[name='homeMode']").forEach((optionInput) => {
        optionInput.closest(".position-option")?.classList.toggle("active", optionInput.checked);
      });
      syncHomeEventSelector(form, selectedMode);
    });
  });
  syncHomeEventSelector(form, validHomeMode(new FormData(form).get("homeMode")));

  document.querySelector("[data-action='clear-site-logo']")?.addEventListener("click", () => {
    const settings = siteSettings();
    settings.logoUrl = "";
    saveState();
    toast("Logo removida.");
    renderAdmin();
  });
}

function updateLogoPreview(value) {
  const target = document.querySelector("[data-logo-preview]");
  if (!target) return;
  const src = String(value || "").trim();
  target.innerHTML = src
    ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(brandName() || "Logo do cabeçalho")}">`
    : `<div class="logo-preview-empty"><i data-lucide="image"></i><span>Nenhuma logo importada</span></div>`;
  refreshIcons();
}

function syncHomeEventSelector(form, mode) {
  const field = form?.querySelector("[data-home-event-field]");
  const select = form?.querySelector("select[name='homeEventId']");
  const enabled = validHomeMode(mode) === "event";
  field?.classList.toggle("disabled", !enabled);
  if (select) select.disabled = !enabled;
}

function bindUpdateManager() {
  document.querySelector("[data-action='check-updates']")?.addEventListener("click", checkUpdates);
  document.querySelector("[data-action='run-update']")?.addEventListener("click", runSystemUpdate);
}

function setUpdateStatus(message, tone = "info") {
  const target = document.getElementById("update-status");
  if (!target) return;
  const icon = tone === "success" ? "check-circle-2" : tone === "danger" ? "alert-triangle" : "info";
  target.className = `update-status ${tone}`;
  target.innerHTML = `<i data-lucide="${icon}"></i><span>${message}</span>`;
  refreshIcons();
}

function renderUpdatePayload(payload) {
  const local = payload.local || {};
  const remote = payload.remote || {};
  const localLabel = [local.version, local.build].filter(Boolean).join(" / ") || "sem versao";
  const remoteLabel = [remote.version, remote.build].filter(Boolean).join(" / ") || "nao encontrada";
  const message = payload.updateAvailable
    ? `Atualizacao encontrada. Instalada: ${escapeHtml(localLabel)}. GitHub: ${escapeHtml(remoteLabel)}.`
    : `Sistema atualizado. Instalada: ${escapeHtml(localLabel)}. GitHub: ${escapeHtml(remoteLabel)}.`;
  setUpdateStatus(message, payload.updateAvailable ? "info" : "success");
}

async function checkUpdates() {
  if (!canUseRemoteApi()) {
    setUpdateStatus("Esse recurso funciona no dominio da Hostinger, depois de instalar com install.php.", "danger");
    return;
  }

  setUpdateStatus("Buscando versao no GitHub...", "info");
  try {
    const payload = await apiFetch("check_update");
    renderUpdatePayload(payload);
  } catch (error) {
    setUpdateStatus(escapeHtml(error.message || "Nao foi possivel buscar atualizacoes."), "danger");
  }
}

async function runSystemUpdate() {
  if (!canUseRemoteApi()) {
    setUpdateStatus("Esse recurso funciona no dominio da Hostinger, depois de instalar com install.php.", "danger");
    return;
  }

  if (!confirm("Atualizar agora pelos arquivos do GitHub? Seus eventos e participantes em data/state.json serao preservados.")) {
    return;
  }

  setUpdateStatus("Baixando e aplicando arquivos do GitHub...", "info");
  try {
    const payload = await apiFetch("run_update", { method: "POST" });
    const files = Array.isArray(payload.files) && payload.files.length
      ? ` Arquivos: ${payload.files.map(escapeHtml).join(", ")}.`
      : "";
    setUpdateStatus(`${escapeHtml(payload.message || "Atualizacao concluida.")}${files}`, "success");
  } catch (error) {
    setUpdateStatus(escapeHtml(error.message || "Nao foi possivel atualizar."), "danger");
  }
}

function bindImageImporter(scope, fileName, inputName, previewSelector) {
  const fileInput = scope?.querySelector(`input[name='${fileName}']`);
  const targetInput = scope?.querySelector(`input[name='${inputName}']`);
  if (!fileInput || !targetInput) return;

  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Escolha um arquivo de imagem.", true);
      fileInput.value = "";
      return;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      targetInput.value = String(reader.result || "");
      const preview = previewSelector ? scope.querySelector(previewSelector) : null;
      if (preview) preview.src = targetInput.value;
      toast("Imagem importada.");
    });
    reader.readAsDataURL(file);
  });
}

function bindWhatsappOption(form) {
  const checkbox = form?.querySelector("input[name='whatsappGroupEnabled']");
  const input = form?.querySelector("input[name='whatsappGroupUrl']");
  if (!checkbox || !input) return;

  const sync = () => {
    input.readOnly = !checkbox.checked;
    input.required = checkbox.checked;
    input.closest(".field")?.classList.toggle("disabled", !checkbox.checked);
    clearFieldError(input);
  };

  checkbox.addEventListener("change", sync);
  input.addEventListener("input", () => clearFieldError(input));
  sync();
}

function validateWhatsappGroup(form) {
  const checkbox = form?.querySelector("input[name='whatsappGroupEnabled']");
  const input = form?.querySelector("input[name='whatsappGroupUrl']");
  if (!checkbox || !input) return true;

  clearFieldError(input);
  if (!checkbox.checked) return true;

  const value = input.value.trim();
  if (!value) {
    setFieldError(input, "Informe o link do grupo de WhatsApp.");
    return false;
  }

  if (!isValidHttpUrl(value)) {
    setFieldError(input, "Use um link começando com https:// ou http://.");
    return false;
  }

  return true;
}

function saveEventFromForm(event, form) {
  const formData = new FormData(form);
  const nextSlug = slugify(formData.get("slug")) || slugify(formData.get("title")) || event.slug;
  const slugUsed = state.events.some((item) => item.id !== event.id && item.slug === nextSlug);
  if (slugUsed) {
    toast("Esse slug ja esta em uso.", true);
    return;
  }

  const sessions = collectSessionRows(form);
  if (!validateWhatsappGroup(form)) return;

  Object.assign(event, {
    title: formData.get("title").trim(),
    subtitle: formData.get("subtitle").trim(),
    slug: nextSlug,
    coverUrl: formData.get("coverUrl").trim(),
    accent: formData.get("accentText").trim() || formData.get("accent"),
    dateLabel: formData.get("dateLabel").trim(),
    timeLabel: normalizeClockInput(formData.get("timeLabel")),
    gatesLabel: normalizeClockInput(formData.get("gatesLabel")),
    locationName: formData.get("locationName").trim(),
    address: formData.get("address").trim(),
    mapsUrl: formData.get("mapsUrl").trim(),
    organizerName: formData.get("organizerName").trim(),
    organizerPhone: formData.get("organizerPhone").trim(),
    organizerImage: formData.get("organizerImage").trim(),
    rsvpButtonLabel: String(formData.get("rsvpButtonLabel") || "").trim() || "Confirmar presença",
    allowGuests: formData.get("allowGuests") === "on",
    whatsappGroupEnabled: formData.get("whatsappGroupEnabled") === "on",
    whatsappGroupUrl: String(formData.get("whatsappGroupUrl") || "").trim(),
    description: formData.get("description").trim(),
    sessions
  });

  saveState();
  toast("Evento salvo.");
  renderAdmin();
}

function createEvent() {
  showModal(`
    <div class="modal-header">
      <div>
        <p class="kicker">Novo evento</p>
        <h2>Criar evento</h2>
      </div>
      <button class="btn icon ghost" type="button" data-action="close-modal" aria-label="Fechar"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      ${eventCreationFormHtml()}
    </div>
  `);
  bindEventCreationWizard(document.getElementById("create-event-form"));
}

function eventCreationFormHtml() {
  return `
    <form id="create-event-form" class="content-stack participant-wizard" data-step="1" novalidate>
      <div class="wizard-progress three">
        <span class="step-pill active" data-step-pill="1"><strong>1</strong> Identidade</span>
        <span class="step-pill" data-step-pill="2"><strong>2</strong> Data e local</span>
        <span class="step-pill" data-step-pill="3"><strong>3</strong> Inscrições</span>
      </div>

      <div class="form-step active" data-step-panel="1">
        <div class="form-grid">
          <label class="field full">
            <span>Título</span>
            <input name="title" required placeholder="Nome do evento">
          </label>
          <label class="field">
            <span>Subtítulo</span>
            <input name="subtitle" placeholder="Categoria, tema ou chamada curta">
          </label>
          <label class="field">
            <span>Slug</span>
            <input name="slug" placeholder="gerado pelo título">
          </label>
          <label class="field full">
            <span>Imagem de capa</span>
            <input name="coverUrl" placeholder="Cole uma URL ou importe uma imagem">
            <input name="coverFile" type="file" accept="image/*">
          </label>
          <div class="field">
            <span class="label">Cor de destaque</span>
            <div class="split-fields">
              <input name="accent" type="color" value="#0f766e" aria-label="Cor de destaque">
              <input name="accentText" value="#0f766e" aria-label="Código da cor">
            </div>
          </div>
        </div>
        <div class="button-row">
          <button class="btn primary" type="button" data-action="event-next"><i data-lucide="arrow-right"></i><span>Continuar</span></button>
        </div>
      </div>

      <div class="form-step" data-step-panel="2" hidden>
        <div class="form-grid">
          <label class="field">
            <span>Data</span>
            <input name="dateLabel" placeholder="Ex.: Sábado, 20 de julho">
          </label>
          <label class="field">
            <span>Horário da abertura</span>
            <input name="gatesLabel" type="time" step="300">
          </label>
          <label class="field">
            <span>Horário do evento</span>
            <input name="timeLabel" type="time" step="300">
          </label>
          <label class="field">
            <span>Local</span>
            <input name="locationName" placeholder="Nome do local">
          </label>
          <label class="field full">
            <span>Endereço</span>
            <input name="address" placeholder="Endereço completo">
          </label>
          <label class="field full">
            <span>Link do mapa</span>
            <input name="mapsUrl" placeholder="https://...">
          </label>
          <label class="field">
            <span>Organizador</span>
            <input name="organizerName" placeholder="Nome do organizador">
          </label>
          <label class="field">
            <span>Telefone do organizador</span>
            <input name="organizerPhone" placeholder="(00) 00000-0000">
          </label>
          <label class="field full">
            <span>Imagem do organizador</span>
            <input name="organizerImage" placeholder="Cole uma URL ou importe uma imagem">
            <input name="organizerFile" type="file" accept="image/*">
          </label>
          <label class="field full">
            <span>Descrição</span>
            <textarea name="description" placeholder="Escreva a descrição do evento"></textarea>
          </label>
        </div>
        <div class="button-row">
          <button class="btn" type="button" data-action="event-back"><i data-lucide="arrow-left"></i><span>Voltar</span></button>
          <button class="btn primary" type="button" data-action="event-next"><i data-lucide="arrow-right"></i><span>Continuar</span></button>
        </div>
      </div>

      <div class="form-step" data-step-panel="3" hidden>
        <label class="field full">
          <span>Texto do botão de inscrição</span>
          <input name="rsvpButtonLabel" maxlength="40" value="Confirmar presença" placeholder="Ex.: Garantir minha vaga">
        </label>

        <label class="checkbox-label">
          <input name="allowGuests" type="checkbox">
          Permitir que o participante leve convidado
        </label>

        <label class="checkbox-label">
          <input name="whatsappGroupEnabled" type="checkbox">
          Mostrar botão para grupo de WhatsApp após a confirmação
        </label>

        <label class="field full">
          <span>Grupo de WhatsApp</span>
          <input name="whatsappGroupUrl" placeholder="https://chat.whatsapp.com/...">
          <p class="help-text">Opcional. Se habilitado, aparece no final da confirmação, junto do QR Code.</p>
        </label>

        <div class="field full">
          <span class="label">Sessões</span>
          <p class="help-text">Começa vazio. Adicione somente se o evento já tiver sessões definidas.</p>
          <div class="session-editor" id="create-session-editor" data-allow-empty="true"></div>
          <button class="btn small" type="button" data-action="create-add-session"><i data-lucide="plus"></i><span>Adicionar sessão</span></button>
        </div>

        <div class="button-row">
          <button class="btn" type="button" data-action="event-back"><i data-lucide="arrow-left"></i><span>Voltar</span></button>
          <button class="btn primary" type="submit"><i data-lucide="check"></i><span>Criar evento</span></button>
        </div>
      </div>
    </form>
  `;
}

function bindEventCreationWizard(form) {
  if (!form) return;
  bindImageImporter(form, "coverFile", "coverUrl");
  bindImageImporter(form, "organizerFile", "organizerImage");
  bindWhatsappOption(form);

  const accent = form.querySelector("input[name='accent']");
  const accentText = form.querySelector("input[name='accentText']");
  accent?.addEventListener("input", () => {
    accentText.value = accent.value;
  });
  accentText?.addEventListener("input", () => {
    if (/^#[0-9a-fA-F]{6}$/.test(accentText.value)) accent.value = accentText.value;
  });

  const title = form.querySelector("input[name='title']");
  const slug = form.querySelector("input[name='slug']");
  title?.addEventListener("input", () => {
    clearFieldError(title);
    if (!slug.value.trim()) slug.value = slugify(title.value);
  });

  form.querySelectorAll("[data-action='event-next']").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(form.dataset.step || 1);
      if (step === 1 && !validateEventIdentityStep(form)) return;
      setWizardStep(form, Math.min(step + 1, 3));
    });
  });

  form.querySelectorAll("[data-action='event-back']").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(form.dataset.step || 1);
      setWizardStep(form, Math.max(step - 1, 1));
    });
  });

  form.querySelector("[data-action='create-add-session']")?.addEventListener("click", () => {
    const editor = form.querySelector("#create-session-editor");
    const id = "sessao-" + randomId(5);
    editor.insertAdjacentHTML("beforeend", renderSessionRow({ id, label: "", capacity: 0, private: false }));
    editor.querySelector(`[data-session-id="${id}"] [data-session-field="label"]`)?.focus();
    bindSessionRemoveButtons(form);
    refreshIcons();
  });

  form.addEventListener("submit", (submitEvent) => {
    submitEvent.preventDefault();
    if (!validateEventIdentityStep(form)) {
      setWizardStep(form, 1);
      return;
    }
    if (!validateWhatsappGroup(form)) return;
    const formData = new FormData(form);
    const id = "evt_" + randomId(8);
    const titleValue = formData.get("title").trim();
    const event = {
      id,
      slug: uniqueSlug(slugify(formData.get("slug")) || slugify(titleValue)),
      title: titleValue,
      subtitle: formData.get("subtitle").trim(),
      coverUrl: formData.get("coverUrl").trim(),
      accent: formData.get("accentText").trim() || formData.get("accent") || "#0f766e",
      dateLabel: formData.get("dateLabel").trim(),
      timeLabel: normalizeClockInput(formData.get("timeLabel")),
      gatesLabel: normalizeClockInput(formData.get("gatesLabel")),
      locationName: formData.get("locationName").trim(),
      address: formData.get("address").trim(),
      mapsUrl: formData.get("mapsUrl").trim(),
      organizerName: formData.get("organizerName").trim(),
      organizerPhone: formData.get("organizerPhone").trim(),
      organizerImage: formData.get("organizerImage").trim(),
      rsvpButtonLabel: String(formData.get("rsvpButtonLabel") || "").trim() || "Confirmar presença",
      allowGuests: formData.get("allowGuests") === "on",
      whatsappGroupEnabled: formData.get("whatsappGroupEnabled") === "on",
      whatsappGroupUrl: String(formData.get("whatsappGroupUrl") || "").trim(),
      description: formData.get("description").trim(),
      createdAt: new Date().toISOString(),
      sessions: collectSessionRows(form)
    };
    state.events.unshift(event);
    selectedEventId = id;
    saveState();
    closeModal();
    toast("Evento criado.");
    renderAdmin();
  });

  refreshIcons();
}

function validateEventIdentityStep(form) {
  const title = form.querySelector("input[name='title']");
  clearFieldError(title);
  if (!title.value.trim()) {
    setFieldError(title, "Informe o nome do evento.");
    return false;
  }
  return true;
}

function collectSessionRows(scope) {
  return Array.from(scope.querySelectorAll(".session-row")).map((row, index) => {
    const label = row.querySelector("[data-session-field='label']").value.trim() || `Sessão ${index + 1}`;
    const existingId = row.dataset.sessionId || slugify(label) || "sessao";
    return {
      id: existingId,
      label,
      capacity: Number(row.querySelector("[data-session-field='capacity']").value || 0),
      private: row.querySelector("[data-session-field='private']").checked
    };
  });
}

function duplicateEvent(event) {
  const copy = structuredClone(event);
  copy.id = "evt_" + randomId(8);
  copy.title = `${event.title} - cópia`;
  copy.slug = uniqueSlug(`${event.slug}-copia`);
  copy.createdAt = new Date().toISOString();
  state.events.unshift(copy);
  selectedEventId = copy.id;
  saveState();
  toast("Evento duplicado.");
  renderAdmin();
}

function uniqueSlug(base) {
  let slug = slugify(base) || "evento";
  let counter = 2;
  while (state.events.some((event) => event.slug === slug)) {
    slug = `${slugify(base)}-${counter}`;
    counter += 1;
  }
  return slug;
}

function deleteEvent(event) {
  if (state.events.length <= 1) {
    toast("Mantenha ao menos um evento.", true);
    return;
  }
  const requiredPhrase = `Excluir ${event.title}`;
  showModal(`
    <div class="modal-header">
      <div>
        <p class="kicker">Excluir evento</p>
        <h2>${escapeHtml(event.title)}</h2>
      </div>
      <button class="btn icon ghost" type="button" data-action="close-modal" aria-label="Fechar"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      <form id="delete-event-form" class="content-stack" novalidate>
        <div class="delete-confirmation">
          <strong>Esta ação remove o evento e todos os participantes dele.</strong>
          <span>Para confirmar, digite exatamente:</span>
          <code>${escapeHtml(requiredPhrase)}</code>
        </div>
        <label class="field">
          <span>Confirmação</span>
          <input name="deleteConfirmation" autocomplete="off" placeholder="${escapeHtml(requiredPhrase)}">
        </label>
        <div class="button-row">
          <button class="btn" type="button" data-action="close-modal"><i data-lucide="x"></i><span>Cancelar</span></button>
          <button class="btn danger" type="submit" disabled><i data-lucide="trash-2"></i><span>Excluir evento</span></button>
        </div>
      </form>
    </div>
  `);
  bindDeleteEventConfirmation(event, requiredPhrase);
}

function bindDeleteEventConfirmation(event, requiredPhrase) {
  const form = document.getElementById("delete-event-form");
  const input = form?.querySelector("input[name='deleteConfirmation']");
  const submitButton = form?.querySelector("button[type='submit']");
  if (!form || !input || !submitButton) return;

  const matchesPhrase = () => input.value.trim() === requiredPhrase;
  const sync = () => {
    clearFieldError(input);
    submitButton.disabled = !matchesPhrase();
  };

  input.addEventListener("input", sync);
  form.addEventListener("submit", (submitEvent) => {
    submitEvent.preventDefault();
    if (!matchesPhrase()) {
      setFieldError(input, `Digite exatamente: ${requiredPhrase}`);
      submitButton.disabled = true;
      return;
    }

    performDeleteEvent(event);
  });

  sync();
  input.focus();
}

function performDeleteEvent(event) {
  state.events = state.events.filter((item) => item.id !== event.id);
  state.participants = state.participants.filter((participant) => participant.eventId !== event.id);
  const settings = siteSettings();
  if (settings.homeEventId === event.id) {
    settings.homeEventId = state.events[0]?.id || "";
    if (!settings.homeEventId && settings.homeMode === "event") settings.homeMode = "login";
  }
  selectedEventId = state.events[0].id;
  saveState();
  closeModal();
  toast("Evento excluído.");
  renderAdmin();
}

function addSession(event) {
  const editor = document.getElementById("session-editor");
  const id = "sessao-" + randomId(5);
  editor.insertAdjacentHTML("beforeend", renderSessionRow({ id, label: "Nova sessão", capacity: 100, private: false }));
  editor.querySelector(`[data-session-id="${id}"] [data-session-field="label"]`)?.focus();
  bindSessionRemoveButtons();
  refreshIcons();
}

function bindSessionRemoveButtons(root = document) {
  root.querySelectorAll("[data-action='remove-session']").forEach((button) => {
    button.onclick = () => {
      const row = button.closest(".session-row");
      const editor = button.closest(".session-editor");
      const allowEmpty = editor?.dataset.allowEmpty === "true";
      if (!allowEmpty && editor?.querySelectorAll(".session-row").length <= 1) {
        toast("Mantenha ao menos uma sessão.", true);
        return;
      }
      row.remove();
    };
  });
}

function openParticipantModal(event) {
  showModal(`
    <div class="modal-header">
      <div>
        <p class="kicker">Participante</p>
        <h2>Adicionar inscrição</h2>
      </div>
      <button class="btn icon ghost" type="button" data-action="close-modal" aria-label="Fechar"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      ${participantFormHtml(event, "add-participant-form")}
    </div>
  `);

  bindParticipantWizard(event, document.getElementById("add-participant-form"), () => {
    closeModal();
    toast("Participante adicionado.");
    renderAdmin();
  });
}

function participantFormHtml(event, id) {
  const allowGuests = Boolean(event.allowGuests);
  const confirmStep = allowGuests ? 3 : 2;
  const submitLabel = eventRsvpButtonLabel(event);
  return `
    <form id="${id}" class="content-stack participant-wizard" data-step="1" data-allow-guests="${allowGuests}" novalidate>
      <div class="wizard-progress ${allowGuests ? "three" : ""}" aria-label="Etapas da confirmação">
        <span class="step-pill active" data-step-pill="1"><strong>1</strong> Dados</span>
        ${allowGuests ? `<span class="step-pill" data-step-pill="2"><strong>2</strong> Convidado</span>` : ""}
        <span class="step-pill" data-step-pill="${confirmStep}"><strong>${confirmStep}</strong> Confirmar presença</span>
      </div>

      <div class="form-step active" data-step-panel="1">
        <div class="form-grid">
          <label class="field">
            <span>Nome completo</span>
            <input name="name" required autocomplete="name" placeholder="Ex.: Ana Carolina Alves">
          </label>
          <label class="field">
            <span>E-mail</span>
            <input name="email" type="email" inputmode="email" required autocomplete="email" placeholder="nome@email.com">
          </label>
          <label class="field">
            <span>Telefone</span>
            <input name="phone" type="tel" inputmode="tel" required autocomplete="tel" placeholder="(11) 90000-0000">
          </label>
          <label class="field">
            <span>Cidade</span>
            <input name="city" autocomplete="address-level2" placeholder="Cidade/UF">
          </label>
        </div>
        <div class="button-row">
          <button class="btn primary" type="button" data-action="wizard-next"><i data-lucide="arrow-right"></i><span>Continuar</span></button>
        </div>
      </div>

      ${allowGuests ? `
        <div class="form-step" data-step-panel="2" hidden>
          <div class="guest-step-copy">
            <h3>Vai levar convidado?</h3>
            <p>Se sim, informe o nome completo do convidado antes de confirmar a presença.</p>
          </div>
          <div class="guest-choice">
            <label class="choice-card">
              <input type="radio" name="guestChoice" value="no" checked>
              <span>
                <strong>Não vou levar convidado</strong>
                <small>Minha confirmação será individual.</small>
              </span>
            </label>
            <label class="choice-card">
              <input type="radio" name="guestChoice" value="yes">
              <span>
                <strong>Vou levar convidado</strong>
                <small>Será necessário informar o nome.</small>
              </span>
            </label>
          </div>
          <label class="field" data-guest-name-field hidden>
            <span>Nome do convidado</span>
            <input name="guestName" autocomplete="name" placeholder="Nome completo do convidado">
          </label>
          <div class="button-row">
            <button class="btn" type="button" data-action="wizard-back"><i data-lucide="arrow-left"></i><span>Voltar</span></button>
            <button class="btn primary" type="button" data-action="wizard-next"><i data-lucide="arrow-right"></i><span>Continuar</span></button>
          </div>
        </div>
      ` : ""}

      <div class="form-step" data-step-panel="${confirmStep}" hidden>
        <label class="field">
          <span>Sessão</span>
          <select name="sessionId" required>
            ${event.sessions.length
              ? event.sessions.map((session) => `<option value="${session.id}">${escapeHtml(session.label)}${session.private ? " - reservada" : ""}</option>`).join("")
              : `<option value="">Nenhuma sessão cadastrada</option>`}
          </select>
        </label>

        <div class="review-box" aria-live="polite">
          <div>
            <span>Nome</span>
            <strong data-review="name">-</strong>
          </div>
          <div>
            <span>E-mail</span>
            <strong data-review="email">-</strong>
          </div>
          <div>
            <span>Telefone</span>
            <strong data-review="phone">-</strong>
          </div>
          <div>
            <span>Sessão</span>
            <strong data-review="session">-</strong>
          </div>
          ${allowGuests ? `
            <div>
              <span>Convidado</span>
              <strong data-review="guest">-</strong>
            </div>
          ` : ""}
        </div>

        <div class="button-row">
          <button class="btn" type="button" data-action="wizard-back"><i data-lucide="arrow-left"></i><span>Voltar</span></button>
          <button class="btn primary" type="submit"><i data-lucide="ticket-check"></i><span>${escapeHtml(submitLabel)}</span></button>
        </div>
      </div>
    </form>
  `;
}

function bindParticipantWizard(event, form, onComplete) {
  if (!form) return;
  const allowGuests = form.dataset.allowGuests === "true";
  const confirmStep = allowGuests ? 3 : 2;

  form.querySelectorAll("[data-action='wizard-next']").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(form.dataset.step || 1);
      if (step === 1 && !validateParticipantForm(form, { includeSession: false, includeGuest: false })) return;
      if (step === 2 && allowGuests && !validateGuestStep(form)) return;
      updateParticipantReview(event, form);
      setWizardStep(form, step === 1 && !allowGuests ? confirmStep : Math.min(step + 1, confirmStep));
    });
  });

  form.querySelectorAll("[data-action='wizard-back']").forEach((button) => {
    button.addEventListener("click", () => {
      const step = Number(form.dataset.step || 1);
      setWizardStep(form, Math.max(step - 1, 1));
    });
  });

  form.querySelector("select[name='sessionId']")?.addEventListener("change", () => {
    updateParticipantReview(event, form);
    clearFieldError(form.querySelector("select[name='sessionId']"));
  });

  form.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", () => clearFieldError(input));
    input.addEventListener("blur", () => {
      if (input.name === "email") input.value = input.value.trim().toLowerCase();
      if (input.name === "phone") input.value = formatPhone(input.value);
      updateParticipantReview(event, form);
    });
  });
  form.querySelectorAll("input[name='guestChoice']").forEach((input) => {
    input.addEventListener("change", () => {
      updateGuestFieldVisibility(form);
      updateParticipantReview(event, form);
    });
  });

  form.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    if (!validateParticipantForm(form, { includeSession: true, includeGuest: allowGuests })) {
      const invalidStep = form.querySelector("[aria-invalid='true']")?.closest("[data-step-panel]")?.dataset.stepPanel;
      if (invalidStep) setWizardStep(form, Number(invalidStep));
      return;
    }
    const submitButton = form.querySelector("button[type='submit']");
    submitButton?.setAttribute("disabled", "disabled");
    try {
      const participant = await createParticipantFromForm(event, form);
      if (!participant) return;
      onComplete(participant);
    } finally {
      submitButton?.removeAttribute("disabled");
    }
  });

  updateGuestFieldVisibility(form);
  updateParticipantReview(event, form);
}

function setWizardStep(form, step) {
  form.dataset.step = String(step);
  form.querySelectorAll("[data-step-panel]").forEach((panel) => {
    const active = Number(panel.dataset.stepPanel) === step;
    panel.hidden = !active;
    panel.classList.toggle("active", active);
  });
  form.querySelectorAll("[data-step-pill]").forEach((pill) => {
    pill.classList.toggle("active", Number(pill.dataset.stepPill) === step);
  });
}

function updateParticipantReview(event, form) {
  const formData = new FormData(form);
  const session = sessionById(event, formData.get("sessionId"));
  const wantsGuest = formData.get("guestChoice") === "yes";
  const values = {
    name: formData.get("name")?.trim() || "-",
    email: formData.get("email")?.trim() || "-",
    phone: formData.get("phone")?.trim() || "-",
    session: session?.label || "-",
    guest: wantsGuest ? formData.get("guestName")?.trim() || "Nome pendente" : "Não"
  };

  Object.entries(values).forEach(([key, value]) => {
    const target = form.querySelector(`[data-review="${key}"]`);
    if (target) target.textContent = value;
  });
}

function updateGuestFieldVisibility(form) {
  const wantsGuest = form.querySelector("input[name='guestChoice']:checked")?.value === "yes";
  const field = form.querySelector("[data-guest-name-field]");
  const input = form.querySelector("input[name='guestName']");
  if (!field || !input) return;
  field.hidden = !wantsGuest;
  input.required = wantsGuest;
  input.disabled = !wantsGuest;
  if (!wantsGuest) {
    input.value = "";
    clearFieldError(input);
    return;
  }
  window.setTimeout(() => input.focus(), 0);
}

function validateGuestStep(form) {
  const guestName = form.querySelector("input[name='guestName']");
  if (form.querySelector("input[name='guestChoice']:checked")?.value !== "yes") {
    clearFieldError(guestName);
    return true;
  }
  if (!guestName.value.trim()) {
    setFieldError(guestName, "Informe o nome do convidado.");
    return false;
  }
  clearFieldError(guestName);
  return true;
}

function validateParticipantForm(form, options = { includeSession: true, includeGuest: false }) {
  const fields = {
    name: form.querySelector("input[name='name']"),
    email: form.querySelector("input[name='email']"),
    phone: form.querySelector("input[name='phone']"),
    sessionId: form.querySelector("select[name='sessionId']"),
    guestName: form.querySelector("input[name='guestName']")
  };

  let valid = true;
  Object.values(fields).forEach(clearFieldError);

  if (!fields.name.value.trim()) {
    setFieldError(fields.name, "Informe o nome completo.");
    valid = false;
  }

  if (!isValidEmail(fields.email.value)) {
    setFieldError(fields.email, "Informe um e-mail válido.");
    valid = false;
  }

  if (!isValidPhone(fields.phone.value)) {
    setFieldError(fields.phone, "Informe um telefone válido com DDD.");
    valid = false;
  }

  if (options.includeSession && !fields.sessionId.value) {
    setFieldError(fields.sessionId, "Selecione uma sessão.");
    valid = false;
  }

  if (options.includeGuest && !validateGuestStep(form)) {
    valid = false;
  }

  return valid;
}

function setFieldError(field, message) {
  if (!field) return;
  field.setCustomValidity(message);
  field.setAttribute("aria-invalid", "true");
  const wrapper = field.closest(".field");
  if (!wrapper) return;

  wrapper.classList.add("invalid");
  let error = wrapper.querySelector(".field-error");
  if (!error) {
    error = document.createElement("span");
    error.className = "field-error";
    wrapper.appendChild(error);
  }
  error.textContent = message;
}

function clearFieldError(field) {
  if (!field) return;
  field.setCustomValidity("");
  field.removeAttribute("aria-invalid");
  const wrapper = field.closest(".field");
  wrapper?.classList.remove("invalid");
  wrapper?.querySelector(".field-error")?.remove();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(value || "").trim());
}

function isValidPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
  return digits.length === 10 || digits.length === 11;
}

function formatPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) digits = digits.slice(2);
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return String(value || "").trim();
}

function cacheStateLocally() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  applyTheme();
}

function applyParticipantServerError(form, error) {
  const field = error?.payload?.field;
  const message = error?.message || "Nao foi possivel salvar sua confirmacao. Tente novamente.";
  if (field) {
    const input = form.querySelector(`[name='${field}']`);
    setFieldError(input, message);
    const invalidStep = input?.closest("[data-step-panel]")?.dataset.stepPanel;
    if (invalidStep) setWizardStep(form, Number(invalidStep));
  }
  toast(message, true);
}

function storeParticipantFromServer(event, participant) {
  state.participants = state.participants.filter((item) => {
    if (item.id === participant.id) return false;
    if (item.eventId !== event.id) return true;
    return normalizeEmail(item.email) !== normalizeEmail(participant.email)
      && normalizePhone(item.phone) !== normalizePhone(participant.phone);
  });
  state.participants.push(participant);
  cacheStateLocally();
}

async function savePublicParticipant(event, data, form) {
  try {
    const payload = await apiFetch("register_participant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: event.id, participant: data })
    });
    if (!payload.participant) throw new Error("Confirmacao sem participante retornado.");
    storeParticipantFromServer(event, payload.participant);
    return payload.participant;
  } catch (error) {
    applyParticipantServerError(form, error);
    return null;
  }
}

async function createParticipantFromForm(event, form) {
  const formData = new FormData(form);
  const sessionId = formData.get("sessionId");
  const session = sessionById(event, sessionId);
  if (!session) {
    toast("Selecione uma sessão válida.", true);
    return null;
  }
  const email = normalizeEmail(formData.get("email"));
  const phone = normalizePhone(formData.get("phone"));
  const guestName = formData.get("guestChoice") === "yes" ? formData.get("guestName") : "";
  const requestPeople = requestedHeadcount({ guestName });
  const usePublicServerSave = remotePersistenceReady && canUseRemoteApi() && !isAdminAuthenticated();
  if (!usePublicServerSave) {
    const duplicate = participantsForEvent(event.id).find((participant) => {
      return normalizeEmail(participant.email) === email || normalizePhone(participant.phone) === phone;
    });
    if (duplicate) {
      const emailInput = form.querySelector("input[name='email']");
      const phoneInput = form.querySelector("input[name='phone']");
      if (normalizeEmail(duplicate.email) === email) setFieldError(emailInput, "Este e-mail já está inscrito neste evento.");
      if (normalizePhone(duplicate.phone) === phone) setFieldError(phoneInput, "Este telefone já está inscrito neste evento.");
      toast("Essa pessoa já possui inscrição neste evento.", true);
      setWizardStep(form, 1);
      return null;
    }
    const used = sessionHeadcount(event, sessionId);
    if (session.capacity && used + requestPeople > Number(session.capacity)) {
      toast("Sessão sem vagas disponíveis.", true);
      return null;
    }
  }

  const participantData = {
    name: formData.get("name"),
    email,
    phone: formatPhone(formData.get("phone")),
    city: formData.get("city"),
    guestName,
    sessionId
  };

  if (usePublicServerSave) return savePublicParticipant(event, participantData, form);

  const participant = makeParticipant(event, participantData);
  state.participants.push(participant);
  saveState();
  return participant;
}

function renderPublicEvent(event) {
  const participants = participantsForEvent(event.id);
  const confirmedPeople = participantsHeadcount(participants);
  const capacity = getEventCapacity(event);
  const available = capacity ? Math.max(capacity - confirmedPeople, 0) : null;
  const hasSessions = event.sessions.length > 0;
  const admin = isAdminAuthenticated();
  const scheduleText = eventScheduleText(event);
  const rsvpButtonLabel = eventRsvpButtonLabel(event);

  document.getElementById("app").innerHTML = `
    <main class="public-page">
      <header class="topbar">
        <div class="topbar-inner brand-${escapeHtml(brandPosition())}">
          ${renderBrandLink(admin ? adminHref() : eventHref(event.slug))}
          <nav class="nav-actions" aria-label="Navegação">
            ${admin ? `<a class="btn ghost" href="${escapeHtml(adminHref())}"><i data-lucide="settings"></i><span>Painel</span></a><button class="btn ghost" type="button" data-action="logout-admin"><i data-lucide="log-out"></i><span>Sair</span></button>` : ""}
          </nav>
        </div>
      </header>

      <section class="public-hero">
        <div class="cover-frame">
          <img src="${escapeHtml(imageSrc(event.coverUrl))}" alt="${escapeHtml(event.title)}">
        </div>
      </section>

      <section class="public-content">
        <article class="event-main">
          <p class="kicker">${escapeHtml(event.subtitle || "Confirmação de presença")}</p>
          <h1>${escapeHtml(event.title)}</h1>
          <div class="event-meta-grid">
            <div class="meta-item">
              <span class="meta-icon"><i data-lucide="calendar-days"></i></span>
              <div>
                <div class="meta-label">Data</div>
                <div class="meta-value">${escapeHtml(event.dateLabel)}</div>
                ${scheduleText ? `<div class="meta-sub">${escapeHtml(scheduleText)}</div>` : ""}
              </div>
            </div>
            <div class="meta-item">
              <span class="meta-icon"><i data-lucide="map-pin"></i></span>
              <div>
                <div class="meta-label">Local</div>
                <div class="meta-value">${escapeHtml(event.locationName)}</div>
                <div class="meta-sub">${escapeHtml(event.address)}</div>
                ${event.mapsUrl ? `<a class="btn small ghost" href="${escapeHtml(event.mapsUrl)}" target="_blank" rel="noreferrer"><i data-lucide="navigation"></i><span>Ver mapa</span></a>` : ""}
              </div>
            </div>
          </div>
          <h2>Sobre o evento</h2>
          <div class="event-description">${textToParagraphs(event.description)}</div>
        </article>

        <aside class="event-side">
          <div class="side-block">
            <button class="btn primary" type="button" data-action="open-rsvp" ${hasSessions ? "" : "disabled"}><i data-lucide="ticket-check"></i><span>${hasSessions ? escapeHtml(rsvpButtonLabel) : "Sem sessões"}</span></button>
            <div class="badge-row">
              ${admin ? `<span class="badge success"><i data-lucide="users"></i>${confirmedPeople} confirmados</span>` : ""}
              ${admin && available !== null ? `<span class="badge"><i data-lucide="armchair"></i>${available} vagas</span>` : ""}
              ${event.allowGuests ? `<span class="badge"><i data-lucide="user-plus"></i>convidado liberado</span>` : ""}
            </div>
          </div>

          <div class="organizer">
            <img src="${escapeHtml(imageSrc(event.organizerImage, BLANK_AVATAR))}" alt="">
            <div>
              <div class="meta-label">Organizador</div>
              <div class="meta-value">${escapeHtml(event.organizerName)}</div>
              <div class="meta-sub">${escapeHtml(event.organizerPhone)}</div>
            </div>
          </div>

          <div class="side-block" style="margin-top: 18px;">
            <h3>Sessões</h3>
            <div class="session-list">
              ${event.sessions.length ? event.sessions.map((session) => {
                const used = sessionHeadcount(event, session.id);
                return `
                  <div class="session-pill">
                    <strong>${escapeHtml(session.label)}</strong>
                    <span>${admin ? `${used}/${session.capacity || "sem limite"} confirmados${session.private ? " · reservada" : ""}` : `${session.private ? "Sessão reservada" : "Inscrição disponível"}`}</span>
                  </div>
                `;
              }).join("") : `<div class="session-pill"><strong>Nenhuma sessão cadastrada</strong><span>Cadastre uma sessão no painel para abrir inscrições.</span></div>`}
            </div>
          </div>
        </aside>
      </section>

      <div class="sticky-cta">
        <div class="sticky-cta-inner">
          <div>
            <div class="sticky-cta-title">${escapeHtml(event.title)}</div>
            <div class="sticky-cta-sub">${escapeHtml(event.dateLabel)} · ${escapeHtml(event.locationName)}</div>
          </div>
          <button class="btn primary" type="button" data-action="open-rsvp" ${hasSessions ? "" : "disabled"}><i data-lucide="ticket-check"></i><span>${hasSessions ? escapeHtml(rsvpButtonLabel) : "Sem sessões"}</span></button>
        </div>
      </div>
    </main>
  `;

  document.querySelectorAll("[data-action='open-rsvp']").forEach((button) => {
    button.addEventListener("click", () => openRsvpModal(event));
  });
  document.querySelector("[data-action='logout-admin']")?.addEventListener("click", logoutAdmin);
  refreshIcons();
}

function openRsvpModal(event) {
  showModal(`
    <div class="modal-header">
      <div>
        <p class="kicker">Confirmação</p>
        <h2>${escapeHtml(event.title)}</h2>
      </div>
      <button class="btn icon ghost" type="button" data-action="close-modal" aria-label="Fechar"><i data-lucide="x"></i></button>
    </div>
    <div class="modal-body">
      ${participantFormHtml(event, "rsvp-form")}
    </div>
  `);

  bindParticipantWizard(event, document.getElementById("rsvp-form"), (participant) => {
    closeModal();
    window.location.href = ticketHref(participant.id);
  });
}

function renderTicket(participant) {
  const event = eventById(participant.eventId);
  if (!event) return renderNotFound("Evento do ticket não encontrado");
  const session = sessionById(event, participant.sessionId);
  const admin = isAdminAuthenticated();
  const showWhatsappGroup = hasWhatsappGroup(event);
  const ticketPayload = JSON.stringify({
    ticket: participant.ticketCode,
    participantId: participant.id,
    event: event.slug,
    url: getTicketUrl(participant)
  });

  document.getElementById("app").innerHTML = `
    <main class="ticket-page">
      <div class="ticket-wrap">
        <div class="button-row" style="margin: 0 0 16px;">
          <a class="btn" href="${escapeHtml(eventHref(event.slug))}"><i data-lucide="arrow-left"></i><span>Voltar ao evento</span></a>
          ${admin
            ? `<a class="btn ghost" href="${escapeHtml(adminHref())}"><i data-lucide="layout-dashboard"></i><span>Painel</span></a><button class="btn ghost" type="button" data-action="logout-admin"><i data-lucide="log-out"></i><span>Sair</span></button>`
            : ""}
        </div>
        <section class="ticket-sheet">
          <img class="ticket-cover" src="${escapeHtml(imageSrc(event.coverUrl))}" alt="${escapeHtml(event.title)}">
          <div class="ticket-content">
            <div class="ticket-details">
              <div>
                <p class="kicker">Presença confirmada</p>
                <h1>${escapeHtml(participant.name)}</h1>
              </div>
              <div class="badge-row">
                <span class="badge success"><i data-lucide="ticket-check"></i>${participant.checkInAt ? "Presente" : "Confirmado"}</span>
                ${participant.checkInAt ? `<span class="badge"><i data-lucide="check"></i>Check-in ${formatDateTime(participant.checkInAt)}</span>` : ""}
              </div>
              <div>
                <h2>${escapeHtml(event.title)}</h2>
                <p class="muted">${escapeHtml(session?.label || "")}</p>
                <p class="muted">${escapeHtml(event.dateLabel)} · ${escapeHtml(event.locationName)}</p>
                ${participant.guestName ? `<p class="muted">Convidado: ${escapeHtml(participant.guestName)}</p>` : ""}
              </div>
              <span class="ticket-code mono">${escapeHtml(participant.ticketCode)}</span>
              <div class="button-row">
                <button class="btn primary" type="button" data-action="print-ticket"><i data-lucide="printer"></i><span>Imprimir</span></button>
                <button class="btn" type="button" data-action="copy-ticket-public"><i data-lucide="copy"></i><span>Copiar link</span></button>
                ${showWhatsappGroup ? `<a class="btn whatsapp" href="${escapeHtml(whatsappGroupUrl(event))}" target="_blank" rel="noopener noreferrer"><i data-lucide="message-circle"></i><span>Entrar no grupo de WhatsApp</span></a>` : ""}
              </div>
            </div>
            <div class="qr-box">
              <div id="qr-code" class="qr-target" aria-label="QR Code do participante"></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  `;

  renderQrCode(ticketPayload);
  document.querySelector("[data-action='print-ticket']")?.addEventListener("click", () => window.print());
  document.querySelector("[data-action='copy-ticket-public']")?.addEventListener("click", () => copyText(getTicketUrl(participant), "Link do ticket copiado."));
  document.querySelector("[data-action='logout-admin']")?.addEventListener("click", logoutAdmin);
  refreshIcons();
}

function renderQrCode(value) {
  const target = document.getElementById("qr-code");
  if (!target) return;
  target.innerHTML = "";
  if (window.QRCode?.toCanvas) {
    const canvas = document.createElement("canvas");
    canvas.width = 220;
    canvas.height = 220;
    target.appendChild(canvas);
    window.QRCode.toCanvas(canvas, value, {
      width: 220,
      margin: 1,
      color: { dark: "#111827", light: "#ffffff" }
    }, (error) => {
      if (error) renderQrFallback(target, value);
    });
    return;
  }
  if (typeof window.QRCode === "function") {
    new window.QRCode(target, {
      text: value,
      width: 220,
      height: 220,
      colorDark: "#111827",
      colorLight: "#ffffff",
      correctLevel: window.QRCode.CorrectLevel?.M
    });
    return;
  }
  renderQrFallback(target, value);
}

function renderQrFallback(target, value) {
  target.innerHTML = "";
  const img = document.createElement("img");
  img.alt = "QR Code do participante";
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(value)}`;
  target.appendChild(img);
}

function showModal(html) {
  closeModal(false);
  document.body.classList.add("modal-open");
  currentModal = document.createElement("div");
  currentModal.className = "modal-backdrop";
  currentModal.innerHTML = `<section class="modal" role="dialog" aria-modal="true">${html}</section>`;
  document.body.appendChild(currentModal);
  currentModal.addEventListener("click", (event) => {
    if (event.target === currentModal || event.target.closest("[data-action='close-modal']")) closeModal();
  });
  document.addEventListener("keydown", closeOnEscape);
  refreshIcons();
}

function closeModal(renderAfter = false) {
  if (!currentModal) return;
  currentModal.remove();
  currentModal = null;
  document.body.classList.remove("modal-open");
  document.removeEventListener("keydown", closeOnEscape);
  if (renderAfter) render();
}

function closeOnEscape(event) {
  if (event.key === "Escape") closeModal();
}

function validateTicket(event, value) {
  const code = String(value || "").trim();
  if (!code) return;
  const participantIdFromUrl = code.match(/ticket\/([^?#]+)/)?.[1];
  const normalized = decodeURIComponent(participantIdFromUrl || code);
  const participant = participantsForEvent(event.id).find((item) =>
    item.id === normalized ||
    item.ticketCode.toLowerCase() === normalized.toLowerCase() ||
    normalized.includes(item.id) ||
    normalized.toLowerCase().includes(item.ticketCode.toLowerCase())
  );

  if (!participant) {
    toast("Ticket não encontrado para este evento.", true);
    return;
  }
  participant.checkInAt = participant.checkInAt || new Date().toISOString();
  saveState();
  toast(`${participant.name} validado.`);
  renderAdmin();
}

function toggleCheckIn(id) {
  const participant = state.participants.find((item) => item.id === id);
  if (!participant) return;
  participant.checkInAt = participant.checkInAt ? null : new Date().toISOString();
  saveState();
  renderAdmin();
}

function deleteParticipant(id) {
  const participant = state.participants.find((item) => item.id === id);
  if (!participant) return;
  if (!confirm(`Excluir inscricao de ${participant.name}?`)) return;
  state.participants = state.participants.filter((item) => item.id !== id);
  saveState();
  renderAdmin();
}

function exportCsv(event) {
  const rows = participantsForEvent(event.id).map((participant) => {
    const session = sessionById(event, participant.sessionId);
    return {
      nome: participant.name,
      email: participant.email,
      telefone: participant.phone,
      cidade: participant.city,
      convidado: participant.guestName || "",
      numero_convidados: participantGuestCount(participant),
      total_pessoas: participantHeadcount(participant),
      sessao: session?.label || "",
      codigo: participant.ticketCode,
      status: participant.checkInAt ? "presente" : "confirmado",
      inscricao: formatDateTime(participant.createdAt),
      checkin: participant.checkInAt ? formatDateTime(participant.checkInAt) : "",
      ticket: getTicketUrl(participant)
    };
  });
  const header = Object.keys(rows[0] || {
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    convidado: "",
    numero_convidados: "",
    total_pessoas: "",
    sessao: "",
    codigo: "",
    status: "",
    inscricao: "",
    checkin: "",
    ticket: ""
  });
  const csv = [header.join(",")].concat(rows.map((row) => header.map((key) => csvCell(row[key])).join(","))).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.slug}-participantes.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

async function copyText(text, message) {
  try {
    await navigator.clipboard.writeText(text);
    toast(message);
  } catch {
    prompt("Copie o link:", text);
  }
}

function toast(message, isError = false) {
  document.querySelector(".toast")?.remove();
  const node = document.createElement("div");
  node.className = `toast${isError ? " error" : ""}`;
  node.textContent = message;
  document.body.appendChild(node);
  window.setTimeout(() => node.remove(), 2800);
}

function renderNotFound(message) {
  const admin = isAdminAuthenticated();
  const fallbackSlug = state.events[0]?.slug || "";
  renderShell(`
    <main class="page">
      <section class="panel">
        <div class="panel-body empty-state">
          <div>
            <h1>${escapeHtml(message)}</h1>
            <div class="button-row">
              <a class="btn primary" href="${escapeHtml(admin ? adminHref() : eventHref(fallbackSlug))}"><i data-lucide="${admin ? "layout-dashboard" : "eye"}"></i><span>${admin ? "Voltar ao painel" : "Ver evento"}</span></a>
            </div>
          </div>
        </div>
      </section>
    </main>
  `);
}

function bootApp() {
  render();
  loadRemoteStateIfAvailable();
}

window.addEventListener("hashchange", render);
window.addEventListener("popstate", render);
window.addEventListener("DOMContentLoaded", bootApp);
