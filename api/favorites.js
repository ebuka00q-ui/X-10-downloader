const STORAGE_KEY = "x10_favorites";

export function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

export function saveFavorites(favorites) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
}

export function isFavorite(id) {
  return getFavorites().some(item => item.id === id);
}

export function addFavorite(item) {
  const favorites = getFavorites();

  if (!favorites.find(f => f.id === item.id)) {
    favorites.push({
      ...item,
      notify: false,
      addedAt: Date.now()
    });

    saveFavorites(favorites);
  }
}

export function removeFavorite(id) {
  saveFavorites(
    getFavorites().filter(item => item.id !== id)
  );
}

export function toggleNotification(id) {
  const favorites = getFavorites();

  const updated = favorites.map(item => {
    if (item.id === id) {
      item.notify = !item.notify;
    }
    return item;
  });

  saveFavorites(updated);
}

export function clearFavorites() {
  localStorage.removeItem(STORAGE_KEY);
}
