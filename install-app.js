(() => {
  const button = document.querySelector("#installAppButton");
  const help = document.querySelector("#installAppHelp");
  if (!button || !help) return;

  let installPrompt = null;
  let installedByEvent = false;
  const standaloneDisplay = window.matchMedia("(display-mode: standalone)");
  const isInstalled = () => installedByEvent || standaloneDisplay.matches || window.navigator.standalone === true;
  const updateVisibility = () => {
    button.hidden = isInstalled();
    if (isInstalled()) help.hidden = true;
  };
  const showInstructions = () => {
    const navigatorInfo = window.navigator;
    const isAppleMobile = /iPad|iPhone|iPod/.test(navigatorInfo.userAgent)
      || (navigatorInfo.platform === "MacIntel" && navigatorInfo.maxTouchPoints > 1);
    help.textContent = isAppleMobile
      ? "En iPhone: abrí Compartir en el navegador, elegí «Agregar a pantalla de inicio» y activá «Abrir como app». Necesita Internet para consultar y guardar datos."
      : "En Android: abrí el menú del navegador y elegí «Instalar aplicación» o «Agregar a pantalla principal». Necesita Internet para consultar y guardar datos.";
    help.hidden = false;
  };

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installPrompt = event;
    updateVisibility();
  });
  window.addEventListener("appinstalled", () => {
    installedByEvent = true;
    installPrompt = null;
    updateVisibility();
  });
  if (typeof standaloneDisplay.addEventListener === "function") {
    standaloneDisplay.addEventListener("change", updateVisibility);
  } else if (typeof standaloneDisplay.addListener === "function") {
    standaloneDisplay.addListener(updateVisibility);
  }

  button.addEventListener("click", async () => {
    if (!installPrompt) {
      showInstructions();
      return;
    }
    button.disabled = true;
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch (_error) {
      showInstructions();
    } finally {
      installPrompt = null;
      button.disabled = false;
      updateVisibility();
    }
  });

  updateVisibility();
})();
