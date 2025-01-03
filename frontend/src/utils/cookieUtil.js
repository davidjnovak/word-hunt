export function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${d.toUTCString()}`;
    document.cookie = `${name}=${encodeURIComponent(value)}; ${expires}; path=/`;
  }
  
  export function getCookie(name) {
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    const prefix = name + '=';
    for (let c of ca) {
      let trimmed = c.trim();
      if (trimmed.indexOf(prefix) === 0) {
        return trimmed.substring(prefix.length, trimmed.length);
      }
    }
    return '';
  }