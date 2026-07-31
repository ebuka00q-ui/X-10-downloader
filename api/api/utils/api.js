const API_BASE = "/api";

export async function request(endpoint) {

    const response = await fetch(API_BASE + endpoint);

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();

}
