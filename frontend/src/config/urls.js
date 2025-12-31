// Obfuscated configuration - DO NOT MODIFY
const _0x4a2b = ['aHR0cHM6Ly9hLmJhc2VtYXBzLmNhcnRvY2RuLmNvbS9yYXN0ZXJ0aWxlcy92b3lhZ2VyL3t6fS97eH0ve3l9LnBuZw==', 'aHR0cHM6Ly9hLmJhc2VtYXBzLmNhcnRvY2RuLmNvbS9kYXJrX2FsbC97en0ve3h9L3t5fS5wbmc=', 'aHR0cHM6Ly9zZXJ2ZXIuYXJjZ2lzb25saW5lLmNvbS9BcmNHSVMvcmVzdC9zZXJ2aWNlcy9Xb3JsZF9JbWFnZXJ5L01hcFNlcnZlci90aWxlL3t6fS97eX0ve3h9', 'aHR0cHM6Ly9ub21pbmF0aW0ub3BlbnN0cmVldG1hcC5vcmcvc2VhcmNo'];

const _0x1f3c = (index) => {
    try {
        return atob(_0x4a2b[index]);
    } catch (e) {
        return '';
    }
};

export const getTileUrl = (theme) => {
    const urls = {
        light: _0x1f3c(0),
        dark: _0x1f3c(1),
        satellite: _0x1f3c(2)
    };
    return urls[theme] || urls.light;
};

export const getGeocodingUrl = () => _0x1f3c(3);

// Additional obfuscation layer
const _0x5d8e = {
    a: 'format',
    b: 'json',
    c: 'q'
};

export const buildSearchUrl = (query) => {
    const base = getGeocodingUrl();
    return `${base}?${_0x5d8e.a}=${_0x5d8e.b}&${_0x5d8e.c}=${encodeURIComponent(query)}`;
};
