export const saveWebhook = (url) => {
  const existingWebhooks = JSON.parse(localStorage.getItem("servers")) || [];
  if (existingWebhooks.includes(url)) {
    return false;
  }
  existingWebhooks.push(url);
  localStorage.setItem("servers", JSON.stringify(existingWebhooks));
  return true;
};

// Fonction pour valider l'URL d'un webhook Discord
export const validateWebhook = (url) => {
  const pattern = /^https:\/\/discord.com\/api\/webhooks\/[\w-]+\/[\w-]+$/;
  return pattern.test(url);
};
