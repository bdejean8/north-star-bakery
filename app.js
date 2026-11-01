"use strict";
// Product data is kept separate from the page markup.
const PRODUCTS = [
  { id: "sourdough", name: "Country Sourdough", description: "Tangy artisan loaf", price: "$7–$10" },
  { id: "grain", name: "Harvest Grain", description: "Hearty seeded bread", price: "$8–$11" },
  { id: "pastries", name: "Morning Pastries", description: "Croissants and seasonal rolls", price: "$3–$6" }
];
const STORAGE_KEYS = { favorites: "northStarFavorites", draft: "northStarInquiryDraft" };

function getStoredJson(key, fallback) {
  try { const data = localStorage.getItem(key); return data ? JSON.parse(data) : fallback; }
  catch (error) { return fallback; }
}
function saveStoredJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch (error) { return false; }
}
function readFavorites() {
  const ids = getStoredJson(STORAGE_KEYS.favorites, []);
  return Array.isArray(ids) ? ids.filter(id => PRODUCTS.some(p => p.id === id)) : [];
}
function showFavoriteSummary(favorites) {
  const summary = document.querySelector("#favorites-summary");
  if (summary) summary.textContent = favorites.length
    ? `Saved ${favorites.length} favorite${favorites.length === 1 ? "" : "s"}: ${PRODUCTS.filter(p => favorites.includes(p.id)).map(p => p.name).join(", ")}.`
    : "No favorites saved yet. Pick a product to remember it for later.";
}
function toggleFavorite(id) {
  const favorites = readFavorites();
  const updated = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
  const stored = saveStoredJson(STORAGE_KEYS.favorites, updated);
  renderFavorites();
  if (!stored) document.querySelector("#favorites-summary").textContent += " (Browser storage unavailable; changes may not persist.)";
}
function renderFavorites() {
  const grid = document.querySelector("#favorite-grid");
  if (!grid) return;
  const favorites = readFavorites();
  grid.replaceChildren();
  PRODUCTS.forEach(product => {
    const card = document.createElement("article");
    card.className = "favorite-card";
    const heading = document.createElement("h3"); heading.textContent = product.name;
    const description = document.createElement("p"); description.textContent = `${product.description} · ${product.price}`;
    const button = document.createElement("button"); button.type = "button";
    const isSaved = favorites.includes(product.id);
    button.setAttribute("aria-pressed", String(isSaved));
    button.textContent = isSaved ? "♥ Saved — Remove" : "♡ Save favorite";
    button.addEventListener("click", () => toggleFavorite(product.id));
    card.append(heading, description, button); grid.append(card);
  });
  showFavoriteSummary(favorites);
}
function showFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const error = document.getElementById(`${fieldId}-error`);
  if (field) { field.classList.toggle("field-invalid", Boolean(message)); field.setAttribute("aria-invalid", String(Boolean(message))); }
  if (error) error.textContent = message;
}
function validateInquiry(form) {
  const name = form.elements.namedItem("name").value.trim();
  const email = form.elements.namedItem("email").value.trim();
  const details = form.elements.namedItem("item-details").value.trim();
  const date = form.elements.namedItem("pickup-date").value;
  const type = form.querySelector('input[name="request-type"]:checked');
  const messages = {
    name: name.length < 2 ? "Enter your name (at least 2 characters)." : "",
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Enter a valid email address, such as name@example.com.",
    "pickup-date": date ? "" : "Choose a pickup date.",
    "item-details": details.length >= 5 ? "" : "Provide at least 5 characters describing your request."
  };
  Object.entries(messages).forEach(([fieldId, message]) => showFieldError(fieldId, message));
  document.querySelector("#request-type-error").textContent = type ? "" : "Choose a request type.";
  return !Object.values(messages).some(Boolean) && Boolean(type);
}
function getInquiryDraft(form) {
  return { name: form.elements.namedItem("name").value, email: form.elements.namedItem("email").value,
    date: form.elements.namedItem("pickup-date").value,
    type: form.querySelector('input[name="request-type"]:checked')?.value || "",
    details: form.elements.namedItem("item-details").value,
    allergy: form.elements.namedItem("allergy-notes").value };
}
function populateDraft(form) {
  const draft = getStoredJson(STORAGE_KEYS.draft, {});
  const fields = { name: "name", email: "email", date: "pickup-date", details: "item-details", allergy: "allergy-notes" };
  Object.entries(fields).forEach(([key, field]) => { if (typeof draft[key] === "string") form.elements.namedItem(field).value = draft[key]; });
  if (typeof draft.type === "string") {
    const choice = Array.from(form.querySelectorAll('input[name="request-type"]')).find(input => input.value === draft.type);
    if (choice) choice.checked = true;
  }
}
function initForm() {
  const form = document.querySelector("#inquiry-form"); if (!form) return;
  populateDraft(form);
  const names = PRODUCTS.filter(product => readFavorites().includes(product.id)).map(product => product.name);
  document.querySelector("#saved-favorites").textContent = names.length ? `Your saved favorites: ${names.join(", ")}. Mention these in your request.` : "Visit Products to save favorites before filling out this form.";
  const save = () => saveStoredJson(STORAGE_KEYS.draft, getInquiryDraft(form));
  form.addEventListener("input", save); form.addEventListener("change", save);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const valid = validateInquiry(form);
    document.querySelector("#form-status").textContent = valid
      ? "Your information passed validation. This is a class demonstration; no request was sent. Your draft remains saved in this browser."
      : "Please correct the highlighted fields and try again. Your entries are preserved.";
    save();
    if (!valid) form.querySelector('[aria-invalid="true"]')?.focus();
  });
}
document.addEventListener("DOMContentLoaded", () => { renderFavorites(); initForm(); });
