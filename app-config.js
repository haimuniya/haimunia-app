// Settings for this deployment. Every committed file is served, so nothing
// here may be secret - and in this edition there is nothing secret to hold:
// no accounts, no sign-in, no server of its own.
window.HAIMUNIA_CONFIG = Object.freeze({
  supportWhatsApp: "",
  supportEmail: "haimuniya@gmail.com",

  brand: Object.freeze({
    appName: "האימוניה",
    wordmark: "האימוניה",
    championTitle: "אלוף האימוניה",
  }),
});
